# Inverse vision: algorithm reuse, evaluation and implementation backlog

## First executable evidence · 24 October 2026 (merge candidate)

[PR #704](https://github.com/gamesbyian/wallgen/pull/704) implements the first **read-only, dependency-free distance-field/topology oracle** and the GHA-only **VTracer vector comparison runner**. Genuine Chromium/CLI [run 40167263389](https://github.com/gamesbyian/wallgen/actions/runs/40167263389) passed eight focused tests and five actual current-renderer R0 source versus current-canonical versus VTracer comparisons. Independent optically inspected images and numerical measurements are recorded in [first genuine-art findings](RECONSTRUCTION-VTRACER-GENUINE-ART-FINDINGS-2026-10-24.md). A temporary heavy PR workflow trigger was removed after the proof, leaving manual opt-in GHA only. No external dependency, new ranking metric, imported vector recipe or inferred Hue mask integration is shipped; real Pixel/creator acceptance remains open.

**Next specific Agent 1 hypothesis:** expose source read-only existing per-hue masks through the shared importer, test measured EDT/medial-axis ribbon width and negative spaces against genuine Hairpin #05 and Loop #06, then trial any source-backed parameter constraint in the normal ≤6+10 true-render budget. Avoid wholesale importing VTracer's 107-path Loop and avoid duplicate HSV segmentation.

Status: research and test-ready proposal, 24 October 2026 (Calgary). Owner: Agent 1 / issue #557. This is a subordinate plan, **not** a second work queue. Validate against live main before implementing. No library has yet been integrated or benchmarked under this plan.

## What exists on main, and why this is a focused extension

As inspected at `b2262838f9815b5a3a1a2c7604977dc25d907132` (commit immediately preceding this branch), the authoritative modules are:
- `src/image-path.js`: bounded raster import, background estimate, HSV-to-canonical-seven masks, per-hue connected components, PCA/covariance moments, colour-region descriptions, contour/holes and compound-region geometry, centreline proposals and simple Hough-like line extraction, exposed-circle-arc and visible painter-order hypotheses, repeated translated silhouettes and clipped-tail coherence gates.
- `src/image-reconstruction.js`: alternative canonical scene proposals, radial/curve/ribbon descriptors, 96x208 low-resolution actual-`drawWallpaper` score (RGB absolute error .75 plus brightness/coverage error .25), ≤6 initial true renderer calls and one ≤10-trial lock-projected refinement; cooperative browser and synchronous/headless paths.
- `src/image-path-ui.js`: bounded at most 600px import, cancellable browser import and previews; source preservation and existing path/shape/recipe application.
- `scripts/evaluate-reconstruction-r0.mjs`, `scripts/review-reconstruction.mjs` and existing `tests/image-reconstruction.test.js` / `tests/reconstruction-r0*.test.js`: truthful metadata-free source versus renderer output with original truth sidecars only for later evaluation.

The product already supports seven editable hue shapes, multi-island compound shapes with holes, visible overlapping circles and genuine Jagged #16 source-backed recovery. Do not rebuild masks, canonical geometry, importer, renderer, recipe serialization, history, locks, or provenance. The retained R0 findings are evidence, not a license to generalize beyond actual art.

At planning time the active #557 work includes draft PR #692 (cropped-pigment width profile). Check PR/issue state at implementation time; do not cherry-pick older #683/#690 without reconciling merged main. Agent 2 owns typography; Agent 3 owns integration and mobile acceptance.

## Strategic principles

1. Make **better source-derived hypotheses before spending real painter calls**. Keep ≤6 coarse + ≤10 refinement `drawWallpaper` calls and canonical candidate normalization until source-backed evaluation warrants change.
2. Separate (a) visible appearance geometry, (b) compact procedural explanation, and (c) provenance of what is actually known. Source-invisible backfaces, original seeds, materials, unique layer ordering and historic controls are never claimed as recovered.
3. Two useful candidate families: **appearance-first** canonical portable compound contours (exact observable hues, connected components, holes) and **procedural-first** editable Draw / Wave / Jagged / Hairpin / Loop / radial scene controls. Both must use existing scene representation and export/Undo; appearance-first is not a pixel overlay.
4. Distinguish **offline independent evaluation oracles** from production dependencies. GHA may use Rust/Python/OpenCV binaries for comparison; Pixel portrait Chrome should not pay WASM, model download or heap costs without a demonstrable visual win.
5. Existing 7-slot scattered semantic hue order can fail to encode disconnected, missing *non-leading* hue slots and arbitrary mixed pigments. Check representability with `normalizeRecipe` + `resolveScene` before inverse-only hacks. Canonical-model changes require shared ownership review.

## External projects to trial (version/license audit before dependency adoption)

| Project / underlying algorithm | Specific reuse | Initial location | Integration decision |
|---|---|---|---|
| [VTracer](https://github.com/visioncortex/vtracer) / visioncortex | Colour/edge-aware vector tracing, layered/shared boundaries, curve fitting, path simplification; compare compact SVG contours with existing `shapeEdgeLoops` | Opt-in pinned CLI in Linux GHA or container; no production code | Benchmark genuine PNG triplets, no default dependency until better visible silhouettes and sensible memory/size |
| [scikit-image morphology](https://scikit-image.org/docs/stable/api/skimage.morphology.html) / medial axis and skeletonization | Curved ribbon skeleton, independent black-gap/loop topology, local tangent and sampled transverse width | Offline Python oracle; then minimal JS if successful | Maintain branches/cusps; avoid skeleton-only representations of thick regions |
| [Felzenszwalb–Huttenlocher EDT](https://cs.brown.edu/people/pfelzens/papers/dt-final.pdf) | O(WH) Euclidean distance-to-mask boundary, per-hue signed boundary distances, width profile and bidirectional Chamfer edge score | Tiny JS/Node prototype against masks; Python oracle | Adopt only on bounded analysis images with performance/cancellation measurements |
| [Clipper2](https://github.com/AngusJohnson/Clipper2) / [JSTS](https://github.com/bjornharrtell/jsts) | Robust polygon intersect/union/difference, holes, offsets and visible overlap constraints; distinguish cropped from occluded shapes | Offline/reference geometry fixture comparison | Inspect licensing/port, avoid shipping complete geometry runtime for a narrow operation |
| [OpenCV imgproc](https://docs.opencv.org/4.x/d3/dc0/group__imgproc__shape.html) | Contour hierarchy, component stats, Hu moments and normalized shape descriptors, fitEllipse, shape matching | Offline cross-validation; no OpenCV.js bundle initially | Use it as a ground-truth *algorithmic comparator*, never assert inferred source truth |
| [fit-curve](https://github.com/soswow/fit-curve) / Schneider cubic fitting | Lower-complexity editable Bezier centreline preserving measured curves | JS local bounded trial | Corner detection before smoothing; Jagged sharp turns must remain sharp |
| [scikit-image segmentation](https://scikit-image.org/docs/stable/api/skimage.segmentation.html) (SLIC/watershed) | Muted/textured/external pigment boundaries prior to mapping to seven semantic hues | Offline tests on independently authored permissibly used graphics | Never silently classify neutral pixels as rainbow or invent palette/source treatment |
| [scikit-image registration](https://scikit-image.org/docs/stable/api/skimage.registration.html) / phase correlation | Subpixel translational alignment alternative to `measuredJaggedPixelShift` ±6 exhaustive offsets | GHA experiment | Only keep if wins on real aligned/nonaligned controls within budget |
| [scikit-image texture features](https://scikit-image.org/docs/stable/api/skimage.feature.html) / Gabor, LBP, co-occurrence | Candidate grain direction, periodicity, texture scale; unsupported Photo/material may still refuse | Offline separate low-priority track | No original material identity claims; measure against actual material images |
| [WebSAM](https://github.com/Xevion/WebSAM) / browser segmentation | Opt-in assisted object mask on arbitrary imported photos | Future exploratory only | Not a default download, not a blocker for geometric R5; benchmark privacy/heap/latency on physical Pixel before any opt-in release |

Preserve package/license provenance, pinned versions, reproducible install, no opaque model weights copied into repository, and compatibility with GHA lean policy. Confirm precise upstream license/availability on adoption; research links alone are not approvals.

## Experiment A: GHA independent vectorization oracle (highest priority)

**Input:** `scripts/review-reconstruction.mjs` or established R0 corpus metadata-free PNGs; preserve source PNG byte/IDAT identity, existing truth sidecars and honest external/no-truth manifest. Cases must include Jagged #04 and displaced #16, mirrored cropped Jagged where independently evidenced, Hairpin #05, Loop #06, Draw, seven circles with overlaps, fourteen islands, compounds with holes, synthetic adversarial false shared-stamps, and independent V/soft-wave/colour-island SVGs rendered to PNG.

**Steps:** (1) pin VTracer version and license, invoke out-of-process in an **opt-in** workflow or documented reproducible local runner; (2) convert resulting SVG to a neutral geometry descriptor *only for comparison*, without importing untrusted SVG into the app; (3) report SVG path counts, points, holes, unexpected islands, mask IoU by hue, edge distance, CPU seconds, peak RSS, source/fitted/full-size PNG visual pairs; (4) manually review the best and most dangerous regressions; (5) if and only if proven superior, propose a small browser-compatible extraction adapter respecting existing `normalizeCompoundRegion` and `cloneGeometrySnapshot`.

**Reject** if it flattens holes, merges distinct hues, violates cropped-tail restrictions, floods contour point count, confuses source provenance, or raises cold mobile costs without a material visible win. No dependency or default GHA PR check until the experiment passes.

## Experiment B: medial axis + local width model (highest priority)

For a binary pigment mask `M`, define inward Euclidean distance `D(p)=min_{q∈∂M} ||p-q||₂`. On a pruned skeletal curve, `2D(p)` estimates local ribbon width. Infer a sampled normal/tangent per point and compare each hue's medial curve and width profile, retaining separate inner/outer boundaries where a Hairpin or Loop folds back.

- Produce debug-only skeleton graph with endpoints, crossings, cycles, branch lengths, thickness quantiles and black-channel widths; explicitly flag branches touching crop boundaries.
- Use source hue masks from the existing `extractImageColourRegions` pipeline, not a second competing HSV classifier. Prototype with offline oracle first; implement bounded JS only if physically/source-renderer verified.
- Evaluate case #05 Hairpin's independent U legs and narrow negative space, case #06 Loop's inner ring and crossing against control Wave/Jagged and natural holed compounds.
- A skeleton can be nonunique or unstable on small aliased pixels: preserve full observed contours, uncertainty and source-provided occupancy. No hidden-strand/order invention.

## Experiment C: shape/topology-aware scoring (high priority)

Current `compareReconstructionPixels` must remain the permanent A/B comparator. Add an experimental metric `E = wc E_RGB + wm E_mask + we E_edge + wt E_topology`, calibrated on already-reviewed genuine source/fitted pairs **without truth parameters exposed to candidate selection**.

- `E_mask`: seven-hue Dice/IoU and non-rainbow foreground/negative-space agreement, with explicit absent-hue treatment; avoid rewarding blank sources.
- `E_edge`: symmetric distance-transform Chamfer on observed pigment boundaries, normalized by frame diagonal; guard missing masks and crop edges.
- `E_topology`: per-hue connected components, holes/Euler characteristic, black-channel separation, visible-overlap intersections where known; never score invisible topology as factual.
- `E_RGB`: existing sampled RGB+ink score, retain original numerical baseline; test optional perceptual Lab/ΔE offline only if material/photo hue variations demonstrate benefit.
- Score each of the SAME six actual-rendered candidates without additional `drawWallpaper` calls. Retain telemetry-only score fields initially. Compare ranking inversions by optical review, not by a single synthetic aggregate.

R0 reporting should include both original error and candidate metric vector, provenance, source-render truth floor where available, and any false positive. A strong gross RGB win may lose due to topology; do not auto-ship weights until visually approved and no-regression controls pass.

## Experiment D: occlusion and curve extraction (medium priority)

Study Clipper2/JSTS boolean reference outputs on known geometry; derive only source-visible region adjacency / hole / crossing constraints. Validate explicit painter precedence as a partial order with ambiguity when unobservable. Apply compact cubic fitting to existing simplification output with hard-corner preservation and source→render pixel comparison. Reject uncontrolled topology rewrites or a second canonical object vocabulary.

## Experiment E: optional image/material recognition (later, independent)

Watershed/SLIC/texture histograms on permissibly authored non-native graphics; RGB/HSL/HSV should not be forced to a canonical hue where evidence is weak. WebSAM only as opt-in local photo segmenter after offline/on-device measurements. Avoid claiming source materials, hidden pixels, original fonts or seeds.

## Acceptance, automation and artifacts

- Keep lean default PR `npm run check:quick`, no permanent heavyweight screenshot/model jobs; use workflow_dispatch/ephemeral workflow for independent browser+CLI evidence and remove temporary workflows before merging.
- Each experiment must deliver source/current-candidate/experimental-candidate **real current-renderer** PNGs, a machine-readable table (per-case old/new metrics, segment topology, timing/heap, 6+10 render count), full-size 3024x6552 PNG+recipe round-trip spot check after any recipe integration, visual review notes, and meaningful adversarial/held-out tests.
- No duplicate importer or re-rendering approximation: `drawWallpaper` is the only forward truth, with Node/Chromium parity checked. Browser cooperative cancellation; locked-setting projection, Undo and PNG/JSON recipe provenance remain intact.
- Distinguish evaluation platforms: Linux GHA/Chromium/Skia observations are **not** Pixel 6 Pro touch, battery, thermals, TalkBack or Android IME acceptance.
- Report **negative outcomes** and abandon algorithms that do not improve genuine images. Promote small wins via focused PRs coordinated with Agent 1 #557 and Agent 3 for merging.

## Immediate ready-to-run handoff

1. Refresh live main/issue #557/PR #692 and merged crop predecessors; establish unchanged R0 reference images and immutable manifests first.
2. Create one opt-in VTracer comparison harness on a focused branch; do **not** change user-facing imports or add default CI.
3. Develop an independent distance-transform + skeleton descriptor experiment against Hairpin #05 and Loop #06 while VTracer tests run.
4. Instrument experimental mask/edge/topology score vectors on existing candidate renders, never changing winner selection until genuine artwork review.
5. Choose only independently demonstrated improvements for production, with source/old/new PNGs and issue #557 report. Maintain a strict fail-closed representability gate for unsupported pigments/occlusion.

Related: [current queue](CURRENT-WORK-QUEUE-2026-10-24.md), [reconstruction plan](IMAGE-TO-RECIPE-RECONSTRUCTION-PLAN-2026-10-22.md), [engineering ownership](ENGINEERING-REUSE-AND-SEMANTIC-OWNERSHIP.md), [lean CI](CI-OPERATIONS-2026-10-22.md), [issue #557](https://github.com/gamesbyian/wallgen/issues/557).
