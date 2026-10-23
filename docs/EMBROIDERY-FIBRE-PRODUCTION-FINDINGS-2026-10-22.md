# Embroidery: opt-in filament and underlay production-image findings

**Actual first-party picture evidence (2026-10-22 Calgary / 2026-10-23 UTC):**
[temporary PR #529](https://github.com/gamesbyian/wallgen/pull/529),
[Chromium Actions #39897840250](https://github.com/gamesbyian/wallgen/actions/runs/39897840250),
[six-image artifact #12477850622](https://github.com/gamesbyian/wallgen/actions/runs/39897840250/artifacts/12477850622).
Temporary browser CI was intentionally removed **before merging**. The ordinary CI gate remains quick Node only.

The actual production renderer generated **six 600×1300 PNGs**, with matching complete sidecar `.recipe.json` and a gallery:
`00-ribbon-plain`, `01-ribbon-satin`, `12-ribbon-satin-fibre`,
`03-regions-plain`, `04-regions-tatami`, `13-region-tatami-fibre`.
All six files were downloaded, decoded and viewed, both at contact size and
with original-size ribbon/region crops. Each chunk passed independent PNG CRC32
verification. Every image contained **exactly one ROYGBIV Recipe iTXt envelope**,
with its embedded `recipe` object exactly equal to its corresponding sidecar.

## Observed in the actual images

- **Satin fibre:** the legacy Satin's high-contrast white/dark stripes overpaint
  inner red/orange/yellow sections, especially near the tight eye of the loop.
  New Satin Fibre retains far more saturated red and orange, while fine thread
  lines still follow the local transverse ribbon normal. Its directional
  micro-highlights and darker underlay remain subtle at whole-wallpaper scale.
- **Tatami fibre:** original Tatami has thick, brighter diagonal ridges through
  every coloured circle; the new style produces fine, less dominant directional
  yarn texture. At contact-gallery size the effect remains restrained and
  recognizable mainly by close inspection. Its regular angled lattice still
  reads as procedural thread, not full interwoven textile physics.
- The existing faint square field on the untouched black canvas is from the
  deliberately selected **linen-soft material**, and is already visible before
  any embroidery. It is not a clipping failure or bleed from fibre strokes.

| Comparison (same normalized source except stitch style) | Mean absolute RGB difference, 0–255 | Different pixels (any RGB channel) | Original-black pixels changed |
| --- | ---: | ---: | ---: |
| Ribbon, old Satin vs plain | 8.535 | 241,395 | 0 / 368,911 |
| Ribbon, new Satin Fibre vs plain | 3.394 | 220,885 | 0 / 368,911 |
| Regions, old Tatami vs plain | 4.855 | 197,560 | 0 / 365,292 |
| Regions, new Tatami Fibre vs plain | 2.412 | 183,711 | 0 / 365,292 |

The RGB measurements show **how much each treatment perturbs the original
colour**, not a universal photorealism metric. A reduced magnitude is consistent
with the observed colour preservation, but doesn't establish stitch quality by
itself. All six cases were created at seed `stitch-art-review-001`, with the
existing reviewer `node scripts/review-embroidery.mjs --focus-fibre`.
The script is opt-in; it never runs in ordinary CI.

## Implementation and limits

The two new persisted, opt-in style identifiers are `satin-fibre` and
`tatami-fibre`. Both share the original world-space stitch lattice and caller
clip (including compound holes), but add a narrow dark underlay, separate
subpixel-width dark/light filaments and alternating partial specular glints
scaled by thread relief and actual strand direction. Work per candidate stitch
is bounded by the pre-existing station/segment budgets. Historical `satin`,
`satin-soft`, `tatami`, `running` and `chain` branches and their normalizer
values are not modified. Focused Node checks verify transport, render
determinism, bounded strokes and crossing replay.

**Not proven:** physically calibrated yarn microgeometry, fibre occlusion,
screen/print fidelity, full native 3024×6552 Pixel rendering speed, accessibility
on a real phone, and physical touch or font-scale behavior. Nested Chain crowding
is a separate retained limitation. The optional art view satisfies the small
actual-PNG quality gate, not a certification of universal visual quality.
