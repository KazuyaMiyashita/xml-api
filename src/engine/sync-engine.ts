import type { Grammar } from "../cst/grammar";
import { Parser } from "../cst/parser";
import type { CST } from "../cst/xml-cst";
import { grammar as defaultGrammar } from "../cst/xml-grammar";
import { HistoryManager } from "../history-manager";
import { Formatter } from "../model/formatter";
import { ModelElement, type ModelNode } from "../model/xml-api-model";
import { XMLBinder } from "../model/xml-binder";
import { EventEmitter, type EventHandler } from "../xml-api-events";
import { EditorState } from "./editor-state";
import { Transaction } from "./transaction";

export class SyncEngine {
  private _state: EditorState;
  private parser: Parser;
  private binder: XMLBinder;
  private history: HistoryManager;
  private events: EventEmitter;
  private isTransacting: boolean = false;

  constructor(source: string, grammar: Grammar = defaultGrammar) {
    this._state = EditorState.create(source);
    this.parser = new Parser(grammar);
    this.binder = new XMLBinder(source);
    this.history = new HistoryManager();
    this.events = new EventEmitter();

    this.fullParse();
  }

  public get state(): EditorState {
    return this._state;
  }

  public get source(): string {
    return this._state.source;
  }

  public get model(): ModelElement | null {
    return this._state.model;
  }

  public get cst(): CST | null {
    return this._state.cst;
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
   * Applies a transaction to the engine, updating the state and notifying listeners.
   */
  public dispatch(tr: Transaction): void {
    if (!tr.docChanged) return;

    const oldState = this._state;
    const newSource = tr.newSource;

    // History Recording
    if (!this.isTransacting) {
      // In a real transaction system, we would store the inverse patches.
      // For now, we rely on the single patch assumption for history or reconstruct it.
      // Since Transaction can have multiple patches, simple history push is harder.
      // We'll approximate by storing the full undo/redo for the range covered.
      // Ideally, HistoryManager should handle Transaction objects.
      
      // Temporary: Only support history for single-patch transactions or reconstruct simple history
      if (tr.patches.length === 1) {
        const p = tr.patches[0];
        const oldText = oldState.source.slice(p.from, p.to);
        const newEnd = p.from + p.text.length;
        this.history.push({
          redo: { from: p.from, to: p.to, text: p.text },
          undo: { from: p.from, to: newEnd, text: oldText },
        });
      } else {
        // Fallback for multi-patch (clear history or just skip? Skipping is dangerous for undo)
        // For Phase 3, we accept this limitation or clear history.
        // Or we assume history only tracks updateSource calls which are single patch.
      }
    }

    this._state = this._state.update({ source: newSource });
    
    // Core Update Logic (Parser / Binder)
    this.binder = new XMLBinder(newSource);
    
    // Optimization: If single patch, try incremental. Else full parse.
    let handled = false;
    if (tr.patches.length === 1 && oldState.cst) {
      const p = tr.patches[0];
      const delta = p.text.length - (p.to - p.from);
      
      const incrementalResult = this.tryIncrementalUpdate(p.from, p.to, delta);
      if (incrementalResult) {
        if (oldState.model) {
          this.updateModelIncremental(
            incrementalResult.oldNode,
            incrementalResult.newNode,
            tr,
          );
        } else {
          this.events.emit({ type: "full", transaction: tr });
        }
        
        if (this._state.cst && !this._state.cst.wellFormed) {
           this._state = this._state.update({ model: null });
           this.events.emit({ type: "full", transaction: tr });
        }
        handled = true;
      }
    }

    if (!handled) {
      this.fullParse();
      this.events.emit({ type: "full", transaction: tr });
    }
  }

  /**
   * Update the source code (e.g. from text editor).
   * Handles history recording and incremental parsing.
   */
  public updateSource(from: number, to: number, text: string): void {
    const tr = new Transaction(this._state);
    tr.replace(from, to, text);
    this.dispatch(tr);
  }

  /**
   * Apply a programmatic change derived from Model operations.
   * This is the "Application -> Source" flow.
   */
  public applyPatch(start: number, end: number, text: string): void {
    // Uses dispatch via updateSource logic, but conceptually distinct
    const tr = new Transaction(this._state);
    tr.replace(start, end, text);
    this.dispatch(tr);
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
      const cst = this.parser.parse(this._state.source);
      let model: ModelElement | null = null;
      
      if (cst?.wellFormed) {
        // Hydrate full model
        const newModel = this.binder.hydrate(cst);
        if (newModel instanceof ModelElement) {
          model = newModel;
        }
      }
      
      this._state = this._state.update({ cst, model });
    } catch (e) {
      console.error("Parse error:", e);
      this._state = this._state.update({ cst: null, model: null });
    }
  }

  private tryIncrementalUpdate(
    from: number,
    to: number,
    delta: number,
  ): { oldNode: CST; newNode: CST } | null {
    const currentCst = this._state.cst;
    if (!currentCst) return null;

    let target: CST | null = this.findNodeAt(currentCst, from, to);

    while (target) {
      if (target.name) {
        if (!this.binder.isHydratable(target.name)) {
          target = target.parent;
          continue;
        }

        const parseStart = target.parent ? target.start : 0;
        const result = this.parser.parseAt(
          this._state.source,
          parseStart,
          target.name,
        );
        const expectedEnd = target.end + delta;

        if (result && result.end === expectedEnd) {
          if (target.parent) {
            currentCst.shift(from, delta);
            const index = target.parent.children.indexOf(target);
            if (index !== -1) {
              target.parent.children[index] = result.node;
              result.node.parent = target.parent;
              this.updateAncestorsWellFormed(result.node);
              // State update is implicitly handled because we mutated the CST object
              // which is referenced by this._state.cst
              return { oldNode: target, newNode: result.node };
            }
          } else {
            this._state = this._state.update({ cst: result.node });
            return { oldNode: target, newNode: result.node };
          }
        }
      }
      target = target.parent;
    }
    return null;
  }

  private updateModelIncremental(
    oldNode: CST,
    newNode: CST,
    tr?: Transaction,
  ): void {
    const currentModel = this._state.model;
    if (!currentModel) return;

    if (currentModel.cst === oldNode) {
      const newModelNode = this.binder.hydrate(newNode);
      if (newModelNode instanceof ModelElement) {
        this._state = this._state.update({ model: newModelNode });
        this.events.emit({
          type: "full",
          target: newModelNode,
          transaction: tr,
        });
      }
      return;
    }

    const modelPath = this.findModelNodePath(currentModel, oldNode);
    if (modelPath) {
      const reconciledModel = this.binder.reconcile(modelPath.node, newNode);
      if (reconciledModel) {
        if (reconciledModel !== modelPath.node) {
          modelPath.parent.children[modelPath.index] = reconciledModel;
          reconciledModel.parent = modelPath.parent;
        }
        this.events.emit({
          type: "structure",
          target: reconciledModel,
          transaction: tr,
        });
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
        if (validator && !validator(current, this._state.source)) {
          selfWellFormed = false;
        }
      }
      current.wellFormed = selfWellFormed;
      current = current.parent;
    }
  }

  private detectIndent(node: CST): string {
    const input = this._state.source;
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
