# Requests for @miy2/xml-api

This document collects features, bugs, and architectural requirements identified during the development of `xml-api-editor`.

## Pending Requests

### 1. Developer Experience (DX) & Usage Patterns

#### 1.1 Public Export of Formatter
**Context:**
Applications often need to re-serialize XML fragments (e.g., when converting from a WYSIWYG editor's DOM back to XML source). The `Formatter` class is essential for producing readable XML in these scenarios. Currently, it is not exported from the main entry point, forcing developers to rely on fragile deep imports.

**Current Workaround:**
```typescript
// @ts-ignore
import { Formatter } from '@miy2/xml-api/model/formatter'; // Deep import relying on internal structure
```

**Request:**
Export `Formatter` and its options interface from the main `index.ts` or `xml-api.ts`.

#### 1.2 Clarify Recommended Update Path
**Context:**
`XMLAPI.updateText` is deprecated in favor of the DOM interface. However, directly manipulating the `xml-api` DOM (virtual) requires bridging from the browser's real DOM events. A clear guide or helper method to bridge "Real DOM Event -> xml-api DOM Update" would be beneficial, especially for `contentEditable` scenarios.

---

### 2. Parser & Serialization

#### 2.1 Whitespace & Formatting Awareness
**Context:**
The current `Formatter` implementation aggressively rewrites whitespace based on nesting depth. This often conflicts with `incremental update` logic if the formatting changes the document structure significantly (e.g., adding/removing newlines).

**Issue:**
When `WYSIWYGEditor` updates the source using `Formatter`, it changes the indentation. Subsequent incremental updates from `CodeEditor` (which rely on the new source positions) often fail to sync correctly with the Model, likely due to CST mismatch or parser confusion regarding "formatting whitespace" vs "content whitespace".

**Request:**
Implement a **Format Preserving Parser** mode. The CST/Model should track whether whitespace is "structural/ignored" or "significant". Ideally, re-serializing the model without explicit formatting should preserve the original whitespace exactly.

**Draft Concept:**
```typescript
interface ModelNode {
  formatting?: {
    leadingWs: string; // e.g. "\n  "
    trailingWs: string;
  }
}
```

#### 2.2 Preservation of Non-Element Nodes ("Round-Trip Safety")
**Context:**
When integrating with strict schema-based editors (like ProseMirror), nodes not defined in the editor's schema are often stripped during the conversion to the editor's View. This results in permanent data loss for XML Comments (`<!-- -->`) and CDATA sections when syncing back to `xml-api`.

**Scenario:**
1. Input: `<root><!-- comment --><p>text</p></root>`
2. Editor View (Strict Schema): `<root><p>text</p></root>` (Comment dropped)
3. Sync Back: `xml-api` receives the View's content, effectively deleting the comment.

**Request:**
Provide a mechanism to "park" or protect nodes that are removed from the active DOM projection.
*   **Idea:** A "Shadow DOM" mode where `getDocument()` returns a view, but the underlying Model retains "detached" siblings.
*   **Idea:** A "Reconciliation Strategy" that accepts a partial update (from Editor View) and intelligently merges it with the existing Model, preserving unmatched nodes if possible.

---

### 3. Reliability

#### 3.1 Incremental Update Robustness
**Context:**
A critical instability was observed in `SyncEngine.tryIncrementalUpdate`.

**Failure Scenario:**
1. The `source` is updated via a full replacement (e.g., applying a formatter), changing indentation.
2. A subsequent *small* change is applied via `updateSource(from, to, text)`.
3. The `SyncEngine` attempts incremental update but fails to reflect the change in the Model/CST, leaving the Model stale while the `source` string is updated.

**Request:**
Enhance the robustness of `tryIncrementalUpdate`.
*   **Validation:** After an incremental update, perform a cheap integrity check (e.g., length verification or local re-parse) to ensure the CST matches the new source.
*   **Fallback:** If the incremental update result is dubious or fails, automatically fallback to `fullParse` to ensure consistency.

---

### 4. DOM Interface Enhancements

#### 4.1 Retrieve DOM Wrapper from Model ID
**Context:**
In an editor environment, we often track nodes by their persistent `ModelNode.id`. When handling UI events (like `input`), we need to update the corresponding node via the `xml-api` DOM interface. Currently, there is no easy way to get the `xml-api` DOM Node (wrapper) given a `ModelNode` or its ID without traversing the `Document` tree.

**Request:**
Add a lookup method to the Document interface.
```typescript
const domNode = document.getNodeById(modelId);
// or
const domNode = document.getWrapper(modelNode);
```

---

### 5. Schema & Validation

#### 5.1 Strict Schema Definition Support
**Context:**
`xml-api` currently accepts arbitrary XML. For building specialized editors (like our XHTML5 subset editor), we need to distinguish between "supported/editable" nodes and "unknown/read-only" nodes.

**Request:**
Allow defining a schema or validator that tags nodes as `valid` or `invalid`. This would allow the DOM interface to perhaps expose invalid nodes as generic `UnknownElement` wrappers, preventing the editor from trying to render them as standard components.

---

### 6. Event System Enhancements

#### 6.1 Transaction Metadata (Origin Tracking)
**Context:**
Bi-directional syncing requires preventing infinite loops (Editor A updates Model -> Model updates Editor A -> loop). Currently, we rely on complex local flags (`isUpdatingFromApi`).

**Request:**
Allow passing metadata when updating the model, which is then passed to event listeners.
```typescript
// Update
api.updateSource(..., { origin: 'wysiwyg-editor' });

// Listener
api.on((event) => {
  if (event.meta.origin === 'wysiwyg-editor') return; // Ignore own updates
  // ...
});
```

#### 6.2 Detailed Structure Events
**Context:**
The `structure` event type is too generic. To implement efficient DOM updates (avoiding full re-renders), we need to know *what* changed.

**Request:**
Provide delta information in the event payload, similar to `MutationRecord`.
*   `addedNodes`: List of added ModelNodes.
*   `removedNodes`: List of removed ModelNodes.
*   `previousSibling`: For determining insertion position.

```