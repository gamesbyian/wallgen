# Source-state isolation for independent image reconstruction

**Owner:** Agent 1, issue [#557](https://github.com/gamesbyian/wallgen/issues/557). **Patch:** [PR #728](https://github.com/gamesbyian/wallgen/pull/728). **Optical acceptance:** [run #40249789436](https://github.com/gamesbyian/wallgen/actions/runs/40249789436). **Untouched native/sparse control:** [run #40249553344](https://github.com/gamesbyian/wallgen/actions/runs/40249553344). Baseline: accepted [#726 run #40247842572](https://github.com/gamesbyian/wallgen/actions/runs/40247842572).

## Observed source-to-scene defect

An anonymous imported PNG supplies source-visible hue masks, pigment shapes and approximate palette evidence. The original existing editor recipe is **not source evidence**. Before #728, `strippedCandidateBase` reset Photo, camera and material but left `reverseStripes`, `scatteredShapeOverrides` and `scatteredLayerOrder` from a previous wallpaper. Therefore an unrelated maker reversal could paint observed red as violet; a stale per-hue stamp could replace extracted contours; previous layer order could contradict visible source geometry. The direct `observedHueShapeRecipe` helper bypassed the baseline and likewise inherited reversal and layer order.

The focused patch resets precisely those state fields for independent inference. Source-observed paint precedence, such as canonical `regions`' measured exposed-circle ordering, can still be **intentionally inferred** from the new source. Creator locks still project through `respectSettingLocks`: a locked reversal makes source-assigned shape/region candidates uncommittable and thus refused rather than previewing an impossible edit. A locked old per-slot stamp likewise blocks new generic source-stamp geometry. No stored artist provenance or historical seed is inferred.

## True-painter source-state results

The deliberately **opt-in** `--source-state-probe` in the ordinary R0 evaluator reconstructs each anonymous image from both (1) clean editor state and (2) unrelated `reverseStripes:true`, reversed layer order and, where supported, an unrelated prior imported shape. Actual `drawWallpaper` 96x208 PNGs are compared **pixel by pixel**; a third separately painted counterfactual shows the old inherited-state outcome. These three research paints per selected case are **not part of normal UI fitting**, which remains bounded at up to six initial + ten refinement renders. The independent imported original PNG is never altered. Counterfactual paint is intentionally constructed to expose the before-behaviour; it does **not** purport to be a pre-PR black-box run or the source author's true scene.

| Source-blind case | Observed canonical candidate | Clean/polluted real-painter error | Old-state counterfactual error | Clean = polluted pixels |
| --- | --- | ---: | ---: | --- |
| Native #22 reversed overlapping circles | `regions` | 0.004675716440 | 0.075481063820 | Exact |
| Independent single-red polygon | `regions` | 0.027675064417 | 0.032982576043 | Exact |
| Independent seven mixed-occlusion polygons/stars | `hue-visible-shapes` | 0.037246751665 | 0.152921929990 | Exact |

Real PNGs of all three sources, clean reconstructions, polluted-state reconstructions and old-inheritance counterfactuals were opened and visually inspected. In #22, prior reversal flips the correct red-to-violet stack; in mixed occlusion, the old per-slot shape combined with colour reversal badly misrepresents the seven independent source polygons. Corrected source-state views retain the same geometry, seven pigment identities and original normal-painter ranking.

**Independent artifact parity:** Comparing retained ZIPs from the accepted #726 optical run and the qualified #728 source-state optical run gives **all 132 comparable actual PNGs byte-identical**. The three differing shared `evaluation.json` files contain the opt-in source-state probe receipt; their native/art outcome fields remain unchanged. All 22 native R0, four independent original polygons/stars/occlusion and four independent sparse-hue examples retain identical normal winner kinds and real-painter errors. The separate earlier acceptance #40249553344 had **160/160 shared artifact files byte-identical**, including original previews. No normal source-painter regression, no new scene/renderer branch and no change to embedded geometry payload were introduced.

The heavy source/fit Chromium workflow was restored to **manual-only** after acceptance; the R0 evaluator's state probe is likewise absent unless explicitly requested. Normal lean CI covers lock and geometry parity, source bytes, exact JSON recipe roundtrip, bounded candidate output and direct source-visible shape contract.

## Representability assessment and limits

The current canonical scattered scene correctly renders seven independently editable source-visible per-hue silhouettes with detached islands and holes, and existing circular instances can use evidenced `scatteredLayerOrder` without fabricating invisible objects. The mixed-occlusion example is **scene-representable at the visible-pigment level**; what remains uncertain is the actual hidden source paint precedence, unrecoverable occluded contours, precise anti-alias/colour appearance and source-author procedure. For complex Loop/Hairpin artwork, missing black-channel precision is directly visible in the native source/fit review; simple global contour-tolerance and width heuristics have contradicted independent holdouts and must not be revived without measured optical acceptance. The known sparse red+blue/noncontiguous hue cases and grey/low-chroma pigments remain outside faithful current colour-slot expressiveness. #726's refusal and geometry-only disclosure remain correct; Agent 3 separately owns accessible user-facing refusal feedback.

This proof is real Chromium/Linux painter evidence, **not** source artist approval, Pixel 6 Pro performance, native IME/TalkBack, physical touch, memory/thermal acceptance or recovery of source-invisible artwork. Keep #557 open for independent harder pigment/topology cases and source-visible Hairpin/Loop fidelity. Typography #653 and mobile/final integration #664 are separate owners.
