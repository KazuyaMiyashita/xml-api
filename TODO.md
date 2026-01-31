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

- [x] Reconciliation Logic:
    - [x] Implement logic in XMLBinder to compare CST trees and update the model while preserving identity.
- [x] Event System:
    - [x] Implement an event emitter in XMLAPI.
    - [x] Dispatch events based on the type of change.

## Phase 5: Robustness
Ensure system stability and data integrity.

- [x] Transaction Management:
    - [x] Implement history management for undo and redo operations.
- [x] Error Recovery:
    - [x] Implement safeguards against invalid XML generation. (Handled via wellFormed checks and AST invalidation, plus Undo capability)

## Phase 6: Refinement & Integration
Improve developer experience and ensure comprehensive integration testing.

- [x] Phase 6-1: Enhanced `replaceNode` API
    - Extend `XMLAPI.replaceNode` to accept `AST` object directly.
    - Move `src/core/integration.test.ts` to `src/integration.test.ts`.
    - Update `src/integration.test.ts` to include the scenario from `main.ts` (using `AST` construction).
- [x] Phase 6-2: API Migration
    - [x] Update all usages of `replaceNode` to pass `AST` objects.
    - [x] Remove the string-based overload of `replaceNode` (or deprecate it/make it internal if strictly needed, but goal is removal).

## Phase 7: Advanced Formatting
Ensure the Formatter can perfectly reconstruct the source and support customization.

- [x] Phase 7-1: Fidelity & Default Configuration
    - [x] Ensure `Formatter` with default settings produces output identical to `sample_01.xml` when re-serializing the parsed AST.
- [x] Phase 7-2: Formatting Options
    - [x] Implement support for changing indentation (tab vs space, width).
    - [x] Implement support for newline style.

## Phase 11: Extended Feature Support
Add support for editing less common XML constructs.

- [ ] CDATA/Comment Support:
    - Add explicit API methods for creating/updating CDATA sections and Comments via `XMLAPI`.

## Completed Tasks
- [x] Context-Aware Formatting: Automatic indentation detection and preservation.
- [x] Key-based Reconciliation: ID-based matching and heuristic list reconciliation.
- [x] Escape logic for Text Updates and Attribute Updates.
- [x] Performance Optimization: Delayed coordinate update and atomic transactions.
- [x] Architecture Evolution: Prototype of the Enhanced AST.
- [x] Parser Core: Functional parser and XML grammar.
- [x] Formatter: Indentation-aware XML output.
- [x] Phase 1: Project Restructuring
- [x] Phase 2: Logical Layer Foundation
- [x] Phase 3: Operational API
- [x] Phase 4: Reconciliation and Reactivity
- [x] Phase 5: Robustness
- [x] Phase 6: Refinement & Integration
- [x] Phase 7: Advanced Formatting