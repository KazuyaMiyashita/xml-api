import { CST } from "../cst/xml-cst";
import { AST } from "../ast/xml-ast";
import {
  ModelNode,
  ModelElement,
  ModelText,
  ModelNodeType,
} from "./xml-api-model";

export class XMLBinder {
  constructor(private input: string) {}

  public isHydratable(name: string | undefined): boolean {
    if (!name) return false;
    return ["element", "document", "CharData", "Reference", "CharRef", "EntityRef", "CDSect"].includes(name);
  }

  public hydrate(node: CST): ModelNode | null {
    let result: ModelNode | null = null;

    // 1. Handle known rule names
    if (node.name === "CharData") {
      result = new ModelText(node.getText(this.input));
    } else if (node.name === "Reference") {
      const text = node.getText(this.input);
      if (text.startsWith("&#")) {
        result = new ModelText(decodeCharRef(node, this.input));
      } else {
        result = new ModelText(text);
      }
    } else if (node.name === "CharRef") {
      result = new ModelText(decodeCharRef(node, this.input));
    } else if (node.name === "EntityRef") {
      result = new ModelText(node.getText(this.input));
    } else if (node.name === "CDSect") {
      const structural = node.unwrap();
      if (structural.children.length === 3) {
        result = new ModelText(structural.children[1].getText(this.input));
      } else {
        result = new ModelText("");
      }
    } else if (node.name === "PI" || node.name === "Comment") {
      result = null;
    } else if (node.name === "element" || node.name === "document") {
      const structural = node.unwrap();

      // document rule: seq(prolog, element, Misc*)
      if (
        node.name === "document" &&
        structural.type === "sequence" &&
        structural.children.length >= 2
      ) {
        const elementNode = structural.children[1];
        result = this.hydrate(elementNode);
      } else if (
        structural.children.length === 3 &&
        structural.children[0].name === "STag"
      ) {
        // Case 1: Sequence [STag, content, ETag]
        const stag = structural.children[0];
        const content = structural.children[1];

        const elem = this.parseTag(stag);
        // elem.cst will be set at the end
        
        const contentStructural = content.unwrap();
        // content rule: seq(opt(CharData), rep(seq(alt(...), opt(CharData))))

        // Initial CharData
        const initialCharDataRep = contentStructural.children[0];
        if (initialCharDataRep && initialCharDataRep.children.length > 0) {
          const textNode = this.hydrate(initialCharDataRep.children[0]);
          if (textNode) elem.addChild(textNode);
        }

        // Repeating part
        const repeatingPart = contentStructural.children[1];
        if (repeatingPart) {
          for (const seqNode of repeatingPart.children) {
            // seq(alt(...), opt(CharData))
            const choiceNode = seqNode.children[0];
            const converted = this.hydrate(choiceNode);
            if (converted) {
              elem.addChild(converted);
            }

            const trailingCharDataRep = seqNode.children[1];
            if (
              trailingCharDataRep &&
              trailingCharDataRep.children.length > 0
            ) {
              const textNode = this.hydrate(trailingCharDataRep.children[0]);
              if (textNode) elem.addChild(textNode);
            }
          }
        }
        result = elem;
      } else if (
        structural.children.length >= 2 &&
        structural.children[0].type === "literal" &&
        structural.children[0].getText(this.input) === "<"
      ) {
        // Case 2: EmptyElemTag
        result = this.parseTag(node);
      } else if (structural !== node) {
        // Wrapper check
        result = this.hydrate(structural);
      }
    } else if (node.type === "regex" || node.type === "literal") {
      // 2. Handle structural nodes (literals/regex)
      result = new ModelText(node.getText(this.input));
    } else if (
      node.children.length === 1 &&
      node.children[0].start === node.start &&
      node.children[0].end === node.end
    ) {
      // 3. Fallback wrapper unwrap
      result = this.hydrate(node.children[0]);
    }

    if (result) {
      // If we are unwrapping (recursive hydrate call), the inner call might have already set CST.
      // But usually we want the "highest" CST node to point to this Model node?
      // Or the "inner" one?
      // If 'document' wraps 'element', 'hydrate(document)' calls 'hydrate(element)'.
      // 'hydrate(element)' returns a ModelElement with cst=element.
      // 'hydrate(document)' returns that same ModelElement.
      // Should we update its cst to 'document'?
      // Probably not, because 'document' is just a wrapper.
      // BUT, incremental update might target 'document'.
      // If we update 'document' CST, we want to find the ModelElement.
      // If ModelElement.cst is 'element', we won't match 'document'.
      
      // However, usually we traverse UP to find a named rule.
      // 'element' is a named rule.
      
      // Let's set CST only if not set? Or overwrite?
      // For 'element', we want 'element' CST.
      // For 'CharData', we want 'CharData' CST.
      
      // In the case of recursion (unwrap), we reuse the result.
      // If we overwrite `cst`, we might point to the wrapper.
      // If `node` is `document`, and result is `element`, 
      // result.cst is `element` CST.
      // If we change it to `document` CST, then `element` CST is lost.
      // `findModelNodePath` checks equality.
      
      // Maybe we shouldn't overwrite if it's a wrapper return.
      if (!result.cst) {
        result.cst = node;
      }
      // Actually, specifically for new nodes created HERE, we set CST.
      // The recursive calls return nodes that presumably have CST set.
    }
    
    return result;
  }

  public project(model: ModelNode): AST | string {
    if (model.getType() === ModelNodeType.Text) {
      return (model as ModelText).text;
    }

    const el = model as ModelElement;
    const ast = new AST(el.tagName);
    
    // Copy attributes
    for (const [key, value] of el.attributes) {
      ast.attributes[key] = value;
    }

    // Recursively project children
    for (const child of el.children) {
      ast.children.push(this.project(child));
    }

    // Link CST if available (for mapping)
    ast.cst = el.cst;

    return ast;
  }

  private parseTag(node: CST): ModelElement {
    const structural = node.unwrap();
    const nameNode = structural.children[1];
    const tagName = nameNode.getText(this.input);

    const elem = new ModelElement(tagName);

    const attrRep = structural.children[2]; // rep(seq(S, Attribute))

    for (const seq of attrRep.children) {
      const attrNode = seq.children[1]; // Attribute
      const attrStructural = attrNode.unwrap();
      const attrName = attrStructural.children[0].getText(this.input);
      const attValueNode = attrStructural.children[2];
      const attValueStructural = attValueNode.unwrap();

      const valRep = attValueStructural.children[1];
      let valText = "";

      for (const chunk of valRep.children) {
        // Use hydrate to get text nodes from value chunks, or just getText?
        // convert() recursively called convert, which returned AST|string.
        // For attribute values, we expect string.
        // Since hydrate returns ModelNode, we need to extract text.
        // But attribute values might be complex? In current grammar, they are mostly text/refs.
        const modelNode = this.hydrate(chunk);
        if (modelNode instanceof ModelText) {
          valText += modelNode.text;
        } else if (modelNode) {
          // Fallback if somehow it returned an Element (unlikely in AttValue)
           // But wait, hydrate returns ModelNode.
           // If it's a reference, it returns ModelText.
           // If it's a literal/regex, it returns ModelText.
           // So this should be fine.
           // However, if hydrate returns null, we skip.
        }
      }

      elem.setAttribute(attrName, valText);
    }

    return elem;
  }
}

function decodeCharRef(node: CST, input: string): string {
  const text = node.getText(input);
  let code: number;
  if (text.startsWith("&#x")) {
    code = parseInt(text.slice(3, -1), 16);
  } else {
    code = parseInt(text.slice(2, -1), 10);
  }
  return String.fromCodePoint(code);
}

// Keep backward compatibility for tests that use convert() directly?
// Or we should update them.
// The task is "Implement src/core/model/xml-binder.ts". 
// I am replacing it. Tests will break. I will fix tests.
export function convert(node: CST, input: string): AST | string | null {
    const binder = new XMLBinder(input);
    const model = binder.hydrate(node);
    if (!model) return null;
    return binder.project(model);
}