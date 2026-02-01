# AST Layer Architecture Comparison Report

## Overview
This report compares two potential architectures for the AST layer of the XML API, focusing on the trade-offs between standard Web API compatibility and source code fidelity.

## Option A: Native DOM Integration (jsdom)

### Implementation
- Uses `jsdom` to create a live `XMLDocument`.
- Projects `XMLAPIModel` into the DOM and uses `MutationObserver` to sync changes back.

### Findings
- **Fidelity**: **FAILED**. The native `XMLSerializer` does not preserve:
    - Attribute quote types (converts `'` to `"`).
    - Extra whitespace between attributes.
    - Specific formatting of self-closing tags (e.g., `<empty />` becomes `<empty/>`).
- **Compatibility**: **HIGH**. Supports all standard DOM methods, `querySelector`, and can be used with standard XPath engines.
- **Complexity**: **MODERATE**. Requires complex mapping and reconciliation between DOM nodes and Model nodes.
- **Performance**: **LOW**. Double-parsing and synchronization overhead. Large dependency (`jsdom`).

## Option B: Custom DOM-like Wrapper (Duck Typing)

### Implementation
- Creates custom classes (`CustomElement`, `CustomText`) that implement a subset of the W3C DOM interfaces.
- These wrappers act as a direct proxy to the `XMLAPIModel`.

### Findings
- **Fidelity**: **EXCELLENT**. Since it directly manipulates the `XMLAPIModel`, we can use our existing `Formatter` which respects the `CST` formatting information.
- **Compatibility**: **MODERATE**. Supports only the methods we implement. Standard external libraries (like those expecting a real `window.Node`) may fail unless we achieve high interface coverage.
- **Complexity**: **HIGH**. Requires manual implementation of many DOM methods if high compatibility is needed.
- **Performance**: **HIGH**. Direct access to the model with zero synchronization latency. No extra dependencies.

## Comparison Summary

| Feature | Option A (jsdom) | Option B (Custom Wrapper) |
| :--- | :--- | :--- |
| **Source Fidelity** | Poor | Excellent |
| **API Compatibility** | Full | Partial (Subset) |
| **Performance** | Low | High |
| **Implementation Effort** | Moderate | High |
| **Dependencies** | High (jsdom) | None |

## Final Decision

**Decision: Option B (Custom DOM-like Wrapper)**

### Rationale
The primary goal of this project is **Full Fidelity**. Option A fundamentally compromises this goal because native DOM serialization normalizes the XML structure in ways that are incompatible with preserving original formatting.

Option B allows us to maintain the link between the application's view (AST) and the source code's physical structure (CST) through the `XMLAPIModel`. While it requires more effort to implement DOM-compatible methods, it ensures that automated edits "blend seamlessly with the existing code style" as required by the project goals.

## Next Steps
- Implement formal `Node`, `Element`, `Document` interfaces in `src/ast/`.
- Develop a query engine (querySelector) for the custom AST.
- Integrate with existing `XMLAPIModel` reconciliation logic.
