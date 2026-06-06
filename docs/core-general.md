# AGAMA — Core General

Project-wide decisions, architecture notes, and operational guides.

---

## Deploy — Coolify on VPS (Hostinger)

### Stack
- **Server:** Hostinger VPS running [Coolify](https://coolify.io) v4
- **Build:** Node 20 → `npm run build` → `dist/` (static HTML/CSS/JS)
- **Serve:** nginx:alpine (via Docker, managed by Coolify)
- **Trigger:** every push to `main` auto-deploys

---

### How it works

```
GitHub push to main
      ↓
Coolify detects new commit
      ↓
Docker build (Dockerfile at repo root)
  Stage 1 — node:20-alpine
    npm ci
    npm run build   ← fetches data from Supabase, writes dist/
  Stage 2 — nginx:alpine
    copies dist/ → /usr/share/nginx/html
      ↓
Rolling update: new container starts, old one removed
      ↓
Site live at domain
```

---

### Key files

| File | Purpose |
|---|---|
| `Dockerfile` | Two-stage build: Node build + nginx serve |
| `build.js` | SSG script — fetches Supabase data, writes `dist/` |
| `.nvmrc` | Pins Node 20 (used by local dev / CI fallback) |
| `package.json` | `npm run build` → `node build.js` |

---

### Environment variables (set in Coolify → Environment Variables)

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |

These are injected at build time so `build.js` can fetch product data.

---

### Setting up a new project of this type in Coolify

1. **Add application** → paste GitHub repo URL → Continue
2. **Build Pack:** `Dockerfile`
3. **Static site:** ✅ Yes
4. **Port:** `80`
5. **Install Command:** leave blank (Dockerfile handles it)
6. **Build Command:** leave blank (Dockerfile handles it)
7. **Publish Directory:** `/dist`
8. Go to **Environment Variables** → add `SUPABASE_URL` and `SUPABASE_ANON_KEY`
9. Hit **Save** → **Deploy**
10. First deploy takes ~2 min (pulls node:20-alpine + nginx:alpine layers)
11. Subsequent deploys are faster (layers cached)

> **Gotcha — Nixpacks:** If Coolify auto-selects Nixpacks, it will fail with  
> `npm: command not found` even with `.nvmrc` present (cached Dockerfile issue).  
> Always switch Build Pack to **Dockerfile** explicitly.

---

### Rolling updates & zero downtime

Coolify performs rolling updates by default:
- New container starts and passes healthcheck
- Old container is removed
- No downtime between deploys

---

### Accessing the live URL

Coolify assigns a temporary `sslip.io` URL on first deploy:
```
http://<id>.<server-ip>.sslip.io
```

To use a real domain:
1. Go to **General → Domains** → replace the sslip.io URL with your domain
2. Add a DNS A record pointing to the VPS IP
3. Coolify will auto-provision an SSL certificate via Let's Encrypt

---

### Rollback

If a deploy breaks the site:
1. Go to **Deployments** tab in Coolify
2. Find the last working deployment
3. Click **Rollback**

Coolify keeps previous images cached for fast rollback.

---

### Post-deploy verification

After a push reaches `main` and Coolify finishes deploying, run:

```bash
npm run verify:deploy -- --url https://your-deployed-site
```

What it checks:
- `/` home responds correctly and includes the landing newsletter form markup
- `/blog/` loads and exposes the ES newsletter form
- `/blog/index.en.html` loads and exposes the EN newsletter form
- `/contacto/` renders the contact form
- `/vacantes/jefe-de-reclutamiento-y-seleccion/` renders the job form
- `/productos/masterbatch/` loads and includes at least one Supabase-hosted product image reference

If any check fails, do not proceed to DNS / NS changes until that page is fixed in the deployed environment.

---

### Enabling HTTPS (SSL)

Coolify handles SSL certificates automatically via Let's Encrypt.  
To activate HTTPS — including on the temporary `sslip.io` domain:

1. Go to **General → Domains**
2. Change `http://` to `https://` in the domain field
3. Hit **Save** → **Redeploy**

That's it. Coolify provisions and renews the certificate automatically.

> Same process applies when switching to a real domain — just replace the full URL with `https://yourdomain.com` and point the DNS A record to the VPS IP.
