# Milestone v0.9.1: Editor-Ready Fidelity & Robustness

**Status:** Draft
**Target Release:** v0.9.1
**Primary Focus:** Addressing critical integration issues identified during the development of `xml-api-editor`.

This milestone focuses on transforming `xml-api` from a core synchronization engine into a production-ready backend for rich text editors (WYSIWYG). Based on the implementation report of `xml-api-editor`, several architectural gaps in robustness, data preservation, and developer experience were identified.

---

## 1. Developer Experience (DX)

### 1.1 Public Export of Formatter

**Context:**
External applications (like editors) need to format XML fragments for serialization, especially when bridging between a DOM view and the XML source. Currently, the `Formatter` class is not exported from the main entry point, forcing developers to rely on unstable deep imports.

**Current Interface:**
```typescript
// Requires deep import (Fragile)
import { Formatter } from '@miy2/xml-api/model/formatter';
```

**Ideal Interface (v0.9.1):**
```typescript
// Standard import
import { XMLAPI, Formatter } from '@miy2/xml-api';

const formatter = new Formatter({ indent: "  " });
```

---

## 2. Robust Incremental Updates

### 2.1 SyncEngine Integrity & Fallback

**Context:**
The `SyncEngine`'s `tryIncrementalUpdate` can fail when the source structure changes significantly (e.g., after applying a formatter that changes all indentation). Currently, this leads to a state where the Model is stale compared to the Source, breaking the editor sync.

**Current Behavior (`src/engine/sync-engine.ts`):**
```typescript
private tryIncrementalUpdate(from, to, delta) {
  // ... logic that assumes CST structure is relatively stable ...
  // If logic fails or is imperfect, it might return a partial update or null
  // but doesn't guarantee integrity against the new source.
}
```

**Ideal Behavior:**
The engine should verify the result of an incremental update. If the CST structure looks suspicious or if the update cannot be cleanly reconciled, it should automatically fall back to a full parse to ensure data consistency.

```typescript
// SyncEngine
public updateSource(from, to, text): void {
  // ...
  const result = this.tryIncrementalUpdate(from, to, text);
  
  // New Integrity Check
  if (!result || !this.verifyIntegrity(result.newNode)) {
    console.warn("Incremental update failed integrity check, falling back to full parse.");
    this.fullParse(); 
  }
}
```

---

## 3. Data Preservation ("Round-Trip Safety")

### 3.1 Ghost Node Strategy

**Context:**
When integrating with strict schema-based editors (like ProseMirror), unsupported nodes (Comments, CDATA) are often stripped from the editor's view. When syncing back to `xml-api`, these nodes are permanently lost.

**Current Behavior:**
Updates via `getDocument()` or direct Model manipulation reflect the exact state of the external view. If the view lacks comments, the comments are removed from the Model.

**Ideal Interface:**
Introduce a mechanism to "park" nodes that are detached from the DOM projection but should remain in the Model.

```typescript
// Proposed Option for getDocument
const doc = api.getDocument({
  // Strategy: Keep comments even if removed from DOM, re-insert them based on siblings
  preservationMode: 'detached-siblings' 
});
```

---

## 4. Format Preserving Parser

### 4.1 Whitespace Awareness

**Context:**
The current `Formatter` generates whitespace based purely on nesting depth. This is destructive to original formatting and can confuse the incremental parser when "formatting whitespace" is indistinguishable from "content whitespace".

**Current Model (`src/model/xml-api-model.ts`):**
```typescript
export abstract class ModelNode {
  // ... no formatting information ...
}
```

**Ideal Model:**
The Model should track significant whitespace (leading/trailing) so that the document can be re-serialized with minimal changes to the original layout.

```typescript
interface ModelNode {
  // ...
  formatting?: {
    leading: string; // e.g. "\n  "
    trailing: string;
  }
}
```

---

## 5. DOM Interface Enhancements

### 5.1 Model-to-DOM Lookup

**Context:**
In editor scenarios, we track nodes by `ModelNode.id`. When handling UI events, we need to map these IDs back to the `xml-api` DOM wrapper nodes to apply changes.

**Current Interface:**
No direct way to get a wrapper node from a model ID without manual tree traversal.

**Ideal Interface:**
```typescript
const domNode = document.getNodeById(modelId);
// or
const domNode = document.getWrapper(modelNode);
```

---

## 6. Event System Enhancements

### 6.1 Transaction Metadata (Origin Tracking)

**Context:**
To prevent infinite loops in bi-directional syncing (Editor -> Model -> Editor), consumers need to identify the origin of a change.

**Current Interface:**
```typescript
api.updateSource(from, to, text); // No metadata
```

**Ideal Interface:**
```typescript
// Pass metadata during update
api.updateSource(from, to, text, { origin: 'wysiwyg-editor' });

// Consume metadata in listener
api.on((event) => {
  if (event.transaction?.meta.origin === 'wysiwyg-editor') return; 
});
```

### 6.2 Detailed Structure Events

**Context:**
The generic `structure` event does not provide enough granularity for efficient UI updates (e.g., differentiating between an attribute change and a node insertion).

**Current Event:**
```typescript
{ type: 'structure', target: ModelElement }
```

**Ideal Event:**
Events should carry delta information similar to `MutationRecord`.

```typescript
{ 
  type: 'structure', 
  target: ModelElement,
  addedNodes: [ ... ],
  removedNodes: [ ... ],
  previousSibling: ...
}
```