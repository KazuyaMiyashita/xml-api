# Getting Started

## Introduction

This project provides a foundational XML parser and manipulation API designed for WYSIWYG editors and Integrated Development Environments (IDEs). Tailored for tools that demand high precision and seamless usability, it offers:

1.  **Intuitive Operation**: Manipulate XML through a familiar **DOM-compatible interface**.
2.  **Full Fidelity**: Ensure that whitespace, indentation, and comments in unmodified parts of the source remain untouched.
3.  **Bidirectional Synchronization**: A robust engine that maintains consistency between the source text and the internal logical model.
    *   **Source to Application**: Changes in the source code are reflected in the model immediately.
    *   **Application to Source**: Operations in the application are converted into minimal text patches, preserving the original formatting.

## Installation

```bash
pnpm install @miy2/xml-api
```

## Basic Usage

### Initialization

```typescript
import { XMLAPI } from '@miy2/xml-api';

const source = `<root>
  <item>Hello World</item>
</root>`;

const api = new XMLAPI(source);
```

### Manipulating via DOM Interface

The most intuitive way to work with XML is through the DOM-compatible interface, which can be accessed via `api.getDocument()`.

```typescript
// Obtain a DOM-compatible Document object
const doc = api.getDocument();

// Use familiar DOM methods
const item = doc.querySelector('item');

if (item) {
  // Update text content
  item.textContent = "Updated via DOM";

  // Set an attribute
  item.setAttribute("id", "123");
}

// Access the automatically updated source.
console.log(api.source);
```

### Using Schema Views

Use `api.createView()` to focus on specific elements while preserving other data in the source (such as comments or custom tags). This is ideal for building applications like WYSIWYG editors.

```typescript
const api = new XMLAPI(`
<root>
  <!-- Private comment -->
  <content>Public Text</content>
  <meta>Hidden Data</meta>
</root>
`);

// Create a view that only exposes 'root' and 'content' elements
const view = api.createView({
  filter: (node) => 
    node.getType() === 'Element' && 
    ['root', 'content'].includes((node as any).tagName)
});

const doc = view.getDocument();
const content = doc.querySelector('content');
content.textContent = "Modified Text";

// The comment and <meta> tag are preserved in the source!
console.log(api.source);
```

### Direct Source Updates

The API also supports direct, incremental updates to the source code.

```typescript
// Update the text from index 14 to 25
api.updateSource(14, 25, "New Content");
```
