# DOM Interface

The library provides a set of classes that mimic the standard W3C DOM interface. This allows applications to interact with the XML model using familiar methods.

## Document

Represents the entire XML document.

```typescript
class Document extends Node {
  documentElement: Element | null;
  createElement(tagName: string): Element;
  createTextNode(data: string): Text;
  createComment(data: string): Comment;
  querySelector(selector: string): Element | null;
  querySelectorAll(selector: string): NodeList;
}
```

## Element

Represents an XML element.

```typescript
class Element extends Node {
  readonly tagName: string;
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  hasAttribute(name: string): boolean;
  querySelector(selector: string): Element | null;
  querySelectorAll(selector: string): NodeList;
}
```

## CharacterData

Base class for text-like nodes (`Text`, `Comment`, `CDATASection`).

```typescript
abstract class CharacterData extends Node {
  data: string;
  readonly length: number;
}
```

## Node

Base class for all nodes.

```typescript
abstract class Node {
  readonly nodeType: number;
  readonly nodeName: string;
  readonly parentNode: Node | null;
  readonly childNodes: NodeList;
  readonly firstChild: Node | null;
  readonly lastChild: Node | null;
  readonly nextSibling: Node | null;
  readonly previousSibling: Node | null;
  textContent: string | null;
  appendChild<T extends Node>(newChild: T): T;
}
```
