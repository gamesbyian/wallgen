# Shape & Path Library + Scattered Shapes: executable implementation queue

> **2026-10-22 later checkpoint:** [#527](https://github.com/gamesbyian/wallgen/pull/527) merged two previously missing library card actions: **Rename** with revision conflict protection and **Duplicate** to a new independent geometry asset ID. Tests confirm whole-shape/path snapshot integrity and that copies survive source deletion. Core shapes, direct drag, local library/JSON portability remain shipped; detailed object layer order, ZIP/source blob retention, new placement strategies and physical-device gesture quality are still optional, not release-blocking. Older Stage F unchecked boxes below are historical and should not reopen shipped work.

> **2026-10-22 CURRENT STATUS:** This 2026-10-21 unchecked implementation queue is a *historical original proposal*. #434 merged canonical assets, local IndexedDB library, import/export, scattered circles, Rainbow Orbits and compound silhouette stamps. #449 added per-object nudge/size/reset with portable recipe overrides; #456 added opt-in direct canvas drag including compound-hole selection and one Undo step on release. **Stages A–E shipped; optional parts of F are still open.** Use [issue #443](https://github.com/gamesbyian/wallgen/issues/443) and [active roadmap](ACTIVE-PRODUCT-ROADMAP-2026-10-22.md) for the remaining ZIP/source-image retention, layer ordering, and physical-device gesture observation. Do not implement the shipped stages again, or apply historical full-Chromium acceptance to routine PRs; [lean CI](CI-OPERATIONS-2026-10-22.md) takes precedence.


**Status:** All boxes below are proposed and unchecked; no feature code has been implemented by this documentation PR.  
**Companion specification:** [SHAPE-PATH-LIBRARY-AND-SCATTERED-SHAPES-PLAN-2026-10-21.md](SHAPE-PATH-LIBRARY-AND-SCATTERED-SHAPES-PLAN-2026-10-21.md)  
**Target:** gamesbyian/wallgen, reconcile with current main and open PRs #429/#431/#432.  
**Definition of closure:** source change, tests and source-bound actual-browser evidence on exact resulting SHA, and explicit remaining physical-device/visual QA. A source assertion or an unchecked UI screenshot alone does not close a functional row.

## Dependency chain and PR slicing

A (canonical asset format) → B (storage and transport) → C (library browse/save/apply paths) → D (scattered circles and hero preset) → E (imported compound silhouettes) → F (editor/advanced families). Stages A and D pure geometry algorithms can be developed in parallel on separate branches but do not merge UI without schema/transport gates. Keep PRs focused: avoid simultaneous ownership of app.js, model.js, editor-schema.js, index.html and mobile CSS without coordination.

### A. Canonical reusable geometry assets (first PR)

- [ ] Create **src/geometry-asset.js**: pure normalizeGeometryAsset, normalizeOpenPathGeometry, normalizeCompoundRegion, geometryBounds, geometryHashPayload, cloneGeometrySnapshot and assetToDrawPath. Define explicit v1 API, reject unknown types/unsafe prototype keys, deduplicate consecutive points, reject nonfinite values/zero-area rings and cap geometry length. Reuse existing normalized Draw point routine for paths; avoid that routine's 96-point bound for shapes. Use deterministic round-to-five-decimal or tighter measured precision; document deviation budget in logical units.
- [ ] Define precise asset ID/revision and copied render snapshot type in **docs** and **tests/fixtures**. Source names/tags never influence generated pixels. Use crypto.randomUUID() for new IDs; predictable hash over canonical numeric geometry for duplicate detection; hash only for integrity/dedupe, never as sole asset ID.
- [ ] Implement safe conversion from existing recipe.customPath plus drawnAnchors/drawnCorners to open-path asset, and from open-path asset back into an applied Draw transaction. Preserve per-station authorship mapping and off-frame points.
- [ ] Define compound region as components of outer plus zero-or-more holes, each with true local viewBox and independent finite coordinate loops; include concave and nested/disconnected fixtures. Decide filled regions vs unfilled outlines explicitly, never guess from stroke colour.
- [ ] Cover serial round-trip and geometry exactness via **tests/geometry-asset.test.js**, **tests/geometry-asset-hostile.test.js** and existing tests/drawn-path.test.js, tests/drawn-anchor-index-normalization.test.js. Assert untouched older customPath serialization.
- [ ] Make raw asset geometry the only exported object; no raster, executable markup or network reference in its canonical representation.

**A acceptance:** 100% representative fixtures normalize to identical geometry after encode/decode, invalid/oversized input fails closed, legacy path imports are bit-for-bit preserved after Apply, no new runtime DOM requirement.

### B. IndexedDB-backed library and archive portability (second PR)

- [ ] Add **src/geometry-library-store.js** with dependency-injectable storage and async methods open, list(filter/sort/page), get, add, update(ifRevision), duplicate, delete, saveDraft, promoteDraft, pruneDrafts. Use object stores assets, drafts, blobs and meta with versioned upgrade; names/text safe. Supply a test-memory adapter with the same semantics to make unit tests independent of browser API.
- [ ] IndexedDB writes are awaited to committed transaction completion; unique IDs and revision checks make rename/update atomic. Never mutate caller-provided geometry object. Use pagination/metadata index for library list rather than full blob scans. If IndexedDB is denied/unavailable, a session-only adapter keeps UI functioning but visibly warns and enables export; never claims a durable save.
- [ ] Implement bounded recent drafts: default at most 20 items, prune only drafts older than 14 days or oldest beyond cap, and never delete an explicit library asset. Restore draft after reload. If 14-day retention is untenable based on QA, revise with a documented user-visible policy before shipping.
- [ ] Add **src/geometry-library-backup.js**: versioned manifest plus per-asset JSON; optional source blobs; indexed integrity hashes; fflate (pinned/vendored with licence) only if proven necessary and safe for static offline delivery. Single asset JSON export/import must work even if ZIP package isn't yet integrated.
- [ ] On import, enforce compressed file cap (e.g. 25 MiB), archive entry count (e.g. 500), individual asset JSON cap (e.g. 1 MiB), total decompressed cap (e.g. 100 MiB), basename validation and per-shape vertex bounds, with clearly documented limits. Parse all entries into staged validated objects before any write. Resolve same-ID/different-hash collisions by explicit Skip / Add as copy / Replace with revision; second import of identical archive must not double the library. Numeric limits are starting engineering bounds, tune after actual device profiling.
- [ ] Add **src/geometry-library-sync.js** if needed: BroadcastChannel notification, re-read database on focus, revision conflicts; no BroadcastChannel dependency for correct storage.
- [ ] Check persisted(), estimate(), optionally call persist() only following an explicit save/import, show result without promising immunity to user-cleared data. Ensure private browsing and blocked IDB upgrades fail intelligibly.
- [ ] Test via **tests/geometry-library-store.test.js**, **tests/geometry-library-backup.test.js**, **tests/geometry-library-browser.mjs** (two real Chromium tabs, abort/quota/denied flows, reload, clear data, ZIP malformed/collision/oversize). Include no server request assertion.

**B acceptance:** Restart survives, duplicate names allowed with distinct IDs, data-conflict logic is observable, writes are atomic, backup round-trip from clean origin is lossless, malformed archive leaves all previous assets intact. Storage denial is clearly disclosed.

### C. Library UX, existing Draw/import integration (third PR)

- [ ] Add **src/geometry-library-ui.js** and scoped **geometry-library.css**. Accessible <dialog> chooser with All / Shapes / Paths / Recent, local search, consistent thumbnails, detail preview, plain-language action labels, empty/error/saving states. Bind to existing keyboard/focus handling and native mobile full-stage dialog patterns.
- [ ] Add context entry from **src/draw-path-ui.js** and **src/image-path-ui.js**; avoid duplicating upload or path-editing engines. Existing file dialog's candidate selection remains functional. Use existing import-path/draw icons until stronger dedicated assets are justified.
- [ ] Add **Save path**, **Save shape**, **Use path**, **Use shape** according to actual candidate type. A disconnected/closed region cannot be imported to the stripe centreline without an explicit outline-as-path conversion. Mark the difference.
- [ ] Wire active path selection to **appliedDrawnPathRecipe** through src/app.js, one Undo transaction, honoring geometry/structure locks; saving an asset alone does not change the wallpaper and may remain available when applying is locked. Cancel never changes wallpaper.
- [ ] Add compact library access to editing screens and existing More area without modifying seven-category or five-destination navigation. When a modal closes, restore focus to the launching control; browser Back/Escape closes only that overlay, not edit state.
- [ ] Prevent stale async dialog operations: each load/selection/save has generation token or aborted request, so earlier results cannot overwrite a newer chooser/source. Loading indicators survive slow storage without trapping focus.
- [ ] Test **tests/geometry-library-ui.test.js**, **tests/geometry-library-path-browser.mjs** and existing tests/image-path.test.js, tests/image-modal-async-lock-race.test.js, tests/path-authoring-structure-lock.test.js, tests/draw-apply-transaction.test.js.
- [ ] Test 320, 360, 412x892, 499/500/790 widths, 500x700 landscape/short portrait, light/dark, 150% and 200% text, Tab/Shift-Tab/Enter/Escape, TalkBack labelling. Keep buttons not narrower than 44px where normal layouts allow. Do not claim physical phone acceptance.

**C acceptance:** Save Draw path → restart → use it; Save image-derived path → switch to Radial → return to Paths → restore exactly; locked application rejected without losing saved asset; storage denial offers export; naming and card layout remain comprehensible in a hand-sized screen.

### D. Scattered circles / Rainbow Orbits (fourth PR)

- [ ] Add **scattered** to REGION_MODES in src/composition-geometry.js, then add all region-mode-specific normalized settings to src/model.js, LOCKABLE_SETTINGS, randomizeAllRecipe, src/editor-schema.js and index.html form. Existing Voronoi/organic/facets/blocks/nested regionCount still quantizes in sevenths. New scatteredCount permits 1–70. Every new scalar setting has exactly one editor owner and a scoped reroll/lock.
- [ ] Implement **src/scattered-composition.js** as pure deterministic geometry builder. Seed and candidate streams separated by purpose; exact circles; size radius distribution, clearance, clustering/dispersal, edge-crop extent, collision, bounded search/relaxation. When constraints are infeasible, return a typed diagnostic and a visible fallback state, never a silent missing-circle composition.
- [ ] Extend **src/renderer.js** to accept exact circle shape primitive while retaining region object legacy rendering. Stroke/divider and interior masks must use same primitive.
- [ ] Add **Rainbow Orbits** to starting styles/preset UX so it actually changes structure/regionMode and relevant settings, not just palette; add an accurate thumbnail from production renderer. A baseline default seed fixture should show visibly large/small circles, some partially off canvas, other circles fully inside, black negative space.
- [ ] Colour assignment: seven requested circles map uniquely to seven rainbow semantic roles in standard order by default; >7 cycle or use a documented distribution; 1–6 intentionally show only a subset. Keep shape count independent of stripe count.
- [ ] Confirm existing canvas camera/pan/nudge/material/light/outline/PNG paths operate unchanged and are cached using all geometry-affecting new fields.
- [ ] Add **tests/scattered-composition.test.js**, **tests/scattered-circles-pixels.test.js**, **tests/scattered-browser.mjs**; extend tests/model.test.js, tests/composition-geometry.test.js, tests/recipe-transport-matrix.test.js, tests/render.test.js, tests/headless-cli.test.js and existing layout/lock tests.

**D acceptance:** Pixel sampling/shape fit proves circular (within raster edge antialias tolerance) rather than stretched elliptical; fixed seed exact object centres/radii and seven colours across preview, export and worker; 1,7,14,70 counts; zero unexpected intersection in separate mode; visible edge cropping; legacy fixture parity.

### E. Compound silhouettes and imported region stamps (fifth PR)

- [ ] Extend **src/image-path.js** with shared typed candidates and multi-loop contour extraction. Preserve old open-path candidates; add alpha-first mask and holes/island hierarchy with reliable component assignment. Make original longest-loop extraction a backward-compatible path adapter, not global shape normalizer.
- [ ] For SVG, test a restricted vector parser on path/polygon/rect/circle/ellipse and transforms/viewBox/holes; convert arcs/Bezier to bounded point sampling with specified error. Ban scripts, event handlers, foreignObject, remote refs, stylesheets, embedded HTML, network resources. Fallback to raster mask for unsupported paint/fill semantics after preview and explicit user agreement. No raw SVG enters DOM or recipes.
- [ ] Add importer UI choice **Use as shape** with preview and normal Save; if no closed region, explain and allow ordinary path import.
- [ ] Wire selected embedded geometry from **src/model.js** to **src/composition-geometry.js** scattered objects using uniform scale and rotation. One asset → N deterministic placed instances; source geometry never changes when a copy is positioned. Include content hash in render cache.
- [ ] Extend src/renderer.js region path building with compound outer/holes, fill/clip with even-odd, correct shadow and divider around outlines and holes. Update **src/interior-elements.js** to use that same mask (currently single object.vertices) and preserve polygonInset geometry-specific contours. Do not paint a solid colour over intended transparent holes.
- [ ] Implement fast AABB/circle broad-phase and then exact concave/hole geometry collision where separation requires it; compare polygon-clipping vs lighter custom predicate with benchmark before adding dependency. Do not use bounding-box rejection alone as a guarantee that shapes cannot overlap.
- [ ] Test generated originals and stamps with concave, convex, disconnected, ring/doughnut, nested-hole/island, self-crossing invalid, near-zero bridge, mirrored/rotated/negative off-frame; include PNG and transparent SVG sources. Raster extraction tests should use actual pixels not only object metadata.
- [ ] Add **tests/compound-regions.test.js**, **tests/image-shape-extraction.test.js**, **tests/image-shape-security.test.js**, **tests/shape-mask-browser.mjs**, full resolution PNG/JSON round trip on an empty library and no-network runtime check.

**E acceptance:** User-supplied safe silhouettes survive fill and interior masks and preserve holes in full-size exported wallpaper; unsupported SVG is rejected or deliberately raster-fallback'd with user-visible preview; no remote loads, no shape distortions from coordinate conversion; deleting the library original never damages output.

### F. Hand-drawn shapes, multi-object arrangements and polishing (sixth+ PRs)

- [ ] Add explicit **Close outline / Keep open path** to the existing Draw tool, preserving its existing stroke fit, anchors, point Undo, lock state and Cancel. Closed shapes authored in a new fillable mode use compound geometry and save into the same library. Avoid interpreting every near-closed drawn loop as deliberate fill.
- [ ] Add ellipse, star, polygon, organic and mixed templates; use parametric exact primitives where sensible and bounded polygon approximations where necessary. Consistent corner rounding and jitter seed behaviour; avoid “always obviously procedural” repeated lobes.
- [ ] Add optional object selection, “Lock this object”, per-object position/scale/rotation and colour assignment with stable IDs and recipe-embedded overrides. Do not ship a pretend drag affordance until Undo and accurate hit-testing are implemented. Editing individual instances must never mutate the reusable master.
- [ ] Search by name and tag; selection of multiple items for bulk export/delete if its UI is actually simpler. Library management must remain usable without a keyboard on Android.
- [ ] Full visual pass on both themes, all responsive breakpoints, source-bound screenshots, contrast/colour-vision preview interaction, reduced-motion, TalkBack, bitmap fidelity at very high DPI, user-approved randomness quality. Explicitly record open physical-device/visual approval rather than marking done from emulation alone.

**F acceptance:** A user can draw a closed star, save and reuse it across sessions; freely swap shapes and paths; placements serialize without drift; layouts are comprehensible and performant on phone and desktop.

## Cross-cutting must-pass matrix

| Scenario | Expected exact behaviour | Minimum evidence |
| --- | --- | --- |
| Existing pre-feature recipe | Same pixels, normalized values and locks | Deterministic Node and actual Chromium comparison against frozen baseline |
| Add library asset, save succeeds | Awaited committed storage and correct count | Browser reload and IDB inspection |
| Add library asset, write aborts | No persisted asset; explicit warning + export action | Fault-injected real IndexedDB test |
| Open second tab, rename asset in first | Second tab re-reads and displays new name; concurrent revisions conflict visibly | Multi-tab Chromium |
| Apply path while structure locked to Regions | Blocked application, unchanged recipe; asset remains available | Lock unit + UI browser |
| Delete source asset from library | Existing favourite/recipe and PNG still render identically | Clean-origin PNG restore and asset deletion |
| JSON/PNG exported with custom region | Same pixels after importing into empty browser storage | Headless and native browser extraction |
| Share URL too long | Clear alternate JSON/PNG action; no truncated geometry | Transport unit and actual UI |
| Import SVG containing script/external URL | No script execution or outgoing request; reject/parse safely | Browser network and test fixture |
| Scattered circles zero overlap | Each visible circle remains circular and separate | Numeric exact-circle collision + native PNG pixels |
| SVG donut shape | Hole remains transparent through textures/interiors | Browser pixel mask + full-resolution output |
| Invalid/oversized ZIP | No existing asset overwritten | Import snapshot before/after |
| 412x892 / 500x700 chooser | Visible, reachable, no focus trap, keyboard/tab/TalkBack operable | Browser geometry/action matrix, human physical QA pending |
| Offline PWA restart | Library available independent of network | Offline Chromium launch, IDB persistence |
| Rendering in worker vs main/Node | Identical or documented tolerance-matched pixels | Cross-runtime test same recipe |

## Scoped acceptance commands

- Node: **npm run check** and **npm test** must continue passing; implement small focused test files above using node:test (existing stack) rather than introducing a separate test runner.
- Browser: use the repository's actual Chromium acceptance conventions and existing .github/workflows/headless-render.yml, mobile-browser.yml, pages.yml and image import/gallery workflows. Add a dedicated workflow only if it captures a distinct release gate and doesn't duplicate every existing UI suite.
- Baselines: snapshot exact pre-feature seeded recipes including old image-imported custom paths, 70 Voronoi regions, nested circles, multiple materials, and interior elements. Differences from unrelated concurrent PRs must be qualified against their own parent SHA, not “main from several days ago.”
- For archive tests, deliberately use real Blob/File data and actual download/reimport. Do not call an in-memory parser unit test a proven Android storage workflow.
- Profile inside the production render pipeline for 7, 14 and 70 objects and 1/7 compound stamps at preview and final 19.8 MP; compare on same runner/commit with declared device emulation. Measure worst-case path vertex counts and no frame-freeze during modal interactions.
- After implementation, request human review of the generated Rainbow Orbits distributions and actual physical phone workflow. Never mark a gate passed without evidence.

## Decisions to resolve during Stage A, with defaults

1. **Canonical shape flatten tolerance:** proposed ≤0.5 logical pixel for ordinary import and budget upper bound of 4096 vertices per outline, 64 total contours; measure export visual fidelity and perf before freezing limits.
2. **Draft retention:** proposed 20 items/14 days; surface this to users, allow manual clear and promote, don't call drafts durable backups.
3. **Library capacity:** no arbitrary “60 favourite”-style geometry limit; cap bytes/contours per item plus storage quota and provide archive export. Paginate list to avoid loading every source blob.
4. **Circle size range units:** recommend size expressed as diameter percentage of 600px short side; document precise min/max mapping before final UI labels.
5. **Packing infeasibility:** prefer deterministic size reduction within user minimum or explicit “cannot fit” response; no silent reduction below minimum or invisible objects.
6. **SVG import complexity:** ship safe basic path/polygon/primitive subset plus explicit raster fallback, not “supports every SVG” without transforms, holes, strokes, filters and remote-reference tests.
7. **Optional original source retention:** off by default; geometry is sufficient for reuse, raw source contains potentially personal photos. If users opt in, original blobs remain local and are excluded from ordinary share links.
8. **Dependency packaging:** document licenses/versions and ensure all library operations work with network disabled, including installed PWA service-worker caching.

## Handoff / completion protocol

Each implementation PR must cite a subsection of this queue, list actual files touched, tests and SHA-specific results, describe whether it adds schema/data migration and archive compatibility, and preserve a rollback path. Update this queue only after observing real work; use [x] only for verified closures with links to PR/tests/screenshots. A documentary proposal does **not** close any checkbox.

