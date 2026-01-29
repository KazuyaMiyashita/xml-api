export class Node {
  constructor(
    public type: string,
    public start: number,
    public end: number,
    public children: Node[] = [],
    public wellFormed: boolean = true
  ) {}

  getText(input: string): string {
    return input.slice(this.start, this.end);
  }
}

export interface Context {
  input: string;
  pos: number;
  rules: { [key: string]: Expression };
  validators: { [key: string]: (node: Node, ctx: Context) => boolean };
}

export abstract class Expression {
  label?: string;
  abstract execute(ctx: Context): Node | null;
}

export class Grammar {
  rules: { [key: string]: Expression };
  validators: { [key: string]: (node: Node, ctx: Context) => boolean };

  constructor() {
    this.rules = {};
    this.validators = {};
  }

  rule(name: string, expression: Expression): Expression {
    this.rules[name] = expression;
    expression.label = name;
    return expression;
  }

  /**
   * Registers a well-formedness validator for a specific rule.
   * The validator is called after a successful parse of the rule.
   * 
   * @param name The name of the rule to validate
   * @param validator The validation function
   */
  verifyRule(name: string, validator: (node: Node, ctx: Context) => boolean): void {
    if (!this.rules[name]) {
        throw new Error(`Rule ${name} not found`);
    }
    this.validators[name] = validator;
  }

  parse(ruleName: string, input: string): Node | null {
    const ctx: Context = { input, pos: 0, rules: this.rules, validators: this.validators };
    if (!this.rules[ruleName]) {
        throw new Error(`Rule ${ruleName} not found`);
    }
    const result = this.rules[ruleName].execute(ctx);
    if (result && ctx.pos === input.length) {
      // Validate the top-level rule result
      const validator = this.validators[ruleName];
      if (validator) {
        if (!validator(result, ctx)) {
           result.wellFormed = false;
        }
      }
      return result;
    }
    return null;
  }

  // Combinators
  lit(value: string): Literal {
    return new Literal(value);
  }

  reg(pattern: string): RegExpMatch {
    return new RegExpMatch(pattern);
  }

  seq(...expressions: Expression[]): Sequence {
    return new Sequence(expressions);
  }

  alt(...expressions: Expression[]): Choice {
    return new Choice(expressions);
  }

  rep(expression: Expression): Repeat {
    return new Repeat(expression, 0, Infinity);
  }

  plus(expression: Expression): Repeat {
    return new Repeat(expression, 1, Infinity);
  }

  opt(expression: Expression): Repeat {
    return new Repeat(expression, 0, 1);
  }

  exc(a: Expression, b: Expression): Exclusion {
    return new Exclusion(a, b);
  }

  ref(name: string): Reference {
    return new Reference(name);
  }
}

export class Literal extends Expression {
  constructor(public value: string) {
    super();
  }
  execute(ctx: Context): Node | null {
    if (ctx.input.startsWith(this.value, ctx.pos)) {
      const start = ctx.pos;
      ctx.pos += this.value.length;
      return new Node(this.label || "literal", start, ctx.pos);
    }
    return null;
  }
}

export class RegExpMatch extends Expression {
  regex: RegExp;
  constructor(pattern: string) {
    super();
    this.regex = new RegExp(pattern, "y");
  }
  execute(ctx: Context): Node | null {
    this.regex.lastIndex = ctx.pos;
    const match = this.regex.exec(ctx.input);
    if (match) {
      const start = ctx.pos;
      ctx.pos += match[0].length;
      return new Node(this.label || "regex", start, ctx.pos);
    }
    return null;
  }
}

export class Sequence extends Expression {
  constructor(public expressions: Expression[]) {
    super();
  }
  execute(ctx: Context): Node | null {
    const startPos = ctx.pos;
    const children: Node[] = [];
    let wellFormed = true;
    for (const expr of this.expressions) {
      const result = expr.execute(ctx);
      if (result === null) {
        ctx.pos = startPos;
        return null;
      }
      children.push(result);
      if (!result.wellFormed) {
        wellFormed = false; // Propagate non-well-formed status from child to parent
      }
    }
    return new Node(this.label || "sequence", startPos, ctx.pos, children, wellFormed);
  }
}

export class Choice extends Expression {
  constructor(public expressions: Expression[]) {
    super();
  }
  execute(ctx: Context): Node | null {
    for (const expr of this.expressions) {
      const startPos = ctx.pos;
      const result = expr.execute(ctx);
      if (result !== null) {
        return result;
      }
      ctx.pos = startPos;
    }
    return null;
  }
}

export class Repeat extends Expression {
  constructor(public expression: Expression, public min: number, public max: number) {
    super();
  }
  execute(ctx: Context): Node | null {
    const startPos = ctx.pos;
    const children: Node[] = [];
    let count = 0;
    let wellFormed = true;
    while (count < this.max) {
      const checkpoint = ctx.pos;
      const result = this.expression.execute(ctx);
      if (result === null || ctx.pos === checkpoint) break;
      children.push(result);
      if (!result.wellFormed) {
        wellFormed = false; // Propagate non-well-formed status from child to parent
      }
      count++;
    }
    if (count < this.min) {
      ctx.pos = startPos;
      return null;
    }
    return new Node(this.label || "repeat", startPos, ctx.pos, children, wellFormed);
  }
}

export class Exclusion extends Expression {
  constructor(public a: Expression, public b: Expression) {
    super();
  }
  execute(ctx: Context): Node | null {
    const startPos = ctx.pos;
    const resultA = this.a.execute(ctx);
    if (resultA === null) return null;

    const endPosA = ctx.pos;
    ctx.pos = startPos;
    const resultB = this.b.execute(ctx);
    
    // Check if B matches and is at least as long as A
    if (resultB !== null && (startPos + (resultB.end - resultB.start) >= endPosA)) {
      ctx.pos = startPos;
      return null;
    }
    
    ctx.pos = endPosA;
    return resultA;
  }
}

export class Reference extends Expression {
  constructor(public name: string) {
    super();
  }
  execute(ctx: Context): Node | null {
    const rule = ctx.rules[this.name];
    if (!rule) return null;
    const result = rule.execute(ctx);
    if (result === null) return null;
    
    // Create the node for this reference
    const node = new Node(this.name, result.start, result.end, result.children, result.wellFormed);

    // Apply validation if a validator exists for this rule name
    const validator = ctx.validators[this.name];
    if (validator) {
      if (!validator(node, ctx)) {
        node.wellFormed = false;
      }
    }

    return node;
  }
}

/**
 * Unimplemented Well-formedness Constraints (WFC)
 * 
 * The following constraints are currently not enforced by this parser.
 * Implementation would require an Entity Manager, DTD Processor, and extended Context.
 * 
 * - [WFC: PEs in Internal Subset]
 *   "In the internal DTD subset, parameter-entity references MUST NOT occur within markup declarations..."
 *   https://www.w3.org/TR/xml/#wfc-PEinInternalSubset
 * 
 * - [WFC: External Subset]
 *   "The external subset, if any, MUST match the production for extSubset."
 *   https://www.w3.org/TR/xml/#ExtSubset
 * 
 * - [WFC: PE Between Declarations]
 *   "The replacement text of a parameter entity reference in a DeclSep MUST match the production extSubsetDecl."
 *   https://www.w3.org/TR/xml/#PE-between-Decls
 * 
 * - [WFC: No External Entity References]
 *   "Attribute values MUST NOT contain direct or indirect entity references to external entities."
 *   https://www.w3.org/TR/xml/#NoExternalRefs
 * 
 * - [WFC: No < in Attribute Values]
 *   "The replacement text of any entity referred to directly or indirectly in an attribute value MUST NOT contain a <."
 *   https://www.w3.org/TR/xml/#CleanAttrVals
 * 
 * - [WFC: Legal Character]
 *   "Characters referred to using character references MUST match the production for Char."
 *   https://www.w3.org/TR/xml/#wf-Legalchar
 * 
 * - [WFC: Entity Declared]
 *   "In a document without any DTD, a document with only an internal DTD subset which contains no parameter entity references, or a document with standalone='yes', for an entity reference that does not occur within the external subset or a parameter entity, the Name given in the entity reference MUST match that in an entity declaration..."
 *   https://www.w3.org/TR/xml/#wf-entdeclared
 * 
 * - [WFC: Parsed Entity]
 *   "An internal general parsed entity MUST match the production content."
 *   https://www.w3.org/TR/xml/#textent
 * 
 * - [WFC: No Recursion]
 *   "A parsed entity MUST NOT contain a recursive reference to itself, either directly or indirectly."
 *   https://www.w3.org/TR/xml/#norecursion
 * 
 * - [WFC: In DTD]
 *   "Parameter-entity references MUST NOT occur outside the DTD."
 *   https://www.w3.org/TR/xml/#indtd
 */