import type { CST } from "../cst/xml-cst";

export type NodeId = string;

export enum ModelNodeType {
  Element = "Element",
  Text = "Text",
  Comment = "Comment",
  CDATA = "CDATA",
}

export abstract class ModelNode {
  public readonly id: NodeId;
  public parent: ModelElement | null = null;
  public cst: CST | null = null;

  constructor() {
    this.id = crypto.randomUUID();
  }

  abstract getType(): ModelNodeType;

  abstract clone(preserveId?: boolean): ModelNode;

  protected cloneBase(target: ModelNode, preserveId: boolean): void {
    if (preserveId) {
      // @ts-ignore
      target.id = this.id;
    }
    target.cst = this.cst;
  }
}

export class ModelElement extends ModelNode {
  public tagName: string;
  public attributes: Map<string, string> = new Map();
  public children: ModelNode[] = [];

  constructor(tagName: string) {
    super();
    this.tagName = tagName;
  }

  getType(): ModelNodeType {
    return ModelNodeType.Element;
  }

  clone(preserveId = false): ModelElement {
    const clone = new ModelElement(this.tagName);
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

  constructor(text: string) {
    super();
    this.text = text;
  }

  getType(): ModelNodeType {
    return ModelNodeType.Text;
  }

  clone(preserveId = false): ModelText {
    const clone = new ModelText(this.text);
    this.cloneBase(clone, preserveId);
    return clone;
  }
}

export class ModelComment extends ModelNode {
  public content: string;

  constructor(content: string) {
    super();
    this.content = content;
  }

  getType(): ModelNodeType {
    return ModelNodeType.Comment;
  }

  clone(preserveId = false): ModelComment {
    const clone = new ModelComment(this.content);
    this.cloneBase(clone, preserveId);
    return clone;
  }
}

export class ModelCDATA extends ModelNode {
  public content: string;

  constructor(content: string) {
    super();
    this.content = content;
  }

  getType(): ModelNodeType {
    return ModelNodeType.CDATA;
  }

  clone(preserveId = false): ModelCDATA {
    const clone = new ModelCDATA(this.content);
    this.cloneBase(clone, preserveId);
    return clone;
  }
}
