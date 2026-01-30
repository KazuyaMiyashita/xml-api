import { GrammarBuilder, lit, reg, seq, alt, rep, plus, opt, exc, ref } from './grammar';
import { CST } from './xml-cst';

const g = new GrammarBuilder();

const SQ = "\u0027"; // Single Quote '
const DQ = "\u0022"; // Double Quote "

// [1] document ::= prolog element Misc*
//
// Summary:
// - Single Root Element: There is exactly one root element that contains all other elements within the document.
// - Proper Nesting: All elements must be correctly nested, with start and end tags forming non-overlapping, paired structures.
// - Clear Parent-Child Hierarchy: Every non-root element has exactly one parent, creating a well-defined tree structure.
//
// cf: https://www.w3.org/TR/xml/#NT-document
g.rule("document", seq(ref("prolog"), ref("element"), rep(ref("Misc"))));

// [2] Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
// 
// any Unicode character, excluding the surrogate blocks, FFFE, and FFFF.
// 
// cf: https://www.w3.org/TR/xml/#NT-Char 
g.rule("Char", reg("\t|\n|\r|[\u0020-\uD7FF]|[\uE000-\uFFFD]|[\uD800-\uDBFF][\uDC00-\uDFFF]"));

// [3] S ::= (#x20 | #x9 | #xD | #xA)+
// cf: https://www.w3.org/TR/xml/#NT-S 
g.rule("S", plus(reg("[\x20\t\r\n]")));

// [4] NameStartChar ::= ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
// cf: https://www.w3.org/TR/xml/#NT-NameStartChar 
g.rule("NameStartChar", alt(
    lit(":"), reg("[A-Z]"), lit("_"), reg("[a-z]"),
    reg("[\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]"),
    reg("[\uD800-\uDB7F][\uDC00-\uDFFF]")
));

// [4a] NameChar ::= NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
// cf: https://www.w3.org/TR/xml/#NT-NameChar 
g.rule("NameChar", alt(
    ref("NameStartChar"), lit("-"), lit("."), reg("[0-9]"), lit("\u00B7"),
    reg("[\u0300-\u036F\u203F-\u2040]")
));

// [5] Name ::= NameStartChar (NameChar)*
// cf: https://www.w3.org/TR/xml/#NT-Name 
g.rule("Name", seq(ref("NameStartChar"), rep(ref("NameChar"))));

// [6] Names ::= Name (#x20 Name)*
// cf: https://www.w3.org/TR/xml/#NT-Names 
g.rule("Names", seq(ref("Name"), rep(seq(lit("\x20"), ref("Name")))));

// [7] Nmtoken ::= (NameChar)+
// cf: https://www.w3.org/TR/xml/#NT-Nmtoken 
g.rule("Nmtoken", plus(ref("NameChar")));

// [8] Nmtokens ::= Nmtoken (#x20 Nmtoken)*
// cf: https://www.w3.org/TR/xml/#NT-Nmtokens 
g.rule("Nmtokens", seq(ref("Nmtoken"), rep(seq(lit(" "), ref("Nmtoken")))));

// [9] EntityValue ::= '"' ([^%&"] | PEReference | Reference)* '"' |  "'" ([^%&'] | PEReference | Reference)* "'"
// cf: https://www.w3.org/TR/xml/#NT-EntityValue 
g.rule("EntityValue", alt(
    seq(lit(DQ), rep(alt(reg("[^%&\\x22]"), ref("PEReference"), ref("Reference"))), lit(DQ)),
    seq(lit(SQ), rep(alt(reg("[^%&\\x27]"), ref("PEReference"), ref("Reference"))), lit(SQ))
));

// [10] AttValue ::= '"' ([^<&"] | Reference)* '"' |  "'" ([^<&'] | Reference)* "'"
// cf: https://www.w3.org/TR/xml/#NT-AttValue 
g.rule("AttValue", alt(
    seq(lit(DQ), rep(alt(reg("[^<&\\x22]"), ref("Reference"))), lit(DQ)),
    seq(lit(SQ), rep(alt(reg("[^<&\\x27]"), ref("Reference"))), lit(SQ))
));

// [11] SystemLiteral ::= ('"' [^\"]* "'") | ("'" [^']* "'")
// cf: https://www.w3.org/TR/xml/#NT-SystemLiteral 
g.rule("SystemLiteral", alt(
    seq(lit(DQ), reg("[^\\x22]*"), lit(DQ)),
    seq(lit(SQ), reg("[^\\x27]*"), lit(SQ))
));

// [12] PubidLiteral ::= '"' PubidChar* '"' | "'" (PubidChar - "'")* "'"
// cf: https://www.w3.org/TR/xml/#NT-PubidLiteral 
g.rule("PubidLiteral", alt(
    seq(lit(DQ), rep(ref("PubidChar")), lit(DQ)),
    seq(lit(SQ), rep(exc(ref("PubidChar"), lit(SQ))), lit(SQ))
));

// [13] PubidChar ::= #x20 | #xD | #xA | [a-zA-Z0-9] | [-'()+,./:=?;!*#@$_%]
// cf: https://www.w3.org/TR/xml/#NT-PubidChar 
g.rule("PubidChar", reg("[\\x20\\r\\na-zA-Z0-9\-&#039;()+,./:=?;!*#@$_%]" ));

// [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
// cf: https://www.w3.org/TR/xml/#NT-CharData 
g.rule("CharData", rep(exc(reg('[^<&]'), lit("]]\x3E"))));

// [15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
// cf: https://www.w3.org/TR/xml/#NT-Comment 
g.rule("Comment", seq(
    lit("<!--"),
    rep(
        alt(
            exc(ref("Char"), lit("-")),
            seq(lit("-"), exc(ref("Char"), lit("-")))
        )
    ),
    lit("-->")
));

// [16] PI ::= '<?' PITarget (S (Char* - (Char* '?>' Char*)))? '?>'
// cf: https://www.w3.org/TR/xml/#NT-PI 
g.rule("PI", seq(
    lit("<?"),
    ref("PITarget"),
    opt(
        seq(
            ref("S"),
            rep(
                exc(ref("Char"), lit("?>"))
            )
        )
    ),
    lit("?>")
));

// [17] PITarget ::= Name - ((('X' | 'x') ('M' | 'm') ('L' | 'l')))
// cf: https://www.w3.org/TR/xml/#NT-PITarget 
g.rule("PITarget", exc(ref("Name"), reg("([Xx][Mm][Ll])")));

// [18] CDSect ::= CDStart CData CDEnd
// cf: https://www.w3.org/TR/xml/#NT-CDSect 
g.rule("CDSect", seq(ref("CDStart"), ref("CData"), ref("CDEnd")));

// [19] CDStart ::= '<![CDATA['
// cf: https://www.w3.org/TR/xml/#NT-CDStart 
g.rule("CDStart", lit("<![CDATA["));

// [20] CData ::= (Char* - (Char* ']]>' Char*))
// cf: https://www.w3.org/TR/xml/#NT-CData 
g.rule("CData", rep(exc(ref("Char"), lit("]]\x3E"))));

// [21] CDEnd ::= ']]>'
// cf: https://www.w3.org/TR/xml/#NT-CDEnd 
g.rule("CDEnd", lit("]]\x3E"));

// [22] prolog ::= XMLDecl? Misc* (doctypedecl Misc*)?
// cf: https://www.w3.org/TR/xml/#NT-prolog 
g.rule("prolog", seq(opt(ref("XMLDecl")), rep(ref("Misc")), opt(seq(ref("doctypedecl"), rep(ref("Misc"))))));

// [23] XMLDecl ::= '<?xml' VersionInfo EncodingDecl? SDDecl? S? '?>'
// cf: https://www.w3.org/TR/xml/#NT-XMLDecl 
g.rule("XMLDecl", seq(lit("<?xml"), ref("VersionInfo"), opt(ref("EncodingDecl")), opt(ref("SDDecl")), opt(ref("S")), lit("?>")));

// [24] VersionInfo ::= S 'version' Eq (("'" VersionNum "'") | ('"' VersionNum "'"))
// cf: https://www.w3.org/TR/xml/#NT-VersionInfo 
g.rule("VersionInfo", seq(
    ref("S"),
    lit("version"),
    ref("Eq"),
    alt(
        seq(lit(SQ), ref("VersionNum"), lit(SQ)),
        seq(lit(DQ), ref("VersionNum"), lit(DQ))
    )
));

// [25] Eq ::= S? '=' S?
// cf: https://www.w3.org/TR/xml/#NT-Eq 
g.rule("Eq", seq(opt(ref("S")), lit("="), opt(ref("S"))));

// [26] VersionNum ::= '1.' [0-9]+
// cf: https://www.w3.org/TR/xml/#NT-VersionNum 
g.rule("VersionNum", seq(lit("1."), plus(reg("[0-9]"))));

// [27] Misc ::= Comment | PI | S
// cf: https://www.w3.org/TR/xml/#NT-Misc 
g.rule("Misc", alt(ref("Comment"), ref("PI"), ref("S")));

// [28] doctypedecl ::= '<!DOCTYPE' S Name (S ExternalID)? S? ('[' intSubset ']' S?)? '>'
// cf: https://www.w3.org/TR/xml/#NT-doctypedecl 
g.rule("doctypedecl", seq(lit("<!DOCTYPE"), ref("S"), ref("Name"), opt(seq(ref("S"), ref("ExternalID"))), opt(ref("S")), opt(seq(lit("["), ref("intSubset"), lit("]"), opt(ref("S")))), lit(">")));

// [28a] DeclSep ::= PEReference | S
// cf: https://www.w3.org/TR/xml/#NT-DeclSep 
g.rule("DeclSep", alt(ref("PEReference"), ref("S")));

// [28b] intSubset ::= (markupdecl | DeclSep)*
// cf: https://www.w3.org/TR/xml/#NT-intSubset 
g.rule("intSubset", rep(alt(ref("markupdecl"), ref("DeclSep"))));

// [29] markupdecl ::= elementdecl | AttlistDecl | EntityDecl | NotationDecl | PI | Comment
// cf: https://www.w3.org/TR/xml/#NT-markupdecl 
g.rule("markupdecl", alt(ref("elementdecl"), ref("AttlistDecl"), ref("EntityDecl"), ref("NotationDecl"), ref("PI"), ref("Comment")));

// [30] extSubset ::= TextDecl? extSubsetDecl
// cf: https://www.w3.org/TR/xml/#NT-extSubset 
g.rule("extSubset", seq(opt(ref("TextDecl")), ref("extSubsetDecl")));

// [31] extSubsetDecl ::= ( markupdecl | conditionalSect | DeclSep)*
// cf: https://www.w3.org/TR/xml/#NT-extSubsetDecl 
g.rule("extSubsetDecl", rep(alt(ref("markupdecl"), ref("conditionalSect"), ref("DeclSep"))));

// [32] SDDecl ::= S 'standalone' Eq (("'" ('yes' | 'no') "'") | ('"' ('yes' | 'no') "'"))
// cf: https://www.w3.org/TR/xml/#NT-SDDecl 
g.rule("SDDecl", seq(
    ref("S"),
    lit("standalone"),
    ref("Eq"),
    alt(
        seq(lit(SQ), alt(lit("yes"), lit("no")), lit(SQ)),
        seq(lit(DQ), alt(lit("yes"), lit("no")), lit(DQ))
    )
));

// [39] element ::= EmptyElemTag | STag content ETag
// cf: https://www.w3.org/TR/xml/#NT-element 
g.rule("element", alt(ref("EmptyElemTag"), seq(ref("STag"), ref("content"), ref("ETag"))));

// Well-formedness constraint: Element Type Match
function validateElementTypeMatch(node: CST, input: string): boolean {
    // node.type is 'element' because it's wrapped by the Reference.
    
    // Case 1: EmptyElemTag (always well-formed regarding tag match)
    // Structure: [literal("<\”), Name, repeat(attr), repeat(S), literal("/>")]
    if (node.children.length > 0 && node.children[0].type === 'literal') {
        return true;
    }
    
    // Case 2: Sequence [STag, content, ETag]
    // STag and ETag are References, so their types are 'STag' and 'ETag'
    if (node.children.length === 3 && node.children[0].type === 'STag' && node.children[2].type === 'ETag') {
        const stag = node.children[0];
        const etag = node.children[2];
        
        // STag -> < Name ... > (Name is at children[1])
        const startName = stag.children[1].getText(input);
        
        // ETag -> </ Name ... > (Name is at children[1])
        const endName = etag.children[1].getText(input);

        return startName === endName;
    }
    
    throw new Error(`Validation error: unexpected node structure in validateElementTypeMatch. Children types: ${node.children.map(c => c.type).join(', ')}`);
}
g.verifyRule("element", validateElementTypeMatch);

// Helper for Unique Att Spec check
function validateUniqueAttributes(node: CST, input: string): boolean {
    const seen = new Set<string>();
    // STag/EmptyElemTag structure:
    // 0: "<"
    // 1: Name
    // 2: rep(seq(S, Attribute))
    // ...
    const repNode = node.children[2];
    if (!repNode || repNode.type !== 'repeat') return true; 

    for (const seqNode of repNode.children) {
        // seqNode children: [S, Attribute]
        const attrNode = seqNode.children[1];
        if (attrNode && attrNode.type === 'Attribute') {
            const nameNode = attrNode.children[0];
            const name = nameNode.getText(input);
            if (seen.has(name)) return false;
            seen.add(name);
        }
    }
    return true;
}

// [40] STag ::= '<' Name (S Attribute)* S? '>'
// cf: https://www.w3.org/TR/xml/#NT-STag 
g.rule("STag", seq(lit("<"), ref("Name"), rep(seq(ref("S"), ref("Attribute"))), opt(ref("S")), lit(">")));
// Well-formedness constraint: Unique Att Spec
g.verifyRule("STag", validateUniqueAttributes);

// [41] Attribute ::= Name Eq AttValue
// cf: https://www.w3.org/TR/xml/#NT-Attribute 
g.rule("Attribute", seq(ref("Name"), ref("Eq"), ref("AttValue")));

// [42] ETag ::= '</' Name S? '>'
// cf: https://www.w3.org/TR/xml/#NT-ETag 
g.rule("ETag", seq(lit("</"), ref("Name"), opt(ref("S")), lit(">")));

// [43] content ::= CharData? ((element | Reference | CDSect | PI | Comment) CharData?)*
// cf: https://www.w3.org/TR/xml/#NT-content 
g.rule("content", seq(opt(ref("CharData")), rep(seq(alt(ref("element"), ref("Reference"), ref("CDSect"), ref("PI"), ref("Comment")), opt(ref("CharData"))))));

// [44] EmptyElemTag ::= '<' Name (S Attribute)* S? '/>'
// cf: https://www.w3.org/TR/xml/#NT-EmptyElemTag 
g.rule("EmptyElemTag", seq(lit("<"), ref("Name"), rep(seq(ref("S"), ref("Attribute"))), opt(ref("S")), lit("/>")));
// Well-formedness constraint: Unique Att Spec
g.verifyRule("EmptyElemTag", validateUniqueAttributes);

// [45] elementdecl ::= '<!ELEMENT' S Name S contentspec S? '>'
// cf: https://www.w3.org/TR/xml/#NT-elementdecl 
g.rule("elementdecl", seq(lit("<!ELEMENT"), ref("S"), ref("Name"), ref("S"), ref("contentspec"), opt(ref("S")), lit(">")));

// [46] contentspec ::= 'EMPTY' | 'ANY' | Mixed | children
// cf: https://www.w3.org/TR/xml/#NT-contentspec 
g.rule("contentspec", alt(lit("EMPTY"), lit("ANY"), ref("Mixed"), ref("children")));

// [47] children ::= (choice | seq) ('?' | '*' | '+')?
// cf: https://www.w3.org/TR/xml/#NT-children 
g.rule("children", seq(alt(ref("choice"), ref("seq")), opt(reg("[?*+]?"))));

// [48] cp ::= (Name | choice | seq) ('?' | '*' | '+')?
// cf: https://www.w3.org/TR/xml/#NT-cp 
g.rule("cp", seq(alt(ref("Name"), ref("choice"), ref("seq")), opt(reg("[?*+]?"))));

// [49] choice ::= '(' S? cp ( S? '|' S? cp )+ S? ')'
// cf: https://www.w3.org/TR/xml/#NT-choice 
g.rule("choice", seq(lit("("), opt(ref("S")), ref("cp"), plus(seq(opt(ref("S")), lit("|"), opt(ref("S")), ref("cp"))), opt(ref("S")), lit(")")));

// [50] seq ::= '(' S? cp ( S? ',' S? cp )* S? ')'
// cf: https://www.w3.org/TR/xml/#NT-seq 
g.rule("seq", seq(lit("("), opt(ref("S")), ref("cp"), rep(seq(opt(ref("S")), lit(","), opt(ref("S")), ref("cp"))), opt(ref("S")), lit(")")));

// [51] Mixed ::= '(' S? '#PCDATA' (S? '|' S? Name)* S? ')*' | '(' S? '#PCDATA' S? ')'
// cf: https://www.w3.org/TR/xml/#NT-Mixed 
g.rule("Mixed", alt(
    seq(lit("("), opt(ref("S")), lit("#PCDATA"), rep(seq(opt(ref("S")), lit("|"), opt(ref("S")), ref("Name"))), opt(ref("S")), lit(")*")),
    seq(lit("("), opt(ref("S")), lit("#PCDATA"), opt(ref("S")), lit(")"))
));

// [52] AttlistDecl ::= '<!ATTLIST' S Name AttDef* S? '>'
// cf: https://www.w3.org/TR/xml/#NT-AttlistDecl 
g.rule("AttlistDecl", seq(lit("<!ATTLIST"), ref("S"), ref("Name"), rep(ref("AttDef")), opt(ref("S")), lit(">")));

// [53] AttDef ::= S Name S AttType S DefaultDecl
// cf: https://www.w3.org/TR/xml/#NT-AttDef 
g.rule("AttDef", seq(ref("S"), ref("Name"), ref("S"), ref("AttType"), ref("S"), ref("DefaultDecl")));

// [54] AttType ::= StringType | TokenizedType | EnumeratedType
// cf: https://www.w3.org/TR/xml/#NT-AttType 
g.rule("AttType", alt(ref("StringType"), ref("TokenizedType"), ref("EnumeratedType")));

// [55] StringType ::= 'CDATA'
// cf: https://www.w3.org/TR/xml/#NT-StringType 
g.rule("StringType", lit("CDATA"));

// [56] TokenizedType ::= 'ID' | 'IDREF' | 'IDREFS' | 'ENTITY' | 'ENTITIES' | 'NMTOKEN' | 'NMTOKENS'
// cf: https://www.w3.org/TR/xml/#NT-TokenizedType 
g.rule("TokenizedType", alt(lit("ID"), lit("IDREF"), lit("IDREFS"), lit("ENTITY"), lit("ENTITIES"), lit("NMTOKEN"), lit("NMTOKENS")));

// [57] EnumeratedType ::= NotationType | Enumeration
// cf: https://www.w3.org/TR/xml/#NT-EnumeratedType 
g.rule("EnumeratedType", alt(ref("NotationType"), ref("Enumeration")));

// [58] NotationType ::= 'NOTATION' S '(' S? Name (S? '|' S? Name)* S? ')'
// cf: https://www.w3.org/TR/xml/#NT-NotationType 
g.rule("NotationType", seq(lit("NOTATION"), ref("S"), lit("("), opt(ref("S")), ref("Name"), rep(seq(opt(ref("S")), lit("|"), opt(ref("S")), ref("Name"))), opt(ref("S")), lit(")")));

// [59] Enumeration ::= '(' S? Nmtoken (S? '|' S? Nmtoken)* S? ')'
// cf: https://www.w3.org/TR/xml/#NT-Enumeration 
g.rule("Enumeration", seq(lit("("), opt(ref("S")), ref("Nmtoken"), rep(seq(opt(ref("S")), lit("|"), opt(ref("S")), ref("Nmtoken"))), opt(ref("S")), lit(")")));

// [60] DefaultDecl ::= '#REQUIRED' | '#IMPLIED' | (('#FIXED' S)? AttValue)
// cf: https://www.w3.org/TR/xml/#NT-DefaultDecl 
g.rule("DefaultDecl", alt(lit("#REQUIRED"), lit("#IMPLIED"), seq(opt(seq(lit("#FIXED"), ref("S"))), ref("AttValue"))));

// [61] conditionalSect ::= includeSect | ignoreSect
// cf: https://www.w3.org/TR/xml/#NT-conditionalSect 
g.rule("conditionalSect", alt(ref("includeSect"), ref("ignoreSect")));

// [62] includeSect ::= '<![' S? 'INCLUDE' S? '[' extSubsetDecl ']]>'
// cf: https://www.w3.org/TR/xml/#NT-includeSect 
g.rule("includeSect", seq(lit("<!["), opt(ref("S")), lit("INCLUDE"), opt(ref("S")), lit("["), ref("extSubsetDecl"), lit("]]\x3E")));

// [63] ignoreSect ::= '<![' S? 'IGNORE' S? '[' ignoreSectContents* ']]>'
// cf: https://www.w3.org/TR/xml/#NT-ignoreSect 
g.rule("ignoreSect", seq(lit("<!["), opt(ref("S")), lit("IGNORE"), opt(ref("S")), lit("["), rep(ref("ignoreSectContents")), lit("]]\x3E")));

// [64] ignoreSectContents ::= Ignore ('<![' ignoreSectContents ']]>' Ignore)*
// cf: https://www.w3.org/TR/xml/#NT-ignoreSectContents 
g.rule("ignoreSectContents", seq(ref("Ignore"), rep(seq(lit("<!["), ref("ignoreSectContents"), lit("]]\x3E"), ref("Ignore")))));

// [65] Ignore ::= Char* - (Char* ('<![' | ']]>') Char*)
// cf: https://www.w3.org/TR/xml/#NT-Ignore 
g.rule("Ignore", rep(exc(ref("Char"), reg("(<!\[|]]\\x3E)"))));

// [66] CharRef ::= '&#' [0-9]+ ';' | '&#x' [0-9a-fA-F]+ ';'
// cf: https://www.w3.org/TR/xml/#NT-CharRef 
g.rule("CharRef", alt(seq(lit("&#"), plus(reg("[0-9]")), lit(";")),
 seq(lit("&#x"), plus(reg("[0-9a-fA-F]")), lit(";"))));

// Well-formedness constraint: Legal Character
// Characters referred to using character references MUST match the production for Char.
g.verifyRule("CharRef", (node: CST, input: string): boolean => {
    const text = node.getText(input);
    let code: number;
    if (text.startsWith("&#x")) {
        code = parseInt(text.slice(3, -1), 16);
    } else {
        code = parseInt(text.slice(2, -1), 10);
    }

    return (
        code === 0x9 ||
        code === 0xA ||
        code === 0xD ||
        (code >= 0x20 && code <= 0xD7FF) ||
        (code >= 0xE000 && code <= 0xFFFD) ||
        (code >= 0x10000 && code <= 0x10FFFF)
    );
});

// [67] Reference ::= EntityRef | CharRef
// cf: https://www.w3.org/TR/xml/#NT-Reference 
g.rule("Reference", alt(ref("EntityRef"), ref("CharRef")));

// [68] EntityRef ::= '&' Name ';'
// cf: https://www.w3.org/TR/xml/#NT-EntityRef 
g.rule("EntityRef", seq(lit("&"), ref("Name"), lit(";")));

// [69] PEReference ::= '%' Name ';'
// cf: https://www.w3.org/TR/xml/#NT-PEReference 
g.rule("PEReference", seq(lit("%"), ref("Name"), lit(";")));

// [70] EntityDecl ::= GEDecl | PEDecl
// cf: https://www.w3.org/TR/xml/#NT-EntityDecl 
g.rule("EntityDecl", alt(ref("GEDecl"), ref("PEDecl")));

// [71] GEDecl ::= '<!ENTITY' S Name S EntityDef S? '>'
// cf: https://www.w3.org/TR/xml/#NT-GEDecl 
g.rule("GEDecl", seq(lit("<!ENTITY"), ref("S"), ref("Name"), ref("S"), ref("EntityDef"), opt(ref("S")), lit(">")));

// [72] PEDecl ::= '<!ENTITY' S '%' S Name S PEDef S? '>'
// cf: https://www.w3.org/TR/xml/#NT-PEDecl 
g.rule("PEDecl", seq(lit("<!ENTITY"), ref("S"), lit("%"), ref("S"), ref("Name"), ref("S"), ref("PEDef"), opt(ref("S")), lit(">")));

// [73] EntityDef ::= EntityValue | (ExternalID NDataDecl?)
// cf: https://www.w3.org/TR/xml/#NT-EntityDef 
g.rule("EntityDef", alt(ref("EntityValue"), seq(ref("ExternalID"), opt(ref("NDataDecl")))));

// [74] PEDef ::= EntityValue | ExternalID
// cf: https://www.w3.org/TR/xml/#NT-PEDef 
g.rule("PEDef", alt(ref("EntityValue"), ref("ExternalID")));

// [75] ExternalID ::= 'SYSTEM' S SystemLiteral | 'PUBLIC' S PubidLiteral S SystemLiteral
// cf: https://www.w3.org/TR/xml/#NT-ExternalID 
g.rule("ExternalID", alt(seq(lit("SYSTEM"), ref("S"), ref("SystemLiteral")), seq(lit("PUBLIC"), ref("S"), ref("PubidLiteral"), ref("S"), ref("SystemLiteral"))));

// [76] NDataDecl ::= S 'NDATA' S Name
// cf: https://www.w3.org/TR/xml/#NT-NDataDecl 
g.rule("NDataDecl", seq(ref("S"), lit("NDATA"), ref("S"), ref("Name")));

// [77] TextDecl ::= '<?xml' VersionInfo? EncodingDecl S? '?>'
// cf: https://www.w3.org/TR/xml/#NT-TextDecl 
g.rule("TextDecl", seq(lit("<?xml"), opt(ref("VersionInfo")), ref("EncodingDecl"), opt(ref("S")), lit("?>")));

// [78] extParsedEnt ::= TextDecl? content
// cf: https://www.w3.org/TR/xml/#NT-extParsedEnt 
g.rule("extParsedEnt", seq(opt(ref("TextDecl")), ref("content")));

// [80] EncodingDecl ::= S 'encoding' Eq ('"' EncName "'" | "'" EncName "'")
// cf: https://www.w3.org/TR/xml/#NT-EncodingDecl 
g.rule("EncodingDecl", seq(
    ref("S"),
    lit("encoding"),
    ref("Eq"),
    alt(
        seq(lit(DQ), ref("EncName"), lit(DQ)),
        seq(lit(SQ), ref("EncName"), lit(SQ))
    )
));

// [81] EncName ::= [A-Za-z] ([A-Za-z0-9._] | '-')*
// cf: https://www.w3.org/TR/xml/#NT-EncName 
g.rule("EncName", seq(reg("[A-Za-z]"), rep(reg("[A-Za-z0-9._-]"))));

// [82] NotationDecl ::= '<!NOTATION' S Name S (ExternalID | PublicID) S? '>'
// cf: https://www.w3.org/TR/xml/#NT-NotationDecl 
g.rule("NotationDecl", seq(lit("<!NOTATION"), ref("S"), ref("Name"), ref("S"), alt(ref("ExternalID"), ref("PublicID")), opt(ref("S")), lit(">")));

// [83] PublicID ::= 'PUBLIC' S PubidLiteral
// cf: https://www.w3.org/TR/xml/#NT-PublicID 
g.rule("PublicID", seq(lit("PUBLIC"), ref("S"), ref("PubidLiteral")));

export const grammar = g.build();
export const g_deprecated = g;