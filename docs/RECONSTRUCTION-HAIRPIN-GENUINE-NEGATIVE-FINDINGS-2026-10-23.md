# Hairpin reconstruction: genuine PNG negative trials (23 October 2026)

**Scope:** Agent 1 issue #557, closed-unmerged [PR #648](https://github.com/gamesbyian/wallgen/pull/648), four attempted changes to canonical Hairpin inverse fitting, all rejected after production-source versus production-reconstruction comparison. No code from #648 is on `main`. The one-off Chromium workflow was removed before closing; the sole regular quick CI remains intact.

## Source-first visible failure

Authentic current-renderer R0 #05: 480×1040 source, metadata-free IDAT-identical copy and separately held true recipe, inverted without feeding the truth into candidate construction. Actual `drawWallpaper` 96×208 source and fitted PNGs downloaded, arranged in source/old/new comparison, and **visually inspected**.

- Source has **seven 22–23 px-wide upper-leg coloured ribbons** with narrow black gaps (measured at 14%, 24%, 34% of source height) and a relatively **tight U with a steep up-right outgoing leg**.
- Baseline selected canonical Hairpin, error **0.10786670437**, truth-render presentation floor **0.02305374874**. Recovered version loses the dark gaps, rounds the bottom bend, and turns out more shallowly than source. Original source recipe after the blinded evaluation had `turnRadius:42`, `hairpinAngle:135`, `spread:38`, `stripeWidth:52`; those are ground truth *only* for the R0 engineered source, never for arbitrary imported art.
- All experiments retained **six coarse renders and exactly ten refinement paints**, canonical locks/Undo/transport, genuine renderer and source bytes.

| Focused experimental alternative | Genuine current-renderer best image error | Verdict |
| --- | ---: | --- |
| Existing untouched `main` fit | **0.10786670437** | Best retained result |
| Substitute StripeWidth for Spread refinement probes ([run #40047144852](https://github.com/gamesbyian/wallgen/actions/runs/40047144852)) | 0.11016626603 | Reject |
| Substitute StripeWidth for Position X refinement probes (run #40047284451; output in job logs, run cancelled after subsequent push) | 0.18047807865 | Reject |
| Measure upper-leg stripe width from shared hue masks; seed width **53%** versus held-out **52%**, retain all ten former refinement controls ([run #40047579185](https://github.com/gamesbyian/wallgen/actions/runs/40047579185)) | 0.12062525531 | Reject despite accurate physical stripe-width inversion |
| Replace radius ±15 / angle ±25 / spread ±10 by finer ±12 / ±15 / ±6 respectively, same ten fields ([run #40047783747](https://github.com/gamesbyian/wallgen/actions/runs/40047783747)) | 0.10957964115 | Reject |

Real control sources remained unchanged throughout: Jagged #04 **0.05875803246**, Loop #06 **0.05383495946**, Jewel vertical #19 **0.02528594771**. The last #648 quick check was green, but **tests passing did not imply visual improvement**, and the branch was intentionally closed unmerged.

## Engineering discriminator and next source-backed action

Adjusting individual width, overall spacing or narrower one-dimensional turn steps cannot solve the observed joint bend/exit-path misregistration under the current first-candidate initialization and greedy ten-render assignment. Accurate measured width itself is insufficient, demonstrating an optical **turn topology/placement** limitation. Future work should derive shared corner/turn descriptors from existing source contours and canonical sampled path semantics, or compare a bounded coupled radius/angle proposal against the genuine image, *then* commit only if actual source-fit PNG shows a lower error **and** a visibly closer lower bend. Do not add speculative painter calls, independent geometry dialect, second renderer or repeated blind trials.

The separate displaced Jagged #16 remains **0.22214612007**, exhibiting changing black negative space, partly cropped/end-terminated independent ribbons, and no sufficiently coherent rigid shift. Source/fit study suggests phase, width/gap and endpoint/crop modelling, not another global pixel-only translation. Mixed occlusion/material/photo and noncanonical user artwork remain unverified.

No external licensed/owner artwork, Pixel handset, real creator approval, provenance/source identity, or historical recipe promise is claimed. #557 stays open.
