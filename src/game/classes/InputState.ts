import { EventBus } from "../EventBus";

// First, let's create an InputState manager
export class InputState {
  private static instance: InputState;
  private _isLocked: boolean = false;
  private _lockSources: Set<string> = new Set();

  private constructor() {}

  static getInstance(): InputState {
    if (!InputState.instance) {
      InputState.instance = new InputState();
    }
    return InputState.instance;
  }

  public lock(source: string): void {
    const wasLocked = this._isLocked;
    this._lockSources.add(source);
    this._isLocked = true;

    if (!wasLocked) {
      EventBus.emit("input-locked", { source });
    }
  }

  public unlock(source: string): void {
    this._lockSources.delete(source);
    const wasLocked = this._isLocked;
    this._isLocked = this._lockSources.size > 0;

    if (wasLocked && !this._isLocked) {
      EventBus.emit("input-unlocked", { source });
    }
  }

  public get isLocked(): boolean {
    return this._isLocked;
  }

  public get lockSources(): string[] {
    return Array.from(this._lockSources);
  }
}

