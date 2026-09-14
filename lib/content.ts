import { prisma } from "./db";

export const WEDDING_DATE_ISO = "2026-12-23T14:00:00+02:00";
export const RSVP_DEADLINE_LABEL = "15 November 2026";

// Bank details and organizer phone numbers are read from NEXT_PUBLIC_*
// env vars rather than hardcoded here. They're still shown to every guest
// on the live site either way (that's the point — guests need them to pay
// or call), so this isn't about hiding them from visitors; it's about
// keeping real financial/contact PII out of the git history itself, since
// this repo is public. Next.js inlines NEXT_PUBLIC_* values into the
// built JS at build time, so they still work in client components exactly
// like a hardcoded string would — see .env.example for the placeholders
// and README for why these specific fields are env-driven.
export const SITE_COPY = {
  coupleNames: "B & D",
  venueName: "Suitability Gardens",
  address: "236 1st Rd, Walkers Fruit Farms SH, De Deur, 1961",
  mapEmbedUrl:
    "https://www.google.com/maps?q=236+1st+Rd,+Walkers+Fruit+Farms+SH,+De+Deur,+1961&output=embed",
  mapsDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent("236 1st Rd, Walkers Fruit Farms SH, De Deur, 1961"),
  ceremony: { label: { en: "Matrimonial Ceremony", fr: "Cérémonie Matrimoniale" }, time: "14:00" },
  party: { label: { en: "Party", fr: "Réception" }, time: "18:00" },
  bank: {
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "",
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "",
    accountType: process.env.NEXT_PUBLIC_BANK_ACCOUNT_TYPE || "",
    bankName: process.env.NEXT_PUBLIC_BANK_NAME || "",
    branchCode: process.env.NEXT_PUBLIC_BANK_BRANCH_CODE || "",
  },
  contacts: [
    {
      name: "Daniella",
      phone: process.env.NEXT_PUBLIC_CONTACT_DANIELLA_PHONE || "",
    },
    {
      name: "Jonathan",
      phone: process.env.NEXT_PUBLIC_CONTACT_JONATHAN_PHONE || "",
    },
  ],
  email: "benidorah@gmail.com",
  dressCode: {
    title: { en: "Royalties", fr: "Royautés" },
    description: {
      en: "Think regal, not costume. Gentlemen, formal dark attire — think tailored suits in onyx and charcoal. Ladies, gowns in royal hues — sapphire, emerald, amethyst, wine. Gold accents welcome for everyone.",
      fr: "Pensez royal, pas costume. Messieurs, tenue sombre et formelle — costumes ajustés dans les tons onyx et charbon. Mesdames, des robes aux teintes royales — saphir, émeraude, améthyste, bordeaux. Les touches dorées sont les bienvenues pour tous.",
    },
  },
};

export async function getHistoryItems() {
  return prisma.historyItem.findMany({
    orderBy: { sortOrder: "asc" },
    include: { images: true },
  });
}

export async function getGalleryItems() {
  return prisma.galleryItem.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getGiftItems() {
  return prisma.giftItem.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getVisibleTickets() {
  return prisma.ticket.findMany({
    where: { visible: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getVisibleMoments() {
  return prisma.moment.findMany({
    where: { visible: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/**
 * Resolves a guest by their capability-token hash and marks the first
 * time their link was opened. Returns null for the generic `/` route or
 * an unknown hash — both render the locked/informational RSVP state.
 */
export async function getGuestByHash(hash: string) {
  const guest = await prisma.guest.findUnique({
    where: { userHashCode: hash },
    include: { rsvp: true },
  });

  if (guest && !guest.linkOpenedAt) {
    await prisma.guest.update({
      where: { id: guest.id },
      data: { linkOpenedAt: new Date() },
    });
    guest.linkOpenedAt = new Date();
  }

  return guest;
}
