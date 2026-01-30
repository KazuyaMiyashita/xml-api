import { CST } from './xml-cst';
import { AST } from './xml-ast';

export function convert(node: CST, input: string): AST | string | null {
    if (node.type === 'CharData') {
        return node.getText(input);
    }

    if (node.type === 'Reference') {
        // Reference rule: alt(EntityRef, CharRef)
        // Due to parser implementation, Reference node wraps the children of the result.
        // We distinguish based on content.
        const text = node.getText(input);
        if (text.startsWith("&#")) {
            return decodeCharRef(node, input);
        }
        // EntityRef or other
        return text;
    }
    
    // Direct matches if parsed individually or if rules are structured differently
    if (node.type === 'CharRef') {
        return decodeCharRef(node, input);
    }
    if (node.type === 'EntityRef') {
        return node.getText(input);
    }

    if (node.type === 'CDSect') {
        // CDSect ::= CDStart CData CDEnd
        // CDStart: <![CDATA[
        // CData: content
        // CDEnd: ]]>
        if (node.children.length === 3) {
            // CData is at index 1
            return node.children[1].getText(input);
        }
        return "";
    }

    if (node.type === 'PI' || node.type === 'Comment') {
        // Skip PI and Comment for High-Level AST
        return null;
    }
    
    if (node.type === 'element' || node.type === 'document') {
        let target = node;
        
        // If document, unwrap to element
        if (target.type === 'document') {
             // document rule: seq(prolog, element, rep(Misc))
             // element is at index 1.
             if (target.children.length >= 2) {
                 target = target.children[1];
             }
        }
        
        // target is now 'element' node (Reference).
        // Children are either from EmptyElemTag or Sequence.
        
        // Case 1: Sequence [STag, content, ETag]
        // STag is a Reference, so it produces a CST("STag").
        if (target.children.length === 3 && target.children[0].type === 'STag') {
            const stag = target.children[0];
            const content = target.children[1];
            
            const elem = parseTag(stag, input);
            
            // Process content
            // content rule: seq(opt(CharData), rep(seq(alt(element, Ref, CDSect, PI, Comment), opt(CharData))))
            
            // children[0]: opt(CharData) -> Repeat node
            const initialCharDataRep = content.children[0];
            if (initialCharDataRep && initialCharDataRep.children.length > 0) {
                 const text = initialCharDataRep.children[0].getText(input);
                 if (elem instanceof AST) {
                     elem.children.push(text);
                 }
            }

            // children[1]: rep(...) -> Repeat node
            const repeatingPart = content.children[1];
            if (repeatingPart) {
                for (const seqNode of repeatingPart.children) {
                    // seqNode children: [Choice(element|Ref|...), opt(CharData)]
                    
                    const choiceNode = seqNode.children[0];
                    const converted = convert(choiceNode, input);
                    if (converted !== null) {
                        if (elem instanceof AST) {
                            elem.children.push(converted);
                        }
                    }
                    
                    const trailingCharDataRep = seqNode.children[1];
                    if (trailingCharDataRep && trailingCharDataRep.children.length > 0) {
                         const text = trailingCharDataRep.children[0].getText(input);
                         if (elem instanceof AST) {
                             elem.children.push(text);
                         }
                    }
                }
            }
            return elem;
        }
        
        // Case 2: EmptyElemTag
        // EmptyElemTag rule: seq("<", Name, rep(seq(S, Attribute)), opt(S), "/>")
        // Children will be [Literal("<"), Reference("Name"), ...]
        if (target.children.length >= 2 && 
            target.children[0].type === 'literal' && 
            target.children[0].getText(input) === '<') {
             return parseTag(target, input);
        }
    }

    return null;
}

function parseTag(node: CST, input: string): AST {
    // Expects STag or EmptyElemTag node
    // STag: '<' Name (S Attribute)* S? '>'
    // EmptyElemTag: '<' Name (S Attribute)* S? '/>'
    
    // children:
    // 0: "<"
    // 1: Name
    // 2: rep(seq(S, Attribute))
    // ...
    
    const nameNode = node.children[1];
    const tagName = nameNode.getText(input);
    
    const attributes: { [key: string]: string } = {};
    const attrRep = node.children[2]; // rep(seq(S, Attribute))
    
    for (const seq of attrRep.children) {
        // seq children: [S, Attribute]
        const attrNode = seq.children[1]; // Attribute
        
        // Attribute rule: Name Eq AttValue
        // children: [Name, Eq, AttValue]
        const attrName = attrNode.children[0].getText(input);
        const attValueNode = attrNode.children[2];
        
        // AttValue rule: 
        // alt(
        //   seq(DQ, rep(alt(reg, PERef, Ref)), DQ),
        //   seq(SQ, rep(alt(reg, PERef, Ref)), SQ)
        // )
        
        // attValueNode children: [DQ/SQ, repNode, DQ/SQ]
        const valRep = attValueNode.children[1];
        let valText = "";
        
        for (const chunk of valRep.children) {
            // chunk is result of alt(...)
            // can be regex match (text), PEReference, or Reference
            if (chunk.type === 'Reference' || chunk.type === 'PEReference') {
                // Keep raw text for references in attributes for now
                 valText += chunk.getText(input);
            } else {
                 valText += chunk.getText(input);
            }
        }
        
        attributes[attrName] = valText;
    }
    
    return new AST(tagName, attributes);
}

function decodeCharRef(node: CST, input: string): string {
    const text = node.getText(input); // e.g., "&#65;" or "&#x41;"
    let code: number;
    if (text.startsWith("&#x")) {
        code = parseInt(text.slice(3, -1), 16);
    } else {
        code = parseInt(text.slice(2, -1), 10);
    }
    return String.fromCodePoint(code);
}