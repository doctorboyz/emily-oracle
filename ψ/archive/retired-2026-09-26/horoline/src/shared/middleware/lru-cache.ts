export class LRUCache<K, V> {
  private map = new Map<K, { value: V; lastAccess: number }>();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize: number, ttlMs: number) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.lastAccess > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    entry.lastAccess = Date.now();
    // Re-insert to maintain LRU order
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      // Evict oldest
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { value, lastAccess: Date.now() });
  }

  delete(key: K): void {
    this.map.delete(key);
  }

  get size(): number {
    return this.map.size;
  }
}
