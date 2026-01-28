import { Grammar } from './parser';

const g = new Grammar();

const SQ = "\u0027"; // Single Quote '
const DQ = "\u0022"; // Double Quote "

// [2] Char
g.rule("Char", g.reg("\t|\n|\r|[\u0020-\uD7FF]|[\uE000-\uFFFD]|[\uD800-\uDBFF][\uDC00-\uDFFF]"));

// [3] S
g.rule("S", g.plus(g.reg("[\x20\t\r\n]")));

// [4] NameStartChar
g.rule("NameStartChar", g.alt(
    g.lit(":"), g.reg("[A-Z]"), g.lit("_"), g.reg("[a-z]"),
    g.reg("[\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]"),
    g.reg("[\uD800-\uDB7F][\uDC00-\uDFFF]")
));

// [4a] NameChar
g.rule("NameChar", g.alt(
    g.ref("NameStartChar"), g.lit("-"), g.lit("."), g.reg("[0-9]"), g.lit("\u00B7"),
    g.reg("[\u0300-\u036F\u203F-\u2040]")
));

// [5] Name
g.rule("Name", g.seq(g.ref("NameStartChar"), g.rep(g.ref("NameChar"))));

// [6] Names
g.rule("Names", g.seq(g.ref("Name"), g.rep(g.seq(g.lit("\x20"), g.ref("Name")))));

// [7] Nmtoken
g.rule("Nmtoken", g.plus(g.ref("NameChar")));

// [8] Nmtokens
g.rule("Nmtokens", g.seq(g.ref("Nmtoken"), g.rep(g.seq(g.lit("\x20"), g.ref("Nmtoken")))));

// [9] EntityValue
g.rule("EntityValue", g.alt(
    g.seq(g.lit(DQ), g.rep(g.alt(g.reg("[^%&\"]"), g.ref("PEReference"), g.ref("Reference"))), g.lit(DQ)),
    g.seq(g.lit(SQ), g.rep(g.alt(g.reg("[^%&']"), g.ref("PEReference"), g.ref("Reference"))), g.lit(SQ))
));

// [10] AttValue
g.rule("AttValue", g.alt(
    g.seq(g.lit(DQ), g.rep(g.alt(g.reg("[^<&\"]"), g.ref("Reference"))), g.lit(DQ)),
    g.seq(g.lit(SQ), g.rep(g.alt(g.reg("[^<&']"), g.ref("Reference"))), g.lit(SQ))
));

// [11] SystemLiteral
g.rule("SystemLiteral", g.alt(
    g.seq(g.lit(DQ), g.reg("[^\"]*"), g.lit(DQ)),
    g.seq(g.lit(SQ), g.reg("[^']*"), g.lit(SQ))
));

// [12] PubidLiteral
g.rule("PubidLiteral", g.alt(
    g.seq(g.lit(DQ), g.rep(g.ref("PubidChar")), g.lit(DQ)),
    g.seq(g.lit(SQ), g.rep(g.exc(g.ref("PubidChar"), g.lit(SQ))), g.lit(SQ))
));

// [13] PubidChar
g.rule("PubidChar", g.reg("[\x20\r\na-zA-Z0-9\-\'()+,./:=?;!*#@$_%]"));

// [14] CharData
g.rule("CharData", g.rep(g.exc(g.reg("[^<&]"), g.lit("]]>"))));

// [15] Comment
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

// [16] PI
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

// [17] PITarget
g.rule("PITarget", g.exc(g.ref("Name"), g.reg("([Xx][Mm][Ll])")));

// [18] CDSect
g.rule("CDSect", g.seq(g.ref("CDStart"), g.ref("CData"), g.ref("CDEnd")));
// [19] CDStart
g.rule("CDStart", g.lit("<![CDATA["));
// [20] CData
g.rule("CData", g.rep(g.exc(g.ref("Char"), g.lit("]]>"))));
// [21] CDEnd
g.rule("CDEnd", g.lit("]]>"));

// [22] prolog
g.rule("prolog", g.seq(g.opt(g.ref("XMLDecl")), g.rep(g.ref("Misc")), g.opt(g.seq(g.ref("doctypedecl"), g.rep(g.ref("Misc"))))));

// [23] XMLDecl
g.rule("XMLDecl", g.seq(g.lit("<?xml"), g.ref("VersionInfo"), g.opt(g.ref("EncodingDecl")), g.opt(g.ref("SDDecl")), g.opt(g.ref("S")), g.lit("?>")));

// [24] VersionInfo
g.rule("VersionInfo", g.seq(
    g.ref("S"),
    g.lit("version"),
    g.ref("Eq"),
    g.alt(
        g.seq(g.lit(SQ), g.ref("VersionNum"), g.lit(SQ)),
        g.seq(g.lit(DQ), g.ref("VersionNum"), g.lit(DQ))
    )
));

// [25] Eq
g.rule("Eq", g.seq(g.opt(g.ref("S")), g.lit("="), g.opt(g.ref("S"))));

// [26] VersionNum
g.rule("VersionNum", g.seq(g.lit("1."), g.plus(g.reg("[0-9]"))));

// [27] Misc
g.rule("Misc", g.alt(g.ref("Comment"), g.ref("PI"), g.ref("S")));

// [28] doctypedecl
g.rule("doctypedecl", g.seq(g.lit("<!DOCTYPE"), g.ref("S"), g.ref("Name"), g.opt(g.seq(g.ref("S"), g.ref("ExternalID"))), g.opt(g.ref("S")), g.opt(g.seq(g.lit("["), g.ref("intSubset"), g.lit("]"), g.opt(g.ref("S")))), g.lit(">")));

// [28a] DeclSep
g.rule("DeclSep", g.alt(g.ref("PEReference"), g.ref("S")));

// [28b] intSubset
g.rule("intSubset", g.rep(g.alt(g.ref("markupdecl"), g.ref("DeclSep"))));

// [29] markupdecl
g.rule("markupdecl", g.alt(g.ref("elementdecl"), g.ref("AttlistDecl"), g.ref("EntityDecl"), g.ref("NotationDecl"), g.ref("PI"), g.ref("Comment")));

// [30] extSubset
g.rule("extSubset", g.seq(g.opt(g.ref("TextDecl")), g.ref("extSubsetDecl")));

// [31] extSubsetDecl
g.rule("extSubsetDecl", g.rep(g.alt(g.ref("markupdecl"), g.ref("conditionalSect"), g.ref("DeclSep"))));

// [32] SDDecl
g.rule("SDDecl", g.seq(
    g.ref("S"),
    g.lit("standalone"),
    g.ref("Eq"),
    g.alt(
        g.seq(g.lit(SQ), g.alt(g.lit("yes"), g.lit("no")), g.lit(SQ)),
        g.seq(g.lit(DQ), g.alt(g.lit("yes"), g.lit("no")), g.lit(DQ))
    )
));

// [39] element
g.rule("element", g.alt(g.ref("EmptyElemTag"), g.seq(g.ref("STag"), g.ref("content"), g.ref("ETag"))));

// [40] STag
g.rule("STag", g.seq(g.lit("<"), g.ref("Name"), g.rep(g.seq(g.ref("S"), g.ref("Attribute"))), g.opt(g.ref("S")), g.lit(">")));

// [41] Attribute
g.rule("Attribute", g.seq(g.ref("Name"), g.ref("Eq"), g.ref("AttValue")));

// [42] ETag
g.rule("ETag", g.seq(g.lit("</"), g.ref("Name"), g.opt(g.ref("S")), g.lit(">")));

// [43] content
g.rule("content", g.seq(g.opt(g.ref("CharData")), g.rep(g.seq(g.alt(g.ref("element"), g.ref("Reference"), g.ref("CDSect"), g.ref("PI"), g.ref("Comment")), g.opt(g.ref("CharData"))))));

// [44] EmptyElemTag
g.rule("EmptyElemTag", g.seq(g.lit("<"), g.ref("Name"), g.rep(g.seq(g.ref("S"), g.ref("Attribute"))), g.opt(g.ref("S")), g.lit("/>")));

// [45] elementdecl
g.rule("elementdecl", g.seq(g.lit("<!ELEMENT"), g.ref("S"), g.ref("Name"), g.ref("S"), g.ref("contentspec"), g.opt(g.ref("S")), g.lit(">")));

// [46] contentspec
g.rule("contentspec", g.alt(g.lit("EMPTY"), g.lit("ANY"), g.ref("Mixed"), g.ref("children")));

// [47] children
g.rule("children", g.seq(g.alt(g.ref("choice"), g.ref("seq")), g.opt(g.reg("[?*+]?"))));

// [48] cp
g.rule("cp", g.seq(g.alt(g.ref("Name"), g.ref("choice"), g.ref("seq")), g.opt(g.reg("[?*+]?"))));

// [49] choice
g.rule("choice", g.seq(g.lit("("), g.opt(g.ref("S")), g.ref("cp"), g.plus(g.seq(g.opt(g.ref("S")), g.lit("|"), g.opt(g.ref("S")), g.ref("cp"))), g.opt(g.ref("S")), g.lit(")")));

// [50] seq
g.rule("seq", g.seq(g.lit("("), g.opt(g.ref("S")), g.ref("cp"), g.rep(g.seq(g.opt(g.ref("S")), g.lit(","), g.opt(g.ref("S")), g.ref("cp"))), g.opt(g.ref("S")), g.lit(")")));

// [51] Mixed
g.rule("Mixed", g.alt(
    g.seq(g.lit("("), g.opt(g.ref("S")), g.lit("#PCDATA"), g.rep(g.seq(g.opt(g.ref("S")), g.lit("|"), g.opt(g.ref("S")), g.ref("Name"))), g.opt(g.ref("S")), g.lit(")*")),
    g.seq(g.lit("("), g.opt(g.ref("S")), g.lit("#PCDATA"), g.opt(g.ref("S")), g.lit(")"))
));

// [52] AttlistDecl
g.rule("AttlistDecl", g.seq(g.lit("<!ATTLIST"), g.ref("S"), g.ref("Name"), g.rep(g.ref("AttDef")), g.opt(g.ref("S")), g.lit(">")));

// [53] AttDef
g.rule("AttDef", g.seq(g.ref("S"), g.ref("Name"), g.ref("S"), g.ref("AttType"), g.ref("S"), g.ref("DefaultDecl")));

// [54] AttType
g.rule("AttType", g.alt(g.ref("StringType"), g.ref("TokenizedType"), g.ref("EnumeratedType")));

// [55] StringType
g.rule("StringType", g.lit("CDATA"));

// [56] TokenizedType
g.rule("TokenizedType", g.alt(g.lit("ID"), g.lit("IDREF"), g.lit("IDREFS"), g.lit("ENTITY"), g.lit("ENTITIES"), g.lit("NMTOKEN"), g.lit("NMTOKENS")));

// [57] EnumeratedType
g.rule("EnumeratedType", g.alt(g.ref("NotationType"), g.ref("Enumeration")));

// [58] NotationType
g.rule("NotationType", g.seq(g.lit("NOTATION"), g.ref("S"), g.lit("("), g.opt(g.ref("S")), g.ref("Name"), g.rep(g.seq(g.opt(g.ref("S")), g.lit("|"), g.opt(g.ref("S")), g.ref("Name"))), g.opt(g.ref("S")), g.lit(")")));

// [59] Enumeration
g.rule("Enumeration", g.seq(g.lit("("), g.opt(g.ref("S")), g.ref("Nmtoken"), g.rep(g.seq(g.opt(g.ref("S")), g.lit("|"), g.opt(g.ref("S")), g.ref("Nmtoken"))), g.opt(g.ref("S")), g.lit(")")));

// [60] DefaultDecl
g.rule("DefaultDecl", g.alt(g.lit("#REQUIRED"), g.lit("#IMPLIED"), g.seq(g.opt(g.seq(g.lit("#FIXED"), g.ref("S"))), g.ref("AttValue"))));

// [61] conditionalSect
g.rule("conditionalSect", g.alt(g.ref("includeSect"), g.ref("ignoreSect")));

// [62] includeSect
g.rule("includeSect", g.seq(g.lit("<!["), g.opt(g.ref("S")), g.lit("INCLUDE"), g.opt(g.ref("S")), g.lit("["), g.ref("extSubsetDecl"), g.lit("]]")));

// [63] ignoreSect
g.rule("ignoreSect", g.seq(g.lit("<!["), g.opt(g.ref("S")), g.lit("IGNORE"), g.opt(g.ref("S")), g.lit("["), g.rep(g.ref("ignoreSectContents")), g.lit("]]")));

// [64] ignoreSectContents
g.rule("ignoreSectContents", g.seq(g.ref("Ignore"), g.rep(g.seq(g.lit("<!["), g.ref("ignoreSectContents"), g.lit("]]"), g.ref("Ignore")))));

// [65] Ignore
g.rule("Ignore", g.exc(g.rep(g.ref("Char")), g.seq(g.rep(g.ref("Char")), g.reg("(<!\[|]]>)"), g.rep(g.ref("Char")))));

// [66] CharRef
g.rule("CharRef", g.alt(g.seq(g.lit("&#"), g.plus(g.reg("[0-9]")), g.lit(";")),
 g.seq(g.lit("&#x"), g.plus(g.reg("[0-9a-fA-F]")), g.lit(";"))));

// [67] Reference
g.rule("Reference", g.alt(g.ref("EntityRef"), g.ref("CharRef")));

// [68] EntityRef
g.rule("EntityRef", g.seq(g.lit("&"), g.ref("Name"), g.lit(";")));

// [69] PEReference
g.rule("PEReference", g.seq(g.lit("%"), g.ref("Name"), g.lit(";")));

// [70] EntityDecl
g.rule("EntityDecl", g.alt(g.ref("GEDecl"), g.ref("PEDecl")));

// [71] GEDecl
g.rule("GEDecl", g.seq(g.lit("<!ENTITY"), g.ref("S"), g.ref("Name"), g.ref("S"), g.ref("EntityDef"), g.opt(g.ref("S")), g.lit(">")));

// [72] PEDecl
g.rule("PEDecl", g.seq(g.lit("<!ENTITY"), g.ref("S"), g.lit("%"), g.ref("S"), g.ref("Name"), g.ref("S"), g.ref("PEDef"), g.opt(g.ref("S")), g.lit(">")));

// [73] EntityDef
g.rule("EntityDef", g.alt(g.ref("EntityValue"), g.seq(g.ref("ExternalID"), g.opt(g.ref("NDataDecl")))));

// [74] PEDef
g.rule("PEDef", g.alt(g.ref("EntityValue"), g.ref("ExternalID")));

// [75] ExternalID
g.rule("ExternalID", g.alt(g.seq(g.lit("SYSTEM"), g.ref("S"), g.ref("SystemLiteral")), g.seq(g.lit("PUBLIC"), g.ref("S"), g.ref("PubidLiteral"), g.ref("S"), g.ref("SystemLiteral"))));

// [76] NDataDecl
g.rule("NDataDecl", g.seq(g.ref("S"), g.lit("NDATA"), g.ref("S"), g.ref("Name")));

// [77] TextDecl
g.rule("TextDecl", g.seq(g.lit("<?xml"), g.opt(g.ref("VersionInfo")), g.ref("EncodingDecl"), g.opt(g.ref("S")), g.lit("?>")));

// [78] extParsedEnt
g.rule("extParsedEnt", g.seq(g.opt(g.ref("TextDecl")), g.ref("content")));

// [80] EncodingDecl
g.rule("EncodingDecl", g.seq(
    g.ref("S"),
    g.lit("encoding"),
    g.ref("Eq"),
    g.alt(
        g.seq(g.lit(DQ), g.ref("EncName"), g.lit(DQ)),
        g.seq(g.lit(SQ), g.ref("EncName"), g.lit(SQ))
    )
));

// [81] EncName
g.rule("EncName", g.seq(g.reg("[A-Za-z]"), g.rep(g.reg("[A-Za-z0-9._-]"))));

// [82] NotationDecl
g.rule("NotationDecl", g.seq(g.lit("<!NOTATION"), g.ref("S"), g.ref("Name"), g.ref("S"), g.alt(g.ref("ExternalID"), g.ref("PublicID")), g.opt(g.ref("S")), g.lit(">")));

// [83] PublicID
g.rule("PublicID", g.seq(g.lit("PUBLIC"), g.ref("S"), g.ref("PubidLiteral")));

// [1] document
g.rule("document", g.seq(g.ref("prolog"), g.ref("element"), g.rep(g.ref("Misc"))));

export { g };
