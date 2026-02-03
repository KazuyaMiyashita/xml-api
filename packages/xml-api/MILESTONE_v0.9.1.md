# Milestone v0.9.1: Triple-Layer Reconciliation Architecture

**Status:** Finalized
**Target Release:** v0.9.1
**Primary Focus:** Stabilizing the core SyncEngine and introducing the "Schema Projection" layer to support domain-specific editors (XHTML, MEI).

---

## 1. Schema Projection Layer (New Architecture)

**Context:**
Applications like `xml-api-editor` need to work with a **strict subset** of XML (e.g., XHTML5) while maintaining the integrity of the original source. To achieve this robustness, we are formalizing the system architecture into a **Three-Level Reconciliation Pipeline**. This ensures that data flows reliably between the raw text and the application view, maintaining full fidelity at every stage.

**The Problem: Manual Sync Fragility**
The `xml-api-editor` reported a critical failure when attempting to format the document manually. This highlights the dangers of externalizing formatting responsibility.

> **Failure Scenario (Reproduction):**
> ```typescript
> const api = new XMLAPI(`<body><h1>Title</h1></body>`); // Dense XML
> // 1. Reformat the document (Full replacement via updateSource)
> api.updateSource(0, api.source.length, `<body>\n  <h1>Title</h1>\n</body>`);
> // 2. Perform a small edit (Incremental update)
> const start = api.source.indexOf("Title") + 5;
> api.updateSource(start, start, " Edited");
> // Result: Sync Broken (Model Stale)
> ```

### 1.1 Architecture Overview: The Reconciliation Pipeline

The system will maintain three synchronized representations of the document, each with its own reconciliation logic:

1.  **CST Level Reconciliation (Source <-> CST):**
    *   **Input:** Text changes (Diffs).
    *   **Responsibility:** Incremental Parsing. Updates the Concrete Syntax Tree to reflect physical text changes while preserving syntax validity.
2.  **Model Level Reconciliation (CST <-> Model):**
    *   **Input:** CST changes.
    *   **Responsibility:** Logical binding and **Identity Preservation**. Updates the persistent Model objects to match the new CST, ensuring that Model IDs remain stable across updates.
3.  **SchemaView Level Reconciliation (Model <-> SchemaView):**
    *   **Input:** Model changes.
    *   **Responsibility:** Projection and Filtering. Updates the SchemaView (the DOM-like interface exposed to the app) to match the Model, applying schema rules (e.g., hiding comments). It emits high-level **View Events** only for nodes relevant to the schema.

**Data Flow:**
*   **Update:** Source Change -> CST Reconcile -> Model Reconcile -> SchemaView Reconcile -> View Event.
*   **Edit:** SchemaView Operation -> Model Patch (Format Preserving) -> Source Update -> (Loop start).

### 1.2 The `SchemaView` Interface
**Goal:**
Provide a "view" of the model that adheres to a specific schema, handling the complexity of mapping back to the full fidelity model.

```typescript
// Conceptual Usage
const xhtmlView = api.createView({
  schema: 'xhtml-subset',
  // Rules for what this view "sees"
  filter: (node) => ['h1', 'p', 'section'].includes(node.tagName),
  // Rules for how this view's edits are formatted back to source
  formatting: { indent: '  ' }
});

// The view's root only contains nodes matching the schema.
// Comments and unsupported tags are HIDDEN from this tree but PRESERVED in the underlying Model.
const root = xhtmlView.getRoot(); 
```

- **Task:** Implement `SchemaView` class.
- **Task:** Implement **Non-Destructive Write-Back**.
    - When `xhtmlView` is modified (e.g., nodes added/removed), the changes are applied to the underlying Model.
    - **Crucial:** "Invisible" nodes (comments, MEI tags mixed in XHTML) adjacent to modified nodes must be preserved, not overwritten.
- **Task:** Implement **Node Mapping Utilities**.
    - Provide methods like `view.getNodeByModelId(id)` and `view.getModelNode(viewNode)`.
    - This allows applications to bridge between persistent Model IDs (used for selection/history) and ephemeral View nodes (used for DOM APIs) without polluting the standard `Document` interface.

### 1.3 Format Preserving Infrastructure
**Problem:**
Currently, `xml-api` loses the distinction between "structural whitespace" and "user whitespace", making non-destructive updates impossible without re-formatting.

- **Task:** Update `Parser` / `CST` to categorize whitespace (e.g., distinguishing indentation from content).
- **Task:** Update `XMLBinder` to store "formatting hints" (leading/trailing whitespace) in the Model (or a parallel metadata layer), so that re-serializing a node without changes results in a bitwise-identical string.

### 1.4 Implicit Formatting via Format Preservation
**Goal:**
The application should never need to import or call the `Formatter` class. Formatting should be a native, non-destructive capability of the `SchemaView` that respects the document's original style.

- **Task:** Implement **Format-Preserving Write-Back** in `SchemaView`.
    - Instead of re-indenting the document using a depth-based `Formatter`, the `SchemaView` utilizes "formatting hints" (captured during parsing, see Section 1.3) to apply updates.
    - When new nodes are inserted, the view infers the appropriate indentation from siblings or parent context, ensuring that automated edits blend seamlessly into the existing source without destroying user-defined formatting elsewhere.

---

## 2. Multi-Level Event System

### 2.1 SchemaView-Scoped Events (High-Level)
**Problem:**
Applications (like WYSIWYG editors) need to react only to changes that affect their specific schema projection. Currently, they receive raw model events that include noise from formatting whitespace, comments, or internal reconciliation nodes, making synchronization complex and error-prone.

**Solution:**
Instead of a single global event stream, the event system will be partitioned based on the user's level of interest.

- **Task: Instance-based Subscription**:
    - Implement `SchemaView.on('change', handler)`: The `SchemaView` instance acts as an independent event emitter.
    - It only emits changes for nodes that pass the view's filter.
- **Task: Projected Mutation Records**:
    - Emit events using a payload compatible with `MutationObserver` (e.g., `addedNodes`, `removedNodes`, `attributeName`).
    - The `target` in these events will be the projected node, ensuring the application can apply updates directly to its UI state without manual filtering.

### 2.2 Transaction Metadata & Origin Tracking
**Problem:**
Bi-directional syncing requires a reliable way to differentiate between local user edits (which should not be reflected back to the same editor) and external updates (which must be).

**Solution:**
- **Task: Enhanced Transaction Metadata**:
    - Update `Transaction` to carry arbitrary metadata (e.g., `{ origin: 'wysiwyg-adapter', isRemote: true }`).
- **Task: Metadata Propagation**:
    - Ensure this metadata is preserved throughout the `SyncEngine` pipeline and included in all event types (both raw Model events and high-level SchemaView events), enabling consumers to implement clean "ignore-self" logic.

---

## 3. Deprecated / Rejected Ideas

*   **Public Export of Formatter:** Rejected. Formatting should be handled implicitly by the `SchemaView` or `SyncEngine`, not manually orchestrated by the consumer.
*   **Ghost Node Mode in Generic Document:** Rejected. The requirement for preserving invisible nodes is now handled architecturally by the **Schema Projection Layer (Section 1)**. The generic DOM should always reflect the exact source, while the `SchemaView` handles filtering and preservation of underlying model data.

---

## 4. Deferred / Future Considerations

### 4.1 Robust SyncEngine Fallback Strategy
**Issue:** The `SyncEngine` can fail to synchronize correctly after massive structural changes (e.g., full document replacement via `updateSource`).
**Decision:** We are prioritizing the implementation of **Schema Projection (Section 1)** in v0.9.1. Schema Projection should eliminate the need for such manual full-replacements by handling formatting and updates granularly. If synchronization issues persist even with Schema Projection, we will revisit the hardening of the `SyncEngine`'s fallback logic.
