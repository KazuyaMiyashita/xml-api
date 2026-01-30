import { CST } from './xml-cst';
import { AST } from './xml-ast';
import { Grammar } from './grammar';
import { Parser } from './parser';
import { grammar as defaultGrammar } from './xml-grammar';
import { convert as defaultConverter } from './xml-converter';

export type Converter = (node: CST, input: string) => AST | string | null;

export class XMLAPI {
  public input: string;
  public grammar: Grammar;
  public parser: Parser;
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
    this.parser = new Parser(grammar);
    this.converter = converter;

    this.cst = this.parse();
    if (this.cst && this.cst.wellFormed) {
      this.ast = this.generateAST(this.cst);
    }
  }

  /**
   * Parses the input string using the configured grammar.
   */
  private parse(ruleName?: string): CST | null {
    try {
      return this.parser.parse(this.input, ruleName);
    } catch (e) {
      console.error("Parse error:", e);
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

  /**
   * Updates the input text and refreshes the CST/AST.
   * @param from Start offset of the change.
   * @param to End offset of the change.
   * @param value New text to insert.
   */
  public update_input(from: number, to: number, value: string): void {
    const delta = value.length - (to - from);
    const oldInput = this.input;
    const newEnd = from + value.length;
    this.input = oldInput.slice(0, from) + value + oldInput.slice(to);

    if (this.cst) {
      // 1. Shift existing positions
      this.cst.shift(from, delta);
      
      // 2. Try incremental re-parse
      const success = this.tryIncrementalUpdate(from, newEnd);
      if (!success) {
        this.cst = this.parse();
      }
    } else {
      this.cst = this.parse();
    }

    if (this.cst && this.cst.wellFormed) {
      this.ast = this.generateAST(this.cst);
    } else {
      this.ast = null;
    }
  }

  private tryIncrementalUpdate(from: number, to: number): boolean {
    if (!this.cst) return false;

    // Find the smallest node that covers the changed range
    let target: CST | null = this.findNodeAt(from, to);
    
    // We need a node with a name to re-parse it specifically
    while (target && !target.name) {
      target = target.parent;
    }

    if (!target || !target.name) {
      return false;
    }

    // Try to re-parse this node
    // We start from target.start and expect it to consume up to target.end
    const result = this.parser.parseAt(this.input, target.start, target.name);
    
    if (result && result.end === target.end) {
      // Replace the node in the parent
      if (target.parent) {
        const index = target.parent.children.indexOf(target);
        if (index !== -1) {
          target.parent.children[index] = result.node;
          result.node.parent = target.parent;
          
          // Re-validate ancestors
          return this.validateAncestors(result.node);
        }
      } else {
        // It was the root node
        this.cst = result.node;
        return true;
      }
    }

    return false;
  }

  private findNodeAt(from: number, to: number): CST | null {
    if (!this.cst) return null;
    let current = this.cst;
    while (true) {
      let foundChild = false;
      for (const child of current.children) {
        if (child.start <= from && child.end >= to) {
          current = child;
          foundChild = true;
          break;
        }
      }
      if (!foundChild) break;
    }
    return current;
  }

  private validateAncestors(node: CST): boolean {
    let current: CST | null = node.parent;
    while (current) {
      // Check if all children are well-formed
      let childrenWellFormed = true;
      for (const child of current.children) {
        if (!child.wellFormed) {
          childrenWellFormed = false;
          break;
        }
      }

      let selfWellFormed = childrenWellFormed;
      if (current.name) {
        const validator = this.grammar.validators[current.name];
        if (validator && !validator(current, this.input)) {
          selfWellFormed = false;
        }
      }

      current.wellFormed = selfWellFormed;
      // We continue going up even if this node is not well-formed,
      // because we want to update the well-formed status of all ancestors.
      // But we return false to indicate that incremental update failed to restore well-formedness.
      if (!current.wellFormed) {
          // Keep going up to update others, but remember we are invalid
          this.invalidateRemainingAncestors(current.parent);
          return false;
      }
      current = current.parent;
    }
    return true;
  }

  private invalidateRemainingAncestors(node: CST | null): void {
      let current = node;
      while (current) {
          current.wellFormed = false;
          current = current.parent;
      }
  }
}
