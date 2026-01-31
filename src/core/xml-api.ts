import { CST } from "./cst/xml-cst";
import { AST } from "./ast/xml-ast";
import { Grammar } from "./cst/grammar";
import { Parser } from "./cst/parser";
import { grammar as defaultGrammar } from "./cst/xml-grammar";
import { convert as defaultConverter } from "./model/xml-binder";
import { XMLBinder } from "./model/xml-binder";
import { ModelElement, ModelNode } from "./model/xml-api-model";

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
  /** Model is the authoritative logical representation. */
  public model: ModelElement | null = null;
  
  private binder: XMLBinder | null = null;

  constructor(
    input: string,
    grammar: Grammar = defaultGrammar,
    converter: Converter = defaultConverter,
  ) {
    this.input = input;
    this.grammar = grammar;
    this.parser = new Parser(grammar);
    this.converter = converter;

    this.cst = this.parse();
    if (this.cst && this.cst.wellFormed) {
      if (converter === defaultConverter) {
        // Use the new Binder-based architecture
        this.binder = new XMLBinder(input);
        const modelNode = this.binder.hydrate(this.cst);
        if (modelNode instanceof ModelElement) {
          this.model = modelNode;
          const proj = this.binder.project(this.model);
          this.ast = proj instanceof AST ? proj : null;
        }
      } else {
        // Legacy/Custom converter mode
        this.ast = this.generateAST(this.cst);
      }
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
   *
   * - `update_input` is defined only when `from <= to` and both indices are within the range of the original `input` string.
   * - The state of the `XMLAPI` instance after calling `update_input(from, to, value)` **MUST** be identical to the state of a `new XMLAPI(input.slice(0, from) + value + input.slice(to))` instance.
   * - The implementation **SHOULD** perform incremental updates by re-parsing only the affected sub-tree and avoiding a full re-parse unless structural changes necessitate it, ensuring the operation remains inexpensive.
   *
   * NOTE: Currently, it first attempts an efficient incremental update by finding the smallest node covering the change and re-parsing it.
   * If the re-parsed node's length doesn't match the expected structural boundaries (implying the change affected surrounding nodes),
   * it expands the search to parent nodes. If even the root re-parse fails to match boundaries, it falls back to a full re-parse.
   *
   * @param from Start offset of the change.
   * @param to End offset of the change.
   * @param value New text to insert.
   */
  public update_input(from: number, to: number, value: string): void {
    if (from < 0 || to > this.input.length || from > to) {
      throw new Error("Invalid range for update_input");
    }

    const delta = value.length - (to - from);
    const oldInput = this.input;
    const newEnd = from + value.length;
    this.input = oldInput.slice(0, from) + value + oldInput.slice(to);
    
    // Update binder input if it exists
    if (this.binder) {
      this.binder = new XMLBinder(this.input);
    }

    if (this.cst) {
      // 1. Try incremental re-parse without shifting yet
      // We pass 'to' (old end) because cst is still in old coordinates.
      const incrementalResult = this.tryIncrementalUpdate(from, to, delta);
      if (incrementalResult) {
        // Incremental update successful.
        // CST is already shifted and patched in tryIncrementalUpdate.
        // Now try to update Model/AST incrementally.
        if (this.model && this.binder) {
           this.updateModelAndASTIncremental(incrementalResult.oldNode, incrementalResult.newNode);
        } else {
           this.updateASTIncremental(incrementalResult.oldNode, incrementalResult.newNode);
        }
        
        // If the update resulted in a non-well-formed tree, null out AST to be consistent with full parse.
        if (this.cst && !this.cst.wellFormed) {
          this.ast = null;
          this.model = null;
        }
      } else {
        // Fallback: Full re-parse
        // (Old CST is discarded, so we don't need to shift it)
        this.cst = this.parse();
        if (this.cst && this.cst.wellFormed) {
          if (this.converter === defaultConverter) {
             const modelNode = this.binder!.hydrate(this.cst);
             if (modelNode instanceof ModelElement) {
                this.model = modelNode;
                const proj = this.binder!.project(this.model);
                this.ast = proj instanceof AST ? proj : null;
             }
          } else {
             this.ast = this.generateAST(this.cst);
          }
        } else {
          this.ast = null;
          this.model = null;
        }
      }
    } else {
      this.cst = this.parse();
      if (this.cst && this.cst.wellFormed) {
         if (this.converter === defaultConverter) {
             const modelNode = this.binder!.hydrate(this.cst);
             if (modelNode instanceof ModelElement) {
                this.model = modelNode;
                const proj = this.binder!.project(this.model);
                this.ast = proj instanceof AST ? proj : null;
             }
         } else {
             this.ast = this.generateAST(this.cst);
         }
      } else {
        this.ast = null;
        this.model = null;
      }
    }
  }

  /**
   * Sets an attribute on the specified AST node.
   * Updates the source code, CST, Model, and AST.
   */
  public setAttribute(astNode: AST, key: string, value: string): void {
    if (!this.binder || !this.model) {
      throw new Error("Operational API requires standard binder and model.");
    }
    if (!astNode.cst) {
      throw new Error("AST node is not linked to CST.");
    }

    const modelNode = this.findModelNodeByCST(this.model, astNode.cst);
    if (!modelNode || !(modelNode instanceof ModelElement)) {
      throw new Error("Corresponding model node not found.");
    }

    const patch = this.binder.calcSetAttributePatch(modelNode, key, value);
    if (patch) {
      this.update_input(patch.start, patch.end, patch.text);
    }
  }

  /**
   * Updates the text content of the specified AST element.
   */
  public updateText(astNode: AST, text: string): void {
    if (!this.binder || !this.model) {
      throw new Error("Operational API requires standard binder and model.");
    }
    if (!astNode.cst) {
      throw new Error("AST node is not linked to CST.");
    }

    const modelNode = this.findModelNodeByCST(this.model, astNode.cst);
    if (!modelNode || !(modelNode instanceof ModelElement)) {
      throw new Error("Corresponding model node not found.");
    }

    const patch = this.binder.calcUpdateTextPatch(modelNode, text);
    if (patch) {
      this.update_input(patch.start, patch.end, patch.text);
    }
  }

  private findModelNodeByCST(root: ModelNode, cst: CST): ModelNode | null {
    if (root.cst === cst) return root;
    if (root instanceof ModelElement) {
      for (const child of root.children) {
        const found = this.findModelNodeByCST(child, cst);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Attempts to update the CST incrementally by re-parsing only the affected part of the tree.
   *
   * Strategy:
   * 1. Find the deepest node that fully contains the changed range (using old coordinates).
   * 2. Traverse up from that node to find a "stable" ancestor (one that represents a named rule).
   * 3. Attempt to re-parse that ancestor's rule with the new input.
   * 4. If parsing succeeds and the new node length matches the expected length (old length + delta),
   *    we commit the change: shift the tree and replace the node.
   *
   * @param from Start offset of the change (old coordinate).
   * @param to End offset of the change (old coordinate).
   * @param delta Change in length (newLength - oldLength).
   * @returns object with old and new nodes if successful, null otherwise.
   */
  private tryIncrementalUpdate(
    from: number,
    to: number,
    delta: number,
  ): { oldNode: CST; newNode: CST } | null {
    if (!this.cst) return null;

    // Start search from the smallest node touching the change (in old coordinates)
    let target: CST | null = this.findNodeAt(from, to);

    // Iterate up the tree until we find a node that can successfully re-parse
    // and accommodate the change (size matches).
    while (target) {
      // We can only re-parse named nodes (rules)
      if (target.name) {
        // Optimization: Ensure target is a meaningful unit for the converter/binder
        if (this.binder && !this.binder.isHydratable(target.name)) {
             target = target.parent;
             continue;
        }

        // The node's start position is stable because target covers [from, to).
        // So target.start <= from. The change happens at or after target.start.
        // Thus, target.start in new input is same as old input.
        const parseStart = target.parent ? target.start : 0;

        const result = this.parser.parseAt(this.input, parseStart, target.name);

        // Check if parse was successful AND the new node's length matches the
        // expected length (old length + delta).
        const expectedEnd = target.end + delta;

        if (result && result.end === expectedEnd) {
          // Success!
          if (target.parent) {
            // Commit the shift now that we know we are keeping the tree.
            this.cst.shift(from, delta);

            // target's coordinates are now updated by shift.
            // Replace target with result.node
            const index = target.parent.children.indexOf(target);
            if (index !== -1) {
              target.parent.children[index] = result.node;
              result.node.parent = target.parent;
              this.updateAncestorsWellFormed(result.node);
              return { oldNode: target, newNode: result.node };
            }
          } else {
            // We replaced the root node.
            // No need to shift the old tree as we are replacing it entirely.
            this.cst = result.node;
            // Root has no ancestors to update
            return { oldNode: target, newNode: result.node };
          }
        }
      }

      // If we couldn't parse or boundaries didn't match, try the parent.
      target = target.parent;
    }

    // If we reached here, even re-parsing the root failed (or matched wrong length).
    return null;
  }
  
  private updateModelAndASTIncremental(oldNode: CST, newNode: CST): void {
      if (!this.model || !this.ast || !this.binder) return;
      
      // Special case: if oldNode corresponds to this.ast (root)
      if (this.ast.cst === oldNode || this.model.cst === oldNode) {
           const newModelNode = this.binder.hydrate(newNode);
           if (newModelNode instanceof ModelElement) {
               this.model = newModelNode;
               const newAST = this.binder.project(newModelNode);
               
               if (newAST instanceof AST && this.ast instanceof AST) {
                   // Mutate root AST to preserve identity
                   this.ast.tagName = newAST.tagName;
                   this.ast.attributes = newAST.attributes;
                   this.ast.children = newAST.children;
                   this.ast.cst = newAST.cst;
               } else {
                   this.ast = newAST instanceof AST ? newAST : null;
               }
               return;
           }
      }

      // 1. Find the corresponding ModelNode
      const modelPath = this.findModelNodePath(this.model, oldNode);
      
      if (modelPath) {
          // 2. Hydrate new CST -> New ModelNode
          const newModelNode = this.binder.hydrate(newNode);
          
          if (newModelNode) {
              // 3. Replace in Model
              modelPath.parent.children[modelPath.index] = newModelNode;
              newModelNode.parent = modelPath.parent;
              
              // 4. Project new ModelNode -> New AST
              const newAST = this.binder.project(newModelNode);
              
              // 5. Replace in AST using parent mapping
              if (modelPath.parent.cst) {
                  const astParent = this.findASTNode(this.ast, modelPath.parent.cst);
                  if (astParent) {
                      if (astParent.children.length > modelPath.index) {
                          const oldChild = astParent.children[modelPath.index];
                          if (oldChild instanceof AST && newAST instanceof AST) {
                              // In-place update to preserve identity
                              oldChild.tagName = newAST.tagName;
                              oldChild.attributes = newAST.attributes;
                              oldChild.children = newAST.children;
                              oldChild.cst = newAST.cst;
                          } else {
                              // Replace (e.g. text node or type change)
                              astParent.children[modelPath.index] = newAST;
                          }
                      } else {
                          console.warn("AST children length mismatch", astParent.children.length, modelPath.index);
                      }
                      return;
                  } else {
                      console.warn("AST Parent not found for CST", modelPath.parent.cst);
                  }
              } else {
                  console.warn("Model Parent has no CST");
              }
          }
      } else {
          // console.warn("Model Node not found for CST", oldNode);
      }
      
      // Fallback: full regeneration
      if (this.cst && this.cst.wellFormed) {
          const modelNode = this.binder.hydrate(this.cst);
          if (modelNode instanceof ModelElement) {
            this.model = modelNode;
            const proj = this.binder.project(this.model);
            this.ast = proj instanceof AST ? proj : null;
          }
      } else {
          this.ast = null;
          this.model = null;
      }
  }
  
  private findModelNodePath(root: ModelElement, cstNode: CST): { parent: ModelElement, index: number, node: ModelNode } | null {
      for (let i = 0; i < root.children.length; i++) {
          const child = root.children[i];
          if (child.cst === cstNode) {
              return { parent: root, index: i, node: child };
          }
          if (child instanceof ModelElement) {
              const found = this.findModelNodePath(child, cstNode);
              if (found) return found;
          }
      }
      return null;
  }
  
  private replaceASTNode(root: AST, oldCstNode: CST, newContent: AST | string): boolean {
      for (let i = 0; i < root.children.length; i++) {
          const child = root.children[i];
          if (child instanceof AST && child.cst === oldCstNode) {
              root.children[i] = newContent;
              return true;
          }
          if (child instanceof AST) {
              if (this.replaceASTNode(child, oldCstNode, newContent)) return true;
          }
      }
      return false;
  }

  private updateASTIncremental(oldNode: CST, newNode: CST): void {
    if (!this.ast) {
      if (this.cst && this.cst.wellFormed) {
        this.ast = this.generateAST(this.cst);
      }
      return;
    }

    let currentOld: CST | null = oldNode;
    let currentNew: CST | null = newNode;

    while (currentOld) {
      // Attempt to find AST node for this CST node
      // Note: This only works for Element nodes in AST.
      const astNode = this.findASTNode(this.ast, currentOld);
      
      if (astNode && currentNew) {
        // Re-convert the new CST node
        const newAST = this.converter(currentNew, this.input);

        // We can only perform in-place update if both are AST objects (Elements).
        if (newAST instanceof AST) {
          astNode.tagName = newAST.tagName;
          astNode.attributes = newAST.attributes;
          astNode.children = newAST.children;
          astNode.cst = newAST.cst;
          return;
        }
      }

      // Move up to parent
      if (currentOld.parent) {
        currentOld = currentOld.parent;
        currentNew = currentOld; // Parent is reused/mutated
      } else {
        break;
      }
    }

    // Fallback: full regeneration
    if (this.cst && this.cst.wellFormed) {
      this.ast = this.generateAST(this.cst);
    } else {
      this.ast = null;
    }
  }

  private findASTNode(root: AST, cstNode: CST): AST | null {
    if (root.cst === cstNode) return root;
    for (const child of root.children) {
      if (child instanceof AST) {
        const found = this.findASTNode(child, cstNode);
        if (found) return found;
      }
    }
    return null;
  }


  private findNodeAt(from: number, to: number): CST | null {
    if (!this.cst) return null;
    let current = this.cst;

    // Boundary check removed to allow root re-parse for out-of-bounds changes (prepend/append)
    // if (from < current.start || to > current.end) return null;

    // Efficiently descend the tree to find the deepest node covering the range
    while (true) {
      let foundChild: CST | null = null;
      const children = current.children;
      let left = 0;
      let right = children.length - 1;
      let candidateIndex = -1;

      // Binary search to find the rightmost child that starts at or before 'from'
      while (left <= right) {
        const mid = (left + right) >>> 1;
        if (children[mid].start <= from) {
          candidateIndex = mid;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      if (candidateIndex !== -1) {
        const candidate = children[candidateIndex];
        if (candidate.end >= to) {
          foundChild = candidate;
        }
      }

      if (foundChild) {
        current = foundChild;
      } else {
        break;
      }
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
