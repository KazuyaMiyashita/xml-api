import { 
  ModelNode, 
  ModelElement, 
  ModelText, 
  ModelComment, 
  ModelCDATA,
  ModelNodeType 
} from "../core/model/xml-api-model";

/**
 * A custom implementation of standard DOM-like interfaces.
 * This is "duck typing" the W3C DOM to satisfy standard API consumers.
 */

export abstract class CustomNode {
  constructor(protected model: ModelNode) {}

  get nodeType(): number {
    switch (this.model.getType()) {
      case ModelNodeType.Element: return 1; // ELEMENT_NODE
      case ModelNodeType.Text: return 3; // TEXT_NODE
      case ModelNodeType.Comment: return 8; // COMMENT_NODE
      case ModelNodeType.CDATA: return 4; // CDATA_SECTION_NODE
      default: return 0;
    }
  }

  get nodeName(): string {
    if (this.model instanceof ModelElement) {
      return this.model.tagName;
    }
    switch (this.model.getType()) {
      case ModelNodeType.Text: return "#text";
      case ModelNodeType.Comment: return "#comment";
      case ModelNodeType.CDATA: return "#cdata-section";
      default: return "";
    }
  }

  get parentNode(): CustomElement | null {
    return this.model.parent ? new CustomElement(this.model.parent) : null;
  }

  get childNodes(): CustomNode[] {
    if (this.model instanceof ModelElement) {
      return this.model.children.map(child => wrapNode(child));
    }
    return [];
  }

  get firstChild(): CustomNode | null {
    const children = this.childNodes;
    return children.length > 0 ? children[0] : null;
  }

  get lastChild(): CustomNode | null {
    const children = this.childNodes;
    return children.length > 0 ? children[children.length - 1] : null;
  }

  get nextSibling(): CustomNode | null {
    const parent = this.model.parent;
    if (!parent) return null;
    const index = parent.children.indexOf(this.model);
    if (index >= 0 && index < parent.children.length - 1) {
      return wrapNode(parent.children[index + 1]);
    }
    return null;
  }

  get previousSibling(): CustomNode | null {
    const parent = this.model.parent;
    if (!parent) return null;
    const index = parent.children.indexOf(this.model);
    if (index > 0) {
      return wrapNode(parent.children[index - 1]);
    }
    return null;
  }

  get textContent(): string | null {
    if (this.model instanceof ModelText) return this.model.text;
    if (this.model instanceof ModelComment) return this.model.content;
    if (this.model instanceof ModelCDATA) return this.model.content;
    if (this.model instanceof ModelElement) {
      return this.model.children.map(c => wrapNode(c).textContent).join("");
    }
    return null;
  }

  set textContent(value: string | null) {
    const val = value || "";
    if (this.model instanceof ModelText) this.model.text = val;
    else if (this.model instanceof ModelComment) this.model.content = val;
    else if (this.model instanceof ModelCDATA) this.model.content = val;
    else if (this.model instanceof ModelElement) {
      // Clear children and add a single text node
      this.model.children = [];
      if (val) {
        this.model.addChild(new ModelText(val));
      }
    }
  }

  // Manipulation methods
  appendChild<T extends CustomNode>(newChild: T): T {
    if (this.model instanceof ModelElement) {
      this.model.addChild(newChild.getModel());
      return newChild;
    }
    throw new Error("HierarchyRequestError");
  }

  getModel(): ModelNode {
    return this.model;
  }
}

export class CustomElement extends CustomNode {
  constructor(protected override model: ModelElement) {
    super(model);
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

  get children(): CustomElement[] {
    return this.model.children
      .filter(c => c instanceof ModelElement)
      .map(c => new CustomElement(c as ModelElement));
  }
}

export class CustomText extends CustomNode {
  constructor(protected override model: ModelText) {
    super(model);
  }

  get data(): string {
    return this.model.text;
  }

  set data(value: string) {
    this.model.text = value;
  }
}

function wrapNode(model: ModelNode): CustomNode {
  if (model instanceof ModelElement) return new CustomElement(model);
  if (model instanceof ModelText) return new CustomText(model);
  // Add more mappings as needed
  return new (class extends CustomNode {})(model);
}

export class CustomDocument extends CustomNode {
  private rootElement: CustomElement | null = null;

  constructor() {
    super(new ModelElement("#document") as any); // Fake root for document
  }

  get documentElement(): CustomElement | null {
    return this.rootElement;
  }

  setDocumentElement(element: CustomElement) {
    this.rootElement = element;
  }

  createElement(tagName: string): CustomElement {
    return new CustomElement(new ModelElement(tagName));
  }

  createTextNode(text: string): CustomText {
    return new CustomText(new ModelText(text));
  }
}
