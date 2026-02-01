[**xml-api**](../README.md)

***

# Abstract Class: CharacterData

Base class for Text, Comment, and CDATASection nodes.

## Extends

- [`Node`](Node.md)

## Extended by

- [`Text`](Text.md)
- [`Comment`](Comment.md)
- [`CDATASection`](CDATASection.md)

## Constructors

### Constructor

> **new CharacterData**(`model`, `ownerDocument`): `CharacterData`

#### Parameters

##### model

[`ModelNode`](ModelNode.md)

##### ownerDocument

[`Document`](Document.md) | `null`

#### Returns

`CharacterData`

#### Inherited from

[`Node`](Node.md).[`constructor`](Node.md#constructor)

## Properties

### CDATA\_SECTION\_NODE

> `readonly` **CDATA\_SECTION\_NODE**: `4` = `4`

#### Inherited from

[`Node`](Node.md).[`CDATA_SECTION_NODE`](Node.md#cdata_section_node)

***

### COMMENT\_NODE

> `readonly` **COMMENT\_NODE**: `8` = `8`

#### Inherited from

[`Node`](Node.md).[`COMMENT_NODE`](Node.md#comment_node)

***

### DOCUMENT\_NODE

> `readonly` **DOCUMENT\_NODE**: `9` = `9`

#### Inherited from

[`Node`](Node.md).[`DOCUMENT_NODE`](Node.md#document_node)

***

### ELEMENT\_NODE

> `readonly` **ELEMENT\_NODE**: `1` = `1`

#### Inherited from

[`Node`](Node.md).[`ELEMENT_NODE`](Node.md#element_node)

***

### model

> `protected` **model**: [`ModelNode`](ModelNode.md)

#### Inherited from

[`Node`](Node.md).[`model`](Node.md#model)

***

### ownerDocument

> **ownerDocument**: [`Document`](Document.md) \| `null`

#### Inherited from

[`Node`](Node.md).[`ownerDocument`](Node.md#ownerdocument)

***

### TEXT\_NODE

> `readonly` **TEXT\_NODE**: `3` = `3`

#### Inherited from

[`Node`](Node.md).[`TEXT_NODE`](Node.md#text_node)

## Accessors

### childNodes

#### Get Signature

> **get** **childNodes**(): [`NodeList`](NodeList.md)

Returns a NodeList containing all children of this node.

##### Returns

[`NodeList`](NodeList.md)

#### Inherited from

[`Node`](Node.md).[`childNodes`](Node.md#childnodes)

***

### data

#### Get Signature

> **get** **data**(): `string`

##### Returns

`string`

#### Set Signature

> **set** **data**(`value`): `void`

##### Parameters

###### value

`string`

##### Returns

`void`

***

### firstChild

#### Get Signature

> **get** **firstChild**(): [`Node`](Node.md) \| `null`

##### Returns

[`Node`](Node.md) \| `null`

#### Inherited from

[`Node`](Node.md).[`firstChild`](Node.md#firstchild)

***

### lastChild

#### Get Signature

> **get** **lastChild**(): [`Node`](Node.md) \| `null`

##### Returns

[`Node`](Node.md) \| `null`

#### Inherited from

[`Node`](Node.md).[`lastChild`](Node.md#lastchild)

***

### length

#### Get Signature

> **get** **length**(): `number`

##### Returns

`number`

***

### nextSibling

#### Get Signature

> **get** **nextSibling**(): [`Node`](Node.md) \| `null`

##### Returns

[`Node`](Node.md) \| `null`

#### Inherited from

[`Node`](Node.md).[`nextSibling`](Node.md#nextsibling)

***

### nodeName

#### Get Signature

> **get** `abstract` **nodeName**(): `string`

##### Returns

`string`

#### Inherited from

[`Node`](Node.md).[`nodeName`](Node.md#nodename)

***

### nodeType

#### Get Signature

> **get** `abstract` **nodeType**(): `number`

##### Returns

`number`

#### Inherited from

[`Node`](Node.md).[`nodeType`](Node.md#nodetype)

***

### parentNode

#### Get Signature

> **get** **parentNode**(): [`Node`](Node.md) \| `null`

Returns the parent of this node.

##### Returns

[`Node`](Node.md) \| `null`

#### Inherited from

[`Node`](Node.md).[`parentNode`](Node.md#parentnode)

***

### previousSibling

#### Get Signature

> **get** **previousSibling**(): [`Node`](Node.md) \| `null`

##### Returns

[`Node`](Node.md) \| `null`

#### Inherited from

[`Node`](Node.md).[`previousSibling`](Node.md#previoussibling)

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

#### Inherited from

[`Element`](Element.md).[`textContent`](Element.md#textcontent)

## Methods

### appendChild()

> **appendChild**\<`T`\>(`newChild`): `T`

Adds a node to the end of the list of children of a specified parent node.

#### Type Parameters

##### T

`T` *extends* [`Node`](Node.md)

#### Parameters

##### newChild

`T`

The node to append.

#### Returns

`T`

#### Inherited from

[`Node`](Node.md).[`appendChild`](Node.md#appendchild)

***

### getModel()

> **getModel**(): [`ModelNode`](ModelNode.md)

#### Returns

[`ModelNode`](ModelNode.md)

#### Inherited from

[`Node`](Node.md).[`getModel`](Node.md#getmodel)
