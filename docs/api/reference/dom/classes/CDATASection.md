[**xml-api**](../../README.md)

***

# Class: CDATASection

Base class for Text, Comment, and CDATASection nodes.

## Extends

- [`CharacterData`](CharacterData.md)

## Constructors

### Constructor

> **new CDATASection**(`model`, `ownerDocument`): `CDATASection`

#### Parameters

##### model

[`ModelNode`](../../model/xml-api-model/classes/ModelNode.md)

##### ownerDocument

[`Document`](Document.md) | `null`

#### Returns

`CDATASection`

#### Inherited from

[`CharacterData`](CharacterData.md).[`constructor`](CharacterData.md#constructor)

## Properties

### CDATA\_SECTION\_NODE

> `readonly` **CDATA\_SECTION\_NODE**: `4` = `4`

#### Inherited from

[`CharacterData`](CharacterData.md).[`CDATA_SECTION_NODE`](CharacterData.md#cdata_section_node)

***

### COMMENT\_NODE

> `readonly` **COMMENT\_NODE**: `8` = `8`

#### Inherited from

[`CharacterData`](CharacterData.md).[`COMMENT_NODE`](CharacterData.md#comment_node)

***

### DOCUMENT\_NODE

> `readonly` **DOCUMENT\_NODE**: `9` = `9`

#### Inherited from

[`CharacterData`](CharacterData.md).[`DOCUMENT_NODE`](CharacterData.md#document_node)

***

### ELEMENT\_NODE

> `readonly` **ELEMENT\_NODE**: `1` = `1`

#### Inherited from

[`CharacterData`](CharacterData.md).[`ELEMENT_NODE`](CharacterData.md#element_node)

***

### model

> `protected` **model**: [`ModelNode`](../../model/xml-api-model/classes/ModelNode.md)

#### Inherited from

[`CharacterData`](CharacterData.md).[`model`](CharacterData.md#model)

***

### ownerDocument

> **ownerDocument**: [`Document`](Document.md) \| `null`

#### Inherited from

[`CharacterData`](CharacterData.md).[`ownerDocument`](CharacterData.md#ownerdocument)

***

### TEXT\_NODE

> `readonly` **TEXT\_NODE**: `3` = `3`

#### Inherited from

[`CharacterData`](CharacterData.md).[`TEXT_NODE`](CharacterData.md#text_node)

## Accessors

### childNodes

#### Get Signature

> **get** **childNodes**(): [`NodeList`](NodeList.md)

Returns a NodeList containing all children of this node.

##### Returns

[`NodeList`](NodeList.md)

#### Inherited from

[`CharacterData`](CharacterData.md).[`childNodes`](CharacterData.md#childnodes)

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

#### Inherited from

[`CharacterData`](CharacterData.md).[`data`](CharacterData.md#data)

***

### firstChild

#### Get Signature

> **get** **firstChild**(): [`Node`](Node.md) \| `null`

##### Returns

[`Node`](Node.md) \| `null`

#### Inherited from

[`CharacterData`](CharacterData.md).[`firstChild`](CharacterData.md#firstchild)

***

### lastChild

#### Get Signature

> **get** **lastChild**(): [`Node`](Node.md) \| `null`

##### Returns

[`Node`](Node.md) \| `null`

#### Inherited from

[`CharacterData`](CharacterData.md).[`lastChild`](CharacterData.md#lastchild)

***

### length

#### Get Signature

> **get** **length**(): `number`

##### Returns

`number`

#### Inherited from

[`CharacterData`](CharacterData.md).[`length`](CharacterData.md#length)

***

### nextSibling

#### Get Signature

> **get** **nextSibling**(): [`Node`](Node.md) \| `null`

##### Returns

[`Node`](Node.md) \| `null`

#### Inherited from

[`CharacterData`](CharacterData.md).[`nextSibling`](CharacterData.md#nextsibling)

***

### nodeName

#### Get Signature

> **get** **nodeName**(): `string`

##### Returns

`string`

#### Overrides

[`CharacterData`](CharacterData.md).[`nodeName`](CharacterData.md#nodename)

***

### nodeType

#### Get Signature

> **get** **nodeType**(): `number`

##### Returns

`number`

#### Overrides

[`CharacterData`](CharacterData.md).[`nodeType`](CharacterData.md#nodetype)

***

### parentNode

#### Get Signature

> **get** **parentNode**(): [`Node`](Node.md) \| `null`

Returns the parent of this node.

##### Returns

[`Node`](Node.md) \| `null`

#### Inherited from

[`CharacterData`](CharacterData.md).[`parentNode`](CharacterData.md#parentnode)

***

### previousSibling

#### Get Signature

> **get** **previousSibling**(): [`Node`](Node.md) \| `null`

##### Returns

[`Node`](Node.md) \| `null`

#### Inherited from

[`CharacterData`](CharacterData.md).[`previousSibling`](CharacterData.md#previoussibling)

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

[`CharacterData`](CharacterData.md).[`textContent`](CharacterData.md#textcontent)

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

[`CharacterData`](CharacterData.md).[`appendChild`](CharacterData.md#appendchild)

***

### getModel()

> **getModel**(): [`ModelNode`](../../model/xml-api-model/classes/ModelNode.md)

#### Returns

[`ModelNode`](../../model/xml-api-model/classes/ModelNode.md)

#### Inherited from

[`CharacterData`](CharacterData.md).[`getModel`](CharacterData.md#getmodel)
