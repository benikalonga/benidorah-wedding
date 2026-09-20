// Invitation WhatsApp message builder for the admin Guests page's "Send
// Invitation" button and the Invited/RSVPs page's "Resend" button.
//
// This deliberately does NOT go through the WhatsApp Cloud API (see the
// removed lib/whatsapp.ts) — it builds a plain wa.me "click to chat" link
// (https://wa.me/<phone>?text=...), which just pre-fills the message in
// WhatsApp for whoever opens it to review and hit Send themselves. That
// sidesteps the Cloud API's business-initiated-message/template
// requirement entirely, since it's not an automated send — it's you,
// personally, sending a normal message. The trade-off: a wa.me link can
// only pre-fill text, not attach media, so the hero video (if wanted) has
// to be attached by hand in the chat before hitting send.

import { SITE_COPY } from "./content";
import type { Locale } from "./i18n";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://benidorah.com";

export interface InvitationGuest {
  fullName: string;
  partnerName?: string | null;
  type: "single" | "couple";
  phoneNumber: string;
  userHashCode: string;
  inviteCode: string;
}

function greetingName(guest: InvitationGuest): string {
  if (guest.type !== "couple") return guest.fullName;
  return guest.partnerName
    ? `Couple ${guest.fullName} & ${guest.partnerName}`
    : `Couple ${guest.fullName}`;
}

// No emojis here — some come through as unreadable/mojibake once run
// through wa.me's URL-encoded text parameter (varies by device/OS font
// support), so plain text is the safe choice for this specific channel.
const WEDDING_DATE_LABEL: Record<Locale, string> = {
  en: "23 December 2026",
  fr: "23 décembre 2026",
};
const RSVP_DEADLINE_LABEL: Record<Locale, string> = {
  en: "15 November 2026",
  fr: "15 novembre 2026",
};

const MESSAGE_BUILDERS: Record<
  Locale,
  (
    name: string,
    link: string,
    type: "single" | "couple",
    code: string,
  ) => string
> = {
  en: (name, link, type, code) =>
    `Dear ${name}!\n\n` +
    `We are delighted to formally invite you to celebrate the wedding of Beni & Dorah.\n\n` +
    `Join us on the ${WEDDING_DATE_LABEL.en} at ${SITE_COPY.ceremony.time}, at ${SITE_COPY.venueName}.\n\n` +
    `Please RSVP and find all the details here: ${link}\n\n` +
    `Or enter your unique code: ${code} on the website ${SITE_URL}\n\n` +
    `We'd be grateful for your response before ${RSVP_DEADLINE_LABEL.en}. We can't wait to celebrate with you!`,
  fr: (name, link, type, code) =>
    `Cher` +
    (type === "single" ? "(e) " : " ") +
    `${name} !\n\n` +
    `Nous avons le plaisir de vous inviter officiellement à célébrer le mariage de Beni & Dorah.\n\n` +
    `Rejoignez-nous le ${WEDDING_DATE_LABEL.fr} à ${SITE_COPY.ceremony.time}, à ${SITE_COPY.venueName}.\n\n` +
    `Merci de confirmer votre présence et de retrouver tous les détails ici : ${link}\n\n` +
    `Ou entrez votre code unique : ${code} en allant sur le site ${SITE_URL}\n\n` +
    `Vous trouverez ci-joint la lettre de confirmation, utile pour votre demande de visa.\n\n` +
    `Nous vous serions reconnaissants de répondre avant le ${RSVP_DEADLINE_LABEL.fr}. Nous avons hâte de célébrer avec vous !`,
};

/**
 * The guest's personal link, carrying the language the invite was sent in
 * so the site opens in that language by default — `/<hash>/<locale>`.
 */
export function buildInvitationUrl(
  userHashCode: string,
  locale: Locale,
): string {
  return `${SITE_URL}/${userHashCode}/${locale}`;
}

export function buildInvitationMessage(
  guest: InvitationGuest,
  locale: Locale,
): string {
  const link = buildInvitationUrl(guest.userHashCode, locale);
  return MESSAGE_BUILDERS[locale](
    greetingName(guest),
    link,
    guest.type,
    guest.inviteCode,
  );
}

// wa.me expects digits only — country code first, no "+", spaces, or dashes.
export function buildInvitationWaLink(
  guest: InvitationGuest,
  locale: Locale,
): string {
  const digits = guest.phoneNumber.replace(/\D/g, "");
  const message = buildInvitationMessage(guest, locale);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
