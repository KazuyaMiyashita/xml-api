# TODO List (v0.9.1 Milestone)

## Work & Commit Rules

1. **Strategy Verification**:
   * Before starting any work, compare the current codebase with this TODO list to verify that the strategy remains valid and no technical contradictions have arisen.
   * If necessary, update this document before commencing the task.

2. **Commit Granularity**:
   * Create a separate commit for each checkbox (task) item.
   * Ensure no pending items remain; if any work is left unfinished, add a note to the corresponding TODO.

3. **Quality Checks**:
   * Before every commit, always perform the following to ensure quality:
     * `pnpm test` (Verify all tests pass)
     * `pnpm docs:gen-api` (Update API documentation)
     * `pnpm format` (Apply code formatting)

---

## Phase 1: Foundation - Format Preservation (CST & Model)

**Goal:** Enhance the Model layer to capture and store formatting information (whitespace, indentation) from the CST, enabling "Implicit Formatting" without a rigid formatter.

* [x] **[CST Whitespace Analysis Utils]**:
    * **Goal**: Provide utilities to analyze CST nodes and extract "structural whitespace" (indentation) vs "content whitespace".
    * **Task**:
        * Implement `detectIndent(cstNode)` in `xml-cst.ts` or a new `format-utils.ts`.
        * Ensure it can distinguish between a node's own indentation and the indentation of its children.

* [x] **[Model Formatting Hints]**:
    * **Goal**: Store formatting context in the Model during hydration.
    * **Task**:
        * Update `ModelNode` (or `ModelElement`) to include a `formatting` property (e.g., `{ indent: string, trailingNewline: boolean }`).
        * Update `XMLBinder.hydrate` to extract this info from CST and populate the Model.
        * **Verification**: Unit tests ensuring formatting hints are correctly captured for various XML structures.

* [x] **[Fidelity Test Suite]**:
    * **Goal**: Establish a baseline for format preservation.
    * **Task**:
        * Create `tests/fidelity.test.ts`.
        * Add test cases that parse complex formatted XML, regenerate it (no-op), and assert bitwise identity.
        * Add test cases for "read-modify-write" where untouched areas MUST remain bitwise identical.

## Phase 2: Core Architecture - SchemaView & Projection

**Goal**: Implement the `SchemaView` that projects the generic Model into a domain-specific view (e.g., XHTML subset), filtering out irrelevant nodes.

* [x] **[SchemaView Interface & Class]**:
    * **Goal**: Define the public API for SchemaView.
    * **Task**:
        * Create `src/view/schema-view.ts`.
        * Implement `class SchemaView`.
        * Constructor: `new SchemaView(model, config: { filter: (node) => boolean })`.
        * Internal state: Maintain a mapping or a projection tree that represents the filtered view.

* [x] **[Projection Logic]**:
    * **Goal**: Build the projected view from the Model.
    * **Task**:
        * Implement `rebuild()` or similar logic to traverse the Model and construct the View nodes.
        * Ensure "invisible" nodes (comments, filtered tags) are skipped in the View but accessible via mapping if needed.

* [x] **[Node Mapping Utilities]**:
    * **Goal**: Bridge between View nodes and Model nodes.
    * **Task**:
        * Implement `view.getModelNode(viewNode): ModelNode`.
        * Implement `view.getViewNode(modelNode): ViewNode | null`.
        * **Verification**: Tests ensuring 1:1 mapping (where applicable) and handling of filtered nodes.

## Phase 3: Write-Back & Reconciliation

**Goal**: Enable editing the `SchemaView` with changes automatically propagating to the Model (and Source) while preserving "invisible" nodes and formatting.

* [x] **[Format-Preserving Insertion Logic]**:
    * **Goal**: Insert nodes using context-aware formatting instead of default formatter.
    * **Task**:
        * Implement `calcSmartInsertPatch` (or similar) that looks at the Model siblings of the insertion point.
        * If inserting into a list of indented items, copy the indentation of the previous sibling.
        * **Constraint**: Do not use the legacy `Formatter` class for these operations.

* [x] **[SchemaView Write Operations]**:
    * **Goal**: Implement DOM-like mutation methods on SchemaView.
    * **Task**:
        * `view.insertNode(parent, node, index)` -> Delegates to `engine.insertNode` but calculates index adjustment (accounting for invisible nodes).
        * `view.removeNode(node)` -> Delegates to `engine.removeNode`.
        * `view.setAttribute(...)` -> Delegates to `engine.setAttribute`.

* [x] **[Invisible Node Preservation]**:
    * **Goal**: Ensure filtered nodes are not lost during View updates.
    * **Task**:
        * When inserting/moving in View, map the index back to the specific Model index, skipping over invisible nodes.
        * **Verification**: Test scenario: XHTML View. Source: `<div><!-- comment --><p>Text</p></div>`. Insert `<h1>` before `<p>`. Ensure `<!-- comment -->` remains and `<h1>` is inserted after it (or before, depending on policy).

## Phase 4: Multi-Level Event System

**Goal**: Provide a clean event stream for the View, free from noise (formatting changes, irrelevant nodes).

* [x] **[Transaction Metadata]**:
    * **Goal**: Track the origin of changes.
    * **Task**:
        * Update `Transaction` class to accept `metadata: Record<string, any>`.
        * Update `SyncEngine.dispatch` to pass this metadata through to events.
        * Allows `xml-api-editor` to ignore its own "echo" events.

* [x] **[SchemaView Event Emitter]**:
    * **Goal**: Emit events scoped to the View.
    * **Task**:
        * Implement `SchemaView.on('change', ...)`
        * Listen to `SyncEngine` events.
        * Filter: If a Model node changes but isn't in the View (or is filtered out), do not emit.
        * Transform: Event target should be the ViewNode, not ModelNode.
        * Payload: detailed mutation record (addedNodes, removedNodes).

## Phase 5: Refactoring for 3-Layer Architecture

**Goal**: 
    - Standardize code quality tools and remove legacy API surface. 
    - Align the codebase with the "Triple-Layer Reconciliation" architecture (Source-CST, CST-Model, Model-View) by unifying reconciliation patterns and clarifying responsibilities.

* [x] **[Linting] Establish Static Analysis**
    * Add a `lint` script to `package.json` using Biome.
    * Run `pnpm lint` across the workspace to identify and fix code smell or logic inconsistencies.

* [x] **[Formatting] Global Code Style Unification**
    * Execute `pnpm format` across the entire workspace to ensure consistent styling (indentation, quotes, etc.).
    * Ensure the formatting baseline is established before proceeding with heavy refactoring.

* [x] **[Deprecation] Legacy API Removal**
    * Identify and remove all methods marked as `@deprecated` in `XMLAPI` and other core classes.
    * **Targets**: `updateInput`, `input`, and legacy `setAttribute`/`updateText` shortcuts.
    * Ensure all call sites have been migrated to the new 3-layer reconciliation patterns.

* [x] **[Model Refactoring: Formatting Trivia]**:
    * **Goal**: Explicitly distinguish between "content" and "formatting" in the Model layer.
    * **Task**:
        * Introduce `ModelTrivia` or update `ModelText` to support a `kind` property (e.g., `'text' | 'whitespace' | 'indent'`).
        * Update `XMLBinder.hydrate` to classify text nodes based on CST analysis.
        * **Benefit**: Sets the foundation for "safe to ignore" whitespace in the View layer.

* [x] **[ViewBinder Extraction]**:
    * **Goal**: Centralize View-to-Model reconciliation logic.
    * **Task**:
        * Create `src/view/view-binder.ts`.
        * Move the manual reconciliation logic (currently in `WYSIWYGEditor`) into `ViewBinder`.
        * Define a generic `Reconciler` interface (conceptually) that `ViewBinder` adheres to.

* [x] **[SyncEngine Cleanup: Extract Logic]**:
    * **Goal**: Decouple formatting and patch calculation from `SyncEngine`.
    * **Task**:
        * Create `src/engine/transaction-builder.ts`.
        * Move the indentation detection and `Formatter` logic (currently in `SyncEngine.insertNode` and `replaceNode`) into this builder.
        * Ensure it uses `XMLBinder` for the low-level patch generation.

* [x] **[SyncEngine Cleanup: Refactor Mutations]**:
    * **Goal**: Make `SyncEngine` methods thin wrappers around `dispatch`.
    * **Task**:
        * Refactor `setAttribute`, `updateText`, `insertNode`, `replaceNode`, `removeNode` to use `TransactionBuilder` to create a `Transaction`.
        * Call `this.dispatch(tr)` directly.

* [x] **[SyncEngine Cleanup: Deprecation]**:
    * **Goal**: Signal the shift towards a Transaction-based API.
    * **Task**:
        * Add `@deprecated` annotations to the direct mutation methods in `SyncEngine`.
        * Document the new pattern: `engine.dispatch(TransactionBuilder.insertNode(...))`.

## Phase 6: Functional Completeness for xml-api-editor

**Goal**: Implement the missing features identified in the `xml-api-editor` investigation to enable full format preservation and robust syncing.

* [x] **[SchemaView Reconciliation]**:
    * **Goal**: Provide a built-in method to sync an external DOM tree to the SchemaView.
    * **Task**:
        * Implement `SchemaView.reconcile(externalDomNode: Node)`.
        * Utilize `ViewBinder` internally to calculate diffs and apply changes to the Model via `SyncEngine`.
        * **Crucial**: Ensure this process is non-destructive to "invisible" nodes and "formatting trivia".

* [x] **[Whitespace Preservation Logic]**:
    * **Goal**: Prevent the loss of formatting whitespace during View sync.
    * **Task**:
        * In `ViewBinder` (or `reconcile` logic), implement a check: "If Model has a whitespace/indent node but External DOM has nothing, PRESERVE the Model node."
        * Do not treat the absence of whitespace in the editor's DOM as a deletion instruction.

* [x] **[Transaction Metadata & Origin Filtering]**:
    * **Goal**: Prevent infinite loops and unnecessary processing during sync.
    * **Task**:
        * Wrap the initial hydration and `SchemaView` initialization in a `Transaction` with `{ initial: true }` metadata.
        * Update `SyncEngine` and Event Emitters to respect this metadata, allowing the editor to ignore its own reflected changes.
        * **Fix**: Ensure the "Event Log" remains empty during the first render in `xml-api-editor`.

## Phase 7: Integration & Verification

**Goal**: Publicly expose the new capabilities and ensure end-to-end stability.

* [x] **[Public API Exposure]**:
    * **Goal**: Make SchemaView accessible via the main entry point.
    * **Task**:
        * Add `createView(config)` method to `XMLAPI` class (delegating to `SyncEngine`).
        * Export `SchemaView`, `ViewBinder`, and `ExternalNode` types from the package index.

* [x] **[Reproduction Scenario Verification]**:
    * **Goal**: Verify the "Manual Sync Fragility" fix.
    * **Task**:
        * Implement the scenario from `MILESTONE_v0.9.1.md` as an integration test.
        * Ensure no "Sync Broken" errors occur.

* [x] **[Documentation Update]**:
    * **Goal**: Guide users on using SchemaView.
    * **Task**:
        * Update `README.md` and `docs/` to explain `createView` and the architecture.

## Phase 8: Final Verification - Original Issue Resolution

**Goal**: Confirm that the core issues reported in `xml-api-editor` are fully resolved by the new architecture.

* [x] **[End-to-End Format Fidelity Check]**:
    * **Requirement**: Loading `sample_01.xml` in `xml-api-editor` must result in a source code view that is bitwise identical to the original file.
    * **Check**: No newlines removed under `body`, no indentation changes.

* [x] **[Internal Class Name Removal]**:
    * **Requirement**: The `wysiwyg-section` class must not appear in the final XML output.
    * **Check**: The editor should use pure `section` tags in the model.

* [x] **[Zero-Change Initial Load]**:
    * **Requirement**: Upon application startup, the "Event Log" must remain empty.
    * **Check**: No "Structure changed" events for Elements or Text should be emitted during initial hydration and view projection.

* [x] **[Granular Update Verification]**:
    * **Requirement**: Small edits in either the Code Editor or WYSIWYG Editor should only produce events corresponding to the specific nodes modified.
    * **Check**: No "Full update" or unrelated "Structure changed" events during minor text edits.

