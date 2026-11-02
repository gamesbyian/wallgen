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

## Repeating-loop invariant aspect factor reuse (2 November 2026, PR #989)

A remaining repeatable source cost in `random-perf-fixed-30` was the
`loops` path position function: each call recomputed
`Math.pow(2,(loopAspect-50)/35)`, even though both `loopAspect` and
`loopAmplitude` are constants of the authored stripe. Every tangent calls
`pathPosition` **three times**, and the renderer samples thousands of
source stations. On the original disposable paint stripe, the renderer now
computes exactly the original left-associative X-amplitude expression once:
`(loopAmplitude??13)*2.1*Math.pow(2,((loopAspect??50)-50)/35)`.
`pathPosition` uses this value only when it is present on a cloned paint
stripe; independent/public geometry sampling continues its original formula.
No new recipe property, persistent geometry cache, approximation, changed
relative station or painter order is introduced.

Permanent quick regression tests compare **2,100 source-identical values**
across seven aspects, five amplitude inputs, three colour slots and ten
in- and out-of-frame stations, for both original path position and the
three-station unit tangent.

[Same-run actual source-matched Chromium #41373798607](https://github.com/gamesbyian/wallgen/actions/runs/41373798607)
passed all ten canonical artwork comparisons in both direct Canvas2D and
real export Worker (20 exact raw-pixel SHA matches). The **3024×6552 native
worker PNG** remained byte-for-byte identical (11,453,267 bytes,
SHA-256 `b7fa60e7f6208957cd87d1341a3f57e166c0749a6fb22f39f9f61a41876e4c4a`).

Actual 372×806 production worker paint durations (ms), **nine alternating
base/candidate trials**, with original source matched per case:

| Scene | Original | Cached aspect X amplitude |
| --- | --- | --- |
| `random-perf-fixed-30` repeating loops, wood, dashes | 729,645,632,592,595,587,597,579,584 | 671,617,576,552,572,546,559,554,592 |
| repeating-loop/dashes control | 134,120,119,120,121,121,120,121,119 | 133,125,119,120,120,119,120,121,123 |
| single-loop/chevrons control | 148,140,129,128,132,130,130,145,130 | 139,140,132,129,132,130,126,132,139 |
| hairpin/stars control | 132,135,139,126,125,130,130,125,126 | 133,134,139,132,127,128,134,126,126 |
| zigzag/checker control | 76,71,69,68,68,68,69,67,68 | 77,71,67,66,68,73,68,67,71 |

For fixed seed 30, **eight of nine candidate pairs were faster**. After
excluding the first cold pair, the original warm median was **593.5ms** and
the candidate **565.5ms**, a **4.7% reduction**. Other examples were
noise-sized or neutral. Do not add percentages from different benchmark
runs; host resource contention and browser state differ. This is a verified
improvement on an expensive fixed scene, **not** a device-wide Random
speed guarantee. The full-size source pixels, mobile gesture semantics,
camera, user locks/Undo and original artwork remain unchanged. Physical
Pixel 6 Pro interaction/thermal evidence is still outstanding. The
one-shot acceptance workflow is retired after proof.

## Zero-side material-height queries skip width solving (2 November 2026, PR #992)

The paint-time motif-placement path requests
`textureHeight(scene,stripe,x,0,point)` for many marks. Previously the
height field still invoked the full longitudinal `widthAt()` solver to
calculate `0*width/2`. For canonical finite widths, this has no geometric
effect, yet a width profile can involve taper normalization and
sinusoidal source variation. The height sampler now uses the input zero
directly when `side===0`, preserving `-0`'s sign, and keeps the original
multiplication order and exact width calculation for signed `-1/+1`
physical ribbon edges. No alternate material field, recipe, geometry,
seed, camera, worker or export implementation was added.

The permanent quick suite checks 2,016 signed original-vs-shortcut
offsets across six geometries, four displacement settings, three source
stripes and seven stations, with both signs of zero and independent
material-height point sampling.

[Actual source-matched nine-pair Chromium #41374314345](https://github.com/gamesbyian/wallgen/actions/runs/41374314345)
passed all 20 raw-pixel comparisons across ten canonical recipes in direct
Canvas2D and production export Worker. The real **3024×6552 worker PNG**
remained byte-identical, 11,453,267 bytes, SHA-256
`b7fa60e7f6208957cd87d1341a3f57e166c0749a6fb22f39f9f61a41876e4c4a`.
All nine worker paint pairs were interleaved baseline/candidate in alternating
order, on one Linux Chrome runner (ms):

| Fixed case | Original | Zero-side shortcut |
| --- | --- | --- |
| `random-perf-fixed-30` loops/wood/dashes | 1159,1054,1034,1004,995,981,982,980,998 | 1105,1041,999,986,979,958,964,977,960 |
| repeating-loop/dashes control | 169,156,155,156,159,155,157,154,152 | 180,159,154,153,154,152,157,159,153 |
| single-loop/chevrons control | 187,184,170,171,172,171,168,189,170 | 189,174,170,168,172,169,169,172,188 |
| hairpin/stars control | 173,167,167,169,174,167,166,169,171 | 173,166,167,170,180,166,168,169,171 |
| zigzag/checker control | 157,121,118,118,119,133,119,118,117 | 134,120,120,118,120,119,119,118,120 |

Fixed seed 30 improved in **all nine pairs**. Excluding the first cold pair,
the original warm median was **996.5ms**, candidate **978ms**, approximately
**1.9% less worker painting time**. Other cases are mixed/noise-sized. These
are *paired isolated-worker durations*, not total click-to-canvas latency,
and must not be added to gains measured on different CI runners. The
unchanged art, existing Undo/locks and final PNG are the primary acceptance;
physical Pixel 6 Pro thermal/latency measurements remain unverified.
The one-shot workflow is retired after collecting this evidence.

## Paint-scoped material texture factors (2 November 2026, PR #996)

The existing `textureHeight(scene,stripe,x,side,point)` samples source-matched
material relief at many edge, motif and crossing stations. Before this
change, **every sample** rechecked the immutable layer list for any
non-background coverage, calculated `Math.cos(scene.angle)` and
`Math.sin(scene.angle)`, and recalculated the same
`Math.pow(scene.textureDisplacement/100,.85)` cap factor. The height field,
source coordinates, material stack, rotated layer cos/sin and actual signed
edge expressions remain unchanged.

The renderer now keeps these *four immutable factors* in a `WeakMap` for
the duration of **one `drawWallpaper` invocation only**, deleting the entry
in `finally` even when an exception aborts an in-progress paint. Direct
external calls to `textureHeight` use their original arithmetic and observe
current material/angle edits. The normal quick suite
`tests/render-surface-lifecycle.test.js` proves that a completed paint
returns no stale material coverage/trigonometry: adding a real texture
and rotating the returned scene produces the same original relief samples
as a fresh independent scene. No persistent cache, recipe field, alternative
geometry, new material brush, LOD or worker lifecycle change was made.

[Actual source-matched Chrome proof #41381506368](https://github.com/gamesbyian/wallgen/actions/runs/41381506368)
passed ten raw-pixel SHA comparisons through **both** direct Canvas2D and
the real export Worker (20/20). The actual 3024×6552 worker PNG was
**byte-for-byte identical**, 11,453,267 bytes, SHA-256
`b7fa60e7f6208957cd87d1341a3f57e166c0749a6fb22f39f9f61a41876e4c4a`.

Same-run production Worker interactive paint times at 372×806 (ms, nine
alternating baseline/candidate trials, first cold pair retained in rows):

| Actual source | Original | Render-scoped factors |
| --- | --- | --- |
| repeating loops + dashes + wood | 174,173,161,164,165,162,162,166,161 | 173,160,153,151,155,150,156,153,157 |
| fixed slow Random seed 30 | 839,782,817,780,733,723,734,720,721 | 838,772,801,758,713,711,738,711,720 |
| single loop + chevrons | 210,181,177,179,182,179,184,205,180 | 198,175,177,174,181,174,176,186,198 |
| hairpin + stars | 180,172,169,176,180,174,175,178,175 | 175,168,171,173,174,168,172,172,173 |
| zigzag + checker | 109,102,91,92,95,94,90,93,92 | 100,98,91,89,95,92,91,88,90 |

The loop-dashes scene improved in **all nine pairs**. Excluding the cold
first pair, its warm median fell from **163ms to 154ms (5.5% less)**.
The more expensive fixed Random seed 30 has a much smaller warm median
improvement: **733.5ms to 729ms (0.6% less)**. These scene-specific results
justify the eliminated work but do not establish a material improvement for
every Random click. Do not add percentages from unrelated benchmarks, and
do not infer physical Pixel 6 Pro speed, memory/thermal behaviour or UI
latency from hosted Linux Chromium. The one-shot browser workflow is
retired after exact-source evidence; the reusable benchmark and quick
regression test remain.

## Real Random button, pinned seeds and two mobile viewports (2 November 2026, PR #1000)

The earlier source-level optimiser trials measured real production **worker
paint** durations, not the actual Random button or final visible presentation.
The old browser-click script chose different crypto-random recipes on every
run, so source work could not be compared or reproduced. The reusable
`scripts/randomize-e2e-fixed-seeds-browser.mjs` now intercepts only the
**two-element Uint32Array** `crypto.getRandomValues` used by
`model.newSeed()` in an isolated test Chromium context. All other browser
crypto requests retain their real CSPRNG. This exercises the production
`#randomizeAll` action, existing preview Worker, progressive canvas and
history/URL update without a fake renderer or new recipe control.

Three literal generated seed pairs were pinned after selecting genuine
`randomizeAllRecipe` outputs. A source-family assertion now **fails** if
future random generation changes the recipe, rather than silently switching
to an easier benchmark:
- `6rf94u-1e3y45x`: paths, repeating loops, handmade surface, 50%
  texture displacement
- `1pyivby-tpkh85`: radial 42 rays, sand-mandala, 30% displacement
- `nb4tm8-1mudoyj`: 14 regions, stone, 31% displacement

[Actual Chromium Random-button proof #41382558974](https://github.com/gamesbyian/wallgen/actions/runs/41382558974)
**passed** 6 real mobile-touch journeys across 320×700 and 412×892.
For each, a single Random and four rapid Random clicks generated the
**same final canonical seed**; the observed final
`roygbiv-preview-presented.detail.key` matched the real
`artKey(current)`, and final frames came from the actual Worker.
No page errors or unconsumed injected random seeds occurred. All
milliseconds below measure **actual click event to final presentation**,
rather than worker-only CPU time.

| Viewport | Pinned random source | Single: final after click | Four clicks: final after last click | Four clicks: final from first |
| --- | --- | ---: | ---: | ---: |
| 320×700 | repeating loops / handmade | 381 | 394 | 946 |
| 320×700 | 42-ray sand mandala | **2598** | **6037** | **6583** |
| 320×700 | regions / stone | 252 | 402 | 1004 |
| 412×892 | repeating loops / handmade | 375 | 1635 | 2214 |
| 412×892 | 42-ray sand mandala | **2548** | **5978** | **6534** |
| 412×892 | regions / stone | 251 | 240 | 852 |

For the single click, the first provisional radial/sand frame appeared
after ~714–734ms, with canonical settled art after ~2.5s. Most rapid
four-click bursts delivered **zero intermediate provisional frames**.
The harness requests 110ms between clicks via Playwright, but actual
measured click intervals were roughly **178–222ms**, because Playwright
input dispatch and the UI work take time. Do not misreport them as
exactly 110ms-spaced hardware taps.

**Priority consequence:** the radial sand long tail is a genuine
reproducible *user-visible* latency issue, not a generic
speedup extrapolation from worker paint samples. Its ~6s latest-frame
delay may include finishing obsolete synchronous worker jobs plus the
required final paint; separate those causes in a source-matched
experiment before changing scheduling. Earlier broad worker-preemption
[#978](https://github.com/gamesbyian/wallgen/pull/978) was **rejected**
after mixed/negative seed-matched A/B proof and must not be reintroduced
without substantially stronger, targeted evidence. Prefer profiling and
source-identical sand/radial painting costs and cooperative opportunities
before adding worker churn.

These are real Linux Chromium touch emulations using the two target
viewports, **not physical Pixel 6 Pro**, not thermal measurements, and
not evidence of one universal Random performance distribution. The
reusable script and pinned case IDs are retained; the temporary test
workflow is retired after proof.

## Actual request/completion trace: the long-tail wait is obsolete work (2 November 2026, PR #1007)

[Real 320×700 and 412×892 Chrome Worker timeline #41383827870](https://github.com/gamesbyian/wallgen/actions/runs/41383827870)
extends the pinned-source **actual Random click** test without changing
app code. In a browser-only `Worker` subclass it observes original
`postMessage` preview requests and actual native `frame` replies,
including the worker's real `data.ms` paint duration, source art key,
quality, request ID and time relative to input. The subclass never sends
synthetic messages, cancels workers or alters the coordinator. Every
final frame had a matching real Worker **request and completion** at the
authoritative final art key; all six touch journeys passed with no
browser errors. A reusable source-matched Chromium proof also found **all
11 pinned cases SHA-identical** in both reference Canvas2D and export
Worker (22/22). The native 3024×6552 worker PNG matched its source bytes.

The previously unexplained sand-mandala 42-ray burst has now been
**causally separated by Worker message evidence**:

| Event | 320×700 | 412×892 |
| --- | ---: | ---: |
| First superseded *interactive* paint began | ~32 ms before first click event | ~31 ms before first click event |
| Obsolete first paint completed | 4,730 ms after first click | 4,570 ms after first click |
| **Actual obsolete paint duration** | **4,761 ms** | **4,601 ms** |
| Final *settled* paint dispatched | 4,730 ms after first click | 4,570 ms after first click |
| Final source-identical settled Worker paint | 1,904 ms | 1,837 ms |
| Finished frame delivered | 6,639 ms after first click | 6,409 ms after first click |
| From **last tap** to final visible frame | **6,059 ms** | **5,809 ms** |

The first four-tap job was a **different generated recipe** and was
already obsolete by the last tap (the measured input gaps put that tap
only ~0.55–0.60s after the first). Because the current preview Worker
cannot interrupt synchronous Canvas2D work, it spent **around four
additional seconds after the last tap** painting a picture that was
never delivered, then painted the exact latest settled artwork for
~1.8–1.9s. A single source-identical Random click also correctly
produced an interactive frame in ~0.76–0.78s and the settled frame in
~2.54–2.57s. **The several-second burst latency is primarily obsolete
active-worker occupancy plus genuine settled-resolution cost**, not
a 6-second render of the latest recipe, recipe corruption, stale pixels
shown to the user or an unexpectedly slow 372×806 sand microfacet alone.

Do not confuse an individual paint's `ms` with the full UI event clock.
The instrumented app's real Worker and frame identity are validated.
The work is platform-emulated Chromium, not physical Pixel CPU/GPU
thermal acceptance.

### Re-evaluating rejected worker preemption without losing the evidence

Earlier general restart [#978](https://github.com/gamesbyian/wallgen/pull/978)
was properly rejected because prior paired random workloads had no
reproducible gain and one heterogeneous run regressed badly. **This
new trace identifies a different deterministic, multi-second obsolete
active job**, justifying only a fresh *bounded, source-matched*
experiment: explicitly mark user-triggered new Random/reroll intents;
compare original worker scheduling to guarded interruption using
identical final seeds, 4-tap timing, two mobile viewports, genuine
worker requests, latest-art-key acceptance, no concurrent restart
storms and actual single-tap/ordinary-controls negative controls.
Reject if the full user-facing timeline, fallback, gesture or memory
regresses. Do not automatically merge prior branch code or claim
worker restarting is accepted.

The independent sand microfacet proposal
[#1003](https://github.com/gamesbyian/wallgen/pull/1003) was **closed
unmerged** after all pixels matched but the real radial 372×806 paint
improved only ~1.4% with mixed trials, insufficient to explain the 6s
burst. This preserves exact granular artwork without speculative
quality reductions. The temporary instrumentation workflow is retired
after evidence; the reusable trace and 42-ray source remain in scripts.
