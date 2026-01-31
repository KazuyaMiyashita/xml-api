# Binding & Events

The XML API uses an observer pattern to synchronize changes between the custom DOM wrapper and the core `XMLAPI`.

## DOMObserver

To listen for changes initiated via the DOM interface (e.g., `element.setAttribute(...)`), you can implement the `DOMObserver` interface and attach it to the `Document`.

```typescript
interface DOMObserver {
  onAttributeChange(element: Element, name: string, value: string | null): void;
  onTextChange(node: CharacterData, text: string): void;
  onChildAdded(parent: Node, child: Node, index: number): void;
  onChildRemoved(parent: Node, child: Node, index: number): void;
}
```

### Usage

```typescript
const doc = new Document();
doc.setObserver({
  onAttributeChange: (element, name, value) => {
    console.log(`Attribute ${name} changed to ${value}`);
    // Here you would typically call xmlApi.setAttribute(...) to sync back to source
  },
  // ... implement other methods
});
```

## XMLAPI Events

The `XMLAPI` instance emits events when the underlying model changes due to source code updates.

```typescript
api.on((event) => {
  if (event.type === 'full') {
    console.log('Full re-parse or structure change occurred');
  } else if (event.type === 'text') {
    console.log('Text content updated');
  }
});
```
