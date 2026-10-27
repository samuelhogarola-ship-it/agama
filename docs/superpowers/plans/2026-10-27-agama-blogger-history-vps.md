# AGAMA Blogger Historical Content on VPS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preload all 23 public editorial documents into AGAMA's existing VPS Blogger and give them the same safe draft/publish/withdraw/delete lifecycle as new posts.

**Architecture:** Generate a versioned Git baseline from the two committed blog indexes and their article pages, then layer atomic managed overrides and deletion tombstones in the existing private VPS volume. Preserve historical page templates when publishing and fail closed around featured articles or unknown templates.

**Tech Stack:** Node.js 20, built-in test runner, static HTML/ES modules, nginx, Docker/Coolify VPS deployment.

**Spec:** `docs/superpowers/specs/2026-10-27-agama-blogger-history-vps-design.md`

## Global Constraints

- Modify only the AGAMA repository and AGAMA Blogger files.
- Do not use the WF-Studio/static-client adapter or add a GitHub write token.
- Do not change public HTML, routes, navigation, design, GTM, Umami, prices, product data, or DNS in this PR.
- The historical catalog must contain exactly 17 Spanish items and 6 English variants from the public blog card indexes.
- Saving or loading history must never publish.
- One block must be tested before starting the next; no deployment or merge from this branch.

## Review Focus

- Generated SEO/product/FAQ pages must not enter the editorial catalog merely because they live under `entrada-de-blog/`.
- Spanish and English variants with the same folder must not overwrite each other.
- A draft, withdrawal, or tombstone must survive restart from the VPS volume.
- Historical publication must preserve unrelated page and index markup byte-for-byte outside controlled regions.
- Unsafe IDs, paths, locales, and output filenames must fail before filesystem access.
- Featured hero articles must fail closed on withdrawal/deletion.

### Task 1: Version the exact editorial history

**Files:**
- Create: `scripts/agama-blogger-history.mjs`
- Create: `content/blogger/history.json`
- Create: `tests/agama-blogger-history.test.mjs`
- Modify: `package.json`

- [ ] Write failing tests for 17 ES + 6 EN documents, unique IDs, valid source files, deterministic output, and SEO-inventory exclusion.
- [ ] Run the focused test and confirm RED.
- [ ] Implement extraction from exact `post-card` links in both blog indexes, preserving the nine legacy snapshot bodies when available.
- [ ] Generate and commit the deterministic catalog.
- [ ] Run the focused test and confirm GREEN.

### Task 2: Add locale-aware VPS overrides and safe lifecycle

**Files:**
- Modify: `scripts/agama-blogger-core.mjs`
- Modify: `tests/agama-blogger-core.test.mjs`

- [ ] Write failing tests for locale identity, draft overrides, template-preserving publication, withdrawal, tombstones, featured guards, and startup replay.
- [ ] Run core tests and confirm RED.
- [ ] Implement atomic overrides, immutable historical routes, exact template patches, locale indexes, withdrawal, deletion tombstones, and replay.
- [ ] Run core and history tests and confirm GREEN.

### Task 3: Expose the lifecycle in the authenticated editor

**Files:**
- Modify: `scripts/agama-blogger-server.mjs`
- Modify: `tests/agama-blogger-server.test.mjs`
- Modify: `admin/blogger/index.html`
- Modify: `admin/blogger/app.js`
- Modify: `admin/blogger/styles.css`
- Modify: `tests/agama-blogger-deployment.test.mjs`

- [ ] Write failing API/static-shell tests for IDs, locale, withdrawal, delete, confirmation controls, and unchanged authorization.
- [ ] Run focused tests and confirm RED.
- [ ] Add authenticated endpoints and minimal editor controls without changing branding or page layout outside Blogger.
- [ ] Run all Blogger tests and confirm GREEN.

### Task 4: Package and document the VPS migration safely

**Files:**
- Modify: `Dockerfile`
- Modify: `scripts/start-agama-container.sh`
- Modify: `tests/agama-blogger-deployment.test.mjs`
- Modify: `docs/change-scope.md`
- Modify: `CHANGELOG.md`

- [ ] Write failing deployment assertions for the catalog path and persistent-volume replay.
- [ ] Run deployment tests and confirm RED.
- [ ] Package the catalog, point the VPS service at it, and document backup/preview/rollback gates.
- [ ] Run `npm run test:blogger`, `npm run build`, `npm audit --omit=dev`, `git diff --check`, and a secret scan.
- [ ] Review the full branch, commit, push, and open a PR without merging.
