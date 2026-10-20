# Agent 4 gallery/export acceptance evidence, 2026-10-20

Scope: implementation queue entries **12** (Explore/Saved/history) and **14** (PNG/JSON round-trips and export geometry). These remain **unchecked**.

## Source-grounded counterexample repaired

`src/png-metadata.js` previously copied existing ancillary chunks unchanged and prepended new `ROYGBIV Recipe` iTXt metadata before IDAT. Re-embedding a different recipe into an already exported ROYGBIV PNG produced two recipe iTXt records. `extractPngRecipe` returns the first record, so a later import silently restores the **old recipe**, even though the export passed the new recipe. The fix removes earlier ROYGBIV recipe records from the PNG prefix during recipe re-embedding; it copies all other original chunks and IDAT without modification. Pure metadata-only calls without a new recipe retain prior behaviour.

New `tests/png-reembed-recipe.test.js` specifies: two successive exports restore the latest normalized recipe; re-export across Paths, Radial and Regions restores each new structure and setting; the PNG IDAT chunk remains byte-identical; the IHDR dimensions are unchanged; exactly one ROYGBIV recipe iTXt remains. It intentionally uses a tiny deterministic fixture and does **not** substitute for live 3024×6552 downloaded-image pixel comparison.

## Independently inspected source surfaces

- `src/favorites-store.js` already bounds malformed storage, skips invalid records, retains valid adjacent recipes, and normalizes legacy seed-bearing records. Existing `tests/favorites-store.test.js` covers these boundaries.
- `src/app.js` listens for cross-tab localStorage updates and refreshes the Saved view; gallery request tokens prevent older async iteration from appending stale cards.
- `src/exploration-history.js` snapshots recipes independently of Undo and retains restoration even when thumbnail rendering fails.
- The original queue records substantial prior Chromium gallery and actual downloadable export evidence. This PR narrows a separately reproducible repeated-embedding defect, not comprehensive acceptance.

## Execution and unverified boundaries

This connector session could read and modify GitHub files but could not clone/execute the repository or launch Chromium; the attempted container GitHub connection failed DNS. Therefore **no claims of green CI or local test execution are made here**. Run `npm run check`, `node --test tests/png-reembed-recipe.test.js`, targeted Chromium gallery and PNG download suites, and verify PR CI before merge. Actual cross-tab navigation, simultaneous gallery requests, malformed recipe recovery, download pixel parity, human aesthetic approval and physical Android behaviour are **NOT VERIFIED by this PR**. Leave acceptance entries 12 and 14 unchecked.
