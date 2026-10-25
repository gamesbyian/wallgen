# Dark, low-chroma, neutral and incomplete external pigment: real optical acceptance

**Issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557) • **Dedicated source fixture + narrow tests:** [PR #725](https://github.com/gamesbyian/wallgen/pull/725) • **Actual Chromium oracle:** [run #40245853634](https://github.com/gamesbyian/wallgen/actions/runs/40245853634).

## Four authentic, independently drawn source cases, no claim of original recipe

The existing `scripts/review-reconstruction-external-pigments.mjs` adds `--collection low-chroma` as a **separate** fixed four-image set. The default existing original four-image set does not change. Standalone Canvas2D paints 480×1040 original RGB PNGs, not current ROYGBIV wallpaper renders. The strict `roygbiv-reconstruction-external/v1` manifest explicitly **contains no seed/source recipe**, all originals are metadata-free and verified to have no embedded ROYGBIV recipe. User source files are never edited. The four source designs are: seven extremely dark hue-distinct polygons (HSL 88% saturation, 13% lightness); seven pastel low-chroma notched stars (HSL 23% saturation, 70% lightness); seven grey polygons with no hue; and **only two** bright separated red and blue polygons. Grey and two-hue are deliberate adversarial *no-invention* controls.

## Actual renderer response

The first one-shot Chromium run has completed successfully. The evaluator invokes the existing seven-hue image analysis and the **real current `drawWallpaper` forward renderer** within normal ≤6 initial + ≤10 refinement paints. `--source-signature` shares only opt-in already-owned image descriptors. The existing seven-visible-silhouette one-paint comparator is **research-only** and never enters normal ranking. Actual 96×208 source, best and optional observed PNGs were saved and independently opened in a matched image review sheet.

| Source artwork | Confident source hue slots | Normal chosen kind / error | Separate existing seven-shape hypothesis |
| --- | ---: | --- | --- |
| Dim seven polygons | 7, source coverage .1430084 | `path` / .0456250589 | .0932387899, **worse** |
| Soft pastel stars | 0, coverage 0 | `shape` / .0657448977 | Refuses, no seven masks |
| Neutral grey seven shapes | 0, coverage 0 | `shape` / .0773634875 | Refuses, no hue proof |
| Two distant red/blue shapes | 2, coverage .0410349 | `shape` / .0357548548 | Refuses, five hues absent |

**Important visual observation:** The dim seven-source art paints near-black polygons. The per-hue *geometry* research version paints seven over-bright rainbow polygons, so its larger numerical error is not surprising. The selected normal path happens to have a lower score but visibly omits much source geometry. The soft-star one-shape approximation recolours every pastel star red. The neutral one-shape approximation paints grey shapes red. The two-hue one-shape approximation paints red and blue source polygons red. Those geometries are still portable/editable; their *pigment identity and fidelity are not established*. A global mostly-black frame favours sparse false output under the existing colour+mask scoring metric. Do not misread a modest low-contrast error as optical acceptance.

The original generic shape adapter explicitly discloses that its chosen pigment remains the *first ROYGBIV colour* rather than the source's authentic pigment. It remains a valuable manual editability/geometry route, but its current output should not be presented as a faithfully colour-recovered recipe. A follow-up source-backed candidate guard can refuse lossy conversion for **multiple detected hue slots** while retaining a genuine single-shape import and the editor's deliberate user colour edits. A separate, properly scoped colour-parameter or foreground-aware scoring improvement needs independent current-renderer and real device checks, not threshold tuning by guess.

## Non-regression controls and limits

The tests require that **neutral grey cannot synthesize canonical hue masks** and **exactly two independent hue sources never qualify as seven editable source-visible pigment shapes**. A generic silhouette extractor still supports arbitrary outlines even when their pigment isn't representable; never conflate outline inference with colour inference. The original source PNGs and bounded masks must remain unmutated. No new production classifier, colour story, renderer, source original reconstruction claim, extra painter or phone acceptance is introduced by #725. Its temporary heavyweight PR event was removed after the one-shot proof, with optional manual `include_low_chroma` retained under the lean CI policy.
