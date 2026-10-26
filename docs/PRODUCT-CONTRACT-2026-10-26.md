# ROYGBIV product contract: owner decisions, scope and acceptance

**Authority:** Owner direction recovered through 26 October 2026 (Calgary); live code and current issues take precedence over dated completion assertions. This is a **stable product contract**, not a changelog, proof that every item is implemented or a second engineering work queue. For live priorities use [the single current work queue](CURRENT-WORK-QUEUE-2026-10-24.md); for source-backed completion use [integration ledger](INTEGRATION-LEDGER-2026-10-24.md) and [release evidence](RELEASE-READINESS-AGENT3-2026-10-23.md). Feature-specific plans own details. Requirements are grouped by user-visible outcomes rather than by old agent assignments.

## 1. Identity, audience and intended experience

- **Name:** R.O.Y.G.B.I.V., “Rainbow-only You Generation Based on Individual Variables.” Personal, free, browser-based creative tool for making deliberately composed rainbow wallpapers; not an exercise in shipping release-grade process.
- **Primary target:** Google Pixel 6 Pro **portrait Chrome/PWA**, with one usable editing viewport and no forced vertical scrolling through editor settings. Other desktop/browser layouts are valuable; a native Android APK is **not** part of the current ROYGBIV commitment. Landscape is not a primary app mode.
- **Default workflow:** fast random exploration → inspect → lock selected choices → vary locally or globally → adjust geometry/surface/text → Undo/compare/save → export wallpaper and transferable recipe. The owner's approximate **80% randomize-first / 20% intentional-composition-first** split is a *design preference*, not measured usage analytics. Precise editing must be equally real, not buried behind random generation.
- **Product grammar:** seven recognizably ordered **red/orange/yellow/green/blue/indigo/violet** hues remain available, but current canonical scenes may include reusable shapes, backgrounds, light, photo treatments and text. Preserve the established **seven editing categories** as a discoverability baseline unless actual task evidence argues for change. Historical inventories of 40 tools / 95 scalar controls are snapshots, not immutable quotas.
- **Visual identity:** playful, artful, tactile studio, not a generic form or a childlike rainbow toy. Respect the canonical diagonal-stripe-under-phone icon and the PWA masking/white-circle issue; changes require visual inspection on actual light/dark launch surfaces.

## 2. Composition, geometry and editability

- Seven stripes initially support **vertical, horizontal, diagonal**, independently controllable spacing/position and thickness, orientation/reversal/mirroring, with straight, wave, jagged/zigzag, geometric and custom-drawn trajectories. Preserve useful white/black borders and buffers; dots/stars/chevrons/dashes, hairpins and loops remain true editable geometry rather than flattened stickers.
- Freehand paths require smoothing strength (including strong smoothing), point/anchor editing and geometric interpretation (straight, orthogonal, circle/arc); paths may enter/exit off-frame, with projected continuation, adjustable hairpin angles and **over/under/weave** at intersections.
- The **unified canonical scene** supports open paths, radial/burst/ray forms, closed regions/partitions, imported and reusable silhouettes, scattered shapes and object-relative decorations/interior elements. Transform/move the actual selected shapes on the artwork; preserve ordering/targeting, one-step Undo and JSON/PNG reproduction.
- Exploration constraints: avoid completely invisible stripe results; allow balanced image edges, thicker bands, generous spacing and wider useful hairpin/chevron ranges. Offer **coherent/safe versus unrestricted variation** when applicable, without letting guardrails make advanced forms unreachable. Primes-only randomization is an owner-requested option; verify current code before claiming availability.
- Randomize per setting/group/all and locks must respect each other. Locked inactive controls retain their saved semantic values, while inactive effective output is clear. Source-of-truth lives in `src/model.js`, `src/composition-geometry.js`, the geometry/import modules and canonical scene semantics; never create a parallel recipe or renderer.

## 3. Mobile studio, controls and camera

- **Canvas first**, comprehensible navigation, short control panel, seven-category model, swipable cards where useful, accessible tool search, focus mode and no editor-settings vertical-scroll treadmill. Important interactions need **at least 44 CSS-pixel hit targets**, keyboard names, focus handling, reduced-motion support and clear enabled/disabled explanations. Touch gestures on a control rail must not accidentally swipe the parent sheet.
- Controls should visually indicate their consequences. Blue slider tracks are acceptable; the owner subsequently requested **seven non-repeating ROYGBIV slider accent colours per panel**, stable through rerenders and independent of artwork hue assignments. Keep clear lock icons including rotated open-clasp states and visible Random action/lock affordances. Avoid trading accessibility contrast for decoration.
- Camera and artwork are separate systems. **Zoom changes by 10%**, pan/zoom controls live near the canvas, camera framing may show a **rounded 90% bleed/safe overlay**. Changing the view must **not regenerate the artwork**. Export the actual saved framed view/geometry, not a different preview crop, with consistent aspect registration and no stripe unexpectedly disappearing. Camera-only state must not silently corrupt the canonical recipe. See [camera contract](CAMERA-ZOOM-INVARIANCE.md).
- Test both **320×700** short and **412×892** portrait software viewports for keyboard/IME, swipe, Undo, glyph grips and actual visible PNG download. Browser-emulated success is **not physical Pixel, native Android IME or TalkBack** acceptance.

## 4. Colour, surface, light and photographic finishing

- Current canonical palette quality outranks preserving every obsolete renderer pixel. Support original ROYGBIV order and user-adjustable present-day tone/colour controls; require source-supported pigment choices for inverse reconstruction. Opt-in palette tone is now implemented; do not rebuild from a stale proposal.
- Up to **three independently adjustable texture layers**, including targeting and layer order, texture/material selection, arbitrary orientation (including 90°), blend/opacity and meaningful displacement mapped to active surfaces. Include paper/construction/textile and richer concrete, stucco, stone, drywall, wood grain, vinyl, foil, glossy paper, adobe and corduroy families where supported. Procedural quality needs viewed **real wallpapers**, not just a green formula test.
- Global canvas lighting and optional stripe/object shadow; distinct film/camera treatments share one `photoLook`/finishing system: grain, slide/negative/halation, natural digital and simulated camera looks. Before/After is a reversible **preview**, not a destructive recipe operation. Geometry-targeted embroidery/thread treatments remain opt-in, with existing Satin/Soft Satin/Tatami/Running/Chain behavior.
- Treat historical parity only when it directly protects meaningful current behavior; keep source PNG bytes inviolate and do not assert real textile/film/optics calibration where only stylized production images exist.

## 5. Text and fonts

- Text is an editable **canonical scene object**, supporting reposition/rotate/scale on canvas, straight and curved Draw/Wave/Hairpin/Loop/Arc/Circle paths, rainbow cycling and stops, tracking/leading, dual outlines, shadow, Unicode and per-object typography. Text selection should follow **actual rendered glyph ink**, especially curved text and small portrait grips.
- Built-in set of **27 licensed/pinned OFL fonts** and user-imported local TTF/OTF are distinct paths. Keep imported faces private, identified in portable recipes by non-sensitive digest/metadata, with explicit opt-in packaging where redistribution rights permit. Missing fonts must be explained without inventing fallback fidelity.
- Preserve grapheme clusters, joiners, combining marks, RTL/Indic joining, emoji clusters and intentional line breaks through input, saved recipe, preview, worker, headless and 19.8MP export; admit browser/platform font limitations. The *actual* unresolved specialist engineering and verification belongs to [#653](https://github.com/gamesbyian/wallgen/issues/653) and [typography plan](TEXT-OVERLAYS-AND-TYPOGRAPHY-PLAN-2026-10-24.md).

## 6. Image import, reconstruction and source truth

- Distinguish **(A) import original geometry/path/silhouette** from **(B) infer a present-day editable recipe from a rendered image**. Input may be current embedded-recipe PNG or **metadata-free external PNG/JPEG/WebP/SVG** where the existing safe importer supports it. Preserve the original file and explicitly name the provenance and uncertainties of derived shapes.
- Reconstruction reuses the same forward model, ranking/painting actual current recipes against *source image pixels*. It cannot recover a unique historical seed, invisible overlap order, hidden pigments or semantic hue slots absent in the source. **Refuse a false colour-faithful auto-candidate** if canonical representation cannot express source colour/topology. Explain the refusal accessibly and offer **manual geometric import/edit** rather than silently colouring missing hues.
- Respect existing **maximum six initial plus ten refinement real painter attempts**, cancellation, locks, source-state isolation, source PNG hash stability, Undo and direct/worker/headless/export parity. Prior R0, 22-image current source baseline and independent external pigment/achromatic/dark controls are regression *evidence*, not mandatory automated daily CI.
- Real remaining source-backed issues (opaque mixed occlusion, Hairpin/Loop voids/contours, difficult pigments/representability) live solely in [#557](https://github.com/gamesbyian/wallgen/issues/557) and [reconstruction plan](IMAGE-TO-RECIPE-RECONSTRUCTION-PLAN-2026-10-22.md). Don't promise photographic/general-purpose tracing accuracy.

## 7. Export, saved work, portability and metadata

- Pixel 6 Pro design target: **210% of 1440×3120 = 3024×6552 pixels (19813248 pixels)** for full-resolution output. Prefer explicit dimensions in code/tests over rounded MP labels. Preview, export, worker and headless must share scene/render semantics; visible UI **Download PNG** must actually produce a valid file with expected framed pixels.
- Save/recover current recipes as JSON and embedded PNG metadata; favourites, local shapes/library, portable geometry packages and optional private-font packages must be explicit. Round-trip current editable state without mutating original imported art; keep titles/notes and provenance where supported.
- The user specifically requested **upload a PNG → inspect/upgrade recognized embedded metadata → download without modifying image pixels**. The non-destructive utility already handles the **fully recognizable current v2 envelope** with unchanged IDAT and other non-recipe chunks, and rejects unsupported/conflicted/ambiguous historical dialects. Do not silently promise v1→v2 conversion: real source-era v1 comparisons gave **29.54% and 31.47% pixel disagreement**. Historical compatibility is optional, deliberately below current-engine improvement in priority. See [format registry](recipe-format-history/REGISTRY.md) and [migration limitations](PNG-RECIPE-MIGRATION-AND-FORMAT-REGISTRY-PLAN-2026-10-22.md).
- Source image file, fitted recipe, original embedded metadata and archival verbatim source are **different artifacts**. A metadata-only rewrite never validates that the old raster can be regenerated by the modern renderer.

## 8. Privacy, use learning and accessibility

- Creative activity journal and contextual surveys are **disabled by default**. Require clear opt-in; allow local inspection, export, revocation and deletion; no covert event collection, remote transmission or token storage. Optional backup to the existing private `gamesbyian/general-purpose` `data/roygbiv-usage` branch requires **separate explicit opt-in**, not mere local recorder consent. Tests using mock transport do not establish authenticated GET/PUT/retry in a real account.
- Accessibility extends to meaningful control names, focus, 44px hit testing, assistive announcements and the colour-vision simulator. Do not equate a simulated browser or structural navigation test with actual TalkBack, magnification, reduced motion, physical touch or human comprehension.
- The app may collect optional first-hand observations to test *predeclared agent predictions* about creative journeys. Predictions/simulated personas are not human observations. Preserve agency and avoid mandatory owner studies. Refer to [creative behavior](CREATIVE-BEHAVIOUR-RECORDER-PLAN-2026-10-22.md), [human field guide](AGENT-HUMAN-EXPECTATIONS-AND-CREATIVE-COMPOSITION.md) and [release ledger](RELEASE-READINESS-AGENT3-2026-10-23.md).

## 9. Verification contract and owner-dependent gates

Evidence tiers are **source inspection → targeted unit check → current-main browser runtime → directly inspected PNG and pixels → physical Pixel/Android test → actual human creator acceptance**. Each claim states its tier; one tier never silently grants another.

Minimum proportional regression selection:
1. **Ordinary focused PR:** `npm run check:quick` plus the smallest relevant owner-module tests. Do not introduce recurring screenshot/optical matrices or long CI suites for a personal wallpaper tool.
2. **Scene/renderer/export change:** actual render and image inspection of a representative changed recipe, direct vs worker/headless when affected, Undo/locks/metadata round-trip, with fixed seed and exact comparison artifacts.
3. **Reconstruction change:** preserved source bytes, source-blind current and genuinely independent source controls, refusal semantics and paint budget, inspected fitted PNG, candidate edit/Undo/export; opt-in expensive browser proof only when it tests a real newly demonstrated failure.
4. **Editor/font/accessibility change:** keyboard and pointer through genuine browser route at 320×700 and 412×892 as appropriate; focus/IME draft state, 44px controls, one-action Undo, visible PNG export and privacy defaults when touched.
5. **Real-world acceptance, still unverified:** physical Pixel 6 Pro Chrome/PWA, native Android IME and TalkBack, sustained 3024×6552 handset heap/thermal/battery, owner's creative/aesthetic judgment, consented external source-art provenance, and authenticated opted-in GitHub backup under real credentials. These are separately recorded owner/device checks, **not defects invented to keep completed engineering tickets open**.

## 10. Decision priority when requirements conflict

1. Best **current** composition/colour/geometry/typography and truthful output.
2. Original imported source preservation, consent/security, coherent Undo/canonical semantics.
3. Actual phone-first use and evidence-led discoverability/accessibility.
4. Targeted performance and lean maintainable architecture with one semantic owner per behavior.
5. Optional historical migration and retrospective pixel parity, only with a concrete benefit.

Avoid gratuitous redesign, new runtime ML dependency, second cloud backend, duplicate PWA/native app, more hard-coded agent lanes or “future TODO” derived from outdated status prose.

## 11. Provenance and limitations of this consolidation

This decision map draws on accessible owner conversations and project summaries, the repository's **partial** source archive at `prod_diary/CONVERSATION-SOURCES.json`, the long dated roadmap/handoff, current implementation modules and merged PR/issue evidence. **The archive explicitly reports zero verified complete two-sided ChatGPT transcripts**; do not claim a complete project-conversation export. Preserve these historical records verbatim and mark inferred/reconstructed decisions honestly. This specification is a usable *consolidation*, not a statement that all private chats have been recovered.

**Ownership:** live work queue for dispatch; #557 for inverse reconstruction; #653 for advanced text; closed #664 for completed independent software acceptance; owner/device acceptance stays in the release ledger rather than creating a permanent agent lane. Update this contract only for an actual owner decision or changed canonical product invariant, not for every merged PR.
