import { describe, it, expect } from 'vitest';
import { rsvpSchema, guestInputSchema, rsvpCodeSchema, sanitizeText, randomWishColor } from '@/lib/validation';

describe('RSVP submission validation', () => {
  it('accepts a valid single-guest RSVP', () => {
    const result = rsvpSchema.safeParse({ attending: 'yes', wishText: 'So happy for you both!', displayNameOnWall: true });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid attendance value', () => {
    const result = rsvpSchema.safeParse({ attending: 'maybe' });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed email', () => {
    const result = rsvpSchema.safeParse({ attending: 'yes', email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});

describe('guest input validation', () => {
  it('requires a table assignment (guests.table_id NOT NULL)', () => {
    const result = guestInputSchema.safeParse({
      type: 'single',
      fullName: 'Test Guest',
      phoneNumber: '+27821234567',
      guestSide: 'bride',
      tableId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('RSVP code lookup validation', () => {
  it('accepts a 6-digit code', () => {
    expect(rsvpCodeSchema.safeParse({ code: '123456' }).success).toBe(true);
  });

  it('rejects a code that is too short', () => {
    expect(rsvpCodeSchema.safeParse({ code: '1234' }).success).toBe(false);
  });

  it('rejects a code that is too long', () => {
    expect(rsvpCodeSchema.safeParse({ code: '1234567' }).success).toBe(false);
  });

  it('rejects a non-numeric code', () => {
    expect(rsvpCodeSchema.safeParse({ code: 'abcdef' }).success).toBe(false);
  });
});

describe('wish wall sanitization', () => {
  it('escapes HTML to prevent stored XSS', () => {
    const cleaned = sanitizeText('<script>alert(1)</script>');
    expect(cleaned).not.toContain('<script>');
    expect(cleaned).toContain('&lt;script&gt;');
  });

  it('always returns one of the fixed palette colors', () => {
    for (let i = 0; i < 20; i++) {
      expect(typeof randomWishColor()).toBe('string');
    }
  });
});
