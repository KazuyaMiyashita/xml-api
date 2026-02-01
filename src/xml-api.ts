import {
  type CharacterData,
  Document,
  type DOMObserver,
  Element,
  type Node,
  createWrapper,
} from "./ast/dom";
import type { Grammar } from "./cst/grammar";
import { Parser } from "./cst/parser";
import type { CST } from "./cst/xml-cst";
import { grammar as defaultGrammar } from "./cst/xml-grammar";
import { HistoryManager } from "./history-manager";
import { Formatter } from "./model/formatter";
import { ModelElement, type ModelNode } from "./model/xml-api-model";
import { XMLBinder } from "./model/xml-binder";
import { EventEmitter, type EventHandler } from "./xml-api-events";

export class XMLAPI {
  public input: string;
  public grammar: Grammar;
  public parser: Parser;

  /** CST is null if parsing fails. */
  public cst: CST | null = null;
  /** Model is the authoritative logical representation. */
  public model: ModelElement | null = null;

  private binder: XMLBinder | null = null;
  private events: EventEmitter = new EventEmitter();
  private history: HistoryManager = new HistoryManager();
  private isTransacting: boolean = false;
  private document: Document | null = null;

  /**
   * Initializes the API with the source XML string.
   * @param input The initial XML source code.
   * @param grammar (Optional) Custom grammar definition.
   */
  constructor(input: string, grammar: Grammar = defaultGrammar) {
    this.input = input;
    this.grammar = grammar;
    this.parser = new Parser(grammar);

    this.cst = this.parse();
    if (this.cst?.wellFormed) {
      // Use the Binder-based architecture
      this.binder = new XMLBinder(input);
      const modelNode = this.binder.hydrate(this.cst);
      if (modelNode instanceof ModelElement) {
        this.model = modelNode;
      }
    }
  }

  /**
   * Returns a DOM-compatible Document object linked to this API.
   * Changes made to the returned Document are automatically reflected in the source code.
   */
  public getDocument(): Document {
    if (this.document) return this.document;

    const doc = new Document();
    this.document = doc;

    if (this.model) {
      // Wrap the root model and attach to document
      // Note: In a real DOM, documentElement is usually the root element.
      // We assume this.model is that root element.
      const rootWrapper = createWrapper(this.model, doc);
      if (rootWrapper instanceof Element) {
        doc.documentElement = rootWrapper;
      }
    }

    // Set up observer to sync changes back to source
    doc.setObserver({
      onAttributeChange: (
        element: Element,
        name: string,
        value: string | null,
      ) => {
        if (!this.binder) return;
        const model = element.getModel();
        if (model instanceof ModelElement) {
          if (value === null) {
            // Attribute removal not yet supported by binder directly in calcSetAttributePatch?
            // Or we pass null? Binder needs update if so.
            // For now, let's assume value is string for setAttribute.
            // If removeAttribute, we might need new binder method.
            console.warn("Attribute removal not fully supported yet in sync");
          } else {
            const patch = this.binder.calcSetAttributePatch(model, name, value);
            if (patch) {
              this.updateInput(patch.start, patch.end, patch.text);
            }
          }
        }
      },
      onTextChange: (node: CharacterData, text: string) => {
        // CharacterData direct update (not yet supported by Binder patch logic)
        console.warn("Direct CharacterData update not yet supported in sync");
      },
      onElementTextChange: (element: Element, text: string) => {
        if (!this.binder) return;
        const model = element.getModel();
        if (model instanceof ModelElement) {
          const patch = this.binder.calcUpdateTextPatch(model, text);
          if (patch) {
            this.updateInput(patch.start, patch.end, patch.text);
          }
        }
      },
      onChildAdded: (parent: Node, child: Node, index: number) => {
        console.warn("Child addition not yet supported in sync");
      },
      onChildRemoved: (parent: Node, child: Node, index: number) => {
        console.warn("Child removal not yet supported in sync");
      },
    });

    return doc;
  }

  /**
   * Registers an event handler to listen for model changes.
   * @param handler The callback function.
   * @returns A function to unsubscribe the handler.
   */
  public on(handler: EventHandler): () => void {
    return this.events.on(handler);
  }

  /**
   * Reverts the last source code change.
   */
  public undo(): void {
    const tx = this.history.undo();
    if (tx) {
      this.isTransacting = true;
      try {
        this.updateInput(tx.undo.from, tx.undo.to, tx.undo.text);
      } finally {
        this.isTransacting = false;
      }
    }
  }

  /**
   * Re-applies a previously undone source code change.
   */
  public redo(): void {
    const tx = this.history.redo();
    if (tx) {
      this.isTransacting = true;
      try {
        this.updateInput(tx.redo.from, tx.redo.to, tx.redo.text);
      } finally {
        this.isTransacting = false;
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
   * Updates the input text and refreshes the CST/Model.
   * This method attempts an incremental update first, falling back to a full re-parse if necessary.
   * @param from Start index of the range to replace.
   * @param to End index of the range.
   * @param value The new text to insert.
   */
  public updateInput(from: number, to: number, value: string): void {
    if (from < 0 || to > this.input.length || from > to) {
      throw new Error("Invalid range for updateInput");
    }

    // Record history if not currently undoing/redoing
    if (!this.isTransacting) {
      const oldText = this.input.slice(from, to);
      const newEnd = from + value.length;
      this.history.push({
        redo: { from, to, text: value },
        undo: { from, to: newEnd, text: oldText },
      });
    }

    const delta = value.length - (to - from);
    const oldInput = this.input;
    const _newEnd = from + value.length;
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
        // Now try to update Model incrementally.
        if (this.model && this.binder) {
          this.updateModelIncremental(
            incrementalResult.oldNode,
            incrementalResult.newNode,
          );
        } else {
          // Dispatch generic change if not using model
          this.events.emit({ type: "full" });
        }

        // If the update resulted in a non-well-formed tree, null out Model to be consistent with full parse.
        if (this.cst && !this.cst.wellFormed) {
          this.model = null;
          this.events.emit({ type: "full" });
        }
      } else {
        // Fallback: Full re-parse
        // (Old CST is discarded, so we don't need to shift it)
        this.cst = this.parse();
        if (this.cst?.wellFormed) {
          const modelNode = this.binder?.hydrate(this.cst);
          if (modelNode instanceof ModelElement) {
            this.model = modelNode;
          }
        } else {
          this.model = null;
        }
        this.events.emit({ type: "full" });
      }
    } else {
      this.cst = this.parse();
      if (this.cst?.wellFormed) {
        const modelNode = this.binder?.hydrate(this.cst);
        if (modelNode instanceof ModelElement) {
          this.model = modelNode;
        }
      } else {
        this.model = null;
      }
      this.events.emit({ type: "full" });
    }
  }

  /**
   * Sets an attribute on the specified Model node.
   * Updates the source code, CST, and Model by calculating a minimal text patch.
   * @param modelNode The target Model element.
   * @param key Attribute name.
   * @param value Attribute value.
   */
  public setAttribute(
    modelNode: ModelElement,
    key: string,
    value: string,
  ): void {
    if (!this.binder || !this.model) {
      throw new Error("Operational API requires standard binder and model.");
    }
    if (!modelNode.cst) {
      throw new Error("Model node is not linked to CST.");
    }

    const patch = this.binder.calcSetAttributePatch(modelNode, key, value);
    if (patch) {
      this.updateInput(patch.start, patch.end, patch.text);
    }
  }

  /**
   * Updates the text content of the specified Model element.
   * @param modelNode The target Model element.
   * @param text The new text content.
   */
  public updateText(modelNode: ModelElement, text: string): void {
    if (!this.binder || !this.model) {
      throw new Error("Operational API requires standard binder and model.");
    }
    if (!modelNode.cst) {
      throw new Error("Model node is not linked to CST.");
    }

    const patch = this.binder.calcUpdateTextPatch(modelNode, text);
    if (patch) {
      this.updateInput(patch.start, patch.end, patch.text);
    }
  }

  /**
   * Replaces a Model node with new content.
   * @param target The Model node to replace.
   * @param content New content as a Model node.
   */
  public replaceNode(target: ModelNode, content: ModelNode): void {
    if (!this.binder || !this.model) {
      throw new Error("Operational API requires standard binder and model.");
    }
    if (!target.cst) {
      throw new Error("Model node is not linked to CST.");
    }

    // Detect indentation
    let indentUnit = "  "; // Default
    let currentIndent = "";
    if (target.cst) {
      currentIndent = this.detectIndent(target.cst);

      if (target.parent?.cst) {
        const parentIndent = this.detectIndent(target.parent.cst);
        if (currentIndent.startsWith(parentIndent)) {
          const diff = currentIndent.slice(parentIndent.length);
          if (diff.length > 0 && !diff.includes("\n")) {
            indentUnit = diff;
          }
        }
      }
    }

    // Convert Model to string using formatter with detected indent
    const formatter = new Formatter({ indent: indentUnit });
    let newXml = formatter.format(content);

    // Apply base indent to all lines except the first one
    if (currentIndent && newXml.includes("\n")) {
      newXml = newXml
        .split("\n")
        .map((line, index) => {
          if (index === 0) return line;
          return currentIndent + line;
        })
        .join("\n");
    }

    const patch = this.binder.calcReplaceNodePatch(target, newXml);
    if (patch) {
      this.updateInput(patch.start, patch.end, patch.text);
    }
  }

  private detectIndent(node: CST): string {
    const input = this.input;
    let i = node.start - 1;
    while (i >= 0) {
      if (input[i] === "\n") {
        return input.slice(i + 1, node.start);
      }
      if (input[i] !== " " && input[i] !== "\t") {
        return "";
      }
      i--;
    }
    return "";
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

  private updateModelIncremental(oldNode: CST, newNode: CST): void {
    if (!this.model || !this.binder) return;

    // Special case: if oldNode corresponds to this.model (root)
    if (this.model.cst === oldNode) {
      const newModelNode = this.binder.hydrate(newNode);
      if (newModelNode instanceof ModelElement) {
        this.model = newModelNode;
        this.events.emit({ type: "full", target: this.model });
        return;
      }
    }

    // 1. Find the corresponding ModelNode
    const modelPath = this.findModelNodePath(this.model, oldNode);

    if (modelPath) {
      // 2. Reconcile new CST with existing ModelNode
      // The goal is to update modelPath.node in-place if possible.
      const reconciledModel = this.binder.reconcile(modelPath.node, newNode);

      if (reconciledModel) {
        // 3. Update Parent Reference if replaced
        if (reconciledModel !== modelPath.node) {
          modelPath.parent.children[modelPath.index] = reconciledModel;
          reconciledModel.parent = modelPath.parent;
        }

        this.events.emit({
          type: "structure", // Simplified event type for now
          target: reconciledModel,
        });
      }
    } else {
      // console.warn("Model Node not found for CST", oldNode);
    }

    // Fallback if needed? Not implemented here to keep it simple as per original logic
  }

  private findModelNodePath(
    root: ModelElement,
    cstNode: CST,
  ): { parent: ModelElement; index: number; node: ModelNode } | null {
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

  private findNodeAt(from: number, to: number): CST | null {
    if (!this.cst) return null;
    let current = this.cst;

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
