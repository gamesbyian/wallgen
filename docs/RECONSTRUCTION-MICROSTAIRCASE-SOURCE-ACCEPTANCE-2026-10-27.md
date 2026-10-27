# Source-visible polygon micro-staircase smoothing: actual image acceptance (27 October 2026)

**Owner issue:** [reconstruction #557](https://github.com/gamesbyian/wallgen/issues/557). **Focused implementation:** [PR #806](https://github.com/gamesbyian/wallgen/pull/806). The existing canonical compound-region renderer remains untouched.

## Why a second contour repair was warranted

After merged [#804](RECONSTRUCTION-SOURCE-CONTOUR-AA-ACCEPTANCE-2026-10-27.md), the actual native-size source→inferred→reference/worker Hairpin and Loop exported identically, but [#805 full-resolution visual inspection](RECONSTRUCTION-HAIRPIN-LOOP-FULLRES-ACCEPTANCE-2026-10-27.md) still showed **source pixel-grid staircase artefacts magnified in 3024×6552 output**. Hairpin recovered 250–350 and Loop up to ~520 vertices per hue, often many alternating ~90° turns with incident segment length one source-analysis pixel. The original authoring painter's 480×1040 smooth curved edges were reduced to around 277×600 source analysis and then reproduced as raster cell polygons blown up around 11× at native export. The 96×208 source score alone does not penalize such large-scale visual facets.

The initial inverse-only manually invoked [micro-staircase research pass #40442206415](https://github.com/gamesbyian/wallgen/actions/runs/40442206415) painted multiple native ROYGBIV source-fitting options with exact current `drawWallpaper`, sampling per-shape microstep strengths 0, .12, .24, .36, .5 and comparing 96×208 full-pixel RGB+brightness, per-hue IoU and edge Chamfer. Its [real PNG/score artifact](https://github.com/gamesbyian/wallgen/actions/runs/40442206415/artifacts/12706905844) recorded small source wins with strength .5 for Hairpin, Loop, Wave, Jagged and displaced Jagged, while Straight remained unchanged. An additional actual renderer native 3024×6552 research pass [#40442496062](https://github.com/gamesbyian/wallgen/actions/runs/40442496062) saved both Hairpin and Loop **0.5 strength** image variants, [actual PNGs and editable variant recipes](https://github.com/gamesbyian/wallgen/actions/runs/40442496062/artifacts/12706433555). These images were downloaded and opened next to #805's real baseline full-resolution sources, including enlarged ring centre and lower crossing crops. Loop ring boundaries visibly lost some harsh two-axis pixel-cell corners while retaining band colours and recognisable crossing; residual small stairsteps and the underlying invisible painter-order uncertainty remain.

## The bounded geometry adjustment

**Only the same source-evidenced strong, seven-hue, black-ground, nonradial, sufficiently flat, not-source-measured-dark eligible hue silhouettes that #804 already qualifies** receive microstep smoothing; no new classification pass or arbitrary source type. Source tone/radial/texture refusal and partial/missing semantic hues are unchanged. `src/image-hue-reconstruction.js` exports a pure bounded `smoothSourceVisibleMicrostairs(found,w,h,{strength=.5})`. It transforms the *already #804 AA-calibrated validated source-visible vector rings*, never raw source pixels. At each vertex, move by **at most .65 source-analysis pixel** only if an incident segment is **shorter than 1.5 pixel** and *both* are shorter than **12 source pixels**. Movement is a 0.5-strength adjustment toward the immediate neighbour midpoint, bounded to the viewBox.

This protects longer genuine corners and intentional Jagged shapes, preserves source-frame contact coordinates and original source centre; traces both outer and hole rings without merging detached components; recalculates source radius so the existing scattered canonical pose and scale still apply. `normalizeCompoundRegion` remains authoritative and the original already-valid source-visible shape is retained if an adjustment makes invalid topology. No new renderer, PNG format, material system, worker code, photo pipeline, new setting, sensor/camera data, Undo action, binary image retention, font capture or additional six-plus-ten inverse fit painters. Standalone ordinary hue extraction remains default-zero. Pure Node/lean regression tests check sampled staircase coordinates actually change, exact shape determinism, source image immutability, hole preservation, crop edges and input bounds.

## Full 22 true production-source and 16 independent-source A/B

[Actual Chromium complete 38-source same-image A/B #40442935241](https://github.com/gamesbyian/wallgen/actions/runs/40442935241), [all old/new source/fitted PNGs, inferred editable recipes, numeric A/B JSON receipts #12706359518](https://github.com/gamesbyian/wallgen/actions/runs/40442935241/artifacts/12706359518). This first generated 22 genuine current-renderer metadata-free sources and 16 independently authored standalone Canvas2D original PNGs **once**. It then ran full normal source-blind canonical candidate/renderer fitting once with the microstep adjustment, once with *only the new 0.5 strength set to zero in the disposable runner*, preserving merged #804 as the baseline. Every source PNG was checked pixel-identical across the paired fits and winner PNGs were scored under exactly the same corrected full-pixel 96×208 loss. **No 6+10 render limit increase or source image truth consulted**.

| Evidence corpus | Improved old→new actual fitted source score | Exact identical fit | Worse |
| --- | ---: | ---: | ---: |
| All 22 real current-renderer R0 | **7** | 15 | **0** |
| Four independently authored original pigment graphics | **3** | 1 | **0** |
| Four low-chroma source controls | 0 | 4 (including refusals) | **0** |
| Four sparse-hue source controls | 0 | 4 (including refusals) | **0** |
| Four missing-middle-hue source controls | 0 | 4 (including refusals) | **0** |
| **Total** | **10** | **28** | **0** |

Some representative actual corrected full-frame errors vs the already-shipped #804 baseline:
- **05 Hairpin:** .0272736378205 → **.0269059416635** (about 1.35% additional).
- **06 Loop:** .0362916941616 → **.0357636433981** (about 1.46% additional).
- 03 Wave .0127490258924 → **.0125948576546**.
- 04 Jagged .0176024285916 → **.0174539066428**; 16 displaced Jagged .0117051989065 → **.0115538783622**.
- Independently authored polygon-seven, concave-seven stars and occluded mixed seven source designs all improved slightly; true native circles, dark-colour samples, low-chroma neutral refusals, representable first-N partials and source-infeasible skipped colour slots are unchanged.

**No source was regressed in the 38-case actual rendered, paired source PNG comparison**; nevertheless this is test-set and particular source threshold evidence, not an unconditional superiority theorem. The full native smooth variant artwork and residuals must still be inspected in future optical acceptance. Artistic judgement, physical Pixel 6 Pro, owner-imported independent art, hidden layer ordering, original source seed and a general-purpose smooth Illustrator-style vectorizer remain NOT PROVEN.

## Remaining risks and boundaries

- Source-image segmentation can still lose slender connected bands, intersections and subtle antialias before any shape is fitted. A 0.5-strength local midpoint adjustment does **not** discover missing paths, overlap stack or original author seed. It may not sufficiently smooth every 4K-visible stair, but does not override the creator's separate deliberate Jagged source semantics.
- Multiple source components and holes remain within the existing canonical 1200-vertex/hue validation; topological failures return original unmodified polygons. No impossible hue slots, private pixels, fonts or source author state is serialized.
- Fully shipped acceptance requires final exact-head lean CI after deleting the temporary expensive PR browser workflows. The reusable opt-in `scripts/probe-hue-microstair-browser.mjs` and previously accepted `scripts/evaluate-source-contour-ab.mjs` remain available for opt-in research. Do not enable repeat browser work on normal PRs.
- #557 remains **OPEN** for source-external human acceptance, topology around occlusions and native aesthetic smoothing refinement.

## Native 19.8MP reference/worker round-trip acceptance

The final [true native-size Chromium run #40443267413](https://github.com/gamesbyian/wallgen/actions/runs/40443267413), [full-resolution Hairpin/Loop source, actual rendered PNG pairs, portable inferred recipes and JSON report artifact #12706992817](https://github.com/gamesbyian/wallgen/actions/runs/40443267413/artifacts/12706992817), reran the existing independent `scripts/reconstruction-contour-fullres-browser-proof.mjs` against the **actual micro-staircase production branch** rather than a research-only candidate. Real metadata-free current-renderer sources were inferred into ordinary seven-shape canonical editable scenes, then each generated 3024×6552 PNG with reference and worker backends separately.

- **05 Hairpin:** native PNG reference SHA256 = worker SHA256 = `e51ba014af6981d8f07a5a798202cb6c277320b4f7b581c7b61b89ba1cd28905`; RGB/alpha channel mismatches **0**; source SHA256 unchanged; recovered PNG embedded normalized recipe exactly.
- **06 Loop:** native PNG reference SHA256 = worker SHA256 = `408bc62e5dbc385e6777cc2b2d484b682e13f9999632079062484e4c300527ba`; RGB/alpha channel mismatches **0**; source SHA256 unchanged; recovered PNG embedded normalized recipe exactly.

Total **39,626,496 pixel positions and 158,505,984 RGBA channel comparisons**. Normal fitting budgets and existing headless/worker semantics unchanged. This provides actual-branch native-size export acceptance in addition to the separately viewed 3024×6552 research variants above; neither proves a physical Android run, owner's aesthetic approval or identity of hidden painter order.
