# Agent 4 gallery/history and export acceptance evidence, 2026-10-20

Owner: entries **12** (image-first Explore, independent Saved, favourites, history) and **14** (recipe transport, native export and pixels) in `docs/UI-REDESIGN-IMPLEMENTATION-QUEUE.md`. **Neither global checkbox is closed.** Source baseline: `fd20147bfe1dc2f65a44fa3fc5b563b8b4667510` main; branch `agent4-gallery-export-roundtrip-20261020`.

## Actual bugs fixed

1. **Repeated export restored stale design.** The old PNG metadata writer preserved existing `ROYGBIV Recipe` iTXt entries and prepended a new one. The reader returned the first, so re-embedding a different recipe left import restoring the older settings.
2. **Older double-recipe PNGs had no reliable migration.** Their last recipe could occur before or after IDAT, and the old decoder preferred the earlier record. The decoder now chooses the **last checksum-valid recipe**, while any corrupt or unsupported targeted record still causes a hard error. The writer removes all earlier ROYGBIV recipe records anywhere in the PNG, preserves every unrelated chunk and the original IDAT bytes, and writes exactly one current entry.
3. **Checksum-valid but empty or structurally invalid recipe identities silently normalized to defaults.** Import now rejects v2 envelopes whose seed is missing/blank or whose structure is not paths/radial/regions. Legacy v1 envelopes with a seed and no v2 structure remain readable.

## New enduring tests on this branch

- `tests/png-reembed-recipe.test.js`: actual PNG chunk-boundary and IHDR assertions; normal successive re-embedding across Paths/Radial/Regions; byte-identical IDAT; single current iTXt record; legacy two-record PNGs with new record both before IDAT and after IDAT; last-recipe restore and re-export cleanup; forged checksum-valid bad identities fail; legacy v1 normalized restoration.
- `tests/agent4-json-download-acceptance.mjs` extended: uses the actual `#importRecipeFile` Chromium file input with a legacy double-recipe image (new metadata *after* IDAT), checks exact URL/source state and announced success. Then imports deliberately malformed but CRC-recomputed latest metadata, requires a meaningful rejection with no recipe change or stale input, successfully retries a valid double-recipe file via that same control and verifies Undo provenance.
- `tests/agent4-history-recovery-acceptance.mjs` (new): real 412×892 mobile Chrome: three source Randomize actions create four distinct history snapshots, history JPEGs settle to 120×260, oldest restores the complete layered/locked recipe, and Undo still visits the intermediate wallpaper sequence. A separate browser context forces `canvas.toDataURL` to throw: history entries must remain selectable and exact-restorable despite failed thumbnails. A 12-generation rapid burst must leave exactly ten entries despite asynchronous thumbnail completions; the oldest retained source recipe is restored exactly.
- `.github/workflows/agent4-adversarial-qa.yml`: runs the new history journey alongside existing Saved, cross-tab, accessibility, JSON and native export acceptance; uploads independent history evidence.

## Existing mainline source/browser evidence inspected

- `src/favorites-store.js` and `tests/favorites-store.test.js`: bounds malformed storage and skips bad neighbours, preserving valid legacy/final saved recipes.
- `tests/agent4-gallery-persistence-acceptance.mjs`: image-first galleries, 412×892 and 700×412 navigation, damaged localStorage, 12 distinct Explore identities, eight fast mode switches, reload and blocked-storage recovery.
- `tests/agent4-cross-tab-saved-acceptance.mjs`: two actual simultaneous Chromium pages synchronize favourite add/remove and Saved updates.
- `tests/agent4-json-download-acceptance.mjs` preexisting six exact downloaded JSON → embedded PNG source-input cases, including inactive Tonal, drawn weave, radial, regions and layered interior.
- `tests/redesign-native-download-acceptance.mjs`: eight real 3024×6552 downloaded PNG files, exact embedded recipes, decoded dimensions and representative stable coloured direct-renderer pixels. Agent 3's separate 22-mode native export regression further broadens structure/zoom coverage.

**CI checkpoint:** prior branch commit `5b1333b4dff324cdd4422b961dc5c48686c81499` passed all five [Validate](https://github.com/gamesbyian/wallgen/actions/runs/39393631298), [Mobile Chromium](https://github.com/gamesbyian/wallgen/actions/runs/39393631359), [Headless render](https://github.com/gamesbyian/wallgen/actions/runs/39393631196), [Native PNG](https://github.com/gamesbyian/wallgen/actions/runs/39393631248) and [Agent 4 adversarial](https://github.com/gamesbyian/wallgen/actions/runs/39393631158) suites. **New tests/revisions require head-specific CI; the old green checkpoint does not prove them.** This connector could not clone/execute the repo locally (GitHub DNS unavailable in the container); all runtime assertions are exercised by the documented GitHub-hosted workflows, not simulated local-browser claims.

## Explicit remaining acceptance boundaries

Session history/Explore is intentionally not durable across cold reload. Full combinatorial gallery state space, simultaneous conflicting writes at sub-event timing, intentionally denied image-worker/OS downloads, all possible malformed metadata streams, every renderer/material permutation, OS file-picker integration, human visual/aesthetic approval and native Pixel 6 Pro touch/assistive-tech observation remain NOT VERIFIED. No unqualified “100%” claim or entry 12/14 checkbox should be made on this branch.
