# ROYGBIV: geometry-aware surfaces and procedural embroidery

## E3 gentle highlight/shadow Satin variant (2026-10-22)

The [first actual production picture review](EMBROIDERY-PRODUCTION-ART-FINDINGS-2026-10-22.md) exposed strong desaturation on tight red/orange Satin loops. A separately selectable `satin-soft` recipe style now uses exactly the old satin geometry, but reduces black underlay and white raised-ridge alpha on ribbons and regions. This is an artistically oriented low-overpaint finish, not physical fibre simulation; legacy `satin` stays byte/pixel stable. The existing compact inspector gains only one option. The opt-in reviewer supports `--focus-soft-satin` for three matched real wallpapers rather than introducing broad CI. The real [three-image opt-in comparison](SOFT-SATIN-ART-FINDINGS-2026-10-22.md) was generated and viewed (Actions #39884499923). It confirms substantially improved red/orange hue retention on a tight loop compared with old Satin, without removing stitches. Original Satin remains untouched. Pixel/native export and nuanced fibre effects remain open.


## Repeatable appearance comparison (E2/E3, 2026-10-22)

The opt-in [seven-image embroidery review](EMBROIDERY-SEVEN-IMAGE-ART-REVIEW-2026-10-22.md) uses the existing production renderer for precisely three paired loop ribbon styles and four paired scattered-region treatments. It records exact canonical sidecar and embedded recipes, source seeds, names and a local contact gallery; it does **not** add mandatory CI. The first seven PNGs **were actually rendered, retrieved and visually judged** with exact recipe/CRC validation in [run #39883744519](https://github.com/gamesbyian/wallgen/actions/runs/39883744519). See [observed strengths and limitations](EMBROIDERY-PRODUCTION-ART-FINDINGS-2026-10-22.md): source-isolated targeting works, Satin is dense/desaturating on tight inner loops, and short regional lines still read as procedural hatching. Full 2.5D realism and physical device approval remain open.


## E2 practical slice: longitudinal running seams and safe multi-ring bounds (2026-10-22)

The original Satin strokes remain pixel-unchanged, while a new **Running seams** style uses three interrupted strands along the authored tangent/normal centreline of a ribbon, with a globally anchored station lattice so self-crossing branch overpainting keeps identical stitches. For regions, Running uses paired staggered short fill segments through the existing even-odd clip, distinct from three-offset Tatami. The current native Texture → Surface style picker supports all three and preserves its value across Save/Undo/PNG. Stitch intervals and full-width samples are bounded, with no new texture fields, random seeds, compositor, tool cards or CI. Imported multi-ring bounds now iterate finite vertices without risky `Math.min(...hugeArray)` argument lists, including a negative test for corrupt points. Focused unit tests establish source and transport behavior; real embroidery appearance, phone feel, fabric/underlay simulation and small-feature split stitch are still open.


## Current next slice: scoped treatment precedence and tatami region stitch style (2026-10-22)

The existing optional `surfaceTreatments` array now resolves **authored object > palette slot > all fills**, regardless of serial order; ties retain their original first-match priority. This lets an exact region override a palette group and a palette group override a global treatment without rewriting recipes or changing any untreated artwork. Existing `tatami` recipes now render bounded, offset short thread segments on regions (using the existing even-odd geometry clip); `satin` continues to use the established long fill rows. Texture → Surface exposes the style through the current compact Thread disclosure, restoring the saved value instead of hardcoding satin on every change. Ribbons intentionally keep path-following ribs in both styles; more sophisticated stitch angle and physical thread relief remain E2/E3 follow-ups. Focused Node tests validate routing, deterministic row geometry, editor round-trip wiring. **Source-verified implementation, not an artistically approved physical-phone render.**


## One authored-object treatment picker (PR #482, 2026-10-22)

[#482](https://github.com/gamesbyian/wallgen/pull/482) exposes the already-supported explicit `target.scope='object'` in the compact Thread workspace. The picker enumerates actual unified-scene generated `region-N` and `bundle-N/stripe-M` IDs. Selection is narrow and does not change another object's paint, global palette colours or texture layers; the recipe preserves identity through Undo, downloads and scene changes. If a saved target no longer exists, it remains selectable with an unavailable label rather than being arbitrarily mapped to a new region.

This is partial E1/E4; there is no direct canvas click-to-embroider shortcut or multi-treatment authoring panel yet. No physical device evidence or optically judged thread-quality signoff.

## Crossing stitch continuity correction (PR #481, 2026-10-22)

The initial E1 implementation overpainted ribbons at geometric self-intersections without replaying their new thread surface. [#481](https://github.com/gamesbyian/wallgen/pull/481) uses identical stitched station coordinates for full ribbons and bounded crossing touch-ups, clipped to the foreground branch. This resolves a specific source-verified seam and bounds performance by crossing segment length. Still not physical-device artistic acceptance or final E2–E5 thread science.

## Follow-up compact workspace (PR #478, 2026-10-22)

[#478](https://github.com/gamesbyian/wallgen/pull/478) adds a native expandable Thread workspace within Texture → Surface. Closed, it leaves ordinary surface knobs accessible and reports the active palette selection. Open, it presents only the Thread controls, avoiding a permanently taller no-scroll phone card. The underlying treatment object, target IDs and original field identities do not change. This is a source-qualified E4 UX step, **not** a physical-device or complex thread realism acceptance gate.

> **CURRENT IMPLEMENTATION STATUS · 2026-10-22:** The initial [#464](https://github.com/gamesbyian/wallgen/pull/464) document was a specification, but its E0/E1 embroidery foundation and editor controls subsequently **shipped in [#474](https://github.com/gamesbyian/wallgen/pull/474)**. Compact disclosure [#478](https://github.com/gamesbyian/wallgen/pull/478), crossing stitch replay [#481](https://github.com/gamesbyian/wallgen/pull/481) and authored-object targeting [#482](https://github.com/gamesbyian/wallgen/pull/482) also merged. Live issue [#467](https://github.com/gamesbyian/wallgen/issues/467) remains **open for more physically convincing stitches, underlay, thread orientation/masking, advanced role targets and true visual-device acceptance**. The sections below retain the *original planned architecture* as historical design context, not as claims about missing implemented features. Preserve all three legacy texture layers and old PNG recipes; keep E2–E5 QA proportional rather than creating new CI factories.

## First implementation checkpoint (PR #474, 2026-10-22)

The initial E0/E1 branch [#474](https://github.com/gamesbyian/wallgen/pull/474) implements `src/embroidery.js`, an optional bounded `surfaceTreatments` recipe collection, deterministic object/palette/all-fill role selection, and first visibly shaded transverse path stitches plus masked row stitches for regional geometry. The Texture → Surface card has a compact On/Off/colour, spacing and relief control. No extra named tool or mobile destination was created. Old designs lacking `surfaceTreatments` continue on the exact legacy raster path; existing material layers remain independent.

**The implementation is deliberately not the full design below.** Current region stitch orientation is a simple artist-editable angle and ribbon stitches use basic ridge shading. Object-ID-specific treatments are now usable in the editor through [#482](https://github.com/gamesbyian/wallgen/pull/482), while advanced stitch-underlay, true normal/fibre fields, optional outline/interior stitch roles, embroidery-specific variation locks and optical/device review remain pending. The first UI supports one editor-owned treatment, palette/all fills and explicit object targets without changing unrelated saved treatment entries. Inspect actual embroidered output before advancing E2–E5. No referenced upstream implementation has been copied.

## Implementable architecture, visual design, UX contract, research and phased delivery

**Original design snapshot:** 2026-10-22, based on gamesbyian/wallgen main at `7e970906222ebf1d085b12527f2a6aa9106d9209`. **Historical status at authorship:** specification only. **Current implementation after #474, #478, #481 and #482:** initial renderer, normalized recipe and compact controls are present; advanced phases below remain plans. Reconcile the live source rather than coding from this dated snapshot as if E0/E1 were unimplemented.
**Related:** [film look plan](PHOTO-FILM-LOOKS-AND-FILTERS-PLAN-2026-10-22.md), [material engine](MATERIAL-SURFACE-ENGINE-2026-10-21.md), [quality issue #445](https://github.com/gamesbyian/wallgen/issues/445), [human-centred field guide](AGENT-HUMAN-EXPECTATIONS-AND-CREATIVE-COMPOSITION.md), [semantic UI audit](IA-SEMANTIC-CONTROL-AUDIT-AND-REVISION-PLAN-2026-10-22.md), [worker design](WORKER-RENDERING.md).

## 1. Product goal, outcomes and boundaries

Make any selected wallpaper region, seven-colour stripe, imported/stamped silhouette, interior decoration, outline or divider convincingly *embroidered onto a substrate*, while still allowing the rest of the artwork to use independent textures. The result must feel like thread with a physical direction, thickness, occlusion, weave, highlights and subtle irregularities, not a static stitch pattern pasted on top. Creative defaults should make good decisions without requiring hand digitizing.

Six representative user intentions:
1. "Make all seven curving ribbons satin-stitched on black linen, including believable over/under crossings."
2. "Embroider only the orange circle; keep the six other circles flat."
3. "Give the seven colour partitions tatami fills whose thread directions contrast coherently."
4. "Turn a white outline into a chain-stitched edge while keeping an independently adjustable gap."
5. "Make a drawn/imported silhouette contour-embroidered, including holes and disjoint islands."
6. "Randomize the overall embroidery style but preserve locked stitch gauge, region assignments and a useful degree of harmony."

**Non-goals for initial release:** embroidery-machine file export, realistic fabric physics/finite-element cloth simulation, completely arbitrary embroidery editing, extra top-level mobile destinations, new cloud asset storage, AI artwork classification, giant mandatory visual-acceptance factories. Digital artwork is the purpose; use machine-digitizing research as a source of physically sensible geometry, not a demand to simulate needles and machine travel.

**Preserve:** seven semantic palette indices; existing path/radial/region/scattered geometries; three legacy texture layers and their Material/Finish mini-inspectors; safe and unrestricted geometry choices; saved/favorite/history/Undo/share/PNG recipe round-trip; 600 x 1300 authored world coordinates and 3024 x 6552 default export; camera zoom/pan and nudge invariance; preview/worker/fallback/headless parity; current seven categories and five mobile destinations. Old recipes must remain pixel-identical when the new system is off.

## 2. Observed repo facts and actual integration points

| Source | Verified current behaviour | Proposed change or extension |
| --- | --- | --- |
| src/model.js | normalizeRecipe resolves three active texture layers with world rotation, strength, scale, blend and coverage of background/stripes/both; resolveScene builds deterministic path-group and region objects | Normalize versioned surface-treatment collection and inherited style-group settings; create semantic binding resolver separate from legacy layers |
| src/composition-geometry.js; src/scattered-composition.js | Object IDs such as bundle-N and region-N, palette slots, scattered circle/silhouette geometry, radial and polygon partitions | Preserve IDs and introduce explicit addressable fill/boundary/decoration roles; avoid regenerated-object assumptions across seed/mode changes |
| src/path-geometry.js | samplePath gives tangent and normal; widthAt and ribbonEdge give cross-sections | Stitch stations in authored arc length, satin rails, curvature/corner-aware planning |
| src/contour-decoration.js; src/polygon-inset.js | Canonical contour sampling and metric insets; holes/disconnected regions supported in the region painter | Contour-following seams, stitch phase, edge distance, complex-mask inclusion |
| src/interior-elements.js | Up to eight enabled targeted decorative elements; colours and object-ID filters; local/field/contour modes | Treat each decoration as an addressable role with its own optional stitch effect and inherited thread style |
| src/material-surface.js | Seeded aperiodic, coordinate-anchored materials; knit/fabric threads; materialHeight used for stripe relief | Keep as substrate engine; introduce separate stitched macrogeometry, sampled micro-height and normal field |
| src/renderer.js | Stripes/regions painted into transparent ink, crossings repaired by branch repaint, textures applied with masks, background + ink composited, then canvas atmosphere | Introduce structured per-role masks/treatments and thread render pass at an exact compositing stage; preserve branch occlusion and native background |
| src/render-worker.js; src/render-coordinator.js | Same Canvas2D painter in workers/fallback; settled previews cache background and ink, transient preview and independent export worker | Cache keyed stitch plans and material shading; avoid rerolling when camera moves; bound export memory |
| src/editor-schema.js; src/editor-material-inspector.js | Seven categories, current 40 tools; Texture has Layer 1/2/3 and Surface, each layer has original-node Material/Finish views | Add a compact contextual Treatments tool; do not resurrect older seven Material/Finish tool chips |
| src/app.js; src/editor-tool-applicability.js; src/scoped-random.js | Locks, scoped variation, conditional tool availability, undo and normalized recipe transport | Include collection-level locks and scoped target reroll without loss of unrelated settings |

The existing texture system is **world-space and largely wallpaper-wide**. It does not orient a material along an object tangent nor target a specific region/border independently. Also current contour distortion deforms stripe boundaries only, as MATERIAL-SURFACE-ENGINE states; do not claim it already displaces region boundaries. Existing knit texture is a material mark generator, not semantic embroidery.

Current UX reconciliation: recent implementation consolidated separate Material and Finish tools into one per-layer inspector; current Texture tools are **Layer 1, Layer 2, Layer 3, Surface**. Some old audits still describe 43 tools as a historical snapshot. Do not design against that outdated menu.

## 3. Research, transferable code and licence diligence

| Resource | Useful capability | Reuse strategy |
| --- | --- | --- |
| [StitchFoundry](https://github.com/Stitchwright/StitchFoundry) [direction.rs](https://github.com/Stitchwright/StitchFoundry/blob/main/crates/sf-core/src/direction.rs) and [satin_line.rs](https://github.com/Stitchwright/StitchFoundry/blob/main/crates/sf-core/src/satin_line.rs) | Automatic inclination guides, turning strips, longitudinal columns and smart sharp-corner joins | MIT OR Apache-2.0; port directly/adapt with notices and exact commit pin where useful |
| [penfill](https://github.com/piLeoni/penfill) | Polygon-aware zigzag, concentric, spiral, hatching, flow-line, masks and boundary fraying | MIT OR Apache-2.0; evaluate Node/WebAssembly performance and bundle weight before vendoring |
| [Directionality-Aware Design of Embroidery Patterns, 2023](https://github.com/desmondlzy/embroidery-streamlines) | Density/direction-field streamlines and patch-based guidance for organic shapes | MPL-2.0; research prototype, evaluate and retain applicable file-level source obligations |
| [Ink/Stitch](https://github.com/inkstitch/inkstitch) | Practical satin, guided/tatami/contour fills, underlay, routing and machine-stitch conventions | GPLv3; strong reference, direct reuse possible only with distribution obligations examined |
| [PEmbroider](https://github.com/CreativeInquiry/PEmbroider) | Concentric, spiral, hatch, vector-field and stochastic embroidery | GPLv3 / Anti-Capitalist Software License dual terms; verify chosen licence before actual copy |
| [p5.embroider](https://github.com/nkymut/p5.embroider) | Browser-side computational stitch patterns | LGPL-2.1-or-later; p5.js dependency and early alpha make selective adaptation preferable |
| [Clipper2 TypeScript](https://github.com/countertype/clipper2-ts) | Boolean polygons and robust offsets | Boost 1.0; benchmark against current insets first |
| [Embroidery Modeling and Rendering (Chen et al., Graphics Interface 2012)](https://graphicsinterface.org/proceedings/gi2012/gi2012-17/) | 2.5D thread shape, lighting, layered and antialiased appearance | Research implementation reference, not assumed reusable source |

Artistic research: Punjabi Phulkari/Bagh uses stitch orientation to make similar-colour silk change perceived brightness; Bengali Kantha uses continuous running stitches and contour echoes; Japanese sashiko/hitomezashi uses counted grid rhythms; Chinese luanzhenxiu (乱针绣) layers controlled, differently directed stitches. These are **distinct aesthetic grammar presets**, not a single "ethnic-looking texture" slider. Prefer descriptive controls with optional provenance/read-more references.

Permissions: ROYGBIV's public-domain dedication does not erase upstream rights. MIT/Apache/Boost direct copy is generally practical with notices; MPL has file-level conditions; GPL and LGPL have further duties. Personal use alone should not be equated to licence compatibility for publicly served/redistributed code. On implementation create THIRD-PARTY-NOTICES.md with author, URL, immutable revision, files, modifications, licence and whether shipped. No third-party code is copied in this plan.

## 4. Architecture: semantic assignments, coordinate frames and style relationships

### 4.1 Resolve a material per *surface role*

Introduce surface-role descriptors resolved from the current scene, not synthetic array-position targeting:

- substrate/background;
- path bundle / individual stripe fill;
- stripe outline (both rails / one-sided) and gap (gap remains genuinely transparent);
- region/scattered/radial fill and boundary/divider;
- interior element stroke/band or individual motif instance as appropriate.

Addresses use stable rendered IDs plus role, optional 0..6 semantic colour-slot filters. E.g. target: {scope:'object', ids:['region-3'], role:'fill'} or {scope:'palette', colorSlots:[1,3], role:'any-fill'}. Preserve the interior-elements rule that object and colour restrictions are intersected, not silently unioned. Bind to recipe snapshots and distinguish unavailable targets from deleted ones. For ID churn, a binding to a vanished generated object becomes visibly dormant, never silently reattaches to a different colour/object.

Inheritance chain: background default -> material style group -> role-level assignment -> object/colour assignment -> explicit element override. Define precedence and all/none masks once in a pure resolver. No new eighth rainbow pigment. "No treatment" is distinct from inherited treatment and must be available as an explicit override.

### 4.2 Material coordinate contract

Define a sampled material frame F(object, p), returning origin, tangent, normal, principal direction, UV/signed edge distance, local width, and authored-world transform. Modes:

- world: a shared field fixed to authored canvas coordinates, ideal for substrate weave;
- object: inherits each object's transform, good for stamp textures;
- path: station s measured by arc length, transverse normalized offset t, avoiding shrinking/pinching around bends;
- contour: perimeter arclength and signed inset distance, including hole loops;
- guided: spatially varying unoriented orientation field from contour tangent, shape principal axis, medial/streamline guides and editable guide paths.

Represent unoriented directions with the doubled-angle vector (cos 2θ, sin 2θ) to blend fields without 0/180 discontinuities. Establish a deterministic tie-break and singularity fallback; field sampling independent of crop or paint order. Maintain consistent physical stitch gauge in design units while separating pattern scale, yarn diameter, row spacing and broad material scale. Avoid forcing uniform scale on independently sized motifs.

### 4.3 Linked style-group relationships

A style group defines yarn gauge, sheen, stitch density, underlay/padding, relief, light response, jitter level and preferred orientation *offset*. Assignments inherit that group while independently following geometry. Support:
- Auto: geometry computes best direction/density and scales narrow features appropriately.
- Linked + offset: same thread identity and controlled neighbour-angle differences (e.g. alternate 30°/75°).
- Manual: editable orientation and gauge per assignment.

Adjacent region orientations can be chosen by graph colouring/optimization on touching-region adjacency, maximizing legibility without producing arbitrary checkerboarding. Assign priority to user-drawn guides and locked settings; explain when auto rules must depart from their preferences to prevent bunching or singularities. Variation must operate on linked groups, not sprinkle unbounded random angles per thread.

### 4.4 Versioned recipe proposal (NOT yet implemented)

Add one optional normalized collection (suggested key surfaceTreatments, max 12 records) and a bounded styleGroups collection (max 8), rather than proliferating hundreds of scalar keys. Each treatment stores stable id, enabled, target, materialFamily:'embroidery', stitchStyle, styleGroupId, coordinateMode, local manualOverrides, seed salt. Validate numeric bounds, complexity, string lengths, enum choices; preserve unknown future keys safely per recipe-version strategy. Design treatment IDs deliberately, distinct from generated geometry IDs.

Existing material/material2/material3 keys and coverage remain unchanged and their old appearance is preserved. Do **not** implicitly reinterpret legacy knit or linen as embroidery. Declare explicit fallback behaviour for imported older links/PNG; full recipe snapshots must remain self-contained, without external library lookups. Collection edits integrate lock, scoped random, Undo, favourites, recent history, JSON/link/PNG and export metadata. Unchanged recipe yields byte/pixel-stable procedural decisions.

## 5. Embroidery algorithm and layering decisions

### 5.1 Stitch-planning stages

1. Resolve target polygon/circle/polyline geometry in authored logical coordinates, including multiple rings and holes; retain semantic object/role identity and real z-order.
2. Classify role/shape: thin line, satin-width ribbon, broad region, outline/contour, isolated small motif. Compute local width, curvature, aspect ratio, medial-axis risk and neighbours.
3. Choose a stitch plan: transverse satin for narrow ribbons/columns; split satin or staggered tatami for broad spans; contour echo and guided fills for irregular regions; running/chain/backstitch for outlines; knots for tiny circles. Do not pretend physical machine constraints are mandatory for stylized wallpaper.
4. Generate stations with coherent path arclength, paired rails and continuous phase across croppings. Adapt pitch to curvature and local width. Sharp corners use fan/miter/cap methods; smooth tiny inside radii or permit planned bounded gaps. Holes use correct loop winding and never become filled.
5. Emit compact stitch geometry with origin/endpoint or centreline/width profile, yarn/style id, instance seed, row order, microheight/normal coordinate, clipping role and z-layer. Separate the *stitch plan* from pixel rendering.
6. Optionally add underlay for raised satin, controlled imperfections and sparse exposed substrate. All randomness keyed by recipe + treatment ID + object identity + geometric station, never by crop or raster loop.

### 5.2 2.5D appearance without full cloth simulation

Draw thread segments as raised, slightly twisted/flattened cords with a consistent cross-section, along-thread fibre highlights, view-fixed light direction, ambient occlusion at contacts and puncture shadows where the needle enters the base. Keep thread colour tied to the existing palette slot, modulated by plausible shade and sheen. The substrate weave remains visible between stitches. Use a material-normal/height representation if feasible; choose CPU stroke/canvas path prototype first and consider fragment shaders only when device profiling justifies it. Preserve scaled appearance through prefiltering/mip-like aggregation rather than hard aliasing or post-hoc blur of all detail.

Crossings: repaint the selected *original* top-branch stitch identities through the existing branch mask; don't regenerate a fresh local patch with new phase/seed. Underpassing threads are occluded; visible gap/background stays unfilled. Region overlap uses existing paint order and matching role masks. Borders stay separate from fills; outlineBuffer continues to mean **distance**, not outline thickness.

### 5.3 Renderer integration point and compatibility

Current renderer creates the transparent foreground ink, applies stripe textures, composes background, draws shadows/ink, and then applyCanvasAtmosphere. The new stage needs explicit multi-role masks or per-role paint commands **before ink is flattened**, but without modifying how legacy material source-atop compositing works. A proposed render graph:

geometry -> role masks -> flat colour + legacy material passes -> embroidery plans + shaded treatment per role -> existing z-order/occlusion and nudge -> ambient light -> optional whole-image film look (separate plan) -> preview / export.

The exact ordering of thread shading versus canvas atmosphere must be visually validated. No baseline pixel changes when all treatments are disabled. World-fixed substrate marks stay put under nudge; object-attached embroidery follows the object; the camera changes only framing. Cache art, stitch plan, masks and shading separately where valid; do not assume a nudge cache generated without embroidery can be naively reused afterward.

## 6. UI/UX specification and human workflow (mandatory design work)

### Human intention and discovery

Primary question: "Which part do I want to make look stitched?" The UI should start from that answer, not demand the user know satin/tatami physics. Preserve the **seven categories**, five mobile destinations, one-screen fixed-height settings cards, existing 44px actionable targets, keyboard/screen-reader names, one-row navigation, no vertical settings scroll, and recognisable cream/dark styling. The current Texture category has 4 tools; propose a *fifth contextual tool* called **Treatments**, not three extra Finish panels.

**Starting state:** Tap Texture -> Treatments; choose *Embroider* -> default **All colour shapes**; preview immediate. The next visible control is **Apply to** with choices All colour shapes / Background / Selected colour(s) / Choose objects / Outlines & dividers / Decorative elements. Defaults use existing geometry classification. Do not present object selectors before a user asks to narrow scope.

**Card design:** One selected assignment per card, with compact in-card **Where / Style / Thread** mutually exclusive views analogous to the working Material/Finish inspector. A short always-visible breadcrumb says "Embroidering: all seven stripes" or "Orange circle / outline". Where holds scope; Style holds style preset, mapped direction (Auto/Follow curve/Contour/Fixed), subtle regularity; Thread holds density/gauge and raised depth/sheens. Advanced subcontrols shown only when relevant. No vertical scrolling; use horizontal swipe/card mechanics already accepted, rather than a tall parameter dump.

**Preset chips** (not new global styles by default): Silk satin / Patchwork fill / Hand running / Chain outline / Contour echo / Painterly layered. Show a live descriptive preview based on *current artwork*, not an irrelevant stock sample. A preset changes only its treatment record, not geometry or the global palette. Selecting a different preset never silently overwrites user locks.

**Contextual entry:** Details > Elements offers "Surface treatment…" deep-link for selected decorative element, preserving stable selection across specialty cards. Outlines/Dividers provide "Embroider edge…" deep-link; geometry/scattered selection offers "Treat this shape…" with read-only target preselection. Do not add redundant permanent controls to every card.

**Automatic linkage:** Surface group selector "Together / Vary by colour / Independent"; by default related assignments share yarn gauge, lighting and regularity while angle responds to contours. "Direction" shows effective computed orientation plus a tiny accessible helper "Follows the ribbon around bends". Locked/manual override is explicit; disabled controls retain saved values but visually read inactive / effective zero where appropriate. A switch from path mode to regions retains treatments but shows dormant target explanation and a repair chooser.

**Interaction sketch:** Open treatment -> choose preset -> decide scope -> compare On/Off with one undoable toggle -> optionally adjust thread -> save. Under 44px no target; state transition must preserve focus and no collapsing edit card after Save/Favourite. "Before" is momentary and must not modify recipe; persistent bypass is saved. Selected object scopes are visible in a compact label. Accessible controls name the object/role and effective direction. Reduced-motion setting suppresses preview transitions, never the final rendered outcome.

**Random & locks:** Add scoped reroll for treatment preset, density, direction relationship and irregularity; changing the global seed can only change unlocked treatment randomness; locking a binding keeps target and style stable. Keep prime-only behaviour restricted to its established numeric/angle semantics, don't apply bizarre prime constraints to physical stitch endpoints.

**No unnecessary UI redesign:** one new Treatments tool and targeted deep links, with a single implementation sketch and one real phone optical check before committing. The broader semantic navigation map is a source of goals/prerequisites, not licence to reorganize all tabs.

## 7. Implementation queue with small acceptance gates

**E0 - Establish explicit decision record.** Compare Canvas2D stroke prototype, penfill WASM/Node, selective Rust-to-JS port, and fully vendored Rust/WASM based on code size, export latency, ease of editing and app's unbundled ES module deployment. Record any copied-file licences and pinned revisions. Confirm current main and #445 status first. Documentation/benchmark, no extensive CI.

**E1 - Semantic surface assignment.** Pure resolver for shape/object/colour/role targets, precedence, dormant scopes and style-group inheritance; normalized bounded recipe collection, all transports, locks, random/Undo. No pixel change by default. Focused Node tests on missing object IDs, colour intersections and round-trip.

**E2 - Coordinate adapters and reference patterns.** Curved ribbon transverse satin, contour running stitch and basic fixed-angle region tatami. Show path, radial, nested and scattered in headless examples; ensure no crop-phase changes. Add guided field after these patterns are good.

**E3 - Thread painter and crossings.** Tiny 2.5D thread implementation with dynamic highlight/shadow, fabric exposure, region clip/multi-ring, repaint/overlap, output scaling and correct drawing order. Compare 6 representative compositions at preview vs 3024x6552; one Pixel 6 Pro performance exercise. Correct problems observed rather than generalized aesthetic-score claims.

**E4 - UI and artistic linking.** Treatments tool with Where/Style/Thread views and contextual deep links; scoped reroll/locks, useful presets, informative inactive conditions, accessible focus and Undo/Save behaviour. Human cognitive walkthrough using goal statements plus one real screen-size audit; no synthetic usability metrics.

**E5 - Advanced geometry/quality.** Guided strokes, adjacent-region directional contrast, imported silhouettes and holes, small motifs, French knots, underlay, coherent hand-drawn variation; optional SVG/stitch-plan debug export. Further optional code reuse only where demonstrably worthwhile.

**Acceptance gates:** (a) old recipe yields the exact old artwork if off; (b) object/colour/role targeting physically isolates effects; (c) paths/holes/crossings coherent; (d) save/export/import exact recipe and consistent pixels; (e) pinch/pan/nudge never rerolls stitch IDs; (f) performance proportional to visible elements; (g) app remains pleasant on a portrait phone with no settings-card scrolling; (h) sensible output remains at weak and high strengths. Six purposeful art fixtures and the normal quick check are enough. Avoid new CI workflows and 1000-image screenshot decks.

## 8. Risks, alternatives, open design questions

- **Huge stitch counts:** use geometry caching, LOD/aggregated stroke shading and bounded total stitches; don't force full 19.8MP readback for every slider movement.
- **Narrow features and corners:** automatic switch to split stitch/running or capped satin; show a truthful effective fallback.
- **Library/path reuse:** imported geometry snapshot remains in recipe, with independent treatment descriptors; deleting library copy cannot break wallpaper.
- **Disjoint/holed regions:** use even-odd masks and separate contour loops; no centroid-only shortcut.
- **Legibility:** subtle yarn shading must respect vibrant rainbow hues; user may opt into more aggressive colour shifts, never replace semantic slots.
- **Visual semantics of "real" stitches:** provide both art-driven and physical-realism presets; measured machine sewing constraints are optional future work.
- **Licensing/cost:** direct code reuse allowed where licence permits; record notices; package WASM assets locally for full offline PWA operation.

**Decisions proposed for first implementation:** separate stitch geometry from rendering; adopt five material coordinate frames; per-role targeting instead of wallpaper-only coverage; make Auto + linked groups the default; put the new tool in Texture; keep film emulation as a separate final image pipeline (see linked plan). No runtime changes in this PR.

## 9. Coordination with digital camera and film effects (2026-10-22)

The photographic finishing plan now also covers [modern computational phone, DSLR and webcam looks](DIGITAL-CAMERA-AND-COMPUTATIONAL-PHOTO-LOOKS-PLAN-2026-10-22.md). Treat embroidery as an object-scoped *surface material* before scene composition is finalized; Photo remains a separately optional whole-image postprocessor, with one **Light > Photo** tool and Camera/Film families. Do not copy digital compression, sensor-noise or tone-mapping controls into Texture > Treatments; woven substrate and embroidered thread geometry are fundamentally different from camera image signals. Preview/export/light/camera ordering and shared worker constraints are specified by the companion photographic plans. These remain independent, unimplemented workstreams on the [active roadmap](ACTIVE-PRODUCT-ROADMAP-2026-10-22.md).
