# Getting Started

## Introduction

This project provides a foundational XML parser and manipulation API designed for WYSIWYG editors and Integrated Development Environments (IDEs). Ideally suited for tools requiring high precision and usability, it provides:

1.  **Intuitive Operation**: The application layer can manipulate XML using an interface similar to the Document Object Model (DOM).
2.  **Full Fidelity**: Automated edits ensure that whitespace, indentation, or comments in unmodified parts of the code remain untouched.
3.  **Bidirectional Synchronization**: Maintains high performance and data integrity by syncing changes instantly.
    *   **Source to Application**: Edits in the source code are reflected in the application model immediately.
    *   **Application to Source**: Operations in the application are converted into minimal text patches for the source code, preserving existing formatting.
4.  **Domain Suitability**: Recognizes schema-specific rules, such as void elements in XHTML5, to ensure valid edits.

## Installation

```bash
pnpm install xml-api
```

## Basic Usage

### Initialization

```typescript
import { XMLAPI } from 'xml-api';

const source = `<root>
  <item>Hello World</item>
</root>`;

const api = new XMLAPI(source);
```

### Updating Source

The API allows incremental updates to the source code, which automatically reflects in the internal models.

```typescript
// Update the text from index 14 to 25
api.updateInput(14, 25, "New Content");
```

### Updating via AST API

You can manipulate the XML structure using high-level methods. These operations automatically calculate minimal patches and apply them to the source code, preserving formatting in surrounding areas.

```typescript
// Access the AST root
const root = api.ast;

// Find a child element (e.g., <item>)
const item = root?.children.find(node => typeof node === 'object' && 'tagName' in node);

if (item) {
  // Update the text content of the element
  api.updateText(item, "Updated via API");

  // Set an attribute
  api.setAttribute(item, "id", "123");
}

console.log(api.input);
```
