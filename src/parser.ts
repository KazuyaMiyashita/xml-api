export class Node {
  constructor(
    public type: string,
    public start: number,
    public end: number,
    public children: Node[] = []
  ) {}

  getText(input: string): string {
    return input.slice(this.start, this.end);
  }
}

export interface Context {
  input: string;
  pos: number;
  rules: { [key: string]: Expression };
  tags: string[];
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
    const ctx: Context = { input, pos: 0, rules: this.rules, tags: [] };
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

  action(expression: Expression, action: (node: Node, ctx: Context) => void): Action {
    return new Action(expression, action);
  }

  check(expression: Expression, predicate: (node: Node, ctx: Context) => boolean): Predicate {
    return new Predicate(expression, predicate);
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
    const startTags = [...ctx.tags];
    const children: Node[] = [];
    for (const expr of this.expressions) {
      const result = expr.execute(ctx);
      if (result === null) {
        ctx.pos = startPos;
        ctx.tags = startTags;
        return null;
      }
      children.push(result);
    }
    return new Node(this.label || "sequence", startPos, ctx.pos, children);
  }
}

export class Choice extends Expression {
  constructor(public expressions: Expression[]) {
    super();
  }
  execute(ctx: Context): Node | null {
    for (const expr of this.expressions) {
      const startPos = ctx.pos;
      const startTags = [...ctx.tags];
      const result = expr.execute(ctx);
      if (result !== null) {
        return result;
      }
      ctx.pos = startPos;
      ctx.tags = startTags;
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
    const startTags = [...ctx.tags];
    const children: Node[] = [];
    let count = 0;
    while (count < this.max) {
      const checkpoint = ctx.pos;
      const checkpointTags = [...ctx.tags];
      const result = this.expression.execute(ctx);
      if (result === null || ctx.pos === checkpoint) {
        ctx.tags = checkpointTags; // Restore tags if match failed or consumed nothing
        break;
      }
      children.push(result);
      count++;
    }
    if (count < this.min) {
      ctx.pos = startPos;
      ctx.tags = startTags;
      return null;
    }
    return new Node(this.label || "repeat", startPos, ctx.pos, children);
  }
}

export class Exclusion extends Expression {
  constructor(public a: Expression, public b: Expression) {
    super();
  }
  execute(ctx: Context): Node | null {
    const startPos = ctx.pos;
    const startTags = [...ctx.tags];
    const resultA = this.a.execute(ctx);
    if (resultA === null) return null;

    const endPosA = ctx.pos;
    const endTagsA = [...ctx.tags];
    ctx.pos = startPos;
    ctx.tags = startTags;
    const resultB = this.b.execute(ctx);
    
    // Check if B matches and is at least as long as A
    if (resultB !== null && (startPos + (resultB.end - resultB.start) >= endPosA)) {
      ctx.pos = startPos;
      ctx.tags = startTags;
      return null;
    }
    
    ctx.pos = endPosA;
    ctx.tags = endTagsA;
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
    return new Node(this.name, result.start, result.end, result.children);
  }
}

export class Action extends Expression {
  constructor(public expression: Expression, public action: (node: Node, ctx: Context) => void) {
    super();
  }
  execute(ctx: Context): Node | null {
    const result = this.expression.execute(ctx);
    if (result) {
      this.action(result, ctx);
    }
    return result;
  }
}

export class Predicate extends Expression {
  constructor(public expression: Expression, public predicate: (node: Node, ctx: Context) => boolean) {
    super();
  }
  execute(ctx: Context): Node | null {
    const startPos = ctx.pos;
    const startTags = [...ctx.tags];
    const result = this.expression.execute(ctx);
    if (result) {
      if (this.predicate(result, ctx)) {
        return result;
      }
      ctx.pos = startPos;
      ctx.tags = startTags;
      return null;
    }
    return null;
  }
}