import { Grammar, Node, Context } from './parser';

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

function validateElementTypeMatch(node: Node, ctx: Context): boolean {
    // Check for EmptyElemTag (self-closing)
    if (node.type === 'EmptyElemTag') {
        return true;
    }
    
    // Check for Element Sequence [STag, content, ETag]
    if (node.children.length === 3 && node.children[0].type === 'STag' && node.children[2].type === 'ETag') {
        const stag = node.children[0];
        const etag = node.children[2];
        const input = ctx.input;
        
        const startName = stag.children[1].getText(input);
        const endName = etag.children[1].getText(input);

        return startName === endName;
    }
    
    // If this point is reached, the validator's structure assumption is wrong
    throw new Error("Validation error: unexpected node structure in validateElementTypeMatch");
}

// element: EmptyElemTag | STag content ETag
// Use wellFormedRule to attach validation
g.wellFormedRule("element", 
    g.alt(
        g.ref("EmptyElemTag"), 
        g.seq(g.ref("STag"), g.ref("content"), g.ref("ETag"))
    ),
    validateElementTypeMatch
);

// document ::= element
g.rule("document", g.ref("element"));

export { g };
