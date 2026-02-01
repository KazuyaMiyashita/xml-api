import type { CST } from "../cst/xml-cst";
import type { ModelElement } from "../model/xml-api-model";

export interface EditorStateConfig {
  source: string;
  model: ModelElement | null;
  cst: CST | null;
}

/**
 * Represents a snapshot of the editor state at a specific point in time.
 * Includes the source code, the logical model, and the physical CST.
 */
export class EditorState {
  public readonly source: string;
  public readonly model: ModelElement | null;
  public readonly cst: CST | null;

  constructor(config: EditorStateConfig) {
    this.source = config.source;
    this.model = config.model;
    this.cst = config.cst;
  }

  /**
   * Creates a new state with updated properties.
   */
  public update(changes: Partial<EditorStateConfig>): EditorState {
    return new EditorState({
      source: changes.source !== undefined ? changes.source : this.source,
      model: changes.model !== undefined ? changes.model : this.model,
      cst: changes.cst !== undefined ? changes.cst : this.cst,
    });
  }

  public static create(source: string): EditorState {
    return new EditorState({
      source,
      model: null,
      cst: null,
    });
  }
}
