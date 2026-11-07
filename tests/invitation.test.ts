import { describe, it, expect } from 'vitest';
import {
  buildInvitationUrl,
  buildInvitationMessage,
  buildInvitationWaLink,
  buildReminderMessage,
  buildReminderWaLink,
} from '@/lib/invitation';

const guest = {
  fullName: 'Thandiwe Nkosi',
  partnerName: null,
  type: 'single' as const,
  phoneNumber: '+27821234567',
  userHashCode: 'AbC12xyz',
  inviteCode: '123456',
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
    expect(message).toContain('123456');
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

describe('Reminder message', () => {
  it('carries the RSVP link, code and the 15 November deadline', () => {
    const message = buildReminderMessage(guest, 'en');
    expect(message).toContain('reminder');
    expect(message).toContain('http://localhost:3000/AbC12xyz/en#rsvp');
    expect(message).toContain('123456');
    expect(message).toContain('Sunday 15 November 2026');
    const messageFr = buildReminderMessage(guest, 'fr');
    expect(messageFr).toContain('http://localhost:3000/AbC12xyz/fr#rsvp');
    expect(messageFr).toContain('dimanche 15 novembre 2026');
  });

  it('greets by time of day instead of "Dear"', () => {
    const morning = new Date(2026, 10, 10, 9, 0);
    const evening = new Date(2026, 10, 10, 19, 30);
    expect(buildReminderMessage(guest, 'en', morning)).toMatch(/^Good day Thandiwe Nkosi!/);
    expect(buildReminderMessage(guest, 'en', evening)).toMatch(/^Good evening Thandiwe Nkosi!/);
    expect(buildReminderMessage(guest, 'fr', morning)).toMatch(/^Bonjour Thandiwe Nkosi !/);
    expect(buildReminderMessage(guest, 'fr', evening)).toMatch(/^Bonsoir Thandiwe Nkosi !/);
  });

  it('builds a wa.me link', () => {
    expect(buildReminderWaLink(guest, 'fr')).toMatch(/^https:\/\/wa\.me\/27821234567\?text=/);
  });
});
