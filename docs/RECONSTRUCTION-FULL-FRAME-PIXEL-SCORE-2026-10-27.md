# Complete 96×208 reconstruction source score: aliasing correction (27 October 2026)

**Owner:** [#557](https://github.com/gamesbyian/wallgen/issues/557). **Implementation:** [PR #801](https://github.com/gamesbyian/wallgen/pull/801). Scope is current source-vs-rendered pixel comparison, not a new scene, art model or original-recipe recovery.

## Witness and specific cause

The established `compareReconstructionPixels` loss combines 75% normalized mean channel distance plus 25% normalized max-channel/ink distance. Its loop previously advanced eight bytes per sample through an interleaved four-channel RGBA image. At the fixed fitting width of **96**, that meant sampling *even X pixel columns of every row only*. All odd X columns were ignored, and a source one-pixel black gap at odd X versus a completely filled output could score as **0.0** despite differing visible pixel content. Narrow negative-space bands in Hairpin/Loop are sensitive to such a blind spot.

A 96×208 source contains only **19,968 pixels**, so stepping by **four** bytes visits every RGB pixel without changing either loss weight, render resolution, source pixels or the **maximum 6 initial + 10 refinement actual forward paints**. No masks, second fit metric, renderer, private data or canonical setting is added. Focused unit tests exercise red pigments on odd/even columns, an odd-column missing black gap, horizontal/vertical stripe parity, symmetric errors, budget and identity.

## Actual current-renderer optical A/B

Using the *same* seven source PNGs generated once by `scripts/review-reconstruction.mjs`, a disposable GitHub Chromium workflow ran the actual production canonical candidate synthesis and painter twice: first with all-pixel sampling; then with the exact previous every-second-pixel scoring line restored **only in the temporary runner checkout**. Both preview PNG sets were decoded independently and compared using the *same full-pixel score*, plus existing per-hue ink/edge measurements. The output was retained in [actual A/B run #40434874103](https://github.com/gamesbyian/wallgen/actions/runs/40434874103/artifacts/12703755887). The first attempted A/B run failed only at the new report argument parser (`Array.map(resolve)` passed an extraneous index and array); the next attempt corrected it and succeeded. It did not require a production change.

| Actual independently source-rendered R0 control | Old fit kind | All-pixel fit kind | Exact fitted-pixel parity |
| --- | --- | --- | --- |
| 01 vertical | hue-visible-shapes | hue-visible-shapes | identical |
| 03 wave | hue-visible-shapes | hue-visible-shapes | identical |
| 04 jagged | hue-visible-shapes | hue-visible-shapes | identical |
| 05 Hairpin | hue-visible-shapes | hue-visible-shapes | identical |
| 06 Loop | hue-visible-shapes | hue-visible-shapes | identical |
| 11 scattered circles | regions | regions | identical |
| 16 displaced Jagged | hue-visible-shapes | hue-visible-shapes | identical |

All **7/7 source PNG pixel arrays are equal** across runs; **7/7 final fitted PNG pixel arrays equal**; no full-score gain/regression on these pre-existing candidates, no new missing pigments. No current R0 winner was changed by the correction; the old and full losses are *not directly comparable numerically* because they sample different columns. This is a real source-scoring **correctness improvement and safety check**, not evidence that actual Hairpin/Loop art has become visually closer on these seven examples. Other image families/external sources can be affected by the more complete score, and need independent witnessed art quality judgement before any such claim.

`scripts/reconstruction-scoring-aliasing-compare.mjs` remains as an **opt-in** reporting tool requiring disposable `pngjs@7`; its output `scoring-ab.json` and source/fit PNGs are part of the one-shot artifact. The two temporary `pull_request` browser workflows used to gather this evidence were removed **before merge**. Final normal PR CI must be verified on that clean head.

## Limits and next work

The score observes full-frame colour/brightness, **not** explicitly penalized topological holes or missing shade semantics. It still cannot infer invisible overlap precedence, invent absent semantic hues, or identify a unique source seed. Hairpin/Loop local channel geometry, low-chroma pigment refusal and mixed occlusion remain the meaningful #557 acceptance gaps. No actual owner-authored source, physical Pixel 6 Pro, human art signoff or independent material calibration was obtained in this experiment.
