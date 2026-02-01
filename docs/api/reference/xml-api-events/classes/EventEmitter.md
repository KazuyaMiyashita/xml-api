[**@miy2/xml-api**](../../README.md)

***

# Class: EventEmitter

Internal event emitter for managing listeners.

## Constructors

### Constructor

> **new EventEmitter**(): `EventEmitter`

#### Returns

`EventEmitter`

## Methods

### emit()

> **emit**(`event`): `void`

#### Parameters

##### event

[`ChangeEvent`](../type-aliases/ChangeEvent.md)

#### Returns

`void`

***

### off()

> **off**(`handler`): `void`

#### Parameters

##### handler

[`EventHandler`](../type-aliases/EventHandler.md)

#### Returns

`void`

***

### on()

> **on**(`handler`): () => `void`

Registers an event handler.

#### Parameters

##### handler

[`EventHandler`](../type-aliases/EventHandler.md)

The callback function.

#### Returns

A function to unsubscribe the handler.

> (): `void`

##### Returns

`void`
