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
    nameFr: "Four à micro-ondes",
    description: "30L convection microwave oven.",
    descriptionFr: "Four à micro-ondes à convection de 30L.",
    priceZar: 2499,
    priceUsd: 139,
    imageUrl: "/gift-registry/microwave.jpg",
  },
  {
    name: "Rice Cooker",
    nameFr: "Cuiseur à riz",
    description: "Automatic rice cooker with keep-warm function.",
    descriptionFr: "Cuiseur à riz automatique avec fonction maintien au chaud.",
    priceZar: 1299,
    priceUsd: 72,
    imageUrl: "/gift-registry/rice-cooker.jpg",
  },
  {
    name: "Slow Cooker",
    nameFr: "Mijoteuse",
    description: "Ceramic-pot slow cooker for stews and casseroles.",
    descriptionFr: "Mijoteuse en céramique pour ragoûts et plats mijotés.",
    priceZar: 1199,
    priceUsd: 67,
    imageUrl: "/gift-registry/slow-cooker.jpg",
  },
  {
    name: "Kettle",
    nameFr: "Bouilloire",
    description: "Cordless electric kettle, rapid boil.",
    descriptionFr: "Bouilloire électrique sans fil, ébullition rapide.",
    priceZar: 1099,
    priceUsd: 61,
    imageUrl: "/gift-registry/kettle.jpg",
  },
  {
    name: "Toaster",
    nameFr: "Grille-pain",
    description: "2-slice electric toaster with browning control.",
    descriptionFr: "Grille-pain électrique 2 tranches avec réglage du brunissage.",
    priceZar: 1199,
    priceUsd: 67,
    imageUrl: "/gift-registry/toaster.jpg",
  },
  {
    name: "Griller",
    nameFr: "Grill électrique",
    description: "Electric contact griller for quick, easy meals.",
    descriptionFr: "Grill électrique à contact pour des repas rapides et faciles.",
    priceZar: 1499,
    priceUsd: 83,
    imageUrl: "/gift-registry/griller.jpg",
  },
  {
    name: "Air Fryer",
    nameFr: "Friteuse à air",
    description: "Large-capacity air fryer for healthier everyday cooking.",
    descriptionFr: "Friteuse à air grande capacité pour une cuisine quotidienne plus saine.",
    priceZar: 2799,
    priceUsd: 155,
    imageUrl: "/gift-registry/air-fryer.jpg",
  },
  {
    name: "Deep Fryer",
    nameFr: "Friteuse",
    description: "Electric deep fryer with adjustable temperature control.",
    descriptionFr: "Friteuse électrique avec réglage de température ajustable.",
    priceZar: 1899,
    priceUsd: 105,
    imageUrl: "/gift-registry/deep-fryer.jpg",
  },
  {
    name: "Blender",
    nameFr: "Mixeur",
    description: "High-powered blender for smoothies and soups.",
    descriptionFr: "Mixeur puissant pour smoothies et soupes.",
    priceZar: 1699,
    priceUsd: 94,
    imageUrl: "/gift-registry/blender.jpg",
  },
  {
    name: "Steamer",
    nameFr: "Cuiseur vapeur",
    description: "Multi-tier bamboo steamer set for stovetop cooking.",
    descriptionFr: "Ensemble de cuiseur vapeur en bambou à plusieurs niveaux pour cuisson sur cuisinière.",
    priceZar: 1399,
    priceUsd: 78,
    imageUrl: "/gift-registry/steamer.jpg",
  },
  {
    name: "Waffle Maker",
    nameFr: "Gaufrier",
    description: "Non-stick waffle maker for weekend breakfasts.",
    descriptionFr: "Gaufrier antiadhésif pour les petits-déjeuners du week-end.",
    priceZar: 1299,
    priceUsd: 72,
    imageUrl: "/gift-registry/waffle-maker.jpg",
  },
  {
    name: "Vacuum Cleaner",
    nameFr: "Aspirateur",
    description: "Cordless stick vacuum with HEPA filter.",
    descriptionFr: "Aspirateur balai sans fil avec filtre HEPA.",
    priceZar: 3999,
    priceUsd: 222,
    imageUrl: "/gift-registry/vacuum-cleaner.jpg",
  },
  {
    name: "Electric Pan",
    nameFr: "Poêle électrique",
    description: "Electric frying pan with even, adjustable heat.",
    descriptionFr: "Poêle électrique à chaleur uniforme et réglable.",
    priceZar: 1599,
    priceUsd: 89,
    imageUrl: "/gift-registry/electric-pan.jpg",
  },
  {
    name: "Coffee Machine",
    nameFr: "Machine à café",
    description: "Espresso machine with built-in milk frother.",
    descriptionFr: "Machine à espresso avec mousseur à lait intégré.",
    priceZar: 3499,
    priceUsd: 194,
    imageUrl: "/gift-registry/coffee-machine.jpg",
  },
  {
    name: "Multi Food Processor",
    nameFr: "Robot multifonction",
    description: "All-in-one food processor — chop, blend, mix, and more.",
    descriptionFr: "Robot culinaire tout-en-un — hache, mixe, mélange, et plus encore.",
    priceZar: 2999,
    priceUsd: 166,
    imageUrl: "/gift-registry/food-processor.jpg",
  },
  {
    name: "Sandwich Maker",
    nameFr: "Appareil à croque-monsieur",
    description: "Toastie/sandwich press for a quick hot lunch.",
    descriptionFr: "Appareil à croque-monsieur pour un déjeuner chaud et rapide.",
    priceZar: 1099,
    priceUsd: 61,
    imageUrl: "/gift-registry/sandwich-maker.jpg",
  },
];

const HISTORY_SEEDS = [
  {
    title: "The First Hello",
    titleFr: "Le Premier Bonjour",
    descriptionShort: "Where it all began.",
    descriptionShortFr: "Là où tout a commencé.",
    descriptionFull:
      "We met at church, she was part of the choir, and a very welcoming person. That first hello ended up being the start of forever.",
    descriptionFullFr:
      "Nous nous sommes rencontrés à l'église, elle faisait partie de la chorale et était une personne très accueillante. Ce premier bonjour a fini par être le début de toute une vie.",
    eventDate: new Date("2023-06-15"),
    imagePath: "/images/couple/history-first-hello.jpg",
  },
  {
    title: "First Date",
    titleFr: "Premier Rendez-vous",
    descriptionShort: "A birthday date turned into a yes.",
    descriptionShortFr: "Un rendez-vous d'anniversaire qui s'est transformé en oui.",
    descriptionFull:
      "I took her out to celebrate her birthday, and by the end of the night I asked her to be my girl. She said yes.",
    descriptionFullFr:
      "Je l'ai emmenée fêter son anniversaire, et à la fin de la soirée, je lui ai demandé d'être ma copine. Elle a dit oui.",
    eventDate: new Date("2024-06-01"),
    imagePath: "/images/couple/history-first-date.jpg",
  },
  {
    title: "Made It Official",
    titleFr: "C'est Devenu Officiel",
    descriptionShort: 'She officially said "Yes".',
    descriptionShortFr: "Elle a officiellement dit « Oui ».",
    descriptionFull:
      "With her family and closest friends secretly gathered around us, I asked her to be my wife. She said yes in front of everyone who loves us most, and the whole rooftop erupted in cheers, tears, and sparklers.",
    descriptionFullFr:
      "Avec sa famille et ses amis les plus proches secrètement réunis autour de nous, je lui ai demandé de devenir ma femme. Elle a dit oui devant tous ceux qui nous aiment le plus, et tout le toit a explosé de joie, de larmes et d'étincelles.",
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
    titleFr: "Mariage Traditionnel",
    descriptionShort: "I paid the Lobola.",
    descriptionShortFr: "J'ai payé la dot.",
    descriptionFull:
      "Following tradition, I paid Lobola to her family, and in that moment she officially became my wife by custom. Both our families gathered together to celebrate — sharing food, laughter, and blessings for the road ahead.",
    descriptionFullFr:
      "Selon la tradition, j'ai payé la dot à sa famille, et à ce moment-là, elle est officiellement devenue ma femme selon la coutume. Nos deux familles se sont réunies pour célébrer — partageant repas, rires et bénédictions pour la suite.",
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
    title: "The Wait For The Big Day",
    titleFr: "En Attendant Le Grand Jour",
    descriptionShort: "Waiting for the big date.",
    descriptionShortFr: "En attente de la grande date.",
    descriptionFull:
      "While waiting for the big day, we made the most of every moment together — date nights, spontaneous outings, and quiet days at home, filling the countdown with memories we will always cherish.",
    descriptionFullFr:
      "En attendant le grand jour, nous avons profité de chaque instant ensemble — soirées en amoureux, sorties spontanées et journées tranquilles à la maison, remplissant le compte à rebours de souvenirs que nous chérirons toujours.",
    eventDate: new Date("2026-12-23"),
    imagePath: "/images/couple/history-wait-for-big-day-1.jpg",
    imagePaths: Array.from(
      { length: 17 },
      (_, i) => `/images/couple/history-wait-for-big-day-${i + 1}.jpg`,
    ),
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
  // get a fresh nanoid(8), never a predictable value (see §8 of the brief).
  console.log("Seeding a couple of example guests…");
  await prisma.guest
    .upsert({
      where: { userHashCode: "devDemoThandi01" },
      update: {},
      create: {
        userHashCode: "devDemoThandi01",
        inviteCode: "100001",
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
        inviteCode: "100002",
        type: "couple",
        fullName: "Sipho Dlamini",
        partnerName: "Lindiwe Dlamini",
        phoneNumber: "+27820000002",
        guestSide: "groom",
        tableId: tables[1].id,
      },
    })
    .catch(() => null);
  // Deliberately left with no Rsvp row (unlike the two above) — a stable
  // link for testing the "not yet submitted" first-time flow, since the
  // other two always already have a submitted response.
  await prisma.guest
    .upsert({
      where: { userHashCode: "devDemoNoRsvp03" },
      update: {},
      create: {
        userHashCode: "devDemoNoRsvp03",
        inviteCode: "100003",
        type: "single",
        fullName: "Palesa Mokoena",
        phoneNumber: "+27820000003",
        guestSide: "bride",
        tableId: tables[2].id,
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
          nameFr: g.nameFr,
          description: g.description,
          descriptionFr: g.descriptionFr,
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
          nameFr: g.nameFr,
          description: g.description,
          descriptionFr: g.descriptionFr,
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
          titleFr: h.titleFr,
          descriptionShort: h.descriptionShort,
          descriptionShortFr: h.descriptionShortFr,
          descriptionFull: h.descriptionFull,
          descriptionFullFr: h.descriptionFullFr,
          eventDate: h.eventDate,
          thumbnailUrl: thumbnail,
          sortOrder: i,
          images: {
            create: paths.map((imageUrl) => ({ imageUrl })),
          },
        },
      });
    } else {
      // Same reasoning as the gift branch above: an already-seeded
      // environment (production) needs its French columns backfilled by
      // re-running this seed, not just fresh installs. Deliberately NOT
      // touching eventDate/thumbnailUrl/images/sortOrder here — those are
      // either unlikely to change post-launch or (images) managed via
      // their own create-only relation, so leave them alone on a re-run.
      await prisma.historyItem.update({
        where: { id: existing.id },
        data: {
          titleFr: h.titleFr,
          descriptionShortFr: h.descriptionShortFr,
          descriptionFullFr: h.descriptionFullFr,
        },
      });
    }
  }

  // #3 (3.mp4 + 3-poster.jpg) was removed from the gallery batch below back
  // in 4fd490a, but that only stopped it being *re-created* — an
  // environment that already had the row from an earlier seed run (i.e.
  // production) kept serving it forever, now broken since the files are
  // gone. Explicit one-off cleanup so a re-seed actually removes it there.
  await prisma.galleryItem.deleteMany({
    where: { mediaUrl: "/images/gallery/3.mp4" },
  });

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

  // Extra gallery batch supplied directly by the couple, numbered 1-27 —
  // #3 was a video (3.mp4 + 3-poster.jpg) but has since been removed from
  // the gallery, so there's no file at that number; #27 is the
  // save-the-date portrait, also used as the OG/social share image (see
  // app/layout.tsx). Backfilled item-by-item keyed by mediaUrl so
  // re-running the seed never duplicates rows and new items in the batch
  // still get added if this runs again later.
  console.log("Seeding additional gallery batch…");
  const galleryBatch: {
    url: string;
    type: "image" | "video";
    thumbnailUrl?: string;
  }[] = [];
  for (let n = 1; n <= 27; n++) {
    if (n === 3) continue;
    galleryBatch.push({ url: `/images/gallery/${n}.jpeg`, type: "image" });
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
