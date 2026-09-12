// WhatsApp Cloud API (Meta) adapter for the "Send invite" flow (§7 of the
// build brief). If WHATSAPP_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID are not
// set, this runs in mock mode: it logs what would have been sent and
// returns success, so the rest of the invite flow (recording send state)
// can be built and tested before real credentials exist.
//
// This is a *business-initiated* message (we're messaging the guest
// first — they haven't messaged us). Meta requires business-initiated
// WhatsApp messages to use a pre-approved message template, not a
// free-form `type: "text"`/`type: "video"` call — those only work
// within a 24h window opened by the guest messaging first, or to the
// handful of test numbers registered in the Meta developer console.
// So once WHATSAPP_TEMPLATE_NAME is set (after your template is
// approved in Meta Business Manager), this sends the real templated
// message with the hero video as its header. Until then, it falls back
// to the old free-form text — fine for testing against registered
// numbers, not for the real guest list.

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

// Absolute URL to the hero video, used as the template's video header.
// Meta's servers fetch this link once to attach the media — it must be
// publicly reachable HTTPS and under WhatsApp's 16MB video-message limit
// (hero-main.mp4 is ~5.7MB, well within it).
function heroVideoUrl() {
  const siteUrl = process.env.SITE_URL || 'https://benidorah.com';
  return new URL('/api/media/hero-main', siteUrl).toString();
}

export async function sendWhatsAppInvite(params: SendInviteParams): Promise<SendInviteResult> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || 'en';

  if (!token || !phoneNumberId) {
    const message = buildMessage(params);
    console.log(`[whatsapp:mock] to=${params.toPhoneNumber}\n${message}`);
    return { ok: true, mocked: true };
  }

  const to = params.toPhoneNumber.replace(/[^\d+]/g, '');
  const body = templateName
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            { type: 'header', parameters: [{ type: 'video', video: { link: heroVideoUrl() } }] },
            {
              type: 'body',
              parameters: [
                { type: 'text', text: params.guestName },
                { type: 'text', text: params.inviteUrl },
              ],
            },
          ],
        },
      }
    : {
        // Fallback: free-form text. Only actually delivers to a guest who
        // messaged us first (24h window) or a registered test number —
        // see the file-level comment. Not what to use for the real send.
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: buildMessage(params), preview_url: true },
      };

  try {
    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
