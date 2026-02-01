[**xml-api**](../../../README.md)

***

# Class: Parser

## Constructors

### Constructor

> **new Parser**(`grammar`): `Parser`

#### Parameters

##### grammar

[`Grammar`](../../grammar/classes/Grammar.md)

#### Returns

`Parser`

## Methods

### parse()

> **parse**(`input`, `rootRule?`): [`CST`](../../xml-cst/classes/CST.md) \| `null`

#### Parameters

##### input

`string`

##### rootRule?

`string`

#### Returns

[`CST`](../../xml-cst/classes/CST.md) \| `null`

***

### parseAt()

> **parseAt**(`input`, `pos`, `ruleName`): \{ `end`: `number`; `node`: [`CST`](../../xml-cst/classes/CST.md); \} \| `null`

Parses the input starting from a specific position using a given rule.
Useful for incremental parsing.

#### Parameters

##### input

`string`

##### pos

`number`

##### ruleName

`string`

#### Returns

\{ `end`: `number`; `node`: [`CST`](../../xml-cst/classes/CST.md); \} \| `null`
