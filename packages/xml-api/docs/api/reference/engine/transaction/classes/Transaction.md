[**@miy2/xml-api**](../../../README.md)

***

# Class: Transaction

Represents a unit of change to the editor state.
Currently focuses on text changes (patches).

## Constructors

### Constructor

> **new Transaction**(`startState`): `Transaction`

#### Parameters

##### startState

[`EditorState`](../../editor-state/classes/EditorState.md)

#### Returns

`Transaction`

## Properties

### docChanged

> **docChanged**: `boolean` = `false`

***

### isRemote

> **isRemote**: `boolean` = `false`

Indicates if this transaction originated from a remote source (collaboration).

***

### metadata

> **metadata**: `Map`\<`string`, `any`\>

***

### patches

> `readonly` **patches**: [`TextPatch`](../interfaces/TextPatch.md)[] = `[]`

***

### startState

> `readonly` **startState**: [`EditorState`](../../editor-state/classes/EditorState.md)

## Accessors

### newSource

#### Get Signature

> **get** **newSource**(): `string`

Calculates the new source text by applying patches.
Handles multiple patches by sorting them in reverse order of position.

##### Returns

`string`

## Methods

### getMeta()

> **getMeta**(`key`): `any`

#### Parameters

##### key

`string`

#### Returns

`any`

***

### replace()

> **replace**(`from`, `to`, `text`): `this`

Adds a text change to the transaction.

#### Parameters

##### from

`number`

Start index

##### to

`number`

End index

##### text

`string`

New text

#### Returns

`this`

***

### setMeta()

> **setMeta**(`key`, `value`): `this`

#### Parameters

##### key

`string`

##### value

`any`

#### Returns

`this`
