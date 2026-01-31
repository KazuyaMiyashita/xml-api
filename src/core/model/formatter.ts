import { AST } from "../ast/xml-ast";

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

  private formatNode(node: AST | string, level: number): string {
    if (typeof node === "string") {
      return this.escape(node);
    }

    const tagName = node.tagName;
    const attributes = this.formatAttributes(node.attributes);
    const children = node.children;

    if (children.length === 0) {
      return `<${tagName}${attributes}/>`;
    }

    const isInline = this.isInline(children);

    let result = `<${tagName}${attributes}>`;

    if (isInline) {
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
        .map((key) => `${key}="${this.escapeAttribute(attributes[key])}"`) // Corrected: escaped " to \"
        .join(" ")
    );
  }

  private isInline(children: (AST | string)[]): boolean {
    for (const child of children) {
      if (typeof child === "string") {
        // If there is any non-whitespace text, treat as inline.
        if (child.trim().length > 0) return true;
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