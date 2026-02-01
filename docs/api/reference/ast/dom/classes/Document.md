[**xml-api**](../../../README.md)

***

# Class: Document

Represents the entire XML document.

## Extends

- [`Node`](Node.md)

## Constructors

### Constructor

> **new Document**(): `Document`

#### Returns

`Document`

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

> `protected` **model**: [`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

#### Inherited from

[`Node`](Node.md).[`model`](Node.md#model)

***

### ownerDocument

> **ownerDocument**: `Document` \| `null`

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

### documentElement

#### Get Signature

> **get** **documentElement**(): [`Element`](Element.md) \| `null`

##### Returns

[`Element`](Element.md) \| `null`

#### Set Signature

> **set** **documentElement**(`element`): `void`

##### Parameters

###### element

[`Element`](Element.md) | `null`

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

### createCDATASection()

> **createCDATASection**(`data`): [`CDATASection`](CDATASection.md)

#### Parameters

##### data

`string`

#### Returns

[`CDATASection`](CDATASection.md)

***

### createComment()

> **createComment**(`data`): [`Comment`](Comment.md)

#### Parameters

##### data

`string`

#### Returns

[`Comment`](Comment.md)

***

### createElement()

> **createElement**(`tagName`): [`Element`](Element.md)

#### Parameters

##### tagName

`string`

#### Returns

[`Element`](Element.md)

***

### createTextNode()

> **createTextNode**(`data`): [`Text`](Text.md)

#### Parameters

##### data

`string`

#### Returns

[`Text`](Text.md)

***

### getModel()

> **getModel**(): [`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

#### Returns

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

#### Inherited from

[`Node`](Node.md).[`getModel`](Node.md#getmodel)

***

### notifyAttributeChange()

> **notifyAttributeChange**(`element`, `name`, `value`): `void`

#### Parameters

##### element

[`Element`](Element.md)

##### name

`string`

##### value

`string` | `null`

#### Returns

`void`

***

### notifyChildAdded()

> **notifyChildAdded**(`parent`, `child`, `index`): `void`

#### Parameters

##### parent

[`Node`](Node.md)

##### child

[`Node`](Node.md)

##### index

`number`

#### Returns

`void`

***

### notifyElementTextChange()

> **notifyElementTextChange**(`element`, `text`): `void`

#### Parameters

##### element

[`Element`](Element.md)

##### text

`string`

#### Returns

`void`

***

### notifyTextChange()

> **notifyTextChange**(`node`, `text`): `void`

#### Parameters

##### node

[`CharacterData`](CharacterData.md)

##### text

`string`

#### Returns

`void`

***

### querySelector()

> **querySelector**(`selector`): [`Element`](Element.md) \| `null`

#### Parameters

##### selector

`string`

#### Returns

[`Element`](Element.md) \| `null`

***

### querySelectorAll()

> **querySelectorAll**(`selector`): [`NodeList`](NodeList.md)

#### Parameters

##### selector

`string`

#### Returns

[`NodeList`](NodeList.md)

***

### setObserver()

> **setObserver**(`observer`): `void`

Sets the observer to listen for DOM changes.

#### Parameters

##### observer

[`DOMObserver`](../interfaces/DOMObserver.md)

#### Returns

`void`
