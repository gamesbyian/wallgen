# First R5 algorithm experiments: exact distance fields and independent VTracer evidence

**Issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557) • **Parent plan:** [inverse vision algorithm reuse](RECONSTRUCTION-VISION-ALGORITHM-REUSE-AND-TEST-PLAN-2026-10-24.md) • **Owner:** Agent 1 source integration; independent research branch for non-invasive metric evidence.

## What is implemented

1. `src/reconstruction-distance-field.js`: standalone, no-dependency bounded exact Euclidean distance-to-seeds in O(W×H), exterior-aware pigment half-width map, observed 4-connected pigment/8-connected background hole counts, IoU/Dice, symmetric boundary Chamfer. No hues, new scene model, image importer, rendering or UI changes. It does NOT choose reconstruction candidates. `tests/reconstruction-distance-field.test.js` cross-checks exact squared distances against brute-force oracle, crop edges, holes, detached islands and empty foreground.
2. `scripts/benchmark-reconstruction-vtracer.mjs`: opt-in source-immutable external CLI comparator. Checks VTracer binary version 1.0.0-alpha.4, reads *only* metadata-free PNGs from existing R0/external manifests (never the recipe truth sidecar), vectorizes with shared-boundary cutout and cubic simplification, hashes original source before/after, independently rasterizes SVG in real Chromium, scores using `compareReconstructionPixels` from the current production module, and writes PNG/SVG/JSON/HTML evidence. Its score is **appearance fidelity for vector tracing**, NOT proof of correct canonical recipe semantics, hidden contours or source provenance.
3. `.github/workflows/reconstruction-vtracer-experiment.yml`: targeted optical workflow that first generates genuine renderer-authored R0 source PNGs, evaluates canonical recipe fitting, runs pinned VTracer, prints comparable RGB/ink scores and uploads all source/fit/vector artifacts. The experimental PR hook should be removed after first inspected run, leaving `workflow_dispatch` only; unrelated PRs do not need Rust/Chromium.

**Repo source:** [image import](../src/image-path.js), [canonical fitter](../src/image-reconstruction.js), [R0 generator](../scripts/review-reconstruction.mjs), [current evaluation](../scripts/evaluate-reconstruction-r0.mjs). No source truth is used by the benchmark runner. The ordinary painter remains the only *canonical recipe* forward renderer.

## Explicit opt-in commands

```bash
node --test tests/reconstruction-distance-field.test.js tests/reconstruction-vtracer-oracle.test.js

# Browser + original-current-renderer evidence, not a Node synthetic picture:
npm install --no-save playwright@1.56.1
npx playwright install chromium
node scripts/review-reconstruction.mjs --out-dir artifacts/reconstruction-r0 --only 05-hairpin,06-loop,16-offset-jagged
node scripts/evaluate-reconstruction-r0.mjs --dir artifacts/reconstruction-r0
# Supply independently installed *verified* VTracer 1.0.0-alpha.4 CLI:
node scripts/benchmark-reconstruction-vtracer.mjs \
  --dir artifacts/reconstruction-r0 \
  --out-dir artifacts/reconstruction-vtracer \
  --only 05-hairpin,06-loop,16-offset-jagged \
  --vtracer /absolute/path/to/vtracer
```

Do not reuse output directories; each run owns immutable artifacts. The VTracer workflow downloads a version-pinned native archive and verifies its published SHA-256 before executing it. Source PNGs remain unchanged; recipe truth sidecars reside in the input corpus but are deliberately not accessed by VTracer.

## Interpretation / review matrix

- For #05 Hairpin, inspect the inner black U-channel and separation between outgoing and incoming legs, especially whether vector curves falsely close the gap.
- For #06 Loop, inspect centre hole, colour intersections and any wrongly connected strokes. Original painter precedence is not identifiable from invisible overlap.
- For #16 displaced Jagged, inspect edge/crop fidelity, pigment thickness profiles and sharp corners; current Agent 1 stamps may outperform smooth cubic fitting on semantic editability.
- For #18 compound stamps, verify holes, satellites, path count and whether disconnected components remain distinct.
- For #22 occluded circles, check source-visible layering boundaries without inventing hidden back shapes.

The report's `rgbInkError` is the same shape-independent low-resolution comparison formula used in canonical R0 scoring, but VTracer's vectorized output may be **much** closer visually while expressing nothing of ROYGBIV's procedural semantics. Compare as an extraction oracle rather than promoting its arbitrary SVG directly into `scatteredShape`.

Do not claim owner-art, real Pixel 6 Pro battery/heap/TalkBack/IME or human approval. Browser/Node/image scores alone cannot establish any of them. If the new visual experiment is green, choose one narrow source-backed adapter (e.g., width descriptor for Hairpin) only after direct inspection, not wholesale VTracer integration.

## Before merge

- Confirm source/fit/vector artifacts exist and can be opened directly; separate quantitative checks from optical judgement.
- Record the score deltas against pinned canonical baseline and negative counterexamples, including time and SVG complexity.
- Keep the clean small math tests in the lean quick gate.
- Remove the **temporary** PR-triggered heavy workflow stanza; retain manual `workflow_dispatch`, no new app dependency.
- Report issue #557 with exact results and known limitations. Independent Agent 3 integration/release and Agent 2 type ownership unchanged.
