
import { ShapeData } from '../types';

export interface HistoryState {
  shapes: ShapeData[];
  selectedIds: string[];
}

export class HistoryManager {
  private past: HistoryState[] = [];
  private future: HistoryState[] = [];
  private maxHistory = 100;

  push(state: HistoryState) {
    this.past.push(JSON.parse(JSON.stringify(state)));
    this.future = [];
    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }
  }

  undo(currentState: HistoryState): HistoryState | null {
    if (this.past.length === 0) return null;
    this.future.push(JSON.parse(JSON.stringify(currentState)));
    return this.past.pop()!;
  }

  redo(currentState: HistoryState): HistoryState | null {
    if (this.future.length === 0) return null;
    this.past.push(JSON.parse(JSON.stringify(currentState)));
    return this.future.pop()!;
  }

  canUndo(): boolean { return this.past.length > 0; }
  canRedo(): boolean { return this.future.length > 0; }

  clear() {
    this.past = [];
    this.future = [];
  }
}
