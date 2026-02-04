[**@miy2/xml-api**](../../../README.md)

***

# Class: SchemaView

## Constructors

### Constructor

> **new SchemaView**(`model`, `engine`, `config`): `SchemaView`

#### Parameters

##### model

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md)

##### engine

[`SyncEngine`](../../../engine/sync-engine/classes/SyncEngine.md)

##### config

[`SchemaViewConfig`](../interfaces/SchemaViewConfig.md) = `{}`

#### Returns

`SchemaView`

## Methods

### getDocument()

> **getDocument**(): [`Document`](../../../dom/classes/Document.md)

#### Returns

[`Document`](../../../dom/classes/Document.md)

***

### getModelNode()

> **getModelNode**(`viewNode`): [`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

#### Parameters

##### viewNode

[`Node`](../../../dom/classes/Node.md)

#### Returns

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

***

### getNodeByModelId()

> **getNodeByModelId**(`id`): [`Node`](../../../dom/classes/Node.md) \| `null`

#### Parameters

##### id

`string`

#### Returns

[`Node`](../../../dom/classes/Node.md) \| `null`

***

### getRoot()

> **getRoot**(): [`Element`](../../../dom/classes/Element.md)

#### Returns

[`Element`](../../../dom/classes/Element.md)

***

### on()

> **on**(`handler`): () => `void`

#### Parameters

##### handler

(`event`) => `void`

#### Returns

> (): `void`

##### Returns

`void`

***

### reconcile()

> **reconcile**(`externalDomNode`, `meta?`): `void`

#### Parameters

##### externalDomNode

[`ExternalNode`](../../view-binder/interfaces/ExternalNode.md)

##### meta?

`Record`\<`string`, `any`\>

#### Returns

`void`
