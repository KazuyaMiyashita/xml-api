[**@miy2/xml-api**](../../../README.md)

***

# Class: ModelText

## Extends

- [`ModelNode`](ModelNode.md)

## Constructors

### Constructor

> **new ModelText**(`text`): `ModelText`

#### Parameters

##### text

`string`

#### Returns

`ModelText`

#### Overrides

[`ModelNode`](ModelNode.md).[`constructor`](ModelNode.md#constructor)

## Properties

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

> **parent**: [`ModelElement`](ModelElement.md) \| `null` = `null`

#### Inherited from

[`ModelNode`](ModelNode.md).[`parent`](ModelNode.md#parent)

***

### text

> **text**: `string`

## Methods

### clone()

> **clone**(`preserveId`): `ModelText`

#### Parameters

##### preserveId

`boolean` = `false`

#### Returns

`ModelText`

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

### getType()

> **getType**(): [`ModelNodeType`](../enumerations/ModelNodeType.md)

#### Returns

[`ModelNodeType`](../enumerations/ModelNodeType.md)

#### Overrides

[`ModelNode`](ModelNode.md).[`getType`](ModelNode.md#gettype)
