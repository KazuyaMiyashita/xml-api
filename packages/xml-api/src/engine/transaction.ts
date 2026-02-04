import type { EditorState } from "./editor-state";

export interface TextPatch {
  from: number;
  to: number;
  text: string;
}

/**
 * Represents a unit of change to the editor state.
 * Currently focuses on text changes (patches).
 */
export class Transaction {
  public readonly patches: TextPatch[] = [];
  public docChanged = false;

  /** Indicates if this transaction originated from a remote source (collaboration). */
  public isRemote = false;

  // biome-ignore lint/suspicious/noExplicitAny: Metadata can store any type
  public metadata: Map<string, any> = new Map();

  constructor(public readonly startState: EditorState) {}

  // biome-ignore lint/suspicious/noExplicitAny: Metadata can store any type
  public setMeta(key: string, value: any): this {
    this.metadata.set(key, value);
    return this;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Metadata can store any type
  public getMeta(key: string): any {
    return this.metadata.get(key);
  }

  /**
   * Adds a text change to the transaction.
   * @param from Start index
   * @param to End index
   * @param text New text
   */
  public replace(from: number, to: number, text: string): this {
    if (from < 0 || from > to) {
      throw new Error(`Invalid patch range: ${from}-${to}`);
    }
    this.patches.push({ from, to, text });
    this.docChanged = true;
    return this;
  }

  /**
   * Calculates the new source text by applying patches.
   * Handles multiple patches by sorting them in reverse order of position.
   */
  public get newSource(): string {
    let source = this.startState.source;
    // Sort descending by position to apply from end to start
    // This avoids index shifting issues for subsequent patches
    const sorted = [...this.patches].sort((a, b) => b.from - a.from);

    for (const p of sorted) {
      // Validate range
      if (p.from > source.length || p.to > source.length) {
        throw new Error(
          `Invalid patch range: ${p.from}-${p.to} (Length: ${source.length})`,
        );
      }
      source = source.slice(0, p.from) + p.text + source.slice(p.to);
    }
    return source;
  }
}
