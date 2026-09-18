import { prisma } from './db';

// A short, human-typable fallback for guests who land on the generic site
// without their personal link (see app/api/rsvp-code/route.ts) — spoken
// over the phone or read off a printed invite far more easily than the
// hash code. 8 digits, zero-padded, drawn from the full 00000000-99999999
// range.
function randomCode(): string {
  return Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, '0');
}

/** Generates an 8-digit numeric code guaranteed unique among existing guests. */
export async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const existing = await prisma.guest.findUnique({ where: { inviteCode: code } });
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique invite code after 10 attempts');
}
