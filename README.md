# XML API

An XML library that faithfully synchronizes documents and AST.

This project provides a foundational XML parser and manipulation API designed for WYSIWYG editors and Integrated Development Environments (IDEs). It aims to achieve both intuitive application operation and full fidelity of the source code. By maintaining a bidirectional synchronization between the application view and the source code, it ensures high performance and data integrity.

## Documentation

- **[Getting Started](docs/guide/getting-started.md)**: Installation and basic usage.
- **[Architecture](docs/architecture/overview.md)**: Detailed system design and component interaction.
- **[API Reference](docs/api/reference/README.md)**: Auto-generated API documentation.
- **[Examples](docs/examples/programmatic-usage.md)**: Programmatic usage scenarios and demos.

## Basic Usage

```typescript
import { XMLAPI } from 'xml-api';

const xml = `<root>
  <item id="1">Value</item>
</root>`;

const api = new XMLAPI(xml);

// 1. Parse and Access AST
if (api.ast) {
  console.log(`Root tag: ${api.ast.tagName}`);
}

// 2. Manipulate
// Update text content of the first child element
const item = api.ast?.children.find(node => typeof node === 'object' && 'tagName' in node);
if (item) {
  api.updateText(item, "New Value");
}

console.log(api.input);
// Output:
// <root>
//   <item id="1">New Value</item>
// </root>
```

## Development Guide

This project uses [pnpm](https://pnpm.io/).

### Setup

```bash
pnpm install
```

### Testing

*   `pnpm test`: Runs all tests in the `src/` directory (Jest).
*   `pnpm typecheck`: Runs TypeScript type checking for the source code.
*   `pnpm docs:typecheck`: Runs type checking for the documentation (Vue components).

### Building

*   `pnpm build`: Builds the library to the `dist/` directory.

### Documentation

*   `pnpm docs:dev`: Starts the VitePress development server for documentation.
*   `pnpm docs:build`: Builds the static documentation site.
*   `pnpm docs:gen-api`: Generates API documentation from source code JSDoc using TypeDoc.
*   `pnpm docs:preview`: Previews the built documentation locally.

## License

[MIT](LICENSE.md)