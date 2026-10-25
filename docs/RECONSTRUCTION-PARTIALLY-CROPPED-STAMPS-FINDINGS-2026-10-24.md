# Genuine displaced Jagged reconstruction via partially observed hue stamps (24 October 2026)

**Scope:** Agent 1 [#557](https://github.com/gamesbyian/wallgen/issues/557), focused [PR #676](https://github.com/gamesbyian/wallgen/pull/676). This extends the **existing shared hue-mask and imported compound-shape primitives**, without a new renderer, scene-object dialect or source-original-seed claim.

## Original current-renderer image diagnosis

Use original R0 **#16 displaced Jagged** 480×1040 production-source PNG from [run #40140340944](https://github.com/gamesbyian/wallgen/actions/runs/40140340944), with separate true recipe and byte-preserving metadata-free twin. Blindly inferred candidates consume **only** actual artwork pixels. The established #666 physically cropped ribbon seed improved it to **.208730439291**, but left black channels bunched and the last hue endings misplaced.

A direct source mask rigid-registration study at the existing 96×208 fit frame established:

| Adjacent source hues | Best pigment translation | Visible Jaccard overlap |
| --- | --- | ---: |
| Red → Orange | 0 px X, +22 px Y | .878 |
| Orange → Yellow | 0 px X, +22 px Y | .884 |
| Yellow → Green | 0 px X, +22 px Y | .890 |
| Green → Blue | +11 px X, +11 px Y | .692 |
| Blue → Indigo | +11 px X, +11 px Y | .691 |
| Indigo → Violet | +11 px X, +11 px Y | .535 |

The first four long hue masks have almost identical exposed geometry. The remaining three are progressively **cropped by the same right-frame edge**, which biases their visible area and centroids. Requiring seven full congruent masks previously rejected all of the shape-repetition structure, even though the existing canonical imported-stamp scene can approximate it without new types.

## Small, guarded implementation

The existing `repeatedHueStampShape` now accepts *only* a very specific alternative when complete sevenfold congruence is absent: **one connected component per hue; four full frame-width, strongly aligned leading masks; three real, progressively smaller right-edge-visible tails with monotonically retreating left bounds**; each tail has at least 10% of reference-area evidence. Require **≥.82 translated-mask Jaccard overlap** among the four intact shapes (stricter than ordinary complete-seven .76), plus the existing physically measured coherent seven-ribbon source-gap/width descriptor. Noncongruent head geometry, unordered cropping, missing colours, and unrelated opaque blobs are refused.

The shared compound contour of the intact reference becomes **one portable canonical imported shape**, instantiated as seven independently positionable/resizable existing scattered objects. Last three current shapes scale with *visible* pigment area only. This is an **appearance approximation**; missing original unclipped silhouette data and the original procedural Jagged seed remain **unknown**. The candidate UI uncertainty explicitly says so.

The existing diagonal six-candidate allocation reserves one slot for this stronger source-supported stamp instead of a redundant straight-angle hypothesis. It **retains** two alternative diagonal angles, one genuine procedural Jagged and safe/expanded source Draw. No additional real paint calls. The canonical scene, geometric snapshot validator, normalized locks, source preservation, provenance, worker/headless/export and Undo paths are reused unchanged.

## Real current-renderer image results and direct visual review

At 96×208, with the SAME `drawWallpaper` renderer and original metadata-free source:

| Actual current source | Previous accepted best error | New candidate best | Difference |
| --- | ---: | ---: | --- |
| **#16 cropped displaced Jagged** | **.208730439291** | **.058721503425** | **71.87% reduction** |
| #04 normal Jagged | .058758032460 | .058758032460 | unchanged |
| #02 diagonal straight | .085834786639 | .085834786639 | unchanged |
| #03 Wave | .017332437783 | .017332437783 | unchanged |
| #01 vertical straight | .028885137789 | .028885137789 | unchanged |

The #16 presentation/reference truth-render floor for this R0 source is .01442435348, **not** proof of original recipe recovery. The new candidate is seven canonical editable imported stamps, not the original unknown Jagged recipe. It wins after the **same six** initial real paints and requires **no** refinement paints. New scene resolves seven source-colour objects; current transport retains one self-contained 230-vertex compound silhouette snapshot and seven normal overrides.

The 480×1040 source / prior Jagged fitted image / new 480×1040 actual-stamp painter output were **opened and visually inspected side-by-side**, not accepted only by metric. Seven separate black channels, colour order, and last three cropped endings are appreciably closer. Angular microdetails, exact hidden crop geometry, source seed and some edge joins remain approximate. Independent SVG-authored ribbons, full handset acceptance and arbitrary mixed independent objects are **not** proven.

## Engineering guardrails and remaining work

- Synthetic/Node tests: seven slots, shared geometry snapshot, exact serialize/deserialize, current scene, raw source-image immutability, canonical structure locks, ≤6 initial candidate count, and refusal of absent/unordered/unrelated pigment evidence.
- One importer hue-mask pass, one existing portable contour trace when strongly supported; no new pigment segmentation dialect, no arbitrary unknown hidden colour objects, no extra forward-painter budget and no permanent screenshot jobs.
- This result does **not** prove heterogeneous mixed objects, arbitrary transparency/occlusion, genuine Photo or material inference, exact historic recipe/seed, or human/Pixel 6 Pro approval. Keep [#557](https://github.com/gamesbyian/wallgen/issues/557) open for those demonstrable cases and remaining Hairpin ribbon gaps / Loop crossing fidelity.
