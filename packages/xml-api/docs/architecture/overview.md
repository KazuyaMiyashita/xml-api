# System Architecture Overview

This project is built on a layered architecture designed to bridge the gap between raw source code (text) and application-level data (objects) while maintaining perfect fidelity.

## Component Descriptions

### XMLAPI
The public facade and entry point for the library. It provides a clean interface for accessing the source code, the logical model, and the DOM wrapper, while delegating complex synchronization logic to the internal **SyncEngine**.

### SyncEngine
The core logic unit that orchestrates the Parser, Binder, and History management. It handles:
- **Incremental Parsing**: Coordinating with the Parser to update the CST efficiently.
- **Synchronization**: Using the Binder to keep the Model in sync with the CST.
- **Transaction Management**: Managing undo/redo history.

### DOM Interface (Document, Element, Node)
A DOM-compatible API layer that wraps the internal Model. It allows developers to interact with the XML as if it were a standard web DOM. When operations (like `setAttribute`) are performed on these objects, they trigger the Engine to calculate patches for the source code.

### Schema Projection (SchemaView & ViewBinder)
A specialized view layer that projects the raw Model into a schema-specific representation (e.g., XHTML).
- **SchemaView**: Provides a filtered DOM tree that hides irrelevant nodes (like comments or non-schema tags) while maintaining full fidelity of the underlying source.
- **ViewBinder**: Reconciles changes from an external DOM (like a browser's `contentEditable`) back to the Model, handling the complexity of mapping filtered views to the complete document structure.

### XMLBinder
The logic component used by the SyncEngine to handle data synchronization and transformation. It performs:
- **Hydration**: Converting CST nodes to Model nodes.
- **Reconciliation**: Updating existing model nodes with new CST data to preserve object identity and stable IDs.
- **Patch Generation**: Calculating the minimal text change needed to reflect a logical operation in the source XML, respecting existing formatting.

### Model (ModelElement, ModelText, etc.)
The authoritative internal representation of the XML. It sits between the physical CST and the application-level DOM Interface. It manages persistent IDs and maintains the link to the corresponding CST nodes.

### Parser & CST
The **Parser** converts input strings into a **Concrete Syntax Tree (CST)**. The CST captures every character of the source, including whitespace and comments. It supports incremental re-parsing, allowing the system to update only affected branches when the text changes.

### Formatter
Used when generating new XML fragments or performing major structural changes. It can either preserve existing indentation (fidelity mode) or apply new formatting rules (re-format mode).

## Data Flow

1. **Source -> Application**:
   `Input String` -> `SyncEngine` -> `Parser` -> `CST` -> `Binder (Hydrate)` -> `Model` -> `SchemaView (Project)` -> `Filtered DOM`
2. **Application -> Source**:
   `Filtered DOM Operation` -> `SchemaView` -> `ViewBinder` -> `SyncEngine` -> `Binder (Patch)` -> `Text Change` -> `Update Source` -> `Incremental Parse` -> `Model Reconciliation`
