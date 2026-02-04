import {
  type Document as ApiDocument,
  type Element as ApiElement,
  type Node as ApiNode,
  Text as ApiText,
} from "../dom";
import { ModelText } from "../model/xml-api-model";

// Minimal interface for external DOM nodes (Browser DOM compatible)
export interface ExternalNode {
  nodeType: number;
  nodeName: string;
  textContent: string | null;
  childNodes: ArrayLike<ExternalNode>;
  attributes?: ArrayLike<{ name: string; value: string }>;
}

export interface Reconciler {
  reconcile(externalNode: ExternalNode, internalElement: ApiElement): void;
}

export class ViewBinder implements Reconciler {
  constructor(private document: ApiDocument) {}

  public reconcile(
    externalNode: ExternalNode,
    internalElement: ApiElement,
  ): void {
    const bChildren = Array.from(externalNode.childNodes);
    const vChildrenSnapshot = Array.from(internalElement.childNodes);

    let bI = 0;
    let vI = 0;

    while (bI < bChildren.length || vI < vChildrenSnapshot.length) {
      const bNode = bChildren[bI];
      const vNode = vChildrenSnapshot[vI];

      // Case 1: External exhausted
      if (!bNode && vNode) {
        // If vNode is formatting whitespace, preserve it.
        if (this.isPreservableWhitespace(vNode)) {
          vI++;
          continue;
        }
        // Otherwise, it was removed externally.
        internalElement.removeChild(vNode);
        vI++;
        continue;
      }

      // Case 2: Internal exhausted
      if (bNode && !vNode) {
        const newNode = this.createFromExternal(bNode);
        if (newNode) internalElement.appendChild(newNode);
        bI++;
        continue;
      }

      // Case 3: Both exist
      if (this.isPreservableWhitespace(vNode)) {
        // If vNode is formatting whitespace, and bNode is an Element,
        // we skip the whitespace to find the matching Element.
        if (bNode.nodeType === 1) {
          vI++;
          continue;
        }
      }

      if (this.isSameType(bNode, vNode)) {
        this.updateNode(vNode, bNode);
        if (bNode.nodeType === 1) {
          // Element: recurse
          this.reconcile(bNode, vNode as ApiElement);
        }
        bI++;
        vI++;
      } else {
        // Type mismatch
        // If vNode was whitespace, we already handled it above.
        // So this is a real mismatch (e.g. p vs div, or text vs element).
        // Remove vNode (unless preservable - already checked)
        // Check again just in case (redundant but safe)
        if (this.isPreservableWhitespace(vNode)) {
          vI++;
          continue;
        }

        internalElement.removeChild(vNode);
        vI++;
        // Retry bNode against next vNode
      }
    }
  }

  private isSameType(bNode: ExternalNode, vNode: ApiNode): boolean {
    if (bNode.nodeType === 3 && vNode.nodeType === 3) return true; // Text
    if (bNode.nodeType === 1 && vNode.nodeType === 1) {
      // Element
      return (
        bNode.nodeName.toLowerCase() ===
        (vNode as ApiElement).tagName.toLowerCase()
      );
    }
    return false;
  }

  private updateNode(vNode: ApiNode, bNode: ExternalNode) {
    if (vNode.nodeType === 3) {
      // Text
      const newVal = bNode.textContent || "";
      if (vNode.textContent !== newVal) {
        vNode.textContent = newVal;
      }
    } else if (vNode.nodeType === 1) {
      // Element
      const vEl = vNode as ApiElement;
      // Attributes
      if (bNode.attributes) {
        // 1. Update/Add
        for (let j = 0; j < bNode.attributes.length; j++) {
          const attr = bNode.attributes[j];
          if (vEl.getAttribute(attr.name) !== attr.value) {
            vEl.setAttribute(attr.name, attr.value);
          }
        }
        // 2. Remove missing (optional, might want to preserve attributes not in external view?
        // But if external view is authoritative for the allowed schema, maybe we should remove?
        // WYSIWYGEditor implementation didn't explicitly remove attributes.
        // But it synced attributes one way.
        // Let's stick to update/add for now to be safe, or check TODO.
        // TODO doesn't specify attribute removal policy.
        // But standard reconciliation usually implies full sync.
        // I will assume strictly what is in bNode is what we want, BUT we must be careful about "invisible" attributes?
        // SchemaView might filter attributes? No, SchemaView filter is on Nodes.
        // So I'll stick to what WYSIWYGEditor did: only setAttribute.
      }
    }
  }

  private createFromExternal(bNode: ExternalNode): ApiNode | null {
    if (bNode.nodeType === 3) {
      return this.document.createTextNode(bNode.textContent || "");
    } else if (bNode.nodeType === 1) {
      const vNew = this.document.createElement(bNode.nodeName.toLowerCase());
      if (bNode.attributes) {
        for (let j = 0; j < bNode.attributes.length; j++) {
          vNew.setAttribute(
            bNode.attributes[j].name,
            bNode.attributes[j].value,
          );
        }
      }
      const children = bNode.childNodes;
      for (let k = 0; k < children.length; k++) {
        const child = this.createFromExternal(children[k]);
        if (child) vNew.appendChild(child);
      }
      return vNew;
    }
    return null;
  }

  private isPreservableWhitespace(node: ApiNode): boolean {
    const model = node.getModel();
    if (model instanceof ModelText) {
      return model.kind === "whitespace";
    }
    return false;
  }
}
