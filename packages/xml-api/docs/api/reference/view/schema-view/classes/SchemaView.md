[**@miy2/xml-api**](../../../README.md)

***

# Class: SchemaView

A filtered, schema-specific projection of the document.

The SchemaView provides a "view" of the underlying Model that only contains nodes relevant
to a specific schema (e.g., XHTML). It hides "invisible" nodes (like comments, processing instructions,
or tags not in the allowed list) but preserves them in the Model during updates.

This enables applications (like WYSIWYG editors) to work with a simplified DOM structure
without destroying the full fidelity of the original source code.

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

Subscribes to changes in the view.

Events emitted here are "projected" events:
- They only fire for nodes visible in this view.
- `target` nodes are View nodes (wrappers), not raw Model nodes.
- Structure events (`addedNodes`/`removedNodes`) are filtered to exclude invisible nodes.

#### Parameters

##### handler

(`event`) => `void`

Function to handle the events.

#### Returns

Unsubscribe function.

> (): `void`

##### Returns

`void`

***

### reconcile()

> **reconcile**(`externalDomNode`, `meta?`, `target?`): `void`

Reconciles an external DOM tree (e.g., from a browser's contentEditable) with this view.

This method calculates the differences between the external tree and the current view,
then applies minimal updates to the underlying Model. Crucially, it respects the
"Invisible Node Preservation" rule: if the external tree is missing a node that is hidden
in this view (like a comment), that node is preserved in the Model.

#### Parameters

##### externalDomNode

[`ExternalNode`](../../view-binder/interfaces/ExternalNode.md)

The root of the external DOM tree to sync from.

##### meta?

`Record`\<`string`, `any`\>

Optional metadata to attach to the generated transaction.

##### target?

[`Element`](../../../dom/classes/Element.md)

Optional specific element to reconcile (defaults to view root).

#### Returns

`void`
