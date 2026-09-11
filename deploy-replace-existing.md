# Replacing the existing `denidorah` instance with this codebase

Context: there's already a Docker Compose-based site running on the VPS
(`deploy@162.35.172.181`) in a `denidorah` folder, with no real guest data
worth preserving. This replaces it with the current `benidorah-wedding`
codebase, deployed fresh alongside it, verified, then the old one is torn
down — rather than deleting the old one first and hoping the new one comes
up clean.

## 0. Find out exactly what's there first

Don't skip this even though the old data isn't precious — you want to know
before you touch anything, not after.

```bash
ssh deploy@162.35.172.181
find ~ -maxdepth 2 -iname "*denidorah*" -o -iname "*benidorah*"
cd ~/denidorah   # adjust to wherever the above actually found it
docker compose ps
cat docker-compose.yml | grep -A2 "ports:"   # confirm it's holding :80/:443
```

If anything here contradicts what you expected (e.g. it's not actually
Docker, or `docker compose ps` shows something you don't recognize), stop
and figure that out before continuing — the rest of this assumes the old
stack is a plain `docker compose` setup bound to ports 80/443.

## 1. Quick just-in-case backup (cheap insurance, ~1 minute)

Even though you said this is safe to wipe, this costs almost nothing and
means there's no "oops" moment:

```bash
cd ~/denidorah
docker compose exec -T db pg_dump -U benidorah benidorah 2>/dev/null | gzip > ~/denidorah-old-db-backup-$(date +%F).sql.gz || echo "no db service named 'db' / 'benidorah' — check docker-compose.yml service/db names and adjust"
docker compose ps -q | xargs -I{} docker inspect {} --format '{{.Name}}: {{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}' > ~/denidorah-old-volumes.txt
```

That second command just lists what's mounted where, so you have a record
of exactly what existed if you ever need to check.

## 2. Stop the old stack (don't delete anything yet)

```bash
cd ~/denidorah
docker compose down
```

Deliberately **not** `-v` here — this stops the containers and frees up
ports 80/443 without deleting the old volumes yet. They'll sit there
harmlessly until step 7.

## 3. Get the new code onto the server, in a fresh directory

Keeping it separate from `~/denidorah` until it's verified working means
there's always a way back if something goes wrong.

```bash
cd ~
git clone https://github.com/benikalonga/benidorah-wedding.git benidorah
cd benidorah
cp .env.example .env
```

Edit `.env` and fill in **real** values for:
- `DATABASE_URL` (matches `POSTGRES_*` below)
- `JWT_SECRET` — `openssl rand -hex 32`
- `ADMIN_SEED_PASSWORD` — a throwaway first-login password for the 4 seeded admin accounts (each forces its own reset immediately)
- `SITE_URL="https://benidorah.com"`
- `NEXT_PUBLIC_BANK_ACCOUNT_NAME`, `NEXT_PUBLIC_BANK_ACCOUNT_NUMBER`, `NEXT_PUBLIC_BANK_ACCOUNT_TYPE`, `NEXT_PUBLIC_BANK_NAME`, `NEXT_PUBLIC_BANK_BRANCH_CODE`
- `NEXT_PUBLIC_CONTACT_DANIELLA_PHONE`, `NEXT_PUBLIC_CONTACT_JONATHAN_PHONE`
- `WHATSAPP_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` if you have them yet (otherwise the invite flow runs in documented mock mode)
- `POSTGRES_PASSWORD` (pick a real one)

## 4. Upload the private hero media (not in git)

Same gap as any fresh clone — `media/private/*.mp4` are gitignored. From
your Mac:

```bash
scp media/private/hero-main.mp4 media/private/hero-placeholder.mp4 media/private/highlight.mp4 \
  deploy@162.35.172.181:/tmp/
```

Then on the server, after `docker compose up -d web` in the next step has
run once (so the `private_media` volume exists):

```bash
docker compose cp /tmp/hero-main.mp4 web:/data/private-media/hero-main.mp4
docker compose cp /tmp/hero-placeholder.mp4 web:/data/private-media/hero-placeholder.mp4
docker compose cp /tmp/highlight.mp4 web:/data/private-media/highlight.mp4
```

## 5. Migrate, seed, and bring up the new stack

```bash
cd ~/benidorah
docker compose up -d db
docker compose run --rm web npx prisma migrate deploy
docker compose run --rm web npm run db:seed
docker compose up -d web nginx
```

## 6. TLS certificates

If the old instance already had valid Let's Encrypt certs for
`benidorah.com`, they were in the **old** compose project's
`certbot_certs` volume, which this new project doesn't share by default
(Docker Compose namespaces volumes per project directory). Simplest path:
just reissue — it's free and fast:

```bash
# Temporarily comment out the :443 server block in nginx/benidorah.conf, then:
docker compose up -d --build nginx

docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d benidorah.com -d www.benidorah.com \
  --email benidorah@gmail.com --agree-tos --no-eff-email

# Restore the :443 server block in nginx/benidorah.conf, then:
docker compose up -d --build
docker compose exec nginx nginx -s reload
```

(Let's Encrypt allows 5 duplicate certs per domain per week, so reissuing once here is well within limits.)

## 7. Verify, then — only then — remove the old one

Run through the checklist in `deploy.md` §6 (site loads over HTTPS, hero
video plays, a real guest hash resolves RSVP, admin login works, RSVP
submission shows on the Wish Wall live, etc.) against the **new** stack
before touching the old one.

Once you're satisfied the new site is fully working:

```bash
cd ~/denidorah
docker compose down -v          # -v now, actually removes the old volumes
cd ~
mv denidorah denidorah-old-backup   # keep the files for a few days rather than rm -rf immediately
```

Delete `~/denidorah-old-backup` (and the backup files from step 1) once
you're confident you won't need them — no rush.

## 8. Ongoing updates from here

Once this is live, `deploy.md` §4 ("Steady-state deploy") is what you use
for every future update — `git pull`, rebuild, migrate, `up -d`.
