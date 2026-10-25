# Source-visible reconstruction: eliminate the second HSV mask pass

**Issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557) • **PR:** [#714](https://github.com/gamesbyian/wallgen/pull/714) • **Genuine 22-image browser proof:** [GHA #40224875814](https://github.com/gamesbyian/wallgen/actions/runs/40224875814) • **Control run:** [#40222314108](https://github.com/gamesbyian/wallgen/actions/runs/40222314108).

## Concrete problem and fix

The regular `reconstructionCandidates` pipeline already calls `describeReconstructionImage`, which invokes the canonical `extractImageColourRegions` classifier with `includeRepeatShape:true` and internally constructs the exact seven source hue masks, primary components and palette evidence. When the eligible candidate is seven source-visible per-hue compound shapes, it subsequently called `observedHueShapeRecipe`, which classified **the same source image a second time** to rebuild the same seven binary hue masks.

The optimized pipeline instead requests `describeReconstructionImage(image,{includeColourMasks:true})`, passing those same seven temporary `Uint8Array` hue masks and measured background/coverage/region descriptors into `observedHueShapeRecipe`. Default standalone `describeReconstructionImage(image)` still returns **no mask property**, preserving the compact public descriptor; standalone `observedHueShapeRecipe` still supports its independently called analysis fallback.

This eliminates the duplicate **full-image HSV classification and initial descriptor pass** for the selected source-visible candidate path. It does **not** eliminate the per-hue contour flood-fill, hole detection, polygon simplification/validation or all other independent source geometry/edge extraction. Those operations are needed for separate editable pigment silhouettes. No mask arrays are embedded in any normalized recipe, PNG, UI, exported provenance, Undo record or persisted data.

## Safety and semantic invariants

- The initially gathered source masks belong to the single canonical importer, so there is no competing colour classifier, HSV rounding or palette inference. Reuses the recently merged conservative measured Jewel story, not a new colour model.
- The first descriptor's stamp-analysis threshold can be more permissive than the standalone recognizer's ordinary-pigment descriptor threshold. **The new shared-data path explicitly rechecks the original minimum meaningful primary-region area** `max(16,floor(width*height*.0008))`, seven indexed hue slots, source coverage, valid black/white background and seven correctly sized `Uint8Array` masks. Incomplete/aliased/spoofed sources refuse rather than becoming newly accepted hypotheses.
- Caller-visible current source pixel bytes remain unchanged. All seven embedded source-visible hue geometry, crop disclosure, component overflow 16+1 sentinel, holes/islands, snapshot size cap and same scene remain unchanged.
- Locks, source-blind inferred provenance, native worker/reference rendering, undo/redo, font/photo paths, output metadata and six initial + ten refinement `drawWallpaper` paints are untouched.
- Focused tests directly compare the full standalone-versus-shared `observedHueShapeRecipe` object, normalized editable geometry, palette and lock semantics; they check default no-leak behaviour and rejection of undersized, missing or malformed masks/regions.

## Exact real-art regression result

The source-blind [new genuine 22-image current renderer GHA #40224875814](https://github.com/gamesbyian/wallgen/actions/runs/40224875814) passed every fixed real PNG source case and product control. The [pre-optimization accepted baseline #40222314108](https://github.com/gamesbyian/wallgen/actions/runs/40222314108) was also read from its saved job log. **All 22 native winning candidate kinds and all 22 winning numeric errors matched exactly, not merely within a threshold. The 22 independent one-paint research proposal errors (including null/refused candidates) also matched exactly.**

Representative exact unchanged scores:

| Source | Native selected kind | Before and after RGB/brightness error |
| --- | --- | ---: |
| #02 diagonal straight | hue-visible-shapes | 0.015555869783811552 |
| #03 wave | hue-visible-shapes | 0.013651351967069089 |
| #05 Hairpin | hue-visible-shapes | 0.03053935316113644 |
| #06 Loop | hue-visible-shapes | 0.03725951718828642 |
| #16 displaced Jagged | hue-visible-shapes | 0.013308548579688537 |
| #19 Jewel vertical | hue-visible-shapes | 0.015307629462041908 |
| #18 compound holes/islands | shape-repeats | 0.005472186871543504 |
| #20 Pastel circles | regions | 0.00585024274132744 |
| #22 occluded reversed circles | regions | 0.004675716440422474 |

Both normal quick CI and the one-shot 22-art browser suite completed green. The workflow is returned to **manual-only** `workflow_dispatch` before merging so routine PR validation stays lean. Actual source/fit/oracle PNG exports were produced by the existing workflow, but since the exact renderer scores are bit-for-bit equal no novel visual-quality improvement is claimed from the refactor.

**Performance honesty:** Eliminating one classification and descriptor pass is a direct algorithmic reduction, **not a measured Pixel 6 Pro time, peak heap, thermal, energy or battery improvement**. A follow-up device/profiler test should separately measure cold/import latency and high-memory 7-hue complex Loop performance, without adding recurring heavyweight CI. The improvement should not be described as a double-speed-up: the shared importer's edge/region/contour steps and painter still dominate some inputs.

## Next remaining #557 tasks

- Complex genuinely **external** colour occlusion, noncongruent mixed opaque layering, source-visible pigment topology across antialias/crop boundaries and source-of-artwork semantics.
- Compact parametric reconstruction of the authored Loop is still not proven by an appearance-first portable pigment trace; preserve source-visibility uncertainty and keep the actual editable recipe trustworthy.
- Real portrait handset interaction/performance and owner creative acceptance remain explicitly outstanding; do not infer them from Linux GHA.
