# ROYGBIV: photographic film looks and filters
## Research-backed image-processing plan, app architecture, UI/UX, presets and implementation queue

**Created:** 2026-10-22. **Status:** proposed, not implemented. **Reviewed repository:** gamesbyian/wallgen main commit 7e970906222ebf1d085b12527f2a6aa9106d9209; reconcile latest main before implementation.
**Related:** [geometry-aware embroidery plan](GEOMETRY-AWARE-EMBROIDERY-AND-SURFACE-TREATMENTS-PLAN-2026-10-22.md), [worker rendering](WORKER-RENDERING.md), [material pipeline](MATERIAL-SURFACE-ENGINE-2026-10-21.md), [human-centred design guide](AGENT-HUMAN-EXPECTATIONS-AND-CREATIVE-COMPOSITION.md), [semantic UI audit](IA-SEMANTIC-CONTROL-AUDIT-AND-REVISION-PLAN-2026-10-22.md), [GPU research](GPU-ACCELERATION-RESEARCH.md).

## 1. What the user should be able to make

Give any generated ROYGBIV wallpaper the coherent photographic look of colour negative, slide, instant print, cinematic, monochrome, expired or experimental film. A **look** combines tone/color response, grain, glow/halation and optional optical artifacts, with one primary intensity control and richer editing only when needed.

User journeys:
1. "Make this rainbow feel like a rich 1970s slide photograph" -> select Film, choose a look, adjust Amount, Done.
2. "Give the black background faint 35 mm grain without changing my seven colours" -> Film Grain Only, colour/optical components disabled or at zero.
3. "Make the yellow ribbon glow into its dark surroundings like film halation" -> guided Halation, distinct from existing Glow and canvas Light.
4. "Give it the faded, slightly damaged appearance of an old print" -> lift black floor, tone curve, chroma response, vignette and subtle scratches.
5. "Make a monochrome darkroom print" -> deliberate opt-in B&W conversion, with optional simulated colour-filter weighting.
6. "Compare before and after, Undo, Save, Export and recover the identical look from PNG metadata" -> non-destructive, seeded, fully reproducible.
7. "Use embroidery on selected regions and film on the entire rendered picture" -> independent material-versus-final-image semantics.

**Scope for v1:** apply to the *complete composed wallpaper*, including black/white background, seven-colour objects, texture, shadow and scene lighting. Per-object film grading/masks are interesting future extensions but are NOT an initial prerequisite and would depend on embroidery plan's role-targeting engine. Film filters apply to generated artwork, not to importing/editing a user's camera photos. No sixth mobile destination, eighth editor tab, video timelines, camera RAW developer or remote service.

Do not claim scientifically exact emulation of named commercial film stocks without measured calibration. Creative presets are "film-inspired"; their authorship and transform specification are explicit. The underlying seven palette identities remain in recipes; finished colour may be altered intentionally. Include a hue-protection/colour-identity mode rather than silently enforcing original pigments for artistic looks.

## 2. Repo reality, interaction and integration points

| Existing source | Checked behaviour | Required plan |
| --- | --- | --- |
| src/renderer.js | drawWallpaper resolves geometry, paints stripe/region ink, applies world-space material masks, composes opaque background/ink with nudge/stripe shadow, finally calls applyCanvasAtmosphere | Add a *final composed-pixels* film stage after atmosphere. When film is off, it must be a strict no-op. Keep film separate from a material coverage/contour displacement pass |
| src/renderer.js::presentNudgedArtwork | Reconstitutes a fast moved picture from cached background and transparent ink, then applies ambient lighting | Must run the same film finishing logic; film cannot be baked only into a stale pre-nudge cache. Preserve immediate camera/nudge responsiveness with progressive or cached finishing |
| src/model.js::normalizeRecipe / resolveScene | Flat stable recipe; three explicit texture layers, seed and locks; output 3024 x 6552; palette roles distinct from scene objects | New optional versioned filmLook object with bounded parameters and seed; neutral default; no mutation of legacy texture slots |
| src/render-worker.js; src/render-coordinator.js | Worker and Canvas2D fallback use same core painter; transient vs settled preview; separate export worker; background + ink transfer for settled previews | Share final-film implementation between export and preview/fallback. Either transfer a filtered finalized preview in a new protocol or perform a bounded final post pass on the main thread; explicitly budget expensive finishing |
| src/app.js | Synchronous recipe/Undo/history/favorites and worker revision keys, scoped variation, prime-only and Save/PNG | Integrate look selection and Amount as one undoable recipe mutation; update art/cache keys; neutral look bypass; preserve locks and seed during reroll |
| src/png-metadata.js; src/share-recipe.js | PNG embeds a self-contained normalized recipe with 1MB bound; link share has size limits | Store numeric look parameters and version/preset id in recipe, never require an external cloud LUT; include semantic notices where needed |
| src/editor-schema.js; src/editor-material-inspector.js | Seven editor categories, **40 named tools**. Texture category has Layer 1/2/3/Surface with two in-card Material/Finish views | Do not reopen split layer cards. Film is whole-image treatment, **not** a fourth substrate texture |
| src/colour-vision-preview.js | Separate display-only overlay on the source canvas; deliberately not part of export, gallery or recipe | Colour-vision simulation remains inspection-only and sees the *already film-filtered* final image; stacking/compare controls must not fight |
| src/view-camera.js; docs/WORKER-RENDERING.md | Authored coordinate frame decoupled from zoom/nudge and output pixels | Grain/vignette/damage anchor to the intended final picture frame, not arbitrary worker crop or preview pixel grid |

Critical nuance: 19.8MP exports and worker-cached overhang make a naïve full-frame ImageData get/put + several RGBA scratch copies costly. Film is a new *post-composition stage* with explicit memory/time budgets, not a CSS filter applied to preview only. The legacy colour-vision preview must remain export-neutral. Background black should remain black for neutral/colour-only looks, and only lift when the chosen film style explicitly calls for faded shadows.

Current UX has deliberately separated canvas preview from the editing sheet; settings cards are bounded to the portrait viewport, 44px targets and horizontal tool swipes. Current style/texture controls are already dense. Film controls should not be a new long vertically scrolling inspector.

## 3. What real film emulation consists of (and what does not)

A credible still-film impression comes from interacting mechanisms, not one sepia matrix:

**Photochemical response:** toe and shoulder of exposure-to-density curves; black/white points, midtone contrast, highlight compression; warm/cool shadow/highlight balance, gamut compression and saturation response.

**Emulsion grain:** correlated, spatially distributed, luminance-dependent structure; independent but related luma/chroma grain; grain size tied to the *artwork's physical presentation*, not raw export pixel count. Grain is part of the image impression, rather than equivalent to ROYGBIV's existing paper/material grain.

**Halation:** warm/red-orange energy spill around sufficiently bright, high-contrast regions, with thresholds/masks, separable from ordinary neutral bloom. On generated flat rainbow art, many regions have saturated RGB but modest luminance: avoid blindly deriving halation from max-channel brightness, otherwise red-only stripes may glow disproportionately.

**Bloom/diffusion:** broader neutral/colourized bright-source spread, soft highlights and vintage lens diffusion. Difference from existing stripe Glow: existing Glow is an object-level silhouette effect inside the scene; film Bloom applies to final image pixels after all objects.

**Optics and film/scan aging:** vignette, reduced acutance, slight colour registration and low-frequency mottling; optional scratch, dust, edge leaks, frame/corner discoloration. These are historically contingent; do not force damage into every preset. Still wallpaper defaults must be stable; motion-specific gate weave/film breath is not meaningful without time, though a static registered offset can be offered later.

**Print stage:** optional print-film/photographic paper compression and colour-coupling after camera-film stage; different from simply duplicating a contrast curve.

Do **not** use CSS brightness/sepia chains as the reference pipeline. Use them only as a cheap transient fallback if explicitly documented. Do not apply high-order colour transforms to gamma-encoded sRGB values while claiming physically meaningful linear-light optics.

## 4. Research and practical code precedents

| Source | What it teaches or supplies | Reuse/licence |
| --- | --- | --- |
| [darktable filmic RGB](https://docs.darktable.org/usermanual/development/en/module-reference/processing-modules/filmic-rgb/) and [sigmoid](https://darktable-org.github.io/dtdocs/en/module-reference/processing-modules/sigmoid/) | Sensible tone compression, toe/shoulder, hue preservation, one view transform rather than stacking duplicate tone mappers | Reference the algorithms/docs; check project/file licence if porting implementation |
| [Blender AgX reference](https://developer.blender.org/docs/release_notes/4.0/color_management/) | Highlight desaturation and rendering of intense colour toward displayable whites | Colour-science reference; source licensing separate |
| [OpenColorIO looks](https://opencolorio.readthedocs.io/en/v2.4.2/guides/authoring/looks.html) | Look transforms have an explicit *process colour space*, distinct from input/output colour-management transforms | Follow design principle; do not need an OCIO runtime in v1 |
| [RawTherapee HaldCLUT film simulation](https://rawpedia.pixls.us/film_simulation/) | 3D/global-colour lookup from identity Hald image; limitations: does not encode spatial halation/grain/damage; output gamma/profile consistency crucial | Optional offline LUT importer after MVP; check origin/license of each particular LUT |
| [G'MIC film colour presets](https://www.gmic.eu/color_presets/) | Huge visual catalogue and downloadable HaldCLUTs for reference | Reference/compare; audit each asset's permission separately before bundling |
| [Dehancer film tools](https://www.dehancer.com/features), [manual](https://www.dehancer.com/learn/article/desktop-manual), [halation](https://www.dehancer.com/learn/article/halation) | Separates film profile, print, emulsion grain, halation, bloom and film damage; format-dependent intensity and mask-inspection views | UX/physics precedent; no assumption commercial proprietary algorithms can be copied |
| [Snapseed Grainy Film](https://support.google.com/snapseed/answer/6158233?hl=en) and [Vintage](https://support.google.com/snapseed/answer/3113631?hl=en) | Fast look selection; *separate* grain and style strengths; compact on-photo controls | UX comparison; no copy of assets |
| [Lightroom Mobile creative profiles](https://helpx.adobe.com/lightroom/mobile/adjust-light-and-color/apply-profiles.html) | Film-inspired profiles, intensity adjustment, hold-to-see-original, favoured preset discovery, preservation of other edit settings | UX precedent |
| [glfx.js](https://github.com/evanw/glfx.js) | Browser WebGL image filters, noise, vignette, curves, colour effects, blur; actual MIT licence verified | Permissive source for targeted filter kernels/implementation patterns; avoid importing an old entire framework automatically |
| [glsl-film-grain](https://github.com/mattdesl/glsl-film-grain) | Seedable natural grain from 3D noise functions and brightness-dependent blending; actual MIT licence verified | Candidate small shader adaptation, but expensive at 19.8MP; compare efficient seeded methods |
| [libplacebo](https://libplacebo.org/) | Practical grain synthesis and colour pipeline/shader architecture | Engineering reference; heavyweight runtime unnecessary for this offline art PWA |
| [RawTherapee Film Looks](https://github.com/cschmertz/rawtherapee-film-looks) | Explicit recipe-based film grade + optional halation, separate contact previews, neutral grain-free colour looks | Research/control-model example; inspect assets and licence before bundling |

References checked 2026-10-22. Do not mistake a named preset (e.g. a commercial film stock) for calibrated response-data provenance. A film-inspired generic default is preferable to an unsupported exact recreation claim.

## 5. Proposed processing pipeline

The film engine receives *fully composed* wallpaper pixels in a declared colour space (MVP: sRGB) with a deterministic recipe and intended authored frame. One pipeline:

1. Render source wallpaper normally: geometry, materials/embroidery, outlines, lighting and shadows; preserve existing object/colour roles and dark negative space.
2. Convert encoded sRGB to linear-light RGB for physically motivated exposure, bloom and halation light mixing; keep arithmetic unclipped until output where possible. Record approximations if the browser's 8-bit source already clips HDR values.
3. Apply exposure/white balance / colour balance and one selected tone-response curve. Treat film negative + print as one calibrated **look transform** or composed transform, not multiple contradictory output tone mappers. Control hue-preserve blending and bounded gamut mapping explicitly.
4. Apply optional colour response via compact 3D LUT with trilinear interpolation (tetrahedral later if needed), or a constrained set of colour matrices and per-channel curves. Identity at Amount=0 must return input exactly. Store or generate LUT from numeric preset definition, not a secret cloud URL.
5. Generate a brightness/edge-weighted halation mask from source high-luma regions; apply local warm blur of eligible highlights. Bloom is a distinct, wider spread; they can coexist. Composite in linear light where feasible, protecting shadow/background against a grey fog unless intentionally requested.
6. Add fine-to-coarse seeded film grain and optional low-frequency emulsion mottling. Modulate strength by tone; allow luma/chroma controls and sensible highlight suppression. Use a *stable authored-image coordinate domain*, with deterministic multiscale sampling so preview and export represent the same texture, down to acceptable filtered statistical differences.
7. Optional vintage artifacts (vignette, light leaks, dust/scratches), each independently bypassable and cached; vignette referenced to saved wallpaper frame/camera crop so it does not slide when the user nudges the underlying artwork.
8. Output gamut clamp/encode to sRGB. Record renderer colour-space assumptions and browser limitations. Export full frame; do not bake colour-vision inspection into it.

**Ordering validation:** halation before/after tone and print look can change visibility; compare two candidate orders on actual seven-colour art, settle a single documented default and version the pipeline so saved recipes don't change retroactively. Add optional pre-look flag only if a real artistic goal demands it.

**Correct Amount semantics:** Amount 0 returns unfiltered artwork regardless of selected profile; 100 gives exactly its configured look. Blend between complete before/after results in a specified working space, not loosely scale each nonlinear parameter without testing. Individual sub-effect strengths can be adjusted separately (including grain-only) while the selected overall Amount applies to the whole effect. Define and visually document whether amount acts on all stages or colour only; recommended: whole effect with independent fine controls.

**Look versioning:** pin processor version (v1), canonical profileId, profileRevision or self-contained fully expanded effective parameters; restoring a saved film look years later must not depend on mutable named preset defaults. Numeric recipes should include the actual expanded curve/grade/grain/optics values, with the preset ID as descriptive provenance, never sole render authority.

## 6. Performance, memory and preview/export semantics

A 3024 x 6552 RGBA8 surface is ~79.2 MB decimal before scratch buffers. Multiple full-sized readbacks plus blurs could overwhelm mobile memory. Prioritize a separable/low-res blur pyramid for halation/bloom, tiled pixel transforms with a bounded halo overlap, reused scratch surfaces and minimal getImageData/putImageData traffic. Use a postprocess module (suggested src/film-look.js with pure math/profile normalization and src/film-render.js with Canvas2D finishing); a shader path can be added behind capability/performance gating without making the whole app a GPU rewrite.

Existing drawWallpaper and presentNudgedArtwork currently share only cached background/ink, not a finished film buffer. **Do not bake film into an ink cache used by pan/nudge.** Refactor to one final-composite path used by full render and cached nudge, followed by film finishing. Lightweight colour/LUT changes can update immediately from a post-composite cached base, while costly multi-radius optics may render in preview worker after the gesture settles. Show the last valid filtered frame rather than flashing an unfiltered frame as though it were final; transient lower-resolution results must be labelled/treated as transient and superseded by settled output. Revision/token cancellation as used by src/render-coordinator.js must reject stale film frames.

Worker protocol choices:
- A) Extend settled preview with a final filtered frame when film is enabled, preserving background/ink source caches for nudge and edits, or
- B) Keep existing transfer format and add a dedicated postprocessing finishing worker / local final stage, with an explicit host handoff.

Prototype A and B on actual Pixel 6 Pro Chrome and select by latency/memory; avoid busy-loop workers. Both native worker export and Canvas2D fallback call the identical finishing algorithms. Headless render script uses the same path, with no browser-only CSS or external runtime assets. Film off takes the old fast path, with no extra canvas allocations.

**Grain scale:** physically perceptual size defined relative to 600x1300 authored wallpaper frame or normalized picture width, rather than output device pixels. If a grain sample is finer than the preview's Nyquist limit, filter/aggregate it rather than allow aliasing. A static saved wallpaper must not reroll on pinch, nudge, rerender, gallery refresh or export. Separate the look's seed from the generator's seed only if users can reroll them independently with lock semantics.

**Interaction with embroidery:** substrate texture applies to objects/material; film is post-composition. Embroidered thread should be lit with scene lighting before overall film response; grain overlays *the photograph of the embroidery* rather than pretending to change thread construction. When a future per-object film mask is built, use the new role-target system, not the legacy texture coverage enum.

## 7. UI/UX: integrate without expanding the top-level navigation

### Recommendation and alternative evaluated

Considered:
- Texture > Film: high discovery from "grain" but falsely implies an object material; Texture already busy with 3 layers and Surface.
- Colour > Film: clear for colour grading but conceals halation/optics/grain and increases colour-tab complexity.
- **Light > Film**: best near-term home for full-picture optical finish; current Light contains only Lighting, and its conceptual promise is image atmosphere. Add one Film tool with in-card compact views. Keep seven categories, five mobile destinations and existing app's navigation. Do not rename Light to Finish absent actual user confusion.
- Global filter shortcut: convenient but adds a second competing editor; only a search/quick-action deep-link to the canonical Film tool should be allowed.

**Goal-first search:** add aliases "film, photo filter, vintage, analog, cinematic, 35mm, grain, emulsion, halation, bloom, faded, instant print, monochrome, scratches, vignette" in src/editor-tool-search.js, each resolving to Light > Film and selecting the corresponding in-card view. Differentiate **emulsion grain** from Texture's paper/linen grain and **film bloom** from Details > Glow. No invisible control no-ops.

### Compact Film tool design

Top persistent strip: Film on/off, the chosen look name, Amount slider with 0/100 labels, a lock, a small reroll action with correct scope, and a visible "Before" control. Compact single-line status, e.g. "Slide • 65% • subtle grain" (not an oversized preset gallery).

In-card horizontally accessible views:
- **Look:** small swipeable live-preview chips (Off, Colour negative, Slide, Instant print, Cine print, Aged print, B&W, Experimental), with a current-art thumbnail. Select family before fine controls; avoid stock brand names implying exact calibration.
- **Grain:** 0..100 Amount, grain Size/Format (Fine/Medium/Coarse or 8/16/35/65mm-inspired, carefully labelled), tonal response; active only if Film enabled and grain is present. Optional Colour grain as advanced.
- **Optics:** Halation/Bloom/Vignette grouped into a compact view with independently zeroable controls; optional Damage subview shown when the chosen vintage profile supports it. Keep each view within portrait edit tray, no vertical settings scroll. Hide entirely inapplicable controls or show effective zero with a short reason, retaining actual saved values.
- **Advanced grade** later: tone curve, black lift, highlight compression, colour balance, hue preservation and optional LUT import. Avoid eight sliders as the entry experience.

**Flow:** Tap Light > Film -> select look -> compare by holding Before -> adjust Amount -> optionally open Grain/Optics -> Save or Favourite without collapsing editor. Selecting a look is one Undo event and does not touch any existing scene geometry, lighting or substrate texture. A film preset is an overlay configuration, not a replacement for the app's overall generation Family. Users can toggle it off without losing custom values.

**User exploration:** preset thumbnails must be derived from the user's actual wallpaper and can update lazily or on-demand; never substitute misleading fixed stock thumbnails as previews. If expensive, show one selected live preview and lightweight named chips, rather than re-rendering 8 full-resolution thumbnail canvases on every input event. Scoped randomization of profile versus grain/optics needs locks; randomizeAll may select film Off by default until explicitly opted in, so the user's normal rainbow generation isn't involuntarily aged.

**Accessibility, screen-reader names, reduced motion:** accessible "Film profile: Slide"; Amount meaningful output; before button reachable by click, touch and keyboard (hold is not the sole option). Preserve focus while views change, 44px targets, distinct checkbox/toggle states, reduced-motion obeyed, no tool cards spawning toast notifications for innocuous toggles. Explicit help differentiates final exported film look from display-only colour-vision preview.

**Cross-feature preview and controls:** current colour-vision inspection overlay must transform the *post-film presented frame*, including its before/after comparison. Do not insert film overlay above vision overlay and accidentally conceal simulation. Drawing/region edit overlays stay accurate to source geometry while film is active, and do not cause false hit regions. Existing light mood and film can be active together, but explain their order with a short helper; avoid duplicating "Glow" logic.

### Art direction and preset examples

- **Colour negative:** supple midtones, restrained chroma, soft highlight rolloff, fine grain and rare halation.
- **Slide colour:** punchier colour, denser shadows, crisp edge structure, subtle grain; highlights controlled rather than scorched.
- **Instant print:** softer definition, lifted slightly warm shadow floor, cyan/yellow print drift, gentle corners; no fake paper frame by default.
- **Cine print:** controlled teal/amber secondary separation, filmic shoulder, warm halation on actual bright boundaries and neutral bloom.
- **Aged print:** partial fading, shallow contrast, chromatic drift, light vignette and small optional damage; avoid mandatory dirty textures.
- **B&W darkroom:** luminance transform with selectable red/yellow/green filter response, silver-like grain and print-toning option.
- **Grain only / optical only:** one-effect options for artwork whose hues must remain unchanged.

Presets should be parameter-based and intentionally transparent. For ROYGBIV, black backgrounds make lifted blacks and halation particularly apparent; offer "Keep true black" and "Preserve rainbow hues" as explicit accessible toggles (default on for most colour presets, disabled/irrelevant for B&W where applicable). Preset art-direction rules are proposals, not calibrated profiles.

## 8. Phased implementation with exact files and acceptance

**F0 - Film look reference and image-quality spike (read-only or branch experiment).** Small deterministic reference render set using unchanged headless generator: straight rainbow, tight loops/crossing, seven circles, block regions, pure black/white, one richly textured composition. Compare neutral output, two tone-curves and a grain/bloom candidate using a contact sheet. Record actual visual defects and phone capability before committing to WebGL. No new permanent CI workflow.

**F1 - Recipe/controls foundation.** Add normalized optional filmLook object to src/model.js with versioned profiles, enabled, amount, expanded grade params, per-effect parameters, seed, locks. Integrate Undo/random/scoped reroll/share/favourites/PNG metadata in src/app.js and schemas. Off/Amount 0 preserves baseline pixels and fast cache. Unit tests focus on legacy neutrality and portable roundtrip.

**F2 - Deterministic CPU reference engine.** New src/film-look.js and src/film-render.js (names provisional) implementing tone/chroma, optional 3D LUT, grain, vignette and a simple thresholded bloom/halation with linear-light treatment. Use stable normalized coordinates, separated blur masks, bounded buffers, explicit colour-space conversions. Tests with hand-calculated identity curves, channel-saturation extremes, B&W neutral points, edge clipping and stable grain seed.

**F3 - Worker/export and crop correctness.** Refactor final image assembly so drawWallpaper, presentNudgedArtwork, worker previews, direct fallback and script render-headless all invoke the *same* finishing code. Verify zoom/nudge do not slide/reroll grain or vignette, export framing matches filtered preview, and film-only edit doesn't force full geometry resampling. Use small browser and one native-size export, no giant matrix.

**F4 - Mobile Film inspector and named presets.** Light > Film tool, Look/Grain/Optics compact views, Amount, Before, links/search aliases, locks and scoped reroll. Four-question cognitive walkthrough for the seven journeys, short Android Chrome portrait review, accessible keyboard/touch and no edit-panel collapse on save. Source-driven UI settings ownership and dormant prerequisites update semantic maps, not new seven-tab design.

**F5 - Rich optical look and refinement.** Better multi-scale grain, coloured halation, optional print response, emulsion mottling, colour-channel drift, cosmetic dust/hair/scratches, LUT import via local files if desirable. Add a WebGL/WebGPU acceleration backend only if F3/F4 profiling demonstrates net benefit and a graceful Canvas2D fallback remains.

**Minimum acceptance ledger:**
- Off/Amount 0 matches unmodified artwork, and baseline recipes do not gain unintended default film.
- Whole-art finishing operates identically across paths, radial, regions, scattered and imported silhouettes.
- Hue-preservation and true-black guards behave predictably; B&W intentional exceptions are obvious.
- Grain/damage seeded and frame-anchored; zoom/pan/nudge/export do not reroll.
- Halation responds to bright high-contrast sources, not every silhouette edge by default; vignette respects actual final frame.
- 3024x6552 PNG contains a restorable full film recipe; worker/fallback/headless preview outcomes materially agree.
- Editor remains compact on phone; no hidden dead controls, focus loss, false enabled states, or save-induced card collapse.
- Optional film is visually good in a handful of distinct source-art cases. Personal-app testing remains proportionate; no mandatory exhaustive screenshot/CI expansion.

## 9. Risks, decisions and future extensions

**Colour management:** ROYGBIV currently renders to Canvas2D; the source may already be bounded 8-bit sRGB. Use explicit sRGB conversions, don't promise reconstruction of clipped HDR or true RAW-film response. Browser display-P3/float16 support is uneven; treat future wide-gamut renderers as a versioned enhancement, not an entry requirement. Profile/LUT imports must be validated for dimensions, finite values, colour space, gamma/encoding, file size, same-origin/offline availability and licence.

**Seams and grain:** texture clipped at tile boundaries causes visible rectangular artifacts; hash by global positions, blur overlap and stable seeds. Different filter orders must not silently alter saved looks after algorithm updates.

**Multiple simultaneous effects:** ambient lighting, palette grade and film look need one explicit ordering. If the user disables film, existing Light mood and Texture layer rendering still behave exactly as before.

**User expectation:** selecting "35mm" is a broad artistic grain/format analogy, not a guarantee of emulating a real named camera stock. The app cannot reproduce chemical film's genuine image statistics perfectly from a finished flat graphic.

**Shared long-term design with embroidery:** both plans should leverage a general render graph and deterministic seed/recipe system, but film must remain an **image-wide finish** until a compelling per-object editing goal justifies scope expansion. Do not couple Film v1 delivery to completion of Embroidery E1–E5. Embroidery can come before or after Film and their effects should compose predictably.

**Implementation decisions recommended now:** Film as a single Light-category tool with compact internal views; seeded sRGB reference postprocessor; expanded numeric presets stored in saved recipe; colour/optics/grain independent controls under one overall Amount; original-vs-film compare; unchanged seven mobile categories; worker/export parity and fast neutral mode; direct reuse of permissively licensed glfx.js/GLSL kernels where worthwhile, with proper third-party notices. No code or UI change in this documentation PR.

## 10. October 22 expansion: digital camera looks and shared Photo system

**New companion authority:** [Digital camera and computational photo looks plan](DIGITAL-CAMERA-AND-COMPUTATIONAL-PHOTO-LOOKS-PLAN-2026-10-22.md). The initial film-only Light > Film proposal is **superseded as a navigation recommendation** by a single **Light > Photo** tool with Camera and Film look families. Do not implement two separate UI tools or independent postprocessing pipelines.

**Engineering adjustment:** the provisional `filmLook` recipe proposal is replaced *before implementation* by one versioned `photoLook` object holding `family: 'film' | 'digital'`, expanded parameters, seeded signals, and algorithm revision. There is no shipped `filmLook` key to migrate on current main. Existing F0–F5 phases remain relevant, but unified D0–D5 stages from the companion plan are incorporated: D0 joins F0; D1 is a gate for F1; D2 joins F2; D3 adds virtual capture/compression to F3; D4 joins F4; D5 joins F5.

**Camera profiles:** Smartphone HDR/iPhone-like, Pixel-style, DSLR Natural, DSLR Studio, Mirrorless Night, Webcam 480p, Video Call, Early Digicam, and Low-light CCTV-inspired, based on local tone mapping, white balance, sharpening, denoise, channel/chroma response, virtual capture resolution and compression artifacts. The interface emphasizes *visual goals*, not fictional "exact iPhone firmware" claims.

**UX reconciliation:** Change the proposed Film Look/Grain/Optics inspector into compact Photo **Looks / Tone / Detail / Character** views with a Camera / Film family selector. Keep one On/Off, Amount, Before, locks and scoped reroll; preserve seven categories, 40 existing tools plus one proposed Photo tool, and five mobile destinations. Treat photographic film grain and digital sensor/webcam noise separately from Texture substrate grain. These are all planned controls, not implemented features.

**Research anchors:** [Google HDR+ research](https://research.google/pubs/burst-photography-for-high-dynamic-range-and-low-light-imaging-on-mobile-cameras/), [Apple iPhone Photonic Engine/Smart HDR specs](https://www.apple.com/iphone-17/specs/), [libcamera ISP stages](https://docs.libcamera.org/master/public-api/camera-model.html), [Adobe Camera Raw sharpening and noise reduction](https://helpx.adobe.com/camera-raw/desktop/using/sharpening-noise-reduction-camera-raw.html). See companion plan for licences, references, device-style parameters and implementation steps.

**Execution/queue:** [Active roadmap](ACTIVE-PRODUCT-ROADMAP-2026-10-22.md) is the work board. Do not mark this done because the specification exists. No app changes in this PR.
