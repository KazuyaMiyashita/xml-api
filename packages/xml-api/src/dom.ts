import {
  ModelCDATA,
  ModelComment,
  ModelElement,
  type ModelNode,
  ModelNodeType,
  ModelText,
} from "./model/xml-api-model";

/**
 * Observer interface to listen for changes in the DOM-like structure.
 * This is crucial for synchronizing the visual representation or application model
 * back to the source code via the XMLAPI.
 *
 * @example
 * ```typescript
 * const doc = new Document();
 * doc.setObserver({
 *   onAttributeChange: (element, name, value) => {
 *     console.log(`Attribute ${name} changed to ${value}`);
 *     // Sync with XMLAPI...
 *   },
 *   // ...
 * });
 * ```
 */
export interface DOMObserver {
  /**
   * Called when an attribute is added, changed, or removed.
   * @param element The target element.
   * @param name Attribute name.
   * @param value New value, or null if removed.
   */
  onAttributeChange(element: Element, name: string, value: string | null): void;

  /**
   * Called when the text content of a node changes.
   * @param node The target CharacterData node (Text, Comment, CDATA).
   * @param text The new text content.
   */
  onTextChange(node: CharacterData, text: string): void;

  /**
   * Called when the text content of an Element changes (replacing all children).
   * @param element The target Element.
   * @param text The new text content.
   */
  onElementTextChange(element: Element, text: string): void;

  /**
   * Called when a child node is added.
   * @param parent The parent node.
   * @param child The added child node.
   * @param index The index at which the child was added.
   */
  onChildAdded(parent: Node, child: Node, index: number): void;

  /**
   * Called when a child node is removed.
   * @param parent The parent node.
   * @param child The removed child node.
   * @param index The index from which the child was removed.
   */
  onChildRemoved(parent: Node, child: Node, index: number): void;
}

/**
 * Base class for all DOM nodes.
 * Implements a subset of the W3C Node interface to allow applications
 * to interact with the XML model using familiar methods.
 */
export abstract class Node {
  public readonly ELEMENT_NODE = 1;
  public readonly TEXT_NODE = 3;
  public readonly CDATA_SECTION_NODE = 4;
  public readonly COMMENT_NODE = 8;
  public readonly DOCUMENT_NODE = 9;

  constructor(
    protected model: ModelNode,
    public ownerDocument: Document | null,
  ) {}

  abstract get nodeType(): number;
  abstract get nodeName(): string;

  /**
   * Returns the parent of this node.
   */
  get parentNode(): Node | null {
    if (!this.model.parent) return null;
    return createWrapper(this.model.parent, this.ownerDocument);
  }

  /**
   * Returns a NodeList containing all children of this node, respecting the document's filter.
   */
  get childNodes(): NodeList {
    if (this.model instanceof ModelElement) {
      let children = this.model.children;
      if (this.ownerDocument && this.ownerDocument.nodeFilter) {
        children = children.filter((c) => this.ownerDocument!.accepts(c));
      }
      return new NodeList(
        children.map((c) => createWrapper(c, this.ownerDocument)),
      );
    }
    return new NodeList([]);
  }

  get firstChild(): Node | null {
    const nodes = this.childNodes;
    return nodes.length > 0 ? nodes.item(0) : null;
  }

  get lastChild(): Node | null {
    const nodes = this.childNodes;
    return nodes.length > 0 ? nodes.item(nodes.length - 1) : null;
  }

  get nextSibling(): Node | null {
    const parent = this.model.parent;
    if (!parent) return null;
    let index = parent.children.indexOf(this.model);

    while (index < parent.children.length - 1) {
      index++;
      const sibling = parent.children[index];
      if (!this.ownerDocument || this.ownerDocument.accepts(sibling)) {
        return createWrapper(sibling, this.ownerDocument);
      }
    }
    return null;
  }

  get previousSibling(): Node | null {
    const parent = this.model.parent;
    if (!parent) return null;
    let index = parent.children.indexOf(this.model);

    while (index > 0) {
      index--;
      const sibling = parent.children[index];
      if (!this.ownerDocument || this.ownerDocument.accepts(sibling)) {
        return createWrapper(sibling, this.ownerDocument);
      }
    }
    return null;
  }

  get textContent(): string | null {
    if (this.model instanceof ModelText) return this.model.text;
    if (this.model instanceof ModelComment) return this.model.content;
    if (this.model instanceof ModelCDATA) return this.model.content;
    if (this.model instanceof ModelElement) {
      return this.model.children
        .map((c) => createWrapper(c, this.ownerDocument).textContent)
        .join("");
    }
    return null;
  }

  set textContent(value: string | null) {
    const val = value || "";
    const m = this.model;

    if (m instanceof ModelText && this instanceof CharacterData) {
      m.text = val;
      this.ownerDocument?.notifyTextChange(this, val);
    } else if (m instanceof ModelComment && this instanceof CharacterData) {
      m.content = val;
      this.ownerDocument?.notifyTextChange(this, val);
    } else if (m instanceof ModelCDATA && this instanceof CharacterData) {
      m.content = val;
      this.ownerDocument?.notifyTextChange(this, val);
    } else if (m instanceof ModelElement && this instanceof Element) {
      m.children = [];
      if (val) {
        const textNode = new ModelText(val);
        m.addChild(textNode);
      }
      this.ownerDocument?.notifyElementTextChange(this, val);
    }
  }

  /**
   * Adds a node to the end of the list of children of a specified parent node.
   * @param newChild The node to append.
   */
  appendChild<T extends Node>(newChild: T): T {
    if (this.model instanceof ModelElement) {
      this.model.addChild(newChild.getModel());
      newChild.ownerDocument = this.ownerDocument;

      this.ownerDocument?.notifyChildAdded(
        this,
        newChild,
        this.model.children.length - 1,
      );
      return newChild;
    }
    throw new Error("HierarchyRequestError");
  }

  /**
   * Inserts a node before a reference node as a child of this node.
   * @param newChild The node to insert.
   * @param refChild The reference node (must be a child of this node).
   */
  insertBefore<T extends Node>(newChild: T, refChild: Node | null): T {
    if (this.model instanceof ModelElement) {
      if (!refChild) {
        return this.appendChild(newChild);
      }
      const refModel = refChild.getModel();
      const index = this.model.children.indexOf(refModel);
      if (index === -1) throw new Error("NotFoundError");

      // Update Model
      this.model.children.splice(index, 0, newChild.getModel());
      newChild.getModel().parent = this.model;
      newChild.ownerDocument = this.ownerDocument;

      this.ownerDocument?.notifyChildAdded(this, newChild, index);
      return newChild;
    }
    throw new Error("HierarchyRequestError");
  }

  /**
   * Removes a child node from the DOM and returns the removed node.
   * @param child The child node to remove.
   */
  removeChild<T extends Node>(child: T): T {
    if (this.model instanceof ModelElement) {
      const childModel = child.getModel();
      const index = this.model.children.indexOf(childModel);
      if (index === -1) throw new Error("NotFoundError");

      // Update Model
      this.model.children.splice(index, 1);
      childModel.parent = null;

      this.ownerDocument?.notifyChildRemoved(this, child, index);
      return child;
    }
    throw new Error("HierarchyRequestError");
  }

  // Internal access
  getModel(): ModelNode {
    return this.model;
  }
}

export class NodeList extends Array<Node> {
  constructor(items: Node[]) {
    super(...items);
    Object.setPrototypeOf(this, NodeList.prototype);
  }

  item(index: number): Node | null {
    return this[index] || null;
  }
}

/**
 * Base class for Text, Comment, and CDATASection nodes.
 */
export abstract class CharacterData extends Node {
  get data(): string {
    return this.textContent || "";
  }

  set data(value: string) {
    this.textContent = value;
  }

  get length(): number {
    return this.data.length;
  }
}

export class Text extends CharacterData {
  get nodeType(): number {
    return this.TEXT_NODE;
  }

  get nodeName(): string {
    return "#text";
  }
}

export class Comment extends CharacterData {
  get nodeType(): number {
    return this.COMMENT_NODE;
  }

  get nodeName(): string {
    return "#comment";
  }
}

export class CDATASection extends CharacterData {
  get nodeType(): number {
    return this.CDATA_SECTION_NODE;
  }

  get nodeName(): string {
    return "#cdata-section";
  }
}

/**
 * Represents an element in the XML document.
 */
export class Element extends Node {
  constructor(
    protected override model: ModelElement,
    ownerDocument: Document | null,
  ) {
    super(model, ownerDocument);
  }

  get nodeType(): number {
    return this.ELEMENT_NODE;
  }

  get nodeName(): string {
    return this.model.tagName;
  }

  get tagName(): string {
    return this.model.tagName;
  }

  get prefix(): string | null {
    const parts = this.model.tagName.split(":");
    return parts.length > 1 ? parts[0] : null;
  }

  get localName(): string {
    const parts = this.model.tagName.split(":");
    return parts.length > 1 ? parts[1] : parts[0];
  }

  get namespaceURI(): string | null {
    const prefix = this.prefix;
    const xmlnsKey = prefix ? `xmlns:${prefix}` : "xmlns";

    let current: ModelElement | null = this.model;
    while (current) {
      if (current.attributes.has(xmlnsKey)) {
        return current.attributes.get(xmlnsKey) || null;
      }
      current = current.parent;
    }
    return null;
  }

  getAttribute(name: string): string | null {
    return this.model.attributes.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.model.attributes.set(name, value);
    this.ownerDocument?.notifyAttributeChange(this, name, value);
  }

  removeAttribute(name: string): void {
    this.model.attributes.delete(name);
    this.ownerDocument?.notifyAttributeChange(this, name, null);
  }

  hasAttribute(name: string): boolean {
    return this.model.attributes.has(name);
  }

  querySelector(selector: string): Element | null {
    const results: Element[] = [];
    querySelectorAllRecursive(this, selector, results);
    return results.length > 0 ? results[0] : null;
  }

  querySelectorAll(selector: string): NodeList {
    const results: Element[] = [];
    querySelectorAllRecursive(this, selector, results);
    return new NodeList(results);
  }
}

/**
 * Represents the entire XML document.
 */
export class Document extends Node {
  private _documentElement: Element | null = null;
  private observer: DOMObserver | null = null;
  public nodeFilter: ((node: ModelNode) => boolean) | null = null;

  constructor() {
    // Document doesn't strictly have a ModelNode parent in this simplified architecture
    // Or it could wrap a "root" ModelElement
    // For now, we'll create a dummy root model or handle it differently
    super(new ModelElement("#document"), null);
    this.ownerDocument = this; // Document owns itself
  }

  /**
   * Checks if a node is accepted by the current filter.
   */
  accepts(node: ModelNode): boolean {
    return this.nodeFilter ? this.nodeFilter(node) : true;
  }

  /**
   * Sets the observer to listen for DOM changes.
   */
  setObserver(observer: DOMObserver) {
    this.observer = observer;
  }

  notifyAttributeChange(element: Element, name: string, value: string | null) {
    this.observer?.onAttributeChange(element, name, value);
  }

  notifyTextChange(node: CharacterData, text: string) {
    this.observer?.onTextChange(node, text);
  }

  notifyElementTextChange(element: Element, text: string) {
    this.observer?.onElementTextChange(element, text);
  }

  notifyChildAdded(parent: Node, child: Node, index: number) {
    this.observer?.onChildAdded(parent, child, index);
  }

  notifyChildRemoved(parent: Node, child: Node, index: number) {
    this.observer?.onChildRemoved(parent, child, index);
  }

  get nodeType(): number {
    return this.DOCUMENT_NODE;
  }

  get nodeName(): string {
    return "#document";
  }

  get documentElement(): Element | null {
    return this._documentElement;
  }

  // Not standard, but needed for initialization
  set documentElement(element: Element | null) {
    this._documentElement = element;
    if (element) {
      // Ensure the element is part of the document structure
      // In a real DOM, documentElement is a child of Document
      // Here, we just link them logically
      element.ownerDocument = this;
    }
  }

  createElement(tagName: string): Element {
    return new Element(new ModelElement(tagName), this);
  }

  createTextNode(data: string): Text {
    return new Text(new ModelText(data), this);
  }

  createComment(data: string): Comment {
    return new Comment(new ModelComment(data), this);
  }

  createCDATASection(data: string): CDATASection {
    return new CDATASection(new ModelCDATA(data), this);
  }

  querySelector(selector: string): Element | null {
    if (!this.documentElement) return null;
    return this.documentElement.querySelector(selector);
  }

  querySelectorAll(selector: string): NodeList {
    if (!this.documentElement) return new NodeList([]);
    return this.documentElement.querySelectorAll(selector);
  }
}

// Helper factory
export function createWrapper(model: ModelNode, doc: Document | null): Node {
  if (model instanceof ModelElement) return new Element(model, doc);
  if (model instanceof ModelText) return new Text(model, doc);
  if (model instanceof ModelComment) return new Comment(model, doc);
  if (model instanceof ModelCDATA) return new CDATASection(model, doc);
  throw new Error(`Unknown model type: ${model.getType()}`);
}

function matchSelector(el: Element, selector: string): boolean {
  // Very basic selector engine
  if (selector.startsWith("#")) {
    return el.getAttribute("id") === selector.slice(1);
  }
  if (selector.startsWith(".")) {
    const className = el.getAttribute("class");
    return className
      ? className.split(/\s+/).includes(selector.slice(1))
      : false;
  }
  if (selector.startsWith("[") && selector.endsWith("]")) {
    const parts = selector.slice(1, -1).split("=");
    const key = parts[0];
    const val = parts[1] ? parts[1].replace(/['"]/g, "") : null;
    const attr = el.getAttribute(key);
    return val ? attr === val : attr !== null;
  }
  // Tag name
  return el.tagName === selector || selector === "*";
}

function querySelectorAllRecursive(
  root: Element,
  selector: string,
  results: Element[],
) {
  // Check self (if not root of query? Standard querySelectorAll doesn't match root usually, but here we traverse children)
  // Actually querySelectorAll searches *descendants*.

  const children = root.childNodes;
  for (const child of children) {
    if (child instanceof Element) {
      if (matchSelector(child, selector)) {
        results.push(child);
      }
      querySelectorAllRecursive(child, selector, results);
    }
  }
}
