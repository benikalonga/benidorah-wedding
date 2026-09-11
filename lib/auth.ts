// Node-runtime admin auth helpers (bcrypt password hashing). Route
// handlers and server components run on the Node runtime and can import
// this freely; middleware.ts (Edge runtime) imports lib/session.ts
// directly instead, since bcryptjs isn't Edge-compatible.
import bcrypt from 'bcryptjs';

export * from './session';

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/** Minimum password strength enforced on the forced first-login reset and any later change. */
export function isPasswordStrongEnough(password: string): boolean {
  return (
    password.length >= 10 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;
