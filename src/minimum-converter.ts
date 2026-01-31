import { CST } from "./xml-cst";
import { AST } from "./xml-ast";

export function convert(node: CST, input: string): AST | string {
  const structural = node.unwrap();

  // 1. Handle known rule names
  if (node.name === "CharData") {
    return node.getText(input);
  }

  if (node.name === "element" || node.name === "document") {
    let cstNode = node;
    if (node.name === "document" && node.children.length === 1) {
      cstNode = node.children[0];
    }

    // Find the actual element structure (either EmptyElemTag or STag sequence)
    let elementStructure = structural;
    if (
      elementStructure.name === "element" ||
      elementStructure.name === "document"
    ) {
      elementStructure = elementStructure.unwrap();
    }

    // Case 1: Sequence [STag, content, ETag]
    if (
      elementStructure.children.length === 3 &&
      elementStructure.children[0].name === "STag"
    ) {
      const stag = elementStructure.children[0];
      const content = elementStructure.children[1];

      const elem = parseTag(stag, input);
      elem.cst = cstNode;

      // Process content
      const contentNodes = convertContent(content, input);
      for (const child of contentNodes) {
        if (elem instanceof AST) {
          elem.children.push(child);
        }
      }
      return elem;
    }

    // Case 2: EmptyElemTag
    if (
      elementStructure.name === "EmptyElemTag" ||
      (elementStructure.children.length >= 2 &&
        elementStructure.children[0].type === "literal" &&
        elementStructure.children[0].getText(input) === "<")
    ) {
      const elem = parseTag(elementStructure, input);
      elem.cst = cstNode;
      return elem;
    }
  }

  // 2. Handle structural nodes
  if (node.type === "regex" || node.type === "literal") {
    return node.getText(input);
  }

  // 3. Fallback for other named nodes or wrappers
  if (node.children.length === 1) {
    return convert(node.children[0], input);
  }

  throw new Error(
    `Unknown node type or structure: ${node.name || node.type} at ${node.start}`,
  );
}

function convertContent(node: CST, input: string): (AST | string)[] {
  const structural = node.unwrap();
  if (structural.type === "repeat") {
    return structural.children.map((child) => convert(child, input)) as (
      | AST
      | string
    )[];
  }
  const result = convert(node, input);
  return typeof result === "string" || result instanceof AST ? [result] : [];
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
      valText += convert(chunk, input);
    }

    attributes[attrName] = valText;
  }

  return new AST(tagName, attributes);
}
