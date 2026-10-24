# Reconstruction #557: clipped Jagged real-render evidence (24 October 2026)

**Status: bounded improvement, not completion.** Focused [PR #666](https://github.com/gamesbyian/wallgen/pull/666) proposes a strict fallback for *four long, unoccluded leading pigment ribbons plus three progressively same-side-clipped ribbons*. Other reconstruction families, renderer, mobile flows and typography are outside this change.

## What the genuine source revealed

The R0 #16 image was created at **480 × 1040 by the current canonical headless production painter**, metadata stripped without changing its PNG IDAT pixel payload, and inverted blind to its separate actual-recipe sidecar. Four first ROYGBIV colours span almost the entire analysis width. Blue, indigo and violet become progressively truncated at the **same frame side**. Their **minor-axis standard deviations remain nearly equal** and all seven source principal axes agree within about 1.3°, even though the truncated violet region alone falls below the existing seven-full-ribbon axis-ratio acceptance gate.

At the established **277 × 600 analysis size**, the existing seven-region measurement was null. The new strict cropped-family fallback uses **only the four full spans to estimate gap/thickness**, while requiring all three cropped tails to corroborate direction, order and consistent pigment width. It measured source centre gap **44.678 px** and ink thickness **28.390 px**. The existing canonical inverse equations consequently seed the editable procedural Jagged candidate at `spread:50, stripeWidth:53`, rather than the previous unconditional `55, 65`. Sources with a missing hue, opposite-side clipping, inconsistent ink widths, nonparallel axes or a nonprogressive crop sequence are refused. Fully visible seven-ribbon inference still takes precedence.

A preceding branch experiment attempted a guarded large coupled XY shift. Despite **passing synthetic tests**, it changed **zero genuine-current-image error** on all four cases. That code and its synthetic-only claim were **discarded**, not merged or layered into the accepted method. The new method reuses the existing RGB hue-region descriptors, canonical candidate renderer, one existing ten-paint refinement budget, the original locks, provenance and cancellation, without a second rasterizer or imported source history.

## Identical-PNG production evaluation

Source/control/experiment artifacts in [one-shot production run #40140340944](https://github.com/gamesbyian/wallgen/actions/runs/40140340944), `reconstruction-557-jagged-paired-current-renderer`. Ordinary [quick CI #40140344790](https://github.com/gamesbyian/wallgen/actions/runs/40140344790) passed. The genuine production source/fitted **PNG images were downloaded and visually opened** in source / former-fit / new-fit comparison, rather than relying on tests or numerical score alone.

| Current renderer case | Control error | Clipped-band error | Change |
| --- | ---: | ---: | ---: |
| #04 Jagged | .05875803246 | .05875803246 | 0 |
| #05 Hairpin | .10786670437 | .10786670437 | 0 |
| #06 Loop | .05383495946 | .05383495946 | 0 |
| **#16 displaced Jagged** | **.22214612007** | **.20873043929** | **−.01341568078 (about 6.04% less)** |

The current source PNG's metadata-free SHA-256 for #16 is `19d5b10fb1a52ff026626ce4e3533308e3635a01836329e710d2825085be81dd`. Other exact sources: #04 `e78039a07794c957543d565bb47eb3e48994a90c8bc1234fb6bed0ba9ea56e69`; #05 `07191250e83819230c3bb51a20e7bd451e7665f22391cdaac8f4f4be92589a10`; #06 `e058aeac099c47f5a9f19cc3e576763b3317da85f171d375955eeddf0dbadc52`.

**Additional blinded-fit diagnostic, [run #40140825969](https://github.com/gamesbyian/wallgen/actions/runs/40140825969):** The newly measured Jagged coarse candidate initially scores **.32816800999** with canonical `spread:50, stripeWidth:53`. Its existing fine-shift probe estimates **+6.3% X and +2.9% Y** and the ten-render greedy fit ultimately chooses **`positionX:5.3, positionY:3.4, spread:35, stripeWidth:53`** at **.20873043929**. The former method instead chose `positionX:20, positionY:0, spread:40, stripeWidth:55` at .22214612007. These are inferred candidate parameters, **not** source truth. A separate direct hue-region diagnosis at 96 × 208 measured **15.499 px source perpendicular hue gap against 10.789 px on the accepted fitted paint**, while #04 source/fit gap is 15.745/15.832 px. Thus the greedy pixel objective still rewards shrinking a physically justified stripe separation to compensate for clipped-end/seed-phase mismatch. This is a concrete, testable remaining failure for the next constrained shared-renderer refinement experiment, not a request for more unfocused renderer trials.

**Visible result:** the new fit is a slightly better spatial match but remains conspicuously too crowded: source ribbons show independent broad black negative-space channels and displaced/cropped lower endpoints; inferred output still closes many gaps and paints the lower stripes too broadly. The metric improvement does **not** warrant calling #16 solved, source-exact or visually approved. Source truth-render scale/presentation error floor for #16 is .01442435348, not a claim of accessible original seed.

## Live remaining gates and non-goals

1. **Jagged #16**: discriminate pigment-to-pigment negative-space drift and clipped endpoint/phase from actual before/after renderer hue footprints; avoid greedy spread collapse or unguided 2D shifts. Keep a single ≤10 canonical refinement paint budget and compare *actual rendered previews*.
2. **Hairpin #05**: prior [#648 negative experiment](RECONSTRUCTION-HAIRPIN-GENUINE-NEGATIVE-FINDINGS-2026-10-23.md) showed four solo radius/angle/width attempts getting *worse*. Needs coupled visible turn/exit topology evidence, not unbounded trial fitting.
3. **Loop #06**: retains recognizable topology but gaps and crossings differ; require visually discriminating current-painter evidence before changing.
4. Mixed partial pigment holes, occlusion and noncanonical material/Photo input remain **unsupported or ambiguous**, unless current canonical scene + actual input evidence supports a bounded construction. Do not invent missing hidden colours or original paint order.
5. No external owner/licensed artwork acceptance, human creative judgement, physical Pixel memory, touch, TalkBack or IME proof occurred. Those are different acceptance owners.

There was **no** approval to recreate deprecated scene models, alter typography or mobile UX, claim historical art identity, exceed six first-pass painter candidates or spend more than ten refinement paints on one canonical candidate.
