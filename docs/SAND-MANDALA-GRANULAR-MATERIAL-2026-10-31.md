# Granular materials and sand-mandala surface plan

**Status:** first material slice merged as [#912](https://github.com/gamesbyian/wallgen/pull/912), commit `ea434590`, 31 October 2026. Exact-head quick CI [#41238785115](https://github.com/gamesbyian/wallgen/actions/runs/41238785115) passed. Contour deposition and ornate patterns remain planned in [#913](https://github.com/gamesbyian/wallgen/issues/913). **Date:** 31 October 2026.

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

## Next phases (not yet delivered)

**Phase S2: path-/region-aware deposition.** Add an optional per-role sand treatment or granular style object using the same `surfaceTreatments` ownership model as embroidery, after evaluating a safe discriminated union rather than shoehorning a new style into embroidery-only fields. Evaluate a signed distance or exact offset from each vector boundary; avoid a global raster distance texture that can invert holes or smear narrow necks. Use tangent/normal frames from `samplePath` for ribbons and `polygon-inset` for compound rings. A thin rim has subtle material height and contact shadows, without bleeding into transparent gaps, and remains correct at self-crossings.

**Phase S3: decorative deposition.** Deterministic contour echoes, beaded outlines, concentric fillings, dotted rows and optional bounded controlled spill. Parameterize width/gap/phase in authored-world units and reuse the accepted nesting/topology engine. Allow one material treatment per semantic object or palette target without writing redundant geometry per grain.

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
- [ ] Raised contour rims and true path-aware ornamentation (S2/S3)

### Genuine Chromium acceptance note, 31 October 2026

Production `render-headless.mjs` generated 600×1300 sand and plain controls, 3024×6552 full-resolution sand art, and a 600×1300 sand regional artwork via the actual worker backend. Automated PNG dimensions, embedded canonical recipe, and genuine changed pixels passed. Visual examination of the artifacts found an overly regular glossy-bead pattern in the early iteration; the final iteration replaces those visible bead circles with stratified microflecks. The full-sized crop now reads more like speckled mineral/pigment than plastic beads, though it is still plainly a stylized texture: the fill is relatively flat and the edge relief/contour alignment awaits S2. **No device performance, raised-edge realism, exact native phone, or complex source-hole acceptance is claimed.**
