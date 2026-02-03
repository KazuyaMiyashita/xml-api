[**@miy2/xml-api**](../../README.md)

***

# Class: Element

Represents an element in the XML document.

## Extends

- [`Node`](Node.md)

## Constructors

### Constructor

> **new Element**(`model`, `ownerDocument`): `Element`

#### Parameters

##### model

[`ModelElement`](../../model/xml-api-model/classes/ModelElement.md)

##### ownerDocument

[`Document`](Document.md) | `null`

#### Returns

`Element`

#### Overrides

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

> `protected` **model**: [`ModelElement`](../../model/xml-api-model/classes/ModelElement.md)

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

### localName

#### Get Signature

> **get** **localName**(): `string`

##### Returns

`string`

***

### namespaceURI

#### Get Signature

> **get** **namespaceURI**(): `string` \| `null`

##### Returns

`string` \| `null`

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

> **get** **nodeName**(): `string`

##### Returns

`string`

#### Overrides

[`Node`](Node.md).[`nodeName`](Node.md#nodename)

***

### nodeType

#### Get Signature

> **get** **nodeType**(): `number`

##### Returns

`number`

#### Overrides

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

### prefix

#### Get Signature

> **get** **prefix**(): `string` \| `null`

##### Returns

`string` \| `null`

***

### previousSibling

#### Get Signature

> **get** **previousSibling**(): [`Node`](Node.md) \| `null`

##### Returns

[`Node`](Node.md) \| `null`

#### Inherited from

[`Node`](Node.md).[`previousSibling`](Node.md#previoussibling)

***

### tagName

#### Get Signature

> **get** **tagName**(): `string`

##### Returns

`string`

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

[`Node`](Node.md).[`textContent`](Node.md#textcontent)

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

### getAttribute()

> **getAttribute**(`name`): `string` \| `null`

#### Parameters

##### name

`string`

#### Returns

`string` \| `null`

***

### getModel()

> **getModel**(): [`ModelNode`](../../model/xml-api-model/classes/ModelNode.md)

#### Returns

[`ModelNode`](../../model/xml-api-model/classes/ModelNode.md)

#### Inherited from

[`Node`](Node.md).[`getModel`](Node.md#getmodel)

***

### hasAttribute()

> **hasAttribute**(`name`): `boolean`

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### insertBefore()

> **insertBefore**\<`T`\>(`newChild`, `refChild`): `T`

Inserts a node before a reference node as a child of this node.

#### Type Parameters

##### T

`T` *extends* [`Node`](Node.md)

#### Parameters

##### newChild

`T`

The node to insert.

##### refChild

The reference node (must be a child of this node).

[`Node`](Node.md) | `null`

#### Returns

`T`

#### Inherited from

[`Node`](Node.md).[`insertBefore`](Node.md#insertbefore)

***

### querySelector()

> **querySelector**(`selector`): `Element` \| `null`

#### Parameters

##### selector

`string`

#### Returns

`Element` \| `null`

***

### querySelectorAll()

> **querySelectorAll**(`selector`): [`NodeList`](NodeList.md)

#### Parameters

##### selector

`string`

#### Returns

[`NodeList`](NodeList.md)

***

### removeAttribute()

> **removeAttribute**(`name`): `void`

#### Parameters

##### name

`string`

#### Returns

`void`

***

### removeChild()

> **removeChild**\<`T`\>(`child`): `T`

Removes a child node from the DOM and returns the removed node.

#### Type Parameters

##### T

`T` *extends* [`Node`](Node.md)

#### Parameters

##### child

`T`

The child node to remove.

#### Returns

`T`

#### Inherited from

[`Node`](Node.md).[`removeChild`](Node.md#removechild)

***

### setAttribute()

> **setAttribute**(`name`, `value`): `void`

#### Parameters

##### name

`string`

##### value

`string`

#### Returns

`void`
