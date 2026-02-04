import type { Grammar } from "./cst/grammar";
import type { CST } from "./cst/xml-cst";
import {
  type CharacterData,
  createWrapper,
  Document,
  Element,
  type Node,
} from "./dom";
import { SyncEngine } from "./engine/sync-engine";
import { ModelElement } from "./model/xml-api-model";
import { SchemaView, type SchemaViewConfig } from "./view/schema-view";
import type { EventHandler } from "./xml-api-events";

/**
 * The primary entry point for the XML API.
 * Orchestrates the synchronization between source code (CST), the logical Model, and Schema Views.
 *
 * This class serves as the central hub for the "Three-Level Reconciliation" architecture:
 * 1. Source <-> CST: Incremental parsing.
 * 2. CST <-> Model: Logical binding and identity preservation.
 * 3. Model <-> View: Schema projection and filtering (via `createView`).
 */
export class XMLAPI {
  private _engine: SyncEngine;
  private document: Document | null = null;

  /**
   * Initializes the API with the source XML string.
   * @param source The initial XML source code.
   * @param grammar (Optional) Custom grammar definition.
   */
  constructor(source: string, grammar?: Grammar) {
    this._engine = new SyncEngine(source, grammar);
  }

  // --- Read-only State Access ---

  /** The underlying synchronization engine. */
  public get engine(): SyncEngine {
    return this._engine;
  }

  /** The current source code string. */
  public get source(): string {
    return this._engine.source;
  }

  /** The authoritative logical model. */
  public get model(): ModelElement | null {
    return this._engine.model;
  }

  /** The Concrete Syntax Tree (Physical layer). */
  public get cst(): CST | null {
    return this._engine.cst;
  }

  /** The grammar used for parsing. */
  public get grammar(): Grammar {
    return this._engine.grammar;
  }

  // --- Operations ---

  /**
   * Creates a projected view of the document.
   *
   * A SchemaView allows you to work with a filtered subset of the document (e.g., only XHTML tags)
   * while the underlying system maintains full fidelity of the original source (including comments,
   * custom tags, and formatting) in the background.
   *
   * @param config Configuration for the view, including filter logic.
   * @returns A `SchemaView` instance providing a DOM-like interface for the projected content.
   */
  public createView(config: SchemaViewConfig = {}): SchemaView {
    if (!this._engine.model) {
      throw new Error("Cannot create view: Model not initialized");
    }
    return new SchemaView(this._engine.model, this._engine, config);
  }

  /**
   * Updates the source code directly (e.g. from a text editor).
   * Attempts an optimized incremental update, falling back to full re-parse if needed.
   * @param from Start index of the range to replace.
   * @param to End index of the range.
   * @param text The new text to insert.
   * @param meta (Optional) Metadata for the transaction.
   */
  public updateSource(
    from: number,
    to: number,
    text: string,
    // biome-ignore lint/suspicious/noExplicitAny: Metadata can store any type
    meta?: Record<string, any>,
  ): void {
    this._engine.updateSource(from, to, text, meta);
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
      const rootWrapper = createWrapper(this.model, doc);
      if (rootWrapper instanceof Element) {
        doc.documentElement = rootWrapper;
      }
    }

    // Set up observer to sync DOM changes back to Source via Engine
    doc.setObserver({
      onAttributeChange: (
        element: Element,
        name: string,
        value: string | null,
      ) => {
        const model = element.getModel();
        if (model instanceof ModelElement && model.cst) {
          if (value === null) {
            // Attribute removal support needed in Engine/Binder
            console.warn("Attribute removal not fully supported yet");
          } else {
            this._engine.setAttribute(model, name, value);
          }
        }
      },
      onTextChange: (_node: CharacterData, _text: string) => {
        // Direct text update on CharacterData
        // Need to find parent element to update properly or support direct node replacement
        // For now, simple text node update via parent if available
        // But Engine expects ModelElement for updateText.
        // Actually, replacing the node is better.
        // Or implement updateTextNode in Engine.
        console.warn(
          "Direct CharacterData update not yet supported via Observer",
        );
      },
      onElementTextChange: (element: Element, text: string) => {
        const model = element.getModel();
        if (model instanceof ModelElement && model.cst) {
          this._engine.updateText(model, text);
        }
      },
      onChildAdded: (parent: Node, child: Node, index: number) => {
        const parentModel = parent.getModel();
        const childModel = child.getModel();
        if (parentModel instanceof ModelElement && parentModel.cst) {
          this._engine.insertNode(parentModel, childModel, index);
        }
      },
      onChildRemoved: (parent: Node, child: Node, _index: number) => {
        const parentModel = parent.getModel();
        const childModel = child.getModel();
        if (parentModel instanceof ModelElement && parentModel.cst) {
          if (childModel.cst) {
            this._engine.removeNode(parentModel, childModel);
          }
        }
      },
      onChildReplaced: (_parent: Node, newChild: Node, oldChild: Node) => {
        const newModel = newChild.getModel();
        const oldModel = oldChild.getModel();
        // Use replaceNode on the engine.
        // Even if oldModel is detached from parent, it retains CST info needed for replacement.
        if (oldModel.cst) {
          this._engine.replaceNode(oldModel, newModel);
        }
      },
    });

    return doc;
  }

  // --- Subscriptions ---

  /**
   * Registers an event handler to listen for model changes.
   */
  public on(handler: EventHandler): () => void {
    return this._engine.on(handler);
  }

  // --- History ---

  public undo(): void {
    this._engine.undo();
  }

  public redo(): void {
    this._engine.redo();
  }
}

export { CST } from "./cst/xml-cst";
export {
  CDATASection,
  Comment,
  Document,
  Element,
  Node,
  NodeList,
  Text,
} from "./dom";
export { EditorState } from "./engine/editor-state";
export { type TextPatch, Transaction } from "./engine/transaction";
export {
  ModelCDATA,
  ModelComment,
  ModelElement,
  ModelNode,
  ModelNodeType,
  ModelText,
} from "./model/xml-api-model";
export { XMLBinder } from "./model/xml-binder";
export { SchemaView, type SchemaViewConfig } from "./view/schema-view";
export { type ExternalNode, ViewBinder } from "./view/view-binder";
export {
  type ChangeEvent,
  EventEmitter,
  type EventHandler,
} from "./xml-api-events";
