# System Architecture Overview

## Component Descriptions

### XMLAPI
The central mediator and controller. It manages the lifecycle of the system and serves as the single entry point for external applications. It orchestrates the flow of data between the Parser, Binder, and Schema.

### XMLBinder
A logic engine that handles data synchronization and transformation. It performs:
- **Hydration**: Converting CST nodes to Model nodes.
- **Reconciliation**: Updating existing models with new CST data to preserve object identity.
- **Patch Generation**: calculating minimal text patches to reflect model changes in the source code.

### XMLAPIModel
The data structure definition for the logical model managed by the XMLAPI. It holds data and state but does not contain business logic. It bridges the gap between the physical CST and the logical AST.

### Parser
An engine that parses input strings into a Concrete Syntax Tree (CST) based on the defined Grammar. It is designed to be incremental where possible.

### XMLSchema
A definition of validation rules specific to the application domain. It ensures that operations performed on the model result in valid XML according to the specific schema (e.g., SVG, XHTML).

### Formatter
Handles the conversion of AST back to XML string. It prioritizes fidelity by preserving existing whitespace and comments by default, but also supports forced re-formatting with customizable indentation and newline styles.
