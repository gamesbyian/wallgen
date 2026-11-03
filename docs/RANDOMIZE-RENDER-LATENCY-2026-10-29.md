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

## Scoped quiet Random cancellation: source-matched real burst win (2 November 2026, PR #1010)

The [actual Worker timeline #41383827870](https://github.com/gamesbyian/wallgen/actions/runs/41383827870)
isolated the 42-ray sand Random burst's **4.6–4.8-second obsolete active
paint**, followed by the **1.8–1.9-second** correct final settled paint.
Prior speculative general restart [#978](https://github.com/gamesbyian/wallgen/pull/978)
was appropriately rejected. The present follow-up is deliberately a
different and bounded intervention:

- Only **explicit full Random and New Seed** commands set a quiet timer,
  never a rotation/slider/text gesture, scoped change, Undo, cache nudge
  or PNG export. Any other recipe render cancels that timer.
- After **300ms without another Random**, consider preemption only if the
  actual active preview Worker is still painting a **different art key**
  from the genuine latest queued job, and the obsolete job is at least
  **240ms old**. A **2-second restart cooldown** bounds repeated churn.
  The normal same-recipe 170ms provisional→settled upgrade is untouched.
- The replacement Worker is constructed and handlers bound **before**
  retiring the old one; failed replacement construction preserves the
  original functioning worker and queue. Old Worker message/error
  callbacks are generation-guarded; any transferred late bitmaps are
  closed and cannot free the new active slot. Existing startup watchdog
  and reference renderer fallback remain authoritative.
- No recipe field, material grain, mask, pixel quality, original artwork,
  server, thumbnail FIFO or export Worker has changed.

The reusable [source-matched A/B harness](../scripts/randomize-worker-quiet-ab-browser.mjs)
serves the exact original-main commit and candidate **on the same real
Chromium runner**, using the same production-generated seeds for a single
Random and four rapid Randoms at 320×700 and 412×892. It checks final
canonical seed, art key, **SHA-256 of actual displayed canvas pixels**,
real Worker request/completion and bounded Worker generation count.
The browser is touch-emulated; this remains distinct from a physical Pixel.

First actual [same-run A/B #41388984339](https://github.com/gamesbyian/wallgen/actions/runs/41388984339)
passed all 12 real input journeys. A harness-only URL mapping failure was
fixed before this test, and it did not exercise production code.

The stricter independent [A/B with displayed-canvas pixel SHA
#41389321233](https://github.com/gamesbyian/wallgen/actions/runs/41389321233)
also **passed every A/B source/pixel/Worker assertion**:

| Source / 4 Randoms | Baseline after last click | Candidate after last click | Relative |
| --- | ---: | ---: | ---: |
| **42-ray radial sand, 320×700** | **5723ms** | **2193ms** | **61.7% less** |
| **42-ray radial sand, 412×892** | **5780ms** | **2167ms** | **62.5% less** |
| Textured repeating loops, 320×700 | 406ms | 452ms | +46ms (short control) |
| Textured repeating loops, 412×892 | 2124ms | 368ms | −1756ms (obsolete-work case) |
| 14 stone regions, 320×700 | 244ms | 255ms | +11ms (short control) |
| 14 stone regions, 412×892 | 246ms | 253ms | +7ms (short control) |

The radial/sand single-click settled durations stayed comparable: 320×700
**2489ms→2472ms**; 412×892 **2515ms→2524ms**. The two short-region
single-click controls were 246→248ms and 241→235ms. Every candidate
**single-click** used **zero replacement Workers**. Every heavy radial
**four-click burst** used **exactly one replacement** and had **zero
obsolete completed paints after the last tap**, while each baseline
had one obsolete completion consuming ~3.9 seconds after the last tap.
Short loop/region bursts required zero replacements. The earlier
[source-only first A/B](https://github.com/gamesbyian/wallgen/actions/runs/41388984339)
independently observed ~62–63% radial burst reductions in both viewports.

Final visible canvas SHA-256 hashes were identical per recipe across
versions at both sizes: radial sand
`59e9487672c2d9f9fa49fce8e2fe0c06ec367ec057276d1c74e2b6d0d8505b63`,
loops `54f92f48b21c709726563511fd67601ce5364350f47a6c4499fd4b9bbf74c06a`,
regions `311fda3f8abe295dbf98e9afc9367d0b86e88121cb7938a6a920d72f43348107`.
Worker-unit tests independently cover old-generation bitmap closure,
cooldown/young jobs, normal same-source upgrade and replacement allocation
failure. No output-pixel differences were detected.

**Conclusion scoped strictly to the pinned burst:** a targeted quiet-period
replacement can recover roughly **3.5–3.6 seconds** otherwise lost waiting
for a superseded 4.6–4.8s synchronous paint. The final true settled
~1.8–1.9s paint remains expensive; do not describe this as a universal
63% speedup or as physical phone thermal/IME validation. The prior general
immediate worker-restart rejection remains valid for its own tested scope.
The temporary proof workflow was retired after this acceptance; ordinary
required CI at the final clean head remains a separate merge gate.

**Negative sand microfacet research:** [#1008](https://github.com/gamesbyian/wallgen/pull/1008)
passed 22 pixel comparisons but had no repeatable warm radial speedup
(650.5→649.5ms); [#1009](https://github.com/gamesbyian/wallgen/pull/1009)
passed 28 pixel comparisons but its apparent 439.5→423ms first-run
radial gain reversed to **655→669ms** on an independent same-source
runner. Both were closed *without* production code. Do not recycle them
as accepted sand rendering improvements.

## Source-identical settled Worker stage profile (2 November 2026, PR #1012)

[Actual Ubuntu Chromium job #41444558536](https://github.com/gamesbyian/wallgen/actions/runs/41444558536) exercised the **original production Worker** plus an instrumented, *HTTP-served-only* copy of the **same committed renderer**, with six alternating settled paints per case. Instrumentation is never committed to the production Worker or painter. All 24 A/B trial pairs (pinned 42-ray sand at 600×1300 and 372×806, plus textured loops and 14+-region controls at 600×1300) had **byte-identical decoded raw ink and background ImageBitmap SHA-256 and dimensions**. Profiles are Linux Chromium, not real Pixel 6 Pro thermals.

For pinned canonical Random seed `1pyivby-tpkh85` at 600×1300, instrumented median phases were scene+setup **6.8ms**, source geometry **49.5ms**, material painting/blending **1,222.6ms** (of which the sand material painter was **1,201.4ms**), and **finished compositing 512.4ms**. The six actual unmodified settled Worker durations were **2018, 1785, 1781, 1812, 1950, 1790ms**. At 372×806, material painting remained near **1,187ms** and finished compositing was **329.4ms**. By contrast, full-size control loop finished compositing was **3.8ms** and 14+-region finished compositing was **13ms**. This is source-specific, not a general renderer average. The paired instrumented version adds small and variable clock overhead; individual isolated stage medians need not sum to the baseline wall-time median.

**Actionable hypothesis:** in `src/render-worker.js` the settled preview calls `drawWallpaper(surface,recipe,{cache,skipPhoto:true})`, which paints expensive **final foreground shadow/atmosphere/text** on the Worker-local destination even though only the separate immutable `cache.background` and `cache.ink` ImageBitmaps are transferred. The main thread already calls `presentNudgedArtwork()` to composite those layers, including the final shadow/atmosphere/Photo/text. Test a narrowly named `skipPresentation` option **only for cached settled Worker previews**, after background and ink ownership are complete, to omit redundant destination canvas finishing. Require original-base-vs-candidate bitmap pixel identity, genuine end-to-end presented canvas and comparable single-click/burst timings, plus exact-head quick CI. Retain direct `drawWallpaper` and export output unchanged. Independently pursue the remaining measured ~1.2s material paint cost only if a source-identical improvement is reproducible.

The one-off workflow intentionally triggered the CI *small-workflow-menu* policy on its exploratory head; remove it before any merge and rerun the required exact-head quick check.

## Failed settled destination-paint shortcut, measured and rejected (2 November 2026, PR #1013)

The [real same-run original-main versus candidate Chromium #41445618596](https://github.com/gamesbyian/wallgen/actions/runs/41445618596) tested the specific #1012 instrumentation hypothesis. The modified settled Worker omitted redundant-looking final destination draw calls after producing its immutable cache, while the original branch kept them. **All 28 seven-pair actual settled Worker ink/background SHA-256 and dimensions matched**, along with original nudge overhang, **full native 3024×6552 PNG byte identity** (3,169,484 bytes, SHA-256 `619f826f3390280465d91dc9ba2273a8cfd6b54944b11a53f82a653d83330f25`) and real final displayed Canvas pixels after both single and four-click Random actions at 320×700 and 412×892. The test also checked actual Worker art-key identity and single/burst restart bounds.

But **latency did not improve**. Pinned radial sand 600×1300 settled paint: seven-trial median **1,776ms original versus 1,795ms candidate**, with candidate faster in only **1/7** interleaved trials. At 372×806: **1,540ms versus 1,575ms**, candidate faster **0/7**. Other scene controls were neutral or marginally slower; real-click radial results were mixed and within run noise (320×700 single 2559→2539ms, burst 2343→2213ms; 412×892 single 2502→2515ms, burst 2183→2167ms). No compelling whole-Worker or end-to-end improvement survived despite identical art.

**Conclusion:** the 512ms `finished-composite` marker in #1012 cannot be interpreted as 512ms of *independently removable work*. Canvas implementation synchronization/flush moving to bitmap transfer is a plausible explanation, **not directly measured proof**. The whole Worker / real input acceptance overrides the microstage hypothesis. **PR #1013 is closed without merging any production change.** Its one-off workflow was retired. The reusable [exact-source Worker/PNG paired acceptance](../scripts/settled-worker-cache-ab-browser.mjs) is retained for future hypotheses. Investigate actual sand material painter cost (about 1.2s measured in the 42-ray scene), rather than rerunning the previously rejected #1003/#1008/#1009 grain arithmetic or the #1013 discarded-composite idea. Linux Chromium remains distinct from physical Pixel thermals.

## Native Canvas2D operation count: mineral paint submission dominates (2 November 2026, PR #1015)

[Actual Chromium production Worker method-count proof #41447077317](https://github.com/gamesbyian/wallgen/actions/runs/41447077317) painted four unchanged, pinned real Random sources before and after adding **only in-memory Canvas2D prototype forwarding/counters** in that Worker. Both actual returned ink/background raw bitmap SHA-256 values and dimensions and nudge overhang stayed **exactly identical** in every scene. The same original `render-worker.js` and `renderer.js` bytes were used before and after; there is no proposed production interception. Counts are diagnostic and counted-worker timings are *not* performance comparisons because instrumentation adds call overhead and JIT/warm state varies.

| Scene | `fillRect` calls | `lineTo` calls | Other notable calls |
|---|---:|---:|---|
| **Pinned 42-ray sand mandala, 600×1300** | **1,780,575** | **429,280** | 42 fills, 1,432 strokes |
| **Same source, 372×806** | **1,784,191** | **429,459** | 42 fills, 1,433 strokes |
| Textured handmade loops, 600×1300 | 359 | 17,364 | 30,030 arcs, 30,044 fills |
| 14+-region stone, 600×1300 | 330 | 368 | 6,151 arcs and fills |

This resolves why repeated arithmetic micro-optimisations #1003/#1008/#1009 had no durable gain: the expensive sand scene issues **~1.78 million source-owned translucent Canvas2D rectangles** at both settled resolutions. The operation counts establish work volume, **not a CPU versus GPU time breakdown**. Existing #1012 stage timings identify ~1.2s in the actual sand material painter; the material's six independently coloured, potentially overlapping mineral facets per grain are not safely replaceable by a simple opaque or per-colour `Path2D` union. Painter-order and alpha accumulation matter. Do not pretend batching preserves identical pixels without a genuine full-scene optical proof.

**Next evidence-driven proposals:** characterize which material source crops and fixed 30%-per-side nudge overscan contribute unnecessary primitive submission; consider an opt-in/architecturally shared fast material submission strategy only if it can reproduce exact ink/background and full native PNG across camera zoom, crop, rotation, grain blend, holes/islands and lighting. Do not reduce grain density or quantize source coordinates as an unannounced performance shortcut. Repeat real mobile click-to-visible acceptance, not just microbenchmarks, for any change. Actual Pixel 6 Pro thermals remain unverified.

The initial one-off run failed in the diagnostic HTTP server after attempting to send 404 headers; the server was corrected, [the second run succeeded](https://github.com/gamesbyian/wallgen/actions/runs/41447077317), and the disposable workflow was removed before integration.

## Quantified 30%-per-side settled nudge-cache overscan (2 November 2026, PR #1016)

[Actual production Chromium Worker #41448051364](https://github.com/gamesbyian/wallgen/actions/runs/41448051364) compared the **same pinned real Random recipe** `1pyivby-tpkh85` at exactly **600×1300 output pixels** in two distinct legitimate modes: interactive preview without nudge cache and settled preview with the existing **±30% source extension**. It counted real native Canvas2D operations via an in-memory prototype forwarder, first rendering each mode in the identical unmodified Worker *before* installing method counters. Instrumentation preserved the complete raw interactive-frame bitmap SHA-256 independently and both settled transferred ink/background SHA-256 values, dimensions and exact cache overhang. Do **not** interpret interactive and settled bitmap hashes as interchangeable: the two modes intentionally have different cache/presentation contracts.

| Same 42-ray sand source, output 600×1300 | Interactive (no cache) | Settled (±30% cache) |
|---|---:|---:|
| Actual native `fillRect()` calls | **700,536** | **1,780,575** |
| `lineTo()` operations | 283,799 | 429,280 |
| Other `stroke()` operations | 820 | 1,432 |
| Source-bound native rectangle ratio | 1.00× | **2.5417×** |

The exact **1,080,039 additional native rectangles** are primarily source-area work. A 30% pad on **both** axes creates theoretical source-area factor `(1+0.3+0.3)^2=2.56`, closely matching the 2.542× observed, with crop/rounding/rotation effects. This is evidence of redundancy relative to *immediately visible* artwork, **not** evidence that any of those marks can simply be deleted while preserving the owner's instant nudge behavior, zero-seam original geometry or source coordinates. The interactive frame is a different architectural presentation path and its one recorded Worker time is **not** a controlled same-semantics speed comparison. Counted prototype-wrapper durations remain non-authoritative for performance.

**Next architectural experiment, acceptance contract before code:** stage full fixed-overscan immutable cache generation behind an immediately valid canonical center crop (with correctly aligned material/world geometry and original settling quality), while ensuring instant nudge never shows unpainted margins or silently changes UX. Candidate approaches include the exact source-anchored edge slabs retained as independently composited cache tiles, or background-generation of full cache with atomic swap; avoid a parallel renderer or physically incorrect per-color batching. First determine whether sand source crops can be partitioned into disjoint pixel-space output tiles without antialias seams, alpha changes, lighting drift or shared-source bounds artifacts. The current material compositor paints grain source coordinates and uses crop-dependent raster surface scaling, so **exact pixel identity cannot be presumed** for tiled rendering. Seek actual paired center/full PNG and nudge images with fixed scenes at 320×700, 412×892 and native resolution, plus repeated real Random-to-visible timing and nudge-on-pending tests. Reject if nudge gets slower/incorrect or the second stage steals interactive worker time. Physical Pixel 6 Pro validation remains separate.

Temporary dedicated workflow retired after successful proof. Reusable method-count harness now checks the same-size interactive-versus-settled source workload in addition to the original four-scene settled controls.

## Same-resolution full early Worker image versus settled cache: optical gap (2 November 2026, PR #1017)

The [real original-production Chromium optical comparison #41448726742](https://github.com/gamesbyian/wallgen/actions/runs/41448726742) tested a prerequisite for immediate full-size center presentation while the ±30% nudge cache is built. It used the **unchanged** production `render-worker.js`, three alternating repetitions of each mode for three pinned genuine Random seeds, exactly **600×1300 pixels** throughout. The initial full-size native `interactive` Worker ImageBitmap was compared **per pixel** with the same recipe's actual cached background/ink composed via the existing `presentNudgedArtwork()` function. Each mode reproduced its own SHA-256 deterministically across its three trials, with no browser errors or alpha differences.

| Real Random source | RGB pixels different (of 780,000) | Maximum channel delta | RGB channel MAE | Full-size interactive Worker times | Settled-cache Worker times |
|---|---:|---:|---:|---|---|
| **42-ray sand** | **14,689 (1.88321%)** | **9** | **0.01721** | 840, 720, 720 ms | 1843, 1766, 1837 ms |
| Textured handmade loops | 5,569 (0.71397%) | 3 | 0.005148 | 145, 156, 124 ms | 241, 227, 226 ms |
| Stone/regions | 5,351 (0.68603%) | **57** | 0.03905 | 95, 72, 71 ms | 111, 111, 101 ms |

Original sand full-size direct SHA-256 `1c7b146ff06916f4746518a59f2be277cca077eca82c24b8a9da0089899ebc62`; settled/canonical `59e9487672c2d9f9fa49fce8e2fe0c06ec367ec057276d1c74e2b6d0d8505b63`. For sand, **12,832 of 14,689** changed pixels differ by only 1–2 RGB units; another 1,856 by 3–8 and one by 9. Regions have larger local differences, so a universal imperceptibility claim is unjustified. No image source or rendering code changed. These are exploratory in-run Worker timings without independent runner replication, **not** a proven end-to-end Random speedup.

**Verdict:** a same-size direct Worker frame is a possible *provisional* preview improvement, but is **not source-pixel identical** to the authoritative overscanned settled image. Do not cache it as canonical, eliminate the final settled frame, claim exact PNG identity, or silently transfer it into instant-nudge assets. Exactness is currently broken even at the same output resolution for these three cases, likely requiring a proper diagnosis of source crop/raster phase and whole-picture compositing; causes are not yet individually proven. A future temporary full-size provisional trial must compare actual first-visible and final-visible, assess phone memory, battery/thermal workload, and confirm the 170ms settled upgrade and correct nudge/Undo/interruption behavior. If enough visual differences remain, it may be an acceptable *explicitly provisional* UX trade-off only after owner acceptance, not an invisible 'exact' optimization.

The one-off CI workflow was retired; the opt-in original-source optical harness is retained as evidence and a reproducible non-equality gate.

## Full-size Random provisional trial rejected: initial responsiveness regresses (2 November 2026, PR #1018)

The original [real source-matched input A/B #41449489883](https://github.com/gamesbyian/wallgen/actions/runs/41449489883) and [independent real mobile-sized A/B with provisional dimensions and first-visible events #41449828297](https://github.com/gamesbyian/wallgen/actions/runs/41449828297) tested changing the explicit Random/new-seed provisional from **62% (372×806)** to **100% (600×1300)**, leaving non-Random gestures, the exact settled cache, the export painter, worker ownership and the quiet-period obsolete-job replacement unchanged. Both actual Chromium runs passed **all final real displayed-canvas SHA-256 equality** checks for the pinned 42-ray sand, loops and regions sources at 320×700 and 412×892. Real Worker request timelines confirmed actual preview dimensions, final authoritative art keys and bounded source-aware restarts.

But first-visible full-size provisional frames were **slower**:
| Real Random case / viewport | Existing 62% first visible | Candidate 100% first visible | Change |
|---|---:|---:|---:|
| **42-ray sand, 320×700** | **705ms** | **778ms** | **+73ms** |
| **42-ray sand, 412×892** | **700ms** | **792ms** | **+92ms** |
| Loops, 320×700 | 174ms | 180ms | +6ms |
| Loops, 412×892 | 158ms | 228ms | +70ms |
| Regions, 320×700 | 74ms | 131ms | +57ms |
| Regions, 412×892 | 84ms | 103ms | +19ms |

Even the source-matched radial settled single-click final time regressed in the second test (320×700 **2490→2569ms**, 412×892 **2477→2582ms**). Burst outcomes were mixed. The full-size interim art is sharper, yet as independently documented in #1017, it differs slightly from the canonical overscanned final image and therefore remains explicitly provisional. The measured first-visible latency regression is unacceptable as a performance optimisation; on-device memory and thermals could be worse and were not measured.

**Disposition:** PR #1018 closed **without merging the app's single-line resolution change**; the one-off proof workflow removed. Retained original-source random A/B harness fields for provisional requested dimensions, actual provisional Worker paint and first-visible frame latency, so subsequent experiments cannot conceal a regressions behind matching final pixels. Preserve the existing 62% Random provisional, correct single/burst worker replacement policy #1010, instant nudge caches and unchanged export fidelity. A new source-preserving mechanism must reduce paint work at the material/crop level before revisiting preview resolution.

## Exact visible viewport from partially painted full-overhang sand (2 Nov, PR #1021)

[First original-production Chromium A/B #41521154111](https://github.com/gamesbyian/wallgen/actions/runs/41521154111) and [expanded source/position/zoom/multilayer proof #41521680862](https://github.com/gamesbyian/wallgen/actions/runs/41521680862) tested an **HTTP-only diagnostic patch of the original renderer**, keeping the full overscan canvas dimensions, material raster origin and resolution, actual Worker, production presentation and native PNG path. Only sand material enumeration is restricted to the rotated visible source bounds plus 24 design units; the expanded proof accounts for the current nudge offset. No production painter code was modified.

All real paired tests at 600×1300 and 372×806 produced **bitwise identical fully presented visible Canvas2D pixels** for the original 42-ray scene. Expanded checks at two maximum nudge offsets, zoom/pan, beaded sand and two rotated mineral layers also retained exact visible pixels in all source-matched pairs. Native export 3024×6552 was byte-identical (3,169,484 bytes, SHA-256 619f826f3390280465d91dc9ba2273a8cfd6b54944b11a53f82a653d83330f25). Worker paint median (base→diagnostic) in the independent run: pinned sand 600×1300 **1,833→1,146ms** (37.5% faster), 372×806 **1,560→912ms** (41.5%), zoom/pan **1,138→787ms**, beaded **1,746→1,097ms**, rotated dual sand **4,938→2,788ms** (~43.5%). +30/−30 displaced was **1,753→1,427ms**. Single-environment paired Worker times, not replicated real Random-button or physical phone timings.

**Critical boundary:** the cached ink outside the visible viewport is intentionally incomplete in the experiment. Presenting this result as a fully settled, instant-nudge-ready cache would show missing material if the user subsequently nudged. This is a proven exact-visible **subset** of rendering, not an accepted whole-cache optimisation or lossless staged cache. A staged design must finish and atomically publish full immutable ink before enabling instant nudge, respect worker cancellation, retain source/world phase and all complete-cache/PNG/Undo/Photo invariants, and avoid background work stealing interaction time. No global crop shortcut may merge without those tests.

The independent **background-only** coverage case (fixed background not moved with ink) is potentially safe with no partial cache. A separate production A/B [PR #1022](https://github.com/gamesbyian/wallgen/pull/1022) is checking *entire* background and overscanned ink bitmap SHA-256, overhang and native export, not just the visible viewport. Keep this diagnostic harness as an opt-in exact-output reference.

## Accepted whole-cache speedup for background-only sand (2 November 2026, merged PR #1022)

[Real Chromium original-main versus production-candidate A/B #41522371468](https://github.com/gamesbyian/wallgen/actions/runs/41522371468) checked **eight** fixed canonical scenes, five alternated source-matched pairs each (40 real settled Worker comparisons). Candidate accelerated only layers with **coverage = background** and a sand material (mandala, beaded, filigree). The world-coordinate enumeration uses a conservative 24-design-unit pad around the rotated visible viewport, but retains the **original full material surface allocation, raster scale, origin, scratch-to-background sampling and all nudge/ink transforms**. Foreground and both-coverage sand, all other materials and normal exports still paint the full source. No recipe dialect or worker protocol change.

For every one of the 40 A/B pairs, both the *entire overscanned ink* and *entire fixed background* ImageBitmap RGBA SHA-256/dimensions and nudge overhang were exactly identical. The actual native 3024×6552 PNG remained byte-identical at 3,169,484 bytes, SHA-256 619f826f3390280465d91dc9ba2273a8cfd6b54944b11a53f82a653d83330f25. Thus unlike partial-viewport PR #1021, **the full immutable cached nudge input is intact**, so no staged-cache UX trade-off is introduced. Tests included both screen sizes, extreme current offset, zoom/pan/rotation, beaded sand, foreground-only sand and non-sand controls. Initial source-structure quick CI required updating the pre-existing sand-lighting regex to assert the new variable bounds plus unchanged lighting call; the corrected code passed [exact-head required CI #41523756315](https://github.com/gamesbyian/wallgen/actions/runs/41523756315), after the temporary specialty workflow was retired. [PR #1022](https://github.com/gamesbyian/wallgen/pull/1022) is merged at commit c7bce258499228fa8ee8a670bd69c52060ea8fb0.

| Actual fixed-background sand scene | Original median Worker | Candidate median Worker | Paired win count |
|---|---:|---:|---:|
| 600×1300 pinned 42-ray | 1,805ms | **1,135ms** (37.1% less) | 5/5 |
| 372×806 pinned 42-ray | 1,579ms | **921ms** (41.7% less) | 5/5 |
| Maximum current nudge | 1,753ms | **1,106ms** (36.9% less) | 5/5 |
| Zoom + rotated material | 1,367ms | **777ms** (43.2% less) | 5/5 |
| Beaded background sand | 1,569ms | **929ms** (40.8% less) | 5/5 |

The stripes-only sand control performed essentially unchanged (1,837→1,856ms, −1.0% in this one run), as intended. These values are scene-conditioned **Linux Chromium Worker** paint measurements, not global Random-click gains, screen frame rate, actual Pixel thermals or memory evidence. A real latest-seed Random event remains bound by its preview and scheduling phases. Do not generalize the accepted crop to sand applied to movable stripes or both coverage; #1021 only proves exact **visible** pixels with incomplete nudge ink for those modes. Any future staged-background/foreground cache proposal must preserve full-margin nudge correctness with real source-matched bitmap and UI acceptance.

## Center-first source-aligned tile completion: near-exact, still rejected as a cache (2 November 2026, PR #1024)

[Real Chromium diagnostic #41525063907](https://github.com/gamesbyian/wallgen/actions/runs/41525063907) and [independent complete-RGBA discrepancy localization #41525538304](https://github.com/gamesbyian/wallgen/actions/runs/41525538304) tested a temporary HTTP-served replacement of only the material-painter call. For **movable stripe sand**, the test retained the original complete raster surface dimensions, transformation, colour/seed and working scratch buffers, painted a visible-source center tile first, and then painted four source-aligned top/bottom/left/right strips with a 24-design-unit facet halo. The tiling rect edges were snapped to the material raster pixel grid. The accepted background-only optimisation was left untouched; non-sand sources remained unchanged. The original and candidate real production Workers were paired 3 times per fixed source, with final normal compositor presentation, actual whole ink/background bitmap hashes, changed-pixel bounding boxes and native export hashes.

The full-cache equivalence hypothesis is **not accepted**. Fully presented sand at default position is bitwise identical in several sources, but a rotated, displaced sand source differed by two visible pixels (one RGB level). Whole cached-ink ImageBitmaps differ in tiny but nonzero regions: 600×1300 sand **9 changed offscreen pixels** (8 with alpha differences, max channel delta 28), 372×806 sand **1 pixel** (alpha, max 23), rotated+nudge **3 pixels** (2 alpha, max 12), rotated dual-sand **4 pixels** (4 alpha, max 23). The fixed background ImageBitmaps were **bit-identical in all five cases**, including non-sand loops control (whole ink also exact). Native 3024×6552 PNG bytes match exactly; it uses the unchanged direct export path. The measured synchronous tiled Worker was not consistently faster (e.g. 372×806 sand 1624ms single-pass versus 1661ms tiled), and its timer values are not valid staged UI latency projections.

**Conclusion:** same-surface source-aligned subdivision can reproduce virtually all pixels, but integer-aligned Canvas2D clips plus independently enumerated facet neighborhoods do **not yet** guarantee an exactly identical complete movable cache. Do not call this an accepted progressive cache, loosen exact pixel gates, use the tile cache for user nudges or add a new Worker protocol on its basis. The localized 1–9 source-image pixel anomalies are a worthwhile narrow next experiment; test precise coordinates against each raster-grid clip boundary and affected facet to distinguish clipping coverage from missing cross-tile marks. A possible future overlapping tile/scratch+pixel-exact commit approach must preserve alpha accumulation and output ordering, pass complete cache pixel SHA at multiple camera/nudge settings and be measured as full UI latency. This branch adds no production code and retains an optional original-source diagnostic only; its dedicated workflow was removed after testing.

## Movable sand: device-pixel clip and full-field control disprove two simple causes (2 November 2026, PR #1027)

The [original-production vs HTTP-served device-pixel-clipped tiles Chromium proof #41542254521](https://github.com/gamesbyian/wallgen/actions/runs/41542254521) preserved the original complete-sized material raster, original transform, grain source positions and 24-design-unit halo, but created the five tile clipping rectangles under the **identity Canvas2D transform at integer backing-pixel boundaries** before restoring the material transform. Three paired actual Worker paints per scene at pinned sand 600×1300, 372×806, rotated +30/-30 nudge, dual-sand, and non-sand loops reproduced the same complete-ink discrepancies as the old transformed-logical clip experiment #1024:

| Original vs device-pixel-tiled cached ink | Changed pixels | Alpha-changing pixels | Visible changed pixels |
|---|---:|---:|---:|
| 600×1300 movable sand | **9** | 8 | 0 |
| 372×806 movable sand | **1** | 1 | 0 |
| 372×806 rotated/nudged sand | **3** | 2 | 2, RGB level 1 |
| 372×806 dual-sand layers | **4** | 4 | 0 |
| Non-sand loops control | **0** | 0 | 0 |

All five complete fixed-background caches matched, and real direct 3024×6552 PNG export remained **exactly byte-identical**, 3,263,842 bytes SHA-256 `840cf7b15356324aee19fb9ba8d1561d6fb7bc208d650b4d97a0a20763294ea9`. This disproves the hypothesis that the earlier 1–9 pixel difference was merely a fractional logical-space tile clip edge. The workflow initially required a small diagnostic receipt-directory correction; that is test harness history, not a product failure.

A second [real Chromium full-grain-field control #41543549160](https://github.com/gamesbyian/wallgen/actions/runs/41543549160) then kept those same device-pixel tile clips but enumerated the **entire original full source material bounds for every tile**, rather than each independently clipped tile+24-unit halo. One original/experimental pair for the smaller sand and rotated/nudged sand cases produced **the exact same one and three cached-pixel differences**, including the same two visible 1-level RGB changes. This rules out insufficient crop-based grain/facet enumeration in those tested scenes. It deliberately repeats much more material work and therefore cannot be a production-speed candidate (the two exploratory paired Worker times were 1,557→2,968ms and 1,871→4,692ms).

**Disposition:** there is still **no pixel-exact complete movable-sand cache partition**. Do not alter production painter, use a partial nudge cache, call these two refinements accepted, or lower the original complete-ink SHA gate. The remaining discrepancy is tied to **subdivision of drawing/clipping/compositing** itself, or another partition-specific effect, not simply snap coordinates or the 24-unit enumeration halo. Next bounded research needs actual source pixel-level ownership along cut edges, alpha accumulation and real Canvas2D primitive edge coverage. Preserve the previously merged exact background-only #1022 optimisation and original #1010 burst scheduling. These Chromium results are separate from physical Pixel performance, GPU/thermal and a live staged-worker UI.


## Exact movable-sand scratch tile transfers and first-tile readiness (2 November 2026, PR #1028)

**Mechanism and causal finding:** Previous [#1024](https://github.com/gamesbyian/wallgen/pull/1024)/[#1027](https://github.com/gamesbyian/wallgen/pull/1027) single-surface Canvas2D clipped center/border passes left 1–9 changed full cached-ink pixels, including visible one-channel differences on a displaced rotated source. They remained after integer-device-pixel clipping and even when every tile enumerated the *entire original source grain field*. The new [actual Chromium Worker A/B #41556115139](https://github.com/gamesbyian/wallgen/actions/runs/41556115139) retained original full material-canvas dimensions and source-world transforms, but painted each tile's complete grain field on a separate cleared scratch surface **without any clip**, then committed just its nonoverlapping integer-device-pixel core into the canonical material surface. Both raw `putImageData` and normal 1:1 `drawImage` reproduced the **entire** original ink and background ImageBitmap pixels, exact presented RGBA, at 372×806 and rotated/nudged 372×806. The whole-source-per-tile control was intentionally slow: roughly 1.7–2.6s original vs 6.4–10.6s test. This establishes clip-time rasterisation/subdivision effects as causal within the tested pipeline, but not a precise Chromium implementation root cause.

**Bounded source enumeration, still exact:** [Chromium #41556414100](https://github.com/gamesbyian/wallgen/actions/runs/41556414100) restricted each tile's grain enumeration to the existing 24-world-unit halo while preserving one original-size scratch coordinate system and 1:1 pixel-core transfers. All **five** matched production Worker cases (600×1300 sand, 372×806 sand, 372×806 rotated +30/−30 and 37° material, two sand layers, and non-sand loops) had **0 different cached ink pixels, 0 background differences, 0 different visible pixels and 0 alpha changes**. One original/candidate pair per scene: 600×1300 1841→1662ms; smaller and multi-layer scenes were slower. Those are individual Worker samples, not a verified speed win. The native export path was intentionally untouched and had already passed byte-identical 3024×6552 verification on source-matched prior #1027.

**Compact-tile scratch negative control:** [Chromium #41556703442](https://github.com/gamesbyian/wallgen/actions/runs/41556703442) allocated only each tile's pixel dimensions and translated the material transform by integer pixels. Despite 1:1 transfers, it **failed complete pixel parity**: 94, 44, 45 and 79 changed full-ink pixels across the four sand cases (68, 31, 32, 56 alpha-changing), with 8–14 altered visible pixels of at most one RGB level. Non-sand remained exact. A changed raster origin is not an innocuous memory optimisation: floating transform/rasterisation quantisation matters even with integer-valued destination offsets. This compact candidate was rejected; no new recipe or painter is shipped.

**One reusable original-size scratch surface with *tile-only* clearing:** [Chromium #41557024257](https://github.com/gamesbyian/wallgen/actions/runs/41557024257) reused the same original raster scratch and reset only each tile's core before drawing its cropped grain field, avoiding redundant full-frame clears. All five matched original Worker ink/background/visible comparisons again had **zero pixel or alpha differences**. One-sample Worker timings: 600×1300 1671→1543ms, 372×806 1171→1370ms, rotated 1775→2017ms, two sand layers 3857→4259ms. The method has **correctness evidence**, not globally improved settled-paint evidence. It incurs an extra material raster canvas; browser-runner timing and memory cannot stand in for actual Pixel 6 Pro thermal/heap behaviour.

**Why progressive paint remains interesting:** [3-pair real Worker timing #41557664114](https://github.com/gamesbyian/wallgen/actions/runs/41557664114) instrumented the exact tile-only-clear candidate *without altering rendered pixels*, using the original worker start clock and the first completed visible-center material tile. Both tested sources retained identical complete ink/background/visible outputs in **all six comparisons**:

| Source | Median first center material tile ready from Worker request | Median whole candidate Worker response | Candidate material-paint total | Original full Worker |
|---|---:|---:|---:|---:|
| 600×1300 sand | **657ms** | 2088ms | 1392ms | 1919ms |
| 372×806 sand | **638ms** | 1803ms | 1386ms | 1606ms |

These times prove that material pixels for the first center tile exist well before final Worker response, but **not** that a correct, composited and visible wallpaper can be shown at those times. **Crucial prior production baseline:** existing **62%-size provisional Random** already displayed the heavy 42-ray sand scene at **705ms (320×700) and 700ms (412×892)** in the source-matched browser test [#41449828297](https://github.com/gamesbyian/wallgen/actions/runs/41449828297), while a **100%-size provisional trial regressed first-visible and final latency** and was rejected as [#1018](https://github.com/gamesbyian/wallgen/pull/1018). The new **638–657ms** result is an *incomplete material tile inside the Worker*, BEFORE provisional composition/transfer/main-thread presentation. It therefore has no demonstrated user-visible response advantage over the current 700ms provisional, and could be slower. Treat a staged renderer as **low priority** until a real application A/B proves improvements beyond current 62% first-visible and settled behavior; prioritize reduced full settled material draw work. The presenter currently consumes *complete immutable* ink/background layers. A provisional image would need all applicable source geometry, other material layers, lighting, text/Photo and scene scope dealt with deliberately; source/Undo/locks and nudge caches must remain owned by the existing renderer, with stale Worker responses disposed generation-safely. Do not send an unmasked half-painted cached ink as if it were canonical; do not claim a 1.2–1.4s user-visible latency gain.

**Disposition and next gate:** This PR preserves only the optional `scripts/sand-tile-scratch-transfer-proof.mjs` QA harness and these dated observations. Its one-off expensive browser workflow is retired before integration. **No production renderer, Worker protocol, art, recipe, geometry or cache semantics change.** Next, only if justified by a user-visible perf goal, design a limited preview-only staging protocol with exact final pixel SHA, no partially committed nudge cache, proper cancellation/timeout/ownership, actual 320×700/412×892 Random taps and source-matched first-*visible*-frame timing. Require full native PNG and multi-layer optical checks before any production merge. Preserve accepted #1010 guarded Random Worker cancellation and #1022 exact background-only sand speedup.

## Accepted narrowly scoped production speedup: floating movable sand ink-footprint crop (2 November, PR #1029)

The shared material painter previously enumerated sand mineral facets over the full **±30% overhang cache** even when the real authored floating ribbon occupied only a small subset; the finished material was then masked to the already painted source ink. This was a real work-volume issue distinct from the earlier arithmetic micro-optimisations that lacked measurable gain. The accepted candidate keeps the *same* original material raster dimensions, source scale, world-space origin, lighting, canvas-mask/compositor order and transparent complete nudge cache. For a **settled** render only, when the scene is `structure=paths`, `composition=floating`, the material is one of `sand-mandala`, `sand-beaded` or `sand-filigree`, and that material layer has **`coverage=stripes` only**, it inspects the alpha footprint of the actual already painted vector ink, maps that bounded *pixel-space observation* back to source/material-world corners and adds a conservative **24 authored-world-unit halo** for fringe and resampling. No recipe field or pixel-based author control is added. The same ink alpha scan is reused across eligible ordered layers. Failure to read pixels leaves the original **complete source crop** rather than taking a guess at a smaller region. The source art, nudge presentation, high-resolution export, background layers, both-coverage layers, interactive path and nonfloating compositions are intentionally unchanged.

The [first 8-scene true Worker prototype A/B #41560461026](https://github.com/gamesbyian/wallgen/actions/runs/41560461026) proved whole cached pixels and native export unchanged but rejected applying the crop to **all** movable sand: dense pinned 42-ray radial was neutral/slower (600×1300 1491→1499ms, 372×806 1246→1298ms), while sparse floating loop improved 332→96ms (71%). The [independent 11-scene in-memory source A/B #41561256926](https://github.com/gamesbyian/wallgen/actions/runs/41561256926) established the floating-only gate, one alpha scan, 18/18 floating pair wins and unchanged controls. The tested patch was then promoted into the actual production `src/renderer.js` and compared to its immutable PR-base `src/renderer.js` with **the same Worker/model/material dependency bytes**, rather than trusting a synthetic alternate painter.

**Final original-vs-production source acceptance:** [15-scene actual Chromium Worker A/B #41562621304](https://github.com/gamesbyian/wallgen/actions/runs/41562621304) PASS. Three interleaved real Worker A/B trials for each of 15 fixed canonical scenes, with **identical full transferred ink/background RGBA SHA-256, dimensions, cache overhang** in every pair and byte-identical actual **3024×6552 PNG**, 11,052,929 bytes, SHA-256 `2cfcaf6305d4c68e8bf8f146e401727765e031b6290d9235fb31fed821d0fc91`. Six dense/both/background/non-sand controls were essentially unchanged. All **nine** eligible floating-sand scenes were faster in **27/27** paired trials:

| Real floating sand source | Original Worker median | Candidate median | Improvement |
|---|---:|---:|---:|
| Short loop, 600×1300 | 281ms | **86ms** | **69.3%** |
| Short loop, 372×806 | 263ms | **49ms** | **81.4%** |
| Rotated/nudged loop | 428ms | **61ms** | **85.7%** |
| Normal-length loop | 896ms | **214ms** | **76.2%** |
| Long Hairpin | 905ms | **242ms** | **73.3%** |
| Two sand layers | 1009ms | **121ms** | **88.0%** |
| Daylight, zoom and pan | 256ms | **60ms** | **76.5%** |
| Mirrored moonlight | 436ms | **143ms** | **67.1%** |
| Beaded sand and glow | 769ms | **187ms** | **75.7%** |

These are **real Linux Chromium source-matched Worker settled-paint** times, not first-click-to-visible, exhaustive scene quality, physical Pixel 6 Pro battery/memory/thermal or sustained use claims. A full-resolution sand run that fills the design source does not gain 70% from this change. The renderer retains mandatory source/crop integer safeguards, and new quick-suite source-policy regression enforces the limited eligibility and complete-paint fallback. The temporary A/B workflow must be deleted before exact PR-head CI and merge; the standalone script remains opt-in for reproducing these figures. Do not revive failed #1003/#1008/#1009 hash, #1013 discarded-final-composite, or #1018 full-resolution provisional preview experiments. Future work should measure real mobile user-visible randomize, handsets and a separately supported hot path for dense 42-ray sand.

## Dense 42-ray sand occupancy economics: reject alpha-readback culling (2 November 2026, PR #1031)

The [actual Chromium OffscreenCanvas Worker diagnostic #41579176408](https://github.com/gamesbyian/wallgen/actions/runs/41579176408) ran the unchanged production sand painter with a **read-only probe immediately after radial source geometry and before material layers**. The [first diagnostic attempt #41578851777](https://github.com/gamesbyian/wallgen/actions/runs/41578851777) inherited the Random source's unpinned coverage, so its activation assertion failed **before any occupancy measurements**; the fixture was corrected to explicit `textureCoverage='stripes'` in the subsequent successful run. The resulting material geometry and nudge-overhang were left unchanged; it did **not** attempt a culling mutation. Each pin was rendered twice and its instrumented cached ink/background pixel SHA was deterministic across the two samples. Because the probe is read-only, it does not itself demonstrate cross-build GPU raster parity against a separately uninstrumented Worker, which would be required for a real implementation.

The candidate was a **conservative ink-alpha occupancy grid** at 16, 32 and 64 authored-world units. The probe obtained the real already-drawn ink pixels via `g.getImageData`, transformed every nonzero alpha sample back into the first sand layer's original rotated material coordinate system, and marked cells. It expanded occupied cells by a deliberately generous 40-world-unit neighborhood plus an extra grid cell to allow material facets and sampling support. These fractions are exploratory *upper bounds* on skipped grain candidates, **not a verified safe grain rejection predicate**.

| Pinned 42-ray settled Worker | Ink pixels with alpha | Optimistic empty fraction, 16-unit cells | 32-unit cells | 64-unit cells | Readback | Scan | Dilation | Whole diagnostic |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 600×1300 (+30% cache margins) | 1,649,733 / 1,996,800 | **17.43%** | 12.64% | 7.98% | **515.5ms** | 78.6ms | 4.1ms | **598.6ms** |
| 372×806 (+30% cache margins) | 702,855 / 768,840 | **16.75%** | 11.82% | 7.72% | **288.8ms** | 59.9ms | 2.2ms | **351.3ms** |

The instrumented complete Worker times were about 1.6–1.9s at 600×1300 and 1.3s at 372×806, including the probe. Readback alone dominates occupancy calculation and can cause accelerated Canvas2D to switch to CPU rendering in Chromium. Do **not** reinterpret the timing as a representative accelerated base Worker comparison. These are Linux Chromium timings, not actual phone GPU/thermals.

**Decision:** **reject alpha-readback, raster-grid dense radial grain culling for production.** Even its generous 16-unit optimistic bound skips only ~17% of the material-source field, and a 0.35–0.60-second cost must be recovered first. The earlier rectangular [#1029](https://github.com/gamesbyian/wallgen/pull/1029) crop was neutral/slower for dense radial and is correctly restricted to sparse floating stripe-only sand. Avoid introducing new cache semantics, cell-based recipe controls, readbacks or broad per-grain rejection predicates on this evidence. A future *source-vector-derived* spatial index without readback may be independently examined if a specific real workflow justifies it, but density suggests limited upside without changing the grain painter architecture. More useful next measurements are genuine 320×700/412×892 Random first/final-visible latency and physical Pixel 6 Pro sustained thermals/memory, retaining the already accepted 62% provisional, nudge cache and native export.

The opt-in deterministic probe is retained for causal remeasurement; its disposable Chromium CI workflow is removed after this evidence. No production rendering code or recurring CI is changed.
