[**xml-api**](../README.md)

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

### calcReplaceNodePatch()

> **calcReplaceNodePatch**(`model`, `newXml`): \{ `end`: `number`; `start`: `number`; `text`: `string`; \} \| `null`

#### Parameters

##### model

[`ModelNode`](ModelNode.md)

##### newXml

`string`

#### Returns

\{ `end`: `number`; `start`: `number`; `text`: `string`; \} \| `null`

***

### calcSetAttributePatch()

> **calcSetAttributePatch**(`model`, `key`, `value`): \{ `end`: `number`; `start`: `number`; `text`: `string`; \} \| `null`

#### Parameters

##### model

[`ModelElement`](ModelElement.md)

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

[`ModelElement`](ModelElement.md)

##### text

`string`

#### Returns

\{ `end`: `number`; `start`: `number`; `text`: `string`; \} \| `null`

***

### hydrate()

> **hydrate**(`node`): [`ModelNode`](ModelNode.md) \| `null`

#### Parameters

##### node

`CST`

#### Returns

[`ModelNode`](ModelNode.md) \| `null`

***

### isHydratable()

> **isHydratable**(`name`): `boolean`

#### Parameters

##### name

`string` | `undefined`

#### Returns

`boolean`

***

### project()

> **project**(`model`): `string` \| [`ASTComment`](ASTComment.md) \| [`ASTCDATA`](ASTCDATA.md) \| [`AST`](AST.md)

#### Parameters

##### model

[`ModelNode`](ModelNode.md)

#### Returns

`string` \| [`ASTComment`](ASTComment.md) \| [`ASTCDATA`](ASTCDATA.md) \| [`AST`](AST.md)

***

### reconcile()

> **reconcile**(`currentModel`, `newCst`): [`ModelNode`](ModelNode.md)

#### Parameters

##### currentModel

[`ModelNode`](ModelNode.md)

##### newCst

`CST`

#### Returns

[`ModelNode`](ModelNode.md)
