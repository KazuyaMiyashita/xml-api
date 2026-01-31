# Roadmap

This document outlines the implementation plan for the three-layer architecture and bidirectional synchronization.

## Phase 1: Project Restructuring
Reorganize the existing codebase into the target directory structure and establish the foundation for the new architecture.

- [ ] Directory Organization:
    - Create src/cst/, src/model/, and src/ast/.
    - Move existing files to their respective layers.
    - Update import paths and ensure tests pass.
- [ ] XMLAPI Refactoring:
    - Move XMLAPI class to src/xml-api.ts.
    - Isolate internal logic to prepare for the Mediator pattern.

## Phase 2: Logical Layer Foundation
Implement the XMLAPIModel and its controlling components, XMLBinder and XMLSchema.

- [ ] XMLSchema Definition:
    - Implement src/model/xml-schema.ts.
    - Define classes for validating element structure and attributes.
- [ ] XMLAPIModel Implementation:
    - Implement src/model/xml-api-model.ts.
    - Define data structures for nodes and elements.
    - Implement storage for persistent identifiers and formatting information.
- [ ] XMLBinder Implementation:
    - Implement src/model/xml-binder.ts.
    - Implement hydration logic to build the model from the CST.
    - Implement projection logic to generate the AST from the model.
- [ ] Mediator Integration:
    - Update XMLAPI to orchestrate the flow from CST to Model to AST using the Binder.

## Phase 3: Operational API
Implement functionality to convert operations from the application into minimal source code patches.

- [ ] Patch Generation Logic:
    - Implement logic in XMLBinder to calculate text replacements that respect existing formatting.
- [ ] Operation API:
    - Implement methods such as setAttribute, updateText, and replaceNode in XMLAPI.
    - Invoke the Binder to generate patches and apply them to the input source.

## Phase 4: Reconciliation and Reactivity
Implement the mechanism to reflect source code changes in the model and notify the application.

- [ ] Reconciliation Logic:
    - Implement logic in XMLBinder to compare CST trees and update the model while preserving identity.
- [ ] Event System:
    - Implement an event emitter in XMLAPI.
    - Dispatch events based on the type of change.

## Phase 5: Robustness
Ensure system stability and data integrity.

- [ ] Transaction Management:
    - Implement history management for undo and redo operations.
- [ ] Error Recovery:
    - Implement safeguards against invalid XML generation.

## Completed Tasks
- [x] Performance Optimization: Delayed coordinate update and atomic transactions.
- [x] Architecture Evolution: Prototype of the Enhanced AST.
- [x] Parser Core: Functional parser and XML grammar.
- [x] Formatter: Indentation-aware XML output.
