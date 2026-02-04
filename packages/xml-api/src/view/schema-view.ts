import {
  type CharacterData,
  createWrapper,
  DOMObserver,
  Document,
  Element,
  type Node,
} from "../dom";
import type { SyncEngine } from "../engine/sync-engine";
import type { Transaction } from "../engine/transaction";
import {
  ModelCDATA,
  ModelComment,
  ModelElement,
  type ModelNode,
  ModelText,
} from "../model/xml-api-model";
import { type ChangeEvent, EventEmitter } from "../xml-api-events";
import { type ExternalNode, ViewBinder } from "./view-binder";

export interface SchemaViewConfig {
  filter?: (node: ModelNode) => boolean;
}

export type ViewChangeEvent =
  | { type: "full"; target?: Node; transaction?: Transaction }
  | {
      type: "structure";
      target: Node;
      transaction?: Transaction;
    }
  | {
      type: "attribute";
      target: Node;
      key: string;
      newValue: string | null;
      transaction?: Transaction;
    }
  | {
      type: "text";
      target: Node;
      newValue?: string;
      transaction?: Transaction;
    };

export class SchemaView {
  private document!: Document;
  private events = new EventEmitter<ViewChangeEvent>();
  // biome-ignore lint/suspicious/noExplicitAny: Metadata can store any type
  private currentMeta: Record<string, any> = { origin: "schema-view" };

  constructor(
    private model: ModelElement,
    private engine: SyncEngine,
    private config: SchemaViewConfig = {},
  ) {
    this.initDocument();
    this.engine.on(this.handleEngineEvent.bind(this));
  }

  private initDocument() {
    this.document = new Document();
    if (this.config.filter) {
      this.document.nodeFilter = this.config.filter;
    }

    const rootWrapper = createWrapper(this.model, this.document);
    if (rootWrapper instanceof Element) {
      this.document.documentElement = rootWrapper;
    }

    this.document.setObserver({
      onAttributeChange: (
        element: Element,
        name: string,
        value: string | null,
      ) => {
        const model = element.getModel();
        if (model instanceof ModelElement && model.cst) {
          if (value !== null) {
            this.engine.setAttribute(model, name, value, this.currentMeta);
          }
        }
      },
      onChildAdded: (parent: Node, child: Node, index: number) => {
        const parentModel = parent.getModel();
        const childModel = child.getModel();
        if (parentModel instanceof ModelElement && parentModel.cst) {
          this.engine.insertNode(
            parentModel,
            childModel,
            index,
            this.currentMeta,
          );
        }
      },
      onChildRemoved: (parent: Node, child: Node, index: number) => {
        const parentModel = parent.getModel();
        const childModel = child.getModel();
        if (parentModel instanceof ModelElement && parentModel.cst) {
          if (childModel.cst) {
            this.engine.removeNode(parentModel, childModel, this.currentMeta);
          }
        }
      },
      onChildReplaced: (_parent: Node, newChild: Node, oldChild: Node) => {
        const newModel = newChild.getModel();
        const oldModel = oldChild.getModel();
        if (oldModel.cst) {
          this.engine.replaceNode(oldModel, newModel, this.currentMeta);
        }
      },
      onTextChange: (node: CharacterData, text: string) => {
        const modelNode = node.getModel();
        if (modelNode instanceof ModelText && modelNode.cst) {
          const newTextNode = new ModelText(text);
          this.engine.replaceNode(modelNode, newTextNode, this.currentMeta);
        } else if (modelNode instanceof ModelComment && modelNode.cst) {
          const newComment = new ModelComment(text);
          this.engine.replaceNode(modelNode, newComment, this.currentMeta);
        } else if (modelNode instanceof ModelCDATA && modelNode.cst) {
          const newCDATA = new ModelCDATA(text);
          this.engine.replaceNode(modelNode, newCDATA, this.currentMeta);
        } else {
          console.warn(
            "Direct text node update not supported for this node or missing CST",
          );
        }
      },
      onElementTextChange: (element: Element, text: string) => {
        const model = element.getModel();
        if (model instanceof ModelElement && model.cst) {
          this.engine.updateText(model, text, this.currentMeta);
        }
      },
    });
  }

  public on(handler: (event: ViewChangeEvent) => void): () => void {
    return this.events.on(handler);
  }

  private handleEngineEvent(event: ChangeEvent) {
    // Ignore events that originated from this view (or any SchemaView)
    // Ideally we should check if it's *this specific* view, but for now 'schema-view' covers self-cycles.
    if (
      event.transaction &&
      event.transaction.getMeta("origin") === "schema-view"
    ) {
      return;
    }

    if (event.type === "full") {
      // Update local model reference from engine if root changed
      if (this.engine.model && this.engine.model !== this.model) {
        this.model = this.engine.model;
        this.initDocument();
      }
      this.events.emit({ type: "full", transaction: event.transaction });
      return;
    }

    if (!event.target) return;

    // Check if target is visible in view
    // getNodeByModelId does the filtering check
    const viewNode = this.getNodeByModelId(event.target.id);

    if (viewNode) {
      // Map event
      if (event.type === "structure") {
        this.events.emit({
          type: "structure",
          target: viewNode,
          transaction: event.transaction,
        });
      } else if (event.type === "attribute") {
        this.events.emit({
          type: "attribute",
          target: viewNode,
          key: event.key,
          newValue: event.newValue,
          transaction: event.transaction,
        });
      } else if (event.type === "text") {
        this.events.emit({
          type: "text",
          target: viewNode,
          newValue: event.newValue,
          transaction: event.transaction,
        });
      }
    }
  }

  public getDocument(): Document {
    return this.document;
  }

  public getRoot(): Element {
    if (!this.document.documentElement) {
      throw new Error("No root element in view");
    }
    return this.document.documentElement;
  }

  public getNodeByModelId(id: string): Node | null {
    const modelNode = this.model.findNodeById(id);
    if (!modelNode) return null;

    if (!this.document.accepts(modelNode)) return null;

    return createWrapper(modelNode, this.document);
  }

  public getModelNode(viewNode: Node): ModelNode {
    return viewNode.getModel();
  }

  public reconcile(
    externalDomNode: ExternalNode,
    // biome-ignore lint/suspicious/noExplicitAny: Metadata can store any type
    meta?: Record<string, any>,
    target?: Element,
  ): void {
    const previousMeta = this.currentMeta;
    if (meta) {
      this.currentMeta = { ...this.currentMeta, ...meta };
    }
    try {
      const binder = new ViewBinder(this.document);
      // The external node corresponds to the root of the view (or the provided target)
      binder.reconcile(externalDomNode, target || this.getRoot());
    } finally {
      this.currentMeta = previousMeta;
    }
  }
}
