[**@miy2/xml-api**](../../../README.md)

***

# Class: ModelComment

## Extends

- [`ModelNode`](ModelNode.md)

## Constructors

### Constructor

> **new ModelComment**(`content`): `ModelComment`

#### Parameters

##### content

`string`

#### Returns

`ModelComment`

#### Overrides

[`ModelNode`](ModelNode.md).[`constructor`](ModelNode.md#constructor)

## Properties

### content

> **content**: `string`

***

### cst

> **cst**: [`CST`](../../../cst/xml-cst/classes/CST.md) \| `null` = `null`

#### Inherited from

[`ModelNode`](ModelNode.md).[`cst`](ModelNode.md#cst)

***

### formatting

> **formatting**: [`ModelFormatting`](../interfaces/ModelFormatting.md)

#### Inherited from

[`ModelNode`](ModelNode.md).[`formatting`](ModelNode.md#formatting)

***

### id

> `readonly` **id**: `string`

#### Inherited from

[`ModelNode`](ModelNode.md).[`id`](ModelNode.md#id)

***

### parent

> **parent**: [`ModelElement`](ModelElement.md) \| `null` = `null`

#### Inherited from

[`ModelNode`](ModelNode.md).[`parent`](ModelNode.md#parent)

## Methods

### clone()

> **clone**(`preserveId`): `ModelComment`

#### Parameters

##### preserveId

`boolean` = `false`

#### Returns

`ModelComment`

#### Overrides

[`ModelNode`](ModelNode.md).[`clone`](ModelNode.md#clone)

***

### cloneBase()

> `protected` **cloneBase**(`target`, `preserveId`): `void`

#### Parameters

##### target

[`ModelNode`](ModelNode.md)

##### preserveId

`boolean`

#### Returns

`void`

#### Inherited from

[`ModelNode`](ModelNode.md).[`cloneBase`](ModelNode.md#clonebase)

***

### findNodeById()

> **findNodeById**(`id`): [`ModelNode`](ModelNode.md) \| `null`

#### Parameters

##### id

`string`

#### Returns

[`ModelNode`](ModelNode.md) \| `null`

#### Inherited from

[`ModelNode`](ModelNode.md).[`findNodeById`](ModelNode.md#findnodebyid)

***

### getType()

> **getType**(): [`ModelNodeType`](../enumerations/ModelNodeType.md)

#### Returns

[`ModelNodeType`](../enumerations/ModelNodeType.md)

#### Overrides

[`ModelNode`](ModelNode.md).[`getType`](ModelNode.md#gettype)
