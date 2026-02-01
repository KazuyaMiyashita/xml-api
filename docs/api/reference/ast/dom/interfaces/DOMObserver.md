[**xml-api**](../../../README.md)

***

# Interface: DOMObserver

Observer interface to listen for changes in the DOM-like structure.
This is crucial for synchronizing the visual representation or application model
back to the source code via the XMLAPI.

## Example

```typescript
const doc = new Document();
doc.setObserver({
  onAttributeChange: (element, name, value) => {
    console.log(`Attribute ${name} changed to ${value}`);
    // Sync with XMLAPI...
  },
  // ...
});
```

## Methods

### onAttributeChange()

> **onAttributeChange**(`element`, `name`, `value`): `void`

Called when an attribute is added, changed, or removed.

#### Parameters

##### element

[`Element`](../classes/Element.md)

The target element.

##### name

`string`

Attribute name.

##### value

New value, or null if removed.

`string` | `null`

#### Returns

`void`

***

### onChildAdded()

> **onChildAdded**(`parent`, `child`, `index`): `void`

Called when a child node is added.

#### Parameters

##### parent

[`Node`](../classes/Node.md)

The parent node.

##### child

[`Node`](../classes/Node.md)

The added child node.

##### index

`number`

The index at which the child was added.

#### Returns

`void`

***

### onChildRemoved()

> **onChildRemoved**(`parent`, `child`, `index`): `void`

Called when a child node is removed.

#### Parameters

##### parent

[`Node`](../classes/Node.md)

The parent node.

##### child

[`Node`](../classes/Node.md)

The removed child node.

##### index

`number`

The index from which the child was removed.

#### Returns

`void`

***

### onTextChange()

> **onTextChange**(`node`, `text`): `void`

Called when the text content of a node changes.

#### Parameters

##### node

[`CharacterData`](../classes/CharacterData.md)

The target CharacterData node (Text, Comment, CDATA).

##### text

`string`

The new text content.

#### Returns

`void`
