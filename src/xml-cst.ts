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
    public wellFormed: boolean = true
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
    if (this.start >= pos) {
      this.start += delta;
    } else if (this.end > pos) {
      // If the change is inside this node, its end must be shifted.
      // But its start remains the same.
    }

    if (this.end >= pos) {
      this.end += delta;
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
    while (current.children.length === 1 && 
           current.children[0].start === current.start && 
           current.children[0].end === current.end) {
      current = current.children[0];
    }
    return current;
  }
}