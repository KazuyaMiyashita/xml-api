import type { Transaction } from "../engine/transaction";

/**
 * Interface for connecting the SyncEngine to an external collaboration system (e.g., Yjs, Automerge).
 */
export interface CollabBridge {
  /**
   * Called by SyncEngine when a local transaction is successfully dispatched.
   * The bridge implementations should convert this transaction into CRDT operations and broadcast them.
   *
   * @param tr The committed transaction.
   */
  receiveLocalTransaction(tr: Transaction): void;
}
