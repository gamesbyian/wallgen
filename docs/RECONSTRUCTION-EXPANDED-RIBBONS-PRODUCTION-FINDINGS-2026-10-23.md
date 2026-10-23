# Expanded editable Draw ribbon recovery: actual-image acceptance (23 October 2026)

**Evidence class:** Four current ROYGBIV production-rendered PNGs at 480×1040, not mockups or hand-painted swatches. Source artwork, IDAT-identical metadata-free twins, separately retained canonical truth recipes, actual best-fit images and JSON measurements came from one-off [Chromium Actions run #39938419146](https://github.com/gamesbyian/wallgen/actions/runs/39938419146), [artifact `r0-expanded-draw-602`](https://github.com/gamesbyian/wallgen/actions/runs/39938419146/artifacts/12494494000). Inference and candidate ranking did not read the true recipe before selecting a fit. The PNG R0 generator verifies original saved recipe and image chunks. Artifact retention was configured for **two days**; rerun the existing production baseline/evaluator scripts for future comparisons. Images were downloaded and **visually reviewed side by side** at 96×208 preview scale. This is agent visual/quantitative evidence, not human-creator or Pixel 6 Pro sign-off.

## Actual results, with existing baseline preserved

| Actual source | Previous best error ↓ | Expanded-Draw trial best ↓ | Winner, genuine visual observation |
| --- | ---: | ---: | --- |
| 03 Wave | 0.2067888033 | **0.2067888033** | Existing curvature-safe Draw wins. Expanded Draw 0.2296836 is visibly more broadly painted, but worse ranked shape/position. **No Wave improvement claimed.** |
| 04 Jagged | 0.2636215985 | **0.2517287464** | **Expanded canonical Draw** wins. Restores seven separately legible, diagonal coloured ribbons in place of almost one hairline; visible alignment and full-width spacing remain imperfect. |
| 05 Hairpin | 0.1078667044 | **0.1078667044** | Existing #600 fitted canonical Hairpin retained, no regression. Expanded Draw is worse (0.2697277). |
| 06 Loop | 0.0538349595 | **0.0538349595** | Existing canonical Loop retained, no regression. Expanded Draw is worse (0.2630534). |

The **Jagged fit error improves ~4.5%**, a modest numeric but readily visible composition correction. Source **true-recipe render floor** on Jagged at 96×208 was 0.01070, so the inverse problem is not solved. No original seed, angle or exact input control values were recovered.

### Independent seven-hue coverage diagnostic

In the archived 96×208 source/best preview PNGs, independently segmented the largest connected component for each of the existing seven canonical hue targets (saturated RGB/HSV and max 30° circular hue distance). Fractions below are coloured pixels per entire preview frame, **not perceptual fidelity scores**:

| Artwork | Real source coloured area | Pre-change best fit | This trial selected fit |
| --- | ---: | ---: | ---: |
| Wave | 31.99% | 5.19% | **5.19%**, unchanged |
| Jagged | 42.46% | **0.64%** | **23.21%** |
| Hairpin | 36.90% | 36.96% | **36.96%**, unchanged |
| Loop | 28.42% | 30.90% | **30.90%**, unchanged |

The Jagged improvement is a roughly **36× expansion** of visible colour coverage versus the old collapsed result, while still achieving only ~55% of the original source area. Its median across-hue Y-centroid spacing in the preview rises **6.12px → 10.94px** versus the source **21.17px**; future work should improve hue separation and actual contour orientation rather than multiplying score weights or generating more unrelated Geometry presets.

## Shared-engine decision

[PR #602](https://github.com/gamesbyian/wallgen/pull/602) preserves current **conservative `geometrySafety:true` Draw** unchanged. In an imported multicolour image with source-derived Wave or Jagged curvature signal, it permits *one additional* otherwise identical canonical `geometry:'drawn',geometrySafety:false` **expanded ribbon alternative**, using the same extracted source path, normalizer and painter. This exposes a better-fitting choice without mutating the editor's manual Draw safety policy. Candidate selection explicitly reserves two existing Draw alternatives inside the **same six-render limit**. If `geometrySafety` is locked, the expanded option is excluded; lock-respecting preview/Undo/Save semantics remain common. No second scene model, no image-byte retention, no cloud model or old-v1 reconstruction.

The likely technical source of collapsed imports is that the standard drawn-path curvature safety cap `safeDrawnBandSpan` can force all seven offsets into a very narrow range on short/pixel-wiggly extracted paths. **The exact causal split between extractor path scale, curve radius and safety cap is still inferred**, not instrumentally measured at render time. The measured solution here is merely adding a second *candidate*, not changing the global safety algorithm.

## Acceptance limits and further work

This is **one genuine source per family**, not a broad representative gallery. No actual 3024×6552 exported preview, mobile perf, accessible touch acceptance, full-colour perception trial, arbitrary third-party artwork or physical Pixel/OLED viewing. Jagged remains materially narrower and less contour-accurate than the source; Wave is still severely collapsed. Continue #557 with source-derived full seven-hue spacing/width estimation and bounded true-render parameter fitting. The one-off artifact workflow was removed before integration; the ordinary **`npm run check:quick`** PR gate remains the only automatic check.
