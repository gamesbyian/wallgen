# Browser-functional acceptance: gallery and export (20 October 2026)

## Acceptance scope and rationale

This reconciles two **functional** top-level entries in `docs/UI-REDESIGN-IMPLEMENTATION-QUEUE.md`: image-first Explore / independent Saved / history / favourites / gallery loading, and the application's supported PNG/JSON recipe round-trips and native preview/export geometry.

The acceptance standard is a **source-bound, reproducible Chromium and downloaded-artifact matrix** over the actual implemented product. Unbounded combinatorial input spaces are not meaningfully testable, but representative distinct structures, conditional states, errors and cross-tab races have independent negative coverage. Acceptance does not claim a physical Android session, OS-specific file-picker/clipboard behavior, human visual quality or all possible arbitrary external PNGs. Those remain release/device/design gates.

## Gallery, Saved and history functional gate

- [Merged #159](https://github.com/gamesbyian/wallgen/pull/159): actual 412×892 Explore → Generate 12 unique wallpapers → select → favourite → Saved → restore → Edit/Undo, plus fast asynchronous mode switches and full recipe equality.
- [Merged #269](https://github.com/gamesbyian/wallgen/pull/269): independent 412×892 and 700×412 image-first browser, malformed storage, blocked writes, source destination accessibility, full locked-state restoration.
- [Merged #281](https://github.com/gamesbyian/wallgen/pull/281), [CI 39398304796](https://github.com/gamesbyian/wallgen/actions/runs/39398304796): corrupted/legacy storage recovery, 30→2 concurrent cross-tab refresh, 10-item bounded history, exact authored restore and Undo, thumbnail-encoding failure recovery, and rapid asynchronous generation without stale cards.
- [Merged #283](https://github.com/gamesbyian/wallgen/pull/283): de-duplication of restored legacy-normalized Saved identities.
- [Merged #291](https://github.com/gamesbyian/wallgen/pull/291), [CI 39401149371](https://github.com/gamesbyian/wallgen/actions/runs/39401149371): source desktop 840/1280px same-tab favourite live removal and re-add, cross-tab mutations to empty while 30 cards are loading, disabled/busy-state recovery.

The intentional policy that unsaved Explore history does **not** persist across a cold browser session is verified as a product boundary, not an error. Tests retain full recipe identity, gallery mode labels, painted source thumbnails, focus and loading/empty state semantics. The named browser functionality is accepted; human visual preference for the card design is explicitly outside this gate.

## Supported recipe transport and native export functional gate

- [Merged #281](https://github.com/gamesbyian/wallgen/pull/281): repaired multiple or stale `ROYGBIV Recipe` iTXt records and preserved original IDAT; latest valid record is authoritative, forged/corrupt record must fail. Actual mobile PNG file-input positive/negative/retry/Undo cases and original JSON download/import cases pass in the independent Agent 4 workflow.
- [Merged #286](https://github.com/gamesbyian/wallgen/pull/286) and [#272](https://github.com/gamesbyian/wallgen/pull/272), [22-mode full-resolution native export CI 39382416370](https://github.com/gamesbyian/wallgen/actions/runs/39382416370): production browser downloads at 3024×6552, exact embedded recipes, zoom/Fit/camera invariance, all 12 Paths geometries, five Radial and five Regions modes, 600×1300 vs native 3024×6552 shared view geometry, 35,532 stable direct/native raster samples with zero differences.
- [Merged #293](https://github.com/gamesbyian/wallgen/pull/293) and [#295](https://github.com/gamesbyian/wallgen/pull/295): 180 seeded normalized recipes (60/structure), including 36 Drawn, off-frame paths, dormant/locked Material and Interior, byte-transport normalization, signed-zero corner cases, and exact JSON/share URL/PNG metadata/model scene identity.
- [Merged #304](https://github.com/gamesbyian/wallgen/pull/304), [mobile CI 39405563455](https://github.com/gamesbyian/wallgen/actions/runs/39405563455), [native CI 39405563378](https://github.com/gamesbyian/wallgen/actions/runs/39405563378): legitimate >64 KiB embedded recipe survives an actual 3024×6552 PNG download/import; documented 1 MiB safety bound rejects oversized targeted metadata explicitly, with subsequent successful retry and Undo, and 1,333 stable native-preview witnesses showing zero mismatch.
- [Merged #317](https://github.com/gamesbyian/wallgen/pull/317) plus [#338](https://github.com/gamesbyian/wallgen/pull/338): valid large JSON recipes via portable compressed link (116,910 to 7,759 characters), exact clean-context restore, and truthful refusal of valid incompressible recipes above the 8,192-character limit without corrupting clipboard or losing JSON fallback; malformed versions and missing native CompressionStream have bounded negative coverage.

This accepts actual supported application pathways, not arbitrary user-supplied PNG formats, every stochastic/textured pixel, interrupted hardware downloads, or external browser/share interoperability not represented in the matrix.

## Still open, without invented approval

The other Phase A–E top-level checklist gates remain as written. In particular, screen plates, icon aesthetics, broad human unscripted review, full cross-platform assistive narration, human Focus preference, native Android/physical-device touch, and unproven conditional permutations **are not accepted by this document**. A passing source/Chromium test may disprove a bug, but it does not attest to a person testing on a handset.

All cited CI and merges precede this documentation-only reconciliation. Neither product code nor test assertions were weakened to close these functional gates.
