# Getting Started

## Introduction

This project provides a foundational XML parser and manipulation API designed for WYSIWYG editors and Integrated Development Environments (IDEs). Ideally suited for tools requiring high precision and usability, it delivers:

1.  **Intuitive Operation**: The application layer can manipulate XML using a **DOM-compatible interface**.
2.  **Full Fidelity**: Automated edits ensure that whitespace, indentation, or comments in unmodified parts of the code remain untouched.
3.  **Bidirectional Synchronization**: An XML synchronization engine that maintains consistency between the source code and the internal logical model.
    *   **Source to Application**: Changes in the source code are reflected in the model immediately.
    *   **Application to Source**: Operations in the application are converted into minimal text patches for the source code, preserving existing formatting.

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

### Manipulating via DOM Interface (Recommended)

The most intuitive way to manipulate the XML is using the DOM-compatible interface.

```typescript
// Get a DOM-compatible Document object
const doc = api.getDocument();

// Use familiar DOM methods
const item = doc.querySelector('item');

if (item) {
  // Update text content
  item.textContent = "Updated via DOM";

  // Set an attribute
  item.setAttribute("id", "123");
}

console.log(api.source);
```

### Using Schema Views (Advanced)

For applications that need to work with a specific subset of XML (e.g., an XHTML editor) while preserving other data (like comments or custom tags) in the source, use `createView`.

```typescript
const api = new XMLAPI(`
<root>
  <!-- Private comment -->
  <content>Public Text</content>
  <meta>Hidden Data</meta>
</root>
`);

// Create a view that only sees 'root' and 'content' elements
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

### Low-level Incremental Updates

The API also allows direct incremental updates to the source code.

```typescript
// Update the text from index 14 to 25
api.updateSource(14, 25, "New Content");
```
