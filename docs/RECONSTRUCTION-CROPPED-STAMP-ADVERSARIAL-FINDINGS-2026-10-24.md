# Cropped hue-stamp false-positive hardening, 24 October 2026

**Scope:** Reconstruction [#557](https://github.com/gamesbyian/wallgen/issues/557), focused [PR #682](https://github.com/gamesbyian/wallgen/pull/682). Earlier [#679](https://github.com/gamesbyian/wallgen/pull/679) delivered the authentic displaced Jagged #16 **0.058721503425** current-renderer fit by recognizing four intact congruent ribbon pigments and three progressively cropped pigments.

## Reproduced failure

The first four source hue-mask contours in the merged cropped-stamp detector were compared by pixel-level translated overlap, but the remaining three were checked **only** for progressively smaller areas, increasing crop-bound offsets, and correct frame-edge contact. Consequently two unrelated, observable ribbons could masquerade as a sevenfold common silhouette even though three copies were not supported by their actual source pixels.

A new 220×350 seven-pigment adversarial image uses four congruent full-width curved ribbons and three progressively shortened, flat ribbons at the same right edge. **All seven** are real connected, similarly thick colour objects with the expected pigment order, crop bounds and decreasing area. On merged #679 the descriptor falsely returned `repeatShape.clipped=true` (the intact first-four translated-mask Jaccard was 1.0) and offered seven identical editable imported-shape stamps. Those three true source contours are visibly different.

An even subtler adversarial variant retains the same physical thickness and mean principal-axis angle on all seven, but changes the last three ribbons' **waviness frequency** (`sin(x/9)` rather than `sin(x/17)`). The earlier source ribbon-width and axis descriptor still accepts it. Again, shared-stamp provenance is unsupported by actual tail shapes.

## Source-only correction, no extra paint budget

Two independent validations reuse information the single shared importer already produces:

1. **Physical coherence:** before publishing a *clipped* `repeatShape` hypothesis, require the existing `measuredRainbowRibbonBands` descriptor (consistent all-seven pigment axes and ink thickness). Ordinary fully exposed sevenfold-congruent stamps continue through unchanged.
2. **Visible contour rhythm:** the same connected-component pixel members supply a vertical-column centroid signature for the exposed first-four reference and each cropped tail. A bounded horizontal translation search chooses the best vertical-translation-invariant ridge residual over at least **80% of the tail's observed columns**. A per-frame tolerance `max(2, height × 0.0075)` rejects changed-frequency tails; the original source's actual Jagged tail residuals measured **1.528, 2.434, 3.723 pixels at 277×600**, all below the 4.5-pixel threshold. Normal genuine right-edge-cropped source remains accepted. The opposite-edge mirrored source is **still unsupported** by the merged #679 crop gate and is intentionally refused; an earlier unmerged local mirror experiment is not claimed as shipped evidence. This is a **conservative appearance-evidence guard**, not reconstruction of hidden geometry or original seed.

There is no new image segmentation dialect, global cross-correlation renderer, paint pass, altered canonical object, workaround palette, third-party source storage, new font/UI ownership, or noncanonical export. The original shared six candidate paints and at most ten refinement paints, locks/cancellation, Undo and worker/headless paths remain unchanged.

## Genuine source/control rerun

Using the preserved authentic **current-renderer** metadata-free PNG source bytes from [the seven-case Chromium evidence artifact #40155115356](https://github.com/gamesbyian/wallgen/actions/runs/40155115356), the same production `drawWallpaper` via local Skia Canvas2D and unmodified current six-plus-ten fit produced identical accepted scores:

| R0 source | Best error with guard |
| --- | ---: |
| #01 vertical | 0.028885137789 |
| #02 diagonal | 0.085834786639 |
| #03 Wave | 0.017332437783 |
| #04 Jagged | 0.058758032460 |
| **#16 cropped/displaced Jagged** | **0.058721503425** |
| #17 fourteen circles | 0.003892993495 |
| #18 holed compound stamps | 0.005472186872 |

The three new adversarial illustrations are **synthetic negative controls**, not genuine renderer-made source imagery or human acceptance. The seven score results are genuine saved current-renderer sources evaluated locally through the same painter, not a new standalone Chromium run of this PR. The prior [#679 actual Chromium source/fit gallery](https://github.com/gamesbyian/wallgen/actions/runs/40155115356) and full 3024×6552 embedded-PNG portability evidence remain valid for the unchanged accepted #16 recipe.

In a local Node/Skia environment, complete 277×600 source `reconstructionCandidates` analysis with the new guard took approximately **150–157 ms** in warm repeated #16 trials, including the pre-existing segmentation/geometry stages. It is *not* physical Pixel time or memory acceptance. New deterministic tests verify refusal of flat and changed-frequency cropped tails, acceptance of genuine right-edge-cropped geometry and explicit refusal of unsupported opposite-edge cropping, and unchanged shape/lock behavior.

**Remaining:** exact reconstruction of arbitrary unrelated pigment mixtures, fully hidden shapes, opaque mixed occlusion, material/photo effects and source-specific Hairpin/Loop crossings remains unverified; #557 stays **OPEN**. Conservative refusal is preferable to a fabricated editable seven-copy topology.
