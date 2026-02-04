[**@miy2/xml-api**](../../../README.md)

***

# Class: XMLBinder

## Constructors

### Constructor

> **new XMLBinder**(`input`): `XMLBinder`

#### Parameters

##### input

`string`

#### Returns

`XMLBinder`

## Methods

### calcInsertNodePatch()

> **calcInsertNodePatch**(`parent`, `index`, `insertText`): \{ `end`: `number`; `start`: `number`; `text`: `string`; \} \| `null`

#### Parameters

##### parent

[`ModelElement`](../../xml-api-model/classes/ModelElement.md)

##### index

`number`

##### insertText

`string`

#### Returns

\{ `end`: `number`; `start`: `number`; `text`: `string`; \} \| `null`

***

### calcRemoveNodePatch()

> **calcRemoveNodePatch**(`child`): \{ `end`: `number`; `start`: `number`; `text`: `string`; \} \| `null`

#### Parameters

##### child

[`ModelNode`](../../xml-api-model/classes/ModelNode.md)

#### Returns

\{ `end`: `number`; `start`: `number`; `text`: `string`; \} \| `null`

***

### calcReplaceNodePatch()

> **calcReplaceNodePatch**(`model`, `newXml`): \{ `end`: `number`; `start`: `number`; `text`: `string`; \} \| `null`

#### Parameters

##### model

[`ModelNode`](../../xml-api-model/classes/ModelNode.md)

##### newXml

`string`

#### Returns

\{ `end`: `number`; `start`: `number`; `text`: `string`; \} \| `null`

***

### calcSetAttributePatch()

> **calcSetAttributePatch**(`model`, `key`, `value`): \{ `end`: `number`; `start`: `number`; `text`: `string`; \} \| `null`

#### Parameters

##### model

[`ModelElement`](../../xml-api-model/classes/ModelElement.md)

##### key

`string`

##### value

`string`

#### Returns

\{ `end`: `number`; `start`: `number`; `text`: `string`; \} \| `null`

***

### calcUpdateTextPatch()

> **calcUpdateTextPatch**(`model`, `text`): \{ `end`: `number`; `start`: `number`; `text`: `string`; \} \| `null`

#### Parameters

##### model

[`ModelElement`](../../xml-api-model/classes/ModelElement.md)

##### text

`string`

#### Returns

\{ `end`: `number`; `start`: `number`; `text`: `string`; \} \| `null`

***

### hydrate()

> **hydrate**(`node`): [`ModelNode`](../../xml-api-model/classes/ModelNode.md) \| `null`

#### Parameters

##### node

[`CST`](../../../cst/xml-cst/classes/CST.md)

#### Returns

[`ModelNode`](../../xml-api-model/classes/ModelNode.md) \| `null`

***

### isHydratable()

> **isHydratable**(`name`): `boolean`

#### Parameters

##### name

`string` | `undefined`

#### Returns

`boolean`

***

### reconcile()

> **reconcile**(`currentModel`, `newCst`): [`ReconcileResult`](../interfaces/ReconcileResult.md)

#### Parameters

##### currentModel

[`ModelNode`](../../xml-api-model/classes/ModelNode.md)

##### newCst

[`CST`](../../../cst/xml-cst/classes/CST.md)

#### Returns

[`ReconcileResult`](../interfaces/ReconcileResult.md)
