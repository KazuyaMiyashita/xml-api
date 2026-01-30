import { CST } from './parser';
import { AST } from './xml-ast';
import { Grammar } from './grammar';
import { g as defaultGrammar } from './xml-grammar';
import { convert as defaultConverter } from './xml-converter';

export type Converter = (node: CST, input: string) => AST | string | null;

export class XMLAPI {
  public input: string;
  public grammar: Grammar;
  public converter: Converter;

  /** CST is null if parsing fails. */
  public cst: CST | null = null;
  /** AST is null if CST is null or not well-formed. */
  public ast: AST | null = null;

  constructor(
    input: string, 
    grammar: Grammar = defaultGrammar, 
    converter: Converter = defaultConverter
  ) {
    this.input = input;
    this.grammar = grammar;
    this.converter = converter;

    this.cst = this.parse();
    if (this.cst && this.cst.wellFormed) {
      this.ast = this.generateAST(this.cst);
    }
  }

  /**
   * Parses the input string using the configured grammar.
   */
  private parse(ruleName: string = "document"): CST | null {
    try {
      return this.grammar.parse(ruleName, this.input);
    } catch (e) {
      return null;
    }
  }

  /**
   * Converts the parsed CST into a high-level AST.
   */
  private generateAST(cst: CST): AST | null {
    const result = this.converter(cst, this.input);
    return result instanceof AST ? result : null;
  }
}