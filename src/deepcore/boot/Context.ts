

export class BootContext {
  private data = new Map<string, any>();

  set<T>(key: string, value: T) {
    this.data.set(key, value);
  }

  get<T>(key: string): T | undefined {
    return this.data.get(key);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }
}

