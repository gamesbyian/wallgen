# Source-visible sparse-pigment silhouette acceptance

**Issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557) · **Implementation:** [PR #731](https://github.com/gamesbyian/wallgen/pull/731) · **Accepted real-painter optical comparison:** [GitHub Actions #40251742132](https://github.com/gamesbyian/wallgen/actions/runs/40251742132). **Independent prior baseline:** merged #726's [source-blind run #40247842572](https://github.com/gamesbyian/wallgen/actions/runs/40247842572).

## Actual source-visible failure, now addressed

The retained independent Canvas2D source `contiguous-red-orange` is a **red diamond and separate orange hexagon**. It is metadata-free and contains **no original ROYGBIV painter settings or purported seed**. The earlier canonical inference classified the two true semantic pigments correctly but offered only the existing two-circle `regions` approximation as its best candidate, flattening both independently observed angular outlines. Baseline 96×208 real-painter source/fit error: **0.029366398001513982**, despite nominally reasonable global scores that weight a large black background.

The **existing** canonical scattered-object painter already represents the actual source-visible red and orange compound polygons as two separately repositionable/resizable per-index portable embedded snapshots with `scatteredCount=2`; the defect was the old *seven-only* source-visible candidate gate. No new model, geometry primitive, colour override, painter, palette, source object or optimization budget was needed.

## Focused source-backed method

- The normal `describeReconstructionImage().incompleteColourRegions` remains the explicit safety gate: **two–six** genuinely present, **contiguous first-N** semantic hues; compact single significant connected component per hue, adequate measured source pixel area, shape aspect/fill agreement, no inferred radial rays. A source must actually show each hue to claim its shape; skipped red→blue slots and genuinely non-ROYGBIV source colours cannot be filled by fictitious placeholders.
- The reusable `observedHueShapeRecipe(...,{allowPartial:true})` reuses the seven existing ephemeral source masks, the existing connected-component/contour extraction and canonical per-object geometry snapshot. It refuses incomplete/missing masks, bad geometry, wrong hue ordering, unsafe source dimensions and incompatible locks. Its ordinary standalone default remains seven-only. The source recognizer alone sets `allowPartial` when it has proved the compact partial contract.
- The observed geometry competes with the original genuine two-circle approximation inside the **same six** normal real-painter candidates, followed by the same **at-most-ten** optional refinement paints. The best actual scored renderer is authoritative. A partial image carries an explicit only-first-N uncertainty; no authored missing pigments, invisible original intersections or original seed are inferred.
- Validate canonical JSON embedding and `resolveScene` produces exactly N independent region objects, indexed [0…N−1], with editable full contours. A protected inconsistent `scatteredCount` is rejected rather than letting an apparent two-pigment preview become seven applied objects.

## Measured Chromium source-versus-render acceptance

The successful opt-in source-blind [#40251742132](https://github.com/gamesbyian/wallgen/actions/runs/40251742132) generated 22 current-renderer metadata-stripped native sources and four **each** source-blind original external pigments, low-chroma/neutral controls, and sparse-hue artworks (34 actual cases total) using the same reference Chromium production painter.

| Independently drawn source | Before best | After best | Visible outcome |
| --- | --- | --- | --- |
| Red diamond + orange hexagon, first two semantic hues | `regions` 0.029366398002 | **`hue-visible-shapes` 0.026219598416** | **10.716% less error**, corners and unequal outlines retained |
| Single red polygon | `shape` 0.026188961161 | same | Existing complete silhouette route preserved |
| Isolated blue polygon | none | none | Truthful refusal; no fake preceding pigments |
| Red + blue with skipped orange/yellow/green | none | none | Truthful refusal; no invented hue slots |

**No-regression controls:** all **22/22 genuine current-renderer R0** source/fit winning scores and types exactly unchanged, including Hairpin, Loop, displaced Jagged, five native first-hue circles, overlapping reverse-layer circles and holes/islands. All **4/4 original external shapes/circles** and **4/4 low-chroma/neutral** normal winning scores and kinds unchanged; all sparse except the intended two-polygon improvement unchanged. Comparing retained accepted baseline ZIP to the new optical artifact: **193 of 199 common files were byte-identical; 143 of 144 shared PNGs byte-identical**. The one changed PNG is precisely `external-sparse-hue/contiguous-red-orange.r0-best-preview.png`; other five differences are the evaluation JSON/HTML receipts, updated to record the candidate. All original PNG source bytes unchanged. Actual old circle, source and new polygon triplet directly opened and visually reviewed.

**Limitations:** 96×208 comparison is an optical preview, and its mixed RGB/foreground scoring metric is not a perceptual user study. Remaining source/render discrepancies include canonical palette vs arbitrary external RGB values, antialias, smaller contour and asymmetry errors; this does not recover the true source artist recipe. The independent 19.8MP reference/worker transport gate is separate; until its runner concludes this document makes no claim of physical-phone speed/heap/thermal, creator approval or Android TalkBack/IME. Expensive PR optical triggers are temporary and must be removed before merge. Native renderer six+ten budget, source file immutability and original coordinate/lock/Undo/worker pipeline ownership remain unchanged.

## Next actionable #557 work

Retain a faithful source-hue refusal for non-contiguous pigment slots; respect Agent 3's user-facing accessible explanation. Test genuinely new multi-fragment/partly invisible pigment occlusion only where the existing scene can encode a complete observed source; source-hidden painter precedence and lost geometry are not recoverable. Native Hairpin/Loop thin-gap/crossing residuals require independent source-backed matching changes, not a universal contour tolerance. Leave #557 open for software gaps and real owner/Pixel acceptance; leave typography to #653 and final integration to Agent 3 #664.
