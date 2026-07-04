import { ReplayGuard } from '../handler';

// ReplayGuard reads config.replayProtectionEnabled at runtime, which defaults to true in test setup.
describe('ReplayGuard', () => {
  let guard: ReplayGuard;

  beforeEach(() => {
    guard = new ReplayGuard();
  });

  it('returns true for a fresh nonce', () => {
    expect(guard.checkAndMark('fp-1', 'nonce-1', 1000, 5000)).toBe(true);
  });

  it('returns false for a duplicate nonce', () => {
    expect(guard.checkAndMark('fp-1', 'nonce-1', 1000, 5000)).toBe(true);
    expect(guard.checkAndMark('fp-1', 'nonce-1', 2000, 5000)).toBe(false);
  });

  it('allows same nonce for different fingerprints', () => {
    expect(guard.checkAndMark('fp-1', 'nonce-1', 1000, 5000)).toBe(true);
    expect(guard.checkAndMark('fp-2', 'nonce-1', 1000, 5000)).toBe(true);
  });

  it('re-allows an expired nonce', () => {
    expect(guard.checkAndMark('fp-1', 'nonce-1', 1000, 5000)).toBe(true);
    // After TTL passes, the nonce entry should be pruned and re-allowed
    expect(guard.checkAndMark('fp-1', 'nonce-1', 7000, 5000)).toBe(true);
  });

  it('purges all data for a fingerprint', () => {
    expect(guard.checkAndMark('fp-1', 'nonce-1', 1000, 5000)).toBe(true);
    guard.purge('fp-1');
    expect(guard.checkAndMark('fp-1', 'nonce-1', 1000, 5000)).toBe(true);
  });
});
