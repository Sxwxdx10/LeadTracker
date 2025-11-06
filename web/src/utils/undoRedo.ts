// Undo/Redo utility for Kanban operations

export interface HistoryAction {
  type: 'move' | 'status_change' | 'bulk_move' | 'delete' | 'update';
  description: string;
  timestamp: number;
  data: any;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

export class UndoRedoManager {
  private history: HistoryAction[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  // Add action to history
  addAction(action: HistoryAction): void {
    // Remove any actions after current index (when undoing then doing new action)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new action
    this.history.push(action);
    this.currentIndex++;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  // Undo last action
  async undo(): Promise<boolean> {
    if (!this.canUndo()) return false;

    const action = this.history[this.currentIndex];
    await action.undo();
    this.currentIndex--;
    return true;
  }

  // Redo last undone action
  async redo(): Promise<boolean> {
    if (!this.canRedo()) return false;

    this.currentIndex++;
    const action = this.history[this.currentIndex];
    await action.redo();
    return true;
  }

  // Check if undo is possible
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  // Check if redo is possible
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  // Clear history
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  // Get current action description
  getCurrentAction(): HistoryAction | null {
    return this.currentIndex >= 0 ? this.history[this.currentIndex] : null;
  }

  // Get undo description
  getUndoDescription(): string | null {
    if (!this.canUndo()) return null;
    return `Annuler: ${this.history[this.currentIndex].description}`;
  }

  // Get redo description
  getRedoDescription(): string | null {
    if (!this.canRedo()) return null;
    return `Refaire: ${this.history[this.currentIndex + 1].description}`;
  }
}

