import { CST } from "../cst/xml-cst";
import { AST } from "../ast/xml-ast";

export function convert(node: CST, input: string): AST | string | null {
  // 1. Handle known rule names
  if (node.name === "CharData") {
    return node.getText(input);
  }

  if (node.name === "Reference") {
    const text = node.getText(input);
    if (text.startsWith("&#")) {
      return decodeCharRef(node, input);
    }
    return text;
  }

  if (node.name === "CharRef") {
    return decodeCharRef(node, input);
  }
  if (node.name === "EntityRef") {
    return node.getText(input);
  }

  if (node.name === "CDSect") {
    const structural = node.unwrap();
    if (structural.children.length === 3) {
      return structural.children[1].getText(input);
    }
    return "";
  }

  if (node.name === "PI" || node.name === "Comment") {
    return null;
  }

  if (node.name === "element" || node.name === "document") {
    const structural = node.unwrap();

    // document rule: seq(prolog, element, Misc*)
    // structural.children[1] corresponds to the 'element' rule (the root element).
    if (
      node.name === "document" &&
      structural.type === "sequence" &&
      structural.children.length >= 2
    ) {
      const elementNode = structural.children[1];
      return convert(elementNode, input);
    }

    // Case 1: Sequence [STag, content, ETag]
    // Corresponds to rule: element ::= STag content ETag
    if (
      structural.children.length === 3 &&
      structural.children[0].name === "STag"
    ) {
      const stag = structural.children[0];
      const content = structural.children[1];

      const elem = parseTag(stag, input);
      elem.cst = node;
      const contentStructural = content.unwrap();

      // content rule: seq(opt(CharData), rep(seq(alt(...), opt(CharData))))
      const initialCharDataRep = contentStructural.children[0];
      if (initialCharDataRep && initialCharDataRep.children.length > 0) {
        elem.children.push(
          convert(initialCharDataRep.children[0], input) as string,
        );
      }

      const repeatingPart = contentStructural.children[1];
      if (repeatingPart) {
        for (const seqNode of repeatingPart.children) {
          const choiceNode = seqNode.children[0];
          const converted = convert(choiceNode, input);
          if (converted !== null) {
            elem.children.push(converted);
          }

          const trailingCharDataRep = seqNode.children[1];
          if (trailingCharDataRep && trailingCharDataRep.children.length > 0) {
            elem.children.push(
              convert(trailingCharDataRep.children[0], input) as string,
            );
          }
        }
      }
      return elem;
    }

    // Case 2: EmptyElemTag
    if (
      structural.children.length >= 2 &&
      structural.children[0].type === "literal" &&
      structural.children[0].getText(input) === "<"
    ) {
      const elem = parseTag(node, input);
      elem.cst = node;
      return elem;
    }

    // If it's just a wrapper
    if (structural !== node) {
      return convert(structural, input);
    }
  }

  // 2. Handle structural nodes
  if (node.type === "regex" || node.type === "literal") {
    return node.getText(input);
  }

  // 3. Fallback: if it's a wrapper, unwrap and try again
  if (
    node.children.length === 1 &&
    node.children[0].start === node.start &&
    node.children[0].end === node.end
  ) {
    return convert(node.children[0], input);
  }

  return null;
}

function parseTag(node: CST, input: string): AST {
  const structural = node.unwrap();
  const nameNode = structural.children[1];
  const tagName = nameNode.getText(input);

  const attributes: { [key: string]: string } = {};
  const attrRep = structural.children[2]; // rep(seq(S, Attribute))

  for (const seq of attrRep.children) {
    const attrNode = seq.children[1]; // Attribute
    const attrStructural = attrNode.unwrap();
    const attrName = attrStructural.children[0].getText(input);
    const attValueNode = attrStructural.children[2];
    const attValueStructural = attValueNode.unwrap();

    const valRep = attValueStructural.children[1];
    let valText = "";

    for (const chunk of valRep.children) {
      valText += convert(chunk, input) || "";
    }

    attributes[attrName] = valText;
  }

  return new AST(tagName, attributes);
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
