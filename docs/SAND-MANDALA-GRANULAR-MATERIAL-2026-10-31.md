# Granular materials and sand-mandala surface plan

**Status:** fine sand S1 merged in [#912](https://github.com/gamesbyian/wallgen/pull/912) (`ea434590`); inward boundary relief S2 merged in [#916](https://github.com/gamesbyian/wallgen/pull/916) (`c560c874`); optional Beaded sand filigree S3 starter merged in [#918](https://github.com/gamesbyian/wallgen/pull/918) (`01f7d78b`). Final exact-head required [quick CI #41244651155](https://github.com/gamesbyian/wallgen/actions/runs/41244651155) PASS. Advanced ornaments, physical materials and device profiling remain open in [#913](https://github.com/gamesbyian/wallgen/issues/913). **Date:** 31 October 2026.

## User intention

Make every existing ROYGBIV ribbon, stripe segment, circle, compound imported silhouette, nested contour and coloured region look as though it has been carefully assembled from fine dyed mineral sand. Preserve exact authored vector geometry, holes, islands, strokes, colour slots, over/under painting, editable state, camera framing and exported recipes. At wallpaper scale, the colour bands must still read cleanly; when enlarged, tiny coloured grains, contact shadows and glints should be visible. No mandatory iconography or religious symbolism.

The term *sand mandala* here refers to material and deposition craftsmanship, not automatic generation of traditional religious compositions.

## Existing infrastructure and decision

- `src/model.js` normalizes the three independent material identities, coverage, blend, strength, scale, rotation, locks, seeds and recipe transport.
- `src/material-surface.js` is the shared world-coordinate material painter and sampled contour height; `src/renderer.js` already applies each layer once, masking the resulting pixels against the exact existing vector ink for both ribbon and region compositions.
- `src/nested-shape-contours.js`, `src/polygon-inset.js`, `src/contour-decoration.js`, `src/path-geometry.js` and the existing embroidery treatment machinery are the owners for future curve-aware bands and contours.
- Implement grains as a new opt-in **material**, not a new region format, stripe generator, shadow compositor or separate raster bitmap saved into the recipe. Keep the original 7 colours, canvas camera and exported recipe unchanged.

## Delivered first slice: fine coloured sand

`material`, `material2` and `material3` accept `sand-mandala`; each of the three existing Material selectors exposes **Fine coloured sand · mandala**. Coverage selection is unchanged: use **Stripes only** to leave gaps and substrate pristine. Existing Scale sets grain gauge and packing pitch in the authored 600×1300 world; Strength controls the contribution to the existing material compositor. Seeds are derived from the usual immutable per-layer recipe seeds. No CSS-pixel sizing, random state per draw, image imports, externally sourced shader code or new top-level navigation.

`src/sand-material.js` addresses each grain by its world-space staggered-cell indices. A bounded, jittered close-packing approximation deposits multiple seeded, stratified matte mineral microflecks per authored-world lattice cell, with subtle shaded facets and rare small glints. Grain coordinates and radii never depend on visible crop, frame number, camera zoom, output size or draw order. A sampled low-amplitude sand height field is allowed to influence opt-in existing ribbon displacement, but suppressed enough to avoid destroying sharp vector boundaries. Masks remain exact for compound holes and separated islands.

This is a **stylized 2.5D deposition surface**. It does **not yet** implement measured real granular physics, accurate collision packing, mineral spectral reflection, raised contour ridges, object-relative pigment flow, ornate fillings, or optical validation of traditional art. Do not label it physically accurate or claim visual acceptance without actual rendered images and device evidence.

### Why not save individual particles?

A seven-colour vector shape remains one vector scene object. The granular field is deterministic rendering detail derived from the shape's shared material, so source paths can still move, bend, resize, weave, clip and survive normal Undo/export. No per-grain SVG objects or recipe arrays are created.

### Risks, constraints and exit gates

- **Performance:** each grain uses a small number of Canvas2D paths, so judge the active material under real Pixel 6 Pro interactive randomization as well as the standard 3024×6552 export. If material previews are too slow, use stable, coordinate-derived level-of-detail or batch primitives, rather than a new tile seam or changing grain identity when cropping. A deterministic cap on per-frame work matters more than arbitrary numeric complexity quotas.
- **Layering:** verify that legacy materials are pixel-identical when this option is off; a sand layer applied to background and stripes must preserve transparent stripe gaps, proper blend/strength/rotation order, and optional three-layer combinations.
- **Coverage:** test ribbons with loops/weaves and dots/dashes; regions, overlapping scattered shapes and imported compound silhouettes with holes; high displacement, crop overlap, panning and extreme zoom.
- **Optics:** check actual screenshots at 320×700 and 412×892, full-resolution export and close zoom. Distinguish film grain (noise), printed paper grain, and physically arranged sand; ensure coloured bands do not become speckled plastic or stars.
- **Tests:** pure deterministic grain location/seed/crop/count tests, canonical normalization/transport, material height bounds, all three select options. Full browser screenshot inspection and handset judgement remain explicitly unverified until exercised.

## Phase S2 implementation: opt-in inward contour relief (PR #916)

The existing sand material now has a geometry-aware, bounded design-unit edge treatment, owned by `src/sand-contour-relief.js` and the existing foreground painting stages in `src/renderer.js`. No new recipe property, visible control, output pixels stored in source, material renderer or object-shadow model is added.

- Only an active `sand-mandala` layer covering stripes/foreground adds relief. A background-only sand layer leaves coloured object outlines alone. Strength drives subtle dark contact and pale raised-edge tones; the inherited material scale drives the physical ridge width in authored-world units.
- Ribbon fills use the genuine original open edge rails (`traceEdge`) and the existing compound `stripeFillPath` clip. They never introduce transverse fake caps at the temporary boundaries of an over/under crossing. The crossing correction replays the same effect on its selected branch.
- Coloured circles and polygon/compound regions reuse the same filled source path, with the **original even-odd clip** for holes and detached islands. The rim is drawn *inward* on the filled side of every exposed ring; exterior gaps and interior cutouts are not colour-filled by the treatment.
- Seven thin imported nested contours instead receive a narrow centreline specular accent inside the original authored stroke footprint; levels that truly collapse remain absent. The system does not attempt to project a thick inward ridge onto a two-unit line.
- Woven/ornamental negative-space motifs do not acquire false filled-ribbon rims. Other existing materials are unchanged without an active sand layer.

**Limitations:** This is controlled 2.5D rim shading, not granular material transport/physics. It does not yet distribute grains by tangent or local curvature, calculate physical contact normals, spill into neighbouring fills, or synthesize beaded/ornate contour rows. Those remain S3. Source render cost/actual phone latency and high-DPI optical quality must be measured independently. Genuine [Chromium art and PNG acceptance #41243087745](https://github.com/gamesbyian/wallgen/actions/runs/41243087745) **PASS**: normal wave ribbon, loop, imported compound hole/island, seven nested contours and production 3024×6552 PNG. The black hole was checked as exact RGBA(0,0,0,255), and the detached island was verified as coloured ink. Source PNGs were inspected: modest interior shading is visible at regular colour edges, while rim details on two-unit nested lines remain deliberately slight. Physical Pixel timing, real optical grain packing, cross-browser quality and human artwork signoff are NOT proven.

## S3 first ornament: optional beaded sand filigree (merged PR #918)

The granular engine can now expose a **separate material identity**, `sand-beaded`, with the existing fine sand treatment plus sparse raised mineral beads following original path/region contours. This is intentionally separate from `sand-mandala`: selecting ordinary fine sand never auto-adds decorative dots.

- Both sand identities reuse the **same** grain sampler, height model and three-layer surface painter; `sand-beaded` only adds the opt-in decorative pass inside the existing vector ink clips. All user-visible Scale, Strength, Coverage, Blend and Rotation controls already exist.
- Source-ring beads use the existing `contourBoundaryFrame` canonical boundary ordering and true Euclidean arc-length stations, including compound holes and detached islands. Circle perimeter stations are anchored at zero angle; fully cropped regions cannot change the phase of a surviving source ring.
- Ribbon beads use integer stations measured from `stripe.coreExtent` (the original authored path's reference), with both original edge rails sampled through the existing shared path geometry. A short crossing replay selects the original global station indices, never restarts the bead pattern at its temporary clip.
- Thin imported nested contour lines get strictly smaller beads than their original stroke thickness, never a false expanded seven-line footprint. Open/cropped inset fragments remain undecorated instead of fabricating a seam or line of bead endcaps.
- Pure tests cover round-trip normalization, three-layer native selection, seed/curve station consistency, hole/island source-ring order, narrow stroke radius and source clip integrity. `scripts/sand-contour-browser-proof.mjs` produces identical fine/beaded input artwork at 600×1300 plus separate high-resolution and worker output from the original production renderer.

**Genuine acceptance, 31 October 2026:** the final optically adjusted bead renderer passed [Chromium #41244347062](https://github.com/gamesbyian/wallgen/actions/runs/41244347062), producing matched fine/beaded 600×1300 wave, self-crossing loop, compound cutout/island, nested outlines, full 3024×6552 beaded export and worker-region PNG. True negative-space RGBA was checked; the initial beads were too faint, and the subsequent dark setting read like punched holes. The final shading was examined and changed to brighter mineral flecks that remain visibly distinct at 600×1300. This qualifies **stylized decorative contours**, not real-world mineral optics or actual Pixel performance.\n\n**Boundaries:** decorative beads are stylized 2.5D shading; pigment is not physically simulated, grains do not collide or spill, curves use stable source stations rather than physical poured-powder trajectories, and attached colour remains authored ROYGBIV ink. Selection is currently whole-surface by layer coverage, not separately per ring/object. Further ornament types, user-directed contour grammar, close-packed real mineral rendering, hardware profiling and careful human/device optics are not yet delivered.

## Next phases (advanced S3 / S4 remain planned)

**Further Phase S3: decorative deposition.** Controlled contour echoes, concentric fillings, patterned rows and optional bounded controlled spill. Beaded outlines are now an opt-in first slice, pending exact optical acceptance. Parameterize width/gap/phase in authored-world units and reuse the accepted nesting/topology engine. Allow one material treatment per semantic object or palette target without writing redundant geometry per grain.

**Phase S4: artistic presets and profiling.** Fine powder, medium mineral sand, coarse crystalline sand and raised filigree as styles/controls of one engine. Tune actual art and phone performance before exposing additional sliders. For agent-driven design, expose normal canonical material values through the existing recipe schema rather than a second tool API. Only introduce shader acceleration after measured Canvas2D costs.

## Reuse and licence

The first slice contains new original code, borrowing only general public algorithms (integer hashing, staggered jitter and Canvas2D shading). No third-party implementation was copied. Existing ROYGBIV world-space material architecture is reused; external sand and point-sampling projects remain research references, subject to future licence review before adopting code.

## Acceptance ledger (as implemented)

- [x] Optional `sand-mandala` identity in three existing layer selectors and canonical recipe / lock / seed logic
- [x] Shaded granular detail draws through the existing preview, worker and native headless renderer call graph
- [x] Pure crop-stable, seed-stable sampled particle field with bounded logical pitch
- [x] Regression tests added to mandatory quick-test command
- [x] GitHub quick CI PASS on material implementation: [#41238544285](https://github.com/gamesbyian/wallgen/actions/runs/41238544285)
- [x] Actual Chromium PNG smoke PASS with source PNGs inspected at preview, full-res detail and region-worker sizes: [#41238544266](https://github.com/gamesbyian/wallgen/actions/runs/41238544266). The opaque glossy bead/polka-dot look was found and replaced by finer matte microflecks; optical acceptance is for this limited texture character only, not genuine physical sand realism.
- [ ] Physical Pixel 6 Pro randomization latency, visual fidelity and accessibility verification
- [x] Basic inward, vector-clipped contour shading S2 verified in production Chromium [#41243087745](https://github.com/gamesbyian/wallgen/actions/runs/41243087745)
- [ ] More physical sand deposition and true ornamental contour rows (S3)

### Genuine Chromium acceptance note, 31 October 2026

Production `render-headless.mjs` generated 600×1300 sand and plain controls, 3024×6552 full-resolution sand art, and a 600×1300 sand regional artwork via the actual worker backend. Automated PNG dimensions, embedded canonical recipe, and genuine changed pixels passed. Visual examination of the artifacts found an overly regular glossy-bead pattern in the early iteration; the final iteration replaces those visible bead circles with stratified microflecks. The full-sized crop now reads more like speckled mineral/pigment than plastic beads, though it is still plainly a stylized texture: the fill is relatively flat and the edge relief/contour alignment awaits S2. **No device performance, raised-edge realism, exact native phone, or complex source-hole acceptance is claimed.**
