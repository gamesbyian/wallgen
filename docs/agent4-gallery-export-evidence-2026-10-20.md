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

## Second Agent 4 continuation, same-tab and transport regressions

- **PR [#291](https://github.com/gamesbyian/wallgen/pull/291), merged `b21f332222a5d81bda20a0fbb66d577c811bf7d9`:** A same-tab favourite click did not emit a `storage` event, so a desktop Saved gallery stayed stale after removal, add-back and switching to a second authored wallpaper. Red real-Chromium tests at 1280×900 and 840×900 reproduced the discrepancy. The original heart action now reconciles storage before writing and refreshes Saved after mutation, including temporary session-only favourites if writes are blocked. A second browser test proves an overlapping 30-card load superseded by an **empty** Saved list retires its pending request and fully restores the Saved action's enabled/aria-busy state. The entire updated [Agent 4 browser suite](https://github.com/gamesbyian/wallgen/actions/runs/39401149371), [22-mode native export](https://github.com/gamesbyian/wallgen/actions/runs/39401149418), [real PNG re-import](https://github.com/gamesbyian/wallgen/actions/runs/39401149678), and all other head workflows passed.
- **PR [#293](https://github.com/gamesbyian/wallgen/pull/293), merged `54f82997113af85e616406b1473c4c0f669faed1`:** `tests/agent4-deterministic-transport-matrix.test.js` uses one immutable RNG seed to generate **180 different normalized recipes**: 60 of each structure, 36 with Drawn geometry, all 180 with off-frame custom authored paths and locks, 45 with third material layer on, and 74 with a dormant second material setting. For every case, it checks exact source recipe equality across JSON, share URL, PNG embedded iTXt, normalized idempotence, output dimensions and resolved scene identity. The first run [39401889978](https://github.com/gamesbyian/wallgen/actions/runs/39401889978) correctly failed on `viewPanY:-0`: JSON normalizes negative zero to positive zero. The camera and scalar normalization code now canonicalizes signed zero to zero. The next [green validation 39402103449](https://github.com/gamesbyian/wallgen/actions/runs/39402103449) ran and passed all 180 plus targeted signed-zero witnesses. Nine associated native/download/geometry/mobile workflows also passed. This is measurable evidence, not a promise about every possible setting combination.

**Still open:** queue parent 12 (all gallery/history states) and 14 (all recipe/export permutations). The tests prove representative real Chromium interactions and one deterministic 180-fixture matrix. Physical Android, OS file picker, human judgement and unspecified external PNG formats still need their own verification.

## Nested signed-zero closure (2026-10-20)

Merged [PR #295](https://github.com/gamesbyian/wallgen/pull/295) at `b728568e3f56860964b569e3b03f86a5cc8e9344` closes a second, independently demonstrated normalization/transport defect: an exact `-0` in an authored Drawn coordinate or Interior numeric setting was preserved by JavaScript normalization but lost by JSON, URL, and PNG recipe serialization. The targeted test in `tests/agent4-deterministic-transport-matrix.test.js` first failed in [CI 39402585123](https://github.com/gamesbyian/wallgen/actions/runs/39402585123) on `customPath[0][0]`. The repair canonicalizes **only signed zero** in already-normalized Drawn point snapshots and six Interior numeric values. It does not touch Drawn resampling, anchors, renderer or nonzero artwork parameters. The follow-up [CI workflow suite at commit 74f1dbf](https://github.com/gamesbyian/wallgen/commit/74f1dbf2da847266a6643bbc563e38007a4adb28) passed all ten workflows: repository tests, live mobile browser, native 3024×6552 download/import, 22-mode export, painted-world pixel parity, adversarial gallery and accessibility, source-field controls, consolidated mobile acceptance and headless rendering.

Entries 12 and 14 remain parent-level **unchecked**. This particular JSON representation discrepancy is proven repaired; physical-device and broader acceptance remain distinct.
## Extended PNG metadata boundary (2026-10-20)

Merged [#304](https://github.com/gamesbyian/wallgen/pull/304) at `c9313b0655634e9b72cfa213b08b0d20dbc3a692` repairs an exporter/importer self-incompatibility. The exporter already allowed a legitimate 100 KB-plus normalized recipe carrying 1,000 Interior object identifiers, whereas `extractPngRecipe` ignored any iTXt over 65,536 bytes. Red [run 39404040701](https://github.com/gamesbyian/wallgen/actions/runs/39404040701) proved that a genuine exporter-written PNG silently restored `null`. It also showed oversize targeted metadata was interpreted as absent. The writer and reader now agree on a bounded **1 MiB recipe iTXt payload limit**, with explicit errors beyond it and fixed-prefix identification that avoids scanning large unrelated ancillary text during read or re-embed.

The [passing real-mobile adversarial suite 39405563455](https://github.com/gamesbyian/wallgen/actions/runs/39405563455) verifies supported large-recipe PNG import via the original `#importRecipeFile`, a CRC-valid over-1 MiB labelled PNG rejected without mutation, a subsequent valid same-input retry and exact Undo provenance. The separate [passing native full-resolution suite 39405563378](https://github.com/gamesbyian/wallgen/actions/runs/39405563378) actually downloads a **3024×6552** PNG containing that large recipe (`2,411,989` bytes), compares native bytes decoded in Chrome against the direct renderer (**1,333 stable points, 1,036 coloured, zero mismatches**), restores the complete recipe via the same original input and checks Undo. Both pre-existing worker and compatibility exporter fixtures remain passing, as do general validation, mobile Chromium, headless rendering and prior native raster tests.

A different boundary surfaced: direct navigation to a roughly 100 KB encoded recipe URL timed out in the tested static-server configuration. That is explicitly **not** accepted as a working share link; [issue #306](https://github.com/gamesbyian/wallgen/issues/306) records follow-up. The large native export fixture selects its legitimate design via the original PNG import rather than making an oversized HTTP GET. Separate [PR #308](https://github.com/gamesbyian/wallgen/pull/308) subsequently **merged** at `5059a5b7366e568a249bcad39cb242a241608dca` after all thirteen applicable checks passed. [Live Chrome acceptance 39406507815](https://github.com/gamesbyian/wallgen/actions/runs/39406507815) measured a 116,910-character design link, preserved the original clipboard with an accessible overlength explanation, proved the existing full JSON download→file-input restoration and Undo, and opened a copied ordinary-sized design link in a fresh page. The Copy Link action now conservatively refuses links exceeding 8,192 characters; this is **not** compression or universal long-link support, which remains independently tracked by [#306](https://github.com/gamesbyian/wallgen/issues/306).

The queue parent 14 remains **unchecked**. These are source-bound Chromium and deterministic pixel proofs, not physical Android file-picker testing or exhaustive external PNG compatibility.

## Portable compressed share link accepted in real Chromium (2026-10-20)

**Merged [#317](https://github.com/gamesbyian/wallgen/pull/317), squash commit `03d7efaba995fdf57e9698993162881623e4ec78`.** On exact head `d531507c49f9b97a90b096da6ea3d2ccd9459360`, **all 13 GitHub Actions workflows passed**, including native 3024×6552 PNG export, camera pixel parity, Agent 2 original/conditional control acceptance, mobile screenshot atlas and [Agent 4 real-browser suite 39410636568](https://github.com/gamesbyian/wallgen/actions/runs/39410636568).

The actual 412×892 Chromium test logged:

```json
{"largeUrlChars":116910,"compactUrlChars":7759,
 "compressedStandaloneLink":true,"cleanBrowserOpened":true,
 "sourceJSONDownloadedFromSharedBrowser":true,
 "shareEditInvalidatesOldToken":true,"malformedTokenRejected":true,
 "unsupportedCompressionFallback":true,
 "staleShortHistoryLinkRejected":true,
 "exactCanonicalRecipe":true,
 "downloadedAndReimportedJSON":true,
 "normalCopiedLinkNavigated":true}
```

A 116,910-character legacy URL compressed to a 7,759-character `#s=v1.…` self-contained fragment, which the static host never sees in its HTTP request. A clean browser (no Saved/local storage) restored the original imported design and downloaded the *complete original JSON* through the real application. Reload preserved the compact link, an actual edit invalidated its old identity, the malformed-link path reported an accessible error, and simulated missing native compression left the original clipboard untouched. A deliberately denied History API could not cause Copy Link to advertise an old short `?r=` design. Node tests separately measured a 109,134→7,788-character fixture, exact Drawn/Interior/locks/dormant state, malformed/noncanonical versions and zip-bomb guards ([full validation 39410636555](https://github.com/gamesbyian/wallgen/actions/runs/39410636555)).

**Known boundaries:** compression is not guaranteed to make arbitrary high-entropy recipes fit 8,192 characters; the original JSON/PNG sharing routes remain fully functional fallback. Physical Android/OS clipboard, other browsers and exhaustive combinations are not inferred from Chromium. Parent queue entries 12 and 14 remain **unchecked**.
