# AGAMA Blogger Phase 1A Subdomain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the existing AGAMA Blogger safely at `blogger.agama.com.mx`, apply AGAMA blue branding, and preserve all public routes before DNS cutover.

**Architecture:** Keep the existing single container and Blogger API process. Add an nginx virtual host that maps the subdomain root to the existing static Blogger assets and proxies only its API; leave the current `/admin/blogger/` route available until the final verified cutover. DNS is a separate operational gate after local Host-header tests.

**Tech Stack:** Static HTML/CSS/ES modules, nginx, Node.js 20 test runner, Docker/Coolify deployment.

**Spec:** `docs/superpowers/specs/2026-10-24-agama-blogger-secure-access-design.md`

## Global Constraints

- Do not change prices, catalogue data, GTM, Umami, `/blog/`, or `/entrada-de-blog/.../` routes.
- Use AGAMA blue `#1745f5` and dark blue `#0f2f99`.
- Keep `/admin/blogger/` usable until the new hostname has passed production smoke tests.
- Do not change DNS before local nginx tests pass.
- One change block, one complete verification, one reviewed commit; do not start the next block first.
- Do not add credentials or human secrets to code, `.env`, fixtures, or logs.

## Review Focus

- A request with `Host: www.agama.com.mx` must still serve the public site, never the subdomain editor shell.
- A request with `Host: blogger.agama.com.mx` to `/` must serve Blogger, while an unknown path must not expose arbitrary public-site files.
- `/api/blogger/*` must keep proxying on the Blogger host and retain the existing request-size limit.
- `/admin/blogger/` must remain available before cutover and redirect only in the separately verified final step.
- The editor must use relative asset URLs, `noindex`, and no external scripts introduced by this change.

---

### Task 1: Pin the subdomain routing contract

**Files:**
- Modify: `tests/agama-blogger-deployment.test.mjs`
- Modify: `nginx.conf`

**Interfaces:**
- Consumes: existing upstream `agama_blogger` at `127.0.0.1:3010`.
- Produces: nginx virtual host contract for `blogger.agama.com.mx`.

- [ ] **Step 1: Add failing deployment assertions**

Add a test named `Blogger subdomain serves only the editor and its API` asserting the nginx configuration contains `server_name blogger.agama.com.mx`, maps `/` to `/admin/blogger/`, proxies `/api/blogger/` to `agama_blogger`, sets `X-Robots-Tag`, and denies dotfiles/unknown static traversal.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node --test tests/agama-blogger-deployment.test.mjs`
Expected: FAIL because the subdomain server block is absent.

- [ ] **Step 3: Add the isolated nginx server block**

Modify `nginx.conf` so the existing public server remains unchanged and a separate `server_name blogger.agama.com.mx` serves only the editor shell/assets plus `/api/blogger/`. Add `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `X-Robots-Tag: noindex, nofollow`, and a CSP compatible with current same-origin assets and Supabase authentication.

- [ ] **Step 4: Run the deployment tests**

Run: `npm run test:blogger`
Expected: 13 tests pass, 0 fail.

- [ ] **Step 5: Commit the independently testable routing block**

```bash
git add nginx.conf tests/agama-blogger-deployment.test.mjs
git commit -m "feat(blogger): add isolated subdomain routing"
```

### Task 2: Make the editor subdomain-safe and apply AGAMA branding

**Files:**
- Modify: `admin/blogger/index.html`
- Modify: `admin/blogger/styles.css`
- Modify: `tests/agama-blogger-deployment.test.mjs`

**Interfaces:**
- Consumes: subdomain root mapping from Task 1.
- Produces: editor shell that works at both `/` and the temporary legacy path.

- [ ] **Step 1: Add failing static-shell assertions**

Add a test named `Blogger shell is subdomain-safe and branded` asserting relative `styles.css` and `app.js` references, `robots=noindex,nofollow`, `autocomplete=username`, `autocomplete=current-password`, CSS variable `--brand:#1745f5`, and dark brand `#0f2f99`.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node --test tests/agama-blogger-deployment.test.mjs`
Expected: FAIL on absolute `/admin/blogger/` assets and green variables.

- [ ] **Step 3: Update the editor shell and palette**

Use relative asset URLs, add the robots meta tag, retain password-manager autocomplete values, rename color variables semantically, and replace all green presentation states with the pinned AGAMA blues. Do not change editor behavior.

- [ ] **Step 4: Run Blogger tests and a static build**

Run: `npm run test:blogger`
Expected: all tests pass.

Run: `npm run build`
Expected: exit 0 and `dist/admin/blogger/index.html` references relative assets.

- [ ] **Step 5: Commit the independently testable shell block**

```bash
git add admin/blogger/index.html admin/blogger/styles.css tests/agama-blogger-deployment.test.mjs
git commit -m "style(blogger): apply AGAMA blue subdomain shell"
```

### Task 3: Verify locally without DNS

**Files:**
- Create: `scripts/verify-blogger-subdomain.mjs`
- Modify: `package.json`
- Modify: `docs/change-scope.md`

**Interfaces:**
- Consumes: built Docker/nginx configuration and host mapping from Tasks 1-2.
- Produces: repeatable command `npm run verify:blogger-subdomain`.

- [ ] **Step 1: Add a failing verifier test contract**

Extend `tests/agama-blogger-deployment.test.mjs` with `subdomain verifier checks both hosts and public blog routes`, asserting the verifier requests the Blogger root with its Host header, the public root with `www.agama.com.mx`, `/blog/`, one existing `/entrada-de-blog/.../`, `/api/blogger/config`, and an unauthenticated protected API route expecting `401`.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node --test tests/agama-blogger-deployment.test.mjs`
Expected: FAIL because the verifier does not exist.

- [ ] **Step 3: Implement the verifier and npm script**

Create `scripts/verify-blogger-subdomain.mjs` accepting `BLOGGER_VERIFY_BASE_URL` (default `http://127.0.0.1`) and sending explicit Host headers. It must exit non-zero on a wrong status, wrong content marker, cross-host leakage, or redirect before cutover. Add `verify:blogger-subdomain` to `package.json` and record the exact scope in `docs/change-scope.md`.

- [ ] **Step 4: Run unit, build, container-config, and secret checks**

Run: `npm run test:blogger`
Expected: all tests pass.

Run: `npm run build`
Expected: exit 0.

Run: `nginx -t -c "$PWD/nginx.conf"`
Expected: syntax success after supplying a local-compatible prefix/config fixture if the host nginx layout differs from Alpine.

Run: `git diff --check && git diff --cached --check`
Expected: no output.

Run: `rg -n '(password|secret|service_role|access_token|refresh_token)\s*[:=]' admin/blogger scripts/verify-blogger-subdomain.mjs nginx.conf docs/change-scope.md`
Expected: no credentials; only intentional field/config names, reviewed manually.

- [ ] **Step 5: Start the local container and execute the verifier**

Run: `docker build -t agama-blogger-subdomain:test .`
Expected: image builds.

Run: `docker run --rm -p 8080:80 --env-file <local-noncommitted-env> agama-blogger-subdomain:test`
Expected: healthy local service; environment file remains outside Git.

Run: `BLOGGER_VERIFY_BASE_URL=http://127.0.0.1:8080 npm run verify:blogger-subdomain`
Expected: every Blogger and public-route check passes.

- [ ] **Step 6: Review and commit the verification gate**

```bash
git add scripts/verify-blogger-subdomain.mjs package.json docs/change-scope.md tests/agama-blogger-deployment.test.mjs
git commit -m "test(blogger): verify subdomain isolation locally"
```

### Task 4: Controlled DNS cutover and rollback proof

**Files:**
- Modify: `docs/change-scope.md`
- Modify after successful cutover only: `nginx.conf`
- Modify after successful cutover only: `tests/agama-blogger-deployment.test.mjs`

**Interfaces:**
- Consumes: a reviewed deployment running the Task 1-3 code and the verified target hostname supplied by the hosting platform.
- Produces: active `blogger.agama.com.mx` and a documented rollback.

- [ ] **Step 1: Deploy only the reviewed Phase 1A commits to a preview/staging target**

Record deployment URL and immutable revision in `docs/change-scope.md`. Do not change DNS yet.

- [ ] **Step 2: Run the verifier against the preview target**

Run: `BLOGGER_VERIFY_BASE_URL=<preview-url> npm run verify:blogger-subdomain`
Expected: all checks pass with explicit Host headers.

- [ ] **Step 3: Create the DNS record**

Create only the required `blogger.agama.com.mx` CNAME/A record pointing at the already-verified deployment. Record the previous/absent value and TTL for rollback; make no other DNS changes.

- [ ] **Step 4: Verify production before changing the legacy path**

Run: `BLOGGER_VERIFY_BASE_URL=https://blogger.agama.com.mx npm run verify:blogger-subdomain`
Expected: editor `200`, config `200`, protected API `401`, public routes unchanged, TLS valid.

- [ ] **Step 5: Add and test the legacy redirect as a separate change**

First add a failing assertion that `/admin/blogger/` redirects with `302` to `https://blogger.agama.com.mx/`; then update only the public nginx server block. Keep the redirect temporary and reversible.

- [ ] **Step 6: Run complete production smoke checks and record rollback**

Verify `https://www.agama.com.mx/`, `/blog/`, an existing post route, GTM request, Umami request, direct Blogger login shell, and the legacy redirect. If any check fails, remove/revert the redirect first, then restore the DNS value recorded in Step 3.

- [ ] **Step 7: Commit the proven operational record**

```bash
git add docs/change-scope.md nginx.conf tests/agama-blogger-deployment.test.mjs
git commit -m "ops(blogger): record verified subdomain cutover"
```
