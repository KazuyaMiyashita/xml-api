import {
  GrammarBuilder,
  lit,
  reg,
  seq,
  alt,
  rep,
  plus,
  opt,
  ref,
} from "./grammar";
import { CST } from "./xml-cst";

const g = new GrammarBuilder();

const SQ = "\x27";
const DQ = "\x22";

g.rule("Name", plus(reg("[a-zA-Z0-9]")));
g.rule("CharData", plus(reg("[^<]")));
g.rule("S", plus(reg("[ \t\r\n]")));
g.rule("Eq", seq(opt(ref("S")), lit("="), opt(ref("S"))));

g.rule(
  "AttValue",
  alt(
    seq(lit(DQ), rep(reg("[^\x22]")), lit(DQ)),
    seq(lit(SQ), rep(reg("[^\x27]")), lit(SQ)),
  ),
);

g.rule("Attribute", seq(ref("Name"), ref("Eq"), ref("AttValue")));

g.rule(
  "EmptyElemTag",
  seq(
    lit("<"),
    ref("Name"),
    rep(seq(ref("S"), ref("Attribute"))),
    opt(ref("S")),
    lit("/>"),
  ),
);

g.rule(
  "STag",
  seq(
    lit("<"),
    ref("Name"),
    rep(seq(ref("S"), ref("Attribute"))),
    opt(ref("S")),
    lit(">"),
  ),
);

g.rule("ETag", seq(lit("</"), ref("Name"), opt(ref("S")), lit(">")));

g.rule("content", rep(alt(ref("element"), ref("CharData"))));

function validateElementTypeMatch(node: CST, input: string): boolean {
  const structuralNode = node.unwrap();
  if (
    structuralNode.children.length >= 2 &&
    structuralNode.children[0].type === "literal"
  ) {
    return true;
  }
  if (
    structuralNode.children.length === 3 &&
    structuralNode.children[0].name === "STag" &&
    structuralNode.children[2].name === "ETag"
  ) {
    const stag = structuralNode.children[0];
    const etag = structuralNode.children[2];
    const startName = stag.unwrap().children[1].getText(input);
    const endName = etag.unwrap().children[1].getText(input);
    return startName === endName;
  }
  return false;
}

g.rule(
  "element",
  alt(ref("EmptyElemTag"), seq(ref("STag"), ref("content"), ref("ETag"))),
);

g.verifyRule("element", validateElementTypeMatch);
g.rule("document", ref("element"));

export const grammar = g.build("document");
