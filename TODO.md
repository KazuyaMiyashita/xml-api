# Roadmap

This document outlines the implementation plan for the three-layer architecture and bidirectional synchronization.

## Phase 1: Project Restructuring & Sandbox Isolation
Establish a structure that separates the stable core from experimental changes to enable safe large-scale refactoring.

- [x] Step 1: Create Core Structure
    - Create `src/core/` and its subdirectories: `cst/`, `model/`, `ast/`.
    - Move stable code into `src/core/`:
        - `src/cst/`: `xml-cst.ts`, `parser.ts`, `grammar.ts`, `xml-grammar.ts`
        - `src/model/`: `xml-converter.ts` (rename to `xml-binder.ts`), `formatter.ts`
        - `src/ast/`: `xml-ast.ts`
        - `src/core/`: `xml-api.ts` (update imports)
    - Update `src/main.ts` to import from `src/core/`.
- [x] Step 2: Isolate Experiments
    - Create `src/experiments/`.
    - Move `minimum-*.ts` files to `src/experiments/`.
    - Crucial Ensure experimental files import *relative* paths or copied modules, so they don't break when core changes.
- [x] Step 3: Configure Testing Strategy
    - Update `jest.config.ts` (or create separate configs) to support split execution.
    - Add scripts to `package.json`:
        - `"test"`: Runs tests in `src/core/` (Must always pass).
        - `"test:wip"`: Runs tests in `src/experiments/`.
        - `"test:all"`: Runs all tests.
- [x] Step 4: Verification
    - Ensure `pnpm test` passes for the relocated core files.
    - Ensure `pnpm test:wip` passes for the experimental files.

## Phase 2: Logical Layer Foundation
Implement the XMLAPIModel and its controlling components, XMLBinder and XMLSchema.

- [x] XMLSchema Definition:
    - Implement src/core/model/xml-schema.ts.
    - Define classes for validating element structure and attributes.
- [x] XMLAPIModel Implementation:
    - Implement src/core/model/xml-api-model.ts.
    - Define data structures for nodes and elements.
    - Implement storage for persistent identifiers and formatting information.
- [x] XMLBinder Implementation:
    - Implement src/core/model/xml-binder.ts.
    - Implement hydration logic to build the model from the CST.
    - Implement projection logic to generate the AST from the model.
- [x] Mediator Integration:
    - Update XMLAPI to orchestrate the flow from CST to Model to AST using the Binder.

## Phase 3: Operational API
Implement functionality to convert operations from the application into minimal source code patches.

- [x] Patch Generation Logic:
    - [x] Implement logic in XMLBinder for setAttribute (attribute update/insertion).
    - [x] Implement logic for text updates.
    - [x] Implement logic for node replacement.
- [x] Operation API:
    - [x] Implement setAttribute in XMLAPI.
    - [x] Implement updateText in XMLAPI.
    - [x] Implement replaceNode in XMLAPI.
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
