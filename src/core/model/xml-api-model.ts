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

  addChild(node: ModelNode): void {
    node.parent = this;
    this.children.push(node);
  }

  setAttribute(key: string, value: string): void {
    this.attributes.set(key, value);
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
}
