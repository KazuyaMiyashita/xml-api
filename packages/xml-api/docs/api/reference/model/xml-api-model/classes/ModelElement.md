[**@miy2/xml-api**](../../../README.md)

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

### clone()

> **clone**(`preserveId`): `ModelElement`

#### Parameters

##### preserveId

`boolean` = `false`

#### Returns

`ModelElement`

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

### find()

> **find**(`tagName`): `ModelElement`[]

#### Parameters

##### tagName

`string`

#### Returns

`ModelElement`[]

***

### findNodeById()

> **findNodeById**(`id`): [`ModelNode`](ModelNode.md) \| `null`

#### Parameters

##### id

`string`

#### Returns

[`ModelNode`](ModelNode.md) \| `null`

#### Overrides

[`ModelNode`](ModelNode.md).[`findNodeById`](ModelNode.md#findnodebyid)

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

***

### text()

> **text**(): `string`

#### Returns

`string`
