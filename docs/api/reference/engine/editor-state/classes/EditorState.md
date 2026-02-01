[**xml-api**](../../../README.md)

***

# Class: EditorState

Represents a snapshot of the editor state at a specific point in time.
Includes the source code, the logical model, and the physical CST.

## Constructors

### Constructor

> **new EditorState**(`config`): `EditorState`

#### Parameters

##### config

[`EditorStateConfig`](../interfaces/EditorStateConfig.md)

#### Returns

`EditorState`

## Properties

### cst

> `readonly` **cst**: [`CST`](../../../cst/xml-cst/classes/CST.md) \| `null`

***

### model

> `readonly` **model**: [`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md) \| `null`

***

### source

> `readonly` **source**: `string`

## Methods

### update()

> **update**(`changes`): `EditorState`

Creates a new state with updated properties.

#### Parameters

##### changes

`Partial`\<[`EditorStateConfig`](../interfaces/EditorStateConfig.md)\>

#### Returns

`EditorState`

***

### create()

> `static` **create**(`source`): `EditorState`

#### Parameters

##### source

`string`

#### Returns

`EditorState`
