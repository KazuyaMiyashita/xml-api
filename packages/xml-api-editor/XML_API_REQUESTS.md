# Requests for @miy2/xml-api

This document collects features, bugs, and architectural requirements identified during the development of `xml-api-editor`.

## Resolved in v0.9.1

### 1. Developer Experience (DX) & Usage Patterns

#### 1.1 Public Export of Formatter
**Resolution:** Rejected.
**Reasoning:** Formatting responsibility is now internal to `SchemaView` (implicit formatting) to ensure format preservation. Consumers should use `SchemaView` instead of manually calling `Formatter`.

#### 1.2 Clarify Recommended Update Path
**Resolution:** Implemented `ViewBinder`.
**Details:** The `ViewBinder` class now handles the reconciliation logic between an external DOM and the internal Model, serving as the standard bridge.

### 2. Parser & Serialization

#### 2.1 Whitespace & Formatting Awareness
**Resolution:** Implemented.
**Details:** The CST and Parser now analyze whitespace. The Model stores `formatting` hints (indentation) and uses them for non-destructive updates.

#### 2.2 Preservation of Non-Element Nodes ("Round-Trip Safety")
**Resolution:** Implemented via Schema Projection.
**Details:** `SchemaView` allows filtering nodes (projecting a subset) while the underlying Model preserves all original nodes ("invisible" nodes like comments are skipped in View but kept in Model).

### 3. Reliability

#### 3.1 Incremental Update Robustness
**Resolution:** Implemented / Verified.
**Details:** Fixed strict incremental parsing issues and verified with `tests/integration/repro-scenario.test.ts`.

### 4. DOM Interface Enhancements

#### 4.1 Retrieve DOM Wrapper from Model ID
**Resolution:** Implemented in SchemaView.
**Details:** `SchemaView.getNodeByModelId(id)` provides this functionality.

### 5. Schema & Validation

#### 5.1 Strict Schema Definition Support
**Resolution:** Implemented via Schema Projection.
**Details:** `createView({ filter: ... })` allows defining a subset of the document that constitutes the "valid" view for the editor.

### 6. Event System Enhancements

#### 6.1 Transaction Metadata (Origin Tracking)
**Resolution:** Implemented.
**Details:** `Transaction` now supports metadata (`tr.setMeta`), and `SchemaView` / `SyncEngine` events propagate this metadata. `SchemaView` automatically adds `{ origin: 'schema-view' }` to its changes.

#### 6.2 Detailed Structure Events
**Resolution:** Implemented in SchemaView.
**Details:** `SchemaView` emits detailed events including attribute changes and specific node targets.

---

## Pending Requests

(None at this time)
