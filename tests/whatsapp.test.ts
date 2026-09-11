import { describe, it, expect, beforeEach } from 'vitest';
import { sendWhatsAppInvite } from '@/lib/whatsapp';

describe('WhatsApp invite dispatch (mock mode)', () => {
  beforeEach(() => {
    delete process.env.WHATSAPP_API_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  });

  it('runs in mock mode and succeeds when no credentials are configured', async () => {
    const result = await sendWhatsAppInvite({
      toPhoneNumber: '+27821234567',
      guestName: 'Test Guest',
      inviteUrl: 'https://benidorah.com/abc1234567',
    });
    expect(result.ok).toBe(true);
    expect(result.mocked).toBe(true);
  });
});
