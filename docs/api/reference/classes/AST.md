[**xml-api**](../README.md)

***

# Class: AST

## Constructors

### Constructor

> **new AST**(`tagName`, `attributes`, `children`): `AST`

#### Parameters

##### tagName

`string`

##### attributes

##### children

[`ASTNode`](../type-aliases/ASTNode.md)[] = `[]`

Child nodes can be either nested AST elements, raw text strings, comments, or CDATA.

#### Returns

`AST`

## Properties

### attributes

> **attributes**: `object` = `{}`

#### Index Signature

\[`key`: `string`\]: `string`

***

### children

> **children**: [`ASTNode`](../type-aliases/ASTNode.md)[] = `[]`

Child nodes can be either nested AST elements, raw text strings, comments, or CDATA.

***

### cst

> **cst**: `CST` \| `null` = `null`

Reference to the CST node that generated this AST node.

***

### tagName

> **tagName**: `string`

## Methods

### attr()

> **attr**(`name`): `string` \| `undefined`

#### Parameters

##### name

`string`

#### Returns

`string` \| `undefined`

***

### find()

> **find**(`tagName`): `AST`[]

#### Parameters

##### tagName

`string`

#### Returns

`AST`[]

***

### text()

> **text**(): `string`

#### Returns

`string`
