// Simplified circuit breaker - no-op for PSBLink
class SimpleCircuitBreaker {
  execute<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
  reset() {}
}

class SimpleDeduplicator {
  deduplicate<T>(_key: string, fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}

export const apiCircuitBreakers = {
  products: new SimpleCircuitBreaker(),
  analytics: new SimpleCircuitBreaker(),
  auth: new SimpleCircuitBreaker(),
};

export const requestDeduplicator = new SimpleDeduplicator();
