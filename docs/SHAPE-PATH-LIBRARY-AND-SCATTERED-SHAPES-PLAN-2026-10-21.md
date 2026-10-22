# ROYGBIV: Shape & Path Library and Scattered Shapes
## Architecture, product specification, UX and implementation plan

**Date:** 2026-10-21 (America/Edmonton)  
**Status:** Proposed implementation plan, not implemented or verified on a physical device.  
**Base reviewed:** gamesbyian/wallgen main at 47493b2e3dad091a18d6500970c6ea6f6b5824f8; reconcile before implementation because concurrent agents are active.  
**Scope:** Reusable imported/hand-drawn shapes and paths, persistent local library, round-trip portability, independent scattered objects, image-derived silhouettes, quality controls and the reference seven-circle wallpaper.  
**Non-goals:** New hosted/cloud asset service, account system, AI segmentation, arbitrary new pigments, complete general-purpose vector illustration editor, replacement of the current stripe renderer.

## 1. Product decision and user outcomes

ROYGBIV already has Layout > Canvas structure > Paths / Radial / Regions. Extend **Regions and partitions** with **Scattered shapes**. Do not create an eighth primary category or a sixth mobile navigation destination. Supply a **Shape & Path Library** that is independently reusable from the existing Draw Path and Import Path workflows.

The reference composition is seven independently positioned, mathematically circular red/orange/yellow/green/blue/indigo/violet disks of markedly different radii on black. Some disks intentionally extend beyond the image frame; the remaining black is significant visual content. A circle is not a degenerate stripe or a Voronoi cell.

The user must be able to:
1. Switch to Scattered shapes, choose **Circles**, produce and restore that sort of wallpaper with a **Rainbow Orbits** preset, including off-canvas circles.
2. Import a leaf/star/animal silhouette once; preview its detected outline; save it; use it repeatedly as a scattered shape in seven-colour wallpapers.
3. Import or draw a path, save it independently of the current wallpaper, move to a completely different canvas structure, reload the path next session, and apply it without losing either creation.
4. Use one asset as a shape or, when semantically valid, as a guide for a stripe path; the UI explicitly presents the available uses.
5. Move library contents to a different device without an account, preserve saved wallpapers when an asset is renamed/deleted, and recover from a failed import without destroying current work.
6. Work offline after installation with no third-party runtime service.

**Invariants:** Seven semantic ROYGBIV palette roles, not seven mandatory scene objects. Existing paths, nested regions, radial compositions, favourites, recipe v1/v2 imports, PNG metadata, headless export, locks, Undo and rendering behaviour must remain unchanged unless explicitly covered below. Imported geometry may be complex, but cannot inject new colour stops, remote resources or scripts.

## 2. Repository observations, precise integration points

| Current file | Reviewed behaviour | Proposed responsibility |
| --- | --- | --- |
| src/composition-geometry.js | STRUCTURES = paths/radial/regions; REGION_MODES = voronoi/organic/facets/blocks/nested; all closed regions use vertices/colorIndex, generated in a pure function | Add a scattered mode and reusable transformed shape instances, preserve all existing generator output by default |
| src/model.js | normalizeRecipe v2; regionCount currently quantized to **7,14,...70**, lockable setting schema; resolveScene creates seven palette colours then objects; randomization selects existing modes | Add canonical fields, scoped locks/variation; preserve legacy count rounding in older modes; allow 1..70 scattered objects; carry embedded geometry snapshots |
| src/renderer.js | drawRegionObjects fills one vertex ring per object; paints interiors and dividers; shared ink/material/light/camera/export pipeline | Accept circle primitive and polygon/multipolygon rings; use even-odd fills/clips; preserve old single-ring path exactly |
| src/interior-elements.js | drawRegionInteriors clips to object.vertices; src/polygon-inset.js already understands multiple rings with even-odd membership | Extend decoration masks, scope, offsets and bounds for compound shapes, holes and disjoint components, without clipping/contour regression |
| src/image-path.js | RGBA local extraction produces arc centreline, contour and line candidates; contours preserve concavities but function selects **only longest ring**, dropping holes; maximum selected components capped | Expose shared typed geometry candidates; add silhouette/multi-loop extraction and hierarchy; keep old path output unchanged |
| src/image-path-ui.js | PNG/JPEG/WebP/SVG decode, canvas preview, candidate selection, native dialog; path apply currently flows to Draw and is gated by path authoring locks | Provide a selected-candidate handoff to either path or silhouette library; reuse picker/state, no second competing file chooser |
| src/drawn-path.js / src/draw-path-ui.js | Open/custom path normalized to 600x1300 plane, bounded to 96 stored points, authored pins/corners and independent editor Undo | Reuse path authoring transactions; add explicit save/copy from valid finished path, later a distinct closed-shape authoring mode |
| src/path-authoring-locks.js | Import/drawing path commits Paths structure; lock errors are explicit | Distinguish asset acquisition/save (non-mutating to current recipe) from applying asset to a structure (must respect affected locks) |
| src/app.js | favourites persisted in localStorage under wallgen:favorites:v1; recent exploration recipe snapshots; app state uses normalizeRecipe, changeRecipe, actual-ink cache | Wire library repository and dialog; make Apply one Undo transaction; preserve selected geometry in form reconstruction and render cache keys |
| src/share-recipe.js | Compressed design links have 1 MB uncompressed cap and 8192-character URL cap; JSON/PNG fallback | Self-contained geometry must survive recipe delta; oversized URLs should explicitly defer to JSON/PNG, never silently omit shape |
| src/png-metadata.js, src/render-worker.js, scripts/render-headless.mjs | Portable recipe/worker/headless pipelines | Exact snapshot parity across every transport; no IndexedDB lookup during render |
| src/editor-schema.js, src/editor-layout.js, index.html | Seven categories and canonical control ownership, fixed-height mobile tool panels, native dialogs | Contextual region-specific controls and library entry, not a broad navigation redesign |
| src/exploration-history.js | Bounded in-memory recipe thumbnails, not an asset library | Stay separate; optionally provide link to save geometry from restored recipe |
| docs/UNIFIED-SCENE-QUALITY-AUDIT.md | 70-region rendering and field pattern performance concerns, worker/camera constraints | Run performance stress and real browser pixel tests for new shapes, holes and material decoration |

**Concurrent work:** PR #431 is changing labels and accessibility vocabulary; PR #432 is implementing a colour-vision preview. PR #429 is an unmerged terminology audit. Avoid conflicting text and use stable internal setting IDs; rebase and validate actual current labels before UI coding. Mobile ergonomics work through #426 is merged; docs/MOBILE-ERGONOMICS-ENGINEERING-HANDOFF-2026-10-21.md explicitly retains physical Pixel 6 Pro QA and 500x700 Draw occlusion caveats.

No AGENTS.md appears in the currently enumerated main tree. README.md, the above source, the UX/ergonomics documents and tests are the actual local authorities.

## 3. Information architecture and visible UX

**Names:** Keep Layout > Canvas structure > Regions and partitions. In the existing region layout selector add **Scattered shapes**, alongside Voronoi, Organic, Facets, Blocks and Nested. Conditional tool **Shape** provides **Circle / Ellipse / Polygon / Organic / Imported**; selection can open **Choose from library…**. The existing broad Shapes/Stripes category can remain disabled outside Paths; placement settings for scattered objects belong to the Region tools, not stripe-specific controls.

**Library entry points:**
- Draw Path overlay: after valid Apply, offer **Save path to library**; the actual wallpaper Apply remains one transaction. For a saved custom path, offer **Save a copy to library**.
- Existing image extraction dialog: candidate preview supports **Use as path**, **Save path**, **Use as shape** (only valid closed candidates), **Save shape**, and **Choose another image**. Non-mutating save does not trigger structure/geometry locks. If not enough room, use a clearly labelled purpose selector and one primary **Use** button plus **Save to library**; never five tiny side-by-side controls.
- Regions > Scattered shapes > Shape > **Library…** opens a chooser filtered to shapes. Paths > Geometry/Draw > **Library…** opens filtered to paths.
- A single **My shapes & paths** item in More/tools can open an unfiltered manager. It must not replace the existing Saved Wallpapers gallery.
- Library entry displays type badge, user name or generated fallback, silhouette/line thumbnail, Created/Modified when helpful, and meaningful actions **Use**, **Rename**, **Duplicate**, **Export**, **Delete**; no feature-critical gestures hidden in long press.

**Library browse sheet:** On mobile use a native full-stage dialog like existing image import, respecting safe areas and bottom dock; internal scrolling, never force the wallpaper editor to grow vertically. On desktop use a centred, resizable modal with preserved focus. Header: title, **All / Shapes / Paths / Recent**, search, import/manage overflow. Adaptive 2-column phone, 3–5-column desktop thumbnails with consistent square preview areas; a checkerboard/neutral canvas conveys transparency, distinct from the wallpaper's actual black/white background. Long names truncate visually but remain accessible in full; keep touch cells at least 44 CSS px where physically feasible, with discrete actions. A no-results search state is distinct from an empty library and from unavailable storage.

**Mode-specific primary action:** If opened from region shape picker, card action reads **Use shape**; if from Path, **Use path**. Tapping a candidate shows a larger preview and its metadata, with Cancel and Use; avoid accidental wallpaper mutations from merely browsing. Never silently switch structures under a lock. A shape with holes previews those holes accurately. During use, keep library browse position/search and return focus predictably.

**Acquisition flow:** Choose image → see the image with highlighted candidates → choose a contour → choose intended use → optional name → Use and/or Save. Saving is explicit; however, locally retained **Recent imports** provide recovery from an accidental close. Recent drafts have a bounded retention policy, clear expiry and a **Keep** action; their automatic retention must be communicated, not mistaken for permanent backup. Do not save the original source raster without consent or a documented policy.

**Editing flow:** The library stores an immutable asset revision. Applying always copies its geometry into the active recipe. Editing a placed path changes that recipe; library source remains untouched. **Save as new shape/path** creates another item. **Replace library copy** is an explicit user action with conflict confirmation and a revision, never an implicit save. Deleting a library entry explains: “Saved wallpapers keep their own copies; this removes the reusable item.” Undo/Cancel must restore the current wallpaper and previously focused control.

**Failure UX:** Use actionable messages: “Couldn’t save in this browser. Your wallpaper is unchanged. Export this shape instead.” Distinguish quota/full storage, unavailable/private browsing, unsupported format, no closed contour found, and locked application. Do not optimistically claim saved before the IDB transaction commits. A backup banner can appear after meaningful library growth or on a storage warning, not on every app launch.

**Visual design:** Reuse existing rainbow icon language, cream/dark themes, card radius, icon semantics and existing available import-path, draw-path, search, save, plus, close and shapes motifs. Author 1–2 new icons only if current symbols fail a genuine identification test, in the SVG icon system, no unreviewed third-party illustration pack. The library should feel like part of ROYGBIV, not a file-manager app nested inside a wallpaper app.

## 4. Concrete scattered-shapes controls and rendering semantics

**Preset Rainbow Orbits:** structure=regions; regionMode=scattered; shape=circle; count=7; palette=classic; background=black; high size contrast; separated placement; substantial edge cropping; no divider, material, glow or shadow by default. Preserve seven pigment roles with colour indices 0..6. Preset uses deterministic seed and named settings, not hard-coded positions.

Recommended canonical settings (names are UI candidates; stable keys listed for implementation):
- regionShapeKind: circle | ellipse | polygon | organic | imported (only relevant in scattered).
- scatteredCount: integer **1..70**, default 7; do NOT change legacy regionCount's existing multiples-of-seven semantics or quantization for other modes. UI may call it **Count**.
- scatteredMinSize / scatteredMaxSize: bounded percentages of logical 600x1300 short axis; enforce min <= max; use visible **Size range** as a coordinated control.
- scatteredSizeVariation: 0..100 affects radius sampling distribution (small and large extremes vs similar sizes); avoid making the slider duplicate min/max.
- scatteredSpacing: 0..100 signed intended clearance relative to sizes, with overlap policy separated out.
- scatteredDistribution: balanced | free | clustered | dispersed (distinct seeded algorithms or measurable placement metrics).
- scatteredEdgeCrop: 0..100 controls permissible centre/shape overhang, not scaling/distortion.
- scatteredOverlap: separate | touching | overlap; for overlap deterministic z-order and optional **Layer order** later.
- scatteredRotation: -180..180 degrees applicable to nonsymmetric shapes only; optional scatteredRotationVariation=0..100 if genuinely distinct.
- scatteredShapeIrregularity: 0..100 for organic and polygon families only, not circles.
- scatteredShape: canonical portable geometry snapshot, **required** only for imported kind; optional reference ID is provenance, not a render dependency.
- scatteredColourOrder: rainbow | shuffled; never modify underlying semantic pigments. Optional later cycle/random assignment for >7 instances.
- scatteredOverrides: optional bounded per-object transform and colour-index overrides; Phase 2/3, not a prerequisite for MVP.

**Placement algorithm:** Use a seed-derived PRNG stream namespaced by mode and object index, not Math.random or iteration order dependent on UI events. Work in logical 600x1300 units, derive shape local bounding geometry and anchor point. Sample radii from a documented distribution (e.g. log interpolation across allowed range), then candidate centres from an overscanned domain. For separated mode, reject by broad-phase disk/AABB then exact geometry intersection/clearance; use circle-specific exact distance for the hero preset. Use bounded attempts, seeded local relaxation and limited deterministic size reduction; if impossible with constraints, show a meaningful unsatisfied-density state or explicitly bounded fallback, not silently discard objects or overlap despite the setting. Reserve a minimum visible fraction of each intentionally cropped shape. Stable tie-breaking (asset/local geometry hash then index) and render order guarantee identical results in browser worker, Node headless and restored recipe.

**Geometry fidelity:** Represent a circle analytically through canvas arc (or equivalent exact primitive) for arbitrary scale, not merely 144 polygon facets at 19.8 MP; uniform logical scaling preserves circularity. For ellipse preserve intended proportions and rotation; for imported geometry apply a uniform local-to-world scale by default to preserve source aspect, with separate explicitly named stretch mode only if later desired. Support negative centres/off-canvas bounds; clipping happens at render camera, not by mutating saved source contours. Keep background untouched where there are no objects. Avoid sequential placement bias that always privileges red/big objects: allocate a seeded size/index order independent from assigned colour order.

**Performance budget (targets, not pre-verified measurements):** Normal seven-shape preview updates perceptibly promptly on Pixel 6 Pro-class mobile, with no multi-second unresponsive UI. Bound expensive polygon collision work, contour sampling and per-frame redraw; use existing render worker/interactive quality pipeline. Stress 70 simple shapes, seven detailed imports, full-res 3024x6552 PNG, texture + lighting + contour details. Profile before setting precise millisecond gates, and gate changes on actual measured relative regression.

## 5. Portable geometry asset model

Introduce a **geometry asset v1** schema and normalization module independent of browser DOM, indexed storage or painter. Asset wrapper (illustrative JSON contract):

    {
      "schema": "roygbiv.geometry-asset",
      "version": 1,
      "id": "uuid-v4",
      "revision": 1,
      "kind": "path",
      "name": "Hand-drawn wave",
      "createdAt": "ISO date",
      "modifiedAt": "ISO date",
      "tags": ["wave"],
      "geometry": {
        "type": "open-path",
        "space": "wallpaper-600x1300",
        "points": [[0.1, 0.2], [0.2, 0.3]],
        "anchors": [],
        "corners": []
      },
      "source": {"kind": "drawn"},
      "contentHash": "sha256:..."
    }

Shape geometry alternative:

    {
      "type": "compound-region",
      "space": "asset-local",
      "viewBox": [0, 0, 100, 120],
      "components": [
        {"outer": [[...], [...], [...]], "holes": [[[...], [...], [...]]]}
      ],
      "fillRule": "evenodd"
    }

**Coordinate contract:** Open Draw paths keep existing normalized wallpaper frame coordinates, including permitted -2..3 overscan and pins/corners; use the existing normalization for Apply. Imported closed regions are expressed in a source-local viewBox with a real aspect ratio and finite coordinates. Components are disconnected filled islands; holes subtract ink. Each component has nondegenerate closed outer/inner rings; no arbitrary commands, HTML, bitmap or executable SVG survive into canonical geometry. Canonical normalizers must reject NaN/infinity, duplicate-only/zero-area loops, extreme vertex counts, nested-depth attacks, self-crossing geometry that cannot be regularized safely, and invalid boxes, while preserving intentional concavity and sharp corners. A shared **shape-boundary** module can expose flatten, transform, bounds, area, collision and Path2D/Canvas trace, with no reliance on the 96-point stroke limit for shapes.

Keep a strict distinction between:
- Asset metadata in IndexedDB (ID, name, revision, date, tags, source provenance, current geometry or blob pointer).
- Immutable **render snapshot** embedded in any recipe using custom geometry, containing only validated geometry and a content hash; optional library ID is metadata, never a required lookup.
- Source image (optional separate Blob) used solely for later re-extraction; prefer user opt-in, strict size cap, avoid source retention by default. Do not include original image bytes in recipes, PNG metadata, public share URLs or thumbnails.

Assets have stable random UUID IDs, a monotonically increasing revision, UTC ISO timestamps and an SHA-256 of canonical geometry for dedupe/integrity. Library can hold same geometry under different names but offer **Use existing** on identical content. Put a hard cap on SVG/raster input, number of loops/components, per-loop vertices and total serialized bytes; benchmark and document thresholds before shipping. All names/tags are plain text via textContent.

## 6. Self-contained wallpaper recipe transport, compatibility and randomness

Add a normalized field for selected scattered geometry and parameters in src/model.js. The selected snapshot can use:

    scatteredShape: { assetKind: "compound-region", geometryVersion: 1, geometry: {...}, contentHash: "...", sourceAssetId: "optional" }

For an imported path applied to the ordinary Paths mode, continue using customPath/drawnAnchors/drawnCorners, optionally record non-rendering source metadata separately if worthwhile. **A recipe must not require local library IDs for geometry to render.** A missing/deleted library is irrelevant to existing artwork.

Keep recipe version 2 unless a clearly documented interoperable breaking change requires a new version; all older normalized recipes must remain pixel-identical and fields must default inert. Every new field belongs exactly once to EDITOR_CATEGORIES/SETTING_TOOL or to a documented non-scalar manager, and is included in real form reconstruction, Undo, lock compatibility, scoped randomizer, artKey, export and worker clone. Set immutable defaults before normalizing; aggressively limit untrusted geometry sizes for PNG/JSON/URL import.

Exports and transport:
1. Full JSON recipe: full embedded shape snapshot.
2. PNG with recipe metadata: the exact same snapshot and seed. Test reimport without IndexedDB.
3. Share link: compression as existing; if >8192-character link or >1 MB uncompressed limit, show **Use JSON or PNG**, not a broken or omitted geometry link.
4. Headless CLI: accept embedded geometry with deterministic output even in Node without IndexedDB.
5. Favourites, Undo and exploration: structure-clone the same geometry; no stale object pointers. Renaming/deleting library assets does not alter favourites.

Object placement, material texture seeds and per-object overrides must be deterministic from seed + geometry content; no random values are generated at paint time. For a future **Reroll positions only**, derive new placement seed without changing colour assignment, template source or explicitly locked transforms. Preserve all other locked and dormant fields when switching structures.

## 7. Shared import and drawing pipeline

**Raster path:** Reuse current decode and local RGBA analysis. Introduce a typed candidate result, not two duplicated algorithms: detected line/centreline => open path; contour => closed shape candidate; optional outer+holes hierarchy; explicitly mark ambiguous or touching components. Existing extractImagePathCandidates and pathToWallpaper stay compatible until replacement tests prove parity. Expose a separate extractImageGeometryCandidates adapter for the new workflow. Background removal options: alpha-first (transparent pixels authoritative), foreground threshold for opaque art, and manual **Invert foreground**/threshold controls where confident extraction fails. No AI model or uploaded file required. Keep source image orientation/aspect and cover broad light/dark sources. The old algorithm's longest-loop-per-component code must be extended or separated to retain holes and multiple islands; avoid accidentally using a stripe centreline as a filled shape.

**SVG path:** Current importer accepts SVG as an image, but rasterizes it for pixel extraction. For high-fidelity imported silhouettes, develop an optional strictly constrained vector extraction of safe shapes/path geometry and transforms/viewBox, with a raster-analysis fallback. Never insert untrusted SVG/XML into the app DOM or use innerHTML; forbid scripts, event attributes, foreignObject, external references, CSS imports and network fonts/images. All accepted vectors are converted to safe finite numeric contours, then discarded as raw markup. SVG rendering as <img> is safer than inline SVG but isn't a substitute for sanitizing parser input. Decide package/parser after a proof with arcs, Beziers, transformed groups and holes. For SVG logos with text, gradients, clipping, filters, or strokes-only graphics, either flatten correctly into fills via a bounded raster silhouette path or provide a candid “Simplified silhouette” preview and warning.

**Draw:** Add a separate explicit **Close shape** action rather than quietly converting every looped stripe path into a region. Permit finger tracing plus the existing point/anchor/corner workflow where possible, but store an appropriate compound closed shape independently from the existing path object. Save/Cancel preserve existing Undo exactly. A pre-existing path remains an open path unless the user explicitly chooses close/convert and confirms the seam.

**Preview/extraction UX:** Show raw image, mask/silhouette, outer ring and hole highlights, selected candidate and confidence/limitations. Permit **Choose another candidate**, **Invert**, **Refine threshold** and **Keep outline**; don't create sprawling expert controls unless they have measurable impact. Ensure a clear result for cut-off shapes touching the input's border, including “edge may be incomplete.” All file decoding remains local. Validate MIME/signature, sizes, dimensions and decoded pixels before making current recipe changes.

## 8. Persistence, backup and reliability

Use a versioned IndexedDB database **roygbiv-geometry-v1** with object stores:
- **assets** key=id; indexes kind, modifiedAt, normalizedName; value includes normalized asset metadata and geometry, optional library-specific usage counts only as non-authoritative.
- **drafts** key=id; bounded recent imports/drawings with savedAt, status and geometry, no permanent library semantics.
- **blobs** key=blobKey; optional user-retained original raster or sanitized source plus mime, byte length, content hash.
- **meta** key=key; schema migration and last successful backup notice fields.

All writes use awaited transactions; save atomic asset + related blob/metadata with rollback on failure. IndexedDB can fail at open, transaction, quota, blocked upgrade or read. Provide a session-only fallback for active editing with an explicit **Download shape/backup** action; never claim persistence if it failed. Request navigator.storage.persist() after a meaningful user action and expose persisted/denied outcome without framing persistent storage as a guarantee against clearing site data. Expose navigator.storage.estimate() as informational only. On blocked upgrades show **Close the other ROYGBIV tab to finish updating your library**, preserving read-only access where practical.

Cross-tab: use BroadcastChannel for same-origin change notifications when available and a version/timestamp reconciliation on window focus; treat the database as authoritative. Merge concurrent writes by revision precondition and show a clear conflict resolution, not last-save silently winning. Thumbnails are bounded and can be regenerated; never make the only geometry copy a thumbnail data URL.

**Backup format:** Versioned **roygbiv-shape-library-v1.zip** with manifest.json and one canonical geometry JSON per asset, optional separately named original blobs with hashes, strictly bounded preview PNGs if included. Manifest records format version, export time, source app version, asset count and integrity list. Accept ordinary individual geometry JSON (no ZIP needed for one asset). Import flow scans/decompresses into memory or a staging store under firm compressed/uncompressed limits; validate *every* entry and hashes first, then show merge preview: Add X, Skip identical Y, Resolve Z conflicts. Commit in a single logical transaction or recoverable batches with documented all-or-nothing semantics; never delete/replace existing records during parsing. Reject zip-slip paths, duplicate names and decompression bombs. Archive exported by a user is a real independent backup; local browser origin storage is never described as the sole backup.

**Privacy:** local-only; no third-party server, analytics or image upload. Original photos/images are not auto-synced; no unsanitized SVG included in rendering. Delete asset deletes associated non-shared retained blob only when no other records reference it, with separate confirmation and a recoverable undo window if feasible.

## 9. Reuse research and dependency policy (checked 2026-10-21)

Use **native primitives first**; pin and review any adopted dependencies and retain their required licences in repo. Current package.json has no runtime dependencies/build bundler, and GitHub Pages serves static modules; do not add a build system solely for one small utility or depend on a CDN at runtime.

- IndexedDB and persistent storage: [MDN storage quotas/eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [web.dev offline data](https://web.dev/learn/pwa/offline-data). Recommended tiny IndexedDB adapter **idb** ([GitHub](https://github.com/jakearchibald/idb), ISC licence, contemporary package 8.x); alternatively build a small project-local Promise wrapper. Evaluate static ESM delivery/offline caching before deciding.
- Contour holes/fills: [MDN Canvas clip fill rule](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/clip) documents 'evenodd'; [Path2D.addPath](https://developer.mozilla.org/en-US/docs/Web/API/Path2D/addPath) can combine paths with a transform. Prefer native Path2D / ctx.fill(path,'evenodd') / ctx.clip(path,'evenodd') for rendering; the existing polygon-inset.js has even-odd membership support.
- Polygon collision/Boolean operations: [polygon-clipping](https://github.com/mfogel/polygon-clipping), MIT, robust polygons/multipolygons with holes, suitable for overlap/clearance validation **after profiling**; circle collision uses exact geometry without package. [martinez-polygon-clipping](https://www.npmjs.com/package/martinez-polygon-clipping), MIT, alternative; benchmark difficult concave/hole cases before selection. Never include both.
- SVG path transforms: [svgpath](https://github.com/fontello/svgpath), MIT; path parsing and arc-to-Bezier transform support as an optional constrained importer building block, not a sanitizer. [svg-pathdata](https://github.com/nfroidure/svg-pathdata), MIT, alternative command parser. A safe supported-subset SVG importer is preferable to executing arbitrary XML/CSS. [MDN SVG scripting](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/Scripting) explains script dangers in document/inline embeddings and stricter SVG-as-image behaviour.
- Portable ZIP: [fflate](https://github.com/101arrowz/fflate), MIT, compressed ZIP and async/streamed work without a new server; prefer single pinned implementation and validate decompressed lengths before allocating/writing.
- Keyboard/multi-card accessibility: [W3C APG grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/), [keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/), [modal dialog example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/). Start with ordinary button cards in a semantic list/grid for straightforward Tab semantics; add composite ARIA grid/arrow navigation only if implemented completely, with focus and selected state independent.

**Assets:** No third-party shape art needs to be shipped. Built-in circle/star/ellipse/polygon use original math, organic shapes generated algorithmically. For QA use self-authored simple SVG/raster fixtures (leaf, star, doughnut with hole, disconnected islands, concave mark, partial off-frame source) under tests/fixtures; no unverified art packs or font assets.

## 10. Implementation sequence and merge-safe ownership

Implement as small dependency-ordered PRs, each rebased on current main. A dedicated checklist with exact tests follows in [SHAPE-PATH-LIBRARY-IMPLEMENTATION-QUEUE-2026-10-21.md](SHAPE-PATH-LIBRARY-IMPLEMENTATION-QUEUE-2026-10-21.md).

**Stage A, schema and library core:** pure portable asset normalizer + checksum, memory adapter/IndexedDB repository + failure pathways + unit tests; no new UI or geometry rendering; validate source licensing. Preserve existing Path without changing it.

**Stage B, library UX and existing path integration:** reusable browse/save/rename/delete/duplicate/import/export; Add Save from Draw and existing Import; Apply selected path through original Draw transaction and lock semantics. Backup entire library and test reload and cross-tab with real Chromium.

**Stage C, circles MVP:** Scattered mode with analytic circles, Rainbow Orbits preset, compact controls, deterministic packing, 1..70 scattered count; restore/export/camera/worker/colour invariants. Avoid premature arbitrary shape complexity.

**Stage D, imported silhouettes:** compound region extraction including holes and disconnected parts, vector parsing safe subset, library shape selection, scaled/rotated instances, collision. Field/interior/decorations masks must respect holes. Exact PNG/JSON/offline parity tests.

**Stage E, advanced authoring and polish:** explicit Draw shape closure, star/polygon/organic/mixed families, transforms and object overrides, geometry editing/revision UX, bulk transfer, performance calibration, accessibility and manual mobile signoff. Do not block basic persistence or circles on Phase E.

## 11. Release gates and what remains human

Ship only after executable acceptance for:
- Legacy seeded recipes have unchanged normalized properties and pixel/hash output for paths, radial, Voronoi, blocks, nested, complex interiors and 70 regions.
- Every new stored setting has exactly one editor schema owner, an applicable/inapplicable state, lock behaviour, scoped variation behaviour and full recipe round trip. Existing saved recipes with unknown/new fields degrade safely.
- Seven circles from Rainbow Orbits are genuine circles, colour-index complete, black background, size varied, non-overlapping when selected and reproducible in 412x892 preview and 3024x6552 PNG. At least two deliberately off-canvas without flattening edges. Geometry extends correctly under camera pan/zoom and nudge.
- Imported donut holes remain empty in fill, interior material masks, silhouette shadows and SVG/PNG/headless outputs; disjoint contours survive. A concave shape and tilted ellipse keep geometry at phone/output resolution.
- Imported shape saved to library → switch to Paths → restart/reload → select saved shape → apply; saved independent path survives reverse journey. Asset deletion/rename/version changes never mutate any existing recipe.
- Atomic failure simulation: storage denied, quota exceeded, transaction aborted, interrupted import, reload mid-write, second tab edit, invalid ZIP/SVG, malicious keys, very large contours. No half-saved corrupt library or silent apparent success.
- Entire library export → clean-origin restore → original names/geometry/hashes/versions, idempotent second import and explicit conflict resolution. Recipe PNG can independently restore imported geometry on a device with empty library.
- Keyboard-only accessible chooser, TalkBack/axe scans, 44px actionable targets at 412x892 and 500x700, 200% text, theme contrast and predictable dialog focus. Check mobile full-screen/Back and the unrelated existing Draw occlusion issue without reopening those features unnecessarily.
- Renderer deterministic regardless of preview worker availability; no untrusted SVG HTML insertion or outgoing network requests. Production console no unresolved warnings.

**Human-only release checks:** physical Pixel 6 Pro Chrome/installed PWA, actual Android share/download/import of full library, tactile hit targets, TalkBack, final art quality of random circle layouts, and whether names/actions are intuitive. Automated browser proofs are not a substitute.

## 12. Key architectural choices to revisit only with evidence

1. **Independent snapshot in every design** is non-negotiable; references alone are fragile in offline user data.
2. **Two geometry kinds in one library** avoids duplication but respects the real difference between a stroke guide and a fillable region.
3. **No cloud and no compulsory account**; portability is provided by explicit archive export/import and full recipe metadata.
4. **Do not change existing seven-step regionCount** merely to achieve seven circles. Introduce a dedicated scattered count.
5. **Do not make SVG markup or user photos first-class executable recipe content**; convert to a safe compact numeric shape.
6. **Keep placement separate from source geometry**; repeated instances do not duplicate mutable master assets.
7. **Do not promise browser storage can never be lost**; surface backup and failure handling coherently.
8. **Deliver preservation before advanced placement/editing**; it has immediate standalone user value and reduces later migration risk.

### Reference context

- User reference artwork: seven rainbow circles on black, partial edge clipping, heterogeneous radii, no visible overlaps. Not added to repo in this documentation PR; this plan describes its relevant construction.
- README.md sections **Unified composition model**, **Interior decoration layers**, **Open-path continuation** and Draw/image import; docs/UNIFIED-SCENE-QUALITY-AUDIT.md; docs/MOBILE-ERGONOMICS-ENGINEERING-HANDOFF-2026-10-21.md; actual editor/model/import/export code and tests reviewed above.
- Active UI work to reconcile: PRs #429, #431 and #432. This document does not claim their code is merged.

