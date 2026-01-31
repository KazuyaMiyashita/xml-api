import { CST } from "../cst/xml-cst";

export class ASTComment {
  public cst: CST | null = null;

  constructor(public content: string) {}

  text(): string {
    return "";
  }
}

export class AST {
  /** Reference to the CST node that generated this AST node. */
  public cst: CST | null = null;

  constructor(
    public tagName: string,
    public attributes: { [key: string]: string } = {},
    /** Child nodes can be either nested AST elements, raw text strings, or comments. */
    public children: (AST | string | ASTComment)[] = [],
  ) {}

  // Get attribute value by name
  attr(name: string): string | undefined {
    return this.attributes[name];
  }

  // Get all text content from children, concatenated
  text(): string {
    return this.children
      .map((c) => {
        if (typeof c === "string") return c;
        return c.text();
      })
      .join("");
  }

  // Find all descendant elements with the given tag name (simple XPath-like)
  find(tagName: string): AST[] {
    let results: AST[] = [];
    for (const child of this.children) {
      if (child instanceof AST) {
        if (child.tagName === tagName) {
          results.push(child);
        }
        results = results.concat(child.find(tagName));
      }
    }
    return results;
  }
}
