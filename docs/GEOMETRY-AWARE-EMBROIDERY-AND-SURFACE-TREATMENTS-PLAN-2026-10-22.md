# ROYGBIV: geometry-aware surfaces and procedural embroidery

**Live delivery state:** The original Satin/Tatami foundation, Running, Soft Satin, linked Chain, region-angle preservation, per-object targeting and representative imported hole/island clipping are implemented on `main`. Actual production artwork for [Chain](EMBROIDERY-CHAIN-STITCH-IMAGE-FINDINGS-2026-10-22.md) and [compound region](EMBROIDERY-COMPOUND-HOLE-PRODUCTION-FINDINGS-2026-10-22.md) was visually inspected and recipe-checked. The 412×892/320×700 browser Thread panel has also passed [four actual viewport states](THREAD-PORTRAIT-INSPECTION-2026-10-22.md). New work should target **opt-in, physical-looking fibre/underlay/shading** or real Pixel touch feedback, preserving all older saved paint branches. Start from [the reconciled handoff](AGENT-HANDOFF-2026-10-22.md), not outdated original E0/E1 plans.


## E3 opt-in linked-loop Chain stitch (2026-10-22)

The new `chain` treatment is explicitly different from regional Tatami hatching and Ribbon Running seams: paired cubic arcs make a genuine interlocking loop per link, with subtle offset highlight/underlay. Three rows follow existing ribbon tangent-normal geometry, with the same immutable global stitch station lattice used in overpassing loop replays. Regional links form staggered short courses, still clipped by the caller's existing even-odd compound silhouette. Explicit budgets cap renderer work per ribbon/region. The technique is based on documented [hand-chain mechanics](https://flossfield.com/embroidery/stitches/chain-stitch/), where a loop is drawn through the previous stitch, but is a stylized 2D representation, not thread physics. Use the existing `style` field/UI instead of a new tab or recipe model; pre-existing art remains unchanged. The [four actual production images](EMBROIDERY-CHAIN-STITCH-IMAGE-FINDINGS-2026-10-22.md) were generated, downloaded, visually reviewed and CRC/recipe checked in Actions #39890740813. Linked ovals distinguish Chain from straight hatch marks; no black pixels changed. The very tight inner red/orange turns crowd some links and remain an artistic refinement possibility, not a correctness failure or reason to silently retune a saved style.


## E3 compound hole and detached island acceptance (2026-10-22)

A small pure authored [geometry fixture](../scripts/compound-stitch-fixture.mjs) is an actual normalized portable Shape Library snapshot with two components, one interior hole and one detached island. The [two-picture art study](EMBROIDERY-COMPOUND-HOLE-ART-REVIEW-2026-10-22.md) uses the shipped scene builder, the existing even-odd mask in `drawRegionObjects` and opt-in Tatami. Unlike previous circle images, it probes negative-space preservation, disconnected regions and single-object target semantics together; tests ensure the source geometry itself survives recipe transport. This is additive evidence, not a change to any existing stitch painter or export pipeline. The [real PNG pair](EMBROIDERY-COMPOUND-HOLE-PRODUCTION-FINDINGS-2026-10-22.md) was actually rendered and inspected (Actions #39889647143), with complete PNG/recipe integrity checks. All 730,320 original-black pixels remain exactly unchanged under Tatami, including the central cutout and detached-island gap; the two solid regions visibly receive stitching. This accepts the representative compound even-odd masking contract without licensing broader fibre-physics claims.


## E4 preservation: make existing regional stitch direction editable (2026-10-22)

The `surfaceTreatments[].direction` value was already normalized and used by the region renderer, but the editor previously hardcoded `direction:38` on every edit, silently replacing a restored non-default angle. A native numeric **Region angle** now lives in the **same grid row** as Stitch style, restores the authored decimal value and participates in normal Save/Undo/PNG. The input disables for ribbon/path scenes (where the tangent determines stitch direction) without deleting the stored direction for future region use. Source, bound and recipe tests cover the preservation contract. This advances [issue #514](https://github.com/gamesbyian/wallgen/issues/514) without another mobile row, renderer rewrite or screenshot CI.


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

## 1 November 2026 · E3 shared source-world thread lighting

**Research and implementation:** Existing stitch types already retain source-authored world-space stations, tangents/normals and original-ink clipping, but their raised-cord appearance used a fixed top-left light direction. Turning the global Light direction to bottom-right could therefore reverse canvas atmosphere while satin highlights, chain links and fibre shading continued to face the former light. Sand S4.3 already provides the common global directional material lamp and fixed elevation.

The new **src/thread-lighting.js** defines an independent analytic 2.5D thread profile. Given a real stitch segment's endpoints, Pitch, Relief and the inherited world-light vector, it derives stitch tangent/perpendicular, bounded source-unit height, contact-shadow reach from the existing common lamp elevation, and light-facing specular energy. This differs from sand grains: yarn has an orientation, and its appearance changes as the stitch rotates. The model keeps source paths rather than storing an image-sized height buffer.

- **src/embroidery.js** now accepts optional inherited lighting in real ribbon and region painters. Satin, soft satin, running seams, chain curves, satin-fibre and tatami-fibre strokes respond to incoming light direction, mood and strength. Every unlit drawing branch remains intact. Region fills rotate the lamp into the original fixed-angle stitch coordinates using the same rotation as Canvas2D; ribbon calls inherit the already-mirrored/rotated scene light, including over/under crossing replay.
- The existing renderer continues to clip to actual source strokes/ribbon envelopes or even-odd region boundaries. No expanded pigment, altered stitch stations, new recipe property, new global slider or second rendering engine. The source-art preview cache now invalidates for active embroidery on lighting changes; disabled treatments/plain artwork retain the compositor-only fast path.
- Required quick tests check no-light stroke-stream identity across all styles, opposite-direction shadows, anisotropic glints, region rotation, cache invalidation and current compound/crossing clipping hooks.
- **Real, independent production Canvas2D acceptance:** [paired Chromium run #41279108748](https://github.com/gamesbyian/wallgen/actions/runs/41279108748) PASS. Using the **same installed Chromium** on original main `e6effc751b58acd3082beab4e898cbc993add085` versus the feature source, the `scripts/embroidery-world-light-browser.mjs` fixture rendered 15 genuine 600×1300 wallpapers: satin/chain/fibre ribbons and tatami/fibre imported compound regions under Off, northwest and southeast daylight. All **5 unlit source PNGs were byte-identical**, all **10 lit source PNGs changed**, and the original compound cutout remained background while the detached island retained coloured pigment. Source images were examined at wallpaper and stitch-detail scale. The one-shot Actions comparator was retired after acceptance; the reusable script remains. The test was headless Linux Chromium, **not** a physical Pixel 6 Pro or a proof of realistic thread-on-thread contact occlusion.
- **Not yet delivered:** physical Pixel performance, visually inspected true textile optics, per-stitch ray tracing or accurate physical cast shadows between different threads.

**Next topology step:** On actual overlapping stitch capsules, derive the upper/lower relation from the existing original stitch paint order and create a bounded local contact shade only on the physically lower course, inside the source clip. Shared sand contact logic supplies the height projection, but yarn-to-yarn occlusion must respect fabric direction, compound holes, crossing replay and authored object ownership. Do not infer hidden stitches or invent a global raster heightmap.

Research basis: Chen et al., *Embroidery modeling and rendering* (Graphics Interface 2012); Liu et al., *Directionality-Aware Design of Embroidery Patterns* (Computer Graphics Forum 2023); and Sadeghi et al., *A Practical Microcylinder Appearance Model for Cloth Rendering* (2013). ROYGBIV remains a light-weight Canvas2D approximation, not an implementation of those full physically-based models.

## 1 November 2026 · E4a real lower-thread contact, limited proven scope

The merged #962 shared scene lamp creates local yarn-facing highlights; #964 contributes original-source bounded transverse crossing geometry. New **src/thread-contact-shadows.js** uses those exact original stitch segments for a narrow, true-intersection shading pass. It is deliberately restricted to **lit satin and soft-satin ribbons with the canonical Over crossing policy** and original full source painting. Running, chain cubic loops, fibre treatments, region tatami, independent crossing replays and Under/Weave retain existing artwork. Straight and ordinary wave/hairpin strokes do not build a redundant contact graph.

For each real upper/lower crossing, the existing first-painted lower thread is still present on the live Canvas. A tiny dark contact footprint, projected away from the **same world lamp and fixed elevation** as raised yarn, is clipped **again to the lower stitch's original narrow source-coordinate quadrilateral**, inside the existing rendered ribbon clipping. It is applied immediately before the original upper-stitch highlight/underlay, preserving the upper course's original paint order. Crossings on missing/invisible shortened source sections are excluded. A bounded index/segment/intersection budget fails safely back to the accepted #962 local-light path; no full-canvas heightmap or per-thread serialized coordinates.

**Real acceptance:** [same-run Chromium comparison #41286899649](https://github.com/gamesbyian/wallgen/actions/runs/41286899649), exact pre-contact baseline `760406af2aed58090db9bbd1a26b88db0bfda55b` vs new original-source renderer. Seven **actual 600×1300 Canvas2D wallpaper PNGs** were compared as full-source SHA-256s. All **three intended lit Over** cases differed (satin northwest, satin southeast, soft satin northwest); all **four controls were byte-identical** (Lighting Off, Under, Weave, and running-stitch Over). The centre figure-eight ribbon identified **266 real original-station candidate intersections** under the sampled settings. Real full-art and magnified centre-crossing images were inspected: the new dark contact remains a subtle local textile-depth cue rather than a large generic shadow. These were **same-run Linux Chromium** results, not actual Pixel timing, textile manufacturing physics or proof of Under/Weave hierarchy occlusion. The reusable `scripts/thread-contact-optical-proof.mjs` stays; its one-off workflow is retired before the final exact-head quick CI gate.

**Remaining E4:** physical size/thermal measurements; full source-aware hierarchy and lower-yarn clipping during Under/Weave crossing replays; chain cubic and regional tatami inter-course intersections; practical visibility tuning under the owner’s aesthetic judgement. Reject false universal occlusion claims until the relevant original-layer owner can support them.

## 1 November 2026 · E4a yarn cap geometry correction

The initial #965 contact pass used a **flat-ended rectangular lower-thread clip** around each original source stitch. Real sewn yarn and the renderer's original Canvas2D stitch strokes use **round caps**. Near a stitch endpoint the rectangle therefore admitted a corner outside the actual yarn. #966 replaces the contact-only mask with the original stitch's precise **two-semicircle source-unit capsule**, using the segment tangent/normal and unmodified thickness. The global lamp, material pigment, source intersection graph, all region/ribbon clips, saved Over/Under/Weave policy, recipe and Undo remain unchanged. This is a small geometric correction to avoid a false yarn silhouette, not a new lighting algorithm.

[Same-installed-Chromium paired run #41287600384](https://github.com/gamesbyian/wallgen/actions/runs/41287600384) compared seven full production **600×1300 PNGs** between accepted rectangular-mask source `170d84c344b186a5aa31c1755609612feb1fcf02` and the new cap path. All **four negative controls** (Lighting Off, Under, Weave, running) were **byte-identical**. All three eligible lit satin/soft-satin cases changed. An independent actual-PNG pixel-array comparison found the correction affected **844** pixels in northwest satin, **707** in southeast satin, and **923** in northwest soft satin, out of **780,000 pixels each**, i.e. **0.091–0.118%** per artwork. The changed-pixel bounds were narrowly concentrated horizontally (x=248–350 in original 600-unit art); changes were small (maximum per-channel difference 10–25), and full art / enlarged crossing imagery was examined. The small affected area is appropriate for a correction to **contact clip endpoints**, not evidence of a global change in embroidery appearance. Permanent pure geometry tests verify the two forward/back semicircles on horizontal, vertical, reversed and diagonal stitches and refuse degenerate caps.

This is Linux headless Chromium, not proof of hardware performance, thread physics, or every real crossing configuration. The disposable source-paired browser workflow is deleted after evidence; the permanent `scripts/thread-contact-optical-proof.mjs` remains from #965. Exact-head CI still owns the merge decision.

## 1 November 2026 · E4b actual Under/Weave yarn contact replay

The first E4a source-topology contact shadows handled only the original **Over** satin/satin-soft painter. The renderer also supports user-authored **Under** and alternating **Weave** crossings by repainting the selected foreground ribbon branch at each original self-intersection. E4b connects the *existing* original-source satin contact graph to that real crossing replay without assigning new rainbow-colour paint-order semantics.

**Implementation:** the renderer allocates one original, complete satin contact graph for each eligible source stripe **at most once per paint** and only when the user's crossing mode is Under/Weave. For every actual source crossing, the preexisting `crossingTopIsLater(mode,stripe.index,k)` chooses the upper traversal. A pure selector in `src/thread-contact-shadows.js` retains only pairs of real yarn intersections that belong to opposite original early/late visits at **that** junction, within bounded original-station and stripe-local source-position proximity. This excludes merely nearby yarn, huge shallow-crossing branch windows and new false shadows where the two original visits were never in contact. The selected lower-yarn round capsule receives the same world-light contact shade **immediately before the chosen top stitch is repainted**. The actual top stitch stations, phase, colour, ribbon masks, crossing clip, full-source objects and editor/Undo remain unchanged. Over mode and every other style do not take this new path. No extra serialized recipe field or independent render compositor was created.

**Same-run genuine Chromium proof:** [Actions #41288846253](https://github.com/gamesbyian/wallgen/actions/runs/41288846253) compared accepted `main` `c5e95f08de5a70627f027b8bd081c1b5c35f3d0f` with the final bounded replay logic under the **same Linux Chromium** using seven real 600×1300 production `drawWallpaper` PNGs. Both real Under and Weave artworks changed as intended; all **five source-identical controls** remained byte-identical (Off, Over NW, Over SE, Soft Satin Over and Running Over). An independent PNG pixel-difference inspection measured 2,459 of 780,000 changed pixels in Under (~0.315%) and 2,409 of 780,000 in Weave (~0.309%); both localized to x≈271–329 / y=624–700 near the genuine crossing, not a full-art recolour. Max per-channel delta was 51, mean changed-component absolute difference ~9.4. Full art and magnified 2×2 before/after junction crops were inspected. [Reusable original-source optical fixture](../scripts/thread-contact-optical-proof.mjs) remains; the disposable browser workflow is removed before clean exact-head CI.

**Limits:** this is bounded, analytically projected Canvas2D local contact on lit satin/soft-satin yarn. No actual physical-device Pixel 6 Pro performance or thermal judgement, no universal cloth/light transport, no chain cubic curve intersection, and no compound-region/tatami-overlap occlusion proof. Extending the latter requires matching their real authored stroke geometry and original object clip with independent optical acceptance.

## 1 November 2026 · E4c true fibre-underlay contact response

The E4a/E4b satin original-source graph is now eligible for the two **ribbon** fibre finishes, `satin-fibre` and `tatami-fibre`, because both truly draw the same transverse source-station thread geometry through `fibreSpan`. This does **not** imply region tatami rows or cubic-chain loops are geometrically equivalent.

Unlike satin, the real fibre underlay lives at a finite source-normal displacement (+0.35 units), uses the exact `min(3.2,max(0.8,pitch*0.32))` original line width and already carries an offset projected **away from the same world lamp**. The graph computes its original source endpoints including those exact physical underlay offsets before intersecting candidate stitches. Existing Over/Under/Weave canonical crossing decisions and station-stable clipped replays are reused; the smaller, world-oriented, rounded lower-thread footprint still clips the shadow. The fibre-specific contact radius and opacity are substantially lower than raised satin, and the actual upper microstrand painter is unchanged.

**Independent real Chromium evidence:** [same-run source-paired #41289890504](https://github.com/gamesbyian/wallgen/actions/runs/41289890504), baseline accepted `main` `fcfb5ef8fd67e624745c9b051aace174aa86243d`, renders **12 actual 600×1300 Canvas2D wallpapers** in the same Linux Chromium installation. All **four lit fibre cases** changed (Satin Fibre Over, Under, Weave and ribbon Tatami Fibre Over), and **all eight controls remained byte-identical**, including every older satin crossing artwork plus Lighting Off fibre.

Visual evaluation caught a substantial over-dark patch in the initial candidate's Under/Weave junction: multiple authentic fine-fibre contacts compounded into an opaque-looking area. The fix deliberately shrank the fibre contact stamp and reduced only its opacity, leaving exact source topology and satin strokes unchanged. The final refined PNGs were retrieved, opened and inspected at high zoom: the broad patch is gone. Independent pixel-array differences from original source are now: **285/780,000** affected in fibre Over and Tatami Fibre Over (0.0365%), **1,135/780,000** in Under (0.1455%), and **1,036/780,000** in Weave (0.1328%); maximum channel deltas **21** for Over and **9** for Under/Weave. Full-art source composition remains unchanged except for bounded fine thread-contact shading. Test fixtures verify the precise underlay source displacement, matched line width, original source-station independence, zero unlit contact and much smaller radius/opacity than satin.

**Boundaries:** Real source-responsive Canvas2D 2.5D yarn, not a fabric PBR simulation. This work does not model thread colour changes, chain-link cubic intersections or actual region tatami courses. The temporary paired-browser workflow is retired after evidence, keeping the reusable `scripts/thread-contact-optical-proof.mjs`; clean exact-head CI remains the merge gate. Physical Pixel 6 Pro performance/thermals and human aesthetic signoff are separate.

## Original-geometry region stitch bounds: exact output, less work (3 November 2026, PR #1034)

**Source of waste:** `src/embroidery.js::drawRegionEmbroidery` built its original tatami/running/satin rows across a rectangle sized from `hypot(regionWidth,regionHeight)`, even when a narrow imported source silhouette occupied only a small part of it. The authoritative renderer correctly clipped excess yarn to the object's **original vector path** (including even-odd imported holes/islands), but the redundant Canvas2D strokes and source-lighting calls still consumed CPU. For a 500×20 authored-world-unit source at pitch 5, the old painter attempted **7,144** short tatami segments, though virtually all were outside the original source.

**Implemented geometry-only reduction:** Before iterating source rows, transform the region's existing **four world-space bounds corners** (or exact circle's bounds) into its unchanged rotated local stitch coordinates. The local conservative half-width/height are `(|cos(angle)|*width+|sin(angle)|*height)/2` and `(|sin(angle)|*width+|cos(angle)|*height)/2`. Skip any **non-chain** row beyond that source-local y interval plus `max(24,3*pitch)` authored-world units, and omit individual short tatami/running segments only when their entire original x interval lies outside the corresponding local x interval plus the same margin. The ample margin is larger than the normalized thread-light projection and cap width. This does **not** alter the original source `k` index, stagger phase, `x` stations, lower/upper ink, lamp, treatment, even-odd clip, object geometry, authored recipe, direct/Worker/export painter or original actual stitched pixels. **Linked chain** is deliberately exempt: adjacent cubic contacts need their complete original source ordering. No bitmap alpha readback, saved heightfield, new render cache or second geometry engine.

**Measured real Chromium Canvas2D source proof:** [A/B run #41604561183](https://github.com/gamesbyian/wallgen/actions/runs/41604561183) compared this source to immutable original production commit `924e2ab2e005cb65bc77788b56b725399fb64e11`, using actual identical even-odd polygon clips, circle source geometry and source lighting at 600×1300. Three alternating pairs on seven source styles/objects, plus a **single 3024×6552 native-size three-ring compound PNG**: **all raw complete-frame RGBA SHA-256 matches were exact**, and the actual 1,981,312-byte PNG was byte-identical, SHA-256 `8225c53831ac9d010dd8dbb9ca2a53a1b9b6c969c6a1d9acb18a12a46911df99`. No repainting of a hole, island, edge or single changed alpha channel occurred. The focused [source-control follow-up #41604802170](https://github.com/gamesbyian/wallgen/actions/runs/41604802170) tested only additional satin and chain cases; both again reproduced exact pixels, and the **chain operation count remained 3,465→3,465**.

| Authored source / current style | Original submitted stitches | After conservative bounds | Avoided source stitches | Original / candidate median Canvas2D paint time (ms) |
|---|---:|---:|---:|---:|
| Thin 500×20, unlit tatami | 7144 | **460** | **93.6%** | 6 / 1 |
| Thin 500×20, lit tatami | 7144 | **460** | **93.6%** | 10 / 1 |
| Thin rotated fibre tatami | 7144 | **2200** | **69.2%** | 13 / 5 |
| Tall running stitches, reverse lamp | 12763 | **3415** | **73.2%** | 10 / 4 |
| Ordinary medium rectangle | 530 | **319** | **39.8%** | 1 / 0 |
| Circle tatami fibre | 1382 | **660** | **52.2%** | 3 / 1 |
| Even-odd hole and detached island | 11576 | **4754** | **58.9%** | 9 / 5 |
| 3024×6552 native same compound geometry | 11576 | **4754** | **58.9%** | 20 / 9 |
| Narrow satin source (extra control) | 141 | **13** | **90.8%** | 1 / 1 |
| Linked-chain contacts (excluded control) | 3465 | **3465** | **0%** | 45 / 45 |

These are *local region-thread stage times*, not total wallpaper render or whole-app Random latencies. At one-millisecond resolution, several times are too small for a broad speed claim; **exact rendered pixels and significant eliminated Canvas2D work** are the durable findings. For a genuine imported slender region, the stage should perform materially less redundant painting. This optimization is independent of the E4 question of genuine topological tatami thread-to-thread overlap, which remains open without inventing artificial crossings. The optical benchmark and concise source regression live in the repository; its temporary heavy workflow was removed before merge, leaving normal quick CI unchanged apart from one focused test. Physical Pixel 6 Pro sustained temperature/memory and human creative approval remain untested.

## Safe chain-row source culling after bounded tatami/region work (3 November 2026, PR #1035)

The successful [#1034](https://github.com/gamesbyian/wallgen/pull/1034) original region-bound proof deliberately exempted all chain stitches while proving 40–94% avoided off-clip work for satin/tatami/running. Independent source review establishes a narrower safe chain option: each chain **row** builds `prior=null` before iterating its own original sequential cubic links, and no other row references this previous-link state. Thus an **entire** chain row beyond the already expanded **original rotated region** bounding rectangle cannot contribute to the authoritative even-odd silhouette clip or any in-bounds link, and skipping it does not disturb the source `k` or `chainStride` for retained rows. The very same `max(24,3*pitch)` authored-world geometric halo exceeds the yarn loft, projected lamp reach, linewidth and antialias support. The candidate removes only the prior `!chain` guard from this **whole-row** filter; it NEVER culls individual links within a retained chain row, where contact ordering depends on their original predecessor. No cache, source reconstruction, image grid or recipe setting.

[Original accepted `1aa27b42` versus bounded-chain Chromium A/B #41605927006](https://github.com/gamesbyian/wallgen/actions/runs/41605927006) compared *real* Canvas2D original source cubic paths and lamp-driven linked contacts under the unchanged original vector clip at 600×1300. Five scenes received three alternating original/candidate pairs, plus one actual 3024×6552 imported compound native PNG proof. **Every entire RGBA frame was byte-identical**, and the real 1,634,260-byte native PNG matched SHA-256 `dfbee67e912eda67c37ff497deacf238e974ff127df9c8d0b6fa91b2397a27b5`.

| Source-owned linked-chain geometry | Original links | In-bounds links | Avoided | Stage-only median Canvas2D ms before / after |
|---|---:|---:|---:|---:|
| Thin horizontal imported region, no light | 3465 | **297** | **91.4%** | 25 / 1 |
| Same region, actual directional contact light | 3465 | **297** | **91.4%** | 36 / 4 |
| Rotated thin source | 3465 | **1881** | **45.7%** | 27 / 21 |
| Circular coloured region | 963 | **687** | **28.7%** | 8 / 6 |
| Compound region with hole and island | 3452 | **2282** | **33.9%** | 28 / 19 |
| Native-resolution same compound, exact PNG | 3452 | **2282** | **33.9%** | 58 / 19 |

A low-cost production test asserts that the thin chain still uses hundreds of genuine original links, that original in-row phase is deterministic, and that lighting still produces real consecutive-cubic contact strokes while introducing **no new source clip**. Other nonchain source bounds are unchanged from #1034. These are local source-stage timings and actual pixel identity, not a claimed user-visible Random speedup or physical Pixel battery/thermal test. No new topological shadow beyond actual source linked cubics is added. The optional A/B script is updated; its one-off workflow is retired before clean required CI and merge. Remaining E4 scope is genuine newly demonstrated external/internal tatami contact topology and physical/human acceptance, not fabricated shadows between noncrossing rows.

## Source-disjoint link columns in original linked-chain region fills (3 November 2026, PR #1036)

Accepted [#1034](https://github.com/gamesbyian/wallgen/pull/1034) bounded satin/tatami/running original-world stitch rows; [#1035](https://github.com/gamesbyian/wallgen/pull/1035) extended the same margin to whole chain **rows**, but conservatively left every link in each retained row intact. A narrow or rotated imported shape can still submit hundreds of linked cubic loops that lie *entirely outside* the author's existing region even-odd clip. This adds unnecessary original-cubic path construction and source-linked contact intersection work.

The new extremely local `drawRegionEmbroidery` change checks each original link's x-control hull `cx-half .. cx+half` in unchanged stitch-local authored units against the existing **rotated source-object bound** `±halfX` plus `max(24,3*pitch)`. All chain cubic control points are inside that horizontal hull. When the entire hull misses the padded region bounds, its winding, original clip, round cap, world-lamp projection and adjacent-contact shade cannot reach the source artwork. The link is skipped and local `prior` reset, rather than reconnecting the next retained link to a nonadjacent source station. Every surviving link retains the **same original row `k`, x station, cubic geometry, original predecessor and lamp**. This is complementary to #1035, rather than a replacement of the accepted row filter. The earlier #1035 rule forbidding arbitrary individual-link skips remains correct; #1036 adds a specific geometrically disjoint case backed by actual pixels. No alpha readback, new cache, image-space positions, geometry API, external bitmap mask, source art or recipe schema.

[Original complete-source Chromium A/B #41619031377](https://github.com/gamesbyian/wallgen/actions/runs/41619031377) used immutable accepted `96f6085bf0cb52eda2a67bb9ff1c80a42044484d` for the baseline `src/embroidery.js`, and the identical shared Canvas2D source clips and dependencies for the candidate. Three alternating pairs each for seven 600×1300 actual chain-filled original objects (lit, dark, rotated, circle, tall column and an even-odd compound island/hole), plus one native **3024×6552** compound export. **Every complete rendered RGBA pixel matched**. Full native PNG was **byte-for-byte identical**, 1,634,260 bytes, SHA-256 `dfbee67e912eda67c37ff497deacf238e974ff127df9c8d0b6fa91b2397a27b5`. The fast source test ensures retained original contact curves, determinism and absence of extra clips. There is no physical Pixel, actual Random-click or subjective art-quality claim.

| Original region linked-chain case | After #1035 whole-row culling | After #1036 row + link culling | Further avoided | Local stage median before → after |
|---|---:|---:|---:|---:|
| 500×20 unlit | 297 | **216** | 27.3% | 4 → 2ms |
| 500×20 lit contacts | 297 | **216** | 27.3% | 5 → 5ms |
| Thin rotated lit | 1881 | **1140** | 39.4% | 26 → 14ms |
| Tall narrow column lit | 2632 | **252** | **90.4%** | 23 → 3ms |
| Tall narrow column unlit | 2632 | **252** | 90.4% | 4 → 1ms |
| Circle | 687 | **475** | 30.9% | 6 → 6ms |
| Compound hole + island | 2282 | **1502** | 34.2% | 19 → 14ms |
| Native compound 3024×6552 | 2282 | **1502** | 34.2% | 22 → 13ms |

These are original Canvas2D **region chain-stage** single-run medians of three alternating pairs (one native pair), not an app-level throughput claim. Improvements vary with object aspect ratio and illumination; fully occupied or unusually broad objects may not benefit. The optional original-vs-candidate script remains independently runnable; its disposable browser workflow was removed before final exact-head normal CI. The source-width and original-world station semantics remain canonical. Residual E4 is real source-overlapping tatami contact, not synthetic shadows between nonintersecting rows, plus genuine handset/human validation.

## Genuine region tatami round-endcap contacts without fabricated crossings (3 November 2026, PR #1037)

**The distinguishable source case:** Current regular region tatami stations are original authored parallel rows `y = k*pitch` rotated as one rigid layer. Their short stitch centreline pieces are staggered but have a consistent **1.4 authored-world-unit endpoint gap** (`x+.7` and `x+segment-.7`). They create no transverse intersections between parallel rows, so adding crossing shadows between separate rows would be false. However the existing round-capped yarn line width is `max(.7,min(2.5,pitch*.25))`. At pitch 5 that width is **1.25**, leaving a genuine gap and **zero** new shadow work. At pitch 8 it is **2.0**, making a true **0.6-unit overlapped endcap lens** between consecutive short stitches; at pitch 16 it is **2.5**, with **1.1 units** of overlapping physical yarn. This is a source-defined *same-row endcap contact*, not an invented tatami transverse crossing.

**Narrow integration:** `src/embroidery.js::drawRegionEmbroidery` retains original complete `k`, x stations, stagger, capsule geometry, brush linewidth and local lamp. Only **standard tatami with an active lamp and width exceeding the original gap** considers its immediately preceding already-painted stitch. Source-gaps or culling reset the predecessor rather than creating contact between nonadjacent stations. A small projection-biased shade is painted on the original lower yarn **before** the later upper yarn, clipped to the **intersection of both original round-yarn capsule paths** through the existing `traceThreadContactCapsule` utility. The source region's outer **even-odd** clip remains active for holes and islands. No saved bitmap, alpha readback, new geometry system, source rerandomisation, worker message, recipe field or extra shadow dialect. Unlit paths, usual pitch-5 tatami, running stitch, and fibre tatami are unchanged. Fibre microsupport needs its own proof, not a borrowed ordinary-tatami width.

**Actual original versus candidate Chromium, source-matched with immutable accepted `a3bdc4b5`:** [full nine 600×1300 and one native 3024×6552 baseline/target proof #41712457437](https://github.com/gamesbyian/wallgen/actions/runs/41712457437) checked all original full rendered RGBA pixels under identical original silhouette clips, plus native PNG hashes. The positive test deliberately **changes ink**, so byte equality between old and newly shaded artwork is neither expected nor desirable. The measured changed pixels for lit pitch-8 rectangle were **240 / 780,000** (max channel delta 24), pitch-16 **174**, rotated **247**, opposite lamp **247** and 3-ring compound hole/island **250**. The native 3024×6552 compound changed **5,839 / 19,813,248** pixels (approximately 0.03% of the image); its baseline 1,402,456-byte PNG SHA-256 was `42787cc3aebe843b98fc2377855283423a1cd08bb5e11a2d5fce7fa1bad024ee` and newly shaded 1,419,717-byte PNG SHA-256 `3361ea8ace80604214ec9d497408ab4f26748172dcec4f48052cfa08e773f59f`. **Every modified pixel in every scene remained inside the author-controlled original vector silhouette**. Full old/new raw pixel equality held for unlit pitch 8, lit pitch 5, running, and fibre tatami negative controls. All original stitch counts were unchanged.

A 3× original/candidate/difference crop was retrieved and inspected from [#41713009916](https://github.com/gamesbyian/wallgen/actions/runs/41713009916); the new marks are tiny local endcap details, with no broad dark swaths. Further source-matched [320×700 and 412×892 actual Canvas2D cases #41713577990](https://github.com/gamesbyian/wallgen/actions/runs/41713577990) found **55** and **107** modified pixels, respectively, with zero escaping the original region. The small extra local drawing cost at these viewports was roughly **2→8ms** and **1→5ms**; at 600×1300, pitch-8 lit 1→4ms and rotated/compound about 2→7–9ms. These are three-run **region-thread-stage** Chromium medians, not guaranteed total Random latency or a physical Pixel 6 Pro thermal measurement. At pitch 5 and no-light, even this local contact computation is bypassed.

**Validation accounting:** The first optical harness [#41712132663](https://github.com/gamesbyian/wallgen/actions/runs/41712132663) failed because the script compared two absent non-native PNG hashes as if they had been produced. The corrected acceptance run #41712457437 passed all cases. Temporary specialized CI is removed before final required CI/merge. The pure/source test proves that different tatami rows remain parallel and separately bounded and that only source-overlapping caps use two physical yarn clips. This closes the known **ordinary tatami** contact gap; do not extend it to fibre underlays, invented crossweaves or a fictional Pixel/human aesthetic signoff without new independent geometry and viewed-art evidence.

## Source-true projected fibre underlay endcap overlap (3 November 2026, PR #1038)

After ordinary high-pitch tatami contact #1037, **tatami-fibre** had its own distinct, still unmodelled physical case. The original `fibreSpan` renderer deposits four deterministic, distinct strokes per short tatami station: a dark **round-capped underlay** at normal offset `0.35` plus the same directional lamp projection, width `min(3.2,max(.8,pitch*.32))`, and three narrower yarn shadow/glint strokes whose geometry **does not** touch across adjacent stitch gaps. The unmodified authored station lattice leaves exactly **1.4 original world units between each adjacent segment's centreline endpoints**. At pitch **4**, the underlay width **1.28** is too narrow to touch, and no contact is possible; at pitch **8**, the underlay width **2.56** bridges the gap with a real **1.16-unit overlapping endcap lens**. This is a lower-layer contact between **immediately consecutive, same-row** yarn caps. It is neither a new crossing between parallel rows nor an invented bridge between skipped source stations.

A deliberately narrow addition to the existing `src/embroidery.js::paintTatamiCapContact` accepts an optional **fibre-underlay mode**, borrowing **the same original thread-light profile, original source x/y and line width** as `fibreSpan`. The two mutually clipped **round-capped underlay capsules** are shifted by `(profile.shadowX, 0.35+profile.shadowY)` in the row-local frame, and a small **0.055×shadow** contact stamp is clipped to their true physical intersection, inside the caller's original even-odd region source clip. The ordinary tatami defaults and contact ink remain unchanged. The entire original `k`, offset, x station, 4-strand phase, existing region-bound culling, saved recipe and crossing replay semantics remain owned by the original painter. No new bitmap, metadata, recipe field, material shade dialect, spatial acceleration, or separate renderer. A pure geometry test additionally checks each emitted contact capsule's actual 2.56-unit width/shift against an original projected underlay stroke, rather than accepting coincidental pair counts.

**Independent real Chromium source A/B:** [#41740113467](https://github.com/gamesbyian/wallgen/actions/runs/41740113467), immutable full source `c777a1d7da9982a32f94456f9c863290f57881bd` vs the proposed new renderer source. Both were served under distinct paths into actual Canvas2D modules with **identical author-controlled path clips, source art, lamp and resolution**; three interleaved original/candidate pairs per ordinary/phone case and a true native 3024×6552 compound source. Original source stitch counts remained unchanged in every case.

| Original-authored fibre source | Changed source-render pixels | Largest channel change | Outside original even-odd region | Local median stage old → new |
| --- | ---: | ---: | ---: | ---: |
| Ordinary tatami pitch 8 (control) | **0** | 0 | 0 | 5→4ms |
| Fibre pitch 4, underlays do not overlap | **0** | 0 | 0 | 7→8ms |
| Fibre pitch 8 without lamp | **0** | 0 | 0 | 2→2ms |
| Fibre pitch 8 at 600×1300 | 656 | 8/255 | **0** | 2→5ms |
| Fibre pitch 8 at 320×700 | 198 | 8/255 | **0** | 2→6ms |
| Fibre pitch 8 at 412×892 | 315 | 8/255 | **0** | 2→5ms |
| Rotated fibre pitch 8 | 725 | 8/255 | **0** | 4→10ms |
| Rotated fibre, reverse lamp | 716 | 8/255 | **0** | 4→10ms |
| Compound source with hole/island | 660 | 8/255 | **0** | 4→13ms |
| Native compound 3024×6552 | 17,525 / 19,813,248 | 8/255 | **0** | 5→13ms |

The actual native PNG changed *by design* from **1,577,133 bytes**, SHA-256 `b49c1f4522953e5f47b1d5f9c20d93f25350745d7c2a9834d81b4f14c74a66ce`, to **1,579,324 bytes**, SHA-256 `32b19ad37b9f6cd8b27908cefc03c497fc228025c31f1fbc59d13ce9362e769f`. Treat these as intentionally different image bytes, not a failed invariant: only actual overlapping fibre underlay cap positions are supposed to gain a subtle contact mark. Nonoverlapping and unlit controls remain exactly original. Any external human preference for this nuance, actual Pixel 6 Pro sustained battery/thermals, and genuine in-app Random completion remain **NOT TESTED** by this focused renderer-stage benchmark. Changes in local stage times are **not** app performance claims.

**Disposition:** This supports the particular fibre-underlay cap contact, not synthetic tatami cross-weaves or contacts between spatially adjacent but geometrically separate courses. The reusable [source/clip/PNG proof](../scripts/embroidery-fibre-underlay-contact-ab-browser.mjs) remains available opt-in; retire its temporary GHA browser workflow before integration. Keep the E4 issue open only for observed additional source topology and physical/artistic acceptance, not an indefinite demand to generate every conceivable shadow.
