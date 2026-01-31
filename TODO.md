# Development Plan for Refined AST Architecture

This document outlines the roadmap to finalize the XML API architecture and build a demonstration application.

## Development Process

For each checklist item below, strictly follow this cycle:

1.  **Verify**: Run existing tests (`pnpm test`) to ensure a clean state.
2.  **Test**: Create or update a test case that reflects the requirement of the checklist item.
3.  **Implement**: Modify the code to pass the test.
4.  **Verify**: Run all tests again to ensure no regressions.
5.  **Check & Commit**: Mark the checklist item as completed and commit the changes with a Japanese commit message.

---

## Phase 0: Comparative Technical Feasibility Study

Investigate and compare two potential architectures for the AST layer to maximize compatibility with standard Web APIs while maintaining source fidelity.

- [x] **Option A: Native DOM Integration (jsdom/xmldom)**
    - [x] **Investigate**: Check capabilities of `jsdom` (or standard Browser DOM) regarding whitespace preservation and source mapping.
    - [x] **Prototype**: Create `src/experiments/native-dom-adapter.ts`.
        - [x] Implement logic to project `XMLAPIModel` into a live `XMLDocument`.
        - [x] Verify if the native parser/serializer preserves `CST` fidelity (whitespace, attribute quotes) perfectly.
        - [x] Implement a prototype for syncing DOM mutations (MutationObserver) back to `XMLAPIModel`.
    - [x] **Evaluation**: Assess fidelity risks, performance cost (double parsing), and dependency overhead.

- [x] **Option B: Custom DOM-like Wrapper (Duck Typing)**
    - [x] **Prototype**: Create `src/experiments/dom-wrapper-impl.ts`.
        - [x] Create wrapper classes that implement standard `Node`, `Element`, and `Document` interfaces backed directly by `XMLAPIModel`.
        - [x] Implement traversal (`parentNode`, `nextSibling`) and manipulation (`setAttribute`, `appendChild`) logic.
    - [x] **Evaluation**: Assess implementation effort, API coverage correctness, and runtime efficiency.

- [x] **Decision & Reporting**
    - [x] **Report**: Create a comprehensive report (`docs/architecture_comparison.md`) summarizing the findings.
        - [x] Comparison of Fidelity (Can it preserve the original source exactly?)
        - [x] Comparison of Compatibility (Can it run standard XPath/QuerySelector?)
        - [x] Comparison of Complexity (Maintenance cost).
    - [x] **Decision**: Choose the final architecture and update `README.md` to reflect the decision.

## Phase 1: Implementation (Branching Paths)

Proceed with the implementation based on the decision made in Phase 0.

### Path A: Native DOM Adoption (If Option A is selected)
- [ ] **Hydration Engine**: Implement the production-grade converter from CST/Model to `XMLDocument`.
- [ ] **Synchronization Bridge**: Implement the observer pattern to apply DOM changes to `XMLAPIModel` and generate patches.
- [ ] **Helper Utilities**: Add utilities to handle "Format Preservation" which might be lost by native DOM methods.

### Path B: Custom DOM Wrapper (If Option B is selected)
- [x] **Interface Implementation**: Formally implement `Node`, `Element`, `Document`, `CharacterData` interfaces in `src/core/ast/`.
- [x] **Tree Traversal**: Implement performant getters for `childNodes`, `firstChild`, etc., mapping directly to `XMLAPIModel` structure.
- [x] **Query Engine**: Implement `querySelector`, `querySelectorAll` and basic `XPath` support within the custom AST.

## Phase 2: Core Adaptation & Namespace Management

Regardless of the chosen path, the system must handle namespaces and source synchronization robustly.

- [ ] **Namespace Support**:
    - [ ] Implement `namespaceURI`, `prefix`, `localName` support in the AST.
    - [ ] **Unknown Element Handling**: Ensure elements from unknown namespaces are preserved in the source but treated as generic nodes in the AST.
- [ ] **Fidelity Verification**:
    - [ ] Add rigorous tests to ensure round-trip editing (Source -> AST -> Source) changes *only* the intended parts and preserves all other formatting.

## Phase 3: Demonstration Application

Build a dual-pane editor to showcase the capabilities.

- [ ] **Setup Demo Environment**: Create a web-based entry point.
- [ ] **Source Editor**: A text area showing the real-time XML source.
- [ ] **WYSIWYG Editor**: A visual editor manipulating the AST (using the chosen DOM-compatible API).
- [ ] **Integration**:
    - [ ] Implement real-time parsing (Source -> AST).
    - [ ] Implement real-time patching (AST Mutation -> Source).
- [ ] **Scenario Testing**: Demonstrate editing a document with mixed namespaces (known vs. unknown).
