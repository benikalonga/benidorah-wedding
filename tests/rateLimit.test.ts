import { describe, it, expect } from 'vitest';
import { rateLimit } from '@/lib/rateLimit';

describe('rate limiting (RSVP / moments / gift contribution abuse guard)', () => {
  it('allows requests under the limit and blocks once exceeded', () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    }
    expect(rateLimit(key, 3, 60_000).allowed).toBe(false);
  });

  it('tracks separate keys independently', () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(rateLimit(a, 1, 60_000).allowed).toBe(true);
    expect(rateLimit(b, 1, 60_000).allowed).toBe(true);
    expect(rateLimit(a, 1, 60_000).allowed).toBe(false);
  });
});
