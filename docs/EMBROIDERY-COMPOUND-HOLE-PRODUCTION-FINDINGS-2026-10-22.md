# Imported compound embroidery: actual image and clipping acceptance

**Completed 22 October 2026:** guarded one-time [Chromium production run #39889647143](https://github.com/gamesbyian/wallgen/actions/runs/39889647143) on PR #519, [artifact #12474047742](https://github.com/gamesbyian/wallgen/actions/runs/39889647143/artifacts/12474047742). Both 600×1300 PNG images were downloaded, opened and compared pixel-for-pixel: one untreated imported compound shape and the identical scene with scoped Tatami stitches. Every PNG chunk passed independent CRC checks. Each image's one embedded ROYGBIV recipe exactly matched its complete normalized JSON sidecar. The source geometry survives recipe normalization and Save/URL transport.

## What the actual pictures prove

The imported `roygbiv.geometry-snapshot` contains an outer cutout rectangle plus a **hole** and an independent solid **detached island**. It is not a sketch using hardcoded local Canvas paint. The same scene object carries three rings, interpreted with `evenodd` for fill and clipping.

| Measurement | Observed value |
| --- | ---: |
| PNG dimensions | 600 × 1300 |
| Untreated source bytes | 23,830 |
| Tatami PNG bytes | 131,729 |
| Original source-black pixels | **730,320** |
| Source-black pixels changed after adding Tatami | **0** |
| Originally coloured pixels | 49,680 |
| Coloured pixels changing by >2 in any RGB channel | **30,090** |
| Changed-pixel bounding rectangle | x=116..488, y=548..752 |

Actual visual inspection shows diagonal Tatami threads inside both the donut-like large component and its separate small island, preserving the square cutout and all negative space. The hole centre (235,650), island gap (365,650) and far background (20,20) remain black, and every other originally black pixel is **byte-identical across the two RGB images**. At (445,650), the source island colour changes from (246,49,57) to (246,52,60), confirming the detached component actually receives the effect. Some originally coloured pixels retain their colours because the stitch pattern consists of narrow lines, not an opaque recolour.

## Decision and limits

**Pass** for this canonical compound-region example: the existing even-odd clip and full-ring traversal are working, and scoped embroidery does not leak into the black cutout/background. No broad masking-engine rewrite is warranted. This is one seeded geometry, not exhaustive proof for every imported SVG, deeply nested holes, overlapping layers or non-default view camera. E3 physical fibre/underlay realism and real Pixel control/performance acceptance still need their own measured work.

The temporary Chromium installation and upload probe was **removed byte-for-byte** from `.github/workflows/check.yml` before PR merge. The two-image reviewer remains explicitly opt-in with no new permanent CI matrix. See [minimal reproducible study](EMBROIDERY-COMPOUND-HOLE-ART-REVIEW-2026-10-22.md) and [#514](https://github.com/gamesbyian/wallgen/issues/514).
