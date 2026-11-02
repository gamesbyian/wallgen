# Randomize latency: reproducible baseline and improvement contract

**Owner report:** Randomizing on phone can feel sluggish. Existing Random action paints an `interactive` low-resolution worker preview, followed by a canonical settled frame after a 170ms grace period; the worker has a single synchronous Canvas2D active slot and latest-only pending slot. This plan does **not** propose a second renderer, fake CSS preview, changed randomization recipe, or unsafe stale artwork.

## 29 October 2026 baseline

Single [Linux Chrome 412×892 browser journey](https://github.com/gamesbyian/wallgen/actions/runs/40980503504). Source: `scripts/randomize-latency-browser.mjs`. Clicking actual `#randomizeAll`, waiting for `roygbiv-preview-interactive` and `roygbiv-preview-presented`; a four-click sequence uses ~110ms gaps. Each scenario includes a canonical recipe URL, validates changed seed and no browser errors. Times are elapsed milliseconds, not a population distribution or physical Pixel measurement.

| Scene | Single Random: first provisional / settled | Four rapid Random presses: first provisional / final settled from first |
| --- | --- | --- |
| Basic paths + grain | 184 / 559 ms | 766 / 1196 ms |
| Three active materials | 437 / 1486 ms | 134 / 3299 ms |
| Regions + linen | 185 / 566 ms | 840 / 1552 ms |

The four-click multi-material burst produced exactly one intermediate preview and delayed settled art by 2,791ms after the last click. These measurements make heavy random exploration a genuine user-facing latency problem.

## Historical next intervention hypothesis (29 October; rejected below)

Try **bounded exploration-only worker preemption**: when a brand-new Random / New variation request supersedes a materially different in-progress preview, terminate its already-obsolete worker and spawn one fresh worker with the newest canonical recipe. Throttle restart frequency, avoid pathological loops and normal slider/text/rotation/editor paths, preserve startup/fallback error handling, prevent stale generations from delivering images, and keep exact final art and history. Do **not** render stale random images as if current, unlike the deliberately bounded rotation-gesture provisional frames.

Benchmark before and after on the same script and scenario set. Reject candidate if latency does not materially improve or it causes fallback/worker leak/Undo/PNG issues. Use pure fake-worker unit tests for interruption and unexpected old frames, plus genuine Chrome click/worker pixel evidence; do not count synthetic completion as device/human acceptance.

## Release boundary

Shipping quality is governed by the user's real Random interactions, current canonical recipe, source preserving locks and Undo, actual preview pixels, and worker/export fidelity. Emulated Chromium is not Pixel 6 Pro thermal/heap/UX evidence. Retire one-shot CI workflows after measurement and retain reusable script and this concise owning report.

## Paired safety experiment: worker interruption rejected (29 October 2026)

An isolated branch (`feature/randomize-preview-preemption-20261029`, **not merged**) tested restarting the busy preview Worker when a new Random request superseded its currently synchronous Canvas2D paint. The source included guarded worker-generation identity, cooldown, startup fallback, and fake-worker unit tests. An initial unpaired run hinted at a speedup, but the [same-run, deterministic-seed paired A/B trial #40981369721](https://github.com/gamesbyian/wallgen/actions/runs/40981369721) **did not reproduce it**. The trial copied the same seed-deterministic browser script into both live `main` and candidate checkouts, and alternated each case twice on the same Ubuntu runner:

| Four rapid Random presses | Main, trials 1 / 2 | Preemption, trials 1 / 2 |
| --- | ---: | ---: |
| Basic path | 1162 / 1179 ms | 1158 / 1157 ms |
| Three-material | 1028 / 1144 ms | 1176 / 1118 ms |
| Regions | 1025 / 1131 ms | 1161 / 1161 ms |

Single clicks were likewise similar. Unit tests passed, but adding worker churn for no demonstrated improvement would be counterproductive; **do not merge or deploy the candidate**. The initial 3.3-second heavy case reflects large variance in random generated scene cost rather than a universally stuck scheduler. Do not label an unpaired faster run as proven acceleration.

**Next focus:** profile actual production worker rendering across a *fixed, reproducible corpus* of randomized canonical scenes; identify specific slow operations/recipe families, then modify only a measured bottleneck. Preserve visible art, PNG metadata, locks, Undo, worker/fallback behavior, and native fidelity.

## Fixed-seed scene-cost diagnosis (29 October 2026)

[32-production-worker-scene sample #40981824025](https://github.com/gamesbyian/wallgen/actions/runs/40981824025), rendered at interactive 372×806 using `scripts/randomize-scene-costs-browser.mjs`, found **162ms median**, with two repeatable long-tail designs:

- `random-perf-fixed-30`: paths + multi-loop + dashed marks + double outline + wood grain. First 1330ms, repeats ~1303/1304ms and settled 1533ms.
- `random-perf-fixed-20`: concentric radial + 56 rays + felt. First 936ms, repeats ~915/931ms and settled 2422ms.

[Real-worker subsystem ablation #40982018463](https://github.com/gamesbyian/wallgen/actions/runs/40982018463) confirmed the bottlenecks rather than guessing: radial felt dropped from ~754 to ~56ms when disabling material. Wood-grain loops dropped from ~1024 to ~515ms with material removed, ~561ms with displacement disabled, ~362ms with solid motif, and ~78ms with straight geometry. These are intentionally different artworks used ONLY for diagnosis, not approximations shipped in the renderer. The sampled performance spread explains why Random feels intermittently much slower than its typical result.

## Exact one-pass material re-use: candidate accepted (29 October 2026)

A precise redundant-work fix in `src/renderer.js`: a material layer with `coverage='both'` previously painted the **identical deterministic material twice**, once for background and once for stripes. Background and ink remain separate compositors, with independent ordered blends. The renderer now paints each material layer exactly once, applies the unmasked scratch to the background if requested, and then masks the same scratch for the stripes if requested. No geometry, texture stroke, parameter, recipe, camera, export, cache or blended layer semantics have been rewritten, and there is **no** new full-frame cache.

[Same-run old-main vs candidate acceptance #40982569405](https://github.com/gamesbyian/wallgen/actions/runs/40982569405) tested **9 canonical material designs** including the two expensive random seeds, varied blend modes, three `both` layers, stripe-only, background-only, radial, regions, wood, grain, fabric and foil. All 9 had **exact raw-pixel SHA-256 equality at 240×520** between code versions in **each** backend (direct Canvas2D and PNG export Worker). Additionally, the **actual 3024×6552 worker PNG** for wood-grain `both` was byte-for-byte SHA256 identical, **4,607,982 bytes** in each version, digest `407bcd9b62f2f59d2c50c703b3ce6f5cbdd60745d62eab6c84748a706790dd9e`. This preserves existing direct/worker differences, rather than inventing new pixel parity between them.

Three repeated production `372×806` worker paint durations in that same comparison (milliseconds; last pair shown to avoid startup bias):

| Sample | Previous | One-pass | Relative benefit |
| --- | ---: | ---: | ---: |
| Radial felt (`both`) | 332 | 175 | ~47% less |
| Three materials (`both`) | 583 | 297 | ~49% less |
| Random worst seed 20 | 946 | 524 | ~45% less |
| Wood `both` | 185 | 169 | ~9% less |
| Loop/wood worst seed 30 | 1274 | 1262 | ~1% less |

These are **single CI runner repeated worker trials**, not phone frame rates or population statistics. Benefits are large where material duplication dominated, appropriately small where loop geometry/marks dominate. The 32-seed cost profiler and cross-commit acceptance script are retained; temporary large CI workflows retired. No real Pixel 6 Pro performance, native on-device memory/thermal, owner touch preference or human aesthetic judgement is implied.

**Next scope:** Only if a further demonstrable bottleneck is requested, profile the repeatable slow loop/dashed-motif geometry in seed 30. Do not weaken source-visible art or reintroduce worker restart churn. The cross-material `both` duplicate render is addressed with identical pixels.

## Motif geometry station reuse (29 October 2026)

Once the material-both duplication was eliminated, the remaining repeatably slow `random-perf-fixed-30` was dominated by loop geometry and dashed motifs. The same candidate motif station was previously evaluated separately for baseline y position, texture displacement, fit validation and spatial placement, up to four `samplePath()` traversals of the identical authored geometry.

`src/renderer.js` now reuses a single **identical** path sample for the four operations, and skips a per-motif filtered-array allocation of material layers while continuing to ignore background-only layers. The exported `textureHeight` and `motifFits` retain their old signatures with optional precomputed samples; standalone Node tests prove the two forms equal across straight, wave, loop, loops, hairpin, all material coverages, signed sides and diverse fit positions.

[Actual paired Chromium acceptance #40983375550](https://github.com/gamesbyian/wallgen/actions/runs/40983375550) compared baseline `main` with the candidate on 10 canonical recipes, including dense dots, dashes, chevrons, stars, hatch, checker, radial, regions and the original fixed expensive case. **All 10** were identical SHA256 at raw-pixel level through **both** direct Canvas2D and the export Worker. An actual 3024×6552 production worker PNG of `random-perf-fixed-30` was **byte-for-byte identical**, 11,482,743 bytes and hash `52c6a93a654d9330a41c59d1d5b0c27d7638f63c79e4105ef33ce4733f219a9e`. No shortcut or approximation changes artwork.

Same-run 372×806 production worker paint trials (third paired run): complex seed30 **1723 → 1470ms (~15% reduction)**, custom loop/dashes **236 → 224ms**, loop/chevrons **274 → 254ms**, hairpin/stars **260 → 247ms**. Smaller changes match the fact that only spatial motif-heavy scenes redundantly resampled geometry. This is Linux CI Chromium, not physical Pixel benchmark or a global Random latency guarantee. Reusable scripts `scripts/motif-sample-reuse-acceptance.mjs` and test `tests/motif-sample-equivalence.test.js` retain the verification; the one-shot heavy CI workflow was removed before integration.

**Boundary:** no ongoing unverified GPU/material rewrites; further latency work only after another actual slow design and pixel-preserving quantified acceptance. Some complex designs still require >1s to render in Chromium.

## Fixed-seed motif variation factor reuse (1 November 2026, PR #981)

Following the accepted path-station reuse, `fillMotif()` still recreated the
identical seeded stripe-variation RNG, rehashed the same seed string and drew
the same three stripe factors for **every single decorative mark**. Those
factors depend only on the canonical scene and stripe index; the separate
per-mark random stream is genuinely different and must remain sequential.

The narrow candidate computes the existing three stripe factors once per
painted stripe and passes them to the original `motifVariation` calculation.
Its standalone three-argument export still derives factors independently,
so callers and their original RNG consumption remain unchanged. No motif
placement, geometry, colour, recipe, lock, Undo, worker scheduling, or paint
resolution changes. A permanent deterministic quick test exercises the
original arithmetic against both paths over five geometries, three
homogeneity values, two override modes, three stripe slots and 96 sequential
marks: **8,640 marks per path, 17,280 comparisons in total**.

[Same-run base-SHA vs candidate actual Chromium proof #41369862393](https://github.com/gamesbyian/wallgen/actions/runs/41369862393)
verified 10 canonical source-identical recipes including the previously
slow `random-perf-fixed-30`, in both reference Canvas2D and real PNG export
Worker: **all 20 raw-pixel comparisons passed**. The real native-resolution
3024×6552 slow-seed PNG remained **byte-for-byte identical** (11,453,267
bytes, SHA-256 `b7fa60e7f6208957cd87d1341a3f57e166c0749a6fb22f39f9f61a41876e4c4a`).

Actual production 372×806 interactive worker paint times in milliseconds
from the same Linux runner, base→candidate (three alternating trials):

| Fixed source | Original | Reuse candidate |
| --- | --- | --- |
| `random-perf-fixed-30` | 1480 / 1380 / 1374 | 1271 / 1152 / 1151 |
| loop/dashes | 192 / 179 / 178 | 185 / 174 / 176 |
| loop/chevrons | 224 / 219 / 207 | 226 / 215 / 203 |
| hairpin/stars | 234 / 203 / 201 | 200 / 194 / 193 |
| zigzag/checker | 157 / 146 / 145 | 162 / 147 / 145 |

The two warm slow-seed comparisons are ~16–17% faster; other sources show
small or noisy differences. This is a **repeatable fixed-case** benefit, not
a guarantee that general Random interactions become 16% faster, and it is
not a physical Pixel 6 Pro memory/thermal measurement. The one-shot browser
workflow is retired after this result; the reusable exact-source comparison
script and permanent deterministic source test remain. Required clean-head
quick CI is a separate integration gate.

## Textured ribbon edge station reuse (1 November 2026, PR #983)

The `edgePoint` path for **texture-displaced ribbon edges** previously
evaluated `samplePath(stripe,x,extent)` in `textureHeight()`, then evaluated
the **same** geometry/tangent again in `ribbonEdge()`. Each source sample
requires three underlying path positions for the point and tangent, which
is disproportionately costly for loops, hairpins and jagged paths.

The renderer now computes the exact original `samplePath` once and passes it
to both the existing source height sampler and `ribbonEdge`, whose default
public five-argument behavior is unchanged. When displacement is off, the
original fast edge route is retained. No cache state, new geometry,
approximation, alternate rasterizer, texture resolution or recipe field
is introduced. An added permanent quick test proves **3,402 exact edge
comparisons** across six path families, three texture coverage modes, three
displacement values, three stripe slots, seven stations and three sides.

[Same-run base-SHA vs candidate real Chromium proof #41370515911](https://github.com/gamesbyian/wallgen/actions/runs/41370515911)
passed **all 20 exact raw-pixel comparisons** (ten original production
recipes through both direct Canvas2D and export Worker). The 3024×6552
fixed-slow-seed PNG was **byte-for-byte identical** on both sources:
11,453,267 bytes, SHA-256
`b7fa60e7f6208957cd87d1341a3f57e166c0749a6fb22f39f9f61a41876e4c4a`.

Fixed-source worker paint timings in milliseconds, same Linux Chrome runner,
three alternating source-matched trials, original→candidate:

| Fixed source | Original | Shared edge sample |
| --- | --- | --- |
| `random-perf-fixed-30` | 691 / 720 / 721 | 674 / 649 / 640 |
| loop/dashes | 150 / 146 / 134 | 147 / 140 / 129 |
| loop/chevrons | 170 / 164 / 151 | 164 / 141 / 145 |
| hairpin/stars | 155 / 148 / 146 | 145 / 146 / 140 |
| zigzag/checker | 98 / 84 / 82 | 80 / 75 / 73 |

The two warm slow-seed comparisons are approximately **10–11% faster**;
small sources are improved or noisy. Compare paired rows *within this run*
only; runner noise and differing background resource availability make the
absolute durations **not comparable across different GitHub runs**, including
the previous #981 proof. These are production Chromium worker paint times,
not actual device Random-to-visible latency, and neither Pixel 6 Pro thermals
nor physical touch response have been measured. The one-shot proof workflow
is removed after qualification; required clean-head quick CI is independent.

## Avoiding paint-only single-loop/hairpin contact scans (2 November 2026, PR #986)

Non-floating **single loops and hairpins** already retain their natural ribbon
ends regardless of a frame-contact report. Nevertheless the paint path invoked
the full `stripeFrameContacts()` inspection for every painted stripe, sampling
two ribbon edges at **481 source stations** and testing three segments per
station. The renderer never reads the returned `contacts` object.

The painter now calls `balanceStripeEnds(scene,stripe,false)`. Only for
non-floating `loop` or `hairpin`, the optional flag omits those diagnostics
and returns `contacts:null`; the same `balanced:true,hidden:false` remains.
External two-argument callers still receive **exactly the original full**
`contacts` output, and `floating`, `loops` (repeating), `wave`, other
geometries still compute and use genuine contacts to decide end balancing.
No source geometry, stitch physics, texture/displacement, worker scheduling,
history/Undo, metadata or export algorithm was changed. The permanent quick
suite compares source-visible stripe/end mutations and public diagnostic
results for four geometries, three composition modes, two displacement
values and three stripe slots.

[Real paired browser proof #41373071498](https://github.com/gamesbyian/wallgen/actions/runs/41373071498)
passed ten identical-art cases across direct Canvas2D and PNG worker, native
3024×6552 PNG bytes, but three trial timing pairs were inconclusive enough
to warrant a larger experiment. The reusable
`scripts/motif-sample-reuse-acceptance.mjs` now accepts a bounded optional
`ROYGBIV_PERF_TRIALS` count, alternating **baseline→candidate** and
**candidate→baseline** per trial, rather than consistently rendering one
candidate after an already warmed base.

[Source-matched nine-pair trial #41373248975](https://github.com/gamesbyian/wallgen/actions/runs/41373248975)
passed all 20 raw-pixel comparisons (ten canonical cases × reference Canvas2D
and worker). The native production 3024×6552 PNG remained **byte-for-byte
identical**, 11,453,267 bytes, SHA-256
`b7fa60e7f6208957cd87d1341a3f57e166c0749a6fb22f39f9f61a41876e4c4a`.

Actual 372×806 interactive worker paint times (ms; nine interleaved trials):

| Source / geometry | Baseline | Candidate | Warm-trial median |
| --- | --- | --- | --- |
| **single loop / chevrons** | 246,236,250,230,227,231,230,248,226 | 244,228,216,216,216,215,221,217,228 | **230.5 → 216.5 ms (6.1% less)** |
| **hairpin / stars** | 238,223,221,226,225,223,220,223,231 | 228,213,214,216,221,212,213,225,221 | **223 → 215 ms (3.6% less)** |
| repeating loops / dashes | 218,214,203,203,202,203,202,203,201 | 218,217,207,202,203,202,202,201,200 | ~203 → 202 ms (control) |
| repeat loops / worst random seed 30 | 1265,1125,1104,1131,1109,1098,1101,1101,1096 | 1191,1104,1119,1112,1104,1104,1114,1095,1093 | ~1102.5 → 1104 ms (control) |
| zigzag / checker | 144,125,124,125,123,132,123,125,124 | 138,124,122,122,125,131,124,123,127 | ~124.5 → 124 ms (control) |

Warm-trial medians omit the first pair of cold renders. The small control
variation and stable positive single-loop/hairpin improvement match the
specific skipped work. No general Random latency improvement, mobile device
FPS or thermal speedup is claimed. Actual Pixel 6 Pro latency remains an
independent acceptance gate. The one-shot workflow is retired after proof;
the reusable benchmark and deterministic source test remain.

**Rejected follow-up (PR #984):** Sharing two cross-section edge samples
also retained exact pixels, but [source-matched Chromium #41372732527](https://github.com/gamesbyian/wallgen/actions/runs/41372732527)
showed mixed/noise-sized worker timing differences. It was closed **unmerged**
and its temporary workflow retired. Do not present it as a missing
performance improvement.
