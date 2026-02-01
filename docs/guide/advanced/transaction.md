# Transaction System

The `Transaction` system is the heart of `xml-api`'s state management. It allows for atomic, predictable updates to the editor state.

## Concept

Instead of mutating the state directly, you create a **Transaction** that describes the changes you want to make. The `SyncEngine` then processes this transaction to produce a new state.

```typescript
// 1. Create a transaction from the current state
const tr = new Transaction(api.engine.state);

// 2. Add changes (e.g. text replacement)
tr.replace(start, end, "New Text");

// 3. Dispatch the transaction
api.engine.dispatch(tr);
```

## Immutable State

The `EditorState` is immutable. When a transaction is dispatched:
1. A new source string is calculated.
2. The Parser updates the CST (incrementally if possible).
3. The Binder reconciles the Model.
4. A new `EditorState` instance is created and stored in the engine.

## Advanced Usage

Since transactions are objects, they can be:
- Queued
- Transformed (for collaboration)
- Inspected (for logging or undo/redo)

### Batch Updates

You can perform multiple updates in a single transaction, ensuring they are applied atomically and trigger only one re-parse/re-render cycle.

```typescript
const tr = new Transaction(api.engine.state);
tr.replace(0, 5, "Hello");
tr.replace(10, 15, "World");
api.engine.dispatch(tr);
```
