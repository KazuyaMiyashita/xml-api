
export class CST {
  constructor(
    public type: string,
    public start: number,
    public end: number,
    public children: CST[] = [],
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
  validators: { [key: string]: (node: CST, ctx: Context) => boolean };
}

export abstract class Expression {
  label?: string;
  abstract execute(ctx: Context): CST | null;
}

export class Literal extends Expression {
  constructor(public value: string) {
    super();
  }
  execute(ctx: Context): CST | null {
    if (ctx.input.startsWith(this.value, ctx.pos)) {
      const start = ctx.pos;
      ctx.pos += this.value.length;
      return new CST(this.label || "literal", start, ctx.pos);
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
  execute(ctx: Context): CST | null {
    this.regex.lastIndex = ctx.pos;
    const match = this.regex.exec(ctx.input);
    if (match) {
      const start = ctx.pos;
      ctx.pos += match[0].length;
      return new CST(this.label || "regex", start, ctx.pos);
    }
    return null;
  }
}

export class Sequence extends Expression {
  constructor(public expressions: Expression[]) {
    super();
  }
  execute(ctx: Context): CST | null {
    const startPos = ctx.pos;
    const children: CST[] = [];
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
    return new CST(this.label || "sequence", startPos, ctx.pos, children, wellFormed);
  }
}

export class Choice extends Expression {
  constructor(public expressions: Expression[]) {
    super();
  }
  execute(ctx: Context): CST | null {
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
  execute(ctx: Context): CST | null {
    const startPos = ctx.pos;
    const children: CST[] = [];
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
    return new CST(this.label || "repeat", startPos, ctx.pos, children, wellFormed);
  }
}

export class Exclusion extends Expression {
  constructor(public a: Expression, public b: Expression) {
    super();
  }
  execute(ctx: Context): CST | null {
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
  execute(ctx: Context): CST | null {
    const rule = ctx.rules[this.name];
    if (!rule) return null;
    const result = rule.execute(ctx);
    if (result === null) return null;
    
    // Create the node for this reference
    const node = new CST(this.name, result.start, result.end, result.children, result.wellFormed);

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
