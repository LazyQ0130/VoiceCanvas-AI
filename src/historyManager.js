export class HistoryManager {
  constructor(onChange) {
    this.snapshots = [[]];
    this.index = 0;
    this.onChange = onChange;
  }

  get operations() {
    return this.snapshots[this.index];
  }

  addGroup(group) {
    const next = [...this.operations, group];
    this.snapshots = this.snapshots.slice(0, this.index + 1);
    this.snapshots.push(next);
    this.index += 1;
    this.notify();
  }

  clear() {
    this.snapshots = this.snapshots.slice(0, this.index + 1);
    this.snapshots.push([]);
    this.index += 1;
    this.notify();
  }

  undo() {
    if (this.index === 0) return false;
    this.index -= 1;
    this.notify();
    return true;
  }

  redo() {
    if (this.index >= this.snapshots.length - 1) return false;
    this.index += 1;
    this.notify();
    return true;
  }

  notify() {
    this.onChange?.(this.operations);
  }
}
