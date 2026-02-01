import type { Grammar } from "../cst/grammar";
import { Parser } from "../cst/parser";
import type { CST } from "../cst/xml-cst";
import { grammar as defaultGrammar } from "../cst/xml-grammar";
import { HistoryManager } from "../history-manager";
import { Formatter } from "../model/formatter";
import { ModelElement, type ModelNode } from "../model/xml-api-model";
import { XMLBinder } from "../model/xml-binder";
import { EventEmitter, type EventHandler } from "../xml-api-events";

export class SyncEngine {
  private _source: string;
  private parser: Parser;
  private binder: XMLBinder;
  private history: HistoryManager;
  private events: EventEmitter;
  private isTransacting: boolean = false;

  public cst: CST | null = null;
  public model: ModelElement | null = null;

  constructor(source: string, grammar: Grammar = defaultGrammar) {
    this._source = source;
    this.parser = new Parser(grammar);
    this.binder = new XMLBinder(source);
    this.history = new HistoryManager();
    this.events = new EventEmitter();

    this.fullParse();
  }

  public get source(): string {
    return this._source;
  }

  public get grammar(): Grammar {
    return this.parser.grammar;
  }

  /**
   * Subscribe to model changes.
   */
  public on(handler: EventHandler): () => void {
    return this.events.on(handler);
  }

  /**
   * Update the source code (e.g. from text editor).
   * Handles history recording and incremental parsing.
   */
  public updateSource(from: number, to: number, text: string): void {
    if (from < 0 || to > this._source.length || from > to) {
      throw new Error("Invalid range for updateSource");
    }

    // History Recording
    if (!this.isTransacting) {
      const oldText = this._source.slice(from, to);
      const newEnd = from + text.length;
      this.history.push({
        redo: { from, to, text },
        undo: { from, to: newEnd, text: oldText },
      });
    }

    const delta = text.length - (to - from);
    const oldSource = this._source;
    this._source = oldSource.slice(0, from) + text + oldSource.slice(to);

    // Update binder context (it might need the full string for some operations)
    this.binder = new XMLBinder(this._source);

    if (this.cst) {
      const incrementalResult = this.tryIncrementalUpdate(from, to, delta);
      if (incrementalResult) {
        // Incremental Success
        if (this.model) {
          this.updateModelIncremental(
            incrementalResult.oldNode,
            incrementalResult.newNode,
          );
        } else {
          this.events.emit({ type: "full" });
        }

        // If incremental update resulted in invalid tree (unlikely if parser succeeded but strictly speaking)
        if (this.cst && !this.cst.wellFormed) {
          this.model = null;
          this.events.emit({ type: "full" });
        }
      } else {
        // Fallback: Full Parse
        this.fullParse();
        this.events.emit({ type: "full" });
      }
    } else {
      this.fullParse();
      this.events.emit({ type: "full" });
    }
  }

  /**
   * Apply a programmatic change derived from Model operations.
   * This is the "Application -> Source" flow.
   */
  public applyPatch(start: number, end: number, text: string): void {
    // This is essentially same as updateSource but semantically distinct.
    // We might want to group history or treat it differently in future.
    this.updateSource(start, end, text);
  }

  // --- History Operations ---

  public undo(): void {
    const tx = this.history.undo();
    if (tx) {
      this.isTransacting = true;
      try {
        this.updateSource(tx.undo.from, tx.undo.to, tx.undo.text);
      } finally {
        this.isTransacting = false;
      }
    }
  }

  public redo(): void {
    const tx = this.history.redo();
    if (tx) {
      this.isTransacting = true;
      try {
        this.updateSource(tx.redo.from, tx.redo.to, tx.redo.text);
      } finally {
        this.isTransacting = false;
      }
    }
  }

  // --- High-Level Model Operations (delegated to Binder) ---

  public setAttribute(
    modelNode: ModelElement,
    key: string,
    value: string,
  ): void {
    if (!modelNode.cst) throw new Error("Model node not linked to CST");
    const patch = this.binder.calcSetAttributePatch(modelNode, key, value);
    if (patch) {
      this.applyPatch(patch.start, patch.end, patch.text);
    }
  }

  public updateText(modelNode: ModelElement, text: string): void {
    if (!modelNode.cst) throw new Error("Model node not linked to CST");
    const patch = this.binder.calcUpdateTextPatch(modelNode, text);
    if (patch) {
      this.applyPatch(patch.start, patch.end, patch.text);
    }
  }

  public replaceNode(target: ModelNode, content: ModelNode): void {
    if (!target.cst) throw new Error("Model node not linked to CST");

    // Formatting logic
    let indentUnit = "  ";
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

    const formatter = new Formatter({ indent: indentUnit });
    let newXml = formatter.format(content);

    if (currentIndent && newXml.includes("\n")) {
      newXml = newXml
        .split("\n")
        .map((line, index) => (index === 0 ? line : currentIndent + line))
        .join("\n");
    }

    const patch = this.binder.calcReplaceNodePatch(target, newXml);
    if (patch) {
      this.applyPatch(patch.start, patch.end, patch.text);
    }
  }

  public insertNode(
    parent: ModelElement,
    child: ModelNode,
    index: number,
  ): void {
    if (!parent.cst) throw new Error("Parent node not linked to CST");

    // Determine basic indentation (simplistic)
    let indentUnit = "  ";
    if (parent.cst) {
      const parentIndent = this.detectIndent(parent.cst);
      // Try to find a child to detect indent step
      // ... skipping complex logic for now
    }

    const formatter = new Formatter({ indent: indentUnit });
    const insertText = formatter.format(child);

    const patch = this.binder.calcInsertNodePatch(parent, index, insertText);
    if (patch) {
      this.applyPatch(patch.start, patch.end, patch.text);
    }
  }

  public removeNode(parent: ModelElement, child: ModelNode): void {
    if (!child.cst) throw new Error("Target node not linked to CST");
    const patch = this.binder.calcRemoveNodePatch(child);
    if (patch) {
      this.applyPatch(patch.start, patch.end, patch.text);
    }
  }

  // --- Internal Logic ---

  private fullParse(): void {
    try {
      this.cst = this.parser.parse(this._source);
      if (this.cst?.wellFormed) {
        // Hydrate full model
        // Ideally binder should reuse existing model IDs if possible (Advanced Reconcile)
        // For now, we create fresh model on full parse to ensure consistency
        const newModel = this.binder.hydrate(this.cst);
        if (newModel instanceof ModelElement) {
          this.model = newModel;
        } else {
          this.model = null;
        }
      } else {
        this.model = null; // Or keep stale model? Current logic: null on error
      }
    } catch (e) {
      console.error("Parse error:", e);
      this.cst = null;
      this.model = null;
    }
  }

  private tryIncrementalUpdate(
    from: number,
    to: number,
    delta: number,
  ): { oldNode: CST; newNode: CST } | null {
    if (!this.cst) return null;

    let target: CST | null = this.findNodeAt(this.cst, from, to);

    while (target) {
      if (target.name) {
        if (!this.binder.isHydratable(target.name)) {
          target = target.parent;
          continue;
        }

        const parseStart = target.parent ? target.start : 0;
        const result = this.parser.parseAt(
          this._source,
          parseStart,
          target.name,
        );
        const expectedEnd = target.end + delta;

        if (result && result.end === expectedEnd) {
          if (target.parent) {
            this.cst.shift(from, delta);
            const index = target.parent.children.indexOf(target);
            if (index !== -1) {
              target.parent.children[index] = result.node;
              result.node.parent = target.parent;
              this.updateAncestorsWellFormed(result.node);
              return { oldNode: target, newNode: result.node };
            }
          } else {
            this.cst = result.node;
            return { oldNode: target, newNode: result.node };
          }
        }
      }
      target = target.parent;
    }
    return null;
  }

  private updateModelIncremental(oldNode: CST, newNode: CST): void {
    if (!this.model) return;

    if (this.model.cst === oldNode) {
      const newModelNode = this.binder.hydrate(newNode);
      if (newModelNode instanceof ModelElement) {
        this.model = newModelNode;
        this.events.emit({ type: "full", target: this.model });
      }
      return;
    }

    const modelPath = this.findModelNodePath(this.model, oldNode);
    if (modelPath) {
      const reconciledModel = this.binder.reconcile(modelPath.node, newNode);
      if (reconciledModel) {
        if (reconciledModel !== modelPath.node) {
          modelPath.parent.children[modelPath.index] = reconciledModel;
          reconciledModel.parent = modelPath.parent;
        }
        this.events.emit({ type: "structure", target: reconciledModel });
      }
    }
  }

  // --- Helpers ---

  private findNodeAt(root: CST, from: number, to: number): CST | null {
    let current = root;
    while (true) {
      let foundChild: CST | null = null;
      // Binary search optimization
      let left = 0;
      let right = current.children.length - 1;
      let candidateIndex = -1;

      while (left <= right) {
        const mid = (left + right) >>> 1;
        if (current.children[mid].start <= from) {
          candidateIndex = mid;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      if (candidateIndex !== -1) {
        const candidate = current.children[candidateIndex];
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

  private updateAncestorsWellFormed(node: CST): void {
    let current: CST | null = node.parent;
    while (current) {
      let childrenWellFormed = true;
      for (const child of current.children) {
        if (!child.wellFormed) {
          childrenWellFormed = false;
          break;
        }
      }
      let selfWellFormed = childrenWellFormed;
      if (current.name && selfWellFormed) {
        const validator = this.parser.grammar.validators[current.name];
        if (validator && !validator(current, this._source)) {
          selfWellFormed = false;
        }
      }
      current.wellFormed = selfWellFormed;
      current = current.parent;
    }
  }

  private detectIndent(node: CST): string {
    const input = this._source;
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
}
