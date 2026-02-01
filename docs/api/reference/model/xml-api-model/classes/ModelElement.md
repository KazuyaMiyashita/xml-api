[**xml-api**](../../../README.md)

***

# Class: ModelElement

## Extends

- [`ModelNode`](ModelNode.md)

## Constructors

### Constructor

> **new ModelElement**(`tagName`): `ModelElement`

#### Parameters

##### tagName

`string`

#### Returns

`ModelElement`

#### Overrides

[`ModelNode`](ModelNode.md).[`constructor`](ModelNode.md#constructor)

## Properties

### attributes

> **attributes**: `Map`\<`string`, `string`\>

***

### children

> **children**: [`ModelNode`](ModelNode.md)[] = `[]`

***

### cst

> **cst**: [`CST`](../../../cst/xml-cst/classes/CST.md) \| `null` = `null`

#### Inherited from

[`ModelNode`](ModelNode.md).[`cst`](ModelNode.md#cst)

***

### id

> `readonly` **id**: `string`

#### Inherited from

[`ModelNode`](ModelNode.md).[`id`](ModelNode.md#id)

***

### parent

> **parent**: `ModelElement` \| `null` = `null`

#### Inherited from

[`ModelNode`](ModelNode.md).[`parent`](ModelNode.md#parent)

***

### tagName

> **tagName**: `string`

## Methods

### addChild()

> **addChild**(`node`): `void`

#### Parameters

##### node

[`ModelNode`](ModelNode.md)

#### Returns

`void`

***

### getType()

> **getType**(): [`ModelNodeType`](../enumerations/ModelNodeType.md)

#### Returns

[`ModelNodeType`](../enumerations/ModelNodeType.md)

#### Overrides

[`ModelNode`](ModelNode.md).[`getType`](ModelNode.md#gettype)

***

### setAttribute()

> **setAttribute**(`key`, `value`): `void`

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`void`
