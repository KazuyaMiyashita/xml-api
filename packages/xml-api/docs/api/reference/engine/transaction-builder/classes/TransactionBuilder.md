[**@miy2/xml-api**](../../../README.md)

***

# Class: TransactionBuilder

## Constructors

### Constructor

> **new TransactionBuilder**(`state`, `binder`): `TransactionBuilder`

#### Parameters

##### state

[`EditorState`](../../editor-state/classes/EditorState.md)

##### binder

[`XMLBinder`](../../../model/xml-binder/classes/XMLBinder.md)

#### Returns

`TransactionBuilder`

## Methods

### insertNode()

> **insertNode**(`parent`, `child`, `index`): [`Transaction`](../../transaction/classes/Transaction.md)

#### Parameters

##### parent

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md)

##### child

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

##### index

`number`

#### Returns

[`Transaction`](../../transaction/classes/Transaction.md)

***

### removeNode()

> **removeNode**(`parent`, `child`): [`Transaction`](../../transaction/classes/Transaction.md)

#### Parameters

##### parent

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md)

##### child

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

#### Returns

[`Transaction`](../../transaction/classes/Transaction.md)

***

### replaceNode()

> **replaceNode**(`target`, `content`): [`Transaction`](../../transaction/classes/Transaction.md)

#### Parameters

##### target

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

##### content

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

#### Returns

[`Transaction`](../../transaction/classes/Transaction.md)

***

### setAttribute()

> **setAttribute**(`modelNode`, `key`, `value`): [`Transaction`](../../transaction/classes/Transaction.md)

#### Parameters

##### modelNode

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md)

##### key

`string`

##### value

`string`

#### Returns

[`Transaction`](../../transaction/classes/Transaction.md)

***

### updateText()

> **updateText**(`modelNode`, `text`): [`Transaction`](../../transaction/classes/Transaction.md)

#### Parameters

##### modelNode

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md)

##### text

`string`

#### Returns

[`Transaction`](../../transaction/classes/Transaction.md)
