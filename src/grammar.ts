import { CST } from "./xml-cst";

/**
 * A function that performs semantic or contextual validation on a parsed CST node.
 *
 * It is used to enforce rules that cannot be easily expressed by the grammar itself,
 * such as matching start and end tag names or ensuring attribute uniqueness.
 * If it returns false, the node's `wellFormed` flag is set to false, but the
 * parsing process continues.
 */
export type Validator = (node: CST, input: string) => boolean;

/**
 * Fundamental building blocks of the grammar.
 * These can be combined to represent various syntax structures equivalent to EBNF.
 */
export type Expression =
  /** Matches a specific exact string. */
  | { type: "Literal"; value: string }
  /** Matches a regular expression pattern. */
  | { type: "RegExpMatch"; pattern: string }
  /** Matches multiple expressions in order (AND). */
  | { type: "Sequence"; expressions: Expression[] }
  /** Matches any one of the provided expressions (OR). */
  | { type: "Choice"; expressions: Expression[] }
  /** Matches an expression repeated a specified number of times. */
  | { type: "Repeat"; expression: Expression; min: number; max: number }
  /** Matches expression A, provided that expression B does not match (negation/exclusion). */
  | { type: "Exclusion"; a: Expression; b: Expression }
  /** Invokes another named rule (used for recursive definitions). */
  | { type: "Reference"; name: string };

// Combinators

/** Defines a literal string match. */
export const lit = (value: string): Expression => ({ type: "Literal", value });
/** Defines a regular expression match. */
export const reg = (pattern: string): Expression => ({
  type: "RegExpMatch",
  pattern,
});
/** Defines a sequence of matches in order. */
export const seq = (...expressions: Expression[]): Expression => ({
  type: "Sequence",
  expressions,
});
/** Defines a choice between multiple alternatives. */
export const alt = (...expressions: Expression[]): Expression => ({
  type: "Choice",
  expressions,
});
/** Zero or more repetitions (equivalent to `*` in EBNF). */
export const rep = (expression: Expression): Expression => ({
  type: "Repeat",
  expression,
  min: 0,
  max: Infinity,
});
/** One or more repetitions (equivalent to `+` in EBNF). */
export const plus = (expression: Expression): Expression => ({
  type: "Repeat",
  expression,
  min: 1,
  max: Infinity,
});
/** Zero or one occurrence (equivalent to `?` in EBNF, optional). */
export const opt = (expression: Expression): Expression => ({
  type: "Repeat",
  expression,
  min: 0,
  max: 1,
});
/** Matches A but excludes B (e.g., matching PITarget as a Name excluding "xml"). */
export const exc = (a: Expression, b: Expression): Expression => ({
  type: "Exclusion",
  a,
  b,
});
/** References another rule by its name. */
export const ref = (name: string): Expression => ({ type: "Reference", name });

export class Grammar {
  constructor(
    public readonly rules: { [key: string]: Expression },
    public readonly validators: { [key: string]: Validator },
    public readonly rootRule: string,
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
