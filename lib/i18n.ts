// Client-side text-swap i18n (not routing-based — there's no /fr/... URL,
// the toggle just swaps which language the same page renders). That means
// crawlers/link-unfurlers always see the English version (app/layout.tsx's
// metadata is English-only) — an accepted tradeoff for a small wedding
// site with no SEO/social-share requirement per language. See
// components/LocaleProvider.tsx for the context that reads this.
export type Locale = "en" | "fr";

/** A field that has been given a real French translation alongside its English source — see lib/content.ts's SITE_COPY. */
export interface Localized {
  en: string;
  fr: string;
}

/** Picks the string for the current locale from a `{ en, fr }` pair (e.g. SITE_COPY.ceremony.label). */
export function pick(field: Localized, locale: Locale): string {
  return field[locale] || field.en;
}

/**
 * Picks a French DB column with an English fallback — used for
 * admin-authored content (History stories, gift names/descriptions) where
 * the French column is nullable: older rows, or ones added without a
 * translator on hand, simply show English until someone fills it in.
 */
export function pickDb(
  en: string,
  fr: string | null | undefined,
  locale: Locale,
): string {
  if (locale === "fr" && fr && fr.trim()) return fr;
  return en;
}

/** `Date#toLocaleDateString` locale tag per app Locale — used anywhere a date is formatted for display. */
export function dateLocaleTag(locale: Locale): string {
  return locale === "fr" ? "fr-FR" : "en-ZA";
}

// `fr: typeof en` below means a missing/mistyped key in the French
// dictionary is a compile error, not a silent runtime fallback — the two
// dictionaries are kept in exact structural lockstep.
const en = {
  nav: {
    home: "Home",
    history: "History",
    gallery: "Gallery",
    dateAddress: "Date & Address",
    registry: "Registry",
    rsvp: "RSVP",
    theme: "Theme",
    moments: "Moments",
    contact: "Contact",
    sectionNavAria: "Section navigation",
    toggleMenuAria: "Toggle menu",
    switchToFrench: "Switch to French",
    switchToEnglish: "Switch to English",
  },
  hero: {
    eyebrowNames: "Beni & Dorah",
    gettingMarried: "We're Getting Married",
    soundOn: "Sound On",
    soundOff: "Sound Off",
    soundOnShort: "On",
    soundOffShort: "Off",
    downloadHighlight: "Download the highlight video",
    dateVenueLine: "23 December 2026 · {venue}",
    dateTimeVenueLine: "23 December 2026 · {time} · {venue}",
    scroll: "Scroll",
    scrollToHistoryAria: "Scroll to our history",
    saveTheDate: "Save The Date",
    tagline: "Two hearts, one beautiful forever.",
    reducedMotionAlt: "{names} on their engagement shoot",
    goToRsvp: "Go to the Invitation",
  },
  history: {
    eyebrow: "Our Love Story",
    title: "History",
    description: 'From the day we met, to the day we say "I do."',
    readMore: "Read more →",
    showMoreButton: "Read more",
    showLess: "Show less",
    closeAria: "Close",
  },
  gallery: {
    eyebrow: "In Frame",
    title: "Gallery",
    description: "Moments from our story, so far.",
    play: "Play",
    view: "View",
    showMore: "Show more",
    altPhoto: "Wedding gallery photo",
    altVideoThumb: "Video thumbnail",
  },
  addressSchedule: {
    eyebrow: "Save The Date",
    title: "Date & Address",
    atVenue: "at {venue}",
    getDirections: "Get Directions →",
    venueMapTitle: "Venue map",
    previewVenueAria: "Preview the venue's website",
    venuePreviewTitle: "Venue website preview",
    openInNewTab: "Open in a new tab",
    closeAria: "Close",
  },
  giftRegistry: {
    eyebrow: "With Love",
    title: "Gift Registry",
    intro:
      "Your presence will be the best gift of all. If you'd love to spoil us a little too, you are welcome to do so.",
    accountName: "Account Name",
    accountNumber: "Account Number",
    accountType: "Account Type",
    bank: "Bank",
    branchCode: "Branch Code",
    copyAria: "Copy account number",
    copyTitle: "Click to copy account number",
    preference:
      "As a couple, we'd prefer a deposit toward a gift's value or its cash equivalent on the day. Pick one from the list below.",
    receivedThanks: "Received with thanks",
    alreadyClaimed: "Already claimed",
    iWillGiftIt: "I will gift it",
    depositHeader: "You can make a deposit toward the gift's value:",
    hideDetails: "Hide account details",
    or: "— or —",
    bringCash: "I will bring cash on the day",
    claiming: "Claiming…",
    claimError: "Could not claim this gift — someone may have just claimed it.",
    showLess: "Show less",
    showAllGifts: "Show all gifts →",
    viewAria: "View {name}",
    closeAria: "Close",
  },
  rsvp: {
    eyebrow: "Kindly Reply",
    title: "RSVP",
    lockedMessage:
      "RSVP is only available through your personal invitation link. If you've received an invite, open the link shared with you on WhatsApp to respond.",
    deadline: "Please respond by 15 November 2026.",
    formTitle: "Fill in the form to confirm your attendance",
    alreadySubmitted: "You have already submitted",
    fullName: "Full name",
    coupleLabel: "Couple — {a} & {b}",
    email: "Email (optional)",
    willAttend: "Will you attend?",
    yesSingle: "Yes, I'll be there",
    noSingle: "No, I can't make it",
    yesBoth: "Yes, both of us",
    oneOnly: "Only one of us will make it",
    none: "None of us, unfortunately",
    allergies: "Allergies or comments (optional)",
    wish: "Leave a wish for the couple (optional)",
    displayNameCheckbox: "Display my name on the wish wall",
    sending: "Sending…",
    submit: "Submit RSVP",
    update: "Update RSVP",
    success: "Thank you — your RSVP has been recorded!",
    error: "Something went wrong. Please try again.",
  },
  wishWall: {
    heading: "The Wish Wall",
    subcopy:
      "Pinch or scroll to zoom, drag to explore — updates live as wishes come in.",
    empty: "Be the first to leave a wish above 💌",
    anonymous: "Anonymous",
  },
  dressCode: {
    eyebrow: "Dress Code",
    sapphire: "Sapphire",
    onyx: "Onyx",
    amethyst: "Amethyst",
    wine: "Wine",
    gold: "Gold",
  },
  shareMoment: {
    eyebrow: "Live From The Day",
    title: "Share a Moment",
    description: "Snap it, upload it — everyone sees it live.",
    lockedMessage:
      "Only invited guests can share a moment — open the personal invite link sent to you on WhatsApp to upload your photos and videos here.",
    namePlaceholder: "Your name",
    uploading: "Uploading…",
    uploadFailed: "Upload failed",
    uploadFailedConn: "Upload failed — check your connection and try again.",
    uploadedByAlt: "Uploaded by {name}",
  },
  contact: {
    eyebrow: "Get In Touch",
    title: "Questions?",
    description: "Our organisers are happy to help.",
  },
  footer: {
    admin: "Admin",
    madeWithLove: "23 . 12 . 2026 — Made with love",
  },
  installPrompt: {
    message: "Install the Beni & Dorah app for quick access on the day.",
    install: "Install",
    later: "Later",
  },
  lightbox: {
    close: "Close ✕",
    closeAria: "Close",
    prev: "← Prev",
    prevAria: "Previous",
    next: "Next →",
    nextAria: "Next",
    captionFallback: "Gallery photo",
  },
  countdown: {
    days: "Days",
    hours: "Hours",
    min: "Min",
    sec: "Sec",
  },
};

const fr: typeof en = {
  nav: {
    home: "Accueil",
    history: "Histoire",
    gallery: "Galerie",
    dateAddress: "Date et lieu",
    registry: "Cadeaux",
    rsvp: "RSVP",
    theme: "Thème",
    moments: "Moments",
    contact: "Contact",
    sectionNavAria: "Navigation des sections",
    toggleMenuAria: "Basculer le menu",
    switchToFrench: "Passer au français",
    switchToEnglish: "Switch to English",
  },
  hero: {
    eyebrowNames: "Beni & Dorah",
    gettingMarried: "Nous Nous Marions",
    soundOn: "Son activé",
    soundOff: "Son désactivé",
    soundOnShort: "Activé",
    soundOffShort: "Désactivé",
    downloadHighlight: "Télécharger la vidéo souvenir",
    dateVenueLine: "23 décembre 2026 · {venue}",
    dateTimeVenueLine: "23 décembre 2026 · {time} · {venue}",
    scroll: "Défiler",
    scrollToHistoryAria: "Défiler vers notre histoire",
    saveTheDate: "Réservez La Date",
    tagline: "Deux cœurs, un bel avenir.",
    reducedMotionAlt: "{names} lors de leur séance photo de fiançailles",
    goToRsvp: "Accéder à l'invitation",
  },
  history: {
    eyebrow: "Notre Histoire d'Amour",
    title: "Histoire",
    description:
      "Du jour où nous nous sommes rencontrés, au jour où nous dirons « oui ».",
    readMore: "Lire la suite →",
    showMoreButton: "Lire la suite",
    showLess: "Voir moins",
    closeAria: "Fermer",
  },
  gallery: {
    eyebrow: "En Image",
    title: "Galerie",
    description: "Des instants de notre histoire, jusqu'à présent.",
    play: "Lecture",
    view: "Voir",
    showMore: "Voir plus",
    altPhoto: "Photo de la galerie du mariage",
    altVideoThumb: "Miniature vidéo",
  },
  addressSchedule: {
    eyebrow: "Réservez La Date",
    title: "Date et Lieu",
    atVenue: "à {venue}",
    getDirections: "Obtenir l'itinéraire →",
    venueMapTitle: "Carte du lieu",
    previewVenueAria: "Aperçu du site du lieu",
    venuePreviewTitle: "Aperçu du site du lieu",
    openInNewTab: "Ouvrir dans un nouvel onglet",
    closeAria: "Fermer",
  },
  giftRegistry: {
    eyebrow: "Avec Amour",
    title: "Liste de Cadeaux",
    intro:
      "Votre présence sera le plus beau des cadeaux. Si vous souhaitez tout de même nous gâter un peu, vous êtes les bienvenus.",
    accountName: "Nom du compte",
    accountNumber: "Numéro de compte",
    accountType: "Type de compte",
    bank: "Banque",
    branchCode: "Code d'agence",
    copyAria: "Copier le numéro de compte",
    copyTitle: "Cliquez pour copier le numéro de compte",
    preference:
      "En tant que couple, nous préférerions un dépôt correspondant à la valeur d'un cadeau, ou son équivalent en argent le jour J. Choisissez-en un dans la liste ci-dessous.",
    receivedThanks: "Reçu avec gratitude",
    alreadyClaimed: "Déjà réservé",
    iWillGiftIt: "J'offre ce cadeau",
    depositHeader: "Vous pouvez faire un dépôt correspondant à la valeur du cadeau :",
    hideDetails: "Masquer les coordonnées bancaires",
    or: "— ou —",
    bringCash: "J'apporterai mon enveloppe",
    claiming: "Réservation…",
    claimError:
      "Impossible de réserver ce cadeau — quelqu'un vient peut-être de le réserver.",
    showLess: "Voir moins",
    showAllGifts: "Voir tous les cadeaux →",
    viewAria: "Voir {name}",
    closeAria: "Fermer",
  },
  rsvp: {
    eyebrow: "Réponse Souhaitée",
    title: "RSVP",
    lockedMessage:
      "Le RSVP n'est disponible qu'à partir de votre lien d'invitation personnel. Si vous avez reçu une invitation, ouvrez le lien partagé sur WhatsApp pour répondre.",
    deadline: "Merci de répondre avant le 15 novembre 2026.",
    formTitle: "Remplissez le formulaire pour confirmer votre présence",
    alreadySubmitted: "Vous avez déjà répondu",
    fullName: "Nom complet",
    coupleLabel: "Couple — {a} et {b}",
    email: "E-mail (facultatif)",
    willAttend: "Serez-vous présent(e) ?",
    yesSingle: "Oui, je serai présent(e)",
    noSingle: "Non, je ne pourrai pas venir",
    yesBoth: "Oui, nous serons tous les deux présents",
    oneOnly: "Un seul de nous pourra venir",
    none: "Aucun de nous, malheureusement",
    allergies: "Allergies ou commentaires (facultatif)",
    wish: "Laissez un mot pour les mariés (facultatif)",
    displayNameCheckbox: "Afficher mon nom sur le mur des vœux",
    sending: "Envoi en cours…",
    submit: "Envoyer le RSVP",
    update: "Mettre à jour le RSVP",
    success: "Merci — votre RSVP a bien été enregistré !",
    error: "Une erreur est survenue. Veuillez réessayer.",
  },
  wishWall: {
    heading: "Le Mur des Vœux",
    subcopy:
      "Pincez ou faites défiler pour zoomer, glissez pour explorer — mis à jour en direct au fil des vœux.",
    empty: "Soyez le premier à laisser un vœu ci-dessus 💌",
    anonymous: "Anonyme",
  },
  dressCode: {
    eyebrow: "Code Vestimentaire",
    sapphire: "Saphir",
    onyx: "Onyx",
    amethyst: "Améthyste",
    wine: "Bordeaux",
    gold: "Or",
  },
  shareMoment: {
    eyebrow: "En Direct Du Jour J",
    title: "Partagez un Instant",
    description:
      "Prenez la photo, envoyez-la — tout le monde la voit en direct.",
    lockedMessage:
      "Seuls les invités peuvent partager un instant — ouvrez le lien d'invitation personnel envoyé sur WhatsApp pour y publier vos photos et vidéos.",
    namePlaceholder: "Votre nom",
    uploading: "Envoi en cours…",
    uploadFailed: "Échec de l'envoi",
    uploadFailedConn:
      "Échec de l'envoi — vérifiez votre connexion et réessayez.",
    uploadedByAlt: "Publié par {name}",
  },
  contact: {
    eyebrow: "Contactez-Nous",
    title: "Des questions ?",
    description: "Nos organisateurs se feront un plaisir de vous aider.",
  },
  footer: {
    admin: "Admin",
    madeWithLove: "23 . 12 . 2026 — Fait avec amour",
  },
  installPrompt: {
    message:
      "Installez l'application Beni & Dorah pour un accès rapide le jour J.",
    install: "Installer",
    later: "Plus tard",
  },
  lightbox: {
    close: "Fermer ✕",
    closeAria: "Fermer",
    prev: "← Précédent",
    prevAria: "Précédent",
    next: "Suivant →",
    nextAria: "Suivant",
    captionFallback: "Photo de la galerie",
  },
  countdown: {
    days: "Jours",
    hours: "Heures",
    min: "Min",
    sec: "Sec",
  },
};

export const translations: Record<Locale, typeof en> = { en, fr };
