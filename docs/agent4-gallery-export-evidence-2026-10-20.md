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

## Completed PR #281 acceptance checkpoint (post-recovery)

The final implemented code at commit `2b746f62b242f4335a5a0a8939eb38a4a333b0ab` completed **all eleven** GHA workflows successfully, including:

- [Agent 4 adversarial gallery, history, cross-tab, accessibility, JSON and native PNG](https://github.com/gamesbyian/wallgen/actions/runs/39398304796) (both jobs passed)
- [Native worker and compatibility PNG export/import](https://github.com/gamesbyian/wallgen/actions/runs/39398304827)
- [Mobile browser acceptance](https://github.com/gamesbyian/wallgen/actions/runs/39398304749), [general validation](https://github.com/gamesbyian/wallgen/actions/runs/39398304889), [headless renderer](https://github.com/gamesbyian/wallgen/actions/runs/39398304743)
- [22-mode camera/native export](https://github.com/gamesbyian/wallgen/actions/runs/39398304778), [eight true native downloads](https://github.com/gamesbyian/wallgen/actions/runs/39398304834), [Agent 3 consolidated](https://github.com/gamesbyian/wallgen/actions/runs/39398304792)
- [Agent 2 conditional controls](https://github.com/gamesbyian/wallgen/actions/runs/39398304745), [locked-field return](https://github.com/gamesbyian/wallgen/actions/runs/39398304927), and [UI screenshot atlas](https://github.com/gamesbyian/wallgen/actions/runs/39398304765)

**Confirmed cross-tab counterexample and fix:** two valid rapid writes to `wallgen:favorites:v1` genuinely reached the second tab, but a generic busy button rewrote the Saved action's innerHTML, deleting the live `#favoriteCount` node. The second storage handler threw and left thirty stale cards despite only two stored designs. The source busy action now retains the original Saved DOM during async contact-sheet generation. The regression confirms a rapid 30→2 replacement, malformed storage and subsequent recovery, exact displayed cards and count/icon, non-disappearing status DOM, original button state, and **zero uncaught Chromium page errors**. Its failures and diagnostics were retained in preceding PR CI artifacts; the green run genuinely executes this case.

**Other related work now merged to main:** [#283](https://github.com/gamesbyian/wallgen/pull/283) deduplicates normalized Saved records during corruption/legacy recovery, and [#286](https://github.com/gamesbyian/wallgen/pull/286) independently proves actual native 3024×6552 PNG Download → Import → Undo through normal Worker and fallback Canvas2D paths. Those are separate verified commits and must be preserved when integrating this PR.

The queued parent entries **12 and 14 remain unchecked** because physical Android/OS picker and exhaustive human/conditional acceptance are not implied by these bounded browser observations.
