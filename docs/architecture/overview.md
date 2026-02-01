# System Architecture Overview

This project is built on a layered architecture designed to bridge the gap between raw source code (text) and application-level data (objects) while maintaining perfect fidelity.

## Component Descriptions

### XMLAPI
The central mediator and controller. It manages the lifecycle of the system and serves as the single entry point for external applications. It orchestrates the flow of data between the Parser, Binder, and the DOM layer.

### DOM Interface (Document, Element, Node)
A DOM-compatible API layer that wraps the internal Model. It allows developers to interact with the XML as if it were a standard web DOM. When operations (like `setAttribute`) are performed on these objects, they trigger the Binder to calculate patches for the source code.

### XMLBinder
The core engine that handles data synchronization and transformation. It performs:
- **Hydration**: Converting CST nodes to Model nodes.
- **Reconciliation**: Updating existing model nodes with new CST data to preserve object identity and stable IDs.
- **Patch Generation**: Calculating the minimal text change needed to reflect a logical operation in the source XML, respecting existing formatting.

### Model (ModelElement, ModelText, etc.)
The authoritative internal representation of the XML. It sits between the physical CST and the simplified AST/DOM. It manages persistent IDs and maintains the link to the corresponding CST nodes.

### Parser & CST
The **Parser** converts input strings into a **Concrete Syntax Tree (CST)**. The CST captures every character of the source, including whitespace and comments. It supports incremental re-parsing, allowing the system to update only affected branches when the text changes.

### Formatter
Used when generating new XML fragments or performing major structural changes. It can either preserve existing indentation (fidelity mode) or apply new formatting rules (re-format mode).

## Data Flow

1. **Source -> Application**:
   `Input String` -> `Parser` -> `CST` -> `Binder (Hydrate)` -> `Model` -> `DOM Interface`
2. **Application -> Source**:
   `DOM Operation` -> `Binder (Patch)` -> `Text Change` -> `XMLAPI (Update Input)` -> `Incremental Parse` -> `Model Reconciliation`
