import type { Transaction } from "./engine/transaction";
import type { ModelNode } from "./model/xml-api-model";

/**
 * Event object emitted when the XML model changes.
 */
export type ChangeEvent =
  | { type: "full"; target?: ModelNode; transaction?: Transaction }
  | {
      type: "structure";
      target: ModelNode;
      transaction?: Transaction;
      addedNodes?: ModelNode[];
      removedNodes?: ModelNode[];
      previousSibling?: ModelNode | null;
      nextSibling?: ModelNode | null;
    }
  | {
      type: "attribute";
      target: ModelNode;
      key: string;
      newValue: string | null;
      transaction?: Transaction;
    }
  | {
      type: "text";
      target: ModelNode;
      newValue?: string;
      transaction?: Transaction;
    };

/**
 * Callback function for handling change events.
 */
export type EventHandler = (event: ChangeEvent) => void;

/**
 * Internal event emitter for managing listeners.
 */
export class EventEmitter<E = ChangeEvent> {
  private listeners: ((event: E) => void)[] = [];

  /**
   * Registers an event handler.
   * @param handler The callback function.
   * @returns A function to unsubscribe the handler.
   */
  on(handler: (event: E) => void): () => void {
    this.listeners.push(handler);
    return () => this.off(handler);
  }

  off(handler: (event: E) => void): void {
    this.listeners = this.listeners.filter((h) => h !== handler);
  }

  emit(event: E): void {
    for (const handler of this.listeners) {
      handler(event);
    }
  }
}
