import { ModelElement, ModelNode } from "../model/xml-api-model";
import { Document, Element, createWrapper, Node, DOMObserver, CharacterData } from "../dom";
import { SyncEngine } from "../engine/sync-engine";
import { ChangeEvent, EventEmitter } from "../xml-api-events";
import { Transaction } from "../engine/transaction";

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
  private document: Document;
  private events = new EventEmitter<ViewChangeEvent>();

  constructor(private model: ModelElement, private engine: SyncEngine, private config: SchemaViewConfig = {}) {
    this.document = new Document();
    if (config.filter) {
      this.document.nodeFilter = config.filter;
    }
    
    const rootWrapper = createWrapper(this.model, this.document);
    if (rootWrapper instanceof Element) {
      this.document.documentElement = rootWrapper;
    }

    this.document.setObserver({
      onAttributeChange: (element: Element, name: string, value: string | null) => {
        const model = element.getModel();
        if (model instanceof ModelElement && model.cst) {
           // Handle null value (removal) if supported, else empty string or skip
           if (value !== null) {
             this.engine.setAttribute(model, name, value);
           }
        }
      },
      onChildAdded: (parent: Node, child: Node, index: number) => {
         const parentModel = parent.getModel();
         const childModel = child.getModel();
         if (parentModel instanceof ModelElement && parentModel.cst) {
            this.engine.insertNode(parentModel, childModel, index);
         }
      },
      onChildRemoved: (parent: Node, child: Node, index: number) => {
         const parentModel = parent.getModel();
         const childModel = child.getModel();
         if (parentModel instanceof ModelElement && parentModel.cst) {
            // child must have CST to be removed via patch
            if (childModel.cst) {
                this.engine.removeNode(parentModel, childModel);
            }
         }
      },
      onTextChange: (node: CharacterData, text: string) => {
         // Direct text node update.
         // SyncEngine doesn't have updateTextNode yet?
         // It has updateText(ModelElement, text).
         // If we modify ModelText, we might need a new method or use replaceNode.
         console.warn("Direct text node update not implemented in SchemaView sync");
      },
      onElementTextChange: (element: Element, text: string) => {
         const model = element.getModel();
         if (model instanceof ModelElement && model.cst) {
             this.engine.updateText(model, text);
         }
      }
    });

    this.engine.on(this.handleEngineEvent.bind(this));
  }

  public on(handler: (event: ViewChangeEvent) => void): () => void {
    return this.events.on(handler);
  }

  private handleEngineEvent(event: ChangeEvent) {
    if (event.type === "full") {
      // Full reload, emit full
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
}
