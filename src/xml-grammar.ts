import { Grammar } from './parser';

const g = new Grammar();

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
g.rule("document", g.seq(g.ref("prolog"), g.ref("element"), g.rep(g.ref("Misc"))));

// [2] Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
// 
// any Unicode character, excluding the surrogate blocks, FFFE, and FFFF.
// 
// cf: https://www.w3.org/TR/xml/#NT-Char 
g.rule("Char", g.reg("\t|\n|\r|[\u0020-\uD7FF]|[\uE000-\uFFFD]|[\uD800-\uDBFF][\uDC00-\uDFFF]"));

// [3] S ::= (#x20 | #x9 | #xD | #xA)+
// cf: https://www.w3.org/TR/xml/#NT-S 
g.rule("S", g.plus(g.reg("[\x20\t\r\n]")));

// [4] NameStartChar ::= ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
// cf: https://www.w3.org/TR/xml/#NT-NameStartChar 
g.rule("NameStartChar", g.alt(
    g.lit(":"), g.reg("[A-Z]"), g.lit("_"), g.reg("[a-z]"),
    g.reg("[\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]"),
    g.reg("[\uD800-\uDB7F][\uDC00-\uDFFF]")
));

// [4a] NameChar ::= NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
// cf: https://www.w3.org/TR/xml/#NT-NameChar 
g.rule("NameChar", g.alt(
    g.ref("NameStartChar"), g.lit("-"), g.lit("."), g.reg("[0-9]"), g.lit("\u00B7"),
    g.reg("[\u0300-\u036F\u203F-\u2040]")
));

// [5] Name ::= NameStartChar (NameChar)*
// cf: https://www.w3.org/TR/xml/#NT-Name 
g.rule("Name", g.seq(g.ref("NameStartChar"), g.rep(g.ref("NameChar"))));

// [6] Names ::= Name (#x20 Name)*
// cf: https://www.w3.org/TR/xml/#NT-Names 
g.rule("Names", g.seq(g.ref("Name"), g.rep(g.seq(g.lit("\x20"), g.ref("Name")))));

// [7] Nmtoken ::= (NameChar)+
// cf: https://www.w3.org/TR/xml/#NT-Nmtoken 
g.rule("Nmtoken", g.plus(g.ref("NameChar")));

// [8] Nmtokens ::= Nmtoken (#x20 Nmtoken)*
// cf: https://www.w3.org/TR/xml/#NT-Nmtokens 
g.rule("Nmtokens", g.seq(g.ref("Nmtoken"), g.rep(g.seq(g.lit("\x20"), g.ref("Nmtoken")))));

// [9] EntityValue ::= '"' ([^%&\"] | PEReference | Reference)* '"' |  "'" ([^%&'] | PEReference | Reference)* "'"
// cf: https://www.w3.org/TR/xml/#NT-EntityValue 
g.rule("EntityValue", g.alt(
    g.seq(g.lit(DQ), g.rep(g.alt(g.reg("[^%&\\x22]"), g.ref("PEReference"), g.ref("Reference"))), g.lit(DQ)),
    g.seq(g.lit(SQ), g.rep(g.alt(g.reg("[^%&\x27]"), g.ref("PEReference"), g.ref("Reference"))), g.lit(SQ))
));

// [10] AttValue ::= '"' ([^<&\"] | Reference)* '"' |  "'" ([^<&'] | Reference)* "'"
// cf: https://www.w3.org/TR/xml/#NT-AttValue 
g.rule("AttValue", g.alt(
    g.seq(g.lit(DQ), g.rep(g.alt(g.reg("[^<&\\x22]"), g.ref("Reference"))), g.lit(DQ)),
    g.seq(g.lit(SQ), g.rep(g.alt(g.reg("[^<&\x27]"), g.ref("Reference"))), g.lit(SQ))
));

// [11] SystemLiteral ::= ('"' [^"]* "'") | ("'" [^']* "'")
// cf: https://www.w3.org/TR/xml/#NT-SystemLiteral 
g.rule("SystemLiteral", g.alt(
    g.seq(g.lit(DQ), g.reg("[^\\x22]*"), g.lit(DQ)),
    g.seq(g.lit(SQ), g.reg("[^\\x27]*"), g.lit(SQ))
));

// [12] PubidLiteral ::= '"' PubidChar* '"' | "'" (PubidChar - "'")* "'"
// cf: https://www.w3.org/TR/xml/#NT-PubidLiteral 
g.rule("PubidLiteral", g.alt(
    g.seq(g.lit(DQ), g.rep(g.ref("PubidChar")), g.lit(DQ)),
    g.seq(g.lit(SQ), g.rep(g.exc(g.ref("PubidChar"), g.lit(SQ))), g.lit(SQ))
));

// [13] PubidChar ::= #x20 | #xD | #xA | [a-zA-Z0-9] | [-'()+,./:=?;!*#@$_%]
// cf: https://www.w3.org/TR/xml/#NT-PubidChar 
g.rule("PubidChar", g.reg("[\\x20\\r\\na-zA-Z0-9\-&#039;()+,./:=?;!*#@$_%]" ));

// [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
// cf: https://www.w3.org/TR/xml/#NT-CharData 
g.rule("CharData", g.rep(g.exc(g.reg('[^<&]'), g.lit("]]\x3E"))));

// [15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
// cf: https://www.w3.org/TR/xml/#NT-Comment 
g.rule("Comment", g.seq(
    g.lit("<!--"),
    g.rep(
        g.alt(
            g.exc(g.ref("Char"), g.lit("-")),
            g.seq(g.lit("-"), g.exc(g.ref("Char"), g.lit("-")))
        )
    ),
    g.lit("-->")
));

// [16] PI ::= '<?' PITarget (S (Char* - (Char* '?>' Char*)))? '?>'
// cf: https://www.w3.org/TR/xml/#NT-PI 
g.rule("PI", g.seq(
    g.lit("<?"),
    g.ref("PITarget"),
    g.opt(
        g.seq(
            g.ref("S"),
            g.rep(
                g.exc(g.ref("Char"), g.lit("?>"))
            )
        )
    ),
    g.lit("?>")
));

// [17] PITarget ::= Name - ((('X' | 'x') ('M' | 'm') ('L' | 'l')))
// cf: https://www.w3.org/TR/xml/#NT-PITarget 
g.rule("PITarget", g.exc(g.ref("Name"), g.reg("([Xx][Mm][Ll])")));

// [18] CDSect ::= CDStart CData CDEnd
// cf: https://www.w3.org/TR/xml/#NT-CDSect 
g.rule("CDSect", g.seq(g.ref("CDStart"), g.ref("CData"), g.ref("CDEnd")));

// [19] CDStart ::= '<![CDATA['
// cf: https://www.w3.org/TR/xml/#NT-CDStart 
g.rule("CDStart", g.lit("<![CDATA["));

// [20] CData ::= (Char* - (Char* ']]>' Char*))
// cf: https://www.w3.org/TR/xml/#NT-CData 
g.rule("CData", g.rep(g.exc(g.ref("Char"), g.lit("]]\x3E"))));

// [21] CDEnd ::= ']]>'
// cf: https://www.w3.org/TR/xml/#NT-CDEnd 
g.rule("CDEnd", g.lit("]]\x3E"));

// [22] prolog ::= XMLDecl? Misc* (doctypedecl Misc*)?
// cf: https://www.w3.org/TR/xml/#NT-prolog 
g.rule("prolog", g.seq(g.opt(g.ref("XMLDecl")), g.rep(g.ref("Misc")), g.opt(g.seq(g.ref("doctypedecl"), g.rep(g.ref("Misc"))))));

// [23] XMLDecl ::= '<?xml' VersionInfo EncodingDecl? SDDecl? S? '?>'
// cf: https://www.w3.org/TR/xml/#NT-XMLDecl 
g.rule("XMLDecl", g.seq(g.lit("<?xml"), g.ref("VersionInfo"), g.opt(g.ref("EncodingDecl")), g.opt(g.ref("SDDecl")), g.opt(g.ref("S")), g.lit("?>")));

// [24] VersionInfo ::= S 'version' Eq (("'" VersionNum "'") | ('"' VersionNum "'"))
// cf: https://www.w3.org/TR/xml/#NT-VersionInfo 
g.rule("VersionInfo", g.seq(
    g.ref("S"),
    g.lit("version"),
    g.ref("Eq"),
    g.alt(
        g.seq(g.lit(SQ), g.ref("VersionNum"), g.lit(SQ)),
        g.seq(g.lit(DQ), g.ref("VersionNum"), g.lit(DQ))
    )
));

// [25] Eq ::= S? '=' S?
// cf: https://www.w3.org/TR/xml/#NT-Eq 
g.rule("Eq", g.seq(g.opt(g.ref("S")), g.lit("="), g.opt(g.ref("S"))));

// [26] VersionNum ::= '1.' [0-9]+
// cf: https://www.w3.org/TR/xml/#NT-VersionNum 
g.rule("VersionNum", g.seq(g.lit("1."), g.plus(g.reg("[0-9]"))));

// [27] Misc ::= Comment | PI | S
// cf: https://www.w3.org/TR/xml/#NT-Misc 
g.rule("Misc", g.alt(g.ref("Comment"), g.ref("PI"), g.ref("S")));

// [28] doctypedecl ::= '<!DOCTYPE' S Name (S ExternalID)? S? ('[' intSubset ']' S?)? '>'
// cf: https://www.w3.org/TR/xml/#NT-doctypedecl 
g.rule("doctypedecl", g.seq(g.lit("<!DOCTYPE"), g.ref("S"), g.ref("Name"), g.opt(g.seq(g.ref("S"), g.ref("ExternalID"))), g.opt(g.ref("S")), g.opt(g.seq(g.lit("["), g.ref("intSubset"), g.lit("]"), g.opt(g.ref("S")))), g.lit(">")));

// [28a] DeclSep ::= PEReference | S
// cf: https://www.w3.org/TR/xml/#NT-DeclSep 
g.rule("DeclSep", g.alt(g.ref("PEReference"), g.ref("S")));

// [28b] intSubset ::= (markupdecl | DeclSep)*
// cf: https://www.w3.org/TR/xml/#NT-intSubset 
g.rule("intSubset", g.rep(g.alt(g.ref("markupdecl"), g.ref("DeclSep"))));

// [29] markupdecl ::= elementdecl | AttlistDecl | EntityDecl | NotationDecl | PI | Comment
// cf: https://www.w3.org/TR/xml/#NT-markupdecl 
g.rule("markupdecl", g.alt(g.ref("elementdecl"), g.ref("AttlistDecl"), g.ref("EntityDecl"), g.ref("NotationDecl"), g.ref("PI"), g.ref("Comment")));

// [30] extSubset ::= TextDecl? extSubsetDecl
// cf: https://www.w3.org/TR/xml/#NT-extSubset 
g.rule("extSubset", g.seq(g.opt(g.ref("TextDecl")), g.ref("extSubsetDecl")));

// [31] extSubsetDecl ::= ( markupdecl | conditionalSect | DeclSep)*
// cf: https://www.w3.org/TR/xml/#NT-extSubsetDecl 
g.rule("extSubsetDecl", g.rep(g.alt(g.ref("markupdecl"), g.ref("conditionalSect"), g.ref("DeclSep"))));

// [32] SDDecl ::= S 'standalone' Eq (("'" ('yes' | 'no') "'") | ('"' ('yes' | 'no') "'"))
// cf: https://www.w3.org/TR/xml/#NT-SDDecl 
g.rule("SDDecl", g.seq(
    g.ref("S"),
    g.lit("standalone"),
    g.ref("Eq"),
    g.alt(
        g.seq(g.lit(SQ), g.alt(g.lit("yes"), g.lit("no")), g.lit(SQ)),
        g.seq(g.lit(DQ), g.alt(g.lit("yes"), g.lit("no")), g.lit(DQ))
    )
));

// [39] element ::= EmptyElemTag | STag content ETag
// cf: https://www.w3.org/TR/xml/#NT-element 
g.rule("element", g.alt(g.ref("EmptyElemTag"), g.seq(g.ref("STag"), g.ref("content"), g.ref("ETag"))));

// [40] STag ::= '<' Name (S Attribute)* S? '>'
// cf: https://www.w3.org/TR/xml/#NT-STag 
g.rule("STag", g.seq(g.lit("<"), g.ref("Name"), g.rep(g.seq(g.ref("S"), g.ref("Attribute"))), g.opt(g.ref("S")), g.lit(">")));

// [41] Attribute ::= Name Eq AttValue
// cf: https://www.w3.org/TR/xml/#NT-Attribute 
g.rule("Attribute", g.seq(g.ref("Name"), g.ref("Eq"), g.ref("AttValue")));

// [42] ETag ::= '</' Name S? '>'
// cf: https://www.w3.org/TR/xml/#NT-ETag 
g.rule("ETag", g.seq(g.lit("</"), g.ref("Name"), g.opt(g.ref("S")), g.lit(">")));

// [43] content ::= CharData? ((element | Reference | CDSect | PI | Comment) CharData?)*
// cf: https://www.w3.org/TR/xml/#NT-content 
g.rule("content", g.seq(g.opt(g.ref("CharData")), g.rep(g.seq(g.alt(g.ref("element"), g.ref("Reference"), g.ref("CDSect"), g.ref("PI"), g.ref("Comment")), g.opt(g.ref("CharData"))))));

// [44] EmptyElemTag ::= '<' Name (S Attribute)* S? '/>'
// cf: https://www.w3.org/TR/xml/#NT-EmptyElemTag 
g.rule("EmptyElemTag", g.seq(g.lit("<"), g.ref("Name"), g.rep(g.seq(g.ref("S"), g.ref("Attribute"))), g.opt(g.ref("S")), g.lit("/>")));

// [45] elementdecl ::= '<!ELEMENT' S Name S contentspec S? '>'
// cf: https://www.w3.org/TR/xml/#NT-elementdecl 
g.rule("elementdecl", g.seq(g.lit("<!ELEMENT"), g.ref("S"), g.ref("Name"), g.ref("S"), g.ref("contentspec"), g.opt(g.ref("S")), g.lit(">")));

// [46] contentspec ::= 'EMPTY' | 'ANY' | Mixed | children
// cf: https://www.w3.org/TR/xml/#NT-contentspec 
g.rule("contentspec", g.alt(g.lit("EMPTY"), g.lit("ANY"), g.ref("Mixed"), g.ref("children")));

// [47] children ::= (choice | seq) ('?' | '*' | '+')?
// cf: https://www.w3.org/TR/xml/#NT-children 
g.rule("children", g.seq(g.alt(g.ref("choice"), g.ref("seq")), g.opt(g.reg("[?*+]?"))));

// [48] cp ::= (Name | choice | seq) ('?' | '*' | '+')?
// cf: https://www.w3.org/TR/xml/#NT-cp 
g.rule("cp", g.seq(g.alt(g.ref("Name"), g.ref("choice"), g.ref("seq")), g.opt(g.reg("[?*+]?"))));

// [49] choice ::= '(' S? cp ( S? '|' S? cp )+ S? ')'
// cf: https://www.w3.org/TR/xml/#NT-choice 
g.rule("choice", g.seq(g.lit("("), g.opt(g.ref("S")), g.ref("cp"), g.plus(g.seq(g.opt(g.ref("S")), g.lit("|"), g.opt(g.ref("S")), g.ref("cp"))), g.opt(g.ref("S")), g.lit(")")));

// [50] seq ::= '(' S? cp ( S? ',' S? cp )* S? ')'
// cf: https://www.w3.org/TR/xml/#NT-seq 
g.rule("seq", g.seq(g.lit("("), g.opt(g.ref("S")), g.ref("cp"), g.rep(g.seq(g.opt(g.ref("S")), g.lit(","), g.opt(g.ref("S")), g.ref("cp"))), g.opt(g.ref("S")), g.lit(")")));

// [51] Mixed ::= '(' S? '#PCDATA' (S? '|' S? Name)* S? ')*' | '(' S? '#PCDATA' S? ')'
// cf: https://www.w3.org/TR/xml/#NT-Mixed 
g.rule("Mixed", g.alt(
    g.seq(g.lit("("), g.opt(g.ref("S")), g.lit("#PCDATA"), g.rep(g.seq(g.opt(g.ref("S")), g.lit("|"), g.opt(g.ref("S")), g.ref("Name"))), g.opt(g.ref("S")), g.lit(")*")),
    g.seq(g.lit("("), g.opt(g.ref("S")), g.lit("#PCDATA"), g.opt(g.ref("S")), g.lit(")"))
));

// [52] AttlistDecl ::= '<!ATTLIST' S Name AttDef* S? '>'
// cf: https://www.w3.org/TR/xml/#NT-AttlistDecl 
g.rule("AttlistDecl", g.seq(g.lit("<!ATTLIST"), g.ref("S"), g.ref("Name"), g.rep(g.ref("AttDef")), g.opt(g.ref("S")), g.lit(">")));

// [53] AttDef ::= S Name S AttType S DefaultDecl
// cf: https://www.w3.org/TR/xml/#NT-AttDef 
g.rule("AttDef", g.seq(g.ref("S"), g.ref("Name"), g.ref("S"), g.ref("AttType"), g.ref("S"), g.ref("DefaultDecl")));

// [54] AttType ::= StringType | TokenizedType | EnumeratedType
// cf: https://www.w3.org/TR/xml/#NT-AttType 
g.rule("AttType", g.alt(g.ref("StringType"), g.ref("TokenizedType"), g.ref("EnumeratedType")));

// [55] StringType ::= 'CDATA'
// cf: https://www.w3.org/TR/xml/#NT-StringType 
g.rule("StringType", g.lit("CDATA"));

// [56] TokenizedType ::= 'ID' | 'IDREF' | 'IDREFS' | 'ENTITY' | 'ENTITIES' | 'NMTOKEN' | 'NMTOKENS'
// cf: https://www.w3.org/TR/xml/#NT-TokenizedType 
g.rule("TokenizedType", g.alt(g.lit("ID"), g.lit("IDREF"), g.lit("IDREFS"), g.lit("ENTITY"), g.lit("ENTITIES"), g.lit("NMTOKEN"), g.lit("NMTOKENS")));

// [57] EnumeratedType ::= NotationType | Enumeration
// cf: https://www.w3.org/TR/xml/#NT-EnumeratedType 
g.rule("EnumeratedType", g.alt(g.ref("NotationType"), g.ref("Enumeration")));

// [58] NotationType ::= 'NOTATION' S '(' S? Name (S? '|' S? Name)* S? ')'
// cf: https://www.w3.org/TR/xml/#NT-NotationType 
g.rule("NotationType", g.seq(g.lit("NOTATION"), g.ref("S"), g.lit("("), g.opt(g.ref("S")), g.ref("Name"), g.rep(g.seq(g.opt(g.ref("S")), g.lit("|"), g.opt(g.ref("S")), g.ref("Name"))), g.opt(g.ref("S")), g.lit(")")));

// [59] Enumeration ::= '(' S? Nmtoken (S? '|' S? Nmtoken)* S? ')'
// cf: https://www.w3.org/TR/xml/#NT-Enumeration 
g.rule("Enumeration", g.seq(g.lit("("), g.opt(g.ref("S")), g.ref("Nmtoken"), g.rep(g.seq(g.opt(g.ref("S")), g.lit("|"), g.opt(g.ref("S")), g.ref("Nmtoken"))), g.opt(g.ref("S")), g.lit(")")));

// [60] DefaultDecl ::= '#REQUIRED' | '#IMPLIED' | (('#FIXED' S)? AttValue)
// cf: https://www.w3.org/TR/xml/#NT-DefaultDecl 
g.rule("DefaultDecl", g.alt(g.lit("#REQUIRED"), g.lit("#IMPLIED"), g.seq(g.opt(g.seq(g.lit("#FIXED"), g.ref("S"))), g.ref("AttValue"))));

// [61] conditionalSect ::= includeSect | ignoreSect
// cf: https://www.w3.org/TR/xml/#NT-conditionalSect 
g.rule("conditionalSect", g.alt(g.ref("includeSect"), g.ref("ignoreSect")));

// [62] includeSect ::= '<![' S? 'INCLUDE' S? '[' extSubsetDecl ']]>'
// cf: https://www.w3.org/TR/xml/#NT-includeSect 
g.rule("includeSect", g.seq(g.lit("<!["), g.opt(g.ref("S")), g.lit("INCLUDE"), g.opt(g.ref("S")), g.lit("["), g.ref("extSubsetDecl"), g.lit("]]\x3E")));

// [63] ignoreSect ::= '<![' S? 'IGNORE' S? '[' ignoreSectContents* ']]>'
// cf: https://www.w3.org/TR/xml/#NT-ignoreSect 
g.rule("ignoreSect", g.seq(g.lit("<!["), g.opt(g.ref("S")), g.lit("IGNORE"), g.opt(g.ref("S")), g.lit("["), g.rep(g.ref("ignoreSectContents")), g.lit("]]\x3E")));

// [64] ignoreSectContents ::= Ignore ('<![' ignoreSectContents ']]>' Ignore)*
// cf: https://www.w3.org/TR/xml/#NT-ignoreSectContents 
g.rule("ignoreSectContents", g.seq(g.ref("Ignore"), g.rep(g.seq(g.lit("<!["), g.ref("ignoreSectContents"), g.lit("]]\x3E"), g.ref("Ignore")))));

// [65] Ignore ::= Char* - (Char* ('<![' | ']]>') Char*)
// cf: https://www.w3.org/TR/xml/#NT-Ignore 
g.rule("Ignore", g.rep(g.exc(g.ref("Char"), g.reg("(<!\\[|]]\\x3E)"))));

// [66] CharRef ::= '&#' [0-9]+ ';' | '&#x' [0-9a-fA-F]+ ';'
// cf: https://www.w3.org/TR/xml/#NT-CharRef 
g.rule("CharRef", g.alt(g.seq(g.lit("&#"), g.plus(g.reg("[0-9]")), g.lit(";")),
 g.seq(g.lit("&#x"), g.plus(g.reg("[0-9a-fA-F]")), g.lit(";"))));

// [67] Reference ::= EntityRef | CharRef
// cf: https://www.w3.org/TR/xml/#NT-Reference 
g.rule("Reference", g.alt(g.ref("EntityRef"), g.ref("CharRef")));

// [68] EntityRef ::= '&' Name ';'
// cf: https://www.w3.org/TR/xml/#NT-EntityRef 
g.rule("EntityRef", g.seq(g.lit("&"), g.ref("Name"), g.lit(";")));

// [69] PEReference ::= '%' Name ';'
// cf: https://www.w3.org/TR/xml/#NT-PEReference 
g.rule("PEReference", g.seq(g.lit("%"), g.ref("Name"), g.lit(";")));

// [70] EntityDecl ::= GEDecl | PEDecl
// cf: https://www.w3.org/TR/xml/#NT-EntityDecl 
g.rule("EntityDecl", g.alt(g.ref("GEDecl"), g.ref("PEDecl")));

// [71] GEDecl ::= '<!ENTITY' S Name S EntityDef S? '>'
// cf: https://www.w3.org/TR/xml/#NT-GEDecl 
g.rule("GEDecl", g.seq(g.lit("<!ENTITY"), g.ref("S"), g.ref("Name"), g.ref("S"), g.ref("EntityDef"), g.opt(g.ref("S")), g.lit(">")));

// [72] PEDecl ::= '<!ENTITY' S '%' S Name S PEDef S? '>'
// cf: https://www.w3.org/TR/xml/#NT-PEDecl 
g.rule("PEDecl", g.seq(g.lit("<!ENTITY"), g.ref("S"), g.lit("%"), g.ref("S"), g.ref("Name"), g.ref("S"), g.ref("PEDef"), g.opt(g.ref("S")), g.lit(">")));

// [73] EntityDef ::= EntityValue | (ExternalID NDataDecl?)
// cf: https://www.w3.org/TR/xml/#NT-EntityDef 
g.rule("EntityDef", g.alt(g.ref("EntityValue"), g.seq(g.ref("ExternalID"), g.opt(g.ref("NDataDecl")))));

// [74] PEDef ::= EntityValue | ExternalID
// cf: https://www.w3.org/TR/xml/#NT-PEDef 
g.rule("PEDef", g.alt(g.ref("EntityValue"), g.ref("ExternalID")));

// [75] ExternalID ::= 'SYSTEM' S SystemLiteral | 'PUBLIC' S PubidLiteral S SystemLiteral
// cf: https://www.w3.org/TR/xml/#NT-ExternalID 
g.rule("ExternalID", g.alt(g.seq(g.lit("SYSTEM"), g.ref("S"), g.ref("SystemLiteral")), g.seq(g.lit("PUBLIC"), g.ref("S"), g.ref("PubidLiteral"), g.ref("S"), g.ref("SystemLiteral"))));

// [76] NDataDecl ::= S 'NDATA' S Name
// cf: https://www.w3.org/TR/xml/#NT-NDataDecl 
g.rule("NDataDecl", g.seq(g.ref("S"), g.lit("NDATA"), g.ref("S"), g.ref("Name")));

// [77] TextDecl ::= '<?xml' VersionInfo? EncodingDecl S? '?>'
// cf: https://www.w3.org/TR/xml/#NT-TextDecl 
g.rule("TextDecl", g.seq(g.lit("<?xml"), g.opt(g.ref("VersionInfo")), g.ref("EncodingDecl"), g.opt(g.ref("S")), g.lit("?>")));

// [78] extParsedEnt ::= TextDecl? content
// cf: https://www.w3.org/TR/xml/#NT-extParsedEnt 
g.rule("extParsedEnt", g.seq(g.opt(g.ref("TextDecl")), g.ref("content")));

// [80] EncodingDecl ::= S 'encoding' Eq ('"' EncName "'" | "'" EncName "'")
// cf: https://www.w3.org/TR/xml/#NT-EncodingDecl 
g.rule("EncodingDecl", g.seq(
    g.ref("S"),
    g.lit("encoding"),
    g.ref("Eq"),
    g.alt(
        g.seq(g.lit(DQ), g.ref("EncName"), g.lit(DQ)),
        g.seq(g.lit(SQ), g.ref("EncName"), g.lit(SQ))
    )
));

// [81] EncName ::= [A-Za-z] ([A-Za-z0-9._] | '-')*
// cf: https://www.w3.org/TR/xml/#NT-EncName 
g.rule("EncName", g.seq(g.reg("[A-Za-z]"), g.rep(g.reg("[A-Za-z0-9._-]"))));

// [82] NotationDecl ::= '<!NOTATION' S Name S (ExternalID | PublicID) S? '>'
// cf: https://www.w3.org/TR/xml/#NT-NotationDecl 
g.rule("NotationDecl", g.seq(g.lit("<!NOTATION"), g.ref("S"), g.ref("Name"), g.ref("S"), g.alt(g.ref("ExternalID"), g.ref("PublicID")), g.opt(g.ref("S")), g.lit(">")));

// [83] PublicID ::= 'PUBLIC' S PubidLiteral
// cf: https://www.w3.org/TR/xml/#NT-PublicID 
g.rule("PublicID", g.seq(g.lit("PUBLIC"), g.ref("S"), g.ref("PubidLiteral")));

export { g };
