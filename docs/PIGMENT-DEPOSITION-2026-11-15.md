# Procedural pigment deposition (2026-11-15)

The old Pigment roughness feature drew a few black/white scratches over filled
stripes. The new renderer uses a seeded, multiscale **paint-coverage field**.
Each painted object is rasterized into its own bounded transparent source-space
surface, the field changes the actual per-pixel alpha, and the resulting ink is
composited over whatever colours were painted previously. This allows genuine
underpainting or substrate reveal without erasing lower objects at overlaps.

## Controls

- **Pigment roughness** (legacy key `brushRoughness`, 0–100) remains the
  primary amount. At 0, the original full-opacity drawing path is retained.
- **Application style** (`pigmentStyle`): dry brush, chalk/pastel, printed ink,
  pigment wash or opaque paint. The style affects pigment loss, pores, longitudinal
  grain and boundary pooling rather than replacing artist-adjusted sliders.
- **Grain scale** (`pigmentGrainScale`): controls large and medium aggregate size.
- **Edge breakup** (`pigmentEdgeBreakup`): controls irregular boundary thinning
  and minute outside-edge feather deposits.
- **Stroke directionality** (`pigmentDirectionality`): increases the elongated
  character of the field; zero is relatively isotropic.

All settings are normalized and bounded for JSON/PNG/URL restoration, locking,
randomization and AYA agent handoff.

### Editor placement (2026-11-16)

Texture > **Pigment** is a separate named tool after **Surface**. Pigment owns the
five controls above, with their original live DOM inputs and saved recipe keys;
Surface retains contour distortion and embroidery. The Pigment tool has its own
scoped randomization, focus/search destination, and locks, without splitting
or cloning the recipe controls. On phones, each pigment range reserves a line
for its label, randomization die and lock, followed by a full-width slider.
The active Pigment card can scroll on unusually short viewports rather than
clipping its final slider; on the primary portrait sizes the Edit tray expands
only while Pigment is selected.

## Rendering contract

- The field is computed from object identity, recipe seed, and original artwork
  coordinates. Neither the number of objects painted before it nor their bounds
  alters the sampled values. Overpass replays reuse the original object identity.
- Per-object RGBA compositing prevents pigment gaps in a top stripe from cutting
  holes through already-painted lower stripes. The same machinery supports
  Voronoi/scattered/radial region fills and the compound-hole fill rule.
- Material response samples only enabled texture layers that touch **stripes**;
  a background-only material cannot silently change pigment.
- Woven-path construction keeps its geometric thread treatment rather than
  introducing an overlaid pigment deposit. Patterned/dotted paths never receive
  an outside halo along an imaginary continuous ribbon.
- The scratch surface is reused within a render and released when complete.
  Long diagonal/offscreen objects are clipped to the inverse-transformed
  visible canvas plus glow/edge bleed. Large visible objects reduce sampling
  density before exhausting the scratch budget; only pathological dimensions
  fall back to their original opaque fill instead of allocating unbounded
  pixel buffers.
- Existing recipes with 0 roughness remain on the original renderer path and
  need no migration. Previously saved nonzero roughness intentionally receives
  the upgraded appearance.

## Current limits and acceptance

The grain field is sampled on a source-anchored, viewport-aware lattice:
small previews use a quantized density from 0.5 to 2 samples per logical
artwork unit, while native exports retain up to two samples per unit.
Substrate relief is bilinearly interpolated from a coarser material lattice
(roughly one material sample per three logical units) to avoid expensive
per-pixel material lookups. On tight hairpins and loops, longitudinal grain
follows the local design coordinate frame rather than an exact reconstructed
arc-length/tangent field. Fine micron-level detail is still supplied by the
independent material painter. Native export performance at the maximum camera
overscan and on low-memory phones remains a separate physical-device acceptance
requirement.

`node --test tests/pigment-deposition.test.js` checks scalar deposition,
presets, material response and portable recipes. The optional actual-Chromium
`tests/pigment-browser-acceptance.mjs` checks RGB coverage loss on real paths
and filled regions, repeatability, distinct presets and material interaction.
