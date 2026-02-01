**xml-api**

***

# XML API Reference

This package provides a foundational API for parsing, manipulating, and synchronizing XML documents with high fidelity.
It is designed for WYSIWYG editors and IDEs that require bidirectional synchronization between the source code and the application model.

## Key Components

- **XMLAPI**: The central entry point. Manages the source code, parsing, and bidirectional updates.
- **Model**: The authoritative logical representation for traversal and bidirectional synchronization.
- **DOM**: familiar W3C-like interface for intuitive manipulation.

## Usage

This package requires subpath exports. You must import components from their specific paths.

```typescript
import { XMLAPI } from 'xml-api/xml-api';
import { Element } from 'xml-api/dom';
import { ModelElement } from 'xml-api/model/xml-api-model';
```
