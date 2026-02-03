[**@miy2/xml-api**](../../README.md)

***

# Class: EventEmitter\<E\>

Internal event emitter for managing listeners.

## Type Parameters

### E

`E` = [`ChangeEvent`](../type-aliases/ChangeEvent.md)

## Constructors

### Constructor

> **new EventEmitter**\<`E`\>(): `EventEmitter`\<`E`\>

#### Returns

`EventEmitter`\<`E`\>

## Methods

### emit()

> **emit**(`event`): `void`

#### Parameters

##### event

`E`

#### Returns

`void`

***

### off()

> **off**(`handler`): `void`

#### Parameters

##### handler

(`event`) => `void`

#### Returns

`void`

***

### on()

> **on**(`handler`): () => `void`

Registers an event handler.

#### Parameters

##### handler

(`event`) => `void`

The callback function.

#### Returns

A function to unsubscribe the handler.

> (): `void`

##### Returns

`void`
