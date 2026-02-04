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

### Low-level Incremental Updates

The API also allows direct incremental updates to the source code.

```typescript
// Update the text from index 14 to 25
api.updateSource(14, 25, "New Content");
```
