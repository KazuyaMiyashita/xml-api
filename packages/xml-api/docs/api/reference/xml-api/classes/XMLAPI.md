[**@miy2/xml-api**](../../README.md)

***

# Class: XMLAPI

The primary entry point for the XML API.
Orchestrates the synchronization between source code (CST), the logical Model, and Schema Views.

This class serves as the central hub for the "Three-Level Reconciliation" architecture:
1. Source <-> CST: Incremental parsing.
2. CST <-> Model: Logical binding and identity preservation.
3. Model <-> View: Schema projection and filtering (via `createView`).

## Constructors

### Constructor

> **new XMLAPI**(`source`, `grammar?`): `XMLAPI`

Initializes the API with the source XML string.

#### Parameters

##### source

`string`

The initial XML source code.

##### grammar?

[`Grammar`](../../cst/grammar/classes/Grammar.md)

(Optional) Custom grammar definition.

#### Returns

`XMLAPI`

## Accessors

### cst

#### Get Signature

> **get** **cst**(): [`CST`](../../cst/xml-cst/classes/CST.md) \| `null`

The Concrete Syntax Tree (Physical layer).

##### Returns

[`CST`](../../cst/xml-cst/classes/CST.md) \| `null`

***

### engine

#### Get Signature

> **get** **engine**(): [`SyncEngine`](../../engine/sync-engine/classes/SyncEngine.md)

The underlying synchronization engine.

##### Returns

[`SyncEngine`](../../engine/sync-engine/classes/SyncEngine.md)

***

### grammar

#### Get Signature

> **get** **grammar**(): [`Grammar`](../../cst/grammar/classes/Grammar.md)

The grammar used for parsing.

##### Returns

[`Grammar`](../../cst/grammar/classes/Grammar.md)

***

### model

#### Get Signature

> **get** **model**(): [`ModelElement`](../../model/xml-api-model/classes/ModelElement.md) \| `null`

The authoritative logical model.

##### Returns

[`ModelElement`](../../model/xml-api-model/classes/ModelElement.md) \| `null`

***

### source

#### Get Signature

> **get** **source**(): `string`

The current source code string.

##### Returns

`string`

## Methods

### createView()

> **createView**(`config`): [`SchemaView`](../../view/schema-view/classes/SchemaView.md)

Creates a projected view of the document.

A SchemaView allows you to work with a filtered subset of the document (e.g., only XHTML tags)
while the underlying system maintains full fidelity of the original source (including comments,
custom tags, and formatting) in the background.

#### Parameters

##### config

[`SchemaViewConfig`](../../view/schema-view/interfaces/SchemaViewConfig.md) = `{}`

Configuration for the view, including filter logic.

#### Returns

[`SchemaView`](../../view/schema-view/classes/SchemaView.md)

A `SchemaView` instance providing a DOM-like interface for the projected content.

***

### getDocument()

> **getDocument**(): [`Document`](../../dom/classes/Document.md)

Returns a DOM-compatible Document object linked to this API.
Changes made to the returned Document are automatically reflected in the source code.

#### Returns

[`Document`](../../dom/classes/Document.md)

***

### on()

> **on**(`handler`): () => `void`

Registers an event handler to listen for model changes.

#### Parameters

##### handler

[`EventHandler`](../../xml-api-events/type-aliases/EventHandler.md)

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

### undo()

> **undo**(): `void`

#### Returns

`void`

***

### updateSource()

> **updateSource**(`from`, `to`, `text`, `meta?`): `void`

Updates the source code directly (e.g. from a text editor).
Attempts an optimized incremental update, falling back to full re-parse if needed.

#### Parameters

##### from

`number`

Start index of the range to replace.

##### to

`number`

End index of the range.

##### text

`string`

The new text to insert.

##### meta?

`Record`\<`string`, `any`\>

(Optional) Metadata for the transaction.

#### Returns

`void`
