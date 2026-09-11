# Deploying benidorah.com to the Interserver VPS (162.35.172.181)

## 0. Prerequisites on the VPS

```bash
ssh root@162.35.172.181
apt update && apt install -y docker.io docker-compose-plugin git
```

Confirm DNS: `benidorah.com` and `www.benidorah.com` A records both point at `162.35.172.181` (per the brief, this is already done).

## 1. Get the code onto the server

```bash
git clone <your-repo-url> /opt/benidorah
cd /opt/benidorah
cp .env.example .env
```

Edit `.env` and fill in real values: `POSTGRES_PASSWORD`, `JWT_SECRET` (`openssl rand -hex 32`), `SITE_URL=https://benidorah.com`, WhatsApp credentials, upload dirs.

## 2. Upload the private hero media (not tracked in git)

`media/private/*.mp4` (`hero-main.mp4`, `hero-placeholder.mp4`, `highlight.mp4` — ~45MB total) are deliberately gitignored — they're binary assets, not code — so `git clone` won't bring them over. Copy them up once, from your Mac:

```bash
scp media/private/hero-main.mp4 media/private/hero-placeholder.mp4 media/private/highlight.mp4 \
  root@162.35.172.181:/tmp/
```

Then, once the `web` service has started at least once (so its `private_media` volume exists — `docker compose up -d web` in the next step creates it), copy the files into that volume via the running container:

```bash
docker compose cp /tmp/hero-main.mp4 web:/data/private-media/hero-main.mp4
docker compose cp /tmp/hero-placeholder.mp4 web:/data/private-media/hero-placeholder.mp4
docker compose cp /tmp/highlight.mp4 web:/data/private-media/highlight.mp4
```

Without this step the hero section will load with no video (audio/video 404s from `/api/media/*`) even though everything else works. Re-do it after any `docker compose down -v` (which deletes volumes) — a normal `down`/`up` does not touch this volume.

## 3. First-time TLS bootstrap (chicken-and-egg with nginx)

Nginx's config expects certs to already exist at `/etc/letsencrypt/live/benidorah.com/`. Bootstrap once with a temporary HTTP-only config:

```bash
# Start db + web only first
docker compose up -d db
docker compose run --rm web npx prisma migrate deploy
docker compose run --rm web npm run db:seed

# Temporarily comment out the :443 server block in nginx/benidorah.conf, then:
docker compose up -d web nginx

# Issue the certificate (webroot mode, matches the acme-challenge location above)
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d benidorah.com -d www.benidorah.com \
  --email benidorah@gmail.com --agree-tos --no-eff-email

# Restore the :443 server block in nginx/benidorah.conf, then reload:
docker compose up -d --build
docker compose exec nginx nginx -s reload
```

(Do the private-media upload from step 2 any time after `docker compose up -d web` above has run once.)

## 4. Steady-state deploy (subsequent updates)

```bash
cd /opt/benidorah
git pull
docker compose build web
docker compose run --rm web npx prisma migrate deploy
docker compose up -d
```

Private media in the `private_media` volume persists across this — no need to re-upload unless you're changing the videos themselves.

## 5. Certbot auto-renewal

The `certbot` service in `docker-compose.yml` already loops `certbot renew` every 12h. Verify it's running:

```bash
docker compose ps certbot
docker compose logs certbot --tail=50
```

After a renewal, reload nginx so it picks up the new cert:

```bash
docker compose exec nginx nginx -s reload
```

Add a cron entry as a backstop in case the container restarts oddly:

```cron
0 3 * * * cd /opt/benidorah && docker compose exec nginx nginx -s reload >> /var/log/benidorah-nginx-reload.log 2>&1
```

## 6. Post-deploy checklist

- [ ] `https://benidorah.com` loads over HTTPS, no mixed-content warnings
- [ ] The hero video actually plays (confirms step 2's media upload worked — check the browser network tab for `/api/media/hero-main` returning 200/206, not 404)
- [ ] `https://benidorah.com/<a-real-guest-hash>` resolves the personalised RSVP flow
- [ ] Log into `/admin` with each seeded account and complete the forced password reset — see README for the seeded emails, and change every one of those throwaway passwords immediately
- [ ] Submit a test RSVP and confirm it appears instantly on the Wish Wall (Socket.IO working through nginx)
- [ ] Upload a test "moment" and confirm it appears live
- [ ] Send a real WhatsApp invite to a test number and confirm delivery (or confirm it's still in documented mock mode if credentials aren't set yet)
- [ ] Run a Lighthouse PWA audit on a real mobile device; confirm "Add to Home Screen" works
- [ ] Confirm uploaded media in `/data/uploads` survives `docker compose restart`
- [ ] Set up a backup cron for the `pg_data` and `uploads` volumes, e.g. nightly `pg_dump` + `tar` off-box

## 7. Backups (minimal)

```bash
# nightly cron
0 2 * * * docker compose exec -T db pg_dump -U benidorah benidorah | gzip > /opt/backups/benidorah-$(date +\%F).sql.gz
```

Back up the `private_media` volume too, since it's the one thing that isn't reproducible from git: `docker run --rm -v benidorah_private_media:/data -v /opt/backups:/backup alpine tar czf /backup/private-media-$(date +%F).tar.gz -C /data .`

## 8. Rolling back

```bash
git checkout <previous-tag-or-commit>
docker compose build web
docker compose up -d
```

Database migrations are additive-by-default (Prisma migrate); a schema rollback needs a manually written down-migration — don't rely on `prisma migrate reset` in production.
