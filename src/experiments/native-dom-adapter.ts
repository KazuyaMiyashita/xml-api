import { JSDOM } from "jsdom";
import { 
  ModelNode, 
  ModelElement, 
  ModelText, 
  ModelComment, 
  ModelCDATA,
  ModelNodeType
} from "../core/model/xml-api-model";

export class NativeDOMAdapter {
  private dom: JSDOM;
  private doc: XMLDocument;
  private modelToDom: Map<ModelNode, Node> = new Map();
  private domToModel: Map<Node, ModelNode> = new Map();

  constructor() {
    this.dom = new JSDOM('<?xml version="1.0" encoding="UTF-8"?><root/>', { contentType: "text/xml" });
    this.doc = this.dom.window.document as unknown as XMLDocument;
    // Clear the dummy root
    while (this.doc.firstChild) {
      this.doc.removeChild(this.doc.firstChild);
    }
  }

  public getDocument(): XMLDocument {
    return this.doc;
  }

  /**
   * Projects XMLAPIModel into the DOM.
   */
  public project(modelRoot: ModelNode): Node {
    const domNode = this.createDomNode(modelRoot);
    this.doc.appendChild(domNode);
    return domNode;
  }

  private createDomNode(modelNode: ModelNode): Node {
    let domNode: Node;

    switch (modelNode.getType()) {
      case ModelNodeType.Element: {
        const modelElem = modelNode as ModelElement;
        const elem = this.doc.createElement(modelElem.tagName);
        for (const [key, value] of modelElem.attributes) {
          elem.setAttribute(key, value);
        }
        for (const child of modelElem.children) {
          elem.appendChild(this.createDomNode(child));
        }
        domNode = elem;
        break;
      }
      case ModelNodeType.Text: {
        const modelText = modelNode as ModelText;
        domNode = this.doc.createTextNode(modelText.text);
        break;
      }
      case ModelNodeType.Comment: {
        const modelComment = modelNode as ModelComment;
        domNode = this.doc.createComment(modelComment.content);
        break;
      }
      case ModelNodeType.CDATA: {
        const modelCDATA = modelNode as ModelCDATA;
        domNode = this.doc.createCDATASection(modelCDATA.content);
        break;
      }
      default:
        throw new Error(`Unknown model node type: ${modelNode.getType()}`);
    }

    this.modelToDom.set(modelNode, domNode);
    this.domToModel.set(domNode, modelNode);
    return domNode;
  }

  /**
   * Starts observing the DOM for changes and syncs them back to the model.
   */
  public observe(): void {
    const observer = new this.dom.window.MutationObserver((mutations) => {
      for (const mutation of mutations) {
        this.handleMutation(mutation);
      }
    });

    observer.observe(this.doc, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  private handleMutation(mutation: MutationRecord): void {
    const target = mutation.target;
    const modelNode = this.domToModel.get(target);
    if (!modelNode) return;

    switch (mutation.type) {
      case "attributes": {
        if (modelNode instanceof ModelElement) {
          const elem = target as Element;
          const attrName = mutation.attributeName!;
          const newValue = elem.getAttribute(attrName);
          if (newValue === null) {
            modelNode.attributes.delete(attrName);
          } else {
            modelNode.attributes.set(attrName, newValue);
          }
        }
        break;
      }
      case "characterData": {
        if (modelNode instanceof ModelText) {
          modelNode.text = (target as Text).data;
        } else if (modelNode instanceof ModelComment) {
          modelNode.content = (target as Comment).data;
        } else if (modelNode instanceof ModelCDATA) {
          modelNode.content = (target as CDATASection).data;
        }
        break;
      }
      case "childList": {
        // Handle additions and removals
        // This requires more complex reconciliation logic.
        // For prototype, we'll just log.
        console.log(`ChildList mutation on ${modelNode.id}`);
        break;
      }
    }
  }
}
