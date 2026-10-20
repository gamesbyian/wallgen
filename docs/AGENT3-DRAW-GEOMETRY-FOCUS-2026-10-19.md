# Agent 3: drawing, geometry and advanced editing fidelity ledger

**Date:** 2026-10-19 (America/Edmonton). **Branch:** `agent3-draw-geometry-focus-20261019`. **Review:** [PR #267](https://github.com/gamesbyian/wallgen/pull/267). **Base:** `4f900d8f6fe5f4dd5c1ed114d1777d8d3a393659` on `main`.

This lane owns the four **unchecked** acceptance statements in `docs/UI-REDESIGN-IMPLEMENTATION-QUEUE.md`: camera/export geometry, complete Draw lifecycle, extrapolation/crossing order, and Focus versus All controls. Do not infer completion from the number of tests, mock fixtures, or CI green alone.

## Before and after, evidence actually added

| Requirement | Evidence already on main | New bounded check in this PR | Remaining independent gate |
| --- | --- | --- | --- |
| Camera, zoom, Fit, native dimensions and source geometry across structures | Merged #146 world-space camera fix, #172 native/direct raster source comparison, #189/#211 native downloads, #206 all five UI camera journeys, #260 textured native sample | New `redesign-draw-geometry-matrix.test.js` performs five named structure fixtures × five zoom values × three pan positions, comparing entire generated stripe arrays (75 invariance checks), native vs 600×1300 world view bounds and output `3024×6552` metadata at each combination. Existing #206 remains authority for actual +/−/Fit/UI transitions. | Exhaustive generated conditions/materials/backgrounds, direct button-downloaded native pixel comparisons at each state, physical Pixel 6 Pro |
| Draw, Interpret, Points, Apply/Cancel, 10× | #263 actual saved anchor/corner/point Undo/Cancel/Apply across 412×892 and 700×412; #265 actual freehand Sketch → Geometric → Smooth → keyboard 10× → Cancel, plus Apply and path extension | Verifies deterministic 10× Smooth/Geometric normalized output (raw pointer samples unaffected). Local 10× point-resmoothing test moves an existing pin, verifies pin/corner identity and fixed samples, then commits through original `appliedDrawnPathRecipe`, preserving viewport pan/zoom, placement and source constraints. | Complete hands-on add/delete/move-handle/resmooth combinations, actual native hardware gestures, complete Undo/Redo permutations |
| Out-of-frame extension and Over/Under/Weave crossing | Existing `crossing-order.test.js` crossing math/mask unions; #211 actual off-frame Drawn native PNG | Real saved bow-tie stations extend beyond normalized 0–1; route through `prepareDrawnPath` and `pointOnDrawnPath` and assert interior transverse crossing is detected from the actual prepared curve. Test off-frame source point extension, clamping without extension and unchanged data through URL and embedded PNG. Modes retain original saved points and alternate traversal deterministically. | Full actual screenshot/output comparison of all crossing modes under patterned/three-layer materials, closure/overlap edge cases |
| Focus versus All, Path/Material/Colour, locked/inactive | `EDITOR-FOCUS-EXPERIMENT.md` defines opt-in source-backed slider, and prior browser checks verify Undo synchronization | `redesign-editor-focus-ab.mjs` performs the same one-step source adjustment twice using real Chrome keyboard and pointer controls from independent identical recipes; full normalized recipe equality and source-node availability are asserted. Tests Path inactive `shapeDepth`, locked Material `textureStrength`, Colour no-slider guidance and return to original `reverseStripes` checkbox. Captures task-level gestures: All = 2, Focus = 3 **after selecting the tool** for the sampled scalar operations. Screenshots + JSON are retained. | Human randomized/counterbalanced A/B sessions covering ease, accuracy, elapsed time, simultaneous comparisons, tool discovery and accessibility; **All remains default** |

The 10× **interpretive** smooth operation can legitimately reposition approximate stroke endpoints to fit an inferred line or arc; exact endpoint conservation applies to *manual anchor constraints*, not arbitrary high-strength interpretation. An initial test wrongly demanded exact 10× endpoints and failed. The assertion was repaired to test deterministic finite geometry and unmutated raw input rather than silently changing source artistic behavior. This is a clarified contract, not evidence of a production defect.

## Commands and artifact locations

```sh
npm run check
node --test tests/redesign-draw-geometry-matrix.test.js
npm install --no-save playwright@1.56.1 serve@14.2.5
npx playwright install --with-deps chromium
npx serve . -l 4173 &
node tests/redesign-editor-focus-ab.mjs
```

CI: `.github/workflows/agent3-mobile-acceptance.yml` runs all fifteen independent Chromium suites, including the new A/B, and the new geometry unit suite before browser setup. Its combined artifact retains `artifacts/agent3-editor-focus-ab/evidence.json`, before/after pictures, and all existing unrelated acceptance witnesses. A failed suite must fail the aggregate rather than being discarded. `npm test` in `npm run check` also executes the new Node matrix. Native download and raster parity retain their dedicated workflows.

## Decision and four separate verdicts

**Queue 5: PARTIAL, unchecked.** Camera and geometry invariants across all current *major* structures have much more source coverage; exhaustive native conditional outputs remain open.

**Queue 9: PARTIAL, unchecked.** A real saved edit and a genuine freehand draw lifecycle are independently established by merged prior PRs; this adds 10× and manual-source preservation assertions. The full editor state graph is not exhausted.

**Queue 10: PARTIAL, unchecked.** Off-frame path and weave/order math are covered by deterministic source checks. Native pixels at all order combinations are not established.

**Queue 11: MACHINE A/B EVIDENCE PENDING HUMAN SIGNOFF, unchecked.** The sampled task makes Focus cost one extra action but may offer larger/clearer adjustments. That cost is not equivalent to task-completion time, accuracy or user preference. Preserve the mandatory user-testing gate and the current **All controls** default.

Do not alter the four master checkboxes or market a 100% conclusion on the strength of this ledger.
