# Getting Started

## Introduction

This project provides a foundational XML parser and manipulation API designed for WYSIWYG editors and Integrated Development Environments (IDEs). It aims to achieve both intuitive application operation and full fidelity of the source code. By maintaining a bidirectional synchronization between the application view and the source code, it ensures high performance and data integrity.

## Project Goals

1.  **Intuitive Operation**: The application layer can manipulate XML using an interface similar to the Document Object Model (DOM).
2.  **Full Fidelity**: Automated edits must not alter any whitespace, indentation, or comments in parts of the code that are not explicitly modified.
3.  **Bidirectional Synchronization**:
    *   **Source to Application**: Edits in the source code are reflected in the application model immediately.
    *   **Application to Source**: Operations in the application are converted into minimal text patches for the source code, preserving existing formatting.
4.  **Domain Suitability**: The system recognizes schema-specific rules, such as void elements in XHTML5, to ensure valid edits.

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
