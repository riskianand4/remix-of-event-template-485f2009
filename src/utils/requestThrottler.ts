// Simplified request throttler - no-op for PSBLink
class SimpleRequestThrottler {
  canMakeRequest(_endpoint: string): boolean {
    return true;
  }
  recordRequest(_endpoint: string) {}
}

export const globalRequestThrottler = new SimpleRequestThrottler();
