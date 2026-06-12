export class AiHistoryManager {
  constructor(onChange) {
    this.versions = [];
    this.index = -1;
    this.onChange = onChange;
  }

  get current() {
    return this.index >= 0 ? this.versions[this.index] : null;
  }

  get state() {
    return { versions: [...this.versions], index: this.index, current: this.current };
  }

  add(version) {
    this.versions = this.versions.slice(0, this.index + 1);
    this.versions.push(version);
    this.index = this.versions.length - 1;
    this.notify();
  }

  clear() {
    this.versions = [];
    this.index = -1;
    this.notify();
  }

  undo() {
    if (this.index <= 0) return false;
    this.index -= 1;
    this.notify();
    return true;
  }

  redo() {
    if (this.index >= this.versions.length - 1) return false;
    this.index += 1;
    this.notify();
    return true;
  }

  notify() {
    this.onChange?.(this.state);
  }
}
