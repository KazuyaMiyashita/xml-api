import { ModelNode, ModelElement } from "./model/xml-api-model";

export type ChangeType = "structure" | "attribute" | "text" | "full";

export interface ChangeEvent {
  type: ChangeType;
  target?: ModelNode; // The node that changed (if applicable)
  key?: string; // For attribute changes
}

export type EventHandler = (event: ChangeEvent) => void;

export class EventEmitter {
  private listeners: EventHandler[] = [];

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
