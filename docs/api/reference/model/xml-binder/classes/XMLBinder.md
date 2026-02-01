[**xml-api**](../../../README.md)

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

### project()

> **project**(`model`): `string` \| [`ASTComment`](../../../ast/xml-ast/classes/ASTComment.md) \| [`ASTCDATA`](../../../ast/xml-ast/classes/ASTCDATA.md) \| [`AST`](../../../ast/xml-ast/classes/AST.md)

#### Parameters

##### model

[`ModelNode`](../../xml-api-model/classes/ModelNode.md)

#### Returns

`string` \| [`ASTComment`](../../../ast/xml-ast/classes/ASTComment.md) \| [`ASTCDATA`](../../../ast/xml-ast/classes/ASTCDATA.md) \| [`AST`](../../../ast/xml-ast/classes/AST.md)

***

### reconcile()

> **reconcile**(`currentModel`, `newCst`): [`ModelNode`](../../xml-api-model/classes/ModelNode.md)

#### Parameters

##### currentModel

[`ModelNode`](../../xml-api-model/classes/ModelNode.md)

##### newCst

[`CST`](../../../cst/xml-cst/classes/CST.md)

#### Returns

[`ModelNode`](../../xml-api-model/classes/ModelNode.md)
