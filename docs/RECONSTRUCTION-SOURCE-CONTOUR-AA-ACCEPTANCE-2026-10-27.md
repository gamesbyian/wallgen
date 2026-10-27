# Fractional source-hue contour calibration: accepted real-painter evidence (27 October 2026)

**Owner lane:** [#557](https://github.com/gamesbyian/wallgen/issues/557). **Implementation:** [#804](https://github.com/gamesbyian/wallgen/pull/804). **Status:** source-backed narrow implementation; no claim to recover hidden authorship, unseen contours, painter order or arbitrary external artwork.

## Reproduced defect, not an aesthetic guess

After the exact [all-pixel scoring correction #801](RECONSTRUCTION-FULL-FRAME-PIXEL-SCORE-2026-10-27.md), real 480×1040 current-renderer source art and reconstructed 96×208 PNGs were downloaded and visually inspected. For six seven-hue silhouette winners (Straight, Wave, Jagged, Hairpin, Loop, Offset Jagged), a thresholded **source foreground was a strict subset of inferred painted foreground**: 0 missing foreground pixel cells, with **832, 506, 578, 1,134, 1,381 and 489 extra cells** respectively; every excess cell lay within **one 96×208 pixel** of actual source ink. Hairpin/Loop colour bands had visibly narrower black channels around bends/crossings. The previously tested global shape radius multiplier [#803](RECONSTRUCTION-SOURCE-BAND-RADIUS-NEGATIVE-FINDINGS-2026-10-27.md) degraded source accuracy because it translated far-away boundaries and crop registration as well as widths.

The source-visible shape adapter obtains binary hue masks at the actual bounded importer image resolution (typically 277×600) and reconstructs each polygon from genuine pixel-cell borders. Repainting at the much smaller 96×208 inverse-evaluation resolution introduces a slight outer edge halo. This is a source-to-painter raster registration problem, **not** support for reconstructing the original procedural Hairpin/Loop parameters.

## Correction, canonical scope and refusal guards

- **Only the existing source-visible per-hue silhouette proposal** is eligible. `extractVisibleHueCompound` accepts a *new optional, default-zero* `insetPixels`, so standalone/manual source geometry extraction is unchanged. Actual reconstruction uses at most **0.2 source-analysis pixel** (proportionally smaller for inputs shorter than 600), never an arbitrary wallpaper setting, image filter or extra shape type.
- `shapeEdgeLoops` traces outer and hole rings with pigment on the **right**. A miter-capped subpixel move of each edge *toward visible ink* slightly contracts painted polygons while increasing source-visible negative-space holes. Vertices on genuine source-frame crop edges remain pinned. Existing `normalizeCompoundRegion` validates the exact canonical asset-local ring/holes/components; geometries that become invalid safely fall back to original outlines. Scene `radiusPixels` follows the modified maximum vertex radius, keeping the source-to-scene scale and centre consistent instead of repeating the rejected global scale adjustment.
- **Evidence gate:** measured **seven** contiguous hue slots on **black**, already-observed **nonradial** source signature from the single shared descriptor, no source-measured **dark Tone**, and sufficiently flat adjacent same-hue pigment interiors. The near-flat source check reuses the **already computed exact seven hue masks**, samples bounded pairs at stride two, and refuses contraction when enough interior pairs (>5% image pixels) exhibit strong local RGB variability (>45% pairs >2.5 mean RGB levels). A thin winding Draw with too few interior pairs is not falsely called a textile. No new palette classifier or uncertainty about invisible layers.
- Existing partial, skipped/noncontiguous semantic hue slots, white-background, rings, source-measured dark tones, textured/variegated pigment sources, native circles, output locks, Undo, provenance, source RGBA buffers, private font data, normal 6 initial + 10 refinement painter budget and direct/worker canonical scene ownership are **unchanged**. Source-visible contours remain editable portable JSON/PNG geometry snapshots, not stored source raster pieces.
- Conservative test assertions cover source-mask immutability, 7 hue slots, holes and detached islands, source-frame crop retention, opt-in bounds and no default importer drift, appearance lock projection, R0 candidates, and the two sources on which broad ungated optical edits were rejected.

## Actual source-blind production PNG A/B: all 22 R0

A one-shot Chromium workflow first generated **the same 22 source images once**, using the actual current forward renderer and metadata-free source files, duplicated source bytes to two directories, and ran the **same 6+10 true-painter candidate workflow twice** on each input: AA calibration enabled vs *only the inset constant disabled in the disposable runner*. Neither inverse reconstruction read original source recipe truth, and the independent PNG comparator used the **same full-pixel RGB+ink score** for both winners, with source PNGs compared byte-for-byte.

[Full 22 real-painter A/B CI #40440144304](https://github.com/gamesbyian/wallgen/actions/runs/40440144304), [original source/fitted PNG and numeric report artifact #12705373173](https://github.com/gamesbyian/wallgen/actions/runs/40440144304/artifacts/12705373173): **22/22 sources pixel-identical; 9 better fitted results, 13 pixel-identical, 0 worse.** Notable confirmed improvements:

| Current-renderer source | Prior full-frame score | With bounded source edge inset | Relative score decrease |
| --- | ---: | ---: | ---: |
| 01 straight vertical | .0242889113 | **.0236547103** | 2.61% |
| 02 diagonal straight | .0156903006 | **.0150761807** | 3.91% |
| 03 Wave | .0136937728 | **.0127490259** | 6.90% |
| 04 Jagged | .0186031965 | **.0176024286** | 5.38% |
| 05 Hairpin | .0289360526 | **.0272736378** | 5.74% |
| 06 Loop | .0367312209 | **.0362916942** | 1.20% |
| 07 winding Draw | .0236090000 | **.0225984124** | 4.28% |
| 16 displaced Jagged | .0133037370 | **.0117051989** | 12.02% |
| 19 Jewel vertical | .0193838573 | **.0190145409** | 1.91% |

**13 other R0 controls are pixel-identical**, including native circles, ring/ray layouts, nested, partial five hues, reversed-layer overlap, and crucially #12 textured/embroidered source and #15 offset concentric rings. An initial unguarded pass had regressed precisely those two (#12 .022539→.023788 and #15 .049473→.050303). Reusing the existing source radial classification and measured interior colour-variation signal prevented those regressions without disabling the nine actual wins. This is validated on current-renderer art, *not* independent source art or human visual judgement by itself.

## Actual separate-source acceptance: 16 independently authored graphics

The repo's existing **standalone Canvas2D source generator**, not the ROYGBIV painter, authored four test graphics in each of the *original*, *low-chroma*, *sparse-hue* and *gapped-hue* collections. There is **no possible original ROYGBIV source recipe** for these pixels. Every source was duplicated unchanged before the actual inverse painter generated and ranked canonical recipes with/without the optional inset.

[Independent-source Chromium run #40440610399](https://github.com/gamesbyian/wallgen/actions/runs/40440610399), [source, fitted PNG and reports artifact #12704984216](https://github.com/gamesbyian/wallgen/actions/runs/40440610399/artifacts/12704984216): **16 unchanged sources, 3 improved output PNGs, 13 unchanged, 0 worsened**. Actual seven-hue polygons **.03578255→.03527654**, six-point concave stars **.03547264→.03488002**, mixed partly occluded polygons **.03755180→.03742984**; native-circle control pixel-identical. Dark-seven source **.02280035** unchanged after using already-measured Dark Tone gate. Soft/neutral source and noncontiguous missing-hue examples correctly continue refusing unsupported automatic colour recipes; representable contiguous first-N samples retain previous results. PNG source/old/new/residual plates were directly opened and visually reviewed.

A prior external A/B initially failed on one dark-pigment regression because the source-measured dark Tone had not yet been included in the small AA permission gate; its final run passed all 16 after adding that gate. Earlier synthetic tests required a source with sufficient interior pixel pairs for the textured-evidence detector; the fixture was corrected from small disjoint islands to broad visibly variegated hue bands, and source-vs-shared radial inference expectations were aligned. No production scene rewrites were justified by those test errors.

## Release limits and next iteration

The 96×208 loss is still an RGB+brightness comparator rather than human perceptual similarity. This improvement reduces the currently re-rendered sampled polygon edge halo; it does **not** recover hidden overlap precedence, entirely missing semantic hues, independent original Hairpin/Loop generation settings, low-saturation source materials, or complex multilayer occlusion truth. Normal 3024×6552 reference/worker rendering uses the existing canonical geometry. This evidence is **not a physical Pixel 6 Pro, TalkBack, Android IME, human creator rating or authenticated remote creative approval**. The source-reconstruction owner issue #557 stays OPEN. Source-specific hard occlusions and artist-authored/owner assets remain next priority.

All heavyweight browser workflows used solely for obtaining these independent measurements are removed before merging the implementation. Normal `npm run check:quick` remains the only automatic PR check on the final head; self-contained manual research scripts can reproduce comparisons later without imposing CI cost.
