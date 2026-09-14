import { LocaleProvider } from './LocaleProvider';
import Nav from './Nav';
import Hero from './Hero';
import History from './History';
import Gallery from './Gallery';
import AddressSchedule from './AddressSchedule';
import GiftRegistry from './GiftRegistry';
import RSVPForm from './RSVPForm';
import WishWall from './WishWall';
import DressCode from './DressCode';
import ShareMoment from './ShareMoment';
import Contact from './Contact';
import Footer from './Footer';
import InstallPrompt from './InstallPrompt';
import {
  SITE_COPY,
  getHistoryItems,
  getGalleryItems,
  getGiftItems,
  getVisibleTickets,
  getVisibleMoments,
} from '@/lib/content';
import type { Guest, Rsvp } from '@prisma/client';

export default async function WeddingPage({ guest }: { guest: (Guest & { rsvp: Rsvp | null }) | null }) {
  const [history, gallery, gifts, tickets, moments] = await Promise.all([
    getHistoryItems(),
    getGalleryItems(),
    getGiftItems(),
    getVisibleTickets(),
    getVisibleMoments(),
  ]);

  const rsvpGuest = guest
    ? {
        id: guest.id,
        fullName: guest.fullName,
        partnerName: guest.partnerName,
        type: guest.type,
        email: guest.email,
        existingRsvp: guest.rsvp
          ? {
              attending: guest.rsvp.attending,
              allergyComment: guest.rsvp.allergyComment,
              wishText: guest.rsvp.wishText,
              displayNameOnWall: guest.rsvp.displayNameOnWall,
            }
          : null,
      }
    : null;

  return (
    <LocaleProvider>
      <Nav />
      <Hero coupleNames={SITE_COPY.coupleNames} posterSrc="/images/couple/hero-poster.jpg" />
      <History
        items={history.map((h) => ({
          id: h.id,
          title: h.title,
          titleFr: h.titleFr,
          descriptionShort: h.descriptionShort,
          descriptionShortFr: h.descriptionShortFr,
          descriptionFull: h.descriptionFull,
          descriptionFullFr: h.descriptionFullFr,
          eventDate: h.eventDate.toISOString(),
          thumbnailUrl: h.thumbnailUrl,
          images: h.images,
        }))}
      />
      <Gallery
        items={gallery.map((g) => ({ id: g.id, mediaUrl: g.mediaUrl, mediaType: g.mediaType, thumbnailUrl: g.thumbnailUrl }))}
      />
      <AddressSchedule />
      <GiftRegistry
        guestId={guest?.id ?? null}
        gifts={gifts.map((g) => ({
          id: g.id,
          name: g.name,
          nameFr: g.nameFr,
          description: g.description,
          descriptionFr: g.descriptionFr,
          imageUrl: g.imageUrl,
          priceZar: g.priceZar.toString(),
          priceUsd: g.priceUsd.toString(),
          status: g.status,
        }))}
      />
      <RSVPForm guest={rsvpGuest as any} />
      <WishWall
        initialTickets={tickets.map((t) => ({ id: t.id, displayName: t.displayName, message: t.message, color: t.color }))}
      />
      <DressCode />
      <ShareMoment
        guest={guest ? { userHashCode: guest.userHashCode, fullName: guest.fullName } : null}
        initialMoments={moments.map((m) => ({
          id: m.id,
          uploaderName: m.uploaderName,
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType,
        }))}
      />
      <Contact />
      <Footer />
      <InstallPrompt />
    </LocaleProvider>
  );
}
