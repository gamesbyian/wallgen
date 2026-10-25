# Genuine R0 art: first VTracer/EDT research receipt

**Owner:** issue #557. **PR:** #704. **Run:** https://github.com/gamesbyian/wallgen/actions/runs/40167263389. **Evidence:** uploaded artifact r0-vtracer-source-fit-optical (ID 12588808518).

**Observed 24 October 2026 Calgary / 25 October UTC:** One-shot GHA job succeeded: eight exact EDT/topology and vector driver tests passed, pinned VTracer 1.0.0-alpha.4 Linux CLI binary hash was verified, five genuine current-renderer R0 source PNGs were generated, existing canonical six-candidate/ten-refinement fitting ran, and each immutable metadata-free input was independently vectorized via VTracer cutout/spline/simplify=1. The SVG results were rasterized in real Chromium and evaluated using the **same 96×208 production RGB+brightness error function**. No source truth sidecar was read during inference.

| Artwork | Canonical error | VTracer error | Vector error improvement | SVG paths | SVG bytes | VTracer execution |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| #05 Hairpin | .08447790975 | .02005738594 | 76.3% | 16 | 10,190 | 164 ms |
| #06 Loop | .04977316648 | .02404494250 | 51.7% | 107 | 25,074 | 195 ms |
| #16 displaced Jagged | .05872150343 | .01174703054 | 80.0% | 73 | 22,905 | 141 ms |
| #18 compound holes/islands | .00547218687 | .00298860530 | 45.4% | 22 | 4,719 | 64 ms |
| #22 reversed occluded circles | .00467571644 | .00308837277 | 33.9% | 8 | 4,152 | 79 ms |

**Comparator caveat:** Vectorization traces *visible pixels*, whereas the canonical fitter reconstructs editable, sometimes procedural objects subject to genuine scene and palette constraints. Lower VTracer image error is **not** proof of equivalent or superior editable ROYGBIV reconstruction, correct hidden paint order, true seed, or renderer semantics. CLI timing excludes independent Chromium comparison and downloads; never infer phone performance.

## Direct optical inspection of downloaded production artifacts

Downloaded the original GHA artifact archive. Opened **matched-display-scale** source/canonical/vector image triplets, and larger vector images, directly. This is independent assistant optical inspection, not owner creative signoff.

- **Hairpin:** VTracer follows the separate narrow rainbow bands and the black inner U-shaped channels markedly more closely. Current canonical fit visibly rounds and broadens the bottom turn and compresses pigment gaps. A true medial-axis/per-hue normal-width profile is a promising source-derived *constraint* before more renderer searches.
- **Loop:** source detail and winding rings are visibly closer in the VTracer SVG than the current fit; but **107 paths** expose substantial small fragment/oversegmentation cost around crossings and interior. Do not convert those into editable shapes without a robust grouping and topology contract, or invent invisible painter precedence.
- **Displaced Jagged:** VTracer retains sharp source zigzags and visible clipped tails. The existing seven imported canonical stamp hypotheses already substantially fit and permit editing; VTracer cannot reveal crop-hidden contours or original phase.
- **Compound holes/islands:** all visible holes and small detached satellites survive, both in current canonical result and VTracer tracing. Already near native source baseline; importing 22 independent SVG paths would be less semantically economical than seven established editable hue objects.
- **Overlapping circles:** seven visible disks and overlap colours remain recognizable with both implementations. VTracer does not recover the original order of invisible contours. Current inverse exposed-circle-arcs and acyclic visible precedence remain authoritative.

**Scope:** The dependency-free EDT/topology/edge-Chamfer module was independently validated on analytic and brute-force binary masks, but not yet run on actual per-hue source masks. Shared Hue masks currently live within the canonical importer; propose exposing opt-in read-only masks via Agent 1 rather than implementing another HSV classification pipeline. No VTracer-to-canonical adapter, full-resolution inferred-recipe round trip or physical Pixel testing was performed. No production reconstruction behaviour changed by this experiment.

## Source integrity receipts

Each imported metadata-free PNG was SHA-256 hashed and verified byte-identical after vectorization:
- #05: 07191250e83819230c3bb51a20e7bd451e7665f22391cdaac8f4f4be92589a10
- #06: e058aeac099c47f5a9f19cc3e576763b3317da85f171d375955eeddf0dbadc52
- #16: 19d5b10fb1a52ff026626ce4e3533308e3635a01836329e710d2825085be81dd
- #18: f9c57276ed6b1e0171979c9f6dec7813a37f7ae10c27355c2cccf604ad7dd0da
- #22: ab82462282a7dad905ce1902923b1fcc68d33d952751f4f09d851951d78a72d3

## Disposition and next focused hypothesis

**Keep** EDT/topology diagnostic, tiny lean quick tests and opt-in pinned VTracer workflow. **Remove** temporary PR-trigger before integration; default PR CI must not acquire Chromium/Cargo/artifacts.

Next Agent 1 experiment: expose a read-only in-memory view of the existing shared per-hue masks, measure medial-axis/width/black-gap graph on genuinely rendered #05 and #06, trial only lock-safe canonical Hairpin/Loop parameter hints inside the unchanged six plus ten true-render painter budget. Recheck unrelated Jagged, circle and compound controls. Full source/before/after PNGs need direct optical review before integration. Later compare shared boundaries/Schneider cubic fitting if those address reproduced defects. Do not promote VTracer wholesale or force ML downloads on the phone.

See [parent research plan](RECONSTRUCTION-VISION-ALGORITHM-REUSE-AND-TEST-PLAN-2026-10-24.md), [experiment guide](RECONSTRUCTION-EDT-VTRACER-FIRST-PROOF-2026-10-24.md), [lean CI](CI-OPERATIONS-2026-10-22.md).
