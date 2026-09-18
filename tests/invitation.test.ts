import { describe, it, expect } from 'vitest';
import { buildInvitationUrl, buildInvitationMessage, buildInvitationWaLink } from '@/lib/invitation';

const guest = {
  fullName: 'Thandiwe Nkosi',
  partnerName: null,
  type: 'single' as const,
  phoneNumber: '+27821234567',
  userHashCode: 'AbC12xyz',
  inviteCode: '12345678',
};

describe('Invitation link', () => {
  it('builds a /<hash>/<locale> URL', () => {
    expect(buildInvitationUrl('AbC12xyz', 'en')).toBe('http://localhost:3000/AbC12xyz/en');
    expect(buildInvitationUrl('AbC12xyz', 'fr')).toBe('http://localhost:3000/AbC12xyz/fr');
  });

  it('embeds the locale-tagged link in the message', () => {
    const message = buildInvitationMessage(guest, 'en');
    expect(message).toContain('http://localhost:3000/AbC12xyz/en');
    const messageFr = buildInvitationMessage(guest, 'fr');
    expect(messageFr).toContain('http://localhost:3000/AbC12xyz/fr');
  });

  it('includes the fallback invite code', () => {
    const message = buildInvitationMessage(guest, 'en');
    expect(message).toContain('12345678');
  });

  it('greets a couple with both names', () => {
    const couple = { ...guest, type: 'couple' as const, partnerName: 'Sipho Dlamini' };
    const message = buildInvitationMessage(couple, 'en');
    expect(message).toContain('Couple Thandiwe Nkosi & Sipho Dlamini');
  });

  it('builds a wa.me link with digits-only phone and an encoded message', () => {
    const link = buildInvitationWaLink(guest, 'en');
    expect(link).toMatch(/^https:\/\/wa\.me\/27821234567\?text=/);
  });
});
