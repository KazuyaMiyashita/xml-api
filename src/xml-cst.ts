export class CST {
  public parent: CST | null = null;

  constructor(
    public type: string,
    public name: string | undefined,
    public start: number,
    public end: number,
    public children: CST[] = [],
    public wellFormed: boolean = true
  ) {
    for (const child of children) {
      child.parent = this;
    }
  }

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