# AGAMA Blogger Historical Content on VPS — Design

## Objective

Make every editorial article currently exposed by the AGAMA blog available in the existing AGAMA Blogger, without importing unrelated generated SEO inventory and without changing the public site during migration.

## Scope

- Canonical migration inventory in Git: 17 Spanish editorial articles and 6 English variants linked as article cards from the public blog indexes.
- Existing AGAMA service only: `agama-blogger` continues to run inside the AGAMA container on its own VPS.
- Runtime editorial state remains in the private persistent `AGAMA_CONTENT_DIR` volume so drafts survive container replacement.
- Existing Supabase identity check and API boundary remain unchanged in this PR.
- No WF-Studio static-site adapter, GitHub write token, new database, public route, DNS change, or deployment is introduced.

## Source model

The versioned history catalog is generated deterministically from the public article pages already committed in this repository. The two public blog indexes define editorial membership; product/FAQ/SEO pages that merely live under `entrada-de-blog/` are excluded.

Each catalog item has a stable editor `id`, public `slug`, `locale`, output filename, URL, metadata, body HTML, and source path. Spanish IDs remain the public slug for backwards compatibility. English variants use `en-<slug>` internally while preserving their existing `/index.en.html` URL.

The Git catalog is the immutable migration baseline. A managed JSON override in the VPS volume records every save, draft, last published revision, withdrawal, or deletion tombstone. Existing records from the earlier AGAMA VPS format are normalized on read. The volume never modifies the Git checkout and can be backed up independently.

## Lifecycle

- Opening a historical item reads the Git baseline unless a VPS override exists.
- Saving writes an atomic managed override and never changes the public page; when a newer draft exists, replay keeps serving the last published revision until an explicit publish or withdrawal.
- Publishing a historical item updates only its editable content in the existing public page template and updates its existing blog card; CSS, navigation, analytics, and unrelated HTML remain intact.
- Withdrawing changes the managed status to draft and removes the public output/card at runtime. The action is replayed on container startup from the persistent volume.
- Deleting is allowed only after withdrawal. It writes a tombstone instead of destructively erasing the Git baseline.
- A currently featured hero article cannot be withdrawn or deleted from Blogger because doing so would leave the fixed hero structure inconsistent. That operation requires a separate reviewed Git change to choose a replacement hero first.
- New articles retain the existing generated template and can use either Spanish or English routing.

## Safety invariants

- Loading the catalog or saving a draft produces no public-site writes.
- IDs, slugs, locales, and output filenames are validated before filesystem access.
- Historical templates are patched only at known title, description, heading, and body boundaries; a missing boundary fails closed.
- Index rebuilding removes/replaces only exact article-card anchors controlled by managed overrides.
- Public route names are immutable for an already-published historical item.
- Startup replays managed published/draft/deleted state from the VPS volume.
- Tests prove exclusion of generated SEO inventory, preservation of unrelated HTML, locale routing, and API authorization.

## Deployment boundary

This PR prepares code and migration data only. It does not merge, deploy, alter DNS, create credentials, or copy production volume data. Deployment must back up `/data/agama-blogger`, run the existing Blogger checks, start a preview container, and smoke-test one draft plus one disposable test article before production cutover.
