/**
 * # XML API Reference
 *
 * This package provides a foundational API for parsing, manipulating, and synchronizing XML documents with high fidelity.
 * It is designed for WYSIWYG editors and IDEs that require bidirectional synchronization between the source code and the application model.
 *
 * ## Key Components
 *
 * - {@link XMLAPI}: The central entry point. Manages the source code, parsing, and bidirectional updates.
 *
 * ## Usage
 *
 * This package supports subpath exports. While the main `XMLAPI` class is available from the root,
 * other components should be imported from their specific paths to ensure clear separation of concerns (DOM, Model, AST, etc.).
 *
 * ```typescript
 * import { XMLAPI } from 'xml-api';
 * import { Element } from 'xml-api/ast/dom';
 * import { ModelElement } from 'xml-api/model/xml-api-model';
 * ```
 *
 * @packageDocumentation
 */

export * from "./xml-api";
