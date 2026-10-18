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
field relative to the region and the recorded origin. Contours follow nested
interpolations of the polygon boundary. Nested regions are painted in object
order, meaning smaller visible shapes cover the details of larger shapes.
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
- `tests/render.test.js`: shared painter and clipped decorations across all structures.
- `tests/browser-smoke.mjs`: mobile editor, new element creation, visual change,
  recipe persistence, styling, targeting, removal, and no-scroll card checks.
- CI: `npm run check`, headless smoke and Chrome mobile acceptance.

All internal paths are sampled at logical design resolution. Wave tessellation
adapts to frequency and bounded world extents to avoid thousands-of-pixels
overscan from radial producers. A future specialised *true geometric inset*
operation for arbitrary concave polygons could improve the visual regularity
of contour placements, but should be separately qualified before replacing
the current stable interpolated-contour design. It is not necessary for other
placement modes.
