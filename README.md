# XML API

An XML synchronization engine that maintains full fidelity between source code and the Document Object Model (DOM).

This project provides a foundational XML parser and manipulation API designed for WYSIWYG editors and Integrated Development Environments (IDEs). It features a DOM-compatible interface that bidirectionally synchronizes intuitive application edits and source code modifications, all while preserving details like whitespace and indentation.

## Key Features

- **Full Fidelity**: Edits preserve all whitespace, indentation, and comments automatically in unmodified parts of the code.
- **Bidirectional Sync**: Instantly synchronizes changes between the source code and the in-memory model, ensuring consistent state across operations.
- **DOM Compatibility**: Provides a familiar interface (`Element`, `Document`, `setAttribute`, etc.) for intuitive application development.
- **Incremental Updates**: High performance through incremental parsing and minimal text patching.

## Architecture

The system consists of three main layers orchestrated by the **XMLAPI**:

1. **CST (Concrete Syntax Tree)**: Captures the exact physical structure of the source code, including formatting.
2. **Model**: The authoritative internal representation that maintains object identity and coordinates synchronization.
3. **AST (Abstract Syntax Tree)**: A semantic projection for easy data access and formatting.

## Basic Usage

### Initialization

```typescript
import { XMLAPI } from 'xml-api';

const xml = `<root>
  <item id="1">Original Value</item>
</root>`;

const api = new XMLAPI(xml);
```

### Manipulating via DOM API (Recommended)

You can use standard DOM methods to manipulate the XML. These changes are automatically reflected back to the source code with minimal patches.

```typescript
const doc = api.getDocument(); // Returns a DOM-like Document
const item = doc.querySelector('item');

if (item) {
  item.setAttribute('status', 'active');
  item.textContent = 'Updated Value';
}

console.log(api.input);
/* 
Output:
<root>
  <item id="1" status="active">Updated Value</item>
</root>
*/
```

### Low-level Incremental Updates

```typescript
// Update the source code directly at specific offsets
api.updateInput(14, 28, "New Content");
```

## Documentation

- **[Getting Started](docs/guide/getting-started.md)**: Installation and detailed usage.
- **[Architecture](docs/architecture/overview.md)**: Deep dive into the system design.
- **[Core Concepts](docs/guide/core-concepts.md)**: Understanding Fidelity and the Layered model.
- **[API Reference](docs/api/reference/README.md)**: Auto-generated API documentation.

## Development

This project uses [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm test
pnpm docs:gen-api
```

## License

[MIT](LICENSE.md)
