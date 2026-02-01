[**xml-api**](../../../README.md)

***

# Interface: CollabBridge

Interface for connecting the SyncEngine to an external collaboration system (e.g., Yjs, Automerge).

## Methods

### receiveLocalTransaction()

> **receiveLocalTransaction**(`tr`): `void`

Called by SyncEngine when a local transaction is successfully dispatched.
The bridge implementations should convert this transaction into CRDT operations and broadcast them.

#### Parameters

##### tr

[`Transaction`](../../../engine/transaction/classes/Transaction.md)

The committed transaction.

#### Returns

`void`
