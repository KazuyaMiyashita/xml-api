import { 
    Expression, CST, Context, 
    Literal, RegExpMatch, Sequence, Choice, Repeat, Exclusion, Reference 
} from './parser';

export class Grammar {
  rules: { [key: string]: Expression };
  validators: { [key: string]: (node: CST, ctx: Context) => boolean };

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
  verifyRule(name: string, validator: (node: CST, ctx: Context) => boolean): void {
    if (!this.rules[name]) {
        throw new Error(`Rule ${name} not found`);
    }
    this.validators[name] = validator;
  }

  parse(ruleName: string, input: string): CST | null {
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
