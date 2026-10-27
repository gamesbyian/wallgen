# Imported-shape nesting: creator-facing product requirement

**Implementation issue:** [#815: true seven-colour nested imported silhouettes](https://github.com/gamesbyian/wallgen/issues/815). Currently specified, not yet implemented.

**Owner request:** Seven finely spaced ROYGBIV outlines/bands that follow an imported elongated cloud, Starfleet-style delta, oval, shield or other irregular silhouette with visually balanced nested contours. **This is a new positive feature request, not a defect in arbitrary-source reverse inference.** Product authority: [PRODUCT-CONTRACT-2026-10-26.md](PRODUCT-CONTRACT-2026-10-26.md), software boundaries: [RECONSTRUCTION-TYPOGRAPHY-COMPLETION-2026-10-27.md](RECONSTRUCTION-TYPOGRAPHY-COMPLETION-2026-10-27.md), technical design: [NESTED-IMPORTED-SHAPE-GEOMETRY-AND-REUSE-2026-10-27.md](NESTED-IMPORTED-SHAPE-GEOMETRY-AND-REUSE-2026-10-27.md).

## In one sentence

**Import a silhouette; choose “Nested outlines”; receive seven editable, genuinely parallel and aesthetically balanced coloured lines that follow the original outline, not seven progressively rescaled copies.** Preserve original shape, cutouts, tips and separately detached islands wherever physically possible; explain where the requested seven contours cannot fit.

## What the user should see and control

- In the **existing Shapes / import / Interior editor**, select an imported compound silhouette (including SVG or safely traced photo silhouettes). Offer **“Nest shape”** / **“Nested outlines”**, without a new eighth main tab, modal maze or new renderer.
- Instantly display a recognisable seven-colour default in normal red/orange/yellow/green/blue/indigo/violet order from outside to inside. Each is a **thin visible stroke** separated by a visible background or user-chosen gap, instead of seven opaque rescaled shape fills. Default should favour the largest useful shape in the image, safe crop and full 7-colour readability.
- An explicit **Outline** versus **Solid bands** option may follow; start with **seven thin outlines** rather than promising bands before hole/boolean correctness. If solid bands are added, each band is defined by an *area difference between consecutive true offsets*, not a palette-covered scale transform.
- Controls: number of lines **1–7**, stroke thickness, even edge-to-edge spacing, first inset/margin, nested inward/outward when geometry allows, clockwise/reversed colour order, **Geometric** (true constant normal-distance) or **Optical** (bounded artistic compensation at collapsing/tapered points), corner treatment (round / crisp bounded miter / bevel). UI indicates design-unit vs output-unit sizes, clearly denotes if spacing had to be adapted and provides Reset. Counts under seven are an explicit creative choice, never unannounced hue disappearance. Expose common safe presets first; advanced spacing and corners under the existing sheet.
- The original imported geometry is unchanged, saved as the reusable **canonical compound region**, and may be moved, resized, mirrored, rotated, hidden/reused or re-edited; nests follow the *current* transformed geometry. Save Undo/Redo as one intentional command. Locks and randomization never unexpectedly alter the imported shape or recolour locked colours.
- **Separate fill treatment:** when outlining, an underlying opaque single-colour shape must not silently conceal the interior background and destroy the visual contrast of nested strokes. Provide an explicit outline-only vs filled-underneath choice as part of the same canonical scene object, not a second “decorative bitmap”.
- Render the exact same geometry across editor preview, responsive canvas, worker, headless and **3024×6552** PNG export; preserve background, material/light, photo treatment, exact camera/crop and optional text overlays. Do not embed the original photo's private bytes or a generated high-res bitmap in the recipe. User-imported shape data still follows existing provenance/size limits.

## Mathematical and visual promise

**True inset** means an inward contour lies a constant Euclidean distance from the original visible boundary where that is geometrically possible. For seven stroke centreline distances, a simple useful baseline is `d_i = margin + strokeWidth/2 + i*(strokeWidth+gap)` for `i=0..6`; all distances use the *original boundary* rather than recursively offsetting the previously quantized contour. Holes must expand into the filled region as outer boundaries contract, and detached islands must remain separate until natural collapse.

**Do not conflate same numeric width/height changes with correct nesting.** A circle under equal-dimension reduction remains a true offset; an axis-aligned rectangle under equal absolute dimension reduction also offsets its four straight sides evenly, but may collapse when narrow. Scaling an ellipse is not an exact constant-normal-distance offset. Narrow-necked clouds, concave notches, sharp Starfleet Delta tips and compound holes are the decisive cases. Proportional scaling can make a visually similar smaller copy, but does not guarantee a common gap normal to the border.

**Topology truth:** Even a perfect offset must eventually split or disappear at narrow necks and tapered tips. Never invent a full unbroken seven-line contour where the physical geometry cannot support it. Preview and accessible explanation can say: “Only five of seven contours fit at the chosen spacing. Reduce spacing/stroke width, use Auto-fit, or allow a deliberate Optical taper.” Two types of intentional outcome:
1. **Geometric:** preserve the requested constant-distance contour; separated loops or vanished tips are shown honestly and never bridged by fabricated segments.
2. **Optical:** *optional* visually compensated design, labelled as such, with a safe preset and limited local reposition/taper/corner changes. Must never move original imported boundary, invent hidden hole topology, cross neighbouring strokes or erase important Delta features without an explicit warning. A visually smoother solution is not called a mathematically exact offset.

## Specific visual acceptance scenes

1. **Elongated cloud:** seven continuous thin strokes for roomy lobes; equal perceived contour spacing around asymmetric bulges; narrow indentation might split, with honest preview and smoothing that does not seal the cloud's concave valley.
2. **Delta silhouette:** sharp apex, sloping arms and concave bottom/negative-space cutout, separately examined at **native output size**. No needle-like miter spikes, unexpected rounded-away signature tip, reversed ring/holes, mirrored cutout, colour collision or vanishing blue/indigo/violet without notice.
3. **Non-circular ellipse vs circle:** constant-distance strokes remain even normal to both long and short axes. Validate differently from naive bounding-box resize.
4. **Wide vs slender rectangle:** same side-to-line distance on every wall; no “height/width proportional” forcing; warn clearly if seven strokes cannot fit across its narrow dimension.
5. **Donut, figure-eight/bridge, crescent, multi-island cloud:** even-odd hole handling, expanding hole boundaries, natural split at the medial axis, stable winding-independent result; no false closed cap at viewport edge.
6. **Genuine imported image:** original byte-immutable traced vector, not a fabricated source. Preserve source/provenance and remain usable even if recognition/refusal says there is no faithful *entire recipe*. A manual silhouette remains a valid nesting source.

## Completion and acceptance

**First shippable slice:** one user-selected imported canonical silhouette, seven rainbow contour strokes, geometric equal-distance spacing, accurate holes and collapse warnings, 44px controls at 320×700 / 412×892, one Undo, PNG/JSON round trip, inspected native-size cloud/Delta images, preview/worker parity. Number/spacing/stroke preset and colour order are editable.

**Next quality slice, only after artwork review:** a measured opt-in Optical style and user-selectable corner treatment if current round-only signed-distance approximation demonstrably damages points; performance improvements or third-party offsetting helper only if an actual matched source failure/time benchmark warrants them.

**Nice-to-have, not minimum:** colour-fill annular bands, more than seven contours, interactive per-vertex artist editing, mathematically exact arbitrary Bézier offsets, complex legacy PNG recovery or inventing hidden source shapes.

**The release can succeed with honest fewer-line warnings** on unfit shapes; do not force the impossible seven into a too-thin corridor. “Best-looking possible” is assessed on source→preview→actual full-size wallpaper and human choice, not a score alone.

**Evidence tiers:** unit topology/distance → actual browser UI/Undo/save → actual inspected full-res PNG + exact fresh worker/reference → physical Pixel / human approval (latter separate, currently NOT TESTED). Ordinary lean CI, one-shot optical only when useful; preserve opt-in/private data defaults.
