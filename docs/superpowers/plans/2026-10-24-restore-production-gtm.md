# Restore Production GTM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore `GTM-TWHL8PV2` in production when deployment variables are absent, without changing Umami, Blogger, routes, prices, or dependencies.

**Architecture:** Extend the existing versioned production analytics configuration with the public GTM container ID. Make `analyticsConfigFromEnv` use it only as a fallback while preserving environment precedence and the central runtime loader.

**Tech Stack:** Node.js ES modules, JSON configuration, `node:test`, Playwright smoke suite.

**Spec:** `docs/superpowers/specs/2026-10-24-restore-production-gtm-design.md`

## Global Constraints

- Do not modify Blogger, HTML routes, prices, dependencies, or PR #173.
- Keep Umami ID and source unchanged.
- Keep `AGAMA_GTM_ID` as the highest-priority value.
- Do not restore direct GA4 in this change.

## Review Focus

- Missing `AGAMA_GTM_ID` must yield `GTM-TWHL8PV2` and retain both Umami values.
- Explicit `AGAMA_GTM_ID` must override the production fallback.
- Generated runtime configuration must contain GTM and Umami together.
- No HTML files or Blogger files may appear in the diff.
- Full public smoke tests must remain green.

---

### Task 1: Production GTM fallback

**Files:**
- Modify: `tests/analytics.test.mjs`
- Modify: `config/analytics.production.json`
- Modify: `scripts/inject-analytics-loader.mjs`

**Interfaces:**
- Consumes: `analyticsConfigFromEnv(env: object)`.
- Produces: runtime analytics config whose `gtmId` falls back to `GTM-TWHL8PV2` while explicit environment values win.

- [ ] **Step 1: Write the failing tests**

Add assertions that an empty environment returns the production GTM ID alongside unchanged Umami values, and that an explicit `AGAMA_GTM_ID` overrides it.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/analytics.test.mjs`

Expected: FAIL because `analyticsConfigFromEnv({}).gtmId` is currently empty.

- [ ] **Step 3: Implement the minimum fallback**

Add `gtmId` to `config/analytics.production.json` and read it as the fallback in `analyticsConfigFromEnv`; do not change GA4 or any loader behavior.

- [ ] **Step 4: Verify GREEN and regression scope**

Run:
- `node --test tests/analytics.test.mjs`
- `node --test tests/agama-blogger-core.test.mjs tests/agama-blogger-server.test.mjs tests/agama-blogger-deployment.test.mjs`
- `npm test`
- `npm run build`

Expected: all commands exit 0; 44 public smoke tests pass; the diff contains only the planned analytics files and documentation.

- [ ] **Step 5: Review before any publication**

Inspect `git diff --check`, `git diff --stat`, and `git status --short`. Do not push or merge without reporting the verified local result first.
