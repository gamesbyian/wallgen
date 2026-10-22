# Photo finish: first seven real production-rendered image review

**Completed:** 2026-10-22, one-off [Chromium production-render run #39819624080](https://github.com/gamesbyian/wallgen/actions/runs/39819624080) in deliberately temporary [PR #496](https://github.com/gamesbyian/wallgen/pull/496). The [review artifact](https://github.com/gamesbyian/wallgen/actions/runs/39819624080/artifacts/12443871880) contains seven PNGs, seven complete `.recipe.json` files, `index.html`, and `manifest.json`; the artifact was configured for **7-day retention**. The ZIP was downloaded and the actual seven images visually inspected side by side. This is **no longer only a review script**. The temporary workflow changes were removed entirely from its branch, and PR #496 was closed unmerged.

## Evidence and acceptance boundary

All seven screenshots came from **ROYGBIV's production Chromium renderer**, at 600 × 1300 on the same seed (`photo-review-001`) and matching base geometry. The images passed independent local PNG decoding and complete per-chunk CRC inspection. Extracting each embedded PNG `ROYGBIV Recipe` iTXt JSON and comparing it to its matching `.recipe.json` returned **seven exact recipe matches**. This confirms that the comparison represents actual render/export semantics, rather than fabricated images or hand-coded swatches.

| Photo look | PNG bytes | Observed in the rendered image |
| --- | ---: | --- |
| Original | 94,151 | Solid ROYGBIV ribbons on near-uniform black background; seven hues readable; short violet segment as designed by this particular composition |
| Slide film | 803,148 | Stronger saturation and cleaner luminous yellow/green, modest hue shift; black largely retained |
| Muted negative print | 1,208,000 | Softer, more subdued colours; **black substrate visibly lifts to warm charcoal**, around RGB (17, 16, 13) at (20, 20), compared with (0, 0, 0) in original |
| Grain only | 931,747 | Fine reproducible speckles in the stripes and the dark field; shape/hue relationships retained |
| Warm halation only | 149,288 | Real warm fringe in dark pixels immediately beside luminous ribbon edges, most visible at full-resolution crop; **subtle at 100% Halation**, easily missed in gallery-scale thumbnails |
| Smartphone HDR | 269,808 | Brighter, punchier saturation and highlights, with black largely retained; intentionally stylized, not validated against any iPhone capture |
| Low-resolution webcam capture | 852,596 | Visibly reduced resolution and chroma detail, stair-stepped/slightly ragged outlines, softened darker hues; distinct from a mere colour grade |

**Independent per-pixel difference against untreated image** on seven 600×1300 RGB frames (absolute channel differences, 0–255 scale): Slide 7.893 mean; Muted Print 15.156; Grain Only 2.437; Warm Halation 0.384; Smartphone HDR 3.918; Webcam Signal 6.844. The halation output differed by more than two channel levels in about 12.4% of pixels, with the effect concentrated at edges. This explains the discrepancy between unit-test proof of spatial glow and faint apparent glow at contact-sheet scale.

## Findings and decisions

- **Confirmed visually working:** production Photo pipeline, distinct treatments, grain noise, localized warm-edge diffusion, HDR colour grade, and spatial webcam signal loss. Every recipe round-trips from its actual saved PNG.
- **Not automatically declared finished:** film-stock realism, photochemical optics, physically meaningful camera sensor/codec behavior, composite embroidery/material interplay, exact phone display contrast, 19.8MP performance, colour-vision accessibility and fixed-height Pixel portrait controls.
- **Candidate future art refinement:** consider a *separately named* stronger/wider Halation option or explicit revision if a more conspicuous bloom is desired. Do not quietly retune the existing `film-halation-only` preset and thereby change already saved recipes.
- **Candidate future UX refinement:** the Muted Negative look intentionally lifts black substantially. If artists want true-black AMOLED wallpaper, offer an independently controlled black-floor preservation strategy rather than globally changing this preset without approval.
- **No new CI debt:** the single seven-image review was run through a temporary branch-gated step; `.github/workflows/check.yml` was restored exactly before the temporary PR closed. Never re-enable this for every focused UI/feature PR.

The next sensible **manual, targeted** image review is one textured/embroidered complex composition with and without the Photo pass, or a single native-resolution Pixel 6 Pro export if a concrete preview/export mismatch emerges. There is no reason for a 1000-screenshot test matrix. Related [film #468](https://github.com/gamesbyian/wallgen/issues/468), [camera #471](https://github.com/gamesbyian/wallgen/issues/471), [materials #445](https://github.com/gamesbyian/wallgen/issues/445).
