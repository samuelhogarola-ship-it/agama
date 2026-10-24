# AGAMA Blogger Phase 1B Direct Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace browser-stored bearer tokens with server-managed sessions, add safe password recovery, explicit AGAMA roles, and harden publication without changing public blog URLs.

**Architecture:** The Blogger service becomes the only browser-facing authentication boundary. It exchanges credentials and recovery tokens with Supabase, stores access/refresh tokens only in secure HttpOnly cookies, checks explicit role configuration on every request, and validates all mutable inputs before the existing file-backed publishing store writes them.

**Tech Stack:** Node.js 20 HTTP server and tests, Supabase Auth REST API, static ES-module client, `sanitize-html`, nginx.

**Spec:** `docs/superpowers/specs/2026-10-24-agama-blogger-secure-access-design.md`

## Global Constraints

- Execute only after Phase 1A is deployed and verified.
- No credential, password, refresh token, Magic Link, TOTP seed, or service-role key may enter Git or logs.
- Supabase remains the password store; `.env` contains service configuration only.
- `client_publisher` and `studio_admin` are the only Blogger roles.
- TOTP is not required for client accounts; master-panel MFA belongs to Phase 2.
- Public `/blog/` and `/entrada-de-blog/.../` routes must not change.
- A missing authorization configuration must fail closed.
- One task must pass its complete checks and be reviewed before the next task starts.

## Review Focus

- Valid Supabase identity without an AGAMA role must receive `403`, including when an old allowlist variable is present.
- Cross-origin mutable requests must fail even when they carry a valid cookie.
- Login/recovery responses must not reveal whether an email exists, and throttling must not be bypassed by email case changes.
- Recovery tokens, access tokens, passwords, and reset URLs must never appear in logs, error bodies, localStorage, or audit events.
- Publishing malicious HTML or a disguised image must fail or be sanitised without changing established public URLs.

---

### Task 1: Explicit roles and fail-closed authorization

**Files:**
- Create: `scripts/agama-blogger-auth.mjs`
- Create: `tests/agama-blogger-auth.test.mjs`
- Modify: `scripts/agama-blogger-server.mjs`
- Modify: `tests/agama-blogger-server.test.mjs`
- Modify: `scripts/start-agama-container.sh`

**Interfaces:**
- Produces: `createAuthService({ supabaseUrl, supabaseAnonKey, roleBindings, publicOrigin, fetchImpl, clock })` with `authenticateRequest(req)` and `authorizeUser(user, clientId)`.
- Produces: role result `{ userId, email, role, clientId: "agama" }`.

- [ ] **Step 1: Write failing tests for exact roles, missing config, mixed-case email, and legacy variable rejection**
- [ ] **Step 2: Run `node --test tests/agama-blogger-auth.test.mjs tests/agama-blogger-server.test.mjs` and confirm failures**
- [ ] **Step 3: Implement role parsing from explicit deployment configuration and remove the hard-coded `info@webfuengirola.com` fallback**
- [ ] **Step 4: Run `npm run test:blogger` and confirm all tests pass**
- [ ] **Step 5: Commit with `git commit -m "security(blogger): enforce explicit AGAMA roles"`**

### Task 2: HttpOnly session endpoints and CSRF boundary

**Files:**
- Modify: `scripts/agama-blogger-auth.mjs`
- Modify: `scripts/agama-blogger-server.mjs`
- Modify: `admin/blogger/app.js`
- Modify: `tests/agama-blogger-auth.test.mjs`
- Modify: `tests/agama-blogger-server.test.mjs`

**Interfaces:**
- Produces: `POST /api/blogger/auth/login`, `POST /api/blogger/auth/refresh`, `POST /api/blogger/auth/logout`, `GET /api/blogger/auth/session`.
- Produces: `__Host-agama_blogger_access` and `__Host-agama_blogger_refresh` cookies, never readable by JavaScript.

- [ ] **Step 1: Write failing tests for secure cookie flags, refresh rotation, logout clearing, exact-Origin checks, expired sessions, and no token-bearing response body**
- [ ] **Step 2: Run focused auth/server tests and confirm failures**
- [ ] **Step 3: Implement the four endpoints and cookie authorization; use injectable cookie security in tests but require Secure on the production origin**
- [ ] **Step 4: Replace direct Supabase login and `localStorage` use in `admin/blogger/app.js` with same-origin credentialed requests**
- [ ] **Step 5: Run auth, server, and static-shell tests; grep built assets for `agama-blogger-token` and confirm zero matches**
- [ ] **Step 6: Commit with `git commit -m "security(blogger): move sessions to HttpOnly cookies"`**

### Task 3: Password recovery without account disclosure

**Files:**
- Modify: `admin/blogger/index.html`
- Modify: `admin/blogger/app.js`
- Modify: `scripts/agama-blogger-auth.mjs`
- Modify: `scripts/agama-blogger-server.mjs`
- Modify: `tests/agama-blogger-auth.test.mjs`
- Modify: `tests/agama-blogger-server.test.mjs`

**Interfaces:**
- Produces: `POST /api/blogger/auth/recover` and `POST /api/blogger/auth/reset-password`.
- Consumes: Supabase redirect allowlist entry `https://blogger.agama.com.mx/`.

- [ ] **Step 1: Write failing tests for generic recovery responses, fixed redirect origin, one-use reset token handling, weak-password rejection, and secret-free errors**
- [ ] **Step 2: Run focused tests and confirm failures**
- [ ] **Step 3: Implement recovery/reset endpoints and the two minimal UI states; keep tokens in memory only and remove fragments/query secrets immediately with `history.replaceState`**
- [ ] **Step 4: Run `npm run test:blogger`, build, and browser-level recovery UI tests with a fake Supabase service**
- [ ] **Step 5: Commit with `git commit -m "feat(blogger): add safe password recovery"`**

### Task 4: Rate limits and audit trail

**Files:**
- Create: `scripts/agama-blogger-security.mjs`
- Create: `tests/agama-blogger-security.test.mjs`
- Modify: `scripts/agama-blogger-server.mjs`
- Modify: `scripts/start-agama-container.sh`

**Interfaces:**
- Produces: `createRateLimiter({ clock, windowMs, maxAttempts })` and `createAuditWriter({ auditPath, clock })`.
- Audit schema: `{ at, actorId, actorEmail, role, action, target, outcome, requestId }`; no tokens, passwords, bodies, or reset URLs.

- [ ] **Step 1: Write failing tests for IP+normalised-email throttling, bounded memory cleanup, proxy trust rules, and audit redaction**
- [ ] **Step 2: Run focused tests and confirm failures**
- [ ] **Step 3: Apply rate limits to login/recovery and append audit events for login outcome, draft save, image upload, publish, and logout**
- [ ] **Step 4: Run all Blogger tests and inspect a generated audit fixture for prohibited fields**
- [ ] **Step 5: Commit with `git commit -m "security(blogger): add throttling and audit events"`**

### Task 5: Safe content, images, and route stability

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `Dockerfile`
- Modify: `scripts/agama-blogger-core.mjs`
- Modify: `tests/agama-blogger-core.test.mjs`

**Interfaces:**
- Produces: `sanitizePostHtml(html)` and `validateImageBuffer(fileName, buffer, maxBytes)`.
- Keeps: published slug immutable; managed index markers mandatory.

- [ ] **Step 1: Write failing tests for scripts/event handlers/javascript URLs, disguised images, oversized decoded images, published-slug rename, and missing index markers**
- [ ] **Step 2: Run core tests and confirm failures**
- [ ] **Step 3: Add a pinned `sanitize-html` production dependency and ensure its runtime modules are copied into the Blogger image**
- [ ] **Step 4: Sanitize with an explicit editorial tag/attribute allowlist, validate image signatures after base64 decoding, reject published slug changes, and make `rebuildIndex()` fail when markers are absent**
- [ ] **Step 5: Run `npm run test:blogger`, `npm run build`, container build, `npm audit --omit=dev`, and route snapshots**
- [ ] **Step 6: Commit with `git commit -m "security(blogger): harden publishing inputs"`**

### Task 6: End-to-end gate and controlled rollout

**Files:**
- Create: `tests/agama-blogger-auth-flow.spec.js`
- Modify: `playwright.config.js`
- Modify: `scripts/verify-blogger-subdomain.mjs`
- Modify: `docs/change-scope.md`

**Interfaces:**
- Consumes: fake/local Supabase fixture accounts for `client_publisher`, `studio_admin`, and unauthorized user; never production credentials.
- Produces: repeatable direct-login/recovery/publish smoke gate.

- [ ] **Step 1: Add failing end-to-end tests for login, browser password fields, unauthorized user, logout, recovery UI, draft, publish, sanitisation, and unchanged public routes**
- [ ] **Step 2: Run the focused Playwright suite and confirm failures**
- [ ] **Step 3: Extend local fixtures/verifier until all flows are deterministic without network access**
- [ ] **Step 4: Run `npm run test:blogger`, the focused Playwright suite, build, container verifier, `npm audit --omit=dev`, and `git diff --check`**
- [ ] **Step 5: Review the complete diff for secrets and confirm only Blogger/auth/deployment files changed**
- [ ] **Step 6: Deploy a preview, run the same suite, then merge only this phase after evidence is recorded**
- [ ] **Step 7: Provision the real client identity through Supabase administration using the client email supplied out of band; never commit it unless explicitly approved as non-sensitive configuration**
- [ ] **Step 8: Smoke-test production direct login, logout, recovery email delivery, draft, publish, existing blog route, GTM, and Umami; roll back the release on any failure**
