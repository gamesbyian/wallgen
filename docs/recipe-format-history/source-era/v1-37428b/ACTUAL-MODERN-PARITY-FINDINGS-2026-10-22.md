# Original first-v1 versus current renderer: actual Chromium parity results

**Executed and visually inspected 22 October 2026 (Calgary local date).** A branch-only Chromium test ran the frozen original model, renderer and PNG writer from `37428b624e55a0d4526b992bfe6fdf4a01b5f420` against one carefully labeled modern rendering *candidate* at identical 600×1300 raster dimensions. Evidence: [Actions run #39897919445](https://github.com/gamesbyian/wallgen/actions/runs/39897919445), [six-file source artifact #12477174214](https://github.com/gamesbyian/wallgen/actions/runs/39897919445/artifacts/12477174214) (four PNGs, `manifest.json`, contact HTML). Both branch-only browser and ordinary quick Node jobs succeeded.

## Measured painter mismatch: conversion must remain refused

| Chromium source / same seed | First-v1 shadow **off** | First-v1 shadow **on** |
| --- | ---: | ---: |
| Source-era PNG IDAT exactly matches pinned historical SHA-256 | **Yes** | **Yes** |
| Canvas pixels compared | 780,000 | 780,000 |
| RGB-exact pixels (old vs modern) | 549,368 | 523,512 |
| Pixels differing by >2 in at least one RGB channel | **230,413 (29.54%)** | **245,471 (31.47%)** |
| Mean absolute RGB channel delta, across whole canvas | **39.730** | **39.623** |
| Maximum single-channel delta | 246 | 246 |
| Historically black source pixels | 416,496 | 349,739 |
| Historically black pixels changed by >2 RGB | **190,111** | **140,901** |
| Alpha-channel mismatches | 0 | 0 |

The source-era IDAT hashes are identical to the original independent October 17 goldens in [SHADOW-IMAGE-GOLDENS.json](SHADOW-IMAGE-GOLDENS.json), which grounds comparison to authentic original pixels rather than a rewritten interpretation. Matching IDAT hashes are not required across arbitrary different browser encoders.

**Actual optical review of the four source-rendered PNGs:** the 2026 first-v1 canvas contains seven narrow, individually separated curved ribbons with broad black intervals; the modern candidate makes ribbons substantially broader and often adjoining, with changed outer endpoints and dramatically reduced inter-band negative space. Both draw seven distinguishable colour identities, but their composition and pixel coverage disagree materially. With the original shadow on, the edge blur differs as well; the major geometric disagreement already exists with shadow off. These are readily visible differences, not merely an antialiasing tolerance issue.

## What the controlled candidate actually tried

The exact original normalizer and a read-only helper mapped `stripeShadowEnabled:false` to a modern strength of zero and `true` to the historical strength 45, retained shared old fields, and explicitly hypothesized `structure:paths`, `composition:single`, `construction:ribbon`. The field audit finds **one** discontinued source field (`stripeShadowEnabled`), **54** newly synthesized contemporary fields, and shared-field changes confined to `version` (plus the off-state shadow strength). Similar scalar values have not established similar painter semantics; source scene/width, painter and newly defaulted composition behaviours must be examined separately. No further mapping or inferred chronology is warranted from these two source-era pictures.

**Decision:** first-v1 → contemporary v2 *automatic* metadata migration is **blocked**. The experimental `firstV1PreviewCandidate` always reports `safeForMigration:false`, the original `inspectPngMigration` still refuses v1, no original PNG is rewritten, and the immutable exact-byte iTXt backup remains available. This run did **not** test later v1 revisions, real authored old PNGs from other seeds, physical Pixel fidelity or 3024×6552 old full exports. It would be unsafe to bypass refusal based only on the apparently narrow field audit.

## Next source-era-specific investigation

Inspect original-v1 `resolveScene` stripe width/position/edge data versus candidate contemporary scene output before attributing the gap to painting. Investigate first-era scene/default and renderer changes independently (especially widths and negative space), then pin later-v1 revision intervals by exact Git blobs with their own goldens, separate conversion matrices and proven raster comparisons. If and only if a source-interval adapter survives multiple scenes and explicit old field/recipe-default checks, propose a narrowly gated metadata mapping that preserves **all** original IDAT/critical/other ancillary bytes and archives original iTXt. Never infer provenance from the `roygbiv-recipe-v1` envelope alone.

Temporary Chromium CI was an isolated source-only probe and was removed before PR merge; standard PR validation stays `npm run check:quick`.
