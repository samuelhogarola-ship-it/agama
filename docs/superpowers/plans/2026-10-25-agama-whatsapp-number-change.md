# AGAMA WhatsApp Number Change Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir permanentemente el WhatsApp corporativo terminado en `5156` por `+52 55 4860 4275`, conservar intactos los contactos propios de sucursales y publicar durante una semana un aviso accesible y piezas sociales verificadas.

**Architecture:** Una capa de inventario y validación distingue el número corporativo exacto de los números locales. Se actualizan primero las fuentes regeneradoras, después las salidas estáticas y activos, y sólo tras la autorización protegida se cambia `/filiales/online/`. El banner se implementa en la UI global con allowlist de rutas e instante de expiración absoluto; los activos QR/sociales se generan y validan de forma determinista.

**Tech Stack:** Node.js ESM, HTML/CSS/JavaScript estático, Playwright, `node:test`, Next.js (portal y configurador), Sharp, `qrcode`, `jsqr`, Git/GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-24-agama-whatsapp-number-change-design.md`

## Global Constraints

- Ejecutar todo en el worktree aislado `/Users/sam/.codex/worktrees/whatsapp-number-notice/AGAMA`; no trabajar en el checkout principal.
- Número anterior exacto: visible `+52 55 7351 5156`, destino `525573515156`. Número nuevo: visible `+52 55 4860 4275`, destino `525548604275`.
- No sustituir de forma genérica enlaces `wa.me`; los teléfonos y WhatsApp propios de sucursales deben conservarse byte por byte.
- El nuevo WhatsApp admite mensajes y archivos, no llamadas ni videollamadas; no debe aparecer en `telephone`, `tel:` ni semántica de llamadas.
- Expiración del banner: `2026-10-31 23:59:59 America/Mexico_City` (`2026-11-01T05:59:59Z`); desde `2026-11-01T06:00:00Z` no debe producir DOM visible.
- GTM, GA4 y Umami permanecen intactos. Umami es adicional y no sustituye a GTM.
- No cambiar precios, rutas, Blogger, DNS, credenciales ni datos sensibles ajenos al WhatsApp corporativo autorizado.
- **Bloqueo absoluto:** no modificar `filiales/online/index.html`, `filiales/online/index.en.html`, su snapshot ni activar allí el banner hasta disponer de evidencia, SHA-256 de evidencia, autorización escrita, SHA-256 de autorización, lock renovado y `FILIALES_SENSITIVE_LOCK_SHA256` actualizado externamente.
- Un solo bloque y un solo commit cada vez. Antes de empezar o subir el siguiente bloque: pruebas asignadas en verde, `git diff --check`, revisión del diff y ausencia de secretos.
- La implementación debe confirmar primero qué superficies están realmente desplegadas: raíz/`dist`, WordPress, portal y configurador. Una superficie inactiva se excluye explícitamente del inventario con justificación; no se presupone.

## File Structure

- `scripts/corporate-whatsapp-core.mjs`: detección exacta, migración de texto y snapshot de WhatsApp locales.
- `scripts/validate-corporate-whatsapp.mjs`: CLI de inventario, comparación de sucursales y residuo cero.
- `scripts/generate-whatsapp-assets.mjs`: QR y rasterización determinista de las piezas sociales.
- `scripts/validate-whatsapp-assets.mjs`: dimensiones y decodificación independiente de QR.
- `data/corporate-whatsapp-branch-baseline.json`: baseline revisable de los WhatsApp locales que no pueden cambiar.
- `tests/corporate-whatsapp.test.mjs`: pruebas unitarias de escaneo, migración, JSON-LD y activos.
- `assets/js/global-ui.js`: constante corporativa y banner temporal con allowlist.
- `assets/css/home-custom.css`: presentación accesible y responsive del banner.
- `tests/agama-smoke.spec.js`: rutas, expiración, cierre, accesibilidad y no regresión de filiales.
- `assets/img/campaigns/whatsapp-number-change-2026-story.{svg,png}`: Story IG/FB 1080 × 1920.
- `assets/img/campaigns/whatsapp-number-change-2026-square.{svg,png}`: estado/imagen WhatsApp 1080 × 1080.
- `assets/img/qr-whatsapp.{png,webp}`: QR permanente del nuevo destino.
- Fuentes existentes y HTML públicos enumerados en las tareas 2–4.

## Review Focus

1. Un enlace de sucursal distinto del corporativo, incluso con query string, nunca cambia. **Test:** Task 1, `migration matches only the exact corporate identity and preserves branch WhatsApp`.
2. Los enlaces `wa.me` y `api.whatsapp.com/send?phone=` mantienen exactamente su mensaje prellenado y parámetros al cambiar sólo el número. **Test:** Task 1, `migration preserves encoded WhatsApp query parameters`.
3. El número nuevo no se presenta como teléfono mientras los `telephone` locales siguen presentes. **Test:** Task 2, `corporate WhatsApp is absent from telephone semantics and branch telephones remain`.
4. En el límite temporal, el banner existe un segundo antes, desaparece al expirar y sigue operando si `localStorage` lanza una excepción. **Tests:** Task 5, `WhatsApp notice obeys Mexico City expiry boundary` y `WhatsApp notice tolerates unavailable storage`.
5. Una regeneración/build no reintroduce el número antiguo ni duplica/cambia GTM, GA4 o Umami. **Tests:** Task 3, `build output has no unprotected legacy corporate number`; Task 7, `npm run test:analytics` y escaneo de `dist/`.

## Inputs Resolved And Remaining Gate

- Evidencia recibida fuera del repositorio: `/Users/sam/Desktop/Captura de pantalla 2026-10-25 a las 22.33.53.png`, SHA-256 `a48efcc1a4c94b18649c8adbebfb43c078ea6d57ac55f3ae01f93123876e9ed5`. No se copia ni se confirma en Git.
- Autorización escrita exacta del propietario: `A ver, lo de lo del número me refiero al banner, que aparezca un banner, pero después en todos los sitios el número nuevo debe sustituirse.` El validador calcula y guarda sólo su SHA-256.
- Superficies: por seguridad se migran la raíz/`dist`, fuentes del configurador y el tema WordPress aunque alguna copia no esté desplegada; así una regeneración futura no reintroduce el número perdido.
- `portal/src/lib/mock-store.ts` no es un CTA corporativo sino el teléfono de un cliente ficticio. Se retira el literal perdido del fixture, pero no se etiqueta el WhatsApp corporativo como teléfono del cliente.
- La actualización externa de `FILIALES_SENSITIVE_LOCK_SHA256` no está autorizada en esta ejecución. Tasks 4 y 5 conservan su hard gate: no se modifican ni se activan en `/filiales/online/`, no hay push/PR/merge/deploy y no se publica una liberación parcial. Tasks 1–3 y 6 pueden completarse y verificarse localmente mientras ese gate queda pendiente.

---

### Task 1: Inventario exacto y guardrail de sucursales

**Files:**
- Create: `scripts/corporate-whatsapp-core.mjs`
- Create: `scripts/validate-corporate-whatsapp.mjs`
- Create: `tests/corporate-whatsapp.test.mjs`
- Create: `data/corporate-whatsapp-branch-baseline.json`
- Modify: `package.json`
- Modify: `docs/change-scope.md`
- Include in first commit: `docs/superpowers/specs/2026-10-24-agama-whatsapp-number-change-design.md`
- Include in first commit: `docs/superpowers/plans/2026-10-25-agama-whatsapp-number-change.md`

**Interfaces:**
- Produces: `OLD_CORPORATE_DIGITS`, `NEW_CORPORATE_DIGITS`, `NEW_CORPORATE_DISPLAY`.
- Produces: `migrateCorporateWhatsappText(source: string) -> { text: string, replacements: number }`.
- Produces: `findLegacyCorporateMatches(root: string, options?: { includeDist?: boolean, skipProtected?: boolean }) -> Array<{ file: string, line: number, value: string }>`.
- Produces: `collectBranchWhatsappSnapshot(root: string) -> Record<string, string[]>` for the 16 physical branches in ES/EN under both `puntosdeventa/` and legacy `filiales/` copies.
- CLI: `node scripts/validate-corporate-whatsapp.mjs --report`, `--assert-clean`, and optional `--skip-protected`.

- [ ] **Step 1: Write failing unit tests for exact matching and query preservation**

Add tests named:

```js
test('migration matches only the exact corporate identity and preserves branch WhatsApp', () => {
  // corporate 525573515156 becomes 525548604275;
  // branch 527224997514 is byte-identical.
});

test('migration preserves encoded WhatsApp query parameters', () => {
  // wa.me and api.whatsapp.com keep ?text= and all non-phone parameters exactly.
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/corporate-whatsapp.test.mjs`

Expected: FAIL because `scripts/corporate-whatsapp-core.mjs` does not exist.

- [ ] **Step 3: Implement the core scanner/migrator and CLI**

The scanner must exclude planning/spec documentation and its own sentinel constants, classify the two protected online files separately, and scan served HTML, JS/TS/TSX/PHP generators, operational data and current fixtures. It must never infer “corporate” merely from a `wa.me` host.

- [ ] **Step 4: Generate and review the branch baseline**

Run: `node scripts/validate-corporate-whatsapp.mjs --write-branch-baseline`

Expected: writes `data/corporate-whatsapp-branch-baseline.json` with 64 files (16 branches × 2 locales × 2 route families); no `/filiales/online/` entry.

Run: `node scripts/validate-corporate-whatsapp.mjs --report`

Expected: exit 0; prints a positive `legacy_matches=` count, lists protected matches separately and ends with `branch_baseline=unchanged`.

- [ ] **Step 5: Run tests and project guardrails**

Run: `node --test tests/corporate-whatsapp.test.mjs && npm run validate:filiales-sensitive-lock && git diff --check`

Expected: all tests PASS; `Sensitive filial data lock OK.`; no diff errors.

- [ ] **Step 6: Review and commit only this block**

```bash
git add scripts/corporate-whatsapp-core.mjs scripts/validate-corporate-whatsapp.mjs tests/corporate-whatsapp.test.mjs data/corporate-whatsapp-branch-baseline.json package.json docs/change-scope.md docs/superpowers/specs/2026-10-24-agama-whatsapp-number-change-design.md docs/superpowers/plans/2026-10-25-agama-whatsapp-number-change.md
git commit -m "test: add corporate WhatsApp migration guardrails"
```

Do not start Task 2 until this commit's commands are green and its diff is reviewed.

### Task 2: Fuentes permanentes no protegidas y semántica JSON-LD

**Files:**
- Modify: `assets/js/global-ui.js`
- Modify: `assets/js/home.js`
- Modify: `assets/js/online-store.js`
- Modify: `assets/js/products.js`
- Modify: `build.js`
- Modify: `scripts/shared-layout.mjs`
- Modify: `apps/configurador/src/components/configurator/configurator-page.tsx`
- Modify conditionally: `portal/src/lib/mock-store.ts`
- Modify conditionally: `wordpress/wp-content/themes/agama-blog/footer.php`
- Modify: `index.html`
- Modify: `index.en.html`
- Modify: `tests/analytics.test.mjs`
- Modify: `apps/configurador/tests/configurador-smoke.spec.ts`
- Modify: `tests/portal-smoke.spec.js`
- Test: `tests/corporate-whatsapp.test.mjs`

**Interfaces:**
- Consumes: constants and exact matcher from Task 1.
- Produces: every active non-protected source emits `525548604275` and never `525573515156`.
- Produces: home JSON-LD `ContactPoint` with `url: "https://wa.me/525548604275"` and no corporate `telephone`.
- Produces: portal customer-profile data that never labels `+52 55 4860 4275` as `phone`.

- [ ] **Step 1: Add failing source and JSON-LD tests**

Add tests named:

```js
test('active non-protected generators use the new corporate WhatsApp', () => {
  // every listed source contains 525548604275 and not 525573515156.
});

test('corporate WhatsApp is absent from telephone semantics and branch telephones remain', () => {
  // home ES/EN has ContactPoint.url, no corporate telephone/tel;
  // representative branch JSON-LD still has its original telephone;
  // portal CustomerProfile.phone is never the new WhatsApp.
});
```

Update the analytics fixture expectations to use `https://wa.me/525548604275` while preserving event names `agama_conversion` and `agama_whatsapp`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/corporate-whatsapp.test.mjs tests/analytics.test.mjs`

Expected: FAIL on old source constants and home `contactPoint.telephone`.

- [ ] **Step 3: Replace only exact corporate constants and repair JSON-LD**

Change the listed source constants/links to `525548604275`. In `index.html` and `index.en.html`, remove the corporate `telephone` property and add the WhatsApp `url`; do not touch branch `telephone` values. Preserve every `?text=` payload.

For WordPress: update the footer only if the owner confirms it is deployed. If inactive, record its exclusion in the Task 1 inventory configuration with the confirmed reason; do not silently leave its status unknown.

For `portal/src/lib/mock-store.ts`: stop and obtain classification. Its field is a demo customer's `phone`, not a WhatsApp CTA. Never replace it with `+52 55 4860 4275`. If the owner confirms it was an accidental reuse of the former AGAMA number, remove it or replace it with an owner-approved noncorporate fixture and update `tests/portal-smoke.spec.js`; if it is intentional customer data, register the justified exclusion in the inventory.

- [ ] **Step 4: Verify sources, analytics, portal and configurator**

Run: `node --test tests/corporate-whatsapp.test.mjs tests/analytics.test.mjs`

Expected: PASS.

Run: `npm --prefix apps/configurador test -- --grep "WhatsApp"`

Expected: PASS; configurator CTA targets `525548604275`.

Run: `npm run portal:lint && npm run test:portal`

Expected: lint exits 0; portal smoke tests PASS; the new WhatsApp is never rendered as `Telefono`. If the old literal is retained as intentional customer data, its scanner exclusion and reason are asserted.

Run: `node scripts/validate-corporate-whatsapp.mjs --report`

Expected: no matches in active generator/source files; static output and protected matches may remain; `branch_baseline=unchanged`.

- [ ] **Step 5: Review and commit only this block**

```bash
git add assets/js/global-ui.js assets/js/home.js assets/js/online-store.js assets/js/products.js build.js scripts/shared-layout.mjs apps/configurador/src/components/configurator/configurator-page.tsx apps/configurador/tests/configurador-smoke.spec.ts index.html index.en.html tests/analytics.test.mjs tests/corporate-whatsapp.test.mjs tests/portal-smoke.spec.js
git add wordpress/wp-content/themes/agama-blog/footer.php data/corporate-whatsapp-branch-baseline.json
git add portal/src/lib/mock-store.ts
git commit -m "fix: update corporate WhatsApp sources"
```

Add only the conditional files actually changed. Do not start Task 3 until all Task 2 checks pass.

### Task 3: Salidas estáticas, cache busting y QR

**Files:**
- Create: `scripts/migrate-corporate-whatsapp.mjs`
- Create: `scripts/generate-whatsapp-assets.mjs`
- Create: `scripts/validate-whatsapp-assets.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: committed public `*.html` containing the exact legacy corporate number, excluding protected online files
- Modify: asset-version constants/references in `build.js`, `scripts/generate-static-blog.mjs` and committed HTML
- Replace: `assets/img/qr-whatsapp.png`
- Replace: `assets/img/qr-whatsapp.webp`
- Test: `tests/corporate-whatsapp.test.mjs`

**Interfaces:**
- Consumes: `migrateCorporateWhatsappText()` and the protected-path classification from Task 1.
- CLI: `node scripts/migrate-corporate-whatsapp.mjs --dry-run --skip-protected` reports intended non-protected edits; `--write --skip-protected` applies only those edits.
- Produces: `generateQrAssets(destination: string, outputDir: string) -> Promise<void>`.
- Validator CLI prints `qr_png=...`, `qr_webp=...`, dimensions and decoded destinations.

- [ ] **Step 1: Add failing tests for static migration, build output and QR**

Add tests named:

```js
test('static migration changes exact corporate identity without touching protected paths', () => {});
test('build output has no unprotected legacy corporate number', () => {});
test('WhatsApp QR assets decode to the new destination', async () => {});
```

The build-output assertion scans `dist/` after `npm run build`; QR assertions require both 500 × 500 assets to decode to `https://wa.me/525548604275`.

- [ ] **Step 2: Install generation/validation dependencies and verify RED**

Run: `npm install --save-dev qrcode sharp jsqr`

Run: `node --test tests/corporate-whatsapp.test.mjs`

Expected: FAIL because migration and asset scripts are absent or QR still decodes to the old destination.

- [ ] **Step 3: Implement dry-run migration and inspect its scope before writing**

Run: `node scripts/migrate-corporate-whatsapp.mjs --dry-run --skip-protected`

Expected: lists only exact legacy corporate occurrences; explicitly reports both `/filiales/online/` files as skipped/protected; no branch-local number appears as a replacement.

- [ ] **Step 4: Apply the non-protected static migration and cache version**

Run: `node scripts/migrate-corporate-whatsapp.mjs --write --skip-protected`

Expected: exits 0 with `protected_skipped=2`; all query strings remain byte-equivalent except the phone digits.

Use a new shared cache token `20261025whatsapp` for affected `global-ui.js` and `home-custom.css` references and generator constants. Do not change route markup or analytics asset references.

- [ ] **Step 5: Generate and independently validate the QR**

Run: `node scripts/generate-whatsapp-assets.mjs --qr-only`

Expected: rewrites PNG and WebP at 500 × 500.

Run: `node scripts/validate-whatsapp-assets.mjs --qr`

Expected: `qr_png=https://wa.me/525548604275`, `qr_webp=https://wa.me/525548604275`, exit 0.

- [ ] **Step 6: Build from sources and assert no unprotected residue**

Run: `npm run build`

Expected: `Build complete`; committed pages are copied/generated into `dist/`.

Run: `node scripts/validate-corporate-whatsapp.mjs --assert-clean --skip-protected --include-dist`

Expected: `legacy_unprotected=0`, `protected_skipped=2`, `branch_baseline=unchanged`.

Run: `node --test tests/corporate-whatsapp.test.mjs && npm run test:analytics && git diff --check`

Expected: PASS; no diff errors.

- [ ] **Step 7: Review and commit only this block**

```bash
git diff --quiet -- filiales/online/index.html filiales/online/index.en.html
git add -u
git add scripts/migrate-corporate-whatsapp.mjs scripts/generate-whatsapp-assets.mjs scripts/validate-whatsapp-assets.mjs
git commit -m "fix: migrate public WhatsApp outputs"
```

The first command must exit 0; if either protected file differs, stop instead of staging. Because the worktree must be clean after every prior commit, `git add -u` may include only this task's reviewed tracked edits. Confirm with `git diff --cached --name-only` before committing. Do not start Task 4 until the commit is locally green.

### Task 4: Renovación protegida de `/filiales/online/`

**HARD GATE:** Stop here unless all six protected prerequisites in the spec exist. Do not modify files, stage a partial lock, use placeholder hashes or bypass a validator. La evidencia y autorización ya existen, pero la huella externa no puede actualizarse en esta ejecución; por tanto Task 4 queda pendiente y no se despliega Tasks 1–3. Task 6, que no toca datos protegidos ni producción, puede adelantarse.

**Files:**
- Modify: `filiales/online/index.html`
- Modify: `filiales/online/index.en.html`
- Modify: `docs/filiales-data-lock-plan.md`
- Modify: `data/filiales-sensitive-data.lock.json`
- Modify: `scripts/validate-filiales-sensitive-lock.mjs`
- Modify: `CHANGELOG.md`
- Test: `tests/corporate-whatsapp.test.mjs`

**Interfaces:**
- Consumes: exact migration and full validator from Tasks 1–3.
- Consumes external inputs: `AGAMA_SENSITIVE_DATA_EVIDENCE_SHA256` (64 lowercase hex), exact written authorization, and owner-controlled GitHub secret update.
- Produces: renewed canonical lock plus printed `lock_sha256=<64 lowercase hex>`.

- [ ] **Step 1: Verify and record the protected inputs without committing evidence**

Run: `shasum -a 256 /absolute/path/to/owner-evidence`

Expected: exact 64-character hash supplied for `AGAMA_SENSITIVE_DATA_EVIDENCE_SHA256`; the evidence file remains outside the repository.

Record the exact authorization text in the secure execution notes, not in `.env` or shell history. Confirm who will update `FILIALES_SENSITIVE_LOCK_SHA256`.

- [ ] **Step 2: Add the failing protected-route test**

Add `protected online filial uses the authorized corporate WhatsApp in ES and EN`, asserting visible text, all corporate `wa.me` links and preserved query payloads use `525548604275`.

Run: `node --test tests/corporate-whatsapp.test.mjs`

Expected: FAIL only on the two protected online files.

- [ ] **Step 3: Change the two protected files and current operational documentation**

Apply `migrateCorporateWhatsappText()` only to the authorized corporate number in both online files. Do not alter their real `telephone` (`+52-55-5762-5515`), addresses, email, banking/tax fields or other filial snapshots.

- [ ] **Step 4: Renew the lock with real hashes**

Run in a terminal that does not persist sensitive history:

```bash
AGAMA_SENSITIVE_DATA_RENEWAL=OWNER_EXPLICIT_APPROVAL_AND_EVIDENCE_PRESENT \
AGAMA_SENSITIVE_DATA_EVIDENCE_SHA256=<evidence_sha256> \
AGAMA_SENSITIVE_DATA_AUTHORIZATION='<exact owner authorization>' \
node scripts/validate-filiales-sensitive-lock.mjs --write-lock
```

Expected: `lock_sha256=<new_lock_sha256>`.

Update `EXPECTED_LOCK_FILE_SHA256` in `scripts/validate-filiales-sensitive-lock.mjs` to that exact new lock hash.

- [ ] **Step 5: Update the external GitHub fingerprint before commit/push**

The designated owner runs: `gh secret set FILIALES_SENSITIVE_LOCK_SHA256 --body "<new_lock_sha256>"`

Expected: command exits 0. Then run:

`FILIALES_SENSITIVE_LOCK_SHA256=<new_lock_sha256> node scripts/validate-filiales-sensitive-lock.mjs --verify-external`

Expected: `Independent sensitive filial data lock OK.`

- [ ] **Step 6: Verify every local protected gate**

Run: `npm run validate:filiales-sensitive-lock && npm run validate:filiales-plan && npm run validate:filiales-parity`

Expected: all three exit 0.

Run: `npm run build`

Expected: `Build complete`; `dist/filiales/online/` now contains the authorized files from this task.

Run: `node scripts/validate-corporate-whatsapp.mjs --assert-clean --include-dist && node --test tests/corporate-whatsapp.test.mjs`

Expected: `legacy_matches=0`, `branch_baseline=unchanged`; all tests PASS.

- [ ] **Step 7: Review and commit the protected unit atomically**

```bash
git add filiales/online/index.html filiales/online/index.en.html docs/filiales-data-lock-plan.md data/filiales-sensitive-data.lock.json scripts/validate-filiales-sensitive-lock.mjs tests/corporate-whatsapp.test.mjs CHANGELOG.md
git commit -m "fix: authorize online filial WhatsApp change"
```

Expected after push: GitHub context `Sensitive Data Lock / Required gate` passes. Do not begin Task 5 before local checks and the remote protected gate are green.

No producción se despliega entre Tasks 1–6 salvo autorización expresa de liberación parcial. Así, el token de caché `20261025whatsapp` versiona el contenido final de `global-ui.js` y `home-custom.css`, incluido el banner.

### Task 5: Banner temporal accesible en 40 documentos

**Files:**
- Modify: `assets/js/global-ui.js`
- Modify: `assets/css/home-custom.css`
- Modify: `tests/agama-smoke.spec.js`

**Interfaces:**
- Produces: `WHATSAPP_NOTICE` configuration with `campaignId`, `expiresAt`, ES/EN copy and exact route allowlist.
- Produces: `isWhatsappNoticeRoute(pathname: string) -> boolean` and `initWhatsappNumberNotice(now: Date = new Date()) -> void` within global UI.
- Consumes: existing delegated analytics classification for `wa.me` links; no new tracker or event name.

- [ ] **Step 1: Add failing Playwright tests for routes, time, storage and accessibility**

Add tests named:

```js
test('WhatsApp notice renders on all 40 ES and EN documents only', async ({ page }) => {});
test('WhatsApp notice obeys Mexico City expiry boundary', async ({ page }) => {});
test('WhatsApp notice tolerates unavailable storage', async ({ page }) => {});
test('WhatsApp notice is keyboard accessible and does not overflow mobile', async ({ page }) => {});
```

Use `page.clock.setFixedTime()` before navigation. Assert visible at `2026-11-01T05:59:58Z`, absent at `2026-11-01T06:00:00Z`, localized heading/CTA/close label, no `role="alert"`, 44 × 44 close target, campaign-specific dismissal and no horizontal overflow at 390 px.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npx playwright test -c playwright.config.js -g "WhatsApp notice"`

Expected: FAIL because the campaign region does not exist.

- [ ] **Step 3: Implement minimal banner logic and CSS**

Use the exact 40-document allowlist from the spec. Insert a non-modal semantic region at the top of page content, link to `https://wa.me/525548604275`, persist dismissal under `agama:notice:whatsapp-2026-10`, catch storage errors and respect `prefers-reduced-motion`. Use `#1745f5` and `#0f2f99`; do not touch route/DNS configuration.

- [ ] **Step 4: Verify banner, analytics and filial routing**

Run: `npx playwright test -c playwright.config.js -g "WhatsApp notice|filiales preservan|analytics publico"`

Expected: PASS on desktop and the explicit mobile viewport assertions.

Run: `npm run test:analytics && npm run validate:filiales-sensitive-lock && git diff --check`

Expected: analytics tests PASS without config changes; lock OK; no diff errors.

- [ ] **Step 5: Review and commit only this block**

```bash
git add assets/js/global-ui.js assets/css/home-custom.css tests/agama-smoke.spec.js
git commit -m "feat: add expiring WhatsApp number notice"
```

Do not start Task 6 until the banner commit is green.

### Task 6: Piezas IG/FB Story y WhatsApp

**Files:**
- Modify: `scripts/generate-whatsapp-assets.mjs`
- Modify: `scripts/validate-whatsapp-assets.mjs`
- Create: `assets/img/campaigns/whatsapp-number-change-2026-story.svg`
- Create: `assets/img/campaigns/whatsapp-number-change-2026-story.png`
- Create: `assets/img/campaigns/whatsapp-number-change-2026-square.svg`
- Create: `assets/img/campaigns/whatsapp-number-change-2026-square.png`
- Test: `tests/corporate-whatsapp.test.mjs`

**Interfaces:**
- Produces: `generateSocialAssets(outputDir: string) -> Promise<void>` using existing AGAMA logo assets and exact approved copy.
- Validator CLI: `node scripts/validate-whatsapp-assets.mjs --social`.

- [ ] **Step 1: Add failing dimensions/content tests**

Add `social campaign assets have exact dimensions and required copy`, asserting Story `1080 × 1920`, square `1080 × 1080`, SVG source presence, and text tokens `+52 55 4860 4275`, `5156`, `No llamadas ni videollamadas` and `Wasapi.io` where specified by the design.

Run: `node --test tests/corporate-whatsapp.test.mjs`

Expected: FAIL because campaign assets do not exist.

- [ ] **Step 2: Generate editable SVG sources and PNG renders**

Run: `node scripts/generate-whatsapp-assets.mjs --social-only`

Expected: creates four new files without overwriting existing brand originals. Story leaves 250 px safe space at top and bottom; both use AGAMA blue and high-contrast text.

- [ ] **Step 3: Validate mechanically and visually**

Run: `node scripts/validate-whatsapp-assets.mjs --social`

Expected: `story=1080x1920`, `square=1080x1080`, `copy=ok`, exit 0.

Open both PNG files at 100 % and inspect: logo undistorted, phone digits correct, no clipped text, readable on a phone-sized preview, no accidental date/expiry on the square asset.

- [ ] **Step 4: Run tests, review and commit only assets**

Run: `node --test tests/corporate-whatsapp.test.mjs && git diff --check`

Expected: PASS; no diff errors.

```bash
git add scripts/generate-whatsapp-assets.mjs scripts/validate-whatsapp-assets.mjs tests/corporate-whatsapp.test.mjs assets/img/campaigns/whatsapp-number-change-2026-story.svg assets/img/campaigns/whatsapp-number-change-2026-story.png assets/img/campaigns/whatsapp-number-change-2026-square.svg assets/img/campaigns/whatsapp-number-change-2026-square.png
git commit -m "feat: add WhatsApp change social assets"
```

### Task 7: Verificación final y preparación segura de integración

**Files:**
- Verify only; do not modify product files to make a failing check disappear.

**Interfaces:**
- Consumes every prior task.
- Produces: recorded command output sufficient for review; no deployment, merge or push is implied by passing locally.

- [ ] **Step 1: Confirm clean migration and immutable branch contacts**

Run: `node scripts/validate-corporate-whatsapp.mjs --assert-clean --include-dist`

Expected: `legacy_matches=0`, `branch_baseline=unchanged`.

Run: `node scripts/validate-whatsapp-assets.mjs --all`

Expected: both QR values decode to `https://wa.me/525548604275`; Story and square dimensions/copy PASS.

- [ ] **Step 2: Run unit and analytics tests**

Run: `node --test tests/corporate-whatsapp.test.mjs tests/analytics.test.mjs`

Expected: all tests PASS; stable analytics event names remain unchanged.

- [ ] **Step 3: Run public, portal and configurator checks**

Run: `npm run test:public`

Expected: all public Playwright tests PASS, including the 40 banner documents and branch-contact regressions.

Run: `npm run portal:lint && npm run test:portal`

Expected: both exit 0.

Run: `npm --prefix apps/configurador run check && npm --prefix apps/configurador test`

Expected: catalogue validation, lint, build and configurator Playwright tests PASS.

- [ ] **Step 4: Run protected and repository gates**

Run: `npm run validate:filiales-sensitive-lock && npm run validate:filiales-plan && npm run validate:filiales-parity`

Expected: all exit 0.

Run: `npm run precommit:check`

Expected: every configured repository check passes. If Supabase variables are absent, the documented optional build step may say `Skipped`; the explicit `npm run build` from Task 3 must already have passed.

- [ ] **Step 5: Verify analytics loaders and production build once more**

Run: `npm run build && npm run test:analytics`

Expected: build completes; GTM, GA4 and Umami tests PASS with exactly one configured loader each.

- [ ] **Step 6: Final diff/security review**

Run: `git status --short && git diff --check && git log --oneline --decorate -7`

Expected: no unstaged implementation residue, no whitespace errors, one reviewed commit per completed block.

Inspect `git diff origin/main...HEAD` and confirm: no secrets/evidence, no price changes, no route changes, no unexpected number replacements, no analytics configuration changes.

- [ ] **Step 7: Stop for integration approval**

Do not merge, push or deploy automatically. Present the test evidence and the remote sensitive-lock status. If the new WhatsApp later fails, remove its CTA or fall back to the contact form; never restore the number terminado en `5156`.
