# PR #164 Quality Rebuild Design

Date: 2026-08-31
Branch: `feat/seo-september-batch`

## Objective

Turn PR #164 from a mass-generated SEO batch into a publishable set of useful,
accurate and maintainable AGAMA pages. Preserve the 83 new public HTML URLs
while correcting technical claims, editorial quality, visual consistency,
international SEO, internal linking and navigation behavior.

## Scope

The rebuild covers:

- 72 product articles: 12 product families x spotlight, application guide and
  FAQ x Spanish and English.
- 6 English educational articles.
- 2 English evergreen service pages currently placed under `/eventos/`.
- 3 English category landings.
- Product URLs newly exposed through `sitemap.xml`.
- Social metadata added to filial URLs that redirect to canonical point-of-sale
  pages.

The existing PR URLs remain stable. Product URLs that already exist but are not
properly localized are not advertised as English sitemap entries until their
visible copy and metadata pass localization checks.

## Sources Of Truth

Technical and commercial statements may only come from:

1. The corresponding tracked product page under `productos/`.
2. `data/product-images-manifest.json` for official product imagery.
3. `data/tech-sheets-manifest.json` and an available technical sheet.
4. Existing, owner-approved company facts already present on `main`.
5. Primary government sources for trade or regulatory explanations.

If a number, certification, SLA, compatibility, availability statement or
performance claim is not supported by one of these sources, it is removed or
rewritten as a question for AGAMA's technical team. Editorial pages do not
freeze volatile prices or stock promises; they link to the live product page.

Known contradictions to remove include:

- AD-318 support for hot runners or PET.
- MB-105 FDA or food-contact approval.
- MB-105 processing outside its documented LDPE/LLDPE film use and ranges.
- Unsupported AD-301 reductions, cell sizes, resins and process windows.
- Unsupported BP-028, BP-080 and BP-1000 chemistry, temperatures,
  certifications and performance numbers.

## Content Model

Each product family receives three genuinely different editorial intents:

- Spotlight: what the product is, where it fits, documented compatibility,
  selection considerations and a link to its live product page.
- Application guide: documented preparation, process window, dosing or use
  method, restrictions, trial checklist and escalation to technical support.
- FAQ: concise answers drawn from documented facts, with unknown project-
  specific questions explicitly routed to technical review.

Templates vary by real product type: pigment, color masterbatch, functional
additive and purging compound. Shared interface copy is allowed; duplicated
technical paragraphs and keyword-substitution copy are not.

Spanish uses natural Mexican industrial language. English is written for a US
B2B reader, not translated word-for-word. Internal SEO instructions, generic
superlatives and unsupported urgency are removed.

The USMCA article remains educational and cites primary sources. It explains
that origin and duty treatment depend on classification and product-specific
facts; it does not promise that AGAMA products automatically qualify.

The factory visit and virtual consultation pages are evergreen services. Their
incorrect `Event` schema and invented dates are replaced with semantically
appropriate `Service` and `WebPage` data.

## UI And Shared Layout

All 80 editorial/service pages use:

- One shared editorial stylesheet using the current AGAMA design tokens.
- `buildNav()` and `buildFooter()` from `scripts/shared-layout.mjs`.
- `assets/js/home.js` so the mobile menu and product megamenu work.
- A working language switch for each real ES/EN pair.
- `aria-current`, an accessible mobile menu button and valid expanded state.
- Stable hero aspect ratios and reserved image space.
- Official product cover images for product content and matching OG/Twitter
  images. Non-product articles use a specific editorial asset, never a generic
  category image presented as the subject.

The presentation remains consistent with current AGAMA article pages, with
fewer decorative effects, tighter card radii and readable line lengths on
mobile and desktop.

## SEO And Discovery

- Every ES/EN product pair has reciprocal `hreflang` for the same intent:
  spotlight to spotlight, guide to guide and FAQ to FAQ.
- Canonical URLs and sitemap URLs use one consistent form.
- Titles and descriptions are written as complete sentences and kept within
  practical search-result lengths.
- FAQ schema mirrors visible answers but is not treated as a guaranteed rich
  result.
- The 14 broken `/faqs/index.en.html` links point to the real FAQ URL.
- Category landings expose organized links to all product content clusters.
- The English blog index exposes the six educational articles.
- The English events/contact journey links to the two evergreen services.
- OG metadata for redirected filial pages is removed from redirect stubs and
  applied to the canonical `puntosdeventa` destinations. `/filiales/online/`
  keeps its own metadata because it is not redirected.
- `sitemap.xml` advertises only indexable, localized canonical destinations.
- Sitemap counts in CHANGELOG and PR messaging are recalculated from the final
  file rather than copied from the original batch.

## Maintainability

A reproducible generator/normalizer owns the 72 product articles from a
structured product-content dataset. The generator fails on missing locale
pairs, unknown claims, absent images, duplicate canonical URLs or broken local
links. Shared nav, footer and stylesheet references are emitted from one place.

Hand-written educational articles and service pages stay editable as HTML but
must pass the same validator.

## Verification

Automated checks must cover:

- All 83 new HTML routes return content with one H1, canonical and description.
- No broken local link or asset reference.
- Reciprocal, intent-matched hreflang across all 36 product article pairs.
- No `/faqs/index.en.html`, provisional footer variants or embedded template
  stylesheet blocks.
- No banned unsupported claims or known product contradictions.
- Product image and social image match the product family.
- Mobile navigation and desktop megamenu work on representative article and
  service pages.
- JSON-LD parses and uses an appropriate type.
- Sitemap URLs are unique, canonical and backed by a real source/build route.
- Public build and the existing 33 Playwright tests remain green.

Visual verification covers representative spotlight, guide, FAQ, educational
and service pages at 390, 768 and 1440 pixel widths, including menu behavior,
focus order, text wrapping, image loading and absence of horizontal overflow.

## Completion Criteria

The PR is ready for review when all blocking technical contradictions are gone,
every retained page has relevant human-readable copy and a truthful image, all
automated checks pass, the browser review shows consistent AGAMA presentation,
and the final handoff contains the complete grouped list of public URLs.
