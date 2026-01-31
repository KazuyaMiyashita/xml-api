# Demo Walkthrough

This section explains how to build a bidirectional editor using the `xml-api`, based on the logic used in the Interactive Demo.

## Key Components

### 1. Initialization

The demo initializes both the `XMLAPI` (for source management) and the `Document` (for the visual DOM).

```typescript
api = new XMLAPI(input);
doc = new Document();
```

### 2. The Bridge (Observer)

The critical part of the demo is the `DOMObserver`. It listens for changes in the visual DOM (triggered by the properties panel) and calculates the corresponding text patches for the source code.

```typescript
const observer: DOMObserver = {
  onAttributeChange: (element, name, value) => {
    // 1. Get the underlying model
    const model = element.getModel();
    
    // 2. Calculate the patch
    const patch = binder.calcSetAttributePatch(model, name, value);
    
    // 3. Apply the patch to source
    if (patch) {
      api.updateInput(patch.start, patch.end, patch.text);
    }
  },
  // ... handle text changes similarly
};

doc.setObserver(observer);
```

### 3. Rendering

The `renderTree` function traverses the custom DOM tree and renders it to the browser's real DOM. Because the custom DOM mimics the standard DOM, this structure is familiar.

```typescript
function renderTree() {
  // Hydrate DOM wrapper from the API model
  doc.documentElement = createWrapper(api.model, doc) as Element;
  
  // Render to HTML
  treeRoot.appendChild(renderNode(doc.documentElement));
}
```

### 4. Properties Panel

The properties panel binds HTML inputs to the custom DOM elements. When an input changes, it calls methods like `element.setAttribute()`.

```typescript
input.onchange = () => {
  // This triggers the observer defined above!
  element.setAttribute(key, input.value);
};
```

## Flow of Data

1.  **User edits Property**: `input.onchange` -> `element.setAttribute`
2.  **Observer triggers**: `onAttributeChange` -> `binder.calcSetAttributePatch`
3.  **Source updates**: `api.updateInput` -> **New Source Code**
4.  **Re-parse**: `XMLAPI` updates internal CST/Model/AST
5.  **Re-render**: The UI refreshes to reflect the valid state of the document.
