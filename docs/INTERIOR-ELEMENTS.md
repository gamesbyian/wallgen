# Unified scene decorations

## Architecture

The scene object graph is produced by `resolveScene()` via `buildCompositionObjects()`.
Path bundles remain parametric collections of seven ribbons, while radial and partition
producers yield closed `region` objects with palette slots and stable IDs. Both
participate in the same camera, transparent ink, materials, lighting, shadow, zoom,
nudge and export pipeline. The specialist geometry factories are intentionally kept:
a self-crossing ribbon is not safely represented as one simple polygon.

`src/interior-elements.js` defines the normalized array of interior decorations.
Every entry carries a stable ID, type (`line` or `band`), geometry, stroke,
colour, thickness, position, amplitude, frequency, phase, opacity and placement,
with line thickness measured in logical pixels and band thickness as a percentage
of the object's local cross-section,
plus optional colour-slot and object-ID scopes. The maximum is eight elements
per recipe. The stack is ordered, deterministic, and serialized in recipe
metadata, favourites, URLs, history and headless recipes.

## Placement and clipping

For `paths`, `samplePath()` supplies tangent, normal and the local ribbon width.
The element is traced relative to this frame, then clipped to the ribbon's true
shape. A loop may move longitudinally as well as transversely. The crossing
repaint draws the element again on the selected front traversal, and dashed
strokes retain their station-aligned phase.

For `radial` and `regions`, the closed vertices provide an exact clipping mask.
Field lines and waves live in canvas space; local radial placement rotates the
field relative to the region and the recorded origin. Contour placement uses
true Euclidean distance from each original polygon edge, reconstructed as
closed or open inset contours. Concave corners, holes and disappearing narrow
necks are supported, including multiple independent resulting loops. Unlike
centroid interpolation, this maintains approximately constant boundary distance
with a bounded grid approximation. The grid is anchored in world space, so
preview and PNG export have matching contour coordinates. A decoration's selected
wave, zigzag or loop shape is now applied along the inset boundary rather than
silently reverting to a plain line. Its phase is measured around the original,
uncropped polygon perimeter, with consistent winding and a whole number of
cycles for seamless closed contours. Dashed patterns likewise receive an
original-boundary-aligned starting phase. Nested regions are
painted in object order, meaning smaller visible shapes cover the details of
larger shapes.
The region divider pass occurs last, avoiding half-erased shared boundaries.

Element ink may be black, white, light/dark tonal contrast or a strict six-digit
custom CSS hex colour. It does not change the seven semantic rainbow palette
slots. Colour targets use slots 0–6; an empty colour slot array means every
colour. Object targeting uses stable object IDs such as `region-3` or
`bundle-0/stripe-2`.

## Editor

The former Stripes editor has become **Shapes** (construction and silhouette)
and **Details** (interior elements, outlines, dividers, shadows and glow).
The new Elements, Element style, Element motion, Placement and Colour targets
tools each occupy one fixed-height card. The Elements tool adds, removes,
reorders, enables and locks the stack. Whole-design and scoped randomization
understand the new collection. The editor does not require vertical card
scrolling. Unrelated existing scalar controls keep their original DOM nodes
and lock semantics.

The pre-existing Layered tonal bands construction is still accepted, preserving
its appearance in existing v2 recipes. Tonal bands can additionally be created
as independent elements. Legacy woven lattice and the stroke construction
remain available pending separate design decisions; the decoration system
does not remove or rewrite them.

## Tests and guardrails

- `tests/interior-elements.test.js`: normalization, determinism, metadata and targeting.
- `tests/polygon-inset.test.js`: signed-distance correctness, disconnected loops,
  polygon holes, fixed world grid, zoom cropping and degenerate inputs.
- `tests/contour-decoration.test.js`: independent wave/zigzag/loop displacement,
  whole-boundary phase, winding invariance and cropped-chain continuity.
- `tests/render.test.js`: shared painter and clipped decorations across all structures.
- `tests/browser-smoke.mjs`: mobile editor, new element creation, visual change,
  recipe persistence, styling, targeting, removal, and no-scroll card checks.
- CI: `npm run check`, headless smoke and Chrome mobile acceptance.

All internal paths are sampled at logical design resolution. Wave tessellation
adapts to frequency and bounded world extents to avoid thousands-of-pixels
overscan from radial producers. Closed-region contour rendering now uses `src/polygon-inset.js`. For a contour
distance d, the target is the positive-d level set of signed Euclidean distance
to original edges. Marching-squares interpolation makes an explicit accuracy/
performance tradeoff (normally about 1–3 logical units between samples).
This is a metric inset, numerically polygonized rather than an exact symbolic
arc/line offset. Thin components naturally vanish or split. The signed distance
is evaluated against the uncropped source geometry, while marching work is
bounded to the visible camera with ample overhang. See
[polygon inset engineering details](POLYGON-INSET.md).
