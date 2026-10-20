# Agent 4 independent adversarial acceptance ledger

**Branch:** `agent4/adversarial-gallery-export-a11y-20261019`
**Scope:** exclusively unchecked queue entries **2, 12, 14, 15**.
**Protocol:** `docs/UI-REDESIGN-ADVERSARIAL-REVIEW.md`.
**Baseline:** 2026-10-19 latest `main` when branch was created.
**No release-wide checkbox is closed merely because representative witnesses pass.**

Evidence classifications: **source-confirmed**, **browser-observed**,
**behaviour-verified**, **visual-reviewed**, **NOT VERIFIED**. CI artifacts
must support any browser-observed or behaviour-verified statement. A script
written but not run is only a **pending witness**.

| Queue entry | Independent attack and deliverable | Verification boundary |
| --- | --- | --- |
| **2. Adversarial real state review** | `tests/agent4-gallery-persistence-acceptance.mjs` injects individually corrupt records; repeatedly swaps asynchronous Explore/Saved; attacks reload and focus restoration. `tests/agent4-accessibility-acceptance.mjs` separately challenges real keyboard activation, hit-tested destinations, empty galleries, selected contrast and reduced motion. Existing `tests/redesign-negative-png-import.mjs` covers malformed PNG, checksum and undo provenance. | New browser tests **pending GitHub Actions**. Unscripted exploratory human/device sessions, exact twelve-plate judgement and eight unwired SVG candidate visual approval are **NOT VERIFIED**; Agent 1 owns icon/design changes. |
| **12. Image-first Explore, Saved and history semantics** | Hardening: `src/favorites-store.js` independently discards invalid storage entries without discarding good neighbours. A seed-bearing incomplete legacy recipe normalizes; an object without a valid seed does not become a false favourite. Unit tests check broken JSON, mixed records, valid settings, preservation and bounded inputs. Real Chromium test checks visible canvas-first cards, paint, distinct Explore and Saved, eight rapid switches, keyboard restore, complete recipe, storage cleanup and reload at **412×892 and 700×412**. Previous browser Explore/Saved/History/Undo journeys were merged in #159. | Contact sheet persists across Saved within the page, **not** across a cold reload. All storage corruption formats, quota/private-mode denial, simultaneous tabs, all history paths and physical Android remain **NOT VERIFIED**. |
| **14. PNG/JSON transport and exact export geometry** | `tests/agent4-json-download-acceptance.mjs` exercises six *real* JSON Download buttons, then source PNG file import with the just-downloaded recipes, covering drawn/weave, straight, radial, Voronoi, nested/three-layer and legacy inactive Tonal. Real 3024×6552 native downloaded PNG fidelity is independently rerun from `tests/redesign-native-download-acceptance.mjs` (five source fixtures, stable foreground comparison, not synthetic export); prior #211/#260 evidence exists. Node transport suite covers dormant settings and normalization. | Newly added browser witnesses **pending GitHub Actions**. 1px PNG used in JSON-to-file-input test proves transport only. The five actual full-resolution downloads test their fixtures, **not all** materials, blends, resolutions, export interruptions or every possible structure/geometry combination. Native Android download integration remains **NOT VERIFIED**. |
| **15. Keyboard, screen reader, contrast, touch and motion** | Browser test at **320×700, 412×892, 700×412** in **cream and dark**, with center hit-tests and 40px floor for five navigation destinations, keyboard activation and Escape focus return, selected-label and toast computed WCAG contrast, explicit `role=status`/live semantics and computed no-motion transitions. Existing #221/#243 browser acceptance covers cold Edit and expanded metadata focus. | New browser witnesses **pending GitHub Actions**. Computed browser names and roles are not equivalent to listening to VoiceOver/TalkBack. Global WCAG audit, all dynamic controls, precise 44px-or-48px targets and native Pixel 6 Pro touch/screen-reader tests remain **NOT VERIFIED**. |

## Discovered negative counterexample and fix

**Before:** `readFavorites()` used `data.slice(0,60).map(normalizeRecipe)`
inside one try/catch. A null entry could raise during `normalizeRecipe`
and discard the **entire** favourites list; a seedless object normalized to
the default rainbow and appeared as a fabricated Saved item.

**After:** independent per-item guards require nonempty string seeds,
skip malformed entries, normalize seed-bearing historical partial recipes
and bound work to 300 candidate entries for the default 60-favourite limit.
Next successful favourite modification serializes the validated collection,
repairing damaged storage without erasing surviving user data. Original
valid recipe identities, versioned normalization, gallery events and UI
markup remain unchanged.

## Independent CI checkpoint and second counterexample

**PR:** https://github.com/gamesbyian/wallgen/pull/269

At head `61a4768cca2018b52a652fa1c5efb764f2138cfa`, the independent
[Agent 4 workflow run 39375236491](https://github.com/gamesbyian/wallgen/actions/runs/39375236491)
completed **both** jobs successfully: new gallery/keyboard/contrast/JSON
browser journeys and five real 3024×6552 PNG downloads/pixel checks. Unit
tests and Node syntax checks also passed in that run. This is qualified
**behaviour-verified** evidence for that exact head, not later additions.

The **first browser run was red**, a genuine counterexample: clicking a
Saved thumbnail failed to restore the archived `lockedSettings` if the
current design carried different locks. Before: `createCard()` called
`changeRecipe(recipe,{scroll:true})`, which invoked `respectSettingLocks`
against the *old current* design. After: gallery selection calls
`changeRecipe(recipe,{scroll:true,bypassLocks:true})`, matching history and
import restoration semantics. The same exact-recipes test that exposed the
failure passes at both mobile sizes after repair, including two distinct
lock configurations. This was not a test-only relaxation.

**Follow-through awaiting its own head-specific CI:** computed browser
accessible-name assertions, live reduce → no-preference → reduce preference
changes, twelve seeded exploratory gallery actions and a separate actual
1024×768 desktop gallery/metadata/keyboard journey. No older green run
proves those newly added assertions.

## How to reproduce

1. Unit tests: `node --test tests/favorites-store.test.js tests/recipe-transport-matrix.test.js tests/gallery-view-modes.test.js`.
2. On a local server (`npx serve . -l 4173`) with Playwright Chromium installed:
   `node tests/agent4-gallery-persistence-acceptance.mjs`,
   `node tests/agent4-accessibility-acceptance.mjs`,
   `node tests/agent4-desktop-acceptance.mjs`,
   `node tests/agent4-json-download-acceptance.mjs`.
3. Actual 19.8MP file/pixel comparison: `node tests/redesign-native-download-acceptance.mjs`.
4. CI: `.github/workflows/agent4-adversarial-qa.yml` uploads failure screenshots and machine-readable records. Run details and artifact IDs belong in this ledger only **after** GitHub Actions reports a result.

**Cross-agent boundary:** no changes to Agent 1 SVG/design system or Agent 3
geometry internals. Production edit is limited to corrupt Saved hydration;
test files and an isolated workflow are new.
