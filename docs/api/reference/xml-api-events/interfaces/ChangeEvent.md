[**xml-api**](../../README.md)

***

# Interface: ChangeEvent

Event object emitted when the XML model changes.

## Properties

### key?

> `optional` **key**: `string`

The attribute name (only for 'attribute' changes).

***

### target?

> `optional` **target**: [`ModelNode`](../../model/xml-api-model/classes/ModelNode.md)

The node that changed (if applicable).

***

### type

> **type**: [`ChangeType`](../type-aliases/ChangeType.md)

The type of change.
