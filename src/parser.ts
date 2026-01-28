export class Node {
  constructor(
    public type: string,
    public text: string,
    public children: Node[] = []
  ) {}
}

export interface Context {
  input: string;
  pos: number;
  rules: { [key: string]: Expression };
}

export abstract class Expression {
  label?: string;
  abstract execute(ctx: Context): Node | null;
}

export class Grammar {
  rules: { [key: string]: Expression };

  constructor() {
    this.rules = {};
  }

  rule(name: string, expression: Expression): Expression {
    this.rules[name] = expression;
    expression.label = name;
    return expression;
  }

  parse(ruleName: string, input: string): Node | null {
    const ctx: Context = { input, pos: 0, rules: this.rules };
    if (!this.rules[ruleName]) {
        throw new Error(`Rule ${ruleName} not found`);
    }
    const result = this.rules[ruleName].execute(ctx);
    if (result && ctx.pos === input.length) {
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
      // const start = ctx.pos; // unused
      ctx.pos += this.value.length;
      return new Node(this.label || "literal", this.value);
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
      ctx.pos += match[0].length;
      return new Node(this.label || "regex", match[0]);
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
    for (const expr of this.expressions) {
      const result = expr.execute(ctx);
      if (result === null) {
        ctx.pos = startPos;
        return null;
      }
      children.push(result);
    }
    return new Node(this.label || "sequence", ctx.input.slice(startPos, ctx.pos), children);
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
    while (count < this.max) {
      const checkpoint = ctx.pos;
      const result = this.expression.execute(ctx);
      if (result === null || ctx.pos === checkpoint) break;
      children.push(result);
      count++;
    }
    if (count < this.min) {
      ctx.pos = startPos;
      return null;
    }
    return new Node(this.label || "repeat", ctx.input.slice(startPos, ctx.pos), children);
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
    
    // Logic check: if B matches and its length covers A?
    // Original logic: if (resultB !== null && (startPos + resultB.text.length >= endPosA))
    // This implies if B matches "as much or more" than A matched? 
    // Usually exclusion A - B means A matches, and B does NOT match at the same position.
    // But the original code was:
    /*
    if (resultB !== null && (startPos + resultB.text.length >= endPosA)) {
      ctx.pos = startPos;
      return null;
    }
    */
    // This seems to implement "A but not if B matches same text or longer".
    // Let's keep the original logic.
    
    if (resultB !== null && (startPos + resultB.text.length >= endPosA)) {
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
    return new Node(this.name, result.text, result.children);
  }
}