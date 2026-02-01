[**xml-api**](../../README.md)

***

# Class: HistoryManager

## Constructors

### Constructor

> **new HistoryManager**(`maxHistory`): `HistoryManager`

#### Parameters

##### maxHistory

`number` = `100`

#### Returns

`HistoryManager`

## Methods

### canRedo()

> **canRedo**(): `boolean`

#### Returns

`boolean`

***

### canUndo()

> **canUndo**(): `boolean`

#### Returns

`boolean`

***

### push()

> **push**(`transaction`): `void`

#### Parameters

##### transaction

[`Transaction`](../interfaces/Transaction.md)

#### Returns

`void`

***

### redo()

> **redo**(): [`Transaction`](../interfaces/Transaction.md) \| `null`

#### Returns

[`Transaction`](../interfaces/Transaction.md) \| `null`

***

### undo()

> **undo**(): [`Transaction`](../interfaces/Transaction.md) \| `null`

#### Returns

[`Transaction`](../interfaces/Transaction.md) \| `null`
