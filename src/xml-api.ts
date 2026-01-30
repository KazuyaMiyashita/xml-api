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
  public cst: CST | null = null;
  public ast: AST | null = null;

  constructor(
    input: string, 
    grammar: Grammar = defaultGrammar, 
    converter: Converter = defaultConverter
  ) {
    this.input = input;
    this.grammar = grammar;
    this.converter = converter;
  }

  /**
   * Parses the input string using the configured grammar.
   * @param ruleName The root rule to start parsing from (default: "document")
   * @returns The resulting Concrete Syntax Tree (CST)
   * @throws Error if parsing fails
   */
  parse(ruleName: string = "document"): CST {
    const result = this.grammar.parse(ruleName, this.input);
    if (!result) {
      throw new Error("Parsing failed");
    }
    this.cst = result;
    return result;
  }

  /**
   * Converts the parsed CST into a high-level AST.
   * Automatically calls parse() if it hasn't been called yet.
   * @returns The root AST node
   * @throws Error if conversion fails or does not result in a valid element
   */
  generateAST(): AST {
    if (!this.cst) {
        this.parse();
    }
    
    // this.cst is guaranteed to be not null here
    const result = this.converter(this.cst!, this.input);
    
    if (result instanceof AST) {
        this.ast = result;
        return result;
    } else {
        throw new Error("Conversion result is not a valid AST (Root element missing or is raw text).");
    }
  }
}