// Save-the-date WhatsApp message builder for the admin Guests page's
// "Send in English" / "Send in French" buttons.
//
// This deliberately does NOT go through the WhatsApp Cloud API (see
// lib/whatsapp.ts) — it builds a plain wa.me "click to chat" link
// (https://wa.me/<phone>?text=...), which just pre-fills the message in
// WhatsApp for whoever opens it to review and hit Send themselves. That
// sidesteps the Cloud API's business-initiated-message/template
// requirement entirely, since it's not an automated send — it's you,
// personally, sending a normal message. The trade-off: a wa.me link can
// only pre-fill text, not attach media, so the hero video has to be
// attached by hand in the chat after it opens, before hitting send.

export type SaveTheDateLocale = "en" | "fr";

export interface SaveTheDateGuest {
  fullName: string;
  partnerName?: string | null;
  type: "single" | "couple";
  phoneNumber: string;
}

function greetingName(guest: SaveTheDateGuest): string {
  if (guest.type !== "couple") return guest.fullName;
  return guest.partnerName
    ? `Couple ${guest.fullName} & ${guest.partnerName}`
    : `Couple ${guest.fullName}`;
}

// Deliberately just the month + year, not the exact day — this message
// goes out before the formal invitation, which is where the precise date
// (and the personal RSVP link) belongs.
const WEDDING_DATE_LABEL = { en: "December 2026", fr: "Décembre 2026" };

// No emojis here — some come through as unreadable/mojibake once run
// through wa.me's URL-encoded text parameter (varies by device/OS font
// support), so plain text is the safe choice for this specific channel.
const MESSAGE_BUILDERS: Record<SaveTheDateLocale, (name: string) => string> = {
  en: (name) =>
    `Dear ${name}!\n\n` +
    `We are delighted to share the wonderful news that Beni & Dorah are getting married, and we would be honoured to have you celebrate this special occasion with us.\n\n` +
    `Please save the date for ${WEDDING_DATE_LABEL.en}, at Suitability Gardens. A formal invitation with further details will be shared with you in due course.\n\n` +
    `We look forward to celebrating this joyous occasion together.`,
  fr: (name) =>
    `Cher(e) ${name} !\n\n` +
    `Nous sommes ravis de partager la merveilleuse nouvelle que Beni & Dorah se marient, et nous serions honorés de vous compter parmi nous pour célébrer cette occasion spéciale.\n\n` +
    `Veuillez réserver la date de ${WEDDING_DATE_LABEL.fr}, à Suitability Gardens. Une invitation officielle avec plus de détails vous sera envoyée en temps voulu.\n\n` +
    `Nous avons hâte de célébrer ensemble cette joyeuse occasion.`,
};

export function buildSaveTheDateMessage(
  guest: SaveTheDateGuest,
  locale: SaveTheDateLocale,
): string {
  return MESSAGE_BUILDERS[locale](greetingName(guest));
}

// wa.me expects digits only — country code first, no "+", spaces, or dashes.
export function buildSaveTheDateWaLink(
  guest: SaveTheDateGuest,
  locale: SaveTheDateLocale,
): string {
  const digits = guest.phoneNumber.replace(/\D/g, "");
  const message = buildSaveTheDateMessage(guest, locale);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
