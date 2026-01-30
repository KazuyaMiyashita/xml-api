import { CST } from './xml-cst';

export type Validator = (node: CST, input: string) => boolean;

export type Expression =
  | { type: 'Literal', value: string }
  | { type: 'RegExpMatch', pattern: string }
  | { type: 'Sequence', expressions: Expression[] }
  | { type: 'Choice', expressions: Expression[] }
  | { type: 'Repeat', expression: Expression, min: number, max: number }
  | { type: 'Exclusion', a: Expression, b: Expression }
  | { type: 'Reference', name: string };

// Combinators
export const lit = (value: string): Expression => ({ type: 'Literal', value });
export const reg = (pattern: string): Expression => ({ type: 'RegExpMatch', pattern });
export const seq = (...expressions: Expression[]): Expression => ({ type: 'Sequence', expressions });
export const alt = (...expressions: Expression[]): Expression => ({ type: 'Choice', expressions });
export const rep = (expression: Expression): Expression => ({ type: 'Repeat', expression, min: 0, max: Infinity });
export const plus = (expression: Expression): Expression => ({ type: 'Repeat', expression, min: 1, max: Infinity });
export const opt = (expression: Expression): Expression => ({ type: 'Repeat', expression, min: 0, max: 1 });
export const exc = (a: Expression, b: Expression): Expression => ({ type: 'Exclusion', a, b });
export const ref = (name: string): Expression => ({ type: 'Reference', name });

export class Grammar {
  constructor(
    public readonly rules: { [key: string]: Expression },
    public readonly validators: { [key: string]: Validator },
    public readonly rootRule: string
  ) {}
}

export class GrammarBuilder {
  private rules: { [key: string]: Expression } = {};
  private validators: { [key: string]: Validator } = {};
  private rootRule: string | null = null;

  rule(name: string, expression: Expression): void {
    if (this.rootRule === null) {
      this.rootRule = name;
    }
    this.rules[name] = expression;
  }

  verifyRule(name: string, validator: Validator): void {
    if (!this.rules[name]) {
      throw new Error(`Rule ${name} not found`);
    }
    this.validators[name] = validator;
  }

  build(rootRule?: string): Grammar {
    const root = rootRule || this.rootRule;
    if (!root) {
      throw new Error("No root rule defined");
    }
    // Return an immutable Grammar instance with a shallow copy of the definitions
    return new Grammar({ ...this.rules }, { ...this.validators }, root);
  }
}