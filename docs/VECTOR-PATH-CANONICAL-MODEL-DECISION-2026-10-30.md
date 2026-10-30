# Decision study: canonical parametric Draw paths before four-node editing

**Node-mode semantic correction, MERGED PR #874 ([CI #41105722790](https://github.com/gamesbyian/wallgen/actions/runs/41105722790) PASS):** independent is now the default when a cubic has draggable controls; explicit `corner` actually collapses the adjacent stored cubic control points to the node, producing a sharp editable station. Pulling a handle out of Corner transitions it to Independent. Switching a collapsed Corner to Aligned/Mirrored uses the neighbouring Euclidean design-space chord to construct constrained tangents, without relying on normalized bounding-box proportions or screen pixels. This makes the four named modes geometrically meaningful rather than alternate labels for the same behaviour. Focused source tests required; the production sampled-path editor is still unchanged.


**Next implementation slice, MERGED PR #873, CI [#41104726410](https://github.com/gamesbyian/wallgen/actions/runs/41104726410) PASS:** `src/vector-path-edit-session.js` adds an immutable authoring transaction above true cubic commands. It keeps the original source path untouched until commit, re-evaluates every provisional node/handle/insert edit against the same source snapshot, cancels safely on pointer interruption or lock activation, and implements selection-stable, bounded Undo/redo (one history entry per actual committed action). This session is pure and is deliberately **not wired into the existing Draw sampled-path editor** before a coordinated schema cutover. Tests: `tests/vector-path-edit-session.test.js`. The goal is to avoid baking DOM/pointer details or legacy sampled-point indices into the future vector authoring core.


**Implementation checkpoint, 30 October 2026, MERGED:** [PR #872](https://github.com/gamesbyian/wallgen/pull/872) introduces the first pure *real line/cubic command graph*, with stable IDs, explicit closed-state/closing segment, vector-metric handle continuity, exact De Casteljau splitting, bounded adaptive compilation and an adapter to the existing world-coordinate ribbon/path sampling contract. This source work **does not yet change canonical saved recipes, live Draw point UI, MCP/AYA schemas or exports**. The interface and older sampled `customPath` remain active while the coordinated migration below is implemented. The near-term migration should replace, not retain indefinitely, the sampled geometry as the authoritative authored type. New core module: `src/vector-path-commands.js`; tests: `tests/vector-path-commands.test.js`. The first normalizer rejects malformed geometry rather than treating invalid curve input as an empty authored path. Source tree must not call this software-complete true Bézier authoring before editing/roundtrip/actual rendering are integrated.

30 October 2026 · issue [#867](https://github.com/gamesbyian/wallgen/issues/867) · **technical design / not an implemented schema migration**

**Closed-path seam acceptance, PR #875:** The exact command engine now supports inserting a node into an explicitly closing line or cubic segment (index equal to the ordinary segment count). De Casteljau splits preserve both halves of the authored cubic and original start ID, retaining explicit closure, source control coordinates and existing node IDs. The pure edit transaction admits that seam index and preserves single-step Undo/redo/cancel. This closes a geometry/editor dependency for complete loops before live recipe v3 cutover.

**Pre-release recipe migration gate, PR #876 (in validation):** `src/vector-path-legacy-upgrade.js` now offers an explicit, non-mutating, source-backed conversion from legacy sampled Draw geometry to exact normalized line commands. Dense paths retain their authored stations; sparse paths first bake **the actual existing softening output** into authored vector stations so normalizing a new recipe cannot subtly redraw the wallpaper. Closed paths only upgrade automatically when the endpoints are exactly coincident; near-coincident implicit closure is refused with a diagnostic because adding a new real closing chord would change the original image. Sparse paths with manual pinned nodes/corners are likewise refused until precise authoring-intent remapping is implemented. It checks prepared world-space vertex and length parity within a tight deterministic tolerance and refuses rather than silently approximating. This bridge deliberately does **not yet activate recipe v3** or duplicate live geometry; it is a candidate one-time migration mechanism for a coordinated cutover.

**Opt-in canonical v3 preview bridge, PR #877 (validation pending):** `src/model.js` can now accept a structurally validated `vectorPath` as the single authoritative Draw geometry for a **version 3 recipe**. This is an intentionally staged pre-release cutover: v2 sampled recipes continue to render, while v3 refuses simultaneous nonempty `customPath` and malformed command topology. `resolveScene` sends v3 cubics through the existing production stripe/ribbon path sampler, and text-follow layout uses the same source. JSON links and versioned PNG metadata preserve authored node IDs, cubic controls and explicit closure; locked geometry preserves the canonical source. AYA/agent recipe import can read v3 without pretending that every generic scalar setting can edit geometry. The old sampled Draw UI explicitly refuses to alter a v3 source until the true vector node canvas editor is integrated. **The v3 renderer preview is a capability, not completed editing migration**; avoid permanent dual geometry branches after the authoring cutover. Acceptance requires real Chromium rendering, source JSON/PNG/agent roundtrips, and no v2 regressions.

**Next actual node interaction prerequisite, PR #878:** `src/vector-node-hit.js` performs true source-backed node, cubic handle and segment picking in **CSS interaction space**, while returning canonical stable node IDs, sides and segment parameters. Direct authored nodes have priority over handles; only the selected node's true cubic handles are interactive; overlapping authored nodes can be cycled; closed-path handles and closing segments are first-class. The same pure hit model is intended for both phone pointer and keyboard selection. Viewport projection is injected by the UI and never persisted. This is a pure geometry/interaction boundary, not yet the final on-canvas v3 node tool. The remaining integration will connect this picking model to the merged source-stable `vector-path-edit-session`, accessible touch handles, Edit points panels, and one end-to-end JSON/PNG/Undo test.

**Real canvas editing integration, MERGED PR #879, real Chromium and cleaned-head CI passed:** `src/vector-draw-ui.js` now connects genuine authored line/cubic commands to the existing Draw launch button and canvas, using immutable vector edit sessions, the v3 source hit model, one-thumb axis lock, explicit node mode selection and safe Apply/Cancel. The compact two-row inspector collapses to a single visible control so path manipulation has the full phone canvas. Both v2 sampled editing and v3 true cubic editing share the existing canonical recipe/Undo ownership through app.js, while source revision checks prevent stale curves from overwriting imported/restored designs. Browser acceptance and remaining controls (advanced point deletion, curved reshaping, full tactile/device validation) are still tracked separately; do not claim completed authoring without actual pointer evidence.

## Source-backed findings

- `src/drawn-path.js` stores `customPath` as normalized coordinates on the 600×1300 design plane, capped at 96 stations by `normalizeDrawnPathWithIndexMap`. It removes near duplicates, rounds to five decimals, maps saved manual index constraints through resampling, and can keep off-frame coordinates from -2 to 3.
- `src/model.js` persists `customPath`, `drawnAnchors` and `drawnCorners` and resolves them through `prepareDrawnPath`. The prepared path is still an ordered polyline: `pointOnDrawnPath` interpolates along cumulative straight-segment arc lengths. Sparse paths (<20 stations) receive a `soften`/resample pass at rendering, while dense ones can retain their samples. The rendered appearance is therefore not trivially equivalent to SVG line commands over raw sparse coordinates.
- `src/path-point-editor.js` currently infers in/out handles from neighbouring polyline samples. It applies cubic *basis weights* to shift nearby sampled stations while preserving authored anchors; this is useful local sculpting, but it **does not persist genuine cubic control handles**. Current `drawnCorners` is a subset of sample indices, not a four-way node continuity type.
- `src/draw-path-ui.js` edits those sampled stations directly. `src/draw-apply-transaction.js` commits them through the ordinary normalized recipe/Undo/locks. `src/text-path-geometry.js` also follows these paths; other downstream consumers include model scene resolution, renderer/worker/headless, inverse reconstruction and import, agent API, JSON/PNG metadata, local library, source-preservation and keyboard interaction.

**Decision:** Do not label current inferred sampled tangents as Linearity/Figma-style independent/mirrored/asymmetric cubic handles. The missing capability is the authored **path representation**, not the number of toolbar buttons.

## Proposed pre-release canonical upgrade

An intentional, coordinated new recipe schema is justified if true curve editing remains a priority. Introduce one canonical `vectorPath` object for drawn path geometry, rather than appending permanent `customPath2` / `bezierControls` fields beside the existing source:

```json
{
  "vectorPath": {
    "space": "normalized-design",
    "start": {"id": "n0", "point": [0.1, 0.25]},
    "segments": [
      {"kind": "cubic", "to": {"id": "n1", "point": [0.5, 0.5]},
       "controlOut": [0.2, 0.25], "controlIn": [0.4, 0.5]},
      {"kind": "line", "to": {"id": "n2", "point": [0.9, 0.75]}}
    ],
    "closed": false,
    "nodeModes": {"n1": "aligned"}
  }
}
```

This is a **candidate format, not shipped recipe code**. Stable node IDs should survive insertion/deletion, tool re-entry, Undo and reconstructed/imported transformations. Explicit `closed` eliminates accidental closure based only on endpoint proximity. Each segment has a true authored geometry type, with `M/L/C`-equivalent operations and no hidden pixel units. `nodeModes` describes the user's editing constraint, while the actual control coordinates remain authoritative. `corner` and `independent` allow different tangents; `aligned` keeps their directions collinear; `mirrored` keeps both direction and lengths mirrored **in the 600×1300 Euclidean design metric**. A single-point/end-node has only its meaningful adjacent handle.

**Renderer boundary:** compile this one representation into the existing deterministic world-coordinate path sampling contract used by the ribbon, crossing, text-follow and geometry safety systems. Do not copy another scene graph or reimplement the renderer. The compiler must preserve endpoints, tangent directions, self intersections, multi-revolution loops, explicit off-canvas continuations and source topology. Use bounded adaptive flatness / curvature criteria in design units, deterministic arc-length sampling and a documented segment budget; no screen-zoom-based tessellation in a saved design. Validate normal offsets against genuine high curvature.

## Migration decision and risks

Since ROYGBIV is unreleased, current recipe fields are not privileged. An *atomic v3 migration* is preferable to years of dual semantics.

1. Stage a pure command model/normalizer/serializer, polyline-to-command conversion and deterministic compiled-point adapter, with tests **before** altering the UI.
2. Validate that a canonical raw 96-station path survives conversion to line commands without reordering or loss; investigate sparse paths separately because current rendering softens them. Preserve meaningful sampled artwork by one-time baked conversion or a mathematically equivalent compilation rule, not an everlasting `legacy` renderer fork.
3. Implement actual editable cubic nodes, continuity constraints and precise move/scale; make the Draw UI consume those authoritative commands. Preserve stable identity across add/delete and local one-step Undo.
4. In one coordinated migration, update `model.js`, `drawn-path.js`, `path-point-editor.js`, `draw-path-ui.js`, `draw-apply-transaction.js`, `text-path-geometry.js`, all scene/render/worker/headless/MCP consumers, import/export and PNG metadata, local saved designs and tests.
5. Provide one tested import upgrader for old v2/PNG recipes and an explicit diagnostic if an old source cannot be represented without unacceptable changes. Keep untouched imported **source bytes** and source provenance separate from editable rebuilt geometry. Do not silently infer unknown hidden pigments or reconstruct lost original vector controls.
6. Cut over to one canonical representation, remove redundant compatibility scaffolding after representative saved design migrations, and update the schema discovery/AYA recipe handbook together.

**Blocking acceptance:** current forward-render parity on source-confirmed line paths (including sparse, dense, loop, open/closed, off-frame, hairpin, imported, RTL-following text), selected cubic edits under camera pan/zoom, holes/crossings, finite bounds and malicious input; one gesture/one Undo; no change on focus/tap; canonical JSON and embedded PNG roundtrip; reference/worker/headless agreement; scale-dependent viewing invariance and a representative 3024×6552 export. Physical Pixel and human touch comfort remain separate.

## Other queued improvements

Keep V1's offset touch grip and axis-lock mode independent of this migration. The viewport interaction layer already maps from screen coordinates to normalized vector edits; it should adapt to node IDs and real controls, not be reimplemented. V3 selected object transforms and V4 scalar precision can progress on independent modules while the path model is designed.

## Reuse assessment

Study MIT Bezier.js for cubic evaluation, arc-length/nearest projection and splitting; Paper.js for curve continuity operations; Konva/Fabric/Moveable for UI transform handling. Introduce dependencies only after an isolated prototype demonstrates clear benefit over a small tested pure module. Penpot's MPL-2.0 and tldraw's distinct licensing make direct source reuse a separate approval/review task. Never promise exact cubic conversion of arbitrary sampled geometry: fitting and simplification need source-backed deviation metrics, not visual intuition.
