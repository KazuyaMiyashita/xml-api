import {
  ModelCDATA,
  ModelComment,
  ModelElement,
  type ModelNode,
  ModelNodeType,
  ModelText,
} from "../model/xml-api-model";

/**
 * Base class for all DOM nodes.
 * Implements a subset of the W3C Node interface.
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

  get parentNode(): Node | null {
    if (!this.model.parent) return null;
    // In a real DOM, we would need to ensure identity consistency (same wrapper for same model).
    // For now, we create new wrappers on the fly, which is inefficient but functional for Phase 1.
    // To fix identity, we would need a WeakMap cache in the Document.
    return createWrapper(this.model.parent, this.ownerDocument);
  }

  get childNodes(): NodeList {
    if (this.model instanceof ModelElement) {
      return new NodeList(
        this.model.children.map((c) => createWrapper(c, this.ownerDocument)),
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
    const index = parent.children.indexOf(this.model);
    if (index >= 0 && index < parent.children.length - 1) {
      return createWrapper(parent.children[index + 1], this.ownerDocument);
    }
    return null;
  }

  get previousSibling(): Node | null {
    const parent = this.model.parent;
    if (!parent) return null;
    const index = parent.children.indexOf(this.model);
    if (index > 0) {
      return createWrapper(parent.children[index - 1], this.ownerDocument);
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
    if (this.model instanceof ModelText) this.model.text = val;
    else if (this.model instanceof ModelComment) this.model.content = val;
    else if (this.model instanceof ModelCDATA) this.model.content = val;
    else if (this.model instanceof ModelElement) {
      this.model.children = [];
      if (val) {
        this.model.addChild(new ModelText(val));
      }
    }
  }

  appendChild<T extends Node>(newChild: T): T {
    if (this.model instanceof ModelElement) {
      // If newChild is already in the tree, remove it first (not implemented yet for simplicity)
      this.model.addChild(newChild.getModel());
      // Update the wrapper's ownerDocument
      // @ts-ignore - protected access
      newChild.ownerDocument = this.ownerDocument;
      return newChild;
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

  getAttribute(name: string): string | null {
    return this.model.attributes.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.model.attributes.set(name, value);
  }

  removeAttribute(name: string): void {
    this.model.attributes.delete(name);
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

export class Document extends Node {
  private _documentElement: Element | null = null;

  constructor() {
    // Document doesn't strictly have a ModelNode parent in this simplified architecture
    // Or it could wrap a "root" ModelElement
    // For now, we'll create a dummy root model or handle it differently
    super(new ModelElement("#document"), null);
    this.ownerDocument = this; // Document owns itself
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
      // @ts-ignore
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
export function createWrapper(
  model: ModelNode,
  doc: Document | null,
): Node {
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
    return className ? className.split(/\s+/).includes(selector.slice(1)) : false;
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
