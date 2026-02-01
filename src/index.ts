/**
 * # XML API Reference
 *
 * This package provides a foundational API for parsing, manipulating, and synchronizing XML documents with high fidelity.
 * It is designed for WYSIWYG editors and IDEs that require bidirectional synchronization between the source code and the application model.
 *
 * ## Key Components
 *
 * - {@link XMLAPI}: The central entry point. Manages the source code, parsing, and bidirectional updates.
 * - {@link AST}: The high-level Abstract Syntax Tree used for easy traversal and data extraction.
 * - {@link XMLBinder}: Handles the logic for calculating minimal text patches to update the source code based on model changes.
 *
 * ## Core Features
 *
 * - **Incremental Updates**: Update the source code efficiently using {@link XMLAPI.updateInput}.
 * - **AST Manipulation**: Modify the document structure using high-level methods like {@link XMLAPI.setAttribute}, {@link XMLAPI.updateText}, and {@link XMLAPI.replaceNode}.
 * - **History Management**: Built-in support for {@link XMLAPI.undo} and {@link XMLAPI.redo}.
 *
 * @packageDocumentation
 */

export * from "./xml-api";
export * from "./ast/dom";
export * from "./model/xml-api-model";
export { XMLBinder } from "./model/xml-binder";
export * from "./ast/xml-ast";
export * from "./model/formatter";
