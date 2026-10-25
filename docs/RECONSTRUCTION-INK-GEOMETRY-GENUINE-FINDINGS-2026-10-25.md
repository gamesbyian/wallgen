# Genuine source-mask skeleton, local-width and fit-probe findings

**Issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557)  
**Experiment:** [PR #707](https://github.com/gamesbyian/wallgen/pull/707)  
**Actual Chromium current-painter measurements:** [GHA run #40168220398](https://github.com/gamesbyian/wallgen/actions/runs/40168220398)  
**Actual three-trial global-width negative test:** [GHA run #40168447704](https://github.com/gamesbyian/wallgen/actions/runs/40168447704)

## What was actually built

- A strictly opt-in `includeMasks` response from **existing** `extractImageColourRegions`, with the same seven source segmentation arrays and default output unchanged. No second HSV pass, new palette owner or source pixels stored in canonical recipes.
- `src/reconstruction-ink-geometry.js`: bounded Zhang–Suen thinning of each visible pigment mask, existing exact Euclidean distance-to-black ink-half-width profiles, source-versus-renderer hue IoU, symmetric Chamfer edges, components/holes and read-only diagnostic summaries. For full path skeletonization require source frame area at most 40,000 pixels (actual scoring 96×208). Raw islands count pixel connectivity and are **not automatically semantic objects**.
- `scripts/evaluate-reconstruction-r0.mjs --ink-geometry` adds actual source and **already painted** canonical candidate geometry to the existing truthful R0 report. No additional forward renderer calls, ranking changes, synthetic painter or saved shape.
- `--probe-ink-width` deliberately runs **up to three extra research-only** true `drawWallpaper` renders, separate from the production ≤6 coarse + ≤10 refinement budget, only when at least six hues exhibit a coherent signed medial width offset. Results cannot be applied or exported as a new inferred recipe by the app. Explicitly labelled experimental and negative results are retained.

Focused Node tests check segmentation sameness, opt-in mask lifetime, exact skeleton of bars, width and per-hue missing-colour detection, no-op identical art and conservative width-hint refusal. Production editor unchanged.

## Five real current-renderer source/fit pairs

The same metadata-free original PNGs were generated with the production renderer, then compared against *the existing canonical fit* in Chromium. The source recipe sidecars were never given to inference. The app's original RGB+ink best fit scores are unchanged.

| Genuine source | Existing best RGB/ink error | Mean per-hue ink IoU | Mean normalized symmetric boundary distance | Raw hue-component/hole mismatch |
| --- | ---: | ---: | ---: | ---: |
| #05 Hairpin | .08447791 | .48064 | .005469 | 0 |
| #06 Loop | .04977317 | .84812 | .001640 | 62 |
| #16 displaced Jagged control | .05872150 | .73693 | .006356 | 0 |
| #18 compound hole/island control | .00547219 | .93704 | .000397 | 0 |
| #22 overlapping circle control | .00467572 | .98548 | .000465 | 0 |

The high raw Loop mismatch of 62 results from many thin disconnected thresholded fragments (e.g. 24 source red components versus 34 in fit), not proof of 62 actual missing scene objects. **Do not use raw connected-component counts as categorical crossing topology at 96×208 without morphological persistence/size controls.** Source Loop retains a visible inner ring and crossing ambiguity, but these measurements alone cannot determine hidden strand precedence.

Hairpin's low IoU is dominated by distinct U-position/exit/gap differences, and the seven medial-width ratios are inconsistent (.667 to 1.5). Its source-aware width hypothesis deliberately **refused** any uniform stroke-width adjustment.

## Additional genuine-art negative-space observation

A local top-of-frame scan of the **same shared canonical hue masks** avoids crossings and refuses any row without seven coherent visible bands. These measurements were recovered from the actual [Chromium proof archive #40168833489](https://github.com/gamesbyian/wallgen/actions/runs/40168833489):

| Artwork | Source upper samples | Source mean gap / fraction positive | Fitted upper samples | Fitted mean gap / fraction positive |
| --- | ---: | --- | ---: | --- |
| #05 Hairpin | 42 rows, 252 adjacent-hue pairs | 0.6667 px / 66.67% | 42 rows, 252 pairs | **0 px / 0%** |
| #06 Loop | 18 rows, 108 pairs | 1 px / 100% | 17 rows, 102 pairs | **0.3333 px / 33.33%** |

Jagged #16, compound #18 and circles #22 were correctly rejected as noncoherent top-of-frame seven-band sequences. This identifies a real **missing narrow-black-channel** mismatch independently of global per-hue median thickness. It does not determine original stroke widths, source render seed, U-turn radius, or Loop crossing paint precedence.

Additional source/canonical/three alternate Loop PNGs were downloaded from [run #40168711677](https://github.com/gamesbyian/wallgen/actions/runs/40168711677) and directly inspected together at the same scale. Global stripe narrowing visibly produced increasingly over-wide black channels throughout the Loop and the long vertical stem, compromising already well-aligned pigment geometry. This directly confirms the numeric decline. A separately gated **coupled spacing and width** source-backed trial is the next bounded research test; no production change is authorized unless the actual painter comparison wins.

## Real negative result: coherent Loop width hint is NOT sufficient

The current best Loop source-vs-fit per-hue median width ratio was **0.79057**, with median absolute deviation **0.08346**. It passed conservative all-hue coherence, suggesting trial shrinkage. However **actual** `drawWallpaper` probe pixels disproved that intervention:

| Loop fit candidate | Actual stripeWidth | Existing production error |
| --- | ---: | ---: |
| Existing canonical winner | 52 | **0.04977317** |
| Source-width suggested −5 | 47 | 0.05864265 (worse) |
| Source-width suggested −11 | 41 | 0.08423311 (worse) |
| Source-width suggested −16 | 36 | 0.11040528 (worse) |

This is the reason the shipped code **does not** change `refinementFields`, candidate ordering, or creative defaults. The observed seven-band width discrepancy is strongly coupled to loop geometry and registration; a plausible local descriptor cannot directly dictate a global renderer setting. No physical Pixel, owner creative judgement, source-invisible geometry or exact lost seed has been claimed.

## Disposition / next engineering directions

1. **Keep** optional existing-mask access, bounded skeleton/EDT/IoU/edge diagnostics and opt-in research score reports; preserve the default small lean PR gate. Remove the temporary heavy PR trigger after passing and reviewing genuine artwork, leaving the manual GHA workflow only.
2. **Reject** global Loop width shrink and any Hairpin uniform-width adjustment based on these results. Do not retune stripeWidth from only component coverage or median EDT radius.
3. The next hypothesis must measure actual **spatially localized black channels** along Hairpin's bend and Loop's crossing, separating orientation/position from thickness. Derive renderer-specific `turnRadius`, `hairpinAngle`, `loopRadius` or `loopSweep` trials from that evidence rather than adding renderer calls, retaining the existing lock-safe ≤6+10 constraint.
4. The alternative appearance-first approach can retain directly observed individual pigment silhouettes, but existing scattered objects share a canonical shape snapshot and cannot independently store arbitrary different shapes for all seven hues without model ownership changes. Evaluate representability before inverse-only workarounds. Source-invisible branches remain unknown.
5. Any future change to the actual chosen recipe needs genuine source/old/new `drawWallpaper` PNGs and directly inspected creative quality, plus controls #16/#18/#22, transport/Undo/worker parity, and unchanged physical Pixel evidence boundary.

[Parent vision-tooling plan](RECONSTRUCTION-VISION-ALGORITHM-REUSE-AND-TEST-PLAN-2026-10-24.md) · [Earlier VTracer optical findings](RECONSTRUCTION-VTRACER-GENUINE-ART-FINDINGS-2026-10-24.md) · [Reconstruction engineering owner](IMAGE-TO-RECIPE-RECONSTRUCTION-PLAN-2026-10-22.md)
