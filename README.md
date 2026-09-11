# benidorah.com — Beni & Dorah Wedding Platform

A production wedding platform for Beni & Dorah's wedding on **23 December 2026**: a mobile-first installable PWA at `benidorah.com` (with personalised `/{hash}` guest links) and a role-gated admin console at `/admin`.

## Stack

- **Next.js 14 (App Router) + TypeScript**, custom Node server (`server/index.js`) with **Socket.IO** attached for the live Wish Wall / Share-a-Moment feeds
- **PostgreSQL + Prisma**
- **Tailwind CSS** with the "Modern Royalty" design tokens (royal blue / onyx / champagne gold / ivory)
- **Framer Motion** for the hero parallax, timeline reveals and lightbox transitions
- **JWT (jose) + bcrypt** admin sessions, httpOnly cookies, forced first-login password reset
- **WhatsApp Cloud API** adapter for the guest invite flow (mock mode when no credentials are configured)
- **next-pwa** for the installable PWA shell
- **Docker Compose**: `web`, `db` (Postgres), `nginx`, `certbot`

## Local development

```bash
cp .env.example .env   # then edit DATABASE_URL, JWT_SECRET, etc.
npm install
npm run db:migrate:dev
npm run db:seed
npm run dev
```

The dev server runs on `http://localhost:3000` via the custom Socket.IO-aware server, so always use `npm run dev` / `npm start` rather than `next dev` directly.

### Media assets

Two directories hold media outside of Prisma:

- `public/images/couple/` — the couple's photos (gallery/history seed images, PWA icons, OG image)
- `media/private/` — `hero-main.mp4`, `hero-placeholder.mp4`, `highlight.mp4`, streamed through `/api/media/[key]` (range-request support, and the one deliberately-downloadable file — the highlight reel — gets a `Content-Disposition: attachment` when requested with `?download=1`). The two background videos have no download UI and disable the video context menu; per the brief, that's a casual-user deterrent, **not real DRM**.

Guest-uploaded "moments" land in `UPLOAD_DIR` (`./uploads` locally), partitioned by date, served by Next.js in dev and by nginx `/uploads/` in prod.

## Seeded accounts (⚠️ change on first login)

Four admin accounts are seeded, all sharing the `ADMIN_SEED_PASSWORD` value from your `.env` (set your own — this is intentionally not hardcoded, so it never lands in git history), with `must_change_password = true` — the app blocks access to everything except **Settings** until each one is reset:

- `beni@bnd.com`
- `dorah@bnd.com`
- `jonathan@bnd.com`
- `daniella@bnd.com`

**Do not deploy with the shared seed password standing.** Log in once as each and set a real password immediately after seeding. Seeding a production database without `ADMIN_SEED_PASSWORD` set will fail on purpose — see `.env.example`.

## Tests

```bash
npm test
```

Covers: password hashing/verification and session tokens, RSVP/guest input validation and Wish Wall XSS sanitization, the WhatsApp invite adapter's mock mode, and the rate limiter used on RSVP/moments/gift-contribution endpoints.

## Deployment

See [deploy.md](./deploy.md) for the full Interserver VPS runbook (Docker Compose, nginx, certbot TLS bootstrap, backups, rollback).

## Known simplifications (flagged, not hidden)

- **WhatsApp**: built against the Meta Cloud API; runs in mock mode (logs instead of sending) until `WHATSAPP_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` are set.
- **Video thumbnails**: guest-uploaded videos are stored as-is; no ffmpeg thumbnail generation pass (would need the ffmpeg binary in the runtime image).
- **Real-time layer**: single Socket.IO instance on one Node process — matches the single small VPS this is deployed to. If ever scaled to multiple app instances, add a Redis adapter for Socket.IO.
- **Rate limiting**: in-memory, per-process — fine for one instance, would need a shared store (Redis) if scaled horizontally.
