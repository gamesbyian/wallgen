# Current-renderer source-visible hue reconstruction: full R0 proof

**Issue** [#557](https://github.com/gamesbyian/wallgen/issues/557) • **PR** [#710](https://github.com/gamesbyian/wallgen/pull/710) • **Baseline research GHA** [#40219197445](https://github.com/gamesbyian/wallgen/actions/runs/40219197445) • **R0 full corpus smoke** [#40219688650](https://github.com/gamesbyian/wallgen/actions/runs/40219688650)

## What actually changed

The importer already computes ROYGBIV's seven binary hue masks, connected components, visible boundary rings and exact source-preserved geometry. PR #709 established a portable canonical different-silhouette-per-hue scattered scene. This implementation joins them without another colour segmenter or painter:

- `extractVisibleHueCompound` walks existing `components` and `shapeEdgeLoops` on each source hue, validates holes/isolated islands through `normalizeCompoundRegion`, and records a **source-visible only** centre, radius, crop-contact signal and component count. Missing, invalid, self-crossing or excessively complicated shapes refuse.
- `observedHueShapeRecipe` maps those seven distinct silhouettes into ordinary `scatteredShapeOverrides` at image-derived locations and radius, with self-contained portable snapshots. Enforces seven actual pigments, recipe byte/point caps and Apply-compatible lock projection. Removes inherited Photo, private texture/camera, prior material and motif. No hidden original seed or pixel bitmap stored.
- The **normal image-to-recipe chooser** can now offer this as one of **at most six already-budgeted real-painter candidates**. It replaces one redundant low-priority procedural trial only for nonradial seven-pigment source-supported shapes, preserving radial/circle/partial-colour and repeated-compound hypotheses; genuine diagonal source retains its established three measured angle variants, Jagged and safe Draw.
- The existing `rankReconstructionCandidates` and its cooperative version still use only the real `drawWallpaper` renderer; no additional budget for default reconstruction. Existing ≤10 refinement searches, cancellation, Undo, provenance, export, source bytes and recipe ownership stay canonical. Added distinct `hue-visible-shapes` provenance kind in PNG.
- Optional `--hue-visible-shapes` in the genuine R0 evaluator independently measures source-to-preview improvement with one **separate research-only** paint and produces the actual proposed full recipe, PNG, crop disclosure, and direct comparison gallery. Research paints never affect normal ranking.

## Genuine R0 baseline with source-true optical evidence

[First five-case Chromium run #40219197445](https://github.com/gamesbyian/wallgen/actions/runs/40219197445) passed seven focused/normal canonical tests and produced source, existing best and seven-hue fitted PNGs from true renderer-authored, metadata-free R0 sources:

| Genuine source | Previous canonical best | Seven per-hue visible geometry, research-only | Improvement vs previous |
| --- | ---: | ---: | ---: |
| Hairpin #05 | .08447790975 | .03054387019 | 63.84% |
| Loop #06 | .04977316648 | .03783583145 | 23.98% |
| Displaced Jagged #16 | .05872150343 | .01328233016 | 77.38% |
| Repeated compound hole/island #18 | .00547218687 | **refused**, no invented geometry | Original shape-repeats retained |
| Reversed overlapping circles #22 | .00467571644 | .00567123083 (**worse**) | Original editable circles must win |

All image triplets were downloaded and **directly inspected at equal scale**. Hairpin's seven distinct narrow channels, rounded U-return and rising exit match source visibly far better. Loop's seven coloured rings and stem align more closely, but some segmented fragments remain at the ring crossing. Jagged preserves the visible displaced/cropped pigment tails and fine edgy wave geometry much more accurately; cannot extrapolate missing off-frame contours. This is assistant optical evaluation of genuine GHA artefacts, **not** Pixel device or owner approval. Note source Loop coloured channels can contain 8 source-visible connected patches per hue due to aliased intersections; `components` is bounded to 8 so confidence in the *entire* hidden topology is unwarranted.

Native full-size **3024×6552 source-inferred Hairpin and Loop PNGs** were produced by ordinary headless production renderer, and embedded portable recipes verified; not a new image overlay, pixel-only restoration or historically authentic source control recovery.

## Product integration acceptance and caveats

The initial six-candidate integration exposed an actual protected diagonal regression: one of three proven source axis-angle hypotheses was displaced. Quick test `tests/image-reconstruction.test.js` caught it. The final selection policy retains all three angles and Jagged/Draw, and trades one lesser Draw alternative only when a bounded independent visible geometry candidate is truly supported. Do not remove this test or widen painter budget.

Full **22** R0 source corpus is the authoritative final gate. Reject integration unless *all* 22 genuine samples are evaluated through actual browser forward painting, major Hairpin/Loop/Jagged gains reproduce and existing editable circles/islands and radial cases keep their established scores. Source truth sidecars are loaded only after candidate selection for the separate known floor, not for inverse inference. Inspect all original/current/proposed PNGs, log source crop/fragment notices and keep manual-only Chromium GHA rather than default heavy PR CI. No unattended Pixel 6 Pro, TalkBack, IME or human creative acceptance can be claimed.

## Next independent fidelity tasks

Per-hue appearance should not pretend to recover procedural Loop control values. Next source-supported refinement: morphological persistence/connected-fragment suppression around Loop's rings, avoiding antialiased source patches being falsely called independent pigment objects; retain all genuine islands and holes without exceeding bounded vertex/recipe size. Explore source-derived per-pigment edge refinement in the **same** canonical shape model, with real painter check; do not add extra renders or automatic hidden painter-order inference.

[Parent algorithm plan](RECONSTRUCTION-VISION-ALGORITHM-REUSE-AND-TEST-PLAN-2026-10-24.md) • [Current queue](CURRENT-WORK-QUEUE-2026-10-24.md) • [Per-hue scene acceptance](RECONSTRUCTION-PER-HUE-CANONICAL-SHAPE-ACCEPTANCE-2026-10-25.md)
