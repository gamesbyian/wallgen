# Agent 3: drawing, geometry and advanced editing fidelity ledger

**Date:** 2026-10-19 (America/Edmonton). **Branch:** `agent3-draw-geometry-focus-20261019`. **Review:** [PR #267](https://github.com/gamesbyian/wallgen/pull/267). **Base:** `4f900d8f6fe5f4dd5c1ed114d1777d8d3a393659` on `main`.

This lane owns the four **unchecked** acceptance statements in `docs/UI-REDESIGN-IMPLEMENTATION-QUEUE.md`: camera/export geometry, complete Draw lifecycle, extrapolation/crossing order, and Focus versus All controls. Do not infer completion from the number of tests, mock fixtures, or CI green alone.

## Before and after, evidence actually added

| Requirement | Evidence already on main | New bounded check in this PR | Remaining independent gate |
| --- | --- | --- | --- |
| Camera, zoom, Fit, native dimensions and source geometry across structures | Merged #146 world-space camera fix, #172 native/direct raster source comparison, #189/#211 native downloads, #206 all five UI camera journeys, #260 textured native sample | New `redesign-draw-geometry-matrix.test.js` performs five named structure fixtures × five zoom values × three pan positions, comparing entire generated stripe arrays (75 invariance checks), native vs 600×1300 world view bounds and output `3024×6552` metadata at each combination. Existing #206 remains authority for actual +/−/Fit/UI transitions. | Exhaustive generated conditions/materials/backgrounds, direct button-downloaded native pixel comparisons at each state, physical Pixel 6 Pro |
| Draw, Interpret, Points, Apply/Cancel, 10× | #263 actual saved anchor/corner/point Undo/Cancel/Apply across 412×892 and 700×412; #265 actual freehand Sketch → Geometric → Smooth → keyboard 10× → Cancel, plus Apply and path extension | Verifies deterministic 10× Smooth/Geometric normalized output (raw pointer samples unaffected). Local 10× point-resmoothing preserves moved pins and constraint identities through `appliedDrawnPathRecipe`. `redesign-draw-advanced-acceptance.mjs` separately performs **physical** point taps, 10px keyboard anchor movement, corner toggling, Hide/Reenter, 10× Resmooth, Cancel, real tangent-handle dragging, midpoint insertion into a two-point path, and anchor deletion on **412×892 and 700×412 Chromium**, asserting exact source recipe reversibility and unchanged unrelated camera/composition state. The real freehand suite also exercises source `Draw again` before its second Apply. | Physical/browser coverage now includes each named operation in representative states; remaining: combinatorial variants, OS pointer cancel and native touch/stylus, complex arbitrary Undo/Redo interleavings |
| Out-of-frame extension and Over/Under/Weave crossing | Existing `crossing-order.test.js` crossing math/mask unions; #211 actual off-frame Drawn native PNG | Real saved bow-tie stations extend beyond normalized 0–1; route through `prepareDrawnPath` and `pointOnDrawnPath` and assert interior transverse crossing is detected from the actual prepared curve. Test off-frame source point extension, clamping without extension and unchanged data through URL and embedded PNG. Modes retain original saved points and alternate traversal deterministically. `redesign-crossing-pixels.mjs` also renders **actual production Canvas2D painted pixels** in each Over/Under/Weave mode, including a loop, a saved figure-eight and a third **off-frame** figure-eight, at 100% and 75% camera zoom; it requires pairwise distinct non-background painted pixels while all seven source stripe arrays remain identical. | Remaining: actual downloaded native PNG pixels for all modes/materials, textures/pattern complexity, unusual closed/retraced crossings and OS/device confirmation |
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

CI: `.github/workflows/agent3-mobile-acceptance.yml` runs all seventeen independent Chromium suites, including the new A/B, and the new geometry unit suite before browser setup. Its combined artifact retains `artifacts/agent3-editor-focus-ab/`, `artifacts/agent3-advanced-draw/`, and `artifacts/agent3-crossing-pixels/`, including `evidence.json` reports, implementation screenshots/PNG images, and all existing unrelated acceptance witnesses. A failed suite must fail the aggregate rather than being discarded. `npm test` in `npm run check` also executes the new Node matrix. Native download and raster parity retain their dedicated workflows.

## Decision and four separate verdicts

**Queue 5: PARTIAL, unchecked.** Camera and geometry invariants across all current *major* structures have much more source coverage; exhaustive native conditional outputs remain open.

**Queue 9: STRONG BOUNDED BROWSER EVIDENCE, unchecked.** Actual freehand sketch/Interpret/Draw again/Edit points and saved geometry now exercise corner, nudge, point Undo, 10× resmooth, real handle drag, insertion, deletion, Cancel and Apply at both 412×892 and 700×412. Full combinations/native hardware are still outside this gate.

**Queue 10: CHECKED, BOUNDED BEHAVIOR VERIFIED.** World-space extrapolation, source-immutable crossing geometry and painted Canvas2D order distinctions are qualified at two camera scales, with **real downloaded 3024×6552 off-frame Over/Under/Weave PNGs**, all with complete original normalized recipes and **zero sampled native/direct foreground pixel mismatches**. Stochastic textured permutations and physical Android remain explicitly separate *release-wide* gates.

**Queue 11: MACHINE A/B EVIDENCE PENDING HUMAN SIGNOFF, unchecked.** The sampled task makes Focus cost one extra action but may offer larger/clearer adjustments. That cost is not equivalent to task-completion time, accuracy or user preference. Preserve the mandatory user-testing gate and the current **All controls** default.

Do not alter the four master checkboxes or market a 100% conclusion on the strength of this ledger.

## Later independent integration, 2026-10-20 UTC

- **Green baseline head `eda0ab87dfa63c68ee3b675e06c82ed9fe8a6545`**: [full general validation](https://github.com/gamesbyian/wallgen/actions/runs/39377237064) and [17/17 actual Chromium acceptance](https://github.com/gamesbyian/wallgen/actions/runs/39377237162) passed. The latter recorded Draw advanced gestures at 412×892 and 700×412, including real tangent drag, and two crossing geometries × two zooms × three paint orders. Source geometry stayed identical and each pair changed **thousands** of actual coloured pixels rather than just a screenshot hash. All fifteen earlier browser suites passed on the same head.
- One earlier intermediate head [39377149131](https://github.com/gamesbyian/wallgen/actions/runs/39377149131) failed an *unchanged* More keyboard test when focus on `input[name=keywords]` at 320×700 landed at y=844 below the sheet end y=648. All 16 other suites, including Draw and crossing pixels, passed; the final green 17-suite head subsequently passed More without changing the navigation source. This intermittent keyboard occlusion was reported to controls-owner PR #268. Do not hide it or infer permanent resolution.
- Subsequent PR-branch additions: an off-frame self-intersecting path rendered through all crossing modes, a real Draw again reset, and Focus A/B at constrained 700×412 as well as phone 412×892. These **are not credited until their later CI head passes**.

## Genuine off-frame crossing Download milestone

On `40698caf331b9cd9d0d60b9e26010973a4d69c59`, [native Chrome CI 39377844451](https://github.com/gamesbyian/wallgen/actions/runs/39377844451) passed **eight** real clicked `#mobileDownload` 3024×6552 PNG files. Each image was browser-decoded, its IHDR and filename checked, its original normalized recipe extracted from actual PNG metadata and compared, and stable coloured foreground samples compared against a fresh 300×650 source Canvas2D render.

Three files used the **same 170-station off-frame crossing path**, extending left of zero and right of one, with `extendDrawnPath:true`, `viewZoom:.75`, and all source settings identical **except** Over/Under/Weave:

| Native crossing mode | Locally stable positions | Painted foreground | Pixel mismatches | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| Over | 1057 | 610 | **0** | `283be9ed1b19933b469ce753a8d452d9b38c510a61c609ead262bb3fc801ae47` |
| Under | 1081 | 634 | **0** | `8a5852ef3dba202839975b8d89500c04ced95dc4fa0758d20f7e36011cc1786b` |
| Weave | 1049 | 602 | **0** | `d2316a12adfb329def9ef23f09ea5d009b0c48eb282fb7c66958b77146cee2c2` |

This is genuine native downloadable PNG transport and painted pixel parity for the exact fixtures, not an exhaustive material/random seed proof. A later test addition checks all three files have unique full-file SHA-256 hashes and their complete normalized recipes differ only in the crossing choice; do not count that *additional assertion* until its exact CI run passes.

The [17-suite Chromium run 39377693618](https://github.com/gamesbyian/wallgen/actions/runs/39377693618) also passed a third **off-frame** self-intersecting real-render variant (three orders × 100%/75%), physical Draw again at both phone and short-landscape and a repeated phone/short-landscape Focus A/B with intact original recipe and disabled-state semantics. Newer checks demand resmoothing change visible *in the actual overlaid pixels*, pixel-exact local Undo, and one continuous fresh Draw→Interpret→Edit anchors→Apply gesture; those remain **pending their later CI head**.

**No default inspector change.** Human A/B approval remains separate regardless of machine gesture counts.

## Queue adjudication and runner limits, 2026-10-20

**Acceptance entry 10 has been checked in `docs/UI-REDESIGN-IMPLEMENTATION-QUEUE.md`**, using the passing [native download run 39377844451](https://github.com/gamesbyian/wallgen/actions/runs/39377844451) plus [production crossing-raster run 39377237162](https://github.com/gamesbyian/wallgen/actions/runs/39377237162) and source extrapolation/serialization unit tests. This is a claim about the *named* extension and crossing behaviors, not every downstream texture/OS variation.

**Acceptance entry 9 remains unchecked**, although the [green 17-suite run 39378143046](https://github.com/gamesbyian/wallgen/actions/runs/39378143046) established that actual 10× Resmooth changes overlay pixels and all earlier live source actions work. The [new continuous freehand Draw→Interpret→Edit anchor→Apply run 39378328111](https://github.com/gamesbyian/wallgen/actions/runs/39378328111) separately printed success records for both phone and landscape, but the aggregate was terminated by a **GitHub runner shutdown**, including its manual retry, before executing the *new* pixel-exact local Resmooth→point Undo assertion. Neither canceled attempt is credited as green for that assertion. Preserve it and run with a stable Actions slot.

The last clean full-suite head and last clean eight-file native head precede the extra pixel-exact Undo check. General validation passed on the later source heads. Reviewers should use exact green head/run identities, not the PR's latest SHA alone, when determining which regression requirements were executed.
