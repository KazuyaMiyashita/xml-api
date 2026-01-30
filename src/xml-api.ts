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
      // We try to update the tree in-place. 
      // If we fail to update even the root, cst becomes null.
      const success = this.tryIncrementalUpdate(from, newEnd);
      if (!success) {
        this.cst = null;
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

    // Start search from the smallest node touching the change
    let target: CST | null = this.findNodeAt(from, to);
    
    // Iterate up the tree until we find a node that can successfully re-parse 
    // and accommodate the change (size matches).
    while (target) {
        // We can only re-parse named nodes (rules)
        if (target.name) {
             const result = this.parser.parseAt(this.input, target.start, target.name);
             
             // Check if parse was successful AND the new node's length matches the 
             // expected length of the target node (which has been shifted).
             // If length matches, it means the change is contained within this node's boundaries.
             if (result && result.end === target.end) {
                 // Success! Replace target with result.node
                 if (target.parent) {
                     const index = target.parent.children.indexOf(target);
                     if (index !== -1) {
                         target.parent.children[index] = result.node;
                         result.node.parent = target.parent;
                         this.updateAncestorsWellFormed(result.node);
                         return true;
                     }
                 } else {
                     // We replaced the root node
                     this.cst = result.node;
                     // Root has no ancestors to update
                     return true;
                 }
             }
        }
        
        // If we couldn't parse or boundaries didn't match, try the parent.
        // This effectively expands the scope of re-parsing.
        target = target.parent;
    }
    
    // If we reached here, even re-parsing the root failed (or matched wrong length).
    return false;
  }

  private findNodeAt(from: number, to: number): CST | null {
    if (!this.cst) return null;
    let current = this.cst;
    // Simple descent to find the deepest node covering the range
    while (true) {
      let foundChild = false;
      for (const child of current.children) {
        // If we are inserting (from==to), strict inequality on one side might fail if at boundary.
        // But for covering, start <= from && end >= to works generally.
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

  private updateAncestorsWellFormed(node: CST): void {
    let current: CST | null = node.parent;
    while (current) {
      // 1. Check if all children are well-formed
      let childrenWellFormed = true;
      for (const child of current.children) {
        if (!child.wellFormed) {
          childrenWellFormed = false;
          break;
        }
      }

      // 2. Check local validator if children are OK (or check anyway?)
      // Standard: if children are broken, parent is broken.
      let selfWellFormed = childrenWellFormed;
      if (current.name && selfWellFormed) {
        const validator = this.grammar.validators[current.name];
        if (validator && !validator(current, this.input)) {
          selfWellFormed = false;
        }
      }

      current.wellFormed = selfWellFormed;
      current = current.parent;
    }
  }
}
