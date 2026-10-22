# Analytics Umami Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize AGAMA analytics so GTM/GA/Umami can coexist without hardcoded production IDs and conversion events are consistent.

**Architecture:** Static pages load a non-secret runtime config file and one shared browser loader. Build scripts use env values only to generate dist config, while committed source remains inert without IDs.

**Tech Stack:** Static HTML, browser JavaScript, Node.js scripts, Playwright smoke tests, node:test unit tests.

**Spec:** Delegated task: inspect GA/GTM/Umami, remove hardcoded IDs, add optional Umami, add conversion events, document variables and checks.

## Global Constraints

- Do not invent production IDs.
- Do not deploy.
- Preserve existing GA/GTM capability when IDs are provided.
- Keep committed source free of productive analytics IDs.
- Respect `docs/change-scope.md` guardrails.

## Review Focus

- Missing IDs: loader must be inert and error-free.
- GTM present: one script should load and one `gtm.js` event should initialize.
- GA4 present: `gtag` should initialize once and accept conversion events.
- Umami present: script should load from configured source and receive conversion events.
- Conversion interactions: contact, WhatsApp, phone, form, and primary CTA should emit stable event names.

---

### Task 1: Shared Loader And Tests

**Files:**
- Create: `assets/js/analytics-config.js`
- Create: `assets/js/analytics.js`
- Create: `tests/analytics.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `window.AGAMA_ANALYTICS_CONFIG` and `window.AGAMA_ANALYTICS.trackConversion(name, payload)`.
- Consumes: optional config keys `gtmId`, `ga4Id`, `umamiWebsiteId`, `umamiSrc`.

- [ ] Write failing node:test coverage for inert config, GTM/GA/Umami initialization, and conversion dispatch.
- [ ] Run `node --test tests/analytics.test.mjs` and confirm failure.
- [ ] Implement the shared browser loader and test script.
- [ ] Run `node --test tests/analytics.test.mjs` and confirm pass.

### Task 2: Static And Build Integration

**Files:**
- Modify: `build.js`
- Modify: static `*.html` pages with current GTM snippets
- Modify: `tests/agama-smoke.spec.js`

**Interfaces:**
- Consumes: `assets/js/analytics-config.js` and `assets/js/analytics.js` from Task 1.
- Produces: generated `dist/assets/js/analytics-config.js` from env.

- [ ] Write failing smoke coverage proving pages load the shared analytics scripts and no hardcoded production IDs remain in sampled source.
- [ ] Run targeted smoke/unit command and confirm failure.
- [ ] Replace hardcoded snippets with shared script includes and add build-time dist config generation.
- [ ] Run targeted smoke/unit command and confirm pass.

### Task 3: Documentation And Guardrails

**Files:**
- Modify: `docs/change-scope.md`
- Modify: `CHANGELOG.md`
- Create: `docs/analytics.md`

**Interfaces:**
- Produces: operator docs for `AGAMA_GTM_ID`, `AGAMA_GA4_ID`, `AGAMA_UMAMI_WEBSITE_ID`, `AGAMA_UMAMI_SRC`.

- [ ] Document required variables and the exact missing snippet/limitation for noscript GTM fallback.
- [ ] Update changelog and scope.
- [ ] Run repository checks relevant to analytics and scope.
