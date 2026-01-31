"use strict";
(() => {
  // src/core/ast/xml-ast.ts
  var ASTComment = class {
    constructor(content) {
      this.content = content;
      this.cst = null;
    }
    text() {
      return "";
    }
  };
  var ASTCDATA = class {
    constructor(content) {
      this.content = content;
      this.cst = null;
    }
    text() {
      return this.content;
    }
  };
  var AST = class _AST {
    constructor(tagName, attributes = {}, children = []) {
      this.tagName = tagName;
      this.attributes = attributes;
      this.children = children;
      /** Reference to the CST node that generated this AST node. */
      this.cst = null;
    }
    // Get attribute value by name
    attr(name) {
      return this.attributes[name];
    }
    // Get all text content from children, concatenated
    text() {
      return this.children.map((c) => {
        if (typeof c === "string") return c;
        return c.text();
      }).join("");
    }
    // Find all descendant elements with the given tag name (simple XPath-like)
    find(tagName) {
      let results = [];
      for (const child of this.children) {
        if (child instanceof _AST) {
          if (child.tagName === tagName) {
            results.push(child);
          }
          results = results.concat(child.find(tagName));
        }
      }
      return results;
    }
  };

  // src/core/cst/xml-cst.ts
  var CST = class {
    constructor(type, name, start, end, children = [], wellFormed = true) {
      this.type = type;
      this.name = name;
      this.start = start;
      this.end = end;
      this.children = children;
      this.wellFormed = wellFormed;
      /**
       * Reference to the parent node in the syntax tree.
       * Null if this is the root node.
       */
      this.parent = null;
      for (const child of children) {
        child.parent = this;
      }
    }
    /**
     * Retrieves the substring matching this node from the entire original input string.
     */
    getText(input) {
      return input.slice(this.start, this.end);
    }
    /**
     * Shifts the start and end positions of this node and its children.
     * @param pos The position where the change occurred.
     * @param delta The change in length.
     */
    shift(pos, delta) {
      if (delta > 0) {
        if (this.start >= pos) {
          this.start += delta;
        }
        if (this.end > pos) {
          this.end += delta;
        }
      } else {
        const deleteEnd = pos - delta;
        if (this.start >= deleteEnd) {
          this.start += delta;
        } else if (this.start > pos) {
          this.start = pos;
        }
        if (this.end >= deleteEnd) {
          this.end += delta;
        } else if (this.end > pos) {
          this.end = pos;
        }
      }
      for (const child of this.children) {
        child.shift(pos, delta);
      }
    }
    /**
     * Unwraps single-child Reference nodes to find the underlying structural node.
     */
    unwrap() {
      let current = this;
      while (current.children.length === 1 && current.children[0].start === current.start && current.children[0].end === current.end) {
        current = current.children[0];
      }
      return current;
    }
  };

  // src/core/cst/parser.ts
  var Parser = class {
    constructor(grammar2) {
      this.grammar = grammar2;
    }
    parse(input, rootRule) {
      const startRule = rootRule || this.grammar.rootRule;
      const ctx = { input, pos: 0, grammar: this.grammar };
      const rootExpr = { type: "Reference", name: startRule };
      const result = this.execute(rootExpr, ctx);
      if (result && ctx.pos === input.length) {
        return result;
      }
      return null;
    }
    /**
     * Parses the input starting from a specific position using a given rule.
     * Useful for incremental parsing.
     */
    parseAt(input, pos, ruleName) {
      const ctx = { input, pos, grammar: this.grammar };
      const rootExpr = { type: "Reference", name: ruleName };
      const result = this.execute(rootExpr, ctx);
      if (result) {
        return { node: result, end: ctx.pos };
      }
      return null;
    }
    execute(expr, ctx) {
      switch (expr.type) {
        case "Literal":
          return this.execLiteral(expr, ctx);
        case "RegExpMatch":
          return this.execRegExp(expr, ctx);
        case "Sequence":
          return this.execSequence(expr, ctx);
        case "Choice":
          return this.execChoice(expr, ctx);
        case "Repeat":
          return this.execRepeat(expr, ctx);
        case "Exclusion":
          return this.execExclusion(expr, ctx);
        case "Reference":
          return this.execReference(expr, ctx);
      }
    }
    execLiteral(expr, ctx) {
      if (ctx.input.startsWith(expr.value, ctx.pos)) {
        const start = ctx.pos;
        ctx.pos += expr.value.length;
        return new CST("literal", void 0, start, ctx.pos);
      }
      return null;
    }
    execRegExp(expr, ctx) {
      const regex = new RegExp(expr.pattern, "y");
      regex.lastIndex = ctx.pos;
      const match = regex.exec(ctx.input);
      if (match) {
        const start = ctx.pos;
        ctx.pos += match[0].length;
        return new CST("regex", void 0, start, ctx.pos);
      }
      return null;
    }
    execSequence(expr, ctx) {
      const startPos = ctx.pos;
      const children = [];
      let wellFormed = true;
      for (const childExpr of expr.expressions) {
        const result = this.execute(childExpr, ctx);
        if (result === null) {
          ctx.pos = startPos;
          return null;
        }
        children.push(result);
        if (!result.wellFormed) {
          wellFormed = false;
        }
      }
      return new CST(
        "sequence",
        void 0,
        startPos,
        ctx.pos,
        children,
        wellFormed
      );
    }
    execChoice(expr, ctx) {
      for (const childExpr of expr.expressions) {
        const startPos = ctx.pos;
        const result = this.execute(childExpr, ctx);
        if (result !== null) {
          return result;
        }
        ctx.pos = startPos;
      }
      return null;
    }
    execRepeat(expr, ctx) {
      const startPos = ctx.pos;
      const children = [];
      let count = 0;
      let wellFormed = true;
      while (count < expr.max) {
        const checkpoint = ctx.pos;
        const result = this.execute(expr.expression, ctx);
        if (result === null || ctx.pos === checkpoint) break;
        children.push(result);
        if (!result.wellFormed) {
          wellFormed = false;
        }
        count++;
      }
      if (count < expr.min) {
        ctx.pos = startPos;
        return null;
      }
      return new CST(
        "repeat",
        void 0,
        startPos,
        ctx.pos,
        children,
        wellFormed
      );
    }
    execExclusion(expr, ctx) {
      const startPos = ctx.pos;
      const resultA = this.execute(expr.a, ctx);
      if (resultA === null) return null;
      const endPosA = ctx.pos;
      ctx.pos = startPos;
      const resultB = this.execute(expr.b, ctx);
      if (resultB !== null && startPos + (resultB.end - resultB.start) >= endPosA) {
        ctx.pos = startPos;
        return null;
      }
      ctx.pos = endPosA;
      return resultA;
    }
    execReference(expr, ctx) {
      const rule = ctx.grammar.rules[expr.name];
      if (!rule) return null;
      const result = this.execute(rule, ctx);
      if (result === null) return null;
      const node = new CST(
        result.type,
        expr.name,
        result.start,
        result.end,
        [result],
        result.wellFormed
      );
      const validator = ctx.grammar.validators[expr.name];
      if (validator) {
        if (!validator(node, ctx.input)) {
          node.wellFormed = false;
        }
      }
      return node;
    }
  };

  // src/core/cst/grammar.ts
  var lit = (value) => ({ type: "Literal", value });
  var reg = (pattern) => ({
    type: "RegExpMatch",
    pattern
  });
  var seq = (...expressions) => ({
    type: "Sequence",
    expressions
  });
  var alt = (...expressions) => ({
    type: "Choice",
    expressions
  });
  var rep = (expression) => ({
    type: "Repeat",
    expression,
    min: 0,
    max: Infinity
  });
  var plus = (expression) => ({
    type: "Repeat",
    expression,
    min: 1,
    max: Infinity
  });
  var opt = (expression) => ({
    type: "Repeat",
    expression,
    min: 0,
    max: 1
  });
  var exc = (a, b) => ({
    type: "Exclusion",
    a,
    b
  });
  var ref = (name) => ({ type: "Reference", name });
  var Grammar = class {
    constructor(rules, validators, rootRule) {
      this.rules = rules;
      this.validators = validators;
      this.rootRule = rootRule;
    }
  };
  var GrammarBuilder = class {
    constructor() {
      this.rules = {};
      this.validators = {};
      this.rootRule = null;
    }
    rule(name, expression) {
      if (this.rootRule === null) {
        this.rootRule = name;
      }
      this.rules[name] = expression;
    }
    verifyRule(name, validator) {
      if (!this.rules[name]) {
        throw new Error(`Rule ${name} not found`);
      }
      this.validators[name] = validator;
    }
    build(rootRule) {
      const root = rootRule || this.rootRule;
      if (!root) {
        throw new Error("No root rule defined");
      }
      return new Grammar({ ...this.rules }, { ...this.validators }, root);
    }
  };

  // src/core/cst/xml-grammar.ts
  var g = new GrammarBuilder();
  var SQ = "'";
  var DQ = '"';
  g.rule("document", seq(ref("prolog"), ref("element"), rep(ref("Misc"))));
  g.rule(
    "Char",
    reg(
      "	|\n|\r|[ -\uD7FF]|[\uE000-\uFFFD]|[\uD800-\uDBFF][\uDC00-\uDFFF]"
    )
  );
  g.rule("S", plus(reg("[ 	\r\n]")));
  g.rule(
    "NameStartChar",
    alt(
      lit(":"),
      reg("[A-Z]"),
      lit("_"),
      reg("[a-z]"),
      reg(
        "[\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]"
      ),
      reg("[\uD800-\uDB7F][\uDC00-\uDFFF]")
    )
  );
  g.rule(
    "NameChar",
    alt(
      ref("NameStartChar"),
      lit("-"),
      lit("."),
      reg("[0-9]"),
      lit("\xB7"),
      reg("[\u0300-\u036F\u203F-\u2040]")
    )
  );
  g.rule("Name", seq(ref("NameStartChar"), rep(ref("NameChar"))));
  g.rule("Names", seq(ref("Name"), rep(seq(lit(" "), ref("Name")))));
  g.rule("Nmtoken", plus(ref("NameChar")));
  g.rule("Nmtokens", seq(ref("Nmtoken"), rep(seq(lit(" "), ref("Nmtoken")))));
  g.rule(
    "EntityValue",
    alt(
      seq(
        lit(DQ),
        rep(alt(reg("[^%&\\x22]"), ref("PEReference"), ref("Reference"))),
        lit(DQ)
      ),
      seq(
        lit(SQ),
        rep(alt(reg("[^%&\\x27]"), ref("PEReference"), ref("Reference"))),
        lit(SQ)
      )
    )
  );
  g.rule(
    "AttValue",
    alt(
      seq(lit(DQ), rep(alt(reg("[^<&\\x22]"), ref("Reference"))), lit(DQ)),
      seq(lit(SQ), rep(alt(reg("[^<&\\x27]"), ref("Reference"))), lit(SQ))
    )
  );
  g.rule(
    "SystemLiteral",
    alt(
      seq(lit(DQ), reg("[^\\x22]*"), lit(DQ)),
      seq(lit(SQ), reg("[^\\x27]*"), lit(SQ))
    )
  );
  g.rule(
    "PubidLiteral",
    alt(
      seq(lit(DQ), rep(ref("PubidChar")), lit(DQ)),
      seq(lit(SQ), rep(exc(ref("PubidChar"), lit(SQ))), lit(SQ))
    )
  );
  g.rule("PubidChar", reg("[\\x20\\r\\na-zA-Z0-9-&#039;()+,./:=?;!*#@$_%]"));
  g.rule("CharData", rep(exc(reg("[^<&]"), lit("]]>"))));
  g.rule(
    "Comment",
    seq(
      lit("<!--"),
      rep(
        alt(
          exc(ref("Char"), lit("-")),
          seq(lit("-"), exc(ref("Char"), lit("-")))
        )
      ),
      lit("-->")
    )
  );
  g.rule(
    "PI",
    seq(
      lit("<?"),
      ref("PITarget"),
      opt(seq(ref("S"), rep(exc(ref("Char"), lit("?>"))))),
      lit("?>")
    )
  );
  g.rule("PITarget", exc(ref("Name"), reg("([Xx][Mm][Ll])")));
  g.rule("CDSect", seq(ref("CDStart"), ref("CData"), ref("CDEnd")));
  g.rule("CDStart", lit("<![CDATA["));
  g.rule("CData", rep(exc(ref("Char"), lit("]]>"))));
  g.rule("CDEnd", lit("]]>"));
  g.rule(
    "prolog",
    seq(
      opt(ref("XMLDecl")),
      rep(ref("Misc")),
      opt(seq(ref("doctypedecl"), rep(ref("Misc"))))
    )
  );
  g.rule(
    "XMLDecl",
    seq(
      lit("<?xml"),
      ref("VersionInfo"),
      opt(ref("EncodingDecl")),
      opt(ref("SDDecl")),
      opt(ref("S")),
      lit("?>")
    )
  );
  g.rule(
    "VersionInfo",
    seq(
      ref("S"),
      lit("version"),
      ref("Eq"),
      alt(
        seq(lit(SQ), ref("VersionNum"), lit(SQ)),
        seq(lit(DQ), ref("VersionNum"), lit(DQ))
      )
    )
  );
  g.rule("Eq", seq(opt(ref("S")), lit("="), opt(ref("S"))));
  g.rule("VersionNum", seq(lit("1."), plus(reg("[0-9]"))));
  g.rule("Misc", alt(ref("Comment"), ref("PI"), ref("S")));
  g.rule(
    "doctypedecl",
    seq(
      lit("<!DOCTYPE"),
      ref("S"),
      ref("Name"),
      opt(seq(ref("S"), ref("ExternalID"))),
      opt(ref("S")),
      opt(seq(lit("["), ref("intSubset"), lit("]"), opt(ref("S")))),
      lit(">")
    )
  );
  g.rule("DeclSep", alt(ref("PEReference"), ref("S")));
  g.rule("intSubset", rep(alt(ref("markupdecl"), ref("DeclSep"))));
  g.rule(
    "markupdecl",
    alt(
      ref("elementdecl"),
      ref("AttlistDecl"),
      ref("EntityDecl"),
      ref("NotationDecl"),
      ref("PI"),
      ref("Comment")
    )
  );
  g.rule("extSubset", seq(opt(ref("TextDecl")), ref("extSubsetDecl")));
  g.rule(
    "extSubsetDecl",
    rep(alt(ref("markupdecl"), ref("conditionalSect"), ref("DeclSep")))
  );
  g.rule(
    "SDDecl",
    seq(
      ref("S"),
      lit("standalone"),
      ref("Eq"),
      alt(
        seq(lit(SQ), alt(lit("yes"), lit("no")), lit(SQ)),
        seq(lit(DQ), alt(lit("yes"), lit("no")), lit(DQ))
      )
    )
  );
  g.rule(
    "element",
    alt(ref("EmptyElemTag"), seq(ref("STag"), ref("content"), ref("ETag")))
  );
  function validateElementTypeMatch(node, input) {
    const structuralNode = node.unwrap();
    if (structuralNode.children.length > 0 && structuralNode.children[0].type === "literal") {
      return true;
    }
    if (structuralNode.children.length === 3 && structuralNode.children[0].name === "STag" && structuralNode.children[2].name === "ETag") {
      const stag = structuralNode.children[0];
      const etag = structuralNode.children[2];
      const startName = stag.unwrap().children[1].getText(input);
      const endName = etag.unwrap().children[1].getText(input);
      return startName === endName;
    }
    throw new Error(
      `Validation error: unexpected node structure in validateElementTypeMatch. Children types: ${structuralNode.children.map((c) => c.type).join(", ")}`
    );
  }
  g.verifyRule("element", validateElementTypeMatch);
  function validateUniqueAttributes(node, input) {
    const seen = /* @__PURE__ */ new Set();
    const structuralNode = node.unwrap();
    const repNode = structuralNode.children[2];
    if (!repNode || repNode.type !== "repeat") return true;
    for (const seqNode of repNode.children) {
      const attrNode = seqNode.children[1];
      if (attrNode && attrNode.name === "Attribute") {
        const attrStructural = attrNode.unwrap();
        const nameNode = attrStructural.children[0];
        const name = nameNode.getText(input);
        if (seen.has(name)) return false;
        seen.add(name);
      }
    }
    return true;
  }
  g.rule(
    "STag",
    seq(
      lit("<"),
      ref("Name"),
      rep(seq(ref("S"), ref("Attribute"))),
      opt(ref("S")),
      lit(">")
    )
  );
  g.verifyRule("STag", validateUniqueAttributes);
  g.rule("Attribute", seq(ref("Name"), ref("Eq"), ref("AttValue")));
  g.rule("ETag", seq(lit("</"), ref("Name"), opt(ref("S")), lit(">")));
  g.rule(
    "content",
    seq(
      opt(ref("CharData")),
      rep(
        seq(
          alt(
            ref("element"),
            ref("Reference"),
            ref("CDSect"),
            ref("PI"),
            ref("Comment")
          ),
          opt(ref("CharData"))
        )
      )
    )
  );
  g.rule(
    "EmptyElemTag",
    seq(
      lit("<"),
      ref("Name"),
      rep(seq(ref("S"), ref("Attribute"))),
      opt(ref("S")),
      lit("/>")
    )
  );
  g.verifyRule("EmptyElemTag", validateUniqueAttributes);
  g.rule(
    "elementdecl",
    seq(
      lit("<!ELEMENT"),
      ref("S"),
      ref("Name"),
      ref("S"),
      ref("contentspec"),
      opt(ref("S")),
      lit(">")
    )
  );
  g.rule(
    "contentspec",
    alt(lit("EMPTY"), lit("ANY"), ref("Mixed"), ref("children"))
  );
  g.rule("children", seq(alt(ref("choice"), ref("seq")), opt(reg("[?*+]?"))));
  g.rule(
    "cp",
    seq(alt(ref("Name"), ref("choice"), ref("seq")), opt(reg("[?*+]?")))
  );
  g.rule(
    "choice",
    seq(
      lit("("),
      opt(ref("S")),
      ref("cp"),
      plus(seq(opt(ref("S")), lit("|"), opt(ref("S")), ref("cp"))),
      opt(ref("S")),
      lit(")")
    )
  );
  g.rule(
    "seq",
    seq(
      lit("("),
      opt(ref("S")),
      ref("cp"),
      rep(seq(opt(ref("S")), lit(","), opt(ref("S")), ref("cp"))),
      opt(ref("S")),
      lit(")")
    )
  );
  g.rule(
    "Mixed",
    alt(
      seq(
        lit("("),
        opt(ref("S")),
        lit("#PCDATA"),
        rep(seq(opt(ref("S")), lit("|"), opt(ref("S")), ref("Name"))),
        opt(ref("S")),
        lit(")*")
      ),
      seq(lit("("), opt(ref("S")), lit("#PCDATA"), opt(ref("S")), lit(")"))
    )
  );
  g.rule(
    "AttlistDecl",
    seq(
      lit("<!ATTLIST"),
      ref("S"),
      ref("Name"),
      rep(ref("AttDef")),
      opt(ref("S")),
      lit(">")
    )
  );
  g.rule(
    "AttDef",
    seq(
      ref("S"),
      ref("Name"),
      ref("S"),
      ref("AttType"),
      ref("S"),
      ref("DefaultDecl")
    )
  );
  g.rule(
    "AttType",
    alt(ref("StringType"), ref("TokenizedType"), ref("EnumeratedType"))
  );
  g.rule("StringType", lit("CDATA"));
  g.rule(
    "TokenizedType",
    alt(
      lit("ID"),
      lit("IDREF"),
      lit("IDREFS"),
      lit("ENTITY"),
      lit("ENTITIES"),
      lit("NMTOKEN"),
      lit("NMTOKENS")
    )
  );
  g.rule("EnumeratedType", alt(ref("NotationType"), ref("Enumeration")));
  g.rule(
    "NotationType",
    seq(
      lit("NOTATION"),
      ref("S"),
      lit("("),
      opt(ref("S")),
      ref("Name"),
      rep(seq(opt(ref("S")), lit("|"), opt(ref("S")), ref("Name"))),
      opt(ref("S")),
      lit(")")
    )
  );
  g.rule(
    "Enumeration",
    seq(
      lit("("),
      opt(ref("S")),
      ref("Nmtoken"),
      rep(seq(opt(ref("S")), lit("|"), opt(ref("S")), ref("Nmtoken"))),
      opt(ref("S")),
      lit(")")
    )
  );
  g.rule(
    "DefaultDecl",
    alt(
      lit("#REQUIRED"),
      lit("#IMPLIED"),
      seq(opt(seq(lit("#FIXED"), ref("S"))), ref("AttValue"))
    )
  );
  g.rule("conditionalSect", alt(ref("includeSect"), ref("ignoreSect")));
  g.rule(
    "includeSect",
    seq(
      lit("<!["),
      opt(ref("S")),
      lit("INCLUDE"),
      opt(ref("S")),
      lit("["),
      ref("extSubsetDecl"),
      lit("]]>")
    )
  );
  g.rule(
    "ignoreSect",
    seq(
      lit("<!["),
      opt(ref("S")),
      lit("IGNORE"),
      opt(ref("S")),
      lit("["),
      rep(ref("ignoreSectContents")),
      lit("]]>")
    )
  );
  g.rule(
    "ignoreSectContents",
    seq(
      ref("Ignore"),
      rep(
        seq(lit("<!["), ref("ignoreSectContents"), lit("]]>"), ref("Ignore"))
      )
    )
  );
  g.rule("Ignore", rep(exc(ref("Char"), reg("(<![|]]\\x3E)"))));
  g.rule(
    "CharRef",
    alt(
      seq(lit("&#"), plus(reg("[0-9]")), lit(";")),
      seq(lit("&#x"), plus(reg("[0-9a-fA-F]")), lit(";"))
    )
  );
  g.verifyRule("CharRef", (node, input) => {
    const text = node.getText(input);
    let code;
    if (text.startsWith("&#x")) {
      code = parseInt(text.slice(3, -1), 16);
    } else {
      code = parseInt(text.slice(2, -1), 10);
    }
    return code === 9 || code === 10 || code === 13 || code >= 32 && code <= 55295 || code >= 57344 && code <= 65533 || code >= 65536 && code <= 1114111;
  });
  g.rule("Reference", alt(ref("EntityRef"), ref("CharRef")));
  g.rule("EntityRef", seq(lit("&"), ref("Name"), lit(";")));
  g.rule("PEReference", seq(lit("%"), ref("Name"), lit(";")));
  g.rule("EntityDecl", alt(ref("GEDecl"), ref("PEDecl")));
  g.rule(
    "GEDecl",
    seq(
      lit("<!ENTITY"),
      ref("S"),
      ref("Name"),
      ref("S"),
      ref("EntityDef"),
      opt(ref("S")),
      lit(">")
    )
  );
  g.rule(
    "PEDecl",
    seq(
      lit("<!ENTITY"),
      ref("S"),
      lit("%"),
      ref("S"),
      ref("Name"),
      ref("S"),
      ref("PEDef"),
      opt(ref("S")),
      lit(">")
    )
  );
  g.rule(
    "EntityDef",
    alt(ref("EntityValue"), seq(ref("ExternalID"), opt(ref("NDataDecl"))))
  );
  g.rule("PEDef", alt(ref("EntityValue"), ref("ExternalID")));
  g.rule(
    "ExternalID",
    alt(
      seq(lit("SYSTEM"), ref("S"), ref("SystemLiteral")),
      seq(
        lit("PUBLIC"),
        ref("S"),
        ref("PubidLiteral"),
        ref("S"),
        ref("SystemLiteral")
      )
    )
  );
  g.rule("NDataDecl", seq(ref("S"), lit("NDATA"), ref("S"), ref("Name")));
  g.rule(
    "TextDecl",
    seq(
      lit("<?xml"),
      opt(ref("VersionInfo")),
      ref("EncodingDecl"),
      opt(ref("S")),
      lit("?>")
    )
  );
  g.rule("extParsedEnt", seq(opt(ref("TextDecl")), ref("content")));
  g.rule(
    "EncodingDecl",
    seq(
      ref("S"),
      lit("encoding"),
      ref("Eq"),
      alt(
        seq(lit(DQ), ref("EncName"), lit(DQ)),
        seq(lit(SQ), ref("EncName"), lit(SQ))
      )
    )
  );
  g.rule("EncName", seq(reg("[A-Za-z]"), rep(reg("[A-Za-z0-9._-]"))));
  g.rule(
    "NotationDecl",
    seq(
      lit("<!NOTATION"),
      ref("S"),
      ref("Name"),
      ref("S"),
      alt(ref("ExternalID"), ref("PublicID")),
      opt(ref("S")),
      lit(">")
    )
  );
  g.rule("PublicID", seq(lit("PUBLIC"), ref("S"), ref("PubidLiteral")));
  var grammar = g.build();

  // src/core/history-manager.ts
  var HistoryManager = class {
    constructor(maxHistory = 100) {
      this.undoStack = [];
      this.redoStack = [];
      this.maxHistory = maxHistory;
    }
    push(transaction) {
      this.undoStack.push(transaction);
      if (this.undoStack.length > this.maxHistory) {
        this.undoStack.shift();
      }
      this.redoStack = [];
    }
    undo() {
      const transaction = this.undoStack.pop();
      if (transaction) {
        this.redoStack.push(transaction);
        return transaction;
      }
      return null;
    }
    redo() {
      const transaction = this.redoStack.pop();
      if (transaction) {
        this.undoStack.push(transaction);
        return transaction;
      }
      return null;
    }
    canUndo() {
      return this.undoStack.length > 0;
    }
    canRedo() {
      return this.redoStack.length > 0;
    }
  };

  // src/core/model/formatter.ts
  var Formatter = class {
    constructor(options = {}) {
      this.indent = options.indent ?? "  ";
      this.newline = options.newline ?? "\n";
      this.force = options.force ?? false;
    }
    format(node) {
      return this.formatNode(node, 0);
    }
    formatNode(node, level) {
      if (typeof node === "string") {
        return this.escape(node);
      }
      if (node instanceof ASTComment) {
        return `<!--${node.content}-->`;
      }
      if (node instanceof ASTCDATA) {
        return `<![CDATA[${node.content}]]>`;
      }
      const tagName = node.tagName;
      const attributes = this.formatAttributes(node.attributes);
      const children = node.children;
      if (children.length === 0) {
        return `<${tagName}${attributes} />`;
      }
      const isInline = this.isInline(children);
      const hasFormatting = this.force ? false : this.hasFormatting(children);
      let result = `<${tagName}${attributes}>`;
      if (isInline || hasFormatting) {
        for (const child of children) {
          if (this.force && typeof child === "string" && child.includes("\n") && child.trim().length === 0) {
            continue;
          }
          result += this.formatNode(child, level + 1);
        }
        result += `</${tagName}>`;
      } else {
        for (const child of children) {
          if (this.force && typeof child === "string" && child.includes("\n") && child.trim().length === 0) {
            continue;
          }
          result += this.newline + this.getIndent(level + 1) + this.formatNode(child, level + 1);
        }
        result += `${this.newline + this.getIndent(level)}</${tagName}>`;
      }
      return result;
    }
    formatAttributes(attributes) {
      const keys = Object.keys(attributes);
      if (keys.length === 0) return "";
      return " " + keys.map((key) => `${key}="${this.escapeAttribute(attributes[key])}"`).join(" ");
    }
    isInline(children) {
      for (const theChild of children) {
        if (typeof theChild === "string") {
          if (theChild.trim().length > 0) return true;
        }
        if (theChild instanceof ASTCDATA) {
          return true;
        }
      }
      return false;
    }
    hasFormatting(children) {
      for (const theChild of children) {
        if (typeof theChild === "string") {
          if (theChild.includes("\n") && theChild.trim().length === 0) {
            return true;
          }
        }
      }
      return false;
    }
    getIndent(level) {
      return this.indent.repeat(level);
    }
    escape(str) {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    escapeAttribute(str) {
      return this.escape(str).replace(/"/g, "&quot;");
    }
  };

  // src/core/model/xml-api-model.ts
  var ModelNode = class {
    constructor() {
      this.parent = null;
      this.cst = null;
      this.id = crypto.randomUUID();
    }
  };
  var ModelElement = class extends ModelNode {
    constructor(tagName) {
      super();
      this.attributes = /* @__PURE__ */ new Map();
      this.children = [];
      this.tagName = tagName;
    }
    getType() {
      return "Element" /* Element */;
    }
    addChild(node) {
      node.parent = this;
      this.children.push(node);
    }
    setAttribute(key, value) {
      this.attributes.set(key, value);
    }
  };
  var ModelText = class extends ModelNode {
    constructor(text) {
      super();
      this.text = text;
    }
    getType() {
      return "Text" /* Text */;
    }
  };
  var ModelComment = class extends ModelNode {
    constructor(content) {
      super();
      this.content = content;
    }
    getType() {
      return "Comment" /* Comment */;
    }
  };
  var ModelCDATA = class extends ModelNode {
    constructor(content) {
      super();
      this.content = content;
    }
    getType() {
      return "CDATA" /* CDATA */;
    }
  };

  // src/core/model/xml-binder.ts
  var XMLBinder = class {
    constructor(input) {
      this.input = input;
    }
    isHydratable(name) {
      if (!name) return false;
      return [
        "element",
        "document",
        "CharData",
        "Reference",
        "CharRef",
        "EntityRef",
        "CDSect",
        "Comment"
      ].includes(name);
    }
    hydrate(node) {
      let result = null;
      if (node.name === "CharData") {
        result = new ModelText(node.getText(this.input));
      } else if (node.name === "Reference") {
        const text = node.getText(this.input);
        if (text.startsWith("&#")) {
          result = new ModelText(decodeCharRef(node, this.input));
        } else {
          result = new ModelText(text);
        }
      } else if (node.name === "CharRef") {
        result = new ModelText(decodeCharRef(node, this.input));
      } else if (node.name === "EntityRef") {
        result = new ModelText(node.getText(this.input));
      } else if (node.name === "CDSect") {
        const structural = node.unwrap();
        if (structural.children.length === 3) {
          result = new ModelCDATA(structural.children[1].getText(this.input));
        } else {
          result = new ModelCDATA("");
        }
      } else if (node.name === "Comment") {
        const text = node.getText(this.input);
        const content = text.substring(4, text.length - 3);
        result = new ModelComment(content);
      } else if (node.name === "PI") {
        result = null;
      } else if (node.name === "element" || node.name === "document") {
        const structural = node.unwrap();
        if (node.name === "document" && structural.type === "sequence" && structural.children.length >= 2) {
          const elementNode = structural.children[1];
          result = this.hydrate(elementNode);
        } else if (structural.children.length === 3 && structural.children[0].name === "STag") {
          const stag = structural.children[0];
          const content = structural.children[1];
          const elem = this.parseTag(stag);
          const contentStructural = content.unwrap();
          const initialCharDataRep = contentStructural.children[0];
          if (initialCharDataRep && initialCharDataRep.children.length > 0) {
            const textNode = this.hydrate(initialCharDataRep.children[0]);
            if (textNode) elem.addChild(textNode);
          }
          const repeatingPart = contentStructural.children[1];
          if (repeatingPart) {
            for (const seqNode of repeatingPart.children) {
              const choiceNode = seqNode.children[0];
              const converted = this.hydrate(choiceNode);
              if (converted) {
                elem.addChild(converted);
              }
              const trailingCharDataRep = seqNode.children[1];
              if (trailingCharDataRep && trailingCharDataRep.children.length > 0) {
                const textNode = this.hydrate(trailingCharDataRep.children[0]);
                if (textNode) elem.addChild(textNode);
              }
            }
          }
          result = elem;
        } else if (structural.children.length >= 2 && structural.children[0].type === "literal" && structural.children[0].getText(this.input) === "<") {
          result = this.parseTag(node);
        } else if (structural !== node) {
          result = this.hydrate(structural);
        }
      } else if (node.type === "regex" || node.type === "literal") {
        result = new ModelText(node.getText(this.input));
      } else if (node.children.length === 1 && node.children[0].start === node.start && node.children[0].end === node.end) {
        result = this.hydrate(node.children[0]);
      }
      if (result) {
        if (!result.cst) {
          result.cst = node;
        }
      }
      return result;
    }
    reconcile(currentModel, newCst) {
      const newModel = this.hydrate(newCst);
      if (!newModel) {
        return newModel;
      }
      if (this.canReconcile(currentModel, newModel)) {
        this.applyReconciliation(currentModel, newModel);
        return currentModel;
      }
      return newModel;
    }
    canReconcile(a, b) {
      if (a.getType() !== b.getType()) return false;
      if (a.getType() === "Element" /* Element */) {
        return a.tagName === b.tagName;
      }
      return true;
    }
    applyReconciliation(target, source) {
      target.cst = source.cst;
      if (target.getType() === "Text" /* Text */) {
        target.text = source.text;
      } else if (target.getType() === "Comment" /* Comment */) {
        target.content = source.content;
      } else if (target.getType() === "CDATA" /* CDATA */) {
        target.content = source.content;
      } else {
        const t = target;
        const s = source;
        t.attributes = s.attributes;
        const newChildren = [];
        const keyedChildren = /* @__PURE__ */ new Map();
        const nonKeyedChildren = [];
        for (const child of t.children) {
          if (child.getType() === "Element" /* Element */) {
            const el = child;
            const id = el.attributes.get("id");
            if (id) {
              keyedChildren.set(id, el);
            } else {
              nonKeyedChildren.push(child);
            }
          } else {
            nonKeyedChildren.push(child);
          }
        }
        for (const sChild of s.children) {
          let matchedNode;
          if (sChild.getType() === "Element" /* Element */) {
            const sEl = sChild;
            const id = sEl.attributes.get("id");
            if (id && keyedChildren.has(id)) {
              matchedNode = keyedChildren.get(id);
              keyedChildren.delete(id);
            }
          }
          if (!matchedNode) {
            for (let i = 0; i < nonKeyedChildren.length; i++) {
              const candidate = nonKeyedChildren[i];
              if (this.canReconcile(candidate, sChild)) {
                matchedNode = candidate;
                nonKeyedChildren.splice(i, 1);
                break;
              }
            }
          }
          if (matchedNode) {
            const reconciled = this.reconcile(matchedNode, sChild.cst);
            reconciled.parent = t;
            newChildren.push(reconciled);
          } else {
            sChild.parent = t;
            newChildren.push(sChild);
          }
        }
        t.children = newChildren;
      }
    }
    project(model) {
      if (model.getType() === "Text" /* Text */) {
        return model.text;
      }
      if (model.getType() === "Comment" /* Comment */) {
        const ast2 = new ASTComment(model.content);
        ast2.cst = model.cst;
        return ast2;
      }
      if (model.getType() === "CDATA" /* CDATA */) {
        const ast2 = new ASTCDATA(model.content);
        ast2.cst = model.cst;
        return ast2;
      }
      const el = model;
      const ast = new AST(el.tagName);
      for (const [key, value] of el.attributes) {
        ast.attributes[key] = value;
      }
      for (const child of el.children) {
        ast.children.push(this.project(child));
      }
      ast.cst = el.cst;
      return ast;
    }
    calcSetAttributePatch(model, key, value) {
      if (!model.cst) return null;
      const structural = model.cst.unwrap();
      let tagNode = null;
      if (structural.children.length === 3 && structural.children[0].name === "STag") {
        tagNode = structural.children[0];
      } else if (structural.name === "EmptyElemTag") {
        tagNode = structural;
      } else {
        for (const child of structural.children) {
          if (child.name === "STag" || child.name === "EmptyElemTag") {
            tagNode = child;
            break;
          }
        }
        if (!tagNode && structural.children.length >= 2 && structural.children[0].getText(this.input) === "<") {
          tagNode = structural;
        }
      }
      if (!tagNode) return null;
      const tagStructural = tagNode.unwrap();
      const attrRep = tagStructural.children[2];
      if (attrRep && attrRep.type === "repeat") {
        for (const seqNode of attrRep.children) {
          const attrNode = seqNode.children[1];
          if (attrNode && attrNode.name === "Attribute") {
            const attrStructural = attrNode.unwrap();
            const nameNode = attrStructural.children[0];
            const attrName = nameNode.getText(this.input);
            if (attrName === key) {
              const attValueNode = attrStructural.children[2];
              const oldText = attValueNode.getText(this.input);
              const quote = oldText[0];
              const newQuote = quote === "'" || quote === '"' ? quote : '"';
              return {
                start: attValueNode.start,
                end: attValueNode.end,
                text: `${newQuote}${escapeAttributeValue(value)}${newQuote}`
              };
            }
          }
        }
      }
      const len = tagStructural.children.length;
      const closing = tagStructural.children[len - 1];
      const _optS = tagStructural.children[len - 2];
      return {
        start: closing.start,
        end: closing.start,
        text: ` ${key}="${escapeAttributeValue(value)}"`
      };
    }
    calcUpdateTextPatch(model, text) {
      if (!model.cst) return null;
      const structural = model.cst.unwrap();
      if (structural.children.length === 3 && structural.children[0].name === "STag") {
        const contentNode = structural.children[1];
        return {
          start: contentNode.start,
          end: contentNode.end,
          text: escapeText(text)
        };
      }
      if (structural.name === "EmptyElemTag" || structural.children.length >= 2 && structural.children[0].getText(this.input) === "<") {
        const len = structural.children.length;
        const closing = structural.children[len - 1];
        if (closing.getText(this.input) === "/>") {
          return {
            start: closing.start,
            end: closing.end,
            text: `>${escapeText(text)}</${model.tagName}>`
          };
        }
      }
      return null;
    }
    calcReplaceNodePatch(model, newXml) {
      if (!model.cst) return null;
      return {
        start: model.cst.start,
        end: model.cst.end,
        text: newXml
      };
    }
    parseTag(node) {
      const structural = node.unwrap();
      const nameNode = structural.children[1];
      const tagName = nameNode.getText(this.input);
      const elem = new ModelElement(tagName);
      const attrRep = structural.children[2];
      for (const seq2 of attrRep.children) {
        const attrNode = seq2.children[1];
        const attrStructural = attrNode.unwrap();
        const attrName = attrStructural.children[0].getText(this.input);
        const attValueNode = attrStructural.children[2];
        const attValueStructural = attValueNode.unwrap();
        const valRep = attValueStructural.children[1];
        let valText = "";
        for (const chunk of valRep.children) {
          const modelNode = this.hydrate(chunk);
          if (modelNode instanceof ModelText) {
            valText += modelNode.text;
          } else if (modelNode) {
          }
        }
        elem.setAttribute(attrName, valText);
      }
      return elem;
    }
  };
  function decodeCharRef(node, input) {
    const text = node.getText(input);
    let code;
    if (text.startsWith("&#x")) {
      code = parseInt(text.slice(3, -1), 16);
    } else {
      code = parseInt(text.slice(2, -1), 10);
    }
    return String.fromCodePoint(code);
  }
  function convert(node, input) {
    const binder2 = new XMLBinder(input);
    const model = binder2.hydrate(node);
    if (!model) return null;
    return binder2.project(model);
  }
  function escapeText(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escapeAttributeValue(str) {
    return escapeText(str).replace(/"/g, "&quot;");
  }

  // src/core/xml-api-events.ts
  var EventEmitter = class {
    constructor() {
      this.listeners = [];
    }
    on(handler) {
      this.listeners.push(handler);
      return () => this.off(handler);
    }
    off(handler) {
      this.listeners = this.listeners.filter((h) => h !== handler);
    }
    emit(event) {
      for (const handler of this.listeners) {
        handler(event);
      }
    }
  };

  // src/core/xml-api.ts
  var XMLAPI = class {
    constructor(input, grammar2 = grammar, converter = convert) {
      /** CST is null if parsing fails. */
      this.cst = null;
      /** AST is null if CST is null or not well-formed. */
      this.ast = null;
      /** Model is the authoritative logical representation. */
      this.model = null;
      this.binder = null;
      this.events = new EventEmitter();
      this.history = new HistoryManager();
      this.isTransacting = false;
      this.input = input;
      this.grammar = grammar2;
      this.parser = new Parser(grammar2);
      this.converter = converter;
      this.cst = this.parse();
      if (this.cst?.wellFormed) {
        if (converter === convert) {
          this.binder = new XMLBinder(input);
          const modelNode = this.binder.hydrate(this.cst);
          if (modelNode instanceof ModelElement) {
            this.model = modelNode;
            const proj = this.binder.project(this.model);
            this.ast = proj instanceof AST ? proj : null;
          }
        } else {
          this.ast = this.generateAST(this.cst);
        }
      }
    }
    on(handler) {
      return this.events.on(handler);
    }
    undo() {
      const tx = this.history.undo();
      if (tx) {
        this.isTransacting = true;
        try {
          this.updateInput(tx.undo.from, tx.undo.to, tx.undo.text);
        } finally {
          this.isTransacting = false;
        }
      }
    }
    redo() {
      const tx = this.history.redo();
      if (tx) {
        this.isTransacting = true;
        try {
          this.updateInput(tx.redo.from, tx.redo.to, tx.redo.text);
        } finally {
          this.isTransacting = false;
        }
      }
    }
    /**
     * Parses the input string using the configured grammar.
     */
    parse(ruleName) {
      try {
        return this.parser.parse(this.input, ruleName);
      } catch (e) {
        console.error("Parse error:", e);
        return null;
      }
    }
    /**
     * Converts the parsed CST into a high-level AST.
     */
    generateAST(cst) {
      const result = this.converter(cst, this.input);
      return result instanceof AST ? result : null;
    }
    /**
     * Updates the input text and refreshes the CST/AST.
     */
    updateInput(from, to, value) {
      if (from < 0 || to > this.input.length || from > to) {
        throw new Error("Invalid range for updateInput");
      }
      if (!this.isTransacting) {
        const oldText = this.input.slice(from, to);
        const newEnd = from + value.length;
        this.history.push({
          redo: { from, to, text: value },
          undo: { from, to: newEnd, text: oldText }
        });
      }
      const delta = value.length - (to - from);
      const oldInput = this.input;
      const _newEnd = from + value.length;
      this.input = oldInput.slice(0, from) + value + oldInput.slice(to);
      if (this.binder) {
        this.binder = new XMLBinder(this.input);
      }
      if (this.cst) {
        const incrementalResult = this.tryIncrementalUpdate(from, to, delta);
        if (incrementalResult) {
          if (this.model && this.binder) {
            this.updateModelAndASTIncremental(
              incrementalResult.oldNode,
              incrementalResult.newNode
            );
          } else {
            this.updateASTIncremental(
              incrementalResult.oldNode,
              incrementalResult.newNode
            );
            this.events.emit({ type: "full" });
          }
          if (this.cst && !this.cst.wellFormed) {
            this.ast = null;
            this.model = null;
            this.events.emit({ type: "full" });
          }
        } else {
          this.cst = this.parse();
          if (this.cst?.wellFormed) {
            if (this.converter === convert) {
              const modelNode = this.binder?.hydrate(this.cst);
              if (modelNode instanceof ModelElement) {
                this.model = modelNode;
                const proj = this.binder?.project(this.model);
                this.ast = proj instanceof AST ? proj : null;
              }
            } else {
              this.ast = this.generateAST(this.cst);
            }
          } else {
            this.ast = null;
            this.model = null;
          }
          this.events.emit({ type: "full" });
        }
      } else {
        this.cst = this.parse();
        if (this.cst?.wellFormed) {
          if (this.converter === convert) {
            const modelNode = this.binder?.hydrate(this.cst);
            if (modelNode instanceof ModelElement) {
              this.model = modelNode;
              const proj = this.binder?.project(this.model);
              this.ast = proj instanceof AST ? proj : null;
            }
          } else {
            this.ast = this.generateAST(this.cst);
          }
        } else {
          this.ast = null;
          this.model = null;
        }
        this.events.emit({ type: "full" });
      }
    }
    /**
     * Sets an attribute on the specified AST node.
     * Updates the source code, CST, Model, and AST.
     */
    setAttribute(astNode, key, value) {
      if (!this.binder || !this.model) {
        throw new Error("Operational API requires standard binder and model.");
      }
      if (!astNode.cst) {
        throw new Error("AST node is not linked to CST.");
      }
      const modelNode = this.findModelNodeByCST(this.model, astNode.cst);
      if (!modelNode || !(modelNode instanceof ModelElement)) {
        throw new Error("Corresponding model node not found.");
      }
      const patch = this.binder.calcSetAttributePatch(modelNode, key, value);
      if (patch) {
        this.updateInput(patch.start, patch.end, patch.text);
      }
    }
    /**
     * Updates the text content of the specified AST element.
     */
    updateText(astNode, text) {
      if (!this.binder || !this.model) {
        throw new Error("Operational API requires standard binder and model.");
      }
      if (!astNode.cst) {
        throw new Error("AST node is not linked to CST.");
      }
      const modelNode = this.findModelNodeByCST(this.model, astNode.cst);
      if (!modelNode || !(modelNode instanceof ModelElement)) {
        throw new Error("Corresponding model node not found.");
      }
      const patch = this.binder.calcUpdateTextPatch(modelNode, text);
      if (patch) {
        this.updateInput(patch.start, patch.end, patch.text);
      }
    }
    /**
     * Replaces an AST node with new content.
     * @param astNode The AST node to replace.
     * @param content New content as an AST object.
     */
    replaceNode(astNode, content) {
      if (!this.binder || !this.model) {
        throw new Error("Operational API requires standard binder and model.");
      }
      if (!astNode.cst) {
        throw new Error("AST node is not linked to CST.");
      }
      const modelNode = this.findModelNodeByCST(this.model, astNode.cst);
      if (!modelNode) {
        throw new Error("Corresponding model node not found.");
      }
      let indentUnit = "  ";
      let currentIndent = "";
      if (modelNode.cst) {
        currentIndent = this.detectIndent(modelNode.cst);
        if (modelNode.parent?.cst) {
          const parentIndent = this.detectIndent(modelNode.parent.cst);
          if (currentIndent.startsWith(parentIndent)) {
            const diff = currentIndent.slice(parentIndent.length);
            if (diff.length > 0 && !diff.includes("\n")) {
              indentUnit = diff;
            }
          }
        }
      }
      const formatter = new Formatter({ indent: indentUnit });
      let newXml = formatter.format(content);
      if (currentIndent && newXml.includes("\n")) {
        newXml = newXml.split("\n").map((line, index) => {
          if (index === 0) return line;
          return currentIndent + line;
        }).join("\n");
      }
      const patch = this.binder.calcReplaceNodePatch(modelNode, newXml);
      if (patch) {
        this.updateInput(patch.start, patch.end, patch.text);
      }
    }
    detectIndent(node) {
      const input = this.input;
      let i = node.start - 1;
      while (i >= 0) {
        if (input[i] === "\n") {
          return input.slice(i + 1, node.start);
        }
        if (input[i] !== " " && input[i] !== "	") {
          return "";
        }
        i--;
      }
      return "";
    }
    findModelNodeByCST(root, cst) {
      if (root.cst === cst) return root;
      if (root instanceof ModelElement) {
        for (const child of root.children) {
          const found = this.findModelNodeByCST(child, cst);
          if (found) return found;
        }
      }
      return null;
    }
    /**
     * Attempts to update the CST incrementally by re-parsing only the affected part of the tree.
     *
     * Strategy:
     * 1. Find the deepest node that fully contains the changed range (using old coordinates).
     * 2. Traverse up from that node to find a "stable" ancestor (one that represents a named rule).
     * 3. Attempt to re-parse that ancestor's rule with the new input.
     * 4. If parsing succeeds and the new node length matches the expected length (old length + delta),
     *    we commit the change: shift the tree and replace the node.
     *
     * @param from Start offset of the change (old coordinate).
     * @param to End offset of the change (old coordinate).
     * @param delta Change in length (newLength - oldLength).
     * @returns object with old and new nodes if successful, null otherwise.
     */
    tryIncrementalUpdate(from, to, delta) {
      if (!this.cst) return null;
      let target = this.findNodeAt(from, to);
      while (target) {
        if (target.name) {
          if (this.binder && !this.binder.isHydratable(target.name)) {
            target = target.parent;
            continue;
          }
          const parseStart = target.parent ? target.start : 0;
          const result = this.parser.parseAt(this.input, parseStart, target.name);
          const expectedEnd = target.end + delta;
          if (result && result.end === expectedEnd) {
            if (target.parent) {
              this.cst.shift(from, delta);
              const index = target.parent.children.indexOf(target);
              if (index !== -1) {
                target.parent.children[index] = result.node;
                result.node.parent = target.parent;
                this.updateAncestorsWellFormed(result.node);
                return { oldNode: target, newNode: result.node };
              }
            } else {
              this.cst = result.node;
              return { oldNode: target, newNode: result.node };
            }
          }
        }
        target = target.parent;
      }
      return null;
    }
    updateModelAndASTIncremental(oldNode, newNode) {
      if (!this.model || !this.ast || !this.binder) return;
      if (this.ast.cst === oldNode || this.model.cst === oldNode) {
        const newModelNode = this.binder.hydrate(newNode);
        if (newModelNode instanceof ModelElement) {
          this.model = newModelNode;
          const newAST = this.binder.project(newModelNode);
          if (newAST instanceof AST && this.ast instanceof AST) {
            this.ast.tagName = newAST.tagName;
            this.ast.attributes = newAST.attributes;
            this.ast.children = newAST.children;
            this.ast.cst = newAST.cst;
            this.events.emit({ type: "full", target: this.model });
          } else {
            this.ast = newAST instanceof AST ? newAST : null;
            this.events.emit({ type: "full" });
          }
          return;
        }
      }
      const modelPath = this.findModelNodePath(this.model, oldNode);
      if (modelPath) {
        const reconciledModel = this.binder.reconcile(modelPath.node, newNode);
        if (reconciledModel) {
          if (reconciledModel !== modelPath.node) {
            modelPath.parent.children[modelPath.index] = reconciledModel;
            reconciledModel.parent = modelPath.parent;
          }
          const newAST = this.binder.project(reconciledModel);
          if (modelPath.parent.cst) {
            const astParent = this.findASTNode(this.ast, modelPath.parent.cst);
            if (astParent) {
              if (astParent.children.length > modelPath.index) {
                const oldChild = astParent.children[modelPath.index];
                if (oldChild instanceof AST && newAST instanceof AST) {
                  oldChild.tagName = newAST.tagName;
                  oldChild.attributes = newAST.attributes;
                  oldChild.children = newAST.children;
                  oldChild.cst = newAST.cst;
                  this.events.emit({
                    type: "structure",
                    target: reconciledModel
                  });
                } else {
                  astParent.children[modelPath.index] = newAST;
                  this.events.emit({ type: "text", target: reconciledModel });
                }
              } else {
                console.warn(
                  "AST children length mismatch",
                  astParent.children.length,
                  modelPath.index
                );
              }
              return;
            } else {
              console.warn("AST Parent not found for CST", modelPath.parent.cst);
            }
          } else {
            console.warn("Model Parent has no CST");
          }
        }
      } else {
      }
      if (this.cst?.wellFormed) {
        const modelNode = this.binder.hydrate(this.cst);
        if (modelNode instanceof ModelElement) {
          this.model = modelNode;
          const proj = this.binder.project(this.model);
          this.ast = proj instanceof AST ? proj : null;
        }
        this.events.emit({ type: "full" });
      } else {
        this.ast = null;
        this.model = null;
        this.events.emit({ type: "full" });
      }
    }
    findModelNodePath(root, cstNode) {
      for (let i = 0; i < root.children.length; i++) {
        const child = root.children[i];
        if (child.cst === cstNode) {
          return { parent: root, index: i, node: child };
        }
        if (child instanceof ModelElement) {
          const found = this.findModelNodePath(child, cstNode);
          if (found) return found;
        }
      }
      return null;
    }
    replaceASTNode(root, oldCstNode, newContent) {
      for (let i = 0; i < root.children.length; i++) {
        const child = root.children[i];
        if (child instanceof AST && child.cst === oldCstNode) {
          root.children[i] = newContent;
          return true;
        }
        if (child instanceof AST) {
          if (this.replaceASTNode(child, oldCstNode, newContent)) return true;
        }
      }
      return false;
    }
    updateASTIncremental(oldNode, newNode) {
      if (!this.ast) {
        if (this.cst?.wellFormed) {
          this.ast = this.generateAST(this.cst);
        }
        return;
      }
      let currentOld = oldNode;
      let currentNew = newNode;
      while (currentOld) {
        const astNode = this.findASTNode(this.ast, currentOld);
        if (astNode && currentNew) {
          const newAST = this.converter(currentNew, this.input);
          if (newAST instanceof AST) {
            astNode.tagName = newAST.tagName;
            astNode.attributes = newAST.attributes;
            astNode.children = newAST.children;
            astNode.cst = newAST.cst;
            return;
          }
        }
        if (currentOld.parent) {
          currentOld = currentOld.parent;
          currentNew = currentOld;
        } else {
          break;
        }
      }
      if (this.cst?.wellFormed) {
        this.ast = this.generateAST(this.cst);
      } else {
        this.ast = null;
      }
    }
    findASTNode(root, cstNode) {
      if (root.cst === cstNode) return root;
      for (const child of root.children) {
        if (child instanceof AST) {
          const found = this.findASTNode(child, cstNode);
          if (found) return found;
        }
      }
      return null;
    }
    findNodeAt(from, to) {
      if (!this.cst) return null;
      let current = this.cst;
      while (true) {
        let foundChild = null;
        const children = current.children;
        let left = 0;
        let right = children.length - 1;
        let candidateIndex = -1;
        while (left <= right) {
          const mid = left + right >>> 1;
          if (children[mid].start <= from) {
            candidateIndex = mid;
            left = mid + 1;
          } else {
            right = mid - 1;
          }
        }
        if (candidateIndex !== -1) {
          const candidate = children[candidateIndex];
          if (candidate.end >= to) {
            foundChild = candidate;
          }
        }
        if (foundChild) {
          current = foundChild;
        } else {
          break;
        }
      }
      return current;
    }
    updateAncestorsWellFormed(node) {
      let current = node.parent;
      while (current) {
        let childrenWellFormed = true;
        for (const child of current.children) {
          if (!child.wellFormed) {
            childrenWellFormed = false;
            break;
          }
        }
        let selfWellFormed = childrenWellFormed;
        if (current.name && selfWellFormed) {
          const validator = this.grammar.validators[current.name];
          if (validator && !validator(current, this.input)) {
            selfWellFormed = false;
          }
        }
        current.wellFormed = selfWellFormed;
        current = current.parent;
      }
    }
  };

  // src/core/ast/dom.ts
  var Node = class {
    constructor(model, ownerDocument) {
      this.model = model;
      this.ownerDocument = ownerDocument;
      this.ELEMENT_NODE = 1;
      this.TEXT_NODE = 3;
      this.CDATA_SECTION_NODE = 4;
      this.COMMENT_NODE = 8;
      this.DOCUMENT_NODE = 9;
    }
    get parentNode() {
      if (!this.model.parent) return null;
      return createWrapper(this.model.parent, this.ownerDocument);
    }
    get childNodes() {
      if (this.model instanceof ModelElement) {
        return new NodeList(
          this.model.children.map((c) => createWrapper(c, this.ownerDocument))
        );
      }
      return new NodeList([]);
    }
    get firstChild() {
      const nodes = this.childNodes;
      return nodes.length > 0 ? nodes.item(0) : null;
    }
    get lastChild() {
      const nodes = this.childNodes;
      return nodes.length > 0 ? nodes.item(nodes.length - 1) : null;
    }
    get nextSibling() {
      const parent = this.model.parent;
      if (!parent) return null;
      const index = parent.children.indexOf(this.model);
      if (index >= 0 && index < parent.children.length - 1) {
        return createWrapper(parent.children[index + 1], this.ownerDocument);
      }
      return null;
    }
    get previousSibling() {
      const parent = this.model.parent;
      if (!parent) return null;
      const index = parent.children.indexOf(this.model);
      if (index > 0) {
        return createWrapper(parent.children[index - 1], this.ownerDocument);
      }
      return null;
    }
    get textContent() {
      if (this.model instanceof ModelText) return this.model.text;
      if (this.model instanceof ModelComment) return this.model.content;
      if (this.model instanceof ModelCDATA) return this.model.content;
      if (this.model instanceof ModelElement) {
        return this.model.children.map((c) => createWrapper(c, this.ownerDocument).textContent).join("");
      }
      return null;
    }
    set textContent(value) {
      const val = value || "";
      if (this.model instanceof ModelText) {
        this.model.text = val;
        this.ownerDocument?.notifyTextChange(this, val);
      } else if (this.model instanceof ModelComment) {
        this.model.content = val;
        this.ownerDocument?.notifyTextChange(this, val);
      } else if (this.model instanceof ModelCDATA) {
        this.model.content = val;
        this.ownerDocument?.notifyTextChange(this, val);
      } else if (this.model instanceof ModelElement) {
        this.model.children = [];
        if (val) {
          const textNode = new ModelText(val);
          this.model.addChild(textNode);
        }
      }
    }
    appendChild(newChild) {
      if (this.model instanceof ModelElement) {
        this.model.addChild(newChild.getModel());
        newChild.ownerDocument = this.ownerDocument;
        this.ownerDocument?.notifyChildAdded(this, newChild, this.model.children.length - 1);
        return newChild;
      }
      throw new Error("HierarchyRequestError");
    }
    // Internal access
    getModel() {
      return this.model;
    }
  };
  var NodeList = class _NodeList extends Array {
    constructor(items) {
      super(...items);
      Object.setPrototypeOf(this, _NodeList.prototype);
    }
    item(index) {
      return this[index] || null;
    }
  };
  var CharacterData = class extends Node {
    get data() {
      return this.textContent || "";
    }
    set data(value) {
      this.textContent = value;
    }
    get length() {
      return this.data.length;
    }
  };
  var Text = class extends CharacterData {
    get nodeType() {
      return this.TEXT_NODE;
    }
    get nodeName() {
      return "#text";
    }
  };
  var Comment = class extends CharacterData {
    get nodeType() {
      return this.COMMENT_NODE;
    }
    get nodeName() {
      return "#comment";
    }
  };
  var CDATASection = class extends CharacterData {
    get nodeType() {
      return this.CDATA_SECTION_NODE;
    }
    get nodeName() {
      return "#cdata-section";
    }
  };
  var Element = class extends Node {
    constructor(model, ownerDocument) {
      super(model, ownerDocument);
      this.model = model;
    }
    get nodeType() {
      return this.ELEMENT_NODE;
    }
    get nodeName() {
      return this.model.tagName;
    }
    get tagName() {
      return this.model.tagName;
    }
    get prefix() {
      const parts = this.model.tagName.split(":");
      return parts.length > 1 ? parts[0] : null;
    }
    get localName() {
      const parts = this.model.tagName.split(":");
      return parts.length > 1 ? parts[1] : parts[0];
    }
    get namespaceURI() {
      const prefix = this.prefix;
      const xmlnsKey = prefix ? `xmlns:${prefix}` : "xmlns";
      let current = this.model;
      while (current) {
        if (current.attributes.has(xmlnsKey)) {
          return current.attributes.get(xmlnsKey) || null;
        }
        current = current.parent;
      }
      return null;
    }
    getAttribute(name) {
      return this.model.attributes.get(name) ?? null;
    }
    setAttribute(name, value) {
      this.model.attributes.set(name, value);
      this.ownerDocument?.notifyAttributeChange(this, name, value);
    }
    removeAttribute(name) {
      this.model.attributes.delete(name);
      this.ownerDocument?.notifyAttributeChange(this, name, null);
    }
    hasAttribute(name) {
      return this.model.attributes.has(name);
    }
    querySelector(selector) {
      const results = [];
      querySelectorAllRecursive(this, selector, results);
      return results.length > 0 ? results[0] : null;
    }
    querySelectorAll(selector) {
      const results = [];
      querySelectorAllRecursive(this, selector, results);
      return new NodeList(results);
    }
  };
  var Document = class extends Node {
    constructor() {
      super(new ModelElement("#document"), null);
      this._documentElement = null;
      this.observer = null;
      this.ownerDocument = this;
    }
    setObserver(observer) {
      this.observer = observer;
    }
    notifyAttributeChange(element, name, value) {
      this.observer?.onAttributeChange(element, name, value);
    }
    notifyTextChange(node, text) {
      this.observer?.onTextChange(node, text);
    }
    notifyChildAdded(parent, child, index) {
      this.observer?.onChildAdded(parent, child, index);
    }
    get nodeType() {
      return this.DOCUMENT_NODE;
    }
    get nodeName() {
      return "#document";
    }
    get documentElement() {
      return this._documentElement;
    }
    // Not standard, but needed for initialization
    set documentElement(element) {
      this._documentElement = element;
      if (element) {
        element.ownerDocument = this;
      }
    }
    createElement(tagName) {
      return new Element(new ModelElement(tagName), this);
    }
    createTextNode(data) {
      return new Text(new ModelText(data), this);
    }
    createComment(data) {
      return new Comment(new ModelComment(data), this);
    }
    createCDATASection(data) {
      return new CDATASection(new ModelCDATA(data), this);
    }
    querySelector(selector) {
      if (!this.documentElement) return null;
      return this.documentElement.querySelector(selector);
    }
    querySelectorAll(selector) {
      if (!this.documentElement) return new NodeList([]);
      return this.documentElement.querySelectorAll(selector);
    }
  };
  function createWrapper(model, doc2) {
    if (model instanceof ModelElement) return new Element(model, doc2);
    if (model instanceof ModelText) return new Text(model, doc2);
    if (model instanceof ModelComment) return new Comment(model, doc2);
    if (model instanceof ModelCDATA) return new CDATASection(model, doc2);
    throw new Error(`Unknown model type: ${model.getType()}`);
  }
  function matchSelector(el, selector) {
    if (selector.startsWith("#")) {
      return el.getAttribute("id") === selector.slice(1);
    }
    if (selector.startsWith(".")) {
      const className = el.getAttribute("class");
      return className ? className.split(/\s+/).includes(selector.slice(1)) : false;
    }
    if (selector.startsWith("[") && selector.endsWith("]")) {
      const parts = selector.slice(1, -1).split("=");
      const key = parts[0];
      const val = parts[1] ? parts[1].replace(/['"]/g, "") : null;
      const attr = el.getAttribute(key);
      return val ? attr === val : attr !== null;
    }
    return el.tagName === selector || selector === "*";
  }
  function querySelectorAllRecursive(root, selector, results) {
    const children = root.childNodes;
    for (const child of children) {
      if (child instanceof Element) {
        if (matchSelector(child, selector)) {
          results.push(child);
        }
        querySelectorAllRecursive(child, selector, results);
      }
    }
  }

  // demo/app.ts
  var sourceEditor = document.getElementById("source-editor");
  var treeRoot = document.getElementById("tree-root");
  var propEditor = document.getElementById("prop-editor");
  var status = document.getElementById("status");
  var api;
  var doc;
  var selectedNode = null;
  var binder;
  var initialXml = `<root>
  <item id="1" status="active">
    <name>Apple</name>
    <price currency="USD">1.50</price>
  </item>
  <!-- Out of stock -->
  <item id="2" status="inactive">
    <name>Banana</name>
    <price>0.80</price>
  </item>
</root>`;
  sourceEditor.value = initialXml;
  function init() {
    const input = sourceEditor.value;
    api = new XMLAPI(input);
    doc = new Document();
    binder = api.binder;
    const observer = {
      onAttributeChange: (element, name, value) => {
        const model = element.getModel();
        const patch = binder.calcSetAttributePatch(model, name, value || "");
        if (patch && value !== null) {
          api.updateInput(patch.start, patch.end, patch.text);
          sourceEditor.value = api.input;
          updateStatus();
        } else {
          console.warn("Could not calculate patch for attribute change");
        }
      },
      onTextChange: (node, text) => {
        const model = node.getModel();
        if (model.parent) {
          const patch = binder.calcUpdateTextPatch(model.parent, text);
          if (patch) {
            api.updateInput(patch.start, patch.end, patch.text);
            sourceEditor.value = api.input;
            updateStatus();
          }
        }
      },
      onChildAdded: () => {
      },
      onChildRemoved: () => {
      }
    };
    doc.setObserver(observer);
    updateStatus();
    renderTree();
  }
  function updateStatus() {
    if (api.cst && api.cst.wellFormed) {
      status.textContent = "OK";
      status.style.color = "green";
    } else {
      status.textContent = "Parse Error";
      status.style.color = "red";
    }
  }
  function renderTree() {
    treeRoot.innerHTML = "";
    if (!api.model) return;
    doc.documentElement = createWrapper(api.model, doc);
    treeRoot.appendChild(renderNode(doc.documentElement));
  }
  function renderNode(node) {
    const div = document.createElement("div");
    div.className = "node";
    if (node === selectedNode) div.classList.add("selected");
    div.onclick = (e) => {
      e.stopPropagation();
      selectNode(node);
    };
    if (node.nodeType === node.ELEMENT_NODE) {
      const el = node;
      const tagSpan = document.createElement("span");
      tagSpan.className = "tag-name";
      tagSpan.textContent = el.tagName;
      div.appendChild(tagSpan);
      const model = el.getModel();
      if (model.attributes) {
        for (const [k, v] of model.attributes) {
          div.appendChild(document.createTextNode(" "));
          const attrName = document.createElement("span");
          attrName.className = "attr-name";
          attrName.textContent = k;
          div.appendChild(attrName);
          div.appendChild(document.createTextNode("="));
          const attrVal = document.createElement("span");
          attrVal.className = "attr-value";
          attrVal.textContent = `"${v}"`;
          div.appendChild(attrVal);
        }
      }
      const children = node.childNodes;
      for (let i = 0; i < children.length; i++) {
        div.appendChild(renderNode(children.item(i)));
      }
    } else if (node.nodeType === node.TEXT_NODE) {
      const span = document.createElement("span");
      span.className = "text-node";
      span.textContent = node.textContent;
      div.appendChild(span);
    } else {
      div.textContent = `[${node.nodeName}]`;
    }
    return div;
  }
  function selectNode(node) {
    selectedNode = node;
    const allNodes = treeRoot.querySelectorAll(".node");
    allNodes.forEach((n) => n.classList.remove("selected"));
    renderTree();
    renderProps(node);
  }
  function renderProps(node) {
    propEditor.innerHTML = "";
    const typeInfo = document.createElement("div");
    typeInfo.textContent = `Type: ${node.nodeName}`;
    propEditor.appendChild(typeInfo);
    if (node.nodeType === node.ELEMENT_NODE) {
      const el = node;
      const model = el.getModel();
      const attrsHeader = document.createElement("h4");
      attrsHeader.textContent = "Attributes";
      propEditor.appendChild(attrsHeader);
      for (const [key, value] of model.attributes) {
        const row = document.createElement("div");
        const label = document.createElement("label");
        label.textContent = key + ": ";
        const input = document.createElement("input");
        input.value = value;
        input.onchange = () => {
          el.setAttribute(key, input.value);
        };
        row.appendChild(label);
        row.appendChild(input);
        propEditor.appendChild(row);
      }
      const addRow = document.createElement("div");
      const nameInput = document.createElement("input");
      nameInput.placeholder = "New Attr";
      const addBtn = document.createElement("button");
      addBtn.textContent = "Add";
      addBtn.onclick = () => {
        if (nameInput.value) {
          el.setAttribute(nameInput.value, "");
          renderProps(node);
        }
      };
      addRow.appendChild(nameInput);
      addRow.appendChild(addBtn);
      propEditor.appendChild(addRow);
      const textHeader = document.createElement("h4");
      textHeader.textContent = "Text Content";
      propEditor.appendChild(textHeader);
      const textInput = document.createElement("input");
      textInput.value = el.textContent || "";
      textInput.onchange = () => {
        el.textContent = textInput.value;
      };
      propEditor.appendChild(textInput);
    } else if (node.nodeType === node.TEXT_NODE) {
      const cd = node;
      const textHeader = document.createElement("h4");
      textHeader.textContent = "Data";
      propEditor.appendChild(textHeader);
      const textInput = document.createElement("input");
      textInput.value = cd.data;
      textInput.onchange = () => {
        cd.data = textInput.value;
      };
      propEditor.appendChild(textInput);
    }
  }
  sourceEditor.oninput = () => {
    const newVal = sourceEditor.value;
    api = new XMLAPI(newVal);
    binder = api.binder;
    updateStatus();
    renderTree();
  };
  init();
})();
//# sourceMappingURL=bundle.js.map
