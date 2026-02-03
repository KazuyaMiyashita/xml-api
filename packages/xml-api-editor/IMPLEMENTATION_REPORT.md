# XML API Editor Implementation Report

**Date:** 2026-02-02
**Project:** xml-api-editor (Validation for @miy2/xml-api)

## 1. Overview
The `xml-api-editor` project was developed to validate the capabilities of the `@miy2/xml-api` library, specifically focusing on bi-directional synchronization between a source code view and a DOM-like (WYSIWYG) view. The project successfully implemented a split-pane editor using React, CodeMirror, and ProseMirror, integrated via `xml-api`.

---

## 2. Architecture & Key Features

### 2.1 Core Components

#### 2.1.1 Library Integration
**Implementation:**
The editor integrates `@miy2/xml-api` directly from the local filesystem to enable rapid iteration ("dogfooding"). This is configured in `package.json` using the `file:` protocol, allowing the editor to reflect library changes immediately after they are built.

**Code Reference (`package.json`):**
```json
"dependencies": {
  "@miy2/xml-api": "file:~/Program/xml-api",
  // ...
}
```

#### 2.1.2 Code Editor Implementation
**Implementation:**
We utilize `CodeMirror 6` in "Raw mode" (without XML language support) to act as a pure text interface. The editor logic subscribes to `xml-api` changes to update its content, and pushes user changes back to `xml-api` incrementally.

**Code Reference (`src/components/CodeEditor.tsx`):**
We use `EditorView.updateListener` to capture precise change ranges (`fromA`, `toA`) and textual inserts, passing them directly to `api.updateSource`. This bypasses full re-parsing when possible.

```typescript
EditorView.updateListener.of((update) => {
  if (update.docChanged && !isUpdatingFromApi.current) {
    update.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
      const text = inserted.toString();
      try {
        // Pushing incremental updates to the library
        api.updateSource(fromA, toA, text);
      } catch (e) {
        console.error("Incremental update failed:", e);
      }
    });
  }
})
```

#### 2.1.3 WYSIWYG Editor Implementation
**Implementation:**
The WYSIWYG editor uses `ProseMirror`. Unlike typical ProseMirror implementations that treat the DOM as the source of truth, here `xml-api` is the Model, and ProseMirror is strictly the View. We implemented a custom `modelToDOM` converter to transform the `xml-api` logical model (AST) into a DOM fragment that ProseMirror can parse.

**Code Reference (`src/components/WYSIWYGEditor.tsx`):**
The `modelToDOM` function recursively maps `ModelElement` to standard DOM nodes (`HTMLElement`), which are then parsed by `PMDOMParser`.

```typescript
const modelToDOM = useMemo(() => {
  const convert = (node: ModelNode): Node | null => {
    if (node.getType() === ModelNodeType.Element) {
      const el = node as ModelElement;
      const dom = document.createElement(el.tagName);
      // ... mapping attributes and children ...
      return dom;
    }
    // ...
  };
  return convert;
}, []);
```

---

## 2.2 Synchronization Strategy

#### 2.2.1 WYSIWYG to Code Sync
**Implementation:**
When a user edits in ProseMirror, we serialize the document back to XML. To ensure the generated XML is readable, we utilize the `Formatter` class from `xml-api` before updating the source. This addresses the issue where `DOMSerializer` produces "dense" XML (no whitespace).

**Code Reference (`src/components/WYSIWYGEditor.tsx`):**
We intercept the serialization process in `pmToXml`, format the content, and inject it back into the `body` tag of the source string.

```typescript
const pmToXml = (pmDoc: PMNode): string => {
  // 1. Serialize ProseMirror doc to dense HTML string
  const fragment = serializer.serializeFragment(pmDoc.content);
  const div = document.createElement("div");
  div.appendChild(fragment);

  // 2. Use XMLAPI Formatter to prettify the dense HTML
  const tempApi = new XMLAPI(`<body>${div.innerHTML}</body>`);
  const formatter = new Formatter({ indent: "  " });
  const formattedBody = formatter.format(tempApi.model);

  // 3. Splice formatted body back into original source
  // ... (regex matching logic) ...
};
```

#### 2.2.2 Code to WYSIWYG Sync
**Implementation:**
Updates from the Code Editor trigger events in `xml-api`. The WYSIWYG editor listens for these events (`text`, `structure`, `attribute`) and performs a "hard sync" by re-parsing the model into a new ProseMirror state. We use a flag `isUpdatingFromApi` to prevent infinite loops where the update triggers a new transaction.

**Code Reference (`src/components/WYSIWYGEditor.tsx`):**
```typescript
api.on((_event: ChangeEvent) => {
  if (viewRef.current && !isUpdatingFromApi.current && api.model) {
    isUpdatingFromApi.current = true;
    const tempDom = modelToDOM(api.model);
    const newPmDoc = PMDOMParser.fromSchema(xhtmlSubsetSchema).parse(tempDom as any);
    
    // Only dispatch if content actually changed to minimize cursor jumping
    if (!newPmDoc.eq(viewRef.current.state.doc)) {
      const tr = viewRef.current.state.tr.replaceWith(0, ..., newPmDoc);
      viewRef.current.dispatch(tr);
    }
    isUpdatingFromApi.current = false;
  }
});
```

---

## 2.3 Challenges & Prototypes

#### 2.3.1 Challenge #1: Document Type Detection
**Implementation:**
We needed a way to determine if a loaded XML file was XHTML or something else (like MEI). We implemented a detector that inspects the root tag name and `xmlns` attribute.

**Code Reference (`src/utils/xml-detector.ts`):**
```typescript
export function detectDocumentType(api: XMLAPI): DocumentInfo {
  const model = api.model;
  // ...
  if (rootTag === 'mei' || (namespace && namespace.includes('music-encoding.org'))) {
    return { type: DocumentType.MEI, rootTag, namespace };
  }
  // ...
}
```

#### 2.3.2 Challenge #3: Namespace-based Editor Switching
**Implementation:**
We explored how to handle mixed-namespace documents. Due to stability issues with extending the ProseMirror schema dynamically, we prototyped a "Switcher Strategy". The application detects the document type and swaps the entire editor component (`WYSIWYGEditor` vs `MeiEditor`).

**Code Reference (`src/App.tsx`):**
```typescript
{docTypeInfo.type === DocumentType.MEI ? (
  <MeiEditor api={api} />
) : (
  <WYSIWYGEditor api={api} onExternalChange={handleVersionUpdate} />
)}
```

---

## 3. Validation Results & Limitations

### 3.1 Successes

#### 3.1.1 Schema Strictness
**Result:**
We successfully enforced a strict XHTML5 subset (`section`, `h1`-`h6`, `p`). Unsupported elements (like `<ul>`, `<li>`) injected via the Code Editor are automatically filtered out or unwrapped by the ProseMirror parser in the WYSIWYG view. This proves `xml-api` can serve as a flexible backend for a strict frontend editor.

**Verification (`tests/schema_strictness.spec.ts`):**
The test injects `<ul><li>Item</li></ul>` and asserts that `locator('ul')` is hidden in the WYSIWYG view.

### 3.2 Known Limitations (Library Issues)

#### 3.2.1 Limitation: Incremental Update Instability
**Issue Description:**
A critical instability was observed in `xml-api`'s `SyncEngine`. When the `WYSIWYGEditor` updates the source (replacing the entire `<body>` content with formatted XML), subsequent small edits in the `CodeEditor` (triggering `api.updateSource` incrementally) fail to reflect in the Model.

**Reproduction Scenario:**
1.  **Initial:** `<body><h1>Title</h1></body>` (Dense)
2.  **Formatter Action:** Replaces source with:
    ```xml
    <body>
      <h1>Title</h1>
    </body>
    ```
    (Note the new indentation).
3.  **Code Editor Action:** User types " Edited" into `<h1>`.
    `api.updateSource(start, end, " Edited")` is called.
4.  **Result:** The Model does *not* update to `<h1>Title Edited</h1>`. It remains stuck.
5.  **Hypothesis:** The `tryIncrementalUpdate` logic in `SyncEngine` fails to correctly locate the node (`findNodeAt`) or parse context (`parseAt`) after the indentation/structure has shifted significantly.

#### 3.2.2 Limitation: Loss of Non-Element Nodes
**Issue Description:**
When data "round-trips" through ProseMirror, nodes that are not defined in the ProseMirror schema are lost. This includes XML Comments (`<!-- -->`) and CDATA sections.

**Example:**
*   **Input:**
    ```xml
    <section>
      <!-- Important Note -->
      <p>Content</p>
    </section>
    ```
*   **Process:** `xml-api` -> `modelToDOM` -> `ProseMirror` (Schema ignores comments) -> `pmToXml`
*   **Output:**
    ```xml
    <section>
      <p>Content</p>
    </section>
    ```
*   **Impact:** This data loss is unacceptable for a general-purpose XML editor. The library needs a way to protect these nodes.

---

## 4. Recommendations

### 4.1 For @miy2/xml-api Library

#### 4.1.1 Proposal: Robust Incremental Updates
**Context:**
The current fragility of `tryIncrementalUpdate` breaks the bi-directional sync contract.

**Recommendation:**
Enhance `SyncEngine` to detect when an incremental update fails to reconcile or when the CST structure is likely "dirty" (e.g., after a full-text replacement). It should automatically fallback to `fullParse` more aggressively or re-index the CST.

**Draft Idea (Library Logic):**
```typescript
// In SyncEngine
public updateSource(from, to, text): void {
  // ...
  const result = this.tryIncrementalUpdate(from, to, text);
  if (!result || !this.verifyIntegrity(result.newNode)) {
    console.warn("Incremental update failed integrity check, falling back to full parse.");
    this.fullParse(); // Fallback ensures data consistency
  }
}
```

#### 4.1.2 Proposal: "Ghost Node" Preservation Strategy
**Context:**
Editors like ProseMirror often have strict schemas. We need to preserve XML nodes that the editor doesn't understand.

**Recommendation:**
Implement a "Shadow DOM" or "Ghost Node" system in `xml-api`. When `getDocument()` is called, the library could track nodes that are "detached" from the projected DOM but still exist in the Model. When the DOM updates, the library re-inserts these ghost nodes into their original relative positions if possible.

**Draft Idea (API Usage):**
```typescript
// When creating the DOM wrapper
const doc = api.getDocument({
  // Strategy: Keep comments even if removed from DOM, re-insert them based on siblings
  preservationMode: 'detached-siblings' 
});
```

#### 4.1.3 Proposal: Format Preserving Parser
**Context:**
The `Formatter` class completely rewrites whitespace, which can be disruptive.

**Recommendation:**
Implement a "Format Preserving" capability in the Parser/Binder. Instead of generating new whitespace based on depth, the library should store the "leading whitespace" and "trailing whitespace" of each node in the CST/Model and use that during serialization (`toString()`).

**Draft Idea (Model):**
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

## 5. Conclusion
The `xml-api-editor` project has successfully validated the core architecture of using `@miy2/xml-api` as the backend for a React-based editor. While the basic sync and schema enforcement work well, the identified issues with incremental update robustness and node preservation are critical blockers for a production-ready release. Addressing these library-level issues is the priority for the next phase.