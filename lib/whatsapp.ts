// WhatsApp Cloud API (Meta) adapter for the "Send invite" flow (§7 of the
// build brief). If WHATSAPP_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID are not
// set, this runs in mock mode: it logs what would have been sent and
// returns success, so the rest of the invite flow (recording send state)
// can be built and tested before real credentials exist.

const RSVP_DEADLINE = '15 November';

export interface SendInviteParams {
  toPhoneNumber: string; // E.164, e.g. +27811234567
  guestName: string;
  inviteUrl: string;
}

export interface SendInviteResult {
  ok: boolean;
  mocked: boolean;
  providerMessageId?: string;
  error?: string;
}

function buildMessage({ guestName, inviteUrl }: SendInviteParams) {
  return (
    `Hi ${guestName}! 💍 Beni & Dorah would love for you to join their wedding celebration.\n\n` +
    `Please RSVP here: ${inviteUrl}\n\n` +
    `We'd be grateful for your response before ${RSVP_DEADLINE}. Can't wait to celebrate with you!`
  );
}

export async function sendWhatsAppInvite(params: SendInviteParams): Promise<SendInviteResult> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';
  const message = buildMessage(params);

  if (!token || !phoneNumberId) {
    console.log(`[whatsapp:mock] to=${params.toPhoneNumber}\n${message}`);
    return { ok: true, mocked: true };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: params.toPhoneNumber.replace(/[^\d+]/g, ''),
        type: 'text',
        text: { body: message, preview_url: true },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { ok: false, mocked: false, error: data?.error?.message || 'WhatsApp API error' };
    }
    return { ok: true, mocked: false, providerMessageId: data?.messages?.[0]?.id };
  } catch (err) {
    return { ok: false, mocked: false, error: (err as Error).message };
  }
}
