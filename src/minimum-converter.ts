import { CST } from './parser';
import { AST } from './xml-ast';

export function convert(node: CST, input: string): AST | string {
    if (node.type === 'CharData') {
        return node.getText(input);
    }
    
    if (node.type === 'element' || node.type === 'document') {
        // node is a Reference node.
        // It wraps the result of the rule execution.
        // For 'element', it matches either EmptyElemTag or Sequence.
        // In both cases, the 'children' of the element CST are the children of the matching production.
        
        // Case 1: Sequence [STag, content, ETag]
        if (node.children.length === 3 && node.children[0].type === 'STag') {
            const stag = node.children[0];
            const content = node.children[1];
            
            const elem = parseTag(stag, input);
            
            // Process content
            // content rule: rep(alt(element, CharData))
            // content node children are the results of each repetition.
            for (const child of content.children) {
                const converted = convert(child, input);
                if (elem instanceof AST) {
                    elem.children.push(converted);
                }
            }
            return elem;
        }
        
        // Case 2: EmptyElemTag (or structure resembling it)
        // Structure: ["<", Name, rep(attr), opt(S), "/>"]
        // children[0] is literal "<"
        if (node.children.length >= 2 && 
            node.children[0].type === 'literal' && 
            node.children[0].getText(input) === '<') {
             return parseTag(node, input);
        }
    }
    
    throw new Error(`Unknown node type or structure: ${node.type}`);
}

function parseTag(node: CST, input: string): AST {
    // Expects STag or EmptyElemTag node
    // Structure: ["<", Name, rep(seq(S, Attribute)), opt(S), ">" or "/>"]
    
    const nameNode = node.children[1];
    const tagName = nameNode.getText(input);
    
    const attributes: { [key: string]: string } = {};
    const attrRep = node.children[2]; // rep(seq(S, Attribute))
    
    for (const seq of attrRep.children) {
        // seq children: [S, Attribute]
        const attrNode = seq.children[1]; // Attribute
        // Attribute children: [Name, Eq, AttValue]
        const attrName = attrNode.children[0].getText(input);
        const attValueNode = attrNode.children[2];
        
        // AttValue children: ['"', content, '"'] or ["'", content, "'"]
        // We want the content.
        // The content is a repeat of reg match.
        // AttValue definition: seq(lit, rep(...), lit)
        // children[1] is the rep node.
        
        // Wait, parser.ts Sequence puts all children.
        // AttValue -> [lit, rep, lit]
        const valRep = attValueNode.children[1];
        let valText = "";
        for (const chunk of valRep.children) {
            valText += chunk.getText(input);
        }
        
        attributes[attrName] = valText;
    }
    
    return new AST(tagName, attributes);
}