/**
 * Represents a node in the Concrete Syntax Tree (Parse Tree).
 * Each node corresponds to a match of a grammatical structure or rule.
 */
export class CST {
  /**
   * Reference to the parent node in the syntax tree.
   * Null if this is the root node.
   */
  public parent: CST | null = null;

  constructor(
    /**
     * The type of the grammatical structure matched.
     * Common values include "literal", "regex", "sequence", "repeat".
     * This describes the structural nature of the match, not the grammar rule name.
     */
    public type: string,
    /**
     * The name of the grammar rule corresponding to this node (e.g., "element", "attribute").
     * Defined only if this node represents a named rule reference; otherwise undefined.
     */
    public name: string | undefined,
    /**
     * The 0-based starting index of this node in the entire input string (inclusive).
     */
    public start: number,
    /**
     * The 0-based ending index of this node in the entire input string (exclusive).
     * The length of the match is (end - start).
     */
    public end: number,
    /**
     * Child nodes contained within this structure.
     * Empty for leaf nodes like literals or regex matches.
     */
    public children: CST[] = [],
    /**
     * Indicates whether the node satisfies additional validation logic beyond basic parsing.
     * If false, the node was parsed successfully according to the grammar structure
     * but failed a semantic or contextual validation check.
     */
    public wellFormed: boolean = true,
  ) {
    for (const child of children) {
      child.parent = this;
    }
  }

  /**
   * Retrieves the substring matching this node from the entire original input string.
   */
  getText(input: string): string {
    return input.slice(this.start, this.end);
  }

  /**
   * Shifts the start and end positions of this node and its children.
   * @param pos The position where the change occurred.
   * @param delta The change in length.
   */
  shift(pos: number, delta: number): void {
    if (delta > 0) {
      if (this.start >= pos) {
        this.start += delta;
      }
      if (this.end > pos) {
        this.end += delta;
      }
    } else {
      // For deletion, delta is negative.
      // The deletion range in original coordinates is [pos, pos - delta).
      const deleteEnd = pos - delta;

      if (this.start >= deleteEnd) {
        // Node started after the deletion; shift it back.
        this.start += delta;
      } else if (this.start > pos) {
        // Node started inside the deletion region.
        // It now starts at the deletion point.
        this.start = pos;
      }

      if (this.end >= deleteEnd) {
        // Node ended after the deletion; shift it back.
        this.end += delta;
      } else if (this.end > pos) {
        // Node ended inside the deletion region.
        // It now ends at the deletion point.
        this.end = pos;
      }
    }

    for (const child of this.children) {
      child.shift(pos, delta);
    }
  }

  /**
   * Unwraps single-child Reference nodes to find the underlying structural node.
   */
  unwrap(): CST {
    let current: CST = this;
    while (
      current.children.length === 1 &&
      current.children[0].start === current.start &&
      current.children[0].end === current.end
    ) {
      current = current.children[0];
    }
    return current;
  }
}
