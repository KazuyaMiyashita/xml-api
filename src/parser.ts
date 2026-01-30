import { CST } from './xml-cst';
import { Grammar, Expression, Validator } from './grammar';

interface Context {
  input: string;
  pos: number;
  grammar: Grammar;
}

export class Parser {
  constructor(private grammar: Grammar) {}

  parse(input: string, rootRule?: string): CST | null {
    const startRule = rootRule || this.grammar.rootRule;
    const ctx: Context = { input, pos: 0, grammar: this.grammar };
    
    // Treat the entry point as a Reference to the root rule.
    // This ensures consistent behavior (validation, node type naming) with internal references.
    const rootExpr: Expression = { type: 'Reference', name: startRule };
    
    const result = this.execute(rootExpr, ctx);
    
    // Ensure the entire input is consumed and the result is well-formed
    if (result && ctx.pos === input.length) {
       // Note: Top-level validation is already handled by executeReference if rootExpr is a Reference.
       // If result.wellFormed is false, we still return it, but the caller can check the flag.
       return result;
    }
    return null;
  }

  /**
   * Parses the input starting from a specific position using a given rule.
   * Useful for incremental parsing.
   */
  public parseAt(input: string, pos: number, ruleName: string): { node: CST, end: number } | null {
    const ctx: Context = { input, pos, grammar: this.grammar };
    const rootExpr: Expression = { type: 'Reference', name: ruleName };
    const result = this.execute(rootExpr, ctx);
    if (result) {
      return { node: result, end: ctx.pos };
    }
    return null;
  }

  private execute(expr: Expression, ctx: Context): CST | null {
    switch (expr.type) {
      case 'Literal': return this.execLiteral(expr, ctx);
      case 'RegExpMatch': return this.execRegExp(expr, ctx);
      case 'Sequence': return this.execSequence(expr, ctx);
      case 'Choice': return this.execChoice(expr, ctx);
      case 'Repeat': return this.execRepeat(expr, ctx);
      case 'Exclusion': return this.execExclusion(expr, ctx);
      case 'Reference': return this.execReference(expr, ctx);
    }
  }

  private execLiteral(expr: { type: 'Literal', value: string }, ctx: Context): CST | null {
    if (ctx.input.startsWith(expr.value, ctx.pos)) {
      const start = ctx.pos;
      ctx.pos += expr.value.length;
      return new CST("literal", undefined, start, ctx.pos);
    }
    return null;
  }

  private execRegExp(expr: { type: 'RegExpMatch', pattern: string }, ctx: Context): CST | null {
    const regex = new RegExp(expr.pattern, "y");
    regex.lastIndex = ctx.pos;
    const match = regex.exec(ctx.input);
    if (match) {
      const start = ctx.pos;
      ctx.pos += match[0].length;
      return new CST("regex", undefined, start, ctx.pos);
    }
    return null;
  }

  private execSequence(expr: { type: 'Sequence', expressions: Expression[] }, ctx: Context): CST | null {
    const startPos = ctx.pos;
    const children: CST[] = [];
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
    return new CST("sequence", undefined, startPos, ctx.pos, children, wellFormed);
  }

  private execChoice(expr: { type: 'Choice', expressions: Expression[] }, ctx: Context): CST | null {
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

  private execRepeat(expr: { type: 'Repeat', expression: Expression, min: number, max: number }, ctx: Context): CST | null {
    const startPos = ctx.pos;
    const children: CST[] = [];
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
    return new CST("repeat", undefined, startPos, ctx.pos, children, wellFormed);
  }

  private execExclusion(expr: { type: 'Exclusion', a: Expression, b: Expression }, ctx: Context): CST | null {
    const startPos = ctx.pos;
    const resultA = this.execute(expr.a, ctx);
    if (resultA === null) return null;

    const endPosA = ctx.pos;
    ctx.pos = startPos;
    const resultB = this.execute(expr.b, ctx);
    
    // Check if B matches and is at least as long as A
    if (resultB !== null && (startPos + (resultB.end - resultB.start) >= endPosA)) {
      ctx.pos = startPos;
      return null;
    }
    
    ctx.pos = endPosA;
    return resultA;
  }

  private execReference(expr: { type: 'Reference', name: string }, ctx: Context): CST | null {
    const rule = ctx.grammar.rules[expr.name];
    if (!rule) return null; // Should not happen if grammar is well-defined, or could throw error
    
    const result = this.execute(rule, ctx);
    if (result === null) return null;
    
    // Always wrap the result to preserve the rule name in the hierarchy.
    const node = new CST(result.type, expr.name, result.start, result.end, [result], result.wellFormed);

    // Apply validation
    const validator = ctx.grammar.validators[expr.name];
    if (validator) {
      // Pass only necessary context (input string) to the validator
      if (!validator(node, ctx.input)) {
        node.wellFormed = false;
      }
    }

    return node;
  }
}