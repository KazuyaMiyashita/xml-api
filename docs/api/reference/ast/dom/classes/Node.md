[**xml-api**](../../../README.md)

***

# Abstract Class: Node

Base class for all DOM nodes.
Implements a subset of the W3C Node interface to allow applications
to interact with the XML model using familiar methods.

## Extended by

- [`CharacterData`](CharacterData.md)
- [`Element`](Element.md)
- [`Document`](Document.md)

## Constructors

### Constructor

> **new Node**(`model`, `ownerDocument`): `Node`

#### Parameters

##### model

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

##### ownerDocument

[`Document`](Document.md) | `null`

#### Returns

`Node`

## Properties

### CDATA\_SECTION\_NODE

> `readonly` **CDATA\_SECTION\_NODE**: `4` = `4`

***

### COMMENT\_NODE

> `readonly` **COMMENT\_NODE**: `8` = `8`

***

### DOCUMENT\_NODE

> `readonly` **DOCUMENT\_NODE**: `9` = `9`

***

### ELEMENT\_NODE

> `readonly` **ELEMENT\_NODE**: `1` = `1`

***

### model

> `protected` **model**: [`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

***

### ownerDocument

> **ownerDocument**: [`Document`](Document.md) \| `null`

***

### TEXT\_NODE

> `readonly` **TEXT\_NODE**: `3` = `3`

## Accessors

### childNodes

#### Get Signature

> **get** **childNodes**(): [`NodeList`](NodeList.md)

Returns a NodeList containing all children of this node.

##### Returns

[`NodeList`](NodeList.md)

***

### firstChild

#### Get Signature

> **get** **firstChild**(): `Node` \| `null`

##### Returns

`Node` \| `null`

***

### lastChild

#### Get Signature

> **get** **lastChild**(): `Node` \| `null`

##### Returns

`Node` \| `null`

***

### nextSibling

#### Get Signature

> **get** **nextSibling**(): `Node` \| `null`

##### Returns

`Node` \| `null`

***

### nodeName

#### Get Signature

> **get** `abstract` **nodeName**(): `string`

##### Returns

`string`

***

### nodeType

#### Get Signature

> **get** `abstract` **nodeType**(): `number`

##### Returns

`number`

***

### parentNode

#### Get Signature

> **get** **parentNode**(): `Node` \| `null`

Returns the parent of this node.

##### Returns

`Node` \| `null`

***

### previousSibling

#### Get Signature

> **get** **previousSibling**(): `Node` \| `null`

##### Returns

`Node` \| `null`

***

### textContent

#### Get Signature

> **get** **textContent**(): `string` \| `null`

##### Returns

`string` \| `null`

#### Set Signature

> **set** **textContent**(`value`): `void`

##### Parameters

###### value

`string` | `null`

##### Returns

`void`

## Methods

### appendChild()

> **appendChild**\<`T`\>(`newChild`): `T`

Adds a node to the end of the list of children of a specified parent node.

#### Type Parameters

##### T

`T` *extends* `Node`

#### Parameters

##### newChild

`T`

The node to append.

#### Returns

`T`

***

### getModel()

> **getModel**(): [`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

#### Returns

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)
