import type { ModelNode } from "./model/xml-api-model";

/**
 * The type of change that occurred in the model.
 * - `full`: A full re-parse or significant structural change occurred.
 * - `structure`: The structure (children) of a node changed.
 * - `attribute`: An attribute was added, removed, or changed.
 * - `text`: Text content changed.
 */
export type ChangeType = "structure" | "attribute" | "text" | "full";

/**
 * Event object emitted when the XML model changes.
 */
export interface ChangeEvent {
  /** The type of change. */
  type: ChangeType;
  /** The node that changed (if applicable). */
  target?: ModelNode;
  /** The attribute name (only for 'attribute' changes). */
  key?: string;
}

/**
 * Callback function for handling change events.
 */
export type EventHandler = (event: ChangeEvent) => void;

/**
 * Internal event emitter for managing listeners.
 */
export class EventEmitter {
  private listeners: EventHandler[] = [];

  /**
   * Registers an event handler.
   * @param handler The callback function.
   * @returns A function to unsubscribe the handler.
   */
  on(handler: EventHandler): () => void {
    this.listeners.push(handler);
    return () => this.off(handler);
  }

  off(handler: EventHandler): void {
    this.listeners = this.listeners.filter((h) => h !== handler);
  }

  emit(event: ChangeEvent): void {
    for (const handler of this.listeners) {
      handler(event);
    }
  }
}
