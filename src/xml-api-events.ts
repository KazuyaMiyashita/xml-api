import type { ModelNode } from "./model/xml-api-model";

/**
 * Event object emitted when the XML model changes.
 */
export type ChangeEvent =
  | { type: "full"; target?: ModelNode }
  | { type: "structure"; target: ModelNode }
  | { type: "attribute"; target: ModelNode; key: string; newValue: string | null }
  | { type: "text"; target: ModelNode; newValue?: string };

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
