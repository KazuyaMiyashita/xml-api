[**@miy2/xml-api**](../../../README.md)

***

# Class: SyncEngine

The core engine that manages the editor state and coordinates synchronization.

It implements a transaction-based update cycle:
1. Receives a `Transaction` describing changes.
2. Updates the `EditorState` (Source).
3. Triggers the `Parser` (Source -> CST).
4. Triggers the `XMLBinder` (CST -> Model).
5. Notifies listeners (including `SchemaView`s) of changes.

## Constructors

### Constructor

> **new SyncEngine**(`source`, `grammar`): `SyncEngine`

#### Parameters

##### source

`string`

##### grammar

[`Grammar`](../../../cst/grammar/classes/Grammar.md) = `defaultGrammar`

#### Returns

`SyncEngine`

## Accessors

### cst

#### Get Signature

> **get** **cst**(): [`CST`](../../../cst/xml-cst/classes/CST.md) \| `null`

##### Returns

[`CST`](../../../cst/xml-cst/classes/CST.md) \| `null`

***

### grammar

#### Get Signature

> **get** **grammar**(): [`Grammar`](../../../cst/grammar/classes/Grammar.md)

##### Returns

[`Grammar`](../../../cst/grammar/classes/Grammar.md)

***

### model

#### Get Signature

> **get** **model**(): [`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md) \| `null`

##### Returns

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md) \| `null`

***

### source

#### Get Signature

> **get** **source**(): `string`

##### Returns

`string`

***

### state

#### Get Signature

> **get** **state**(): [`EditorState`](../../editor-state/classes/EditorState.md)

##### Returns

[`EditorState`](../../editor-state/classes/EditorState.md)

## Methods

### ~~applyPatch()~~

> **applyPatch**(`start`, `end`, `text`, `meta?`): `void`

Apply a programmatic change derived from Model operations.
This is the "Application -> Source" flow.

#### Parameters

##### start

`number`

##### end

`number`

##### text

`string`

##### meta?

`Record`\<`string`, `any`\>

#### Returns

`void`

#### Deprecated

Use `dispatch(new Transaction(state).replace(...))` instead.

***

### dispatch()

> **dispatch**(`tr`): `void`

Applies a transaction to the engine, updating the state and notifying listeners.
This is the single point of truth for all state transitions in the system.

It handles:
- History recording (Undo/Redo)
- Incremental Parsing and Reconciliation
- Event Dispatching
- Collaboration hooks

#### Parameters

##### tr

[`Transaction`](../../transaction/classes/Transaction.md)

The transaction to apply.

#### Returns

`void`

***

### ~~insertNode()~~

> **insertNode**(`parent`, `child`, `index`, `meta?`): `void`

#### Parameters

##### parent

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md)

##### child

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

##### index

`number`

##### meta?

`Record`\<`string`, `any`\>

#### Returns

`void`

#### Deprecated

Use `dispatch(new TransactionBuilder(engine.state, engine.binder).insertNode(...))` instead.

***

### on()

> **on**(`handler`): () => `void`

Subscribe to model changes.

#### Parameters

##### handler

[`EventHandler`](../../../xml-api-events/type-aliases/EventHandler.md)

#### Returns

> (): `void`

##### Returns

`void`

***

### redo()

> **redo**(): `void`

#### Returns

`void`

***

### ~~removeNode()~~

> **removeNode**(`parent`, `child`, `meta?`): `void`

#### Parameters

##### parent

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md)

##### child

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

##### meta?

`Record`\<`string`, `any`\>

#### Returns

`void`

#### Deprecated

Use `dispatch(new TransactionBuilder(engine.state, engine.binder).removeNode(...))` instead.

***

### ~~replaceNode()~~

> **replaceNode**(`target`, `content`, `meta?`): `void`

#### Parameters

##### target

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

##### content

[`ModelNode`](../../../model/xml-api-model/classes/ModelNode.md)

##### meta?

`Record`\<`string`, `any`\>

#### Returns

`void`

#### Deprecated

Use `dispatch(new TransactionBuilder(engine.state, engine.binder).replaceNode(...))` instead.

***

### ~~setAttribute()~~

> **setAttribute**(`modelNode`, `key`, `value`, `meta?`): `void`

#### Parameters

##### modelNode

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md)

##### key

`string`

##### value

`string`

##### meta?

`Record`\<`string`, `any`\>

#### Returns

`void`

#### Deprecated

Use `dispatch(new TransactionBuilder(engine.state, engine.binder).setAttribute(...))` instead.

***

### setCollabBridge()

> **setCollabBridge**(`bridge`): `void`

#### Parameters

##### bridge

[`CollabBridge`](../../../collab/bridge/interfaces/CollabBridge.md)

#### Returns

`void`

***

### undo()

> **undo**(): `void`

#### Returns

`void`

***

### updateSource()

> **updateSource**(`from`, `to`, `text`, `meta?`): `void`

Update the source code (e.g. from text editor).
Handles history recording and incremental parsing.

#### Parameters

##### from

`number`

##### to

`number`

##### text

`string`

##### meta?

`Record`\<`string`, `any`\>

#### Returns

`void`

***

### ~~updateText()~~

> **updateText**(`modelNode`, `text`, `meta?`): `void`

#### Parameters

##### modelNode

[`ModelElement`](../../../model/xml-api-model/classes/ModelElement.md)

##### text

`string`

##### meta?

`Record`\<`string`, `any`\>

#### Returns

`void`

#### Deprecated

Use `dispatch(new TransactionBuilder(engine.state, engine.binder).updateText(...))` instead.
