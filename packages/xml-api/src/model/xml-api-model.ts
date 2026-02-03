import type { CST } from "../cst/xml-cst";

export type NodeId = string;

export enum ModelNodeType {
  Element = "Element",
  Text = "Text",
  Comment = "Comment",
  CDATA = "CDATA",
}

export interface ModelFormatting {
  /**
   * The whitespace preceding the node, if it starts on a new line.
   * Null if the node is inline (preceded by non-whitespace content).
   */
  indent: string | null;
}

export abstract class ModelNode {
  public readonly id: NodeId;
  public parent: ModelElement | null = null;
  public cst: CST | null = null;
  public formatting: ModelFormatting = { indent: null };

  constructor(id?: NodeId) {
    this.id = id ?? crypto.randomUUID();
  }

  abstract getType(): ModelNodeType;

  abstract clone(preserveId?: boolean): ModelNode;

  findNodeById(id: string): ModelNode | null {
    if (this.id === id) return this;
    return null;
  }

  protected cloneBase(target: ModelNode, _preserveId: boolean): void {
    target.cst = this.cst;
    target.formatting = { ...this.formatting };
  }
}

export class ModelElement extends ModelNode {
  public tagName: string;
  public attributes: Map<string, string> = new Map();
  public children: ModelNode[] = [];

  constructor(tagName: string, id?: NodeId) {
    super(id);
    this.tagName = tagName;
  }

  getType(): ModelNodeType {
    return ModelNodeType.Element;
  }

  clone(preserveId = false): ModelElement {
    const clone = new ModelElement(this.tagName, preserveId ? this.id : undefined);
    this.cloneBase(clone, preserveId);
    clone.attributes = new Map(this.attributes);
    clone.children = this.children.map((c) => {
      const cClone = c.clone(preserveId);
      cClone.parent = clone;
      return cClone;
    });
    return clone;
  }

  addChild(node: ModelNode): void {
    node.parent = this;
    this.children.push(node);
  }

  setAttribute(key: string, value: string): void {
    this.attributes.set(key, value);
  }

  find(tagName: string): ModelElement[] {
    let results: ModelElement[] = [];
    for (const child of this.children) {
      if (child instanceof ModelElement) {
        if (child.tagName === tagName) {
          results.push(child);
        }
        results = results.concat(child.find(tagName));
      }
    }
    return results;
  }

  override findNodeById(id: string): ModelNode | null {
    if (this.id === id) return this;
    for (const child of this.children) {
      const found = child.findNodeById(id);
      if (found) return found;
    }
    return null;
  }

  text(): string {
    return this.children
      .map((c) => {
        if (c instanceof ModelText) return c.text;
        if (c instanceof ModelCDATA) return c.content;
        if (c instanceof ModelElement) return c.text();
        return "";
      })
      .join("");
  }
}

export class ModelText extends ModelNode {
  public text: string;

  constructor(text: string, id?: NodeId) {
    super(id);
    this.text = text;
  }

  getType(): ModelNodeType {
    return ModelNodeType.Text;
  }

  clone(preserveId = false): ModelText {
    const clone = new ModelText(this.text, preserveId ? this.id : undefined);
    this.cloneBase(clone, preserveId);
    return clone;
  }
}

export class ModelComment extends ModelNode {
  public content: string;

  constructor(content: string, id?: NodeId) {
    super(id);
    this.content = content;
  }

  getType(): ModelNodeType {
    return ModelNodeType.Comment;
  }

  clone(preserveId = false): ModelComment {
    const clone = new ModelComment(this.content, preserveId ? this.id : undefined);
    this.cloneBase(clone, preserveId);
    return clone;
  }
}

export class ModelCDATA extends ModelNode {
  public content: string;

  constructor(content: string, id?: NodeId) {
    super(id);
    this.content = content;
  }

  getType(): ModelNodeType {
    return ModelNodeType.CDATA;
  }

  clone(preserveId = false): ModelCDATA {
    const clone = new ModelCDATA(this.content, preserveId ? this.id : undefined);
    this.cloneBase(clone, preserveId);
    return clone;
  }
}
