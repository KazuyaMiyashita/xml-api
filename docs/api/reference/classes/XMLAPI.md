[**xml-api**](../README.md)

***

# Class: XMLAPI

## Constructors

### Constructor

> **new XMLAPI**(`input`, `grammar`, `converter`): `XMLAPI`

Initializes the API with the source XML string.

#### Parameters

##### input

`string`

The initial XML source code.

##### grammar

`Grammar` = `defaultGrammar`

(Optional) Custom grammar definition.

##### converter

[`Converter`](../type-aliases/Converter.md) = `defaultConverter`

(Optional) Custom CST-to-AST converter.

#### Returns

`XMLAPI`

## Properties

### ast

> **ast**: [`AST`](AST.md) \| `null` = `null`

AST is null if CST is null or not well-formed.

***

### converter

> **converter**: [`Converter`](../type-aliases/Converter.md)

***

### cst

> **cst**: `CST` \| `null` = `null`

CST is null if parsing fails.

***

### grammar

> **grammar**: `Grammar`

***

### input

> **input**: `string`

***

### model

> **model**: [`ModelElement`](ModelElement.md) \| `null` = `null`

Model is the authoritative logical representation.

***

### parser

> **parser**: `Parser`

## Methods

### on()

> **on**(`handler`): () => `void`

Registers an event handler to listen for model changes.

#### Parameters

##### handler

`EventHandler`

The callback function.

#### Returns

A function to unsubscribe the handler.

> (): `void`

##### Returns

`void`

***

### redo()

> **redo**(): `void`

Re-applies a previously undone source code change.

#### Returns

`void`

***

### replaceNode()

> **replaceNode**(`astNode`, `content`): `void`

Replaces an AST node with new content.

#### Parameters

##### astNode

The AST node to replace.

[`ASTComment`](ASTComment.md) | [`ASTCDATA`](ASTCDATA.md) | [`AST`](AST.md)

##### content

[`ASTNode`](../type-aliases/ASTNode.md)

New content as an AST object.

#### Returns

`void`

***

### setAttribute()

> **setAttribute**(`astNode`, `key`, `value`): `void`

Sets an attribute on the specified AST node.
Updates the source code, CST, Model, and AST by calculating a minimal text patch.

#### Parameters

##### astNode

[`AST`](AST.md)

The target AST node.

##### key

`string`

Attribute name.

##### value

`string`

Attribute value.

#### Returns

`void`

***

### undo()

> **undo**(): `void`

Reverts the last source code change.

#### Returns

`void`

***

### updateInput()

> **updateInput**(`from`, `to`, `value`): `void`

Updates the input text and refreshes the CST/AST.
This method attempts an incremental update first, falling back to a full re-parse if necessary.

#### Parameters

##### from

`number`

Start index of the range to replace.

##### to

`number`

End index of the range.

##### value

`string`

The new text to insert.

#### Returns

`void`

***

### updateText()

> **updateText**(`astNode`, `text`): `void`

Updates the text content of the specified AST element.

#### Parameters

##### astNode

[`AST`](AST.md)

The target AST element.

##### text

`string`

The new text content.

#### Returns

`void`
