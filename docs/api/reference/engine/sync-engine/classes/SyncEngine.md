[**xml-api**](../../../README.md)

***

# Class: SyncEngine

## Constructors

### Constructor

> **new SyncEngine**(`source`, `grammar`): `SyncEngine`

#### Parameters

##### source

`string`

##### grammar

[`Grammar`](../../../cst/grammar/classes/Grammar.md) = `defaultGrammar`

#### Returns

`SyncEngine`

## Accessors

### cst

#### Get Signature

> **get** **cst**(): [`CST`](../../../cst/xml-cst/classes/CST.md) \| `null`

##### Returns

[`CST`](../../../cst/xml-cst/classes/CST.md) \| `null`

***

### grammar

#### Get Signature

> **get** **grammar**(): [`Grammar`](../../../cst/grammar/classes/Grammar.md)

##### Returns

[`Grammar`](../../../cst/grammar/classes/Grammar.md)

***

### model

#### Get Signature

> **get** **model**(): [`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md) \| `null`

##### Returns

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md) \| `null`

***

### source

#### Get Signature

> **get** **source**(): `string`

##### Returns

`string`

***

### state

#### Get Signature

> **get** **state**(): [`EditorState`](../../editor-state/classes/EditorState.md)

##### Returns

[`EditorState`](../../editor-state/classes/EditorState.md)

## Methods

### applyPatch()

> **applyPatch**(`start`, `end`, `text`): `void`

Apply a programmatic change derived from Model operations.
This is the "Application -> Source" flow.

#### Parameters

##### start

`number`

##### end

`number`

##### text

`string`

#### Returns

`void`

***

### dispatch()

> **dispatch**(`tr`): `void`

Applies a transaction to the engine, updating the state and notifying listeners.

#### Parameters

##### tr

[`Transaction`](../../transaction/classes/Transaction.md)

#### Returns

`void`

***

### insertNode()

> **insertNode**(`parent`, `child`, `index`): `void`

#### Parameters

##### parent

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md)

##### child

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

##### index

`number`

#### Returns

`void`

***

### on()

> **on**(`handler`): () => `void`

Subscribe to model changes.

#### Parameters

##### handler

[`EventHandler`](../../../xml-api-events/type-aliases/EventHandler.md)

#### Returns

> (): `void`

##### Returns

`void`

***

### redo()

> **redo**(): `void`

#### Returns

`void`

***

### removeNode()

> **removeNode**(`parent`, `child`): `void`

#### Parameters

##### parent

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md)

##### child

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

#### Returns

`void`

***

### replaceNode()

> **replaceNode**(`target`, `content`): `void`

#### Parameters

##### target

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

##### content

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

#### Returns

`void`

***

### setAttribute()

> **setAttribute**(`modelNode`, `key`, `value`): `void`

#### Parameters

##### modelNode

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md)

##### key

`string`

##### value

`string`

#### Returns

`void`

***

### undo()

> **undo**(): `void`

#### Returns

`void`

***

### updateSource()

> **updateSource**(`from`, `to`, `text`): `void`

Update the source code (e.g. from text editor).
Handles history recording and incremental parsing.

#### Parameters

##### from

`number`

##### to

`number`

##### text

`string`

#### Returns

`void`

***

### updateText()

> **updateText**(`modelNode`, `text`): `void`

#### Parameters

##### modelNode

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md)

##### text

`string`

#### Returns

`void`
