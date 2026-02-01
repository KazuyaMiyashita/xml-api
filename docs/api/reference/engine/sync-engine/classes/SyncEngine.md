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

## Properties

### cst

> **cst**: [`CST`](../../../cst/xml-cst/classes/CST.md) \| `null` = `null`

***

### model

> **model**: [`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md) \| `null` = `null`

## Accessors

### grammar

#### Get Signature

> **get** **grammar**(): [`Grammar`](../../../cst/grammar/classes/Grammar.md)

##### Returns

[`Grammar`](../../../cst/grammar/classes/Grammar.md)

***

### source

#### Get Signature

> **get** **source**(): `string`

##### Returns

`string`

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
