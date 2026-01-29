import { Grammar } from './parser';

const g = new Grammar();

// Name: Simple alphanumeric string for simplicity
g.rule("Name", g.plus(g.reg("[a-zA-Z0-9]")));

// CharData: Anything except '<'
g.rule("CharData", g.plus(g.reg("[^<]")));

// EmptyElemTag: <Name /> or <Name/>. Simplified: no attributes.
g.rule("EmptyElemTag", g.seq(g.lit("<"), g.ref("Name"), g.opt(g.lit(" ")), g.lit("/>")));

// STag: <Name>.
g.rule("STag", g.seq(g.lit("<"), g.ref("Name"), g.lit(">")));

// ETag: </Name>.
g.rule("ETag", g.seq(g.lit("</"), g.ref("Name"), g.lit(">")));

// content: (element | CharData)*
g.rule("content", g.rep(g.alt(g.ref("element"), g.ref("CharData"))));

// element: EmptyElemTag | STag content ETag
g.rule("element", g.alt(
    g.ref("EmptyElemTag"),
    g.seq(g.ref("STag"), g.ref("content"), g.ref("ETag"))
));

// document ::= element
g.rule("document", g.ref("element"));

export { g };
