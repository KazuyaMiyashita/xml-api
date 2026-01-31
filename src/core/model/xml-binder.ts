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

  public calcSetAttributePatch(
    model: ModelElement,
    key: string,
    value: string,
  ): { start: number; end: number; text: string } | null {
    if (!model.cst) return null;

    const structural = model.cst.unwrap();
    let tagNode: CST | null = null;

    // Identify tag node (STag or EmptyElemTag)
    // Case 1: element ::= STag content ETag
    if (structural.children.length === 3 && structural.children[0].name === "STag") {
      tagNode = structural.children[0];
    }
    // Case 2: element ::= EmptyElemTag
    else if (structural.name === "EmptyElemTag") {
      tagNode = structural;
    }
    // Case 3: Wrapper or other structure (try to find tag in children)
    else {
        for (const child of structural.children) {
            if (child.name === "STag" || child.name === "EmptyElemTag") {
                tagNode = child;
                break;
            }
        }
        // If structural is strictly EmptyElemTag but unwrap failed to show name? (Unlikely)
        if (!tagNode && structural.children.length >= 2 && structural.children[0].getText(this.input) === "<") {
             // Fallback: assume it matches EmptyElemTag structure directly
             tagNode = structural;
        }
    }

    if (!tagNode) return null;

    const tagStructural = tagNode.unwrap();
    // Expected structure: < Name (S Attribute)* S? >  (Length 5)
    
    // Robust access to attributes
    // Index 2 is rep(seq(S, Attribute))
    const attrRep = tagStructural.children[2];

    if (attrRep && attrRep.type === "repeat") {
      for (const seqNode of attrRep.children) {
        // seq(S, Attribute)
        const attrNode = seqNode.children[1];
        if (attrNode && attrNode.name === "Attribute") {
          const attrStructural = attrNode.unwrap();
          const nameNode = attrStructural.children[0];
          const attrName = nameNode.getText(this.input);

          if (attrName === key) {
            // Found existing attribute
            const attValueNode = attrStructural.children[2];
            const oldText = attValueNode.getText(this.input);
            const quote = oldText[0];
            // Preserve quote style if possible
            const newQuote = (quote === "'" || quote === '"') ? quote : '"';
            
            return {
              start: attValueNode.start,
              end: attValueNode.end,
              text: `${newQuote}${value}${newQuote}`,
            };
          }
        }
      }
    }

    // Attribute not found, insert new one.
    // Insert before the closing sequence (S? > or S? />)
    // The closing sequence starts after the attributes.
    // We can insert at the end of attrRep?
    // Or just look at the end of the tag and back up.
    
    const len = tagStructural.children.length;
    const closing = tagStructural.children[len - 1]; // > or />
    const optS = tagStructural.children[len - 2]; // S?

    // Insert before closing bracket.
    // If optS is present (has children or length > 0), we can insert before or after it?
    // If we insert ` id="val"`, we provide the space.
    // So inserting at `closing.start` is safe.
    
    // Special case: If EmptyElemTag ends with `/>` (start is 2 chars before end).
    // closing.start points to `/`.
    
    return {
      start: closing.start,
      end: closing.start,
      text: ` ${key}="${value}"`,
    };
  }

  public calcUpdateTextPatch(
    model: ModelElement,
    text: string,
  ): { start: number; end: number; text: string } | null {
    if (!model.cst) return null;

    const structural = model.cst.unwrap();

    // Case 1: Sequence [STag, content, ETag]
    if (
      structural.children.length === 3 &&
      structural.children[0].name === "STag"
    ) {
      const contentNode = structural.children[1];
      return {
        start: contentNode.start,
        end: contentNode.end,
        text: text, // Should we escape? Yes, ideally. For now raw.
      };
    }

    // Case 2: EmptyElemTag
    // <Name ... /> -> <Name ... >text</Name>
    // We need to find "/>" at the end and replace it with ">text</Name>"
    if (structural.name === "EmptyElemTag" || (structural.children.length >= 2 && structural.children[0].getText(this.input) === "<")) {
        const len = structural.children.length;
        const closing = structural.children[len - 1]; // "/>"
        
        if (closing.getText(this.input) === "/>") {
            return {
                start: closing.start,
                end: closing.end,
                text: `>${text}</${model.tagName}>`
            };
        }
    }

    return null;
  }

  public calcReplaceNodePatch(
    model: ModelNode,
    newXml: string,
  ): { start: number; end: number; text: string } | null {
    if (!model.cst) return null;

    // Direct replacement of the CST range
    return {
      start: model.cst.start,
      end: model.cst.end,
      text: newXml,
    };
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