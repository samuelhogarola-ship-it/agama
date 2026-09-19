# Client catalog and stores implementation plan

**Goal:** Apply the approved client videos and follow-up corrections to the catalog entry points and store directory.
**Baseline:** origin/main 9a86b1b994287898a181a8e049fe9a598c093c2c, fetched 2026-09-17.
**Architecture:** Keep the existing static HTML and shared styles. Add URL-driven category filters to the existing catalog renderer. Use native links and CSS for clickable cards, preserving map actions.
**Stack:** HTML, CSS, JavaScript modules, Node, Playwright.
**Specification:** User-approved list in this conversation, including Toluca first, Online last and no repeated geographic mini-tabs.

## Constraints
- Work locally on codex/client-catalog-stores; do not publish.
- Preserve product records, prices, branch addresses, maps, contact and banking data.
- Preserve existing image assets and geographic titles/metadata; no hidden SEO-only text.
- Respect reduced motion and keyboard navigation.

## Steps
- [x] Record scope and branch governance; install existing test dependencies.
- [x] Test category selection, URL state and combined search before implementing filters.
- [x] Restore catalog links, pigment Opacos/Cristal and masterbatch Opacos/Para bolsa entry points in ES/EN; retain a separate online-store action.
- [x] Implement catalog filter controls and URL persistence. Film color selection: MB-110, MB-125, MB-126, MB-127, MB-210, MB-221, based on committed technical information. Exclude slip additives MB-105 and MB-200 from this color selection.
- [x] Make Toluca first and featured, Online last; preserve other DOM ordering; link branch names and card background, leaving map links independently usable. Remove the Toluca opening notice and add the branch link in both languages.
- [x] Add gentle product/store hover zoom and visible keyboard focus with reduced-motion support.
- [x] Run regression tests, build, branch/scope/sensitive-data checks and browser verification at desktop/mobile widths. Fetch GitHub again to detect concurrent changes.
- [x] Open local preview and report files, results and any limitations.

## Verification evidence
- Build succeeds using committed static catalog pages (no private environment required).
- 3 unit tests, 14 ES/EN desktop/mobile flow tests and 6 existing related smoke tests pass.
- Browser review confirms the live service also returns the six filtered film colors.
- Local preview: http://127.0.0.1:3461/ . No deployment or remote write performed.
- Existing npm dependency audit reports two high-severity findings; dependency upgrades are outside this UI change.
