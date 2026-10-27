# Seven nested imported-shape contours: technical design and external reuse research

**Status:** Source-inspected implementation proposal, not a claim that a seven-rainbow nested imported-shape mode already exists. Companion [product requirements](NESTED-IMPORTED-SHAPE-PRODUCT-REQUIREMENTS-2026-10-27.md). Date: 27 October 2026 UTC. Existing code and tests checked against `main` at `245f0250`. Do not implement from an old checkout without refreshing source and current owner queue.

## The most important discovery: the good algorithm already ships

| Current module | What it actually provides | Why it is not yet this feature |
| --- | --- | --- |
| `src/polygon-inset.js`: `polygonInsetContours`, `polygonInsetScale` | **Signed Euclidean distance to original polygon/ring edges**, sparse candidate cells, marching-squares isocontours, even-odd holes, winding-independent erosion, multi-loop splitting, stable world-grid coordinates for camera crops | Current single-inset resolver recomputes distance/edges for every requested inset; default pitch can be 1.15–3.2 logical px, too coarse for guaranteed hairline/native-quality seven-layer work; no automatic inradius/fit diagnostics or per-level rainbow semantics |
| `src/interior-elements.js`: `drawRegionInteriors` | Shared actual Canvas renderer calls true `polygonInsetContours` with per-object cache of distances and clips to native imported shape; contour wave/zigzag/loop decorations via `src/contour-decoration.js` | **Only 2 contour layers for regions, 3 for radial; one colour/style per interior element**; original object fill remains visible; count/spacing/style cannot independently assign seven semantic hues; multiple decorative elements are not a proper one-click nested-spectrum design |
| `src/geometry-asset.js` + `src/scattered-composition.js` | Safe, portable, validated canonical **compound-region** with detached components, holes and even-odd fill; actual imported silhouette transformed into scene objects, including `object.rings`; shape library embeds its own snapshot rather than runtime IndexedDB references | Normal imported-region packing uses independent circumscribed-circle placement; seven placements of the same shape are **not** seven nested offsets |
| `src/composition-geometry.js`: `nested` | Existing geometric nested family paints successively smaller region silhouettes in palette order | This is **progressive radius/scale**, not seven Euclidean offsets of a creator-imported irregular compound silhouette |
| `tests/polygon-inset.test.js` and `tests/contour-decoration.test.js` | Actual unit tests for a rectangle's offset distances, concave dumbbell split, hole expansion, viewport open chains, determinism, contour decoration phase | No imported Delta/cloud **seven-level** width/spacing, realistic 4K optical stress, PWA memory or seven-semantic-palette acceptance |

**Important difference:** A rectangle reduced in both absolute width and height by `2*d` gives four inset straight walls at exactly `d`, assuming the original is axis-aligned and doesn't collapse. A non-circular ellipse scaled by subtracting `2*d` from width/height is **not** a true normal-distance ellipse offset. Offset curves at a sharp corner require a specified join rule; a *Euclidean distance-level set* naturally rounds convex corners, whereas a miter/straight-skeleton offset retains a sharp intersection (with a bounded miter to prevent huge spikes).

## Required canonical architecture, not a second engine

The **source of truth is the already normalized shape and current scene object**: `scatteredShape.geometry` / `scatteredShapeOverrides[]` → `buildScatteredObjects` → `scene.objects[]` with `object.rings`, `object.colorIndex`, `object.id`. The existing importer (`src/image-path-ui.js`) and library (`src/geometry-library-ui.js`) own selection of a local vector shape. **Do not create a second SVG runtime renderer, bitmap cache in recipe, image reconstruction candidate dialect, or eighth editor tab.**

Proposed new canonical, **versioned only through the existing `normalizeRecipe` path**:

```js
// PROPOSED data shape; NOT implemented in current main.
nestedShapeContours: [{
  id: 'nest-1',
  objectIds: ['scatter-0'], // stable scene object ID, validated; or selected shared imported shape
  enabled: true,
  count: 7,                 // 1..7, default 7
  firstInset: 3,            // logical 600x1300 design-space units
  strokeWidth: 1.5,
  gap: 3.5,                // visible edge-to-edge distance, not centreline gap
  fit: 'auto',             // auto | exact; exact may yield fewer visible levels
  mode: 'geometric',       // geometric | optical; optical separately guarded/opt-in
  join: 'round',           // initial support round; miter/bevel need real curve generation
  colourOrder: 'forward',  // forward | reverse
  background: 'outline-only' // outline-only | retain-base-fill
}]
```

Store no per-output-pixel path arrays or derived 7× loops in JSON. Keep the original asset snapshot and non-nesting object edits/Undo intact. Validate count/number bounds, target IDs, maximum 7 treatments per design and total computational caps. If source has no supported compound-region geometry, provide truthful disabled state. Use existing palette resolver to get all seven active hue colours instead of reconstructing RGB values from old metadata; for `count<7`, define deterministic palette mapping and label omitted slots.

**Targeting:** one imported-shape instance first. Existing scattered-object IDs and source `editCircle` resizing must remain stable. Sketch a small pure `src/nested-shape-contours.js` planner accepting already transformed `object.rings` and normalized options, returning `{levels, visibleCount, warnings, maxSafeInset, topology}`. The renderer, UI and export share this same *pure deterministic* planner, not independently guessed canvas values.

**Rendering:** in existing `drawRegionObjects` allow outline-only paint mode only for targeted imported regions; otherwise keep legacy fill/material/embroidery exactly unchanged. In `drawRegionInteriors` or a focused sibling (called by the same renderer), stroke each offset centreline in its semantic spectrum colour using `ctx.lineWidth`, `ctx.lineJoin`, `ctx.miterLimit`, `ctx.stroke`, `ctx.clip('evenodd')` as appropriate. Drawing must not inadvertently stroke open clipped chains as closed or allow a later fill to erase earlier rainbow levels. If a clipping rule hides the first centreline's half-stroke, use `firstInset>=strokeWidth/2+epsilon` and warn, rather than moving the source boundary. Preserve exact camera and photo finish and direct/worker/headless color/pixel parity. Treat accessibility/selection as one editable imported shape with optional nesting parameters, **not seven overlapping draggable instances**.

## Geometry planner and failure policy

1. **Normalize** the original visible closed compound-region rings, holes/islands and current geometric transformation, with existing `normalizeCompoundRegion`. Reject invalid self-crossings instead of silently repairing source geometry. Original source immutable.
2. **Choose centerline offsets from the original boundary**, not successive approximated contours: `d[i] = firstInset + strokeWidth/2 + i*(strokeWidth + gap)`. `gap` is visibly free background between neighbouring strokes; all units local to canonical design, not output pixels.
3. **Analyze clearance**, ideally minimum valid inward distance/medial-axis limit for each component and hole. An inexpensive preliminary binary search of nonempty `polygonInsetContours` for a few distances can guide fit but must not equate *any tiny remnant* to a full acceptable line; record component count, arc length/coverage, collapsed neck and maximum supported contour distance. Do not silently collapse a feature simply to satisfy `count=7`.
4. For `fit=exact`, return only contours that can be represented without invalid topology. For `fit=auto`, reduce `gap` first, then stroke width down to a declared minimum legible preview and native-output threshold. If still impossible, **fewer lines + explicit status**; never use negative spacing, reverse ink/colour ordering, fabricate a cutout, or default to seven scaled copies.
5. For `geometric`, retain source-aligned Euclidean distance-level curves, natural separation of narrow lobes and holes. Round joins are the default, appropriate for clouds; roundness at the Delta's needle tip is not automatically an error, but allow an explicitly chosen angular alternative after review.
6. For `optical`, *first ship a separate measured A/B algorithm if warranted.* It may locally taper stroke, ease spacing or use join controls, under strict no-cross, no-source-change and no-missing-hole validation. Must disclose that local spacing is no longer uniformly geometric.
7. If solid coloured bands are introduced, compute concentric region difference `E(d[i]) \ E(d[i+1])` with correct holes, islands and fill-rule topology; don't rely on seven opaque polygons covering one another when they're close to collapse. That requires a robust polygon Boolean oracle such as Clipper2.

### Accuracy and preview performance limits to investigate

The current `polygonInsetContours` grid step defaults to **min 1.15** and up to **3.2** logical px, and computes `signedDistance` against **every original edge** for each sampled candidate grid vertex. With a 1.5 px stroke and seven contours, that may produce ~1 px jitter on 4K native export and too many redundant point-to-edge computations across 7 passes. **Do not claim this is measured native quality or speed** until running matched browser tests.

1. **Zero-dependency baseline:** call current `polygonInsetContours` seven times, pin `resolution` well below thinner stroke/gap (e.g. 0.45–0.75 logical design px, bounded by actual perf), retain world-space grid alignment and `options.bounds`. Determine whether quality is satisfactory before adopting a third party.
2. **First speed candidate:** precompute **one shared signed-distance cache and edge index** per already transformed source shape at canonical grid pitch and extract seven isocontours from it, rather than redoing sign tests/edge scans for each distance. Cache only ephemeral derived geometry keyed to canonical recipe/shape+transform+count/step, invalidated on edit/Undo/randomized relevant values; no IndexedDB image or global permanent bitmap. Profile whether this beats the existing sparse per-edge candidate enumeration at seven distances; a dense grid could be worse for tall/broad shapes, so retain sparse bounding/camera pruning.
3. **Scale fidelity:** native export dimensions are 3024×6552, exactly 5.04× each 600×1300 logical design axis. Inspect tips, lobe tangent joins and thin gaps under nearest native crop; reduce contour tessellation error **only as far as evidence warrants**. Preview-to-export art should be the same path geometry, not independently sampled by export bitmap size. Avoid CPU work proportional to native 19.8M pixels for geometry offsets.
4. **Versioned quality gate:** point-to-original-edge distance quantiles (median/p95/max, excluding an explicitly labelled geometric cusp), no self-intersections, ordered nesting (outer contour always outside inner), islands/holes hierarchy, source coverage/remaining ink, no colour collisions, stable pixel output under current camera and equivalent preview/worker. Existing `reconstruction-distance-field.js` has EDT and topology routines usable for **diagnostics**, not a second renderer.

## External candidates, researched 27 October 2026: use a contest, not a shopping spree

| Rank / library | Verified value and licence | Integration risks and decision |
| --- | --- | --- |
| **0. Existing `polygon-inset.js`** | Zero new bytes/deps; real Euclidean SDF/level-set interior offset, camera-stable contour extraction, tested holes/splits | Keep as baseline and first MVP; pitch/performance, sharp join control and precise thin ink must be measured |
| **1. [Clipper2-WASM](https://github.com/ErikSom/Clipper2-WASM)** ([official Clipper2](https://angusj.com/clipper2/Docs/Units/Clipper.Offset/Classes/ClipperOffset/_Body.htm)) | Boost Software License 1.0. Polygon offset with round/square/bevel/miter joins, bool union/difference and explicit hole hierarchy; npm `clipper2-wasm@0.4.0` available Oct 2026; native Clipper2 supports ring offset and repeat Execute at multiple distances | **Best general geometric robustness and band-boolean oracle if baseline fails.** WASM fetch/init/binary footprint, static-PWA caching, integer-coordinate normalization, polygon winding/hole orientation and round-arc approximation. Load lazily; avoid changing baseline output by default. Run pinned actual Chromium/worker geometry-perf and source-art A/B before shipping |
| **2. [cavalier-contours-js](https://github.com/msurguy/cavalier-contours-js)** | Pure TypeScript ES module, MIT/Apache-2.0, no runtime dependencies, README reports ~20 kB gzip and translated 232 Rust tests. Arc-bulge offsets, shape holes/islands, unions | **Excellent lighter alternative for smooth clouds and arc-heavy shapes**; current npm v0.1.1 pre-1.0 and Rust source parity is stated for v0.7, no guaranteed stable surface. Supports only rounded offset joins currently in Rust family; benchmark against Delta tips and pixel-based current importer before selection |
| **3. [paperjs-offset](https://www.npmjs.com/package/paperjs-offset)** | MIT, published package v2.2.1 Oct 2026, approximate Bézier and compound path offsets, `analyze` diagnostics and alternate robust modes | Strong **independent optical oracle** if smooth authored Bézier SVG is available; requires Paper.js as full runtime, its own object/document model, potential transfer/worker/size problems. Not a default production dependency for ROYGBIV's current polygon coordinates |
| **4. [Clipper2 TypeScript](https://www.npmjs.com/package/clipper2-ts)** | Pure TypeScript port with `inflatePaths` and Boolean APIs; npm current 2.0.1-18 prerelease in October 2026 | Avoid production adoption until verified parity and performance; prefer upstream-backed compiled Clipper2 over assuming every port implements all edge cases |
| **5. [CGAL straight skeleton](https://doc.cgal.org/6.1.1/Straight_skeleton_2/index.html)** | Geometric reference for tip/corner preserving inward polygon wavefronts, holes, multiple output polygons | Excellent mathematical **research oracle**, not appropriate to drop into mobile PWA as a heavyweight geometry stack. Different offset/join semantics from Euclidean rounding; consult licence before reuse |
| **Not selected: width/height scaling** | Already used for current `regionMode=nested` circular/regular-polygons and placements | **Wrong default for imported cloud/ellipse/Delta**. No amount of percent-scale tuning is a general constant-distance offset algorithm |

**Operational pick:** ship a zero-new-dependency baseline with proper one-shape/seven-colour UI; create a disposable pinned comparative harness on exactly the failing Delta/cloud/negative-space artworks. If a real gap emerges, prefer Clipper2-WASM for robust miter/bevel + band Boolean, or CavalierContours-JS if native arcs/small download outscore it on measured Pixel-class preview. Do not introduce both or unverified external shader engines into release.

### Third-party benchmark protocol

- **Inputs:** canonical imported seven-control suite (circle, wide/slim rectangle, 3:1/5:1 ellipse from flattened SVG curves, deep asymmetric cloud, Starfleet-*inspired* pointed delta with a real interior cutout, concave thin-neck dumbbell, multi-island/donut and cropped/open-screen piece). Add creator-supplied licensed art only with consent, do not commit private source.
- **Compare under exactly the same shapes, 7 distances, stroke widths, geometry transform, canvas, normalized colour palette and 3024×6552 final output.** Test the seven loops as visible strokes, not just SVG black-and-white masks. Report whether a library preserves holes/corners or introduces extra disconnected fragments, changes winding, extends outside owner mask or misses a colour.
- Quantify contour distance p95/max, self-intersections/topology, area/negative-space retention, actual visible stroke overlap, 7→fewer-line reasons, visual corner aesthetics, first-load bytes and time, edit-time latency and memory in actual Chromium at 320×700 and 412×892. Explicitly label Chromium as emulated not Pixel.
- Evaluate native screenshot/PNG crops around signature Delta apex, inner cutout, cloud lobes and concave throat. Produce side-by-side alternatives **without discarding geometric baseline**; human choice determines Optical preset.
- Keep CPU work bounded independently of full wallpaper bitmap size; time-box optional outside library fit and preserve `npm run check:quick` as ordinary CI. Mark project dependencies pinned/licences only after a winning implementation is selected.

## Implementation work packages and stop gates

1. **Source-backed topology benchmark** (pure Node test + one opt-in real browser art witness): verify existing SDF output on 7 levels and characterize meaningful Delta/cloud trouble. No product renderer fork, no new dependency.
2. **Canonical seven-contour feature**: add normalized target settings, common pure planner, one import-shape action and Interior inspector, outline-only fill option, palette strokes and visible collapse notice. Tests of source truth, locks, Undo, JSON/PNG, per-object selection, native actual preview/worker parity.
3. **Quality/performance correction** only if package 1+2 reveals a meaningful 4K-visible, representable problem. First shared seven-level cache/pitch improvement, then compare external candidates. Do not introduce wasm until performance and optical evidence are positive.
4. **Optional advanced design**: deliberate tip/corner optical controls and true annular bands with correct Boolean topology. Requires owner-relevant art judgement and its own bounded acceptance.

**Acceptance is seven beautiful, truthful, editable nested contours on representative supported shapes**, not restoration of unknowable original hidden source settings or completion of a general CAD system. Any claim of “perfect seven full-length lines” on a shape too narrow for seven full-length offsets is false; show the truthful native topology and a clear creator choice.
