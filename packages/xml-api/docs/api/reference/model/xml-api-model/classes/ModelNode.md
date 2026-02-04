[**@miy2/xml-api**](../../../README.md)

***

# Abstract Class: ModelNode

## Extended by

- [`ModelElement`](ModelElement.md)
- [`ModelText`](ModelText.md)
- [`ModelComment`](ModelComment.md)
- [`ModelCDATA`](ModelCDATA.md)

## Constructors

### Constructor

> **new ModelNode**(`id?`): `ModelNode`

#### Parameters

##### id?

`string`

#### Returns

`ModelNode`

## Properties

### cst

> **cst**: [`CST`](../../../cst/xml-cst/classes/CST.md) \| `null` = `null`

***

### formatting

> **formatting**: [`ModelFormatting`](../interfaces/ModelFormatting.md)

***

### id

> `readonly` **id**: `string`

***

### parent

> **parent**: [`ModelElement`](ModelElement.md) \| `null` = `null`

## Methods

### clone()

> `abstract` **clone**(`preserveId?`): `ModelNode`

#### Parameters

##### preserveId?

`boolean`

#### Returns

`ModelNode`

***

### cloneBase()

> `protected` **cloneBase**(`target`, `_preserveId`): `void`

#### Parameters

##### target

`ModelNode`

##### \_preserveId

`boolean`

#### Returns

`void`

***

### findNodeById()

> **findNodeById**(`id`): `ModelNode` \| `null`

#### Parameters

##### id

`string`

#### Returns

`ModelNode` \| `null`

***

### getType()

> `abstract` **getType**(): [`ModelNodeType`](../enumerations/ModelNodeType.md)

#### Returns

[`ModelNodeType`](../enumerations/ModelNodeType.md)
