[**xml-api**](../../../README.md)

***

# Abstract Class: ModelNode

## Extended by

- [`ModelElement`](ModelElement.md)
- [`ModelText`](ModelText.md)
- [`ModelComment`](ModelComment.md)
- [`ModelCDATA`](ModelCDATA.md)

## Constructors

### Constructor

> **new ModelNode**(): `ModelNode`

#### Returns

`ModelNode`

## Properties

### cst

> **cst**: [`CST`](../../../cst/xml-cst/classes/CST.md) \| `null` = `null`

***

### id

> `readonly` **id**: `string`

***

### parent

> **parent**: [`ModelElement`](ModelElement.md) \| `null` = `null`

## Methods

### getType()

> `abstract` **getType**(): [`ModelNodeType`](../enumerations/ModelNodeType.md)

#### Returns

[`ModelNodeType`](../enumerations/ModelNodeType.md)
