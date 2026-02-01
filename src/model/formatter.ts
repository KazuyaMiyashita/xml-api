import {
  ModelCDATA,
  ModelComment,
  ModelElement,
  type ModelNode,
  ModelText,
} from "./xml-api-model";

export interface FormatterOptions {
  indent?: string; // e.g. "  ", "\t"
  newline?: string; // e.g. "\n"
  force?: boolean; // If true, re-format even if existing formatting is present
}

export class Formatter {
  private indent: string;
  private newline: string;
  private force: boolean;

  constructor(options: FormatterOptions = {}) {
    this.indent = options.indent ?? "  ";
    this.newline = options.newline ?? "\n";
    this.force = options.force ?? false;
  }

  public format(node: ModelNode): string {
    return this.formatNode(node, 0);
  }

  private formatNode(node: ModelNode, level: number): string {
    if (node instanceof ModelText) {
      return this.escape(node.text);
    }
    if (node instanceof ModelComment) {
      return `<!--${node.content}-->`;
    }
    if (node instanceof ModelCDATA) {
      return `<![CDATA[${node.content}]]>`;
    }

    if (node instanceof ModelElement) {
      const tagName = node.tagName;
      const attributes = this.formatAttributes(node.attributes);
      const children = node.children;

      if (children.length === 0) {
        return `<${tagName}${attributes} />`;
      }

      const isInline = this.isInline(children);
      const hasFormatting = this.force ? false : this.hasFormatting(children);

      let result = `<${tagName}${attributes}>`;

      if (isInline || hasFormatting) {
        for (const child of children) {
          if (
            this.force &&
            child instanceof ModelText &&
            child.text.includes("\n") &&
            child.text.trim().length === 0
          ) {
            continue;
          }
          result += this.formatNode(child, level + 1);
        }
        result += `</${tagName}>`;
      } else {
        for (const child of children) {
          if (
            this.force &&
            child instanceof ModelText &&
            child.text.includes("\n") &&
            child.text.trim().length === 0
          ) {
            continue;
          }
          result +=
            this.newline +
            this.getIndent(level + 1) +
            this.formatNode(child, level + 1);
        }
        result += `${this.newline + this.getIndent(level)}</${tagName}>`;
      }

      return result;
    }

    return "";
  }

  private formatAttributes(attributes: Map<string, string>): string {
    if (attributes.size === 0) return "";
    const entries = Array.from(attributes.entries());
    return (
      " " +
      entries
        .map(([key, value]) => `${key}="${this.escapeAttribute(value)}"`) // Corrected: escaped " to \"
        .join(" ")
    );
  }

  private isInline(children: ModelNode[]): boolean {
    for (const theChild of children) {
      if (theChild instanceof ModelText) {
        // If there is any non-whitespace text, treat as inline.
        if (theChild.text.trim().length > 0) return true;
      }
      if (theChild instanceof ModelCDATA) {
        return true;
      }
    }
    return false;
  }

  private hasFormatting(children: ModelNode[]): boolean {
    for (const theChild of children) {
      if (theChild instanceof ModelText) {
        // If it contains a newline and is otherwise whitespace, it's likely formatting.
        if (theChild.text.includes("\n") && theChild.text.trim().length === 0) {
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
