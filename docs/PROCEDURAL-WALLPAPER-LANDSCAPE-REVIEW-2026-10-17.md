# ROYGBIV: procedural wallpaper generator landscape review

**Research date:** 17 October 2026, Calgary local time (the inspected GitHub merge was on 18 October UTC)  
**Repository:** [gamesbyian/wallgen](https://github.com/gamesbyian/wallgen)  
**Source baseline:** [main \`2e6039c8d7fcef85b74dfe70435ffeda03929b98\`](https://github.com/gamesbyian/wallgen/commit/2e6039c8d7fcef85b74dfe70435ffeda03929b98)  
**Scope:** Competitive feature/UX and engineering review; *research and recommendations only*. No product changes, dependency changes, or tests performed by this review.

> **Timing correction:** While this research was underway, [PR #46](https://github.com/gamesbyian/wallgen/pull/46), “Unify ROYGBIV scene geometry and add radial/region compositions”, **merged**. Everything below treats its new \`structure=radial|regions\` capabilities, recipe v2, and \`src/composition-geometry.js\` as implemented. An earlier audit of \`cce79ece\` was updated accordingly. The report must not be read as claiming these additions are still future work.

## 1. Executive assessment

**ROYGBIV is unusually strong at deep, deterministic control of a constrained visual identity, and weaker at layering/editing arbitrary graphic elements and breadth of output formats.** It now matches much of the *geometric breadth* of general-purpose SVG-background makers, while the tight seven-colour rule gives it a clearer artistic identity. The distinctive implementation assets are the shared stripe centreline/tangent/normal pipeline; coherent self-crossing repair; local path editing; editable imported paths; nuanced procedural materials; scoped randomization and settings locks; phone preview; reproducible PNG metadata; and an actual shared headless render pathway.

Commercial visual generators typically win on **immediate discoverability, shape packs, easy tiled previews, export choices, side-by-side variants, and visual language that makes effects obvious before selecting them**. In code libraries, useful architectural examples are **a renderer-neutral geometric representation, reusable mask/boolean operations, reproducible random streams, and modular declarative effects**. ROYGBIV should adopt selected techniques rather than imitate entire product categories.

**Suggested order:**
1. Make **stripe contents / decorations** a first-class ordered layer stack, with continuous hairlines and offset curves as the initial feature. Replace the \`construction=tonal\` special-case where practical, but preserve its visible behavior via migration/preset.
2. Build a **seven-colour composition grammar** above the newly landed scene objects: symmetry, repeats, nesting, adjacency, deliberate colour allocation, and per-object transforms. Avoid another geometry-specific renderer.
3. Add **excellent visual exploration UX**: graphic tool thumbnails, pinned A/B variants, selective remix, and bounded visual history, without sacrificing the no-vertical-scroll phone editor.
4. Expand **colour treatment, crop/output ratios, and export**, initially scalable/vector-friendly output where it can faithfully represent the artwork.
5. Consider **deterministic temporal motion** later, as an optional extension, not a new independent engine.

These are prioritized judgments, not claims of measured audience demand.

## 2. Research method, confidence and limits

The comparison used direct product documentation/live web tool pages and original repository documentation/source. “Yes” in matrices means **documented or visible in a source**, not that every advertised feature was manually exercised. ROYGBIV conclusions derive from current source reads, its README, UI/schema code, automated test inventory, headless workflow and the merged PR. Rival commercial backends were generally **not accessible for code audit**, so their engineering architecture is not guessed. No browser/device-based side-by-side usability test, export pixel parity experiment, or performance benchmark was run for this report. Such empirical tests would be useful in a later QA task.

Read locally in ROYGBIV: \`src/model.js\`, \`src/composition-geometry.js\`, \`src/path-geometry.js\`, \`src/renderer.js\`, \`src/app.js\`, \`src/editor-schema.js\`, \`src/editor-layout.js\`, \`src/mobile-studio.js\`, \`src/scoped-random.js\`, \`src/exploration-history.js\`, \`src/drawn-path.js\`, \`src/path-point-editor.js\`, \`src/image-path.js\`, \`src/png-metadata.js\`, \`README.md\`, \`docs/HEADLESS.md\`, tests and workflow inventory. See source links in §10.

## 3. ROYGBIV's actual implementation at the reviewed revision

### Geometry / composition
- **Recipe v2** preserves the semantic seven-pigment palette and emits ordered scene objects: \`path-group\` for classic ribbons, \`region\` for closed colour areas. Geometry instructions are stored; not huge resolved point clouds.
- **Three canvas structures:** paths/ribbons, radial/bursts, and regions/partitions.
- **12 named path geometries:** straight, wave, zigzag, chevron, jagged, stepped, arc, contour, hairpin, single loop, continuous loops, and drawn.
- **Five radial modes:** sunburst, starburst, pinwheel, spokes, concentric; element counts in multiples of seven (7–70), rotation, twist, coverage, central gap and movable origin.
- **Five region modes:** Voronoi, organic territories, triangular facets, recursive blocks, nested silhouettes. Region element counts also use sevenfold multiples; background/black/white dividers have independent width.
- **Classic layout:** one seven-stripe bundle, 2–6 repeated bundles, or floating/tapered stripes; diagonal orientation/rotation/mirrors; zoom and two-axis nudging.
- **Geometry constraints:** preserve stripe coherence or allow intentional distortions. Explicit Over/Under/Weave modes for self-crossing paths.
- **Hand drawing and import:** smooth/geometric recognition to 10×, anchors and local repair; image importer extracts candidate silhouettes, chromatic-centreline arcs and dominant line angles locally.

### Appearance / interaction
- **Eleven colour stories** keep recognisable ROYGBIV hues, plus reverse order. Opaque backgrounds are black or white. Per-slot arbitrary pigment choice or continuous colour gradients are not current general-purpose editing features.
- **Four construction modes:** ribbon, fine stroke, tonal ribbon and woven lattice. **Eight ribbon motifs:** solid, dots, stars, dashes, diamonds, chevrons, hatch, checker. Independent continuous/dotted/dashed silhouette styling, outlines, buffers, glows, shadow controls, grain and roughness.
- **21 material choices**, three optional material passes, blend modes, coverage scopes, material rotations, height-field edge displacement and canvas atmosphere.
- **Eight starting styles**, 6 editor categories (Layout, Path, Stripes, Colour, Material, Effects), named tools, tool search, contextual disabling/visible zero, numeric steppers and locks.
- **Exploration:** full randomization, per-control/per-tool/per-category reroll or gentle/moderate/wild variation, 80-step undo, 10-entry in-memory recent variation strip, local favourites, gallery and shareable recipe URL.
- **Phone:** persistent non-obscured canvas, compact action dock, no vertical scrolling within the settings card, horizontal named-tool navigation. Cream and original dark interface themes are separate from generated artwork.
- **Output:** fixed native-ratio 3024 × 6552 PNG (19.8 MP), embedded full reproducible recipe and optional descriptive metadata; extract/restore from PNG; headless CLI using same procedural renderer. Current core export is static PNG, not general SVG/animated wallpaper export.

**Important framing:** “seven colours” now means seven **semantic palette identities**, not exactly seven painted objects; radial and region layouts can contain 14–70+ coloured areas without creating an eighth hue.

### Engineering strengths worth protecting
1. **One seeded recipe contract** across editing, sharing, image metadata, favourites and headless work; geometry resolved in the same 600 × 1300 logical domain.
2. **One production raster compositor** for masks, materials, lighting, positional overscan and output; classic path rendering has dedicated tangent/normal geometry and crossing repair.
3. **Human correction tools** for freehand and image-imported geometry. The image import is browser-local rather than a fragile server inference service.
4. **Structured editor taxonomy** in \`editor-schema.js\` and scope-aware randomization, which give new features a recognizable home.
5. **No runtime package/service dependency** for the deployed studio: quick static hosting, privacy, accessibility to offline use.
6. **Significant test coverage** for recipe normalization, determinism, geometry, intersections, browser interactions, metadata and CLI. Number of test files does not itself prove all visual cases are correct.

### Engineering liabilities / scaling pressure
1. **Large concentrated modules:** \`src/renderer.js\` is already above a thousand lines; \`src/app.js\` and \`src/model.js\` contain many unrelated policies. The merged composition layer is a useful extraction, but adding every new effect directly to the renderer will compound branch complexity.
2. **Two kinds of “structure” remain:** top-level \`structure=paths|radial|regions\` and stripe-level \`construction=ribbon|stroke|tonal|woven\`. They are legitimate concepts but confusingly named and constrained across tools. A clear future model should be **Canvas Composition → Shape/Path → Stripe Fill & Contents → Edges/Finish**.
3. **Applicability is partly imperative** in \`app.js\` (\`inactiveSettingKeys\`) while membership is declared in \`editor-schema.js\`. Introducing further modes risks missing a grey-out case, stale status text, an omitted reroll selector, or a recipe field. Move to one testable typed declarative setting registry, with per-mode capability predicates.
4. **Path and region branches diverge near render dispatch.** They share a compositor, but \`drawWallpaper\` still routes through distinct per-shape drawing branches. Introduce a compact renderable interface (geometry mask, local coordinate field, paint passes, bounds) so future content operators are shared wherever valid.
5. **Hard-coded logical/output aspect ratio** is a deliberate phone target, not a universal artwork canvas. Custom aspect ratios should change camera/export, not force geometry to be regenerated unexpectedly.
6. **Full-resolution Canvas2D allocation risk:** the README explicitly notes large buffers and limited mobile RAM. Avoid piling on live sub-canvases for each decoration. Use a bounded cache, lazy export, and memory budgets before high-layer animation.
7. **Reproducibility requires explicit seeding for any new noise/operator**. Continue isolated per-node/per-effect seed namespaces; do not let inserting one decoration reshuffle every unrelated component.
8. **Exploration history is session-local and bounded to 10**; it is good undo protection but lacks deliberate paired comparisons or a persistent design board. The user should see a design decision, not just a sequence of random thumbnails.

These are architecture-risk observations, **not discovered runtime defects**. Targeted tests should substantiate any proposed refactor before claims of bugs.

## 4. Competitor / reference benchmark

| Product / project | Verified distinctive functions | Where it challenges ROYGBIV | Transferable lesson (not a copying requirement) |
|---|---|---|---|
| [Haikei](https://haikei.app/generators/) / [live editor](https://app.haikei.app/) | Dedicated waves, layered waves, steps, peaks, blob, scatter, gradient and low-poly generators; balance/complexity/contrast controls; SVG and PNG. | Faster first-result exploration; vector export and general composition diversity. ROYGBIV now covers substantially more structural territory than it did before PR #46. | Visual **structure-picker thumbnails**, a small common vocabulary (“density”, “balance”, “contrast”), live variant switching. |
| [Repper](https://repper.app/en/features/) / [guide](https://repper.notion.site/Quick-Guide-e37970849308414a918b8512ab9012b7) | 30+ tilings, symmetry groups, source-image sampling, pattern previews, effects (halftone, gradient, metamorphosis), snapshots/collections, bitmap/vector, seamless export. | Considerably stronger tiling mathematics and pattern collection UX. | **Symmetry and tile-periodicity** as first-class generators; overview grid of candidates; capture-and-compare workflow. |
| [BGJar](https://bgjar.com/) | Large visual menu of customizable SVG families including wave lines, circuit paths, dash waves, contours, stars, hexagons, patterns. | Browsability and instant idea vocabulary. | Let users **pick shapes by a real picture of what they do** rather than by a text label alone. |
| [MagicPattern](https://www.magicpattern.design/geometric-patterns) / [editor](https://www.magicpattern.design/tools/geometric-patterns) | 250+ shape assets; packs, grid rows/columns, rotation, density, colours, custom SVG imagery, multiple export media including animated output. | Much broader motif asset system, mixed shapes and export choices. | A **small, coherent internal-ornament library** and deliberate density/placement. Don't import 250 arbitrary icons wholesale. |
| [DOODAD.dev](https://doodad.dev/pattern-generator/) | Seamless pattern styles, transforms, colours and filters; SVG/CSS/PNG; save/load and share. | Repeating-tile intent and editable project interchange. | Orthogonal **pattern → transform → filter → export** pipeline. |
| [Pattern Monster](https://pro.pattern.monster/) | Hundreds of SVG pattern designs, metadata and SVG API, scale/angle/stroke controls, selective locks and palettes. | Discoverable reusable patterns and programmatic SVG access. | A **style/effect catalogue**, stable parameter contracts, useful machine-friendly exports. |
| [blobs.app](https://blobs.app/) | Seeded shape and URL, solid/gradient/pattern/image fill, outlined shape, animation between multiple shapes, SVG/PNG/CSS/React exports. | Very clean **shape → fill → output** mental model and reversible sharing. | Use the same fill/contents abstraction for ribbons *and* closed regions; preserve routeable recipes. |
| [Trianglify](https://github.com/qrohlf/trianglify) / [docs](https://github.com/qrohlf/trianglify/blob/master/Readme.md) | Deterministic seed, mesh cell size/variance, per-axis colour scales and geometry object that renders to Canvas or SVG. | Renderer-neutral scene objects and colour-mapping dimensions. | Separate **geometry synthesis, semantic palette mapping, and export backend**. Note **GPL-3.0** source license if considering code reuse. |
| [Silk](https://weavesilk.com/) | Interactive strokes, rotational/mirror symmetries, colour blends, Undo/Redo and extremely lightweight creative controls. | Immediate expressive finger-drawing. | A **symmetry toggle on draw** and visible transformation before applying stroke. |
| [Vanta.js](https://github.com/tengbao/vanta) | Parameterized touch/mouse-reactive animated effects via WebGL/p5. | Living movement and reactive ambience, outside ROYGBIV's current static scope. | Optional time parameter and real-time animation, subject to mobile battery/performance goals. |
| [Wallpaper Engine](https://docs.wallpaperengine.io/en/scene/overview.html) | Timeline, scene/particle systems, audio reaction, parallax, shaders and scripted logic. | Mature motion, cross-element operators and asset composition. | Long-term staged animation graph; don't reproduce an entire timeline editor for static wallpapers. |
| [Lively Wallpaper](https://github.com/Lively-wallpaper/lively) | Open-source animated desktop wallpaper host accepting websites, WebGL shaders and video; pause/power behaviours. | Delivery to actual live desktop wallpaper. | Treat playback as a separate **output/host**; explore live-wallpaper export compatibility after deterministic animation exists. |
| [canvas-sketch](https://github.com/mattdesl/canvas-sketch) | Generative JavaScript sketch workflow, high-res export, hot reload/build. | Engineering iteration tools rather than a consumer wallpaper editor. | Reproducible **parameter sweep/contact-sheet/compare** tooling and non-UI generation tests. |
| [tsParticles](https://github.com/tsparticles/tsparticles/blob/main/markdown/Options.md) | Modular shapes, emitters, operators, grouped updaters, paths and responsive presets. | Highly composable effect architecture. | **Typed effect modules** with declared capabilities and shared parameter definitions. Avoid adding it merely to obtain static dots. |

### Cross-product comparison (documented capability, 2026-10-17)

| Dimension | ROYGBIV now | Leading external benchmark | Assessment |
|---|---|---|---|
| Repeatability / seeds / full recipe | Seed + v2 JSON + URL + PNG embedded restore + headless | Trianglify, blobs.app, DOODAD | **Leading strength** within this specialty |
| Path gesture and repair | Hand drawing, anchors, geometric/round smoothing, image-to-path | Silk (fluidity), vector editors (manual path editing) | **Strong / distinctive** |
| Ordinary path/ribbon effects | Crossings, geometry-safe bands, rich material layers, dotted strokes | Most background generators much simpler | **Leading strength** |
| Diverse seven-colour geometry | Now paths + 5 radial + 5 region modes | Haikei, BGJar, MagicPattern | **Competitive breadth**, narrower artistic ontology |
| Freeform motif placement / stripe-local ornaments | Existing scattered motifs and special construction variants | MagicPattern, vector illustration software | **Main expressive gap** |
| Seamless repeat / plane symmetry | Repeated rainbow groups, mirrors, some regional modes | Repper, DOODAD | **Significant gap** in wallpaper groups and periodicity |
| Colour field flexibility | Eleven HSL stories, semantic 7 hue slots, reverse, black/white ground | Haikei/Chroma/MagicPattern | **Distinctive identity; weaker modulation/perceptual controls** |
| Exploration UX | Scoped reroll/vary, locks, history 10, gallery | Repper collections, MagicPattern packs, Haikei visual picker | **Deep but could be easier to compare/approach** |
| Phone-first controls | Strong explicit constraint, preview always visible | Most rivals target desktop/site asset creation | **Strategic differentiator**; empirical device comparisons pending |
| Vector/media output | Full-res PNG + machine-readable recipe; CLI | Haikei, Repper, Trianglify, MagicPattern | **Export gap** |
| Temporal/interactivity | Static | Vanta, Wallpaper Engine, Lively | **Intentional different scope**, possible later opportunity |

## 5. Top feature concepts that particularly suit *seven colours*

The key requirement is not “add all generic drawing features”; it is **make seven semantic pigments behave in ways general graphic generators cannot easily express**.

### A. Stripe interior element stack (highest immediate payoff)
A stripe has **fill**, an ordered list of **contents**, and **edges**. One content item may be:
- tonal band (existing \`construction=tonal\` translated into a preset operator);
- **continuous straight/sine/loopy/triangle/zigzag hairline** centered at any fraction of band width;
- **dotted/dashed** versions of those same curves, with independent dot/dash lengths, spacing and phase;
- twin mirrored hairlines, nested rails, railway sleeper ticks, contour echoes;
- stamps: stars, circles, diamonds, hatching, crosses, tessellated micro-shapes, varying density;
- offset engraving/embossing/highlight. White, black, lighter/darker own-stripe hue or adjacent rainbow hue.

Common parameters: **kind, width, colour source, offset (−100…100% of half-width), wavelength, amplitude, phase, density, pattern, opacity, blend, clipping, seed**. A distinct placement mode chooses whether marks align **along the path**, **across the ribbon**, or **in canvas space**. Critical: the requested “white loopy line inside a rainbow stripe” means a *single uninterrupted centreline decoration that respects the stripe's bending geometry*, not a field of detached motifs.

Rendering suggestion: define an arc-length parameter \(s\) along the centerline and signed normalized cross-band coordinate \(v\). Evaluate centre \(P(s)\), tangent \(T(s)\), normal \(N(s)\), and local width \(w(s)\). A decorative line is \(P(s)+N(s) \, w(s) \, f(s)/2\), then clipped to that exact stripe's fill mask. Dash phase should be based on **arc length**, not screen x, so spacing stays uniform around a hairpin. Avoid discontinuities at adjacent sampling spans and crossing repairs. Reuse one mask for colour + contents + outline decisions, not a second approximate ribbon solver.

**Recommended UI:** split the current Stripes category into **Stripes (Form)** and **Within stripes (Decoration)** *at the named-tool level first*, not necessarily an extra main tab. A compact **Add element** control creates a visible one-line chip with type and colour swatch; selecting it displays one fitting no-scroll card. Layers can be reordered, duplicated, muted and deleted. Keep top-level Stripes information architecture stable until actual phone testing proves a seventh tab is preferable.

### B. Sevenfold geometry grammar (high payoff; build on landed v2)
- **Prism fan:** seven rays whose widths vary harmonically rather than uniformly; 7, 14, 21 rays group into seven identities.
- **Chromatic cathedral:** nested polygon, star or rounded-arch boundaries; each concentric ring cycles seven colour identities, dividers adjustable.
- **Stained glass:** constrained Voronoi or guillotine subdivisions grouped into exactly seven distinguishable pigment families; glass-like highlights optional, black/white “leading”.
- **Spectrum topography:** seven elevation layers of contour bands, hand-carved hatch within each, spacing tied to distance field.
- **Rainbow kaleidoscope:** rotational and dihedral symmetry (7-fold/14-fold as native presets) of an editable seed motif, preserving per-slot identity.
- **Spectral interference:** seven sinusoidal wavefront families crossing or braiding with predictable over/under rule.
- **Ribbon labyrinth:** one continuous wandering path yielding seven offset lanes with consistent curvature, optional concentric recursion.
- **Colour mosaic:** seeded partitions or triangular facets, but **palette allocation controlled by neighbourhood** to avoid homogenous blotches and make all seven slots visibly present.

Each should be a **composition preset + parameter constraints**, not a new one-off renderer. A general tiling subsystem can later support sevenfold tile colouring, wallpaper groups and guaranteed edge-matched repeats.

### C. Colour character without betraying ROYGBIV
- Per-slot **luminance and chroma**, plus a global “identity fidelity” control constraining hue drift within declared red/orange/yellow/green/blue/indigo/violet windows.
- **Hue direction** or per-slot spatial variation along a ribbon, longitudinal and transverse gradients, and careful multi-stop tonal gradients.
- **OKLCH/OKLab interpolation** for perceptual smoothness, gamut-mapped back to output sRGB. Existing HSL stories are predictable but not perceptually uniform.
- Adjacent stripe **contrast / blend** treatments with strict semantics and a one-click “restore classic seven”.
- Optional background **ink black, paper white, contrast tint or patterned neutral**, preserving the divider as a separate semantic colour. Do not silently generate an eighth rainbow pigment.

### D. Serendipity with control
- **Contact sheet of 7 or 14** variants linked to the same recipe, each differing in *one* named dimension (geometry, ornament, colour, composition), rather than 14 unrelated outputs.
- **A/B pinning** with tap-to-compare, swipe divider, or rapid toggle. Pin A, vary only a tool, compare B, keep one; preserve the original.
- **Visual mutation map:** a short branch history from a favourite, with a thumbnail and precise changed-setting list. “Go back to that width but keep this texture” should be an intentional operation.
- **Randomization budget / identity lock:** preserve sevenfold palette and general silhouette while only changing orbit, detail density or finish. Existing scoped randomization provides much of the machinery.
- **Seven-button quick palette selector** with colour labels, accessible to colour-blind users, and temporary isolate/highlight of one pigment when editing dense scenes.

### E. Outputs and actual wallpaper use
- **Canvas ratios/presets:** current Pixel 6 Pro, contemporary portrait handsets, 9:16, 16:9, ultrawide and square; preview *safe-area and icon/text overlays* without baking overlays into output.
- **Resolution-independent SVG** for vector-capable geometry; decide and document whether complex textures/filters are exported as equivalent SVG operations or embedded raster fallback. Mixed SVG is acceptable if clearly labelled; never advertise lossless full-vector fidelity where impossible.
- **Wallpaper sets:** paired lock-screen/home-screen versions from the same recipe with configurable contrast, framing and amount of negative space.
- **Tile export** with guaranteed seam tests for tileable compositions, and code/CSS/SVG fragments where an operator has faithful representation.
- **Motion** eventually: deterministic time \`t\`, slow flow of phase, breathing radial shape, traveling light/hairlines, pinwheel turning, animate between two recipes. Export finite video/GIF/web package only after the underlying time evaluation is pure and preview/export match.

## 6. Architecture recommendation

The newly merged \`src/composition-geometry.js\` and recipe v2 are the *right base*. Do **not** replace them or regress the original ribbon path geometry. Extend the model by describing an object's fill and optional ordered content operators. Pseudocode only, **not current API**:

\`\`\`js
{
  id: "rainbow-1",
  type: "path-group",          // or "region"
  transform: { /* normalized placement */ },
  paletteRule: { slots: [0,1,2,3,4,5,6], repeat: "cycle" },
  appearance: {
    fill: { kind: "solid", colour: "palette-slot" },
    contents: [
      {
        id: "hairline-a",
        kind: "line",
        path: "sine",          // straight | sine | loop | zigzag | custom
        lineStyle: "dotted",   // continuous | dotted | dashed
        colour: "white",
        offset: 0, amplitude: .14, wavelength: .35,
        width: .008, phase: 0, opacity: 1
      },
      { id: "tone-a", kind: "tonal-band", width: .25, contrast: .22 }
    ],
    edge: { /* existing outline thickness/buffer/style */ }
  }
}
\`\`\`

There are two layers of compositing policy:
1. **Scene-level z-order**: object draw order, blend, masks, geometry intersections (Over/Under/Weave) and scene-wide finish.
2. **Shape-level ordering**: base fill → clipped interior contents → outlines / shadows, with strokes sampled in path-local coordinates and region decorations mapped to region-local coordinates.

For classic crossings, **preserve branch-aware repainting** from \`crossing-order.js\`. A decorative element on an overpassing arm must come with the local branch, and never resurrect a hidden underpass via its own mask. A region's single clipping path should support the same interior-content interfaces as a ribbon without pretending it has a centreline. Define operator capabilities: \`supportsPathCoordinates\`, \`supportsRegionUV\`, \`supportsDistanceField\`, \`supportsTiling\`, \`vectorExportable\`. When not applicable, grey the control and display zero while keeping its saved requested value.

**Suggested internal refactor seams:**
- \`recipe-schema\`: one canonical typed descriptor per setting (default, domain, units, relevance predicate, scope, randomization policy, UI placement, migration, validation). \`editor-schema.js\` can point to those descriptors. No dependence on querying DOM input min/max for model correctness.
- \`geometry\`: pure seeded object factories, path sampler, normal/offset sampling, region outlines, stable bounds and UV fields.
- \`paint-operators\`: \`solidFill\`, \`tonalBand\`, \`pathLine\`, \`repeatStamp\`, \`hatch\`, \`gradient\`, etc., each with explicit clipping and deterministic seed.
- \`compositor\`: masks, scene z-order, localized crossings, outlines, textures/lighting/camera. Keep one production compositor and one parity contract for browser/headless.
- \`exporters\`: Canvas/PNG stays authoritative until a vector export passes defined fidelity fixtures.

**Determinism:** derive RNG from \`recipeSeed / stableNodeId / stableOperatorId / property\`. Inserting a mark should not perturb geometry or material grain elsewhere. Store instruction-level recipes with explicit migrations (v1→v2 exists; future v2→v3 should be tested). Pixel-exact images on different browsers may still differ because of fonts/Canvas antialiasing/colour management; define deterministic **scene geometry** separately from device-specific raster equality.

**Libraries to evaluate, not blindly adopt:**
- [Paper.js path operations](https://paperjs.org/reference/path/) and [SVGPathCommander](https://github.com/thednp/svg-path-commander) for sophisticated geometry, SVG path transforms, and boolean/point-at-length operations.
- [perfect-freehand](https://github.com/steveruizok/perfect-freehand) for pressure-sensitive stroke outline ideas (its scope is freehand stroke appearance, not semantic smoothing or recognition of a drawn seven-lane path).
- [Rough.js](https://github.com/rough-stuff/rough) for delightful imperfect ink stroke/hatching rendering on Canvas/SVG, ideally as an optional operator.
- [chroma.js](https://github.com/gka/chroma.js) or a small audited internal colour module for perceptual interpolation.
- [Trianglify](https://github.com/qrohlf/trianglify) is an architectural reference; **GPL-3.0** means copying/importing it changes redistribution obligations, so review license compatibility rather than casually adding it. Independently implementing Delaunay/Voronoi semantics is also feasible.
- [Two.js](https://github.com/jonobr1/two.js) for conceptual multi-backend scene graphs, not an automatic win over the present Canvas2D compositor.

Preserve low-dependency local-first operation unless a dependency's ongoing cost and measured capability gain are justified.

## 7. UI/UX recommendations grounded in competitors

### What to retain
The live unobstructed phone preview, six-category/named-tool card layout, disabled-inactive settings, steppers, seed/locks/scoped variations, tap-to-recall, and on-canvas drawing all address problems many highly parametric visual tools struggle with. Do **not** restore an overwhelming scrollable advanced panel or expose 250 motif icons in a phone row.

### What to upgrade
1. **First screen:** structure picker with small genuinely rendered thumbnails for Paths, Radial, Regions; below that the named subtype picker. The controls use the same underlying data as the category tools. A thumbnail can explain “pinwheel” more quickly than a paragraph.
2. **Each tool:** keep one active card and make its large controls context-specific. Use shared compact rows of label + value + two steppers; show colour swatches for semantic black/white/own-hue and a short explanatory illustration for unusual controls.
3. **Within-stripe elements:** editable chip list no taller than a standard tool card; plus/minus and reorder gestures; a tapped chip gets a full normal-width settings card, with only applicable controls. Do not bolt 12 additional sliders directly onto \`Stripes → Structure\`.
4. **Search:** retain \`src/editor-layout.js\` search and enrich with synonyms (“ray”, “sunburst”, “inside stripe”, “dash”, “outlines”, “tiling”); a search result should navigate to a *working card* rather than scroll a long form.
5. **Before/after:** one prominent compare surface and “keep this one” action alongside recent variants. Save/restore should not collapse the edit panel or change framing.
6. **Progressive complexity:** presets have deterministic known-good parameter ranges; optional “Advanced” only expands a particular tool, not a new global UI mode. Help text appears on demand.
7. **Preview safety:** accessible “show home icons / clock safe area” overlay tied to device aspect-ratio preset; never part of exported design.
8. **Accessibility:** use actual text names for colours, shape thumbnails with alternatives, keyboard/pen support for anchor editing, sufficient hit targets and focus handling; maintain touch swipes without hijacking vertical page gestures.

### Caution: feature growth must not turn the phone into a settings spreadsheet
Adding five radial modes and five region modes in PR #46 was a big compositional increase. The immediate UX task is to *teach the user what exists*. A discoverable family gallery, curated example recipes and before/after variation pairing may produce more usable creative power per development hour than another dozen sliders.

## 8. Recommended delivery roadmap

Complexity labels are qualitative; none are implementation estimates.

| Rank | Work | Size | Dependencies | Acceptance contract |
|---|---|---:|---|---|
| **P0** | Documentation and smoke-check of merged v2 scenes | S–M | Current main | 7-colour slot invariants, all five radial and five region modes, no path regressions, normal and headless parity, invalid-input safety, inactive-control behavior, recipe v1 import. |
| **P1** | Ordered stripe-internal content stack, tonal band migration, center/off-centre hairlines, sine/zigzag/loop, dotted/dashed | L | v2 object styling, mask/branch correctness | White and black continuous or dotted paths remain wholly inside moving/looped rainbow stripes at previews and 19.8 MP; crossing order, background, textures, undo, recipe, locks, headless all correct. |
| **P1** | Visual structure/mode picker and A/B pinning | M | Existing editor + history | Phone fit at target viewport with no vertical settings scroll; previews visibly differentiate options; A survives B edits/restores. |
| **P1–P2** | Shared per-setting applicability descriptors and component boundaries | M–L | Agree on normalized recipe/setting registry | Every setting has exactly one owner, validation and inactive predicate; UI reroll and CLI honor one model; no invisible settings. |
| **P2** | Sevenfold symmetry, mirrored drawings and a constrained tiling primitive | M–L | Scene transforms, palette semantics | Guaranteed tile-edge equality where flagged “seamless”; symmetry preserves seven slots; comparison fixtures across seeds. |
| **P2** | Perceptual palette modulation and gradients in stripe-local space | M | Colour strategy + content masks | Seven semantic hue identities stay recognizable; interpolation and gamut clamping tested; preset reset. |
| **P2** | Device ratios, crop-safe previews, lock/home paired export | M | Camera generalization | WYSIWYG ratios and framing, no recomputed art surprises; PNG metadata dimensions correct; mobile memory limited. |
| **P2–P3** | SVG export with declared raster fallbacks for materials | L | Geometry shape/paint interface | Vector paths, outlined masks and deterministic colours; documented exceptions; reference PNG comparison. |
| **P3** | Motion parameter and limited looping exports | L–XL | Stateless/time-pure renderer + bounded memory | Frames at a fixed time are reproducible, loop joins cleanly, export supports short clips, battery/performance guardrails. |
| **P3** | Advanced print/packaging mockups, broad motif packs, elaborate particle/audio systems | XL | Product demand evidence | Defer until core seven-colour visual language is mature. |

**Quality gates for every rendering feature:** fixed seeds; control bounds; deterministic output geometry; 7-slot property checks; path bends and self-crossings; clipping with outlines/buffers; coherent/unrestricted geometry; 3 texture layers; high resolution; 50% and 250% zoom; negative-position overscan; headless/browser equivalence; mobile phone preview; roundtrip PNG recipe; undo/favourite/locks. Run contact sheets across representative seeds to catch visual artifacts that unit tests alone miss.

## 9. Product positioning and concrete proposals

ROYGBIV has a compelling niche: **generative rainbow craftsmanship, not generic AI backgrounds or a small Photoshop clone**. Generic tools want users to select *any* colours and *any* shapes. ROYGBIV can offer more interesting controlled choices: exactly seven colours, but almost unlimited ways to bend, divide, interleave, orbit, engrave, shade and arrange them. The fidelity of the seven-colour sequence becomes the artistic constraint that makes the output recognizable.

Suggested “wow” presets after the first internal-element implementation:
- **Spectrum Filigree:** seven wavy ribbons with white continuous looping micro-hairlines; optional dots at inflection points.
- **Prism Cathedral:** seven rotating wedge families, hairline black outlines, nested circular cutouts and finely engraved interiors.
- **Chromatic Contour:** layered topographic seven-slot fields with microscopic offset contours and stipple texture.
- **Disco Weave:** every ribbon self-intersects in a controlled interlace with alternating above/below and a narrow specular rail.
- **Rainbow Circuit:** seven straight/stepped pathways with dashed glowing centre traces and occasional round terminals.
- **Sevenfold Glass:** Voronoi regions assigned from exactly seven hue identities, black dividers, subtle faceted highlights.
- **Spectral Moiré:** seven precise offset-wave sets, tuned phase separation, adaptive line density, hard-overlap safety.

They should be ordinary recipes, not bespoke render functions. Any impressive preset that requires secretly changing an unrelated parameter is a sign that the model needs a more general operator.

## 10. Source register / reproducibility

**Primary ROYGBIV source (reviewed at commit \`2e6039c8\`):**
- [README.md](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/README.md): current features, v2 model and user-facing UX.
- [src/model.js](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/src/model.js): types of settings, slots, seeded recipe normalization and scene resolution.
- [src/composition-geometry.js](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/src/composition-geometry.js): newly landed radial/region pure factories.
- [src/path-geometry.js](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/src/path-geometry.js), [src/renderer.js](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/src/renderer.js), [src/crossing-order.js](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/src/crossing-order.js): paths, rendering, intersections.
- [src/editor-schema.js](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/src/editor-schema.js), [src/editor-layout.js](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/src/editor-layout.js), [src/app.js](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/src/app.js), [src/mobile-studio.js](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/src/mobile-studio.js): categorization, active controls, phone ergonomics.
- [src/scoped-random.js](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/src/scoped-random.js), [src/exploration-history.js](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/src/exploration-history.js): selective randomization and variation recovery.
- [src/image-path.js](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/src/image-path.js), [src/png-metadata.js](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/src/png-metadata.js), [docs/HEADLESS.md](https://github.com/gamesbyian/wallgen/blob/2e6039c8d7fcef85b74dfe70435ffeda03929b98/docs/HEADLESS.md).
- [Merged PR #46](https://github.com/gamesbyian/wallgen/pull/46).

**External products and references, checked online during this review:**
- [Haikei generator list](https://haikei.app/generators/), [Haikei editor](https://app.haikei.app/).
- [Repper product features](https://repper.app/en/features/), [Repper guide](https://repper.notion.site/Quick-Guide-e37970849308414a918b8512ab9012b7).
- [BGJar generator catalogue](https://bgjar.com/).
- [MagicPattern geometric patterns](https://www.magicpattern.design/geometric-patterns), [editor](https://www.magicpattern.design/tools/geometric-patterns), [mesh gradients](https://www.magicpattern.design/mesh-gradients).
- [DOODAD pattern generator](https://doodad.dev/pattern-generator/).
- [Pattern Monster](https://pro.pattern.monster/), [pattern API](https://pro.pattern.monster/api).
- [blobs.app](https://blobs.app/).
- [Trianglify repository and API](https://github.com/qrohlf/trianglify/blob/master/Readme.md).
- [Silk interactive artwork](https://weavesilk.com/).
- [Vanta original repository](https://github.com/tengbao/vanta).
- [Wallpaper Engine scene editor](https://docs.wallpaperengine.io/en/scene/overview.html), [particle docs](https://docs.wallpaperengine.io/en/scene/particles/introduction.html).
- [Lively open source wallpaper host](https://github.com/Lively-wallpaper/lively).
- [canvas-sketch](https://github.com/mattdesl/canvas-sketch), [tsParticles options](https://github.com/tsparticles/tsparticles/blob/main/markdown/Options.md).
- [Paper.js path API](https://paperjs.org/reference/path/), [SVGPathCommander](https://github.com/thednp/svg-path-commander), [perfect-freehand](https://github.com/steveruizok/perfect-freehand), [Rough.js](https://github.com/rough-stuff/rough), [chroma.js](https://github.com/gka/chroma.js), [Two.js](https://github.com/jonobr1/two.js).

**Bottom line:** The next high-value innovation is to let shapes contain other things. The new scene objects now answer *where the seven colours go*. First-class ordered content operators answer *what happens inside each colour*. That is the natural next chapter for ROYGBIV.
