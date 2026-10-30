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

## Next falsifiable intervention

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
