export interface Transaction {
  // The operation that was performed (for redo)
  redo: {
    from: number;
    to: number;
    text: string;
  };
  // The operation to reverse it (for undo)
  undo: {
    from: number;
    to: number; // This 'to' is calculated based on the length of the replaced text in the NEW state
    text: string;
  };
}

export class HistoryManager {
  private undoStack: Transaction[] = [];
  private redoStack: Transaction[] = [];
  private maxHistory: number;

  constructor(maxHistory: number = 100) {
    this.maxHistory = maxHistory;
  }

  public push(transaction: Transaction): void {
    this.undoStack.push(transaction);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo stack on new operation
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
