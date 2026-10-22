# AGAMA Blogger and Umami Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AGAMA's client-facing Blogger able to create and publish posts, and ship the already-built Umami loader with an operator-verifiable production configuration.

**Architecture:** Reuse AGAMA's static blog data and the authenticated post-manager pattern already operating for another client. A small Node service owns draft/published post persistence under a mounted data directory; Nginx proxies the protected admin API and serves generated posts. Umami remains build-time configured through the existing shared analytics loader.

**Tech Stack:** Node.js 20, static HTML/CSS/JavaScript, Nginx, Supabase Auth REST verification, node:test, Playwright smoke tests.

**Spec:** User request in this task; existing analytics plan `docs/superpowers/plans/2026-10-13-analytics-umami.md`; reference implementation in the Samuel client repository.

## Global Constraints

- Only AGAMA's actual editorial blog is exposed in Blogger; product/SEO URL inventory is out of scope.
- Admin APIs require a valid Supabase user token and an allowlisted email.
- New posts are drafts until the explicit Publish action.
- Published files and uploaded images survive container replacement through `AGAMA_CONTENT_DIR`.
- No secret or invented Umami website ID is committed.

## Review Focus

- Path traversal in slugs or uploaded filenames must be rejected.
- Unauthenticated and non-allowlisted users must not reach mutation APIs.
- A failed publication build must not report success.
- Existing snapshot posts must be listed without importing unrelated SEO pages.
- Missing Umami configuration must remain inert; configured builds must load exactly one tracker.

### Task 1: Blogger content core

**Files:** Create `scripts/agama-blogger-core.mjs`; create `tests/agama-blogger-core.test.mjs`.

**Interfaces:** Produces `listPosts`, `readPost`, `savePost`, `savePostImage`, and `publishPost` operating on an explicit content root and the nine-post AGAMA snapshot.

- [ ] Write failing tests for the nine legacy posts, draft creation, validation, safe images, and publication output.
- [ ] Run `node --test tests/agama-blogger-core.test.mjs` and confirm the expected missing-module failure.
- [ ] Implement the smallest content core satisfying the tests.
- [ ] Run the test again and confirm it passes.

### Task 2: Authenticated service and client UI

**Files:** Create `scripts/agama-blogger-server.mjs`, `admin/index.html`, `admin/blogger/index.html`, `admin/blogger/app.js`, `admin/blogger/styles.css`, `assets/js/admin-auth.js`; create `tests/agama-blogger-server.test.mjs`.

**Interfaces:** Consumes Task 1 APIs; produces `/api/blogger/posts`, post/image mutations, `/api/blogger/publish`, and the client-facing editor at `/admin/blogger/`.

- [ ] Write failing server tests for authentication and API routing.
- [ ] Run the targeted test and confirm failure.
- [ ] Implement bearer-token verification and the editor UI.
- [ ] Run targeted tests and confirm pass.

### Task 3: Container routing and analytics preservation

**Files:** Modify `Dockerfile`, `nginx.conf`, `scripts/start-agama-container.sh`, `package.json`, `docs/analytics.md`; create/update deployment smoke tests.

**Interfaces:** Consumes the Blogger service and existing analytics loader; produces a container that starts Blogger without overwriting the built Umami configuration and accepts `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `AGAMA_ADMIN_EMAILS`, and `AGAMA_CONTENT_DIR`.

- [ ] Write failing configuration assertions.
- [ ] Run them and confirm failure.
- [ ] Wire the service, Nginx proxy, persistent content directory, and exact environment-variable documentation.
- [ ] Run all Blogger, analytics, smoke, and build checks.

