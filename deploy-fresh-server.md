# Fresh deploy to 162.35.172.181 (freshly reinstalled OS)

Server was wiped clean, so this sets everything up from scratch: base
packages, a non-root `deploy` user, Docker, host-level nginx + certbot
(so other apps can share this box later, each on its own loopback port —
`benidorah` uses **3001**, leaving 3000 free as requested), then the app
itself.

## 0. Initial setup as root

```bash
ssh root@162.35.172.181
apt update && apt upgrade -y
apt install -y docker.io docker-compose-plugin git nginx certbot python3-certbot-nginx
systemctl enable --now docker
systemctl enable --now nginx
```

Create the `deploy` user and grant it what it needs (sudo, and docker
without needing sudo for every command):

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
usermod -aG docker deploy
```

Give `deploy` the same SSH key access root has (assuming you got into root
via key auth — if you used a password instead, add your own public key to
`/home/deploy/.ssh/authorized_keys` directly instead of copying root's):

```bash
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
exit
```

## 1. Switch to the deploy user for everything else

```bash
ssh deploy@162.35.172.181
docker ps
```

If `docker ps` says permission denied, the group membership from step 0
hasn't taken effect on this session yet — log out and back in
(`exit` then `ssh deploy@162.35.172.181` again) and retry.

## 2. Get the code and configure it

```bash
cd ~
git clone https://github.com/benikalonga/benidorah-wedding.git benidorah
cd benidorah
cp .env.example .env
nano .env
```

Fill in real values for: `DATABASE_URL`, `JWT_SECRET` (`openssl rand -hex 32`),
`ADMIN_SEED_PASSWORD`, `SITE_URL="https://benidorah.com"`, the
`NEXT_PUBLIC_BANK_*` / `NEXT_PUBLIC_CONTACT_*` vars, `POSTGRES_PASSWORD`,
and WhatsApp creds if you have them. `HOST_PORT` already defaults to
`3001` — leave it unless you have a specific reason to change it.

## 3. Upload the private hero media (from your Mac, not this SSH session)

```bash
scp media/private/hero-main.mp4 media/private/hero-placeholder.mp4 media/private/highlight.mp4 \
  deploy@162.35.172.181:/tmp/
```

## 4. Migrate, seed, and bring the app up (back on the server)

```bash
cd ~/benidorah
docker compose up -d db
docker compose run --rm web npx prisma migrate deploy
docker compose run --rm web npm run db:seed
docker compose up -d web
docker compose cp /tmp/hero-main.mp4 web:/data/private-media/hero-main.mp4
docker compose cp /tmp/hero-placeholder.mp4 web:/data/private-media/hero-placeholder.mp4
docker compose cp /tmp/highlight.mp4 web:/data/private-media/highlight.mp4
curl -sI http://127.0.0.1:3001
```

That last `curl` should show real Next.js response headers — not Express,
not JSON — confirming the app itself is up and reachable before nginx
ever enters the picture.

## 5. Host nginx: HTTP first, then certbot adds HTTPS automatically

```bash
sudo tee /etc/nginx/sites-available/benidorah.com.conf > /dev/null <<'EOF'
server {
    server_name benidorah.com www.benidorah.com;
    client_max_body_size 120M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 1024;

    listen 80;
    listen [::]:80;
}
EOF
sudo ln -s /etc/nginx/sites-available/benidorah.com.conf /etc/nginx/sites-enabled/benidorah.com.conf
sudo nginx -t && sudo systemctl reload nginx
```

Confirm plain HTTP works before adding TLS:

```bash
curl -sI http://benidorah.com | head -5
```

(If that doesn't resolve/connect, double-check DNS: `benidorah.com` and
`www.benidorah.com` A records need to point at `162.35.172.181` — this
should already be the case from before the reinstall, but the OS wipe
doesn't affect DNS either way, so it's worth a quick check with `dig
benidorah.com` if step 5 doesn't respond.)

Now let certbot do the HTTPS setup — it edits the file above in place,
adding the `:443` server block and the http→https redirect automatically:

```bash
sudo certbot --nginx -d benidorah.com -d www.benidorah.com \
  --email benidorah@gmail.com --agree-tos --no-eff-email --redirect
```

## 6. Verify

```bash
curl -sI https://benidorah.com | head -5
curl -sI https://benidorah.com/api/media/hero-main | head -5
sudo systemctl list-timers | grep certbot
```

The last command should show a renewal timer already scheduled — the
certbot Debian/Ubuntu package sets this up automatically, no extra cron
needed.

Then the full checklist from `deploy.md` §6: site loads over HTTPS, hero
video plays, a real guest hash resolves RSVP, admin login forces a
password reset, a test RSVP shows up live on the Wish Wall, a test
"moment" upload appears live.

## 7. From here on

`deploy.md` §4 ("Steady-state deploy") covers every future update:
`git pull`, rebuild, migrate, `up -d` — no nginx/certbot changes needed
again unless you add another domain.
