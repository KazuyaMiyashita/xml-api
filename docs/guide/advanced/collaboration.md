# Collaboration

`xml-api` is designed to support real-time collaboration using CRDTs (Conflict-free Replicated Data Types) like [Yjs](https://github.com/yjs/yjs) or [Automerge](https://github.com/automerge/automerge).

## CollabBridge

The `CollabBridge` interface allows you to hook into the synchronization pipeline.

```typescript
import { CollabBridge, Transaction } from '@miy2/xml-api';
class YjsBridge implements CollabBridge {
  constructor(private yDoc: Y.Doc) {}

  receiveLocalTransaction(tr: Transaction) {
    // 1. Convert Transaction patches to Yjs operations
    // 2. Apply to Y.Text or Y.XmlFragment
  }
}

// Register the bridge
api.engine.setCollabBridge(new YjsBridge(yDoc));
```

## Remote Changes

When receiving changes from a remote peer (e.g. via Yjs provider):

1.  Apply the changes to your local CRDT store.
2.  Construct a `Transaction` representing the change in the source text.
3.  Set `tr.isRemote = true` to prevent echo-back (infinite loops).
4.  Dispatch the transaction.

```typescript
yText.observe(event => {
  if (event.transaction.local) return; // Ignore local changes

  const tr = new Transaction(api.engine.state);
  // ... map Yjs delta to tr.replace() ...
  tr.isRemote = true;
  api.engine.dispatch(tr);
});
```
