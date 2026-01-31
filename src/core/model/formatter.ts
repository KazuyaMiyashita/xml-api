import { AST, ASTComment } from "../ast/xml-ast";

export interface FormatterOptions {
  indent?: string; // e.g. "  ", "\t"
  newline?: string; // e.g. "\n"
}

export class Formatter {
  private indent: string;
  private newline: string;

  constructor(options: FormatterOptions = {}) {
    this.indent = options.indent ?? "  ";
    this.newline = options.newline ?? "\n";
  }

  public format(node: AST): string {
    return this.formatNode(node, 0);
  }

  private formatNode(node: AST | string | ASTComment, level: number): string {
    if (typeof node === "string") {
      return this.escape(node);
    }
    if (node instanceof ASTComment) {
      return `<!--${node.content}-->`;
    }

    const tagName = node.tagName;
    const attributes = this.formatAttributes(node.attributes);
    const children = node.children;

    if (children.length === 0) {
      return `<${tagName}${attributes} />`;
    }

    const isInline = this.isInline(children);
    const hasFormatting = this.hasFormatting(children);

    let result = `<${tagName}${attributes}>`;

    if (isInline || hasFormatting) {
      for (const child of children) {
        result += this.formatNode(child, level + 1);
      }
      result += `</${tagName}>`;
    } else {
      for (const child of children) {
        result +=
          this.newline +
          this.getIndent(level + 1) +
          this.formatNode(child, level + 1);
      }
      result += this.newline + this.getIndent(level) + `</${tagName}>`;
    }

    return result;
  }

  private formatAttributes(attributes: { [key: string]: string }): string {
    const keys = Object.keys(attributes);
    if (keys.length === 0) return "";
    return (
      " " +
      keys
        .map((key) => `${key}="${this.escapeAttribute(attributes[key])}"`)
        .join(" ")
    );
  }

  private isInline(children: (AST | string | ASTComment)[]): boolean {
    for (const theChild of children) {
      if (typeof theChild === "string") {
        // If there is any non-whitespace text, treat as inline.
        if (theChild.trim().length > 0) return true;
      }
    }
    return false;
  }

  private hasFormatting(children: (AST | string | ASTComment)[]): boolean {
    for (const theChild of children) {
      if (typeof theChild === "string") {
        // If it contains a newline and is otherwise whitespace, it's likely formatting.
        if (theChild.includes("\n") && theChild.trim().length === 0) {
            return true;
        }
      }
    }
    return false;
  }

  private getIndent(level: number): string {
    return this.indent.repeat(level);
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  private escapeAttribute(str: string): string {
    return this.escape(str).replace(/"/g, "&quot;");
  }
}