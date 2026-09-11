import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, isPasswordStrongEnough, createSessionToken, verifySessionToken } from '@/lib/auth';

describe('admin auth', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('name@bnd');
    expect(hash).not.toBe('name@bnd');
    expect(await verifyPassword('name@bnd', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('enforces the minimum password strength on reset', () => {
    expect(isPasswordStrongEnough('short1A')).toBe(false); // too short
    expect(isPasswordStrongEnough('alllowercase1')).toBe(false); // no uppercase
    expect(isPasswordStrongEnough('ALLUPPERCASE1')).toBe(false); // no lowercase
    expect(isPasswordStrongEnough('NoNumbersHere')).toBe(false); // no digit
    expect(isPasswordStrongEnough('GoodPassword1')).toBe(true);
  });

  it('round-trips a session token and rejects a tampered one', async () => {
    const token = await createSessionToken({
      sub: 'admin-1',
      email: 'beni@bnd.com',
      role: 'admin',
      mustChangePassword: true,
    });
    const session = await verifySessionToken(token);
    expect(session?.email).toBe('beni@bnd.com');
    expect(session?.mustChangePassword).toBe(true);

    const tampered = token.slice(0, -2) + 'xx';
    expect(await verifySessionToken(tampered)).toBeNull();
  });
});
