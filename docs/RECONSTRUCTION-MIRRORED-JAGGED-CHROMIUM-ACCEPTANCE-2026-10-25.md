# Genuine Chromium mirrored Jagged acceptance (25 October 2026 UTC)

This documents the independent real-painter verification for [#690](https://github.com/gamesbyian/wallgen/pull/690), a clean-main integration of the limited mirrored crop hypothesis in [#683](https://github.com/gamesbyian/wallgen/pull/683). **It is appearance recovery from observable pigment, not original seed or invisible-geometry recovery.**

## Blinded current-renderer comparison

Independent [real Chromium Actions run #40165889955](https://github.com/gamesbyian/wallgen/actions/runs/40165889955) and [archived source/control/new PNG artifact #12588386873](https://github.com/gamesbyian/wallgen/actions/runs/40165889955/artifacts/12588386873) generated authentic canonical source images at 480×1040 using the existing Playwright production painter. The withheld R0 16 recipe was rendered with only mirrorHorizontal=true and positionX=-18 changed. Only descriptive recipe metadata was stripped. Identical PNG source bytes were evaluated twice using the actual Canvas2D drawWallpaper candidate painter: new inverse code versus the prior main inverse code. The evaluator never reads the source truth during inference.

| Same metadata-free source | Prior main error / kind | New error / kind | Error reduction | Renderer refinement paints |
| --- | --- | --- | --- | --- |
| 04 ordinary Jagged | .058758032460 / jagged | .058758032460 / jagged | zero; exact parity | 10 / 10 |
| 16 ordinary displaced Jagged | .058721503425 / shape-repeats | .058721503425 / shape-repeats | zero; exact parity | 0 / 0 |
| **16 mirrored, offset -18** | **.224808026175 / path** | **.059420072115 / shape-repeats** | **73.5685%** | **0 / 0** |

All source, previous-fit and new-fit PNG thumbnails were downloaded and directly inspected. Old fit was a narrow compressed seven-colour strip; the updated fit recovers seven broad separated colour bands, independent black channels and visibly shorter blue/indigo/violet ends, with remaining finite contour/extent differences. A separate source-relative bright-ink binary silhouette at 96×208, max(R,G,B)>42, gives F1 **.299489 previously vs .885030 new**, precision .906523→.885030 and recall .179375→.885030. That F1 is a supplementary independent pixel check, not the app's scored image error.

## Root cause and conservative integration

The old mirrored candidate detector recognized clipped pigment shapes but its upstream measuredRainbowRibbonBands() in src/image-reconstruction.js only permitted increasing left-edge truncation. A real mirrored source instead shows four complete first pigment bands, then three right boundaries approximately .744/.538/.307, every left boundary zero, near-parallel principal axes and nearly equal observed minor ink widths. Physical ribbonBands was null and shape-repeats could never be considered in real Chromium despite local Skia-positive evidence.

Both src/image-path.js and src/image-reconstruction.js must agree on uniform same-side clipping. The proposed patch gates four intact bands, seven coherent source axes/widths, monotonically cropped tail extent, and an independent >=80%-column source contour-rhythm match, and rejects mixed-side, incoherent-width, wrong-axis and wrong-frequency examples in focused tests. Canonical editability, source provenance, locks/Undo and <=6+10 painter budgets remain unchanged; no extra rasterizer or invented missing hues.

## Honest acceptance boundaries

This validates specific **current-generator-authored** mirrored and ordinary Jagged controls, not arbitrary heterogeneous external art, invisible geometry, ambiguous pigment occlusion or every possible mirrored placement. Fine contours still differ. Physical Pixel 6 Pro Chrome/PWA/IME/TalkBack, actual handset memory and thermal performance, human creative approval and authenticated external backup remain **NOT TESTED**. Keep #557/#664 open for that residual work.
