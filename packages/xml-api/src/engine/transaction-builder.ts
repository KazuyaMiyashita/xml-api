import { detectIndent } from "../cst/cst-utils";
import { Formatter } from "../model/formatter";
import {
  type ModelElement,
  type ModelNode,
  ModelText,
} from "../model/xml-api-model";
import type { XMLBinder } from "../model/xml-binder";
import type { EditorState } from "./editor-state";
import { Transaction } from "./transaction";

export class TransactionBuilder {
  constructor(
    private state: EditorState,
    private binder: XMLBinder,
  ) {}

  public setAttribute(
    modelNode: ModelElement,
    key: string,
    value: string,
  ): Transaction {
    if (!modelNode.cst) throw new Error("Model node not linked to CST");
    const patch = this.binder.calcSetAttributePatch(modelNode, key, value);
    const tr = new Transaction(this.state);
    if (patch) {
      tr.replace(patch.start, patch.end, patch.text);
    }
    return tr;
  }

  public updateText(modelNode: ModelElement, text: string): Transaction {
    if (!modelNode.cst) throw new Error("Model node not linked to CST");
    const patch = this.binder.calcUpdateTextPatch(modelNode, text);
    const tr = new Transaction(this.state);
    if (patch) {
      tr.replace(patch.start, patch.end, patch.text);
    }
    return tr;
  }

  public removeNode(parent: ModelElement, child: ModelNode): Transaction {
    if (!parent.cst) throw new Error("Parent node not linked to CST");
    const patch = this.binder.calcRemoveNodePatch(child);
    const tr = new Transaction(this.state);
    if (patch) {
      tr.replace(patch.start, patch.end, patch.text);
    }
    return tr;
  }

  public replaceNode(target: ModelNode, content: ModelNode): Transaction {
    if (!target.cst) throw new Error("Model node not linked to CST");

    // Formatting logic
    let indentUnit = "  ";
    let currentIndent = "";
    if (target.cst) {
      currentIndent = detectIndent(target.cst, this.state.source) || "";
      if (target.parent?.cst) {
        const parentIndent =
          detectIndent(target.parent.cst, this.state.source) || "";
        if (currentIndent.startsWith(parentIndent)) {
          const diff = currentIndent.slice(parentIndent.length);
          if (diff.length > 0 && !diff.includes("\n")) {
            indentUnit = diff;
          }
        }
      }
    }

    const formatter = new Formatter({ indent: indentUnit });
    let newXml = formatter.format(content);

    if (currentIndent && newXml.includes("\n")) {
      newXml = newXml
        .split("\n")
        .map((line, index) => (index === 0 ? line : currentIndent + line))
        .join("\n");
    }

    const patch = this.binder.calcReplaceNodePatch(target, newXml);
    const tr = new Transaction(this.state);
    if (patch) {
      tr.replace(patch.start, patch.end, patch.text);
    }
    return tr;
  }

  public insertNode(
    parent: ModelElement,
    child: ModelNode,
    index: number,
  ): Transaction {
    if (!parent.cst) throw new Error("Parent node not linked to CST");

    // Determine basic indentation
    const indentUnit = "  ";
    // Smart Formatting: Determine baseIndent and prefix/suffix
    let baseIndent = "";
    let prefix = "";
    let suffix = "";

    // Check if child is already in model (DOM usage)
    const isAlreadyInModel = parent.children[index] === child;

    // Scan backwards for significant node
    let probe = isAlreadyInModel ? index - 1 : index - 1;
    let refNode: ModelNode | null = null;
    let newlineFound = false;

    while (probe >= 0) {
      const node = parent.children[probe];
      if (node instanceof ModelText && node.text.trim().length === 0) {
        if (node.text.includes("\n")) newlineFound = true;
        probe--;
      } else {
        refNode = node;
        break;
      }
    }

    if (refNode && refNode.formatting.indent !== null) {
      baseIndent = refNode.formatting.indent;
      prefix = newlineFound ? baseIndent : "\n" + baseIndent;
    } else if (!refNode) {
      // Empty or first significant child
      // Check next sibling to decide mode
      const nextNode = isAlreadyInModel
        ? index + 1 < parent.children.length
          ? parent.children[index + 1]
          : null
        : index < parent.children.length
          ? parent.children[index]
          : null;

      if (nextNode && nextNode.formatting.indent === null) {
        // Next is inline. Stay inline.
      } else {
        // Next is block (or doesn't exist).
        // If parent has indent, assume block.
        if (parent.formatting.indent !== null) {
          baseIndent = parent.formatting.indent + indentUnit;
          prefix = "\n" + baseIndent;
        }
      }
    }

    // Suffix logic: ensure closing tag is on new line if block mode
    // If we are appending at the end, or next is end-tag
    // Simple heuristic: if we added a newline prefix (block mode), add a newline suffix
    if (prefix.includes("\n") || newlineFound) {
      // Use parent's indent for the closing tag
      suffix = "\n" + (parent.formatting.indent || "");
    }

    const formatter = new Formatter({ indent: indentUnit, baseIndent });
    const insertText = prefix + formatter.format(child) + suffix;

    const patch = this.binder.calcInsertNodePatch(parent, index, insertText);
    const tr = new Transaction(this.state);
    if (patch) {
      tr.replace(patch.start, patch.end, patch.text);
    }
    return tr;
  }
}
