import { Grammar } from './parser';

const g = new Grammar();

const SQ = "\u0027"; // Single Quote '
const DQ = "\u0022"; // Double Quote "

// [2] Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
// 
// any Unicode character, excluding the surrogate blocks, FFFE, and FFFF.
// 
// REF: xml_spec.md#NT-Char L480
g.rule("Char", g.reg("\t|\n|\r|[\u0020-\uD7FF]|[\uE000-\uFFFD]|[\uD800-\uDBFF][\uDC00-\uDFFF]"));

// [3] S ::= (#x20 | #x9 | #xD | #xA)+
// REF: xml_spec.md#NT-S L539
g.rule("S", g.plus(g.reg("[\x20\t\r\n]")));

// [4] NameStartChar ::= ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
// REF: xml_spec.md#NT-NameStartChar L817
g.rule("NameStartChar", g.alt(
    g.lit(":"), g.reg("[A-Z]"), g.lit("_"), g.reg("[a-z]"),
    g.reg("[\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]"),
    g.reg("[\uD800-\uDB7F][\uDC00-\uDFFF]")
));

// [4a] NameChar ::= NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
// REF: xml_spec.md#NT-NameChar L818
g.rule("NameChar", g.alt(
    g.ref("NameStartChar"), g.lit("-"), g.lit("."), g.reg("[0-9]"), g.lit("\u00B7"),
    g.reg("[\u0300-\u036F\u203F-\u2040]")
));

// [5] Name ::= NameStartChar (NameChar)*
// REF: xml_spec.md#NT-Name L819
g.rule("Name", g.seq(g.ref("NameStartChar"), g.rep(g.ref("NameChar"))));

// [6] Names ::= Name (#x20 Name)*
// REF: xml_spec.md#NT-Names L820
g.rule("Names", g.seq(g.ref("Name"), g.rep(g.seq(g.lit("\x20"), g.ref("Name")))));

// [7] Nmtoken ::= (NameChar)+
// REF: xml_spec.md#NT-Nmtoken L821
g.rule("Nmtoken", g.plus(g.ref("NameChar")));

// [8] Nmtokens ::= Nmtoken (#x20 Nmtoken)*
// REF: xml_spec.md#NT-Nmtokens L822
g.rule("Nmtokens", g.seq(g.ref("Nmtoken"), g.rep(g.seq(g.lit("\x20"), g.ref("Nmtoken")))));

// [9] EntityValue ::= '"' ([^%&\"] | PEReference | Reference)* '"' |  "'" ([^%&'] | PEReference | Reference)* "'"
// REF: xml_spec.md#NT-EntityValue L888
g.rule("EntityValue", g.alt(
    g.seq(g.lit(DQ), g.rep(g.alt(g.reg("[^%&\\x22]"), g.ref("PEReference"), g.ref("Reference"))), g.lit(DQ)),
    g.seq(g.lit(SQ), g.rep(g.alt(g.reg("[^%&\x27]"), g.ref("PEReference"), g.ref("Reference"))), g.lit(SQ))
));

// [10] AttValue ::= '"' ([^<&\"] | Reference)* '"' |  "'" ([^<&'] | Reference)* "'"
// REF: xml_spec.md#NT-AttValue L890
g.rule("AttValue", g.alt(
    g.seq(g.lit(DQ), g.rep(g.alt(g.reg("[^<&\\x22]"), g.ref("Reference"))), g.lit(DQ)),
    g.seq(g.lit(SQ), g.rep(g.alt(g.reg("[^<&\x27]"), g.ref("Reference"))), g.lit(SQ))
));

// [11] SystemLiteral ::= ('"' [^"]* "'") | ("'" [^']* "'")
// REF: xml_spec.md#NT-SystemLiteral L892
g.rule("SystemLiteral", g.alt(
    g.seq(g.lit(DQ), g.reg("[^\\x22]*"), g.lit(DQ)),
    g.seq(g.lit(SQ), g.reg("[^\\x27]*"), g.lit(SQ))
));

// [12] PubidLiteral ::= '"' PubidChar* '"' | "'" (PubidChar - "'")* "'"
// REF: xml_spec.md#NT-PubidLiteral L893
g.rule("PubidLiteral", g.alt(
    g.seq(g.lit(DQ), g.rep(g.ref("PubidChar")), g.lit(DQ)),
    g.seq(g.lit(SQ), g.rep(g.exc(g.ref("PubidChar"), g.lit(SQ))), g.lit(SQ))
));

// [13] PubidChar ::= #x20 | #xD | #xA | [a-zA-Z0-9] | [-'()+,./:=?;!*#@$_%]
// REF: xml_spec.md#NT-PubidChar L894
g.rule("PubidChar", g.reg("[\\x20\\r\\na-zA-Z0-9\-&#039;()+,./:=?;!*#@$_%]" ));

// [14] CharData ::= [^<&]* - ([^<&]* ']]>' [^<&]*)
// REF: xml_spec.md#NT-CharData L1106
g.rule("CharData", g.rep(g.exc(g.reg('[^<&]'), g.lit("]]\x3E"))));

// [15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
// REF: xml_spec.md#NT-Comment L1149
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
// REF: xml_spec.md#NT-PI L1188
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
// REF: xml_spec.md#NT-PITarget L1189
g.rule("PITarget", g.exc(g.ref("Name"), g.reg("([Xx][Mm][Ll])")));

// [18] CDSect ::= CDStart CData CDEnd
// REF: xml_spec.md#NT-CDSect L1271
g.rule("CDSect", g.seq(g.ref("CDStart"), g.ref("CData"), g.ref("CDEnd")));

// [19] CDStart ::= '<![CDATA['
// REF: xml_spec.md#NT-CDStart L1272
g.rule("CDStart", g.lit("<![CDATA["));

// [20] CData ::= (Char* - (Char* ']]>' Char*))
// REF: xml_spec.md#NT-CData L1273
g.rule("CData", g.rep(g.exc(g.ref("Char"), g.lit("]]\x3E"))));

// [21] CDEnd ::= ']]>'
// REF: xml_spec.md#NT-CDEnd L1274
g.rule("CDEnd", g.lit("]]\x3E"));

// [22] prolog ::= XMLDecl? Misc* (doctypedecl Misc*)?
// REF: xml_spec.md#NT-prolog L1349
g.rule("prolog", g.seq(g.opt(g.ref("XMLDecl")), g.rep(g.ref("Misc")), g.opt(g.seq(g.ref("doctypedecl"), g.rep(g.ref("Misc"))))));

// [23] XMLDecl ::= '<?xml' VersionInfo EncodingDecl? SDDecl? S? '?>'
// REF: xml_spec.md#NT-XMLDecl L1350
g.rule("XMLDecl", g.seq(g.lit("<?xml"), g.ref("VersionInfo"), g.opt(g.ref("EncodingDecl")), g.opt(g.ref("SDDecl")), g.opt(g.ref("S")), g.lit("?>")));

// [24] VersionInfo ::= S 'version' Eq (("'" VersionNum "'") | ('"' VersionNum "'"))
// REF: xml_spec.md#NT-VersionInfo L1351
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
// REF: xml_spec.md#NT-Eq L1352
g.rule("Eq", g.seq(g.opt(g.ref("S")), g.lit("="), g.opt(g.ref("S"))));

// [26] VersionNum ::= '1.' [0-9]+
// REF: xml_spec.md#NT-VersionNum L1353
g.rule("VersionNum", g.seq(g.lit("1."), g.plus(g.reg("[0-9]"))));

// [27] Misc ::= Comment | PI | S
// REF: xml_spec.md#NT-Misc L1354
g.rule("Misc", g.alt(g.ref("Comment"), g.ref("PI"), g.ref("S")));

// [28] doctypedecl ::= '<!DOCTYPE' S Name (S ExternalID)? S? ('[' intSubset ']' S?)? '>'
// REF: xml_spec.md#NT-doctypedecl L1403
g.rule("doctypedecl", g.seq(g.lit("<!DOCTYPE"), g.ref("S"), g.ref("Name"), g.opt(g.seq(g.ref("S"), g.ref("ExternalID"))), g.opt(g.ref("S")), g.opt(g.seq(g.lit("["), g.ref("intSubset"), g.lit("]"), g.opt(g.ref("S")))), g.lit(">")));

// [28a] DeclSep ::= PEReference | S
// REF: xml_spec.md#NT-DeclSep L1405
g.rule("DeclSep", g.alt(g.ref("PEReference"), g.ref("S")));

// [28b] intSubset ::= (markupdecl | DeclSep)*
// REF: xml_spec.md#NT-intSubset L1406
g.rule("intSubset", g.rep(g.alt(g.ref("markupdecl"), g.ref("DeclSep"))));

// [29] markupdecl ::= elementdecl | AttlistDecl | EntityDecl | NotationDecl | PI | Comment
// REF: xml_spec.md#NT-markupdecl L1407
g.rule("markupdecl", g.alt(g.ref("elementdecl"), g.ref("AttlistDecl"), g.ref("EntityDecl"), g.ref("NotationDecl"), g.ref("PI"), g.ref("Comment")));

// [30] extSubset ::= TextDecl? extSubsetDecl
// REF: xml_spec.md#NT-extSubset L1473
g.rule("extSubset", g.seq(g.opt(g.ref("TextDecl")), g.ref("extSubsetDecl")));

// [31] extSubsetDecl ::= ( markupdecl | conditionalSect | DeclSep)*
// REF: xml_spec.md#NT-extSubsetDecl L1474
g.rule("extSubsetDecl", g.rep(g.alt(g.ref("markupdecl"), g.ref("conditionalSect"), g.ref("DeclSep"))));

// [32] SDDecl ::= S 'standalone' Eq (("'" ('yes' | 'no') "'") | ('"' ('yes' | 'no') "'"))
// REF: xml_spec.md#NT-SDDecl L1519
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
// REF: xml_spec.md#NT-element L2130
g.rule("element", g.alt(g.ref("EmptyElemTag"), g.seq(g.ref("STag"), g.ref("content"), g.ref("ETag"))));

// [40] STag ::= '<' Name (S Attribute)* S? '>'
// REF: xml_spec.md#NT-STag L2259
g.rule("STag", g.seq(g.lit("<"), g.ref("Name"), g.rep(g.seq(g.ref("S"), g.ref("Attribute"))), g.opt(g.ref("S")), g.lit(">")));

// [41] Attribute ::= Name Eq AttValue
// REF: xml_spec.md#NT-Attribute L2260
g.rule("Attribute", g.seq(g.ref("Name"), g.ref("Eq"), g.ref("AttValue")));

// [42] ETag ::= '</' Name S? '>'
// REF: xml_spec.md#NT-ETag L2403
g.rule("ETag", g.seq(g.lit("</"), g.ref("Name"), g.opt(g.ref("S")), g.lit(">")));

// [43] content ::= CharData? ((element | Reference | CDSect | PI | Comment) CharData?)*
// REF: xml_spec.md#NT-content L2433
g.rule("content", g.seq(g.opt(g.ref("CharData")), g.rep(g.seq(g.alt(g.ref("element"), g.ref("Reference"), g.ref("CDSect"), g.ref("PI"), g.ref("Comment")), g.opt(g.ref("CharData"))))));

// [44] EmptyElemTag ::= '<' Name (S Attribute)* S? '/>'
// REF: xml_spec.md#NT-EmptyElemTag L2480
g.rule("EmptyElemTag", g.seq(g.lit("<"), g.ref("Name"), g.rep(g.seq(g.ref("S"), g.ref("Attribute"))), g.opt(g.ref("S")), g.lit("/>")));

// [45] elementdecl ::= '<!ELEMENT' S Name S contentspec S? '>'
// REF: xml_spec.md#NT-elementdecl L2553
g.rule("elementdecl", g.seq(g.lit("<!ELEMENT"), g.ref("S"), g.ref("Name"), g.ref("S"), g.ref("contentspec"), g.opt(g.ref("S")), g.lit(">")));

// [46] contentspec ::= 'EMPTY' | 'ANY' | Mixed | children
// REF: xml_spec.md#NT-contentspec L2554
g.rule("contentspec", g.alt(g.lit("EMPTY"), g.lit("ANY"), g.ref("Mixed"), g.ref("children")));

// [47] children ::= (choice | seq) ('?' | '*' | '+')?
// REF: xml_spec.md#NT-children L2638
g.rule("children", g.seq(g.alt(g.ref("choice"), g.ref("seq")), g.opt(g.reg("[?*+]?"))));

// [48] cp ::= (Name | choice | seq) ('?' | '*' | '+')?
// REF: xml_spec.md#NT-cp L2639
g.rule("cp", g.seq(g.alt(g.ref("Name"), g.ref("choice"), g.ref("seq")), g.opt(g.reg("[?*+]?"))));

// [49] choice ::= '(' S? cp ( S? '|' S? cp )+ S? ')'
// REF: xml_spec.md#NT-choice L2640
g.rule("choice", g.seq(g.lit("("), g.opt(g.ref("S")), g.ref("cp"), g.plus(g.seq(g.opt(g.ref("S")), g.lit("|"), g.opt(g.ref("S")), g.ref("cp"))), g.opt(g.ref("S")), g.lit(")")));

// [50] seq ::= '(' S? cp ( S? ',' S? cp )* S? ')'
// REF: xml_spec.md#NT-seq L2641
g.rule("seq", g.seq(g.lit("("), g.opt(g.ref("S")), g.ref("cp"), g.rep(g.seq(g.opt(g.ref("S")), g.lit(","), g.opt(g.ref("S")), g.ref("cp"))), g.opt(g.ref("S")), g.lit(")")));

// [51] Mixed ::= '(' S? '#PCDATA' (S? '|' S? Name)* S? ')*' | '(' S? '#PCDATA' S? ')'
// REF: xml_spec.md#NT-Mixed L2826
g.rule("Mixed", g.alt(
    g.seq(g.lit("("), g.opt(g.ref("S")), g.lit("#PCDATA"), g.rep(g.seq(g.opt(g.ref("S")), g.lit("|"), g.opt(g.ref("S")), g.ref("Name"))), g.opt(g.ref("S")), g.lit(")*")),
    g.seq(g.lit("("), g.opt(g.ref("S")), g.lit("#PCDATA"), g.opt(g.ref("S")), g.lit(")"))
));

// [52] AttlistDecl ::= '<!ATTLIST' S Name AttDef* S? '>'
// REF: xml_spec.md#NT-AttlistDecl L2926
g.rule("AttlistDecl", g.seq(g.lit("<!ATTLIST"), g.ref("S"), g.ref("Name"), g.rep(g.ref("AttDef")), g.opt(g.ref("S")), g.lit(">")));

// [53] AttDef ::= S Name S AttType S DefaultDecl
// REF: xml_spec.md#NT-AttDef L2927
g.rule("AttDef", g.seq(g.ref("S"), g.ref("Name"), g.ref("S"), g.ref("AttType"), g.ref("S"), g.ref("DefaultDecl")));

// [54] AttType ::= StringType | TokenizedType | EnumeratedType
// REF: xml_spec.md#NT-AttType L3004
g.rule("AttType", g.alt(g.ref("StringType"), g.ref("TokenizedType"), g.ref("EnumeratedType")));

// [55] StringType ::= 'CDATA'
// REF: xml_spec.md#NT-StringType L3005
g.rule("StringType", g.lit("CDATA"));

// [56] TokenizedType ::= 'ID' | 'IDREF' | 'IDREFS' | 'ENTITY' | 'ENTITIES' | 'NMTOKEN' | 'NMTOKENS'
// REF: xml_spec.md#NT-TokenizedType L3006
g.rule("TokenizedType", g.alt(g.lit("ID"), g.lit("IDREF"), g.lit("IDREFS"), g.lit("ENTITY"), g.lit("ENTITIES"), g.lit("NMTOKEN"), g.lit("NMTOKENS")));

// [57] EnumeratedType ::= NotationType | Enumeration
// REF: xml_spec.md#NT-EnumeratedType L3200
g.rule("EnumeratedType", g.alt(g.ref("NotationType"), g.ref("Enumeration")));

// [58] NotationType ::= 'NOTATION' S '(' S? Name (S? '|' S? Name)* S? ')'
// REF: xml_spec.md#NT-NotationType L3201
g.rule("NotationType", g.seq(g.lit("NOTATION"), g.ref("S"), g.lit("("), g.opt(g.ref("S")), g.ref("Name"), g.rep(g.seq(g.opt(g.ref("S")), g.lit("|"), g.opt(g.ref("S")), g.ref("Name"))), g.opt(g.ref("S")), g.lit(")")));

// [59] Enumeration ::= '(' S? Nmtoken (S? '|' S? Nmtoken)* S? ')'
// REF: xml_spec.md#NT-Enumeration L3206
g.rule("Enumeration", g.seq(g.lit("("), g.opt(g.ref("S")), g.ref("Nmtoken"), g.rep(g.seq(g.opt(g.ref("S")), g.lit("|"), g.opt(g.ref("S")), g.ref("Nmtoken"))), g.opt(g.ref("S")), g.lit(")")));

// [60] DefaultDecl ::= '#REQUIRED' | '#IMPLIED' | (('#FIXED' S)? AttValue)
// REF: xml_spec.md#NT-DefaultDecl L3369
g.rule("DefaultDecl", g.alt(g.lit("#REQUIRED"), g.lit("#IMPLIED"), g.seq(g.opt(g.seq(g.lit("#FIXED"), g.ref("S"))), g.ref("AttValue"))));

// [61] conditionalSect ::= includeSect | ignoreSect
// REF: xml_spec.md#NT-conditionalSect L2127
g.rule("conditionalSect", g.alt(g.ref("includeSect"), g.ref("ignoreSect")));

// [62] includeSect ::= '<![' S? 'INCLUDE' S? '[' extSubsetDecl ']]>'
// REF: xml_spec.md#NT-includeSect L2128
g.rule("includeSect", g.seq(g.lit("<!["), g.opt(g.ref("S")), g.lit("INCLUDE"), g.opt(g.ref("S")), g.lit("["), g.ref("extSubsetDecl"), g.lit("]]\x3E")));

// [63] ignoreSect ::= '<![' S? 'IGNORE' S? '[' ignoreSectContents* ']]>'
// REF: xml_spec.md#NT-ignoreSect L2129
g.rule("ignoreSect", g.seq(g.lit("<!["), g.opt(g.ref("S")), g.lit("IGNORE"), g.opt(g.ref("S")), g.lit("["), g.rep(g.ref("ignoreSectContents")), g.lit("]]\x3E")));

// [64] ignoreSectContents ::= Ignore ('<![' ignoreSectContents ']]>' Ignore)*
// REF: xml_spec.md#NT-ignoreSectContents L2130
g.rule("ignoreSectContents", g.seq(g.ref("Ignore"), g.rep(g.seq(g.lit("<!["), g.ref("ignoreSectContents"), g.lit("]]\x3E"), g.ref("Ignore")))));

// [65] Ignore ::= Char* - (Char* ('<![' | ']]>') Char*)
// REF: xml_spec.md#NT-Ignore L2131
g.rule("Ignore", g.rep(g.exc(g.ref("Char"), g.reg("(<!\\[|]]\\x3E)"))));

// [66] CharRef ::= '&#' [0-9]+ ';' | '&#x' [0-9a-fA-F]+ ';'
// REF: xml_spec.md#NT-CharRef L2241
g.rule("CharRef", g.alt(g.seq(g.lit("&#"), g.plus(g.reg("[0-9]")), g.lit(";")),
 g.seq(g.lit("&#x"), g.plus(g.reg("[0-9a-fA-F]")), g.lit(";"))));

// [67] Reference ::= EntityRef | CharRef
// REF: xml_spec.md#NT-Reference L2271
g.rule("Reference", g.alt(g.ref("EntityRef"), g.ref("CharRef")));

// [68] EntityRef ::= '&' Name ';'
// REF: xml_spec.md#NT-EntityRef L2272
g.rule("EntityRef", g.seq(g.lit("&"), g.ref("Name"), g.lit(";")));

// [69] PEReference ::= '%' Name ';'
// REF: xml_spec.md#NT-PEReference L2276
g.rule("PEReference", g.seq(g.lit("%"), g.ref("Name"), g.lit(";")));

// [70] EntityDecl ::= GEDecl | PEDecl
// REF: xml_spec.md#NT-EntityDecl L2389
g.rule("EntityDecl", g.alt(g.ref("GEDecl"), g.ref("PEDecl")));

// [71] GEDecl ::= '<!ENTITY' S Name S EntityDef S? '>'
// REF: xml_spec.md#NT-GEDecl L2390
g.rule("GEDecl", g.seq(g.lit("<!ENTITY"), g.ref("S"), g.ref("Name"), g.ref("S"), g.ref("EntityDef"), g.opt(g.ref("S")), g.lit(">")));

// [72] PEDecl ::= '<!ENTITY' S '%' S Name S PEDef S? '>'
// REF: xml_spec.md#NT-PEDecl L2391
g.rule("PEDecl", g.seq(g.lit("<!ENTITY"), g.ref("S"), g.lit("%"), g.ref("S"), g.ref("Name"), g.ref("S"), g.ref("PEDef"), g.opt(g.ref("S")), g.lit(">")));

// [73] EntityDef ::= EntityValue | (ExternalID NDataDecl?)
// REF: xml_spec.md#NT-EntityDef L2392
g.rule("EntityDef", g.alt(g.ref("EntityValue"), g.seq(g.ref("ExternalID"), g.opt(g.ref("NDataDecl")))));

// [74] PEDef ::= EntityValue | ExternalID
// REF: xml_spec.md#NT-PEDef L2393
g.rule("PEDef", g.alt(g.ref("EntityValue"), g.ref("ExternalID")));

// [75] ExternalID ::= 'SYSTEM' S SystemLiteral | 'PUBLIC' S PubidLiteral S SystemLiteral
// REF: xml_spec.md#NT-ExternalID L2439
g.rule("ExternalID", g.alt(g.seq(g.lit("SYSTEM"), g.ref("S"), g.ref("SystemLiteral")), g.seq(g.lit("PUBLIC"), g.ref("S"), g.ref("PubidLiteral"), g.ref("S"), g.ref("SystemLiteral"))));

// [76] NDataDecl ::= S 'NDATA' S Name
// REF: xml_spec.md#NT-NDataDecl L2441
g.rule("NDataDecl", g.seq(g.ref("S"), g.lit("NDATA"), g.ref("S"), g.ref("Name")));

// [77] TextDecl ::= '<?xml' VersionInfo? EncodingDecl S? '?>'
// REF: xml_spec.md#NT-TextDecl L2568
g.rule("TextDecl", g.seq(g.lit("<?xml"), g.opt(g.ref("VersionInfo")), g.ref("EncodingDecl"), g.opt(g.ref("S")), g.lit("?>")));

// [78] extParsedEnt ::= TextDecl? content
// REF: xml_spec.md#NT-extParsedEnt L2601
g.rule("extParsedEnt", g.seq(g.opt(g.ref("TextDecl")), g.ref("content")));

// [80] EncodingDecl ::= S 'encoding' Eq ('"' EncName "'" | "'" EncName "'")
// REF: xml_spec.md#NT-EncodingDecl L2654
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
// REF: xml_spec.md#NT-EncName L2655
g.rule("EncName", g.seq(g.reg("[A-Za-z]"), g.rep(g.reg("[A-Za-z0-9._-]"))));

// [82] NotationDecl ::= '<!NOTATION' S Name S (ExternalID | PublicID) S? '>'
// REF: xml_spec.md#NT-NotationDecl L3101
g.rule("NotationDecl", g.seq(g.lit("<!NOTATION"), g.ref("S"), g.ref("Name"), g.ref("S"), g.alt(g.ref("ExternalID"), g.ref("PublicID")), g.opt(g.ref("S")), g.lit(">")));

// [83] PublicID ::= 'PUBLIC' S PubidLiteral
// REF: xml_spec.md#NT-PublicID L3102
g.rule("PublicID", g.seq(g.lit("PUBLIC"), g.ref("S"), g.ref("PubidLiteral")));

// [1] document ::= prolog element Misc*
//
// Summary:
// - Single Root Element: There is exactly one root element that contains all other elements within the document.
// - Proper Nesting: All elements must be correctly nested, with start and end tags forming non-overlapping, paired structures.
// - Clear Parent-Child Hierarchy: Every non-root element has exactly one parent, creating a well-defined tree structure.
// REF: xml_spec.md#NT-document L432
g.rule("document", g.seq(g.ref("prolog"), g.ref("element"), g.rep(g.ref("Misc"))));

export { g };
