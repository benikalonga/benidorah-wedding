import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// --- Admin accounts -------------------------------------------------------
// SECURITY: the seed password is read from ADMIN_SEED_PASSWORD (set in
// .env, never committed) rather than hardcoded — a literal password string
// in source gets flagged by secret scanning even when it's an intentional
// throwaway. It's still only ever a first-login value: every seeded
// account has must_change_password = true, and middleware.ts blocks access
// to the rest of /admin until it's reset (see lib/auth.ts). Never leave it
// as a standing production credential.
const ADMIN_SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
if (!ADMIN_SEED_PASSWORD) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_SEED_PASSWORD must be set (in .env) before seeding a production database.",
    );
  }
  console.warn(
    "[seed] ADMIN_SEED_PASSWORD not set — using a dev-only fallback. Set it in .env for anything beyond local dev.",
  );
}
const SEED_PASSWORD = ADMIN_SEED_PASSWORD || "dev-only-change-me-1A";

const ADMIN_SEEDS = [
  { email: "beni@bnd.com", name: "Beni" },
  { email: "dorah@bnd.com", name: "Dorah" },
  { email: "jonathan@bnd.com", name: "Jonathan" },
  { email: "daniella@bnd.com", name: "Daniella" },
];

// Kitchen/home appliances only (per the couple's request) — every entry
// priced at R1000 or more, and every entry has a real photo checked into
// public/gift-registry/ (see the imageUrl paths below).
const GIFT_SEEDS = [
  {
    name: "Microwave",
    description: "30L convection microwave oven.",
    priceZar: 2499,
    priceUsd: 139,
    imageUrl: "/gift-registry/microwave.jpg",
  },
  {
    name: "Rice Cooker",
    description: "Automatic rice cooker with keep-warm function.",
    priceZar: 1299,
    priceUsd: 72,
    imageUrl: "/gift-registry/rice-cooker.jpg",
  },
  {
    name: "Slow Cooker",
    description: "Ceramic-pot slow cooker for stews and casseroles.",
    priceZar: 1199,
    priceUsd: 67,
    imageUrl: "/gift-registry/slow-cooker.jpg",
  },
  {
    name: "Kettle",
    description: "Cordless electric kettle, rapid boil.",
    priceZar: 1099,
    priceUsd: 61,
    imageUrl: "/gift-registry/kettle.jpg",
  },
  {
    name: "Toaster",
    description: "2-slice electric toaster with browning control.",
    priceZar: 1199,
    priceUsd: 67,
    imageUrl: "/gift-registry/toaster.jpg",
  },
  {
    name: "Griller",
    description: "Electric contact griller for quick, easy meals.",
    priceZar: 1499,
    priceUsd: 83,
    imageUrl: "/gift-registry/griller.jpg",
  },
  {
    name: "Air Fryer",
    description: "Large-capacity air fryer for healthier everyday cooking.",
    priceZar: 2799,
    priceUsd: 155,
    imageUrl: "/gift-registry/air-fryer.jpg",
  },
  {
    name: "Deep Fryer",
    description: "Electric deep fryer with adjustable temperature control.",
    priceZar: 1899,
    priceUsd: 105,
    imageUrl: "/gift-registry/deep-fryer.jpg",
  },
  {
    name: "Blender",
    description: "High-powered blender for smoothies and soups.",
    priceZar: 1699,
    priceUsd: 94,
    imageUrl: "/gift-registry/blender.jpg",
  },
  {
    name: "Steamer",
    description: "Multi-tier bamboo steamer set for stovetop cooking.",
    priceZar: 1399,
    priceUsd: 78,
    imageUrl: "/gift-registry/steamer.jpg",
  },
  {
    name: "Waffle Maker",
    description: "Non-stick waffle maker for weekend breakfasts.",
    priceZar: 1299,
    priceUsd: 72,
    imageUrl: "/gift-registry/waffle-maker.jpg",
  },
  {
    name: "Vacuum Cleaner",
    description: "Cordless stick vacuum with HEPA filter.",
    priceZar: 3999,
    priceUsd: 222,
    imageUrl: "/gift-registry/vacuum-cleaner.jpg",
  },
  {
    name: "Electric Pan",
    description: "Electric frying pan with even, adjustable heat.",
    priceZar: 1599,
    priceUsd: 89,
    imageUrl: "/gift-registry/electric-pan.jpg",
  },
  {
    name: "Coffee Machine",
    description: "Espresso machine with built-in milk frother.",
    priceZar: 3499,
    priceUsd: 194,
    imageUrl: "/gift-registry/coffee-machine.jpg",
  },
  {
    name: "Multi Food Processor",
    description: "All-in-one food processor — chop, blend, mix, and more.",
    priceZar: 2999,
    priceUsd: 166,
    imageUrl: "/gift-registry/food-processor.jpg",
  },
  {
    name: "Sandwich Maker",
    description: "Toastie/sandwich press for a quick hot lunch.",
    priceZar: 1099,
    priceUsd: 61,
    imageUrl: "/gift-registry/sandwich-maker.jpg",
  },
];

const HISTORY_SEEDS = [
  {
    title: "The First Hello",
    descriptionShort: "Where it all began.",
    descriptionFull:
      "We met at church, she was part of the choir, and a very welcoming person. That first hello ended up being the start of forever.",
    eventDate: new Date("2023-06-15"),
    imagePath: "/images/couple/history-first-hello.jpg",
  },
  {
    title: "First Date",
    descriptionShort: "A birthday date turned into a yes.",
    descriptionFull:
      "I took her out to celebrate her birthday, and by the end of the night I asked her to be my girl. She said yes.",
    eventDate: new Date("2024-06-01"),
    imagePath: "/images/couple/history-first-date.jpg",
  },
  {
    title: "Made It Official",
    descriptionShort: 'She officially said "Yes".',
    descriptionFull:
      "With her family and closest friends secretly gathered around us, I asked her to be my wife. She said yes in front of everyone who loves us most, and the whole rooftop erupted in cheers, tears, and sparklers.",
    eventDate: new Date("2025-10-12"),
    imagePaths: [
      "/images/couple/history-made-it-official-1.jpg",
      "/images/couple/history-made-it-official-2.jpg",
      "/images/couple/history-made-it-official-3.jpg",
      "/images/couple/history-made-it-official-4.jpg",
    ],
  },
  {
    title: "Traditionally Married",
    descriptionShort: "I paid the Lobola.",
    descriptionFull:
      "Following tradition, I paid Lobola to her family, and in that moment she officially became my wife by custom. Both our families gathered together to celebrate — sharing food, laughter, and blessings for the road ahead.",
    eventDate: new Date("2025-12-22"),
    imagePath: "/images/couple/history-traditionally-married-2.jpg",
    imagePaths: [
      "/images/couple/history-traditionally-married-1.jpg",
      "/images/couple/history-traditionally-married-2.jpg",
      "/images/couple/history-traditionally-married-3.jpg",
      "/images/couple/history-traditionally-married-4.jpg",
      "/images/couple/history-traditionally-married-5.jpg",
      "/images/couple/history-traditionally-married-6.jpg",
    ],
  },
  {
    title: "The Proposal",
    descriptionShort: "He asked. She said yes.",
    descriptionFull:
      "On a rooftop overlooking the city, with the sun setting behind us, Beni got down on one knee — and Dorah said yes before he could finish the question.",
    eventDate: new Date("2025-06-15"),
  },
  {
    title: "Meeting the Families",
    descriptionShort: "Two families, one love.",
    descriptionFull:
      "Sunday lunches and long conversations brought our families together long before the wedding planning began.",
    eventDate: new Date("2025-07-01"),
  },
  {
    title: "The Engagement Shoot",
    descriptionShort: "Capturing the moment.",
    descriptionFull:
      "Dressed in royal blue and classic black-tie, we spent an afternoon on a rooftop terrace capturing this chapter of our story.",
    eventDate: new Date("2025-09-05"),
  },
  {
    title: "Save the Date",
    descriptionShort: "Telling the world.",
    descriptionFull:
      'We finally shared the news with everyone we love — 23 December 2026 is the day we say "I do."',
    eventDate: new Date("2025-10-01"),
  },
  {
    title: "Wedding Planning Begins",
    descriptionShort: "Venues, vendors, vision boards.",
    descriptionFull:
      "From venue visits to menu tastings, every detail has been chosen with love for the day ahead.",
    eventDate: new Date("2026-02-01"),
  },
  {
    title: "The Wedding Day",
    descriptionShort: "Forever begins.",
    descriptionFull:
      "The day we become husband and wife, surrounded by everyone who has walked this journey with us.",
    eventDate: new Date("2026-12-23"),
  },
];

async function main() {
  console.log("Seeding tables…");
  const tables = await Promise.all(
    Array.from({ length: 15 }).map((_, i) =>
      prisma.table.upsert({
        where: { tableNumber: i + 1 },
        update: {},
        create: { tableNumber: i + 1, capacity: 10 },
      }),
    ),
  );

  console.log("Seeding admin users…");
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  for (const seed of ADMIN_SEEDS) {
    await prisma.adminUser.upsert({
      where: { email: seed.email },
      update: {},
      create: {
        email: seed.email,
        name: seed.name,
        passwordHash,
        mustChangePassword: true,
        role: "admin",
      },
    });
  }

  // Fixed hash codes here are for local/dev convenience only (so re-running
  // the seed is idempotent) — real guests created via the admin UI always
  // get a fresh nanoid(10), never a predictable value (see §8 of the brief).
  console.log("Seeding a couple of example guests…");
  await prisma.guest
    .upsert({
      where: { userHashCode: "devDemoThandi01" },
      update: {},
      create: {
        userHashCode: "devDemoThandi01",
        type: "single",
        fullName: "Thandiwe Nkosi",
        phoneNumber: "+27820000001",
        guestSide: "bride",
        tableId: tables[0].id,
      },
    })
    .catch(() => null);
  await prisma.guest
    .upsert({
      where: { userHashCode: "devDemoSipho02" },
      update: {},
      create: {
        userHashCode: "devDemoSipho02",
        type: "couple",
        fullName: "Sipho Dlamini",
        partnerName: "Lindiwe Dlamini",
        phoneNumber: "+27820000002",
        guestSide: "groom",
        tableId: tables[1].id,
      },
    })
    .catch(() => null);

  console.log("Seeding gift registry…");
  // Clear out any gift items from an older registry list (e.g. the
  // earlier placeholder set) that aren't part of the current one, so
  // re-running the seed doesn't leave stale entries alongside the real
  // list. Only removes items by name that are no longer in GIFT_SEEDS.
  const currentNames = GIFT_SEEDS.map((g) => g.name);
  await prisma.giftItem.deleteMany({
    where: { name: { notIn: currentNames } },
  });

  for (let i = 0; i < GIFT_SEEDS.length; i++) {
    const g = GIFT_SEEDS[i];
    const existing = await prisma.giftItem.findFirst({
      where: { name: g.name },
    });
    if (!existing) {
      await prisma.giftItem.create({
        data: {
          name: g.name,
          description: g.description,
          imageUrl: g.imageUrl,
          priceZar: g.priceZar,
          priceUsd: g.priceUsd,
          sortOrder: i,
        },
      });
    } else {
      // A handful of names (Air Fryer, Blender, Vacuum Cleaner) also
      // existed in the older placeholder list — update their content to
      // match the current one rather than leaving the old description/
      // price/imageUrl in place. Deliberately NOT touching `status` or
      // `bookedByGuestId` here, since those reflect real guest actions,
      // not seed data.
      await prisma.giftItem.update({
        where: { id: existing.id },
        data: {
          description: g.description,
          imageUrl: g.imageUrl,
          priceZar: g.priceZar,
          priceUsd: g.priceUsd,
          sortOrder: i,
        },
      });
    }
  }

  console.log("Seeding history timeline…");
  const coupleImages = [
    "/images/couple/1.jpg",
    "/images/couple/2.jpg",
    "/images/couple/3.jpg",
  ];
  for (let i = 0; i < HISTORY_SEEDS.length; i++) {
    const h = HISTORY_SEEDS[i];
    const existing = await prisma.historyItem.findFirst({
      where: { title: h.title },
    });
    if (!existing) {
      // Most items show a single photo everywhere; a few (e.g. the
      // proposal, the Lobola) have a whole set shown in the "Read more"
      // popup — imagePaths, when present, wins over the single
      // imagePath/fallback for the popup gallery. The card thumbnail is
      // imagePath if given (the "main picture"), else the first popup
      // photo, else the round-robin fallback — imagePath and imagePaths
      // aren't always the same photo (the main picture doesn't have to be
      // first in the popup order).
      const paths = h.imagePaths || [h.imagePath || coupleImages[i % coupleImages.length]];
      const thumbnail = h.imagePath || paths[0];
      await prisma.historyItem.create({
        data: {
          title: h.title,
          descriptionShort: h.descriptionShort,
          descriptionFull: h.descriptionFull,
          eventDate: h.eventDate,
          thumbnailUrl: thumbnail,
          sortOrder: i,
          images: {
            create: paths.map((imageUrl) => ({ imageUrl })),
          },
        },
      });
    }
  }

  console.log("Seeding gallery…");
  const galleryCount = await prisma.galleryItem.count();
  if (galleryCount === 0) {
    await prisma.galleryItem.createMany({
      data: coupleImages.map((url, i) => ({
        mediaUrl: url,
        mediaType: "image" as const,
        sortOrder: i,
      })),
    });
  }

  // The highlight reel also appears in the public Gallery (in addition to
  // the hero's dedicated download button) — streamed inline (no
  // ?download=1) via the same protected /api/media route. Checked
  // independently of the count-gate above so it backfills onto an
  // already-seeded gallery too.
  const highlightInGallery = await prisma.galleryItem.findFirst({
    where: { mediaUrl: "/api/media/highlight" },
  });
  if (!highlightInGallery) {
    const maxSort = await prisma.galleryItem.aggregate({
      _max: { sortOrder: true },
    });
    await prisma.galleryItem.create({
      data: {
        mediaUrl: "/api/media/highlight",
        mediaType: "video",
        thumbnailUrl: "/images/gallery/highlight-poster.jpg",
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
  }

  // Extra gallery batch supplied directly by the couple (25 photos + one
  // video, numbered 1-26 with #3 being the video). Backfilled item-by-item
  // keyed by mediaUrl so re-running the seed never duplicates rows and new
  // items in the batch still get added if this runs again later.
  console.log("Seeding additional gallery batch…");
  const galleryBatch: {
    url: string;
    type: "image" | "video";
    thumbnailUrl?: string;
  }[] = [];
  for (let n = 1; n <= 26; n++) {
    if (n === 3) {
      galleryBatch.push({
        url: "/images/gallery/3.mp4",
        type: "video",
        thumbnailUrl: "/images/gallery/3-poster.jpg",
      });
    } else {
      galleryBatch.push({ url: `/images/gallery/${n}.jpeg`, type: "image" });
    }
  }
  for (const item of galleryBatch) {
    const existing = await prisma.galleryItem.findFirst({
      where: { mediaUrl: item.url },
    });
    if (existing) continue;
    const maxSort = await prisma.galleryItem.aggregate({
      _max: { sortOrder: true },
    });
    await prisma.galleryItem.create({
      data: {
        mediaUrl: item.url,
        mediaType: item.type,
        thumbnailUrl: item.thumbnailUrl,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
