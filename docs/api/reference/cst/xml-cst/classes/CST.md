[**xml-api**](../../../README.md)

***

# Class: CST

Represents a node in the Concrete Syntax Tree (Parse Tree).
Each node corresponds to a match of a grammatical structure or rule.

## Constructors

### Constructor

> **new CST**(`type`, `name`, `start`, `end`, `children`, `wellFormed`): `CST`

#### Parameters

##### type

`string`

The type of the grammatical structure matched.
Common values include "literal", "regex", "sequence", "repeat".
This describes the structural nature of the match, not the grammar rule name.

##### name

The name of the grammar rule corresponding to this node (e.g., "element", "attribute").
Defined only if this node represents a named rule reference; otherwise undefined.

`string` | `undefined`

##### start

`number`

The 0-based starting index of this node in the entire input string (inclusive).

##### end

`number`

The 0-based ending index of this node in the entire input string (exclusive).
The length of the match is (end - start).

##### children

`CST`[] = `[]`

Child nodes contained within this structure.
Empty for leaf nodes like literals or regex matches.

##### wellFormed

`boolean` = `true`

Indicates whether the node satisfies additional validation logic beyond basic parsing.
If false, the node was parsed successfully according to the grammar structure
but failed a semantic or contextual validation check.

#### Returns

`CST`

## Properties

### children

> **children**: `CST`[] = `[]`

Child nodes contained within this structure.
Empty for leaf nodes like literals or regex matches.

***

### end

> **end**: `number`

The 0-based ending index of this node in the entire input string (exclusive).
The length of the match is (end - start).

***

### name

> **name**: `string` \| `undefined`

The name of the grammar rule corresponding to this node (e.g., "element", "attribute").
Defined only if this node represents a named rule reference; otherwise undefined.

***

### parent

> **parent**: `CST` \| `null` = `null`

Reference to the parent node in the syntax tree.
Null if this is the root node.

***

### start

> **start**: `number`

The 0-based starting index of this node in the entire input string (inclusive).

***

### type

> **type**: `string`

The type of the grammatical structure matched.
Common values include "literal", "regex", "sequence", "repeat".
This describes the structural nature of the match, not the grammar rule name.

***

### wellFormed

> **wellFormed**: `boolean` = `true`

Indicates whether the node satisfies additional validation logic beyond basic parsing.
If false, the node was parsed successfully according to the grammar structure
but failed a semantic or contextual validation check.

## Methods

### getText()

> **getText**(`input`): `string`

Retrieves the substring matching this node from the entire original input string.

#### Parameters

##### input

`string`

#### Returns

`string`

***

### shift()

> **shift**(`pos`, `delta`): `void`

Shifts the start and end positions of this node and its children.

#### Parameters

##### pos

`number`

The position where the change occurred.

##### delta

`number`

The change in length.

#### Returns

`void`

***

### unwrap()

> **unwrap**(): `CST`

Unwraps single-child Reference nodes to find the underlying structural node.

#### Returns

`CST`
