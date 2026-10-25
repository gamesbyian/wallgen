# Measured Chromium source-mask reuse: five real R0 images

**Task:** issue [#557](https://github.com/gamesbyian/wallgen/issues/557) • **Opt-in profiler:** [PR #715](https://github.com/gamesbyian/wallgen/pull/715) • **Actual source/browser run:** [GHA #40225513500](https://github.com/gamesbyian/wallgen/actions/runs/40225513500).

## What was measured

Following the merged [single source-hue-pass change #714](https://github.com/gamesbyian/wallgen/pull/714), the opt-in real renderer evaluator accepts `--profile-hue-masks`. The profiler runs the **same production `describeReconstructionImage` + `observedHueShapeRecipe` operation** using (a) the prior standalone per-hue mask reclassification and (b) the new **shared, already-classified seven hue masks**. Both are independent proposed editable ROYGBIV recipes using original/anonymous source PNG pixels only; neither reads the hidden truth sidecar. Before timing, their **full normalized candidate objects must be JSON-exactly equal**, otherwise the test fails. Every source remained the genuine production-renderer authored, metadata-free R0 input.

The real Chromium job generated five separate 480×1040 R0 originals, downsampled their import analysis to **277×600 = 166,200 pixels**, warmed both paths twice, then alternated their order while recording six `performance.now()` elapsed-time samples per path. Times are **per source analysis + shape candidate production** and EXCLUDE browser startup, PNG decoding, remaining candidate proposals, 6+10 actual painter fitting, high-resolution export, UI and user editing. This is a JIT-balanced browser microbenchmark, not a mobile end-to-end latency study.

## Measured six-sample median results

| Renderer-authored source | Legacy 2-pass, ms | Reused masks, ms | Saved, ms | Relative median reduction |
| --- | ---: | ---: | ---: | ---: |
| #01 straight stripes | 78.55 | 54.80 | 23.75 | 30.24% |
| #05 Hairpin | 89.30 | 81.45 | 7.85 | 8.79% |
| #06 Loop | 116.85 | 102.65 | 14.20 | 12.15% |
| #16 displaced Jagged | 72.15 | 62.10 | 10.05 | 13.93% |
| #19 Jewel stripes | 66.30 | 54.50 | 11.80 | 17.80% |
| **Mean of case medians** | **84.63** | **71.10** | **13.53** | **15.99%** |

Every case's `sameRecipe` was `true` and the canonical `hue-visible-shapes` candidate was representable in all five. Independent [full 22-source acceptance for #714](https://github.com/gamesbyian/wallgen/actions/runs/40224875814) had separately proven exact selected kind, score and optional research preview equality against pre-optimization main for all 22/22 cases.

**Variability:** The first straight-stripes baseline had a longer early sample; the shared path also had one slower outlier. The sample medians above are genuine observed values, not an empirical guarantee. No claim of universal improvement for arbitrary outside-source art or all viewport sizes can be made from five images and one Linux runner. Do not read a ~16% cut in this **one operation** as 16% overall app startup/import/rendering improvement.

## Usage and boundaries

```bash
# Opt-in temporary browser workflow, not a mobile dependency or default CI.
node scripts/review-reconstruction.mjs --out-dir artifacts/hue-mask-cpu \
  --only 01-vertical-straight,05-hairpin,06-loop,16-offset-jagged,19-jewel-vertical
node scripts/evaluate-reconstruction-r0.mjs \
  --dir artifacts/hue-mask-cpu --profile-hue-masks
```

The evaluator writes per-source `hueMaskProfile` values to its normal `evaluation.json` and `HUE_MASK_CPU` stdout records; individual six-sample arrays can be inspected. Profiling flag defaults to **off** and does not change normal product image inference, actual renderer, locks, recipe, Undo, download, worker, GPU or creative defaults. Normal quick CI remains tiny; heavyweight GHA source/Chromium generation is kept **manually opt-in** after the original proof.

**What remains:** Actual Pixel 6 Pro Chrome/PWA cold-start and warm-import measurements, peak JavaScript heap and GC, 7-colour worst-case contour count, thermal/battery constraints and TalkBack/touch/IME acceptance are not proven by this Ubuntu-hosted Chrome result. A future user- or agent-provided physical-device trace should measure end-to-end interaction, rather than multiplying these local analysis numbers into fictional overall savings.

[One-pass implementation and exact 22-case optical parity](RECONSTRUCTION-SHARED-HUE-MASK-REUSE-2026-10-25.md) • [Active queue](CURRENT-WORK-QUEUE-2026-10-24.md) • [Engineering reuse](ENGINEERING-REUSE-AND-SEMANTIC-OWNERSHIP.md)
