[**@miy2/xml-api**](../../README.md)

***

# Class: XMLAPI

The primary entry point for the XML API.
Orchestrates the synchronization between source code (CST) and the logical Model.

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

### grammar

#### Get Signature

> **get** **grammar**(): [`Grammar`](../../cst/grammar/classes/Grammar.md)

The grammar used for parsing.

##### Returns

[`Grammar`](../../cst/grammar/classes/Grammar.md)

***

### input

#### Get Signature

> **get** **input**(): `string`

Alias for `source` to maintain compatibility with existing tests/demos temporarily.

##### Deprecated

Use `source` instead.

##### Returns

`string`

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

Creates a schema-specific view of the document.

#### Parameters

##### config

[`SchemaViewConfig`](../../view/schema-view/interfaces/SchemaViewConfig.md) = `{}`

Configuration for the view (e.g., filter).

#### Returns

[`SchemaView`](../../view/schema-view/classes/SchemaView.md)

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

### ~~replaceNode()~~

> **replaceNode**(`target`, `content`): `void`

#### Parameters

##### target

[`ModelNode`](../../model/xml-api-model/classes/ModelNode.md)

##### content

[`ModelNode`](../../model/xml-api-model/classes/ModelNode.md)

#### Returns

`void`

#### Deprecated

Use DOM interface or Engine directly if needed.

***

### ~~setAttribute()~~

> **setAttribute**(`modelNode`, `key`, `value`): `void`

#### Parameters

##### modelNode

[`ModelElement`](../../model/xml-api-model/classes/ModelElement.md)

##### key

`string`

##### value

`string`

#### Returns

`void`

#### Deprecated

Use DOM interface or Engine directly if needed.

***

### undo()

> **undo**(): `void`

#### Returns

`void`

***

### ~~updateInput()~~

> **updateInput**(`from`, `to`, `text`): `void`

Alias for `updateSource` to maintain compatibility.

#### Parameters

##### from

`number`

##### to

`number`

##### text

`string`

#### Returns

`void`

#### Deprecated

Use `updateSource` instead.

***

### updateSource()

> **updateSource**(`from`, `to`, `text`): `void`

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

#### Returns

`void`

***

### ~~updateText()~~

> **updateText**(`modelNode`, `text`): `void`

#### Parameters

##### modelNode

[`ModelElement`](../../model/xml-api-model/classes/ModelElement.md)

##### text

`string`

#### Returns

`void`

#### Deprecated

Use DOM interface or Engine directly if needed.
