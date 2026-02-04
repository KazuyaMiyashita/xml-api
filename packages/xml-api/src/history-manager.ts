export interface Transaction {
  timestamp: number;
  // The operation that was performed (for redo)
  redo: {
    from: number;
    to: number;
    text: string;
  };
  // The operation to reverse it (for undo)
  undo: {
    from: number;
    to: number;
    text: string;
  };
}

export class HistoryManager {
  private undoStack: Transaction[] = [];
  private redoStack: Transaction[] = [];
  private maxHistory: number;
  private mergeThreshold: number = 1000; // ms

  constructor(maxHistory: number = 100) {
    this.maxHistory = maxHistory;
  }

  public push(transaction: Transaction): void {
    const last = this.undoStack[this.undoStack.length - 1];

    if (last && this.shouldMerge(last, transaction)) {
      this.merge(last, transaction);
      return;
    }

    this.undoStack.push(transaction);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo stack on new operation
  }

  private shouldMerge(last: Transaction, next: Transaction): boolean {
    // Check time threshold
    if (next.timestamp - last.timestamp > this.mergeThreshold) return false;

    // Detect type of operation
    
    // Pattern 1: Incremental Insertion (CodeEditor / Typing)
    // Last: Insert "A" at 10. (from: 10, to: 10, text: "A")
    // Next: Insert "B" at 11. (from: 11, to: 11, text: "B")
    const isInsertion = 
      last.redo.from === last.redo.to && 
      next.redo.from === next.redo.to &&
      next.redo.from === last.redo.from + last.redo.text.length;

    if (isInsertion) return true;

    // Pattern 2: Replacement Extension (WYSIWYG / ViewBinder)
    // Last: Replace "A" with "AB" at 10. (from: 10, to: 11, text: "AB")
    // Next: Replace "AB" with "ABC" at 10. (from: 10, to: 12, text: "ABC")
    // Condition: Start position same.
    const isReplacementExtension = 
      last.redo.from === next.redo.from &&
      // Check if next is extending last
      next.redo.text.startsWith(last.redo.text) &&
      // Check if the previous state of next matches the current state of last
      next.undo.text === last.redo.text; 
      // Note: next.undo.text is the text that was replaced by next.
      // In Pattern 2, we replaced "AB" (last.redo.text) with "ABC".
      // So next.undo.text should be "AB".

    if (isReplacementExtension) return true;

    return false;
  }

  private merge(last: Transaction, next: Transaction): void {
    last.timestamp = next.timestamp;

    if (last.redo.from === last.redo.to && next.redo.from === next.redo.to) {
        // Pattern 1: Incremental Insertion
        // Last: Insert "A" at 10.
        // Next: Insert "B" at 11.
        // Merged: Insert "AB" at 10.
        
        last.redo.text += next.redo.text;
        
        // Undo:
        // Last Undo: Delete 10-11 ("A").
        // Next Undo: Delete 11-12 ("B").
        // Merged Undo: Delete 10-12.
        // The `to` of undo represents the end of the range to be replaced/deleted in the current doc.
        // last.undo.to needs to expand by the length of the new insertion.
        last.undo.to += next.redo.text.length;
        
        // last.undo.text remains same (usually empty for insertion)
    } else {
        // Pattern 2: Replacement Extension
        // Last: Replace "A" (10-11) with "AB". Redo: "AB". Undo: "A" (from 10, to 12).
        // Next: Replace "AB" (10-12) with "ABC". Redo: "ABC". Undo: "AB" (from 10, to 13).
        
        // Merged: Replace "A" (10-11) with "ABC".
        
        // Update Redo
        last.redo.text = next.redo.text;
        // last.redo.from/to remain as the original range of "A" (10-11).
        
        // Update Undo
        // We want undo to restore "A".
        // Current state is "ABC" (10-13).
        // Undo operation should be: replace 10-13 with "A".
        
        // last.undo.from is 10. Correct.
        // last.undo.text is "A". Correct.
        // last.undo.to needs to be 13.
        // next.undo.to is 13. (SyncEngine calculates this as from + text.length? No, SyncEngine calculates undo.to as newEnd)
        // SyncEngine: undo: { from: p.from, to: newEnd, text: oldText }
        // newEnd is the end of the newly inserted text.
        // So yes, next.undo.to is 13.
        
        last.undo.to = next.undo.to;
    }
  }

  public undo(): Transaction | null {
    const transaction = this.undoStack.pop();
    if (transaction) {
      this.redoStack.push(transaction);
      return transaction;
    }
    return null;
  }

  public redo(): Transaction | null {
    const transaction = this.redoStack.pop();
    if (transaction) {
      this.undoStack.push(transaction);
      return transaction;
    }
    return null;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
