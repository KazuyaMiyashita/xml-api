[**xml-api**](../../../README.md)

***

# Class: GrammarBuilder

## Constructors

### Constructor

> **new GrammarBuilder**(): `GrammarBuilder`

#### Returns

`GrammarBuilder`

## Methods

### build()

> **build**(`rootRule?`): [`Grammar`](Grammar.md)

#### Parameters

##### rootRule?

`string`

#### Returns

[`Grammar`](Grammar.md)

***

### rule()

> **rule**(`name`, `expression`): `void`

#### Parameters

##### name

`string`

##### expression

[`Expression`](../type-aliases/Expression.md)

#### Returns

`void`

***

### verifyRule()

> **verifyRule**(`name`, `validator`): `void`

#### Parameters

##### name

`string`

##### validator

[`Validator`](../type-aliases/Validator.md)

#### Returns

`void`
