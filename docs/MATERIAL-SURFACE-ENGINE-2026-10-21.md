# Material surface and displacement contract

The new world-space material engine lives in src/material-surface.js and is
used by src/renderer.js for both visible texture and stripe-edge relief.

## Behavior

- Only enabled texture layers covering stripes displace stripe contours.
  A texture with background-only coverage cannot modify a stripe edge.
  With no stripe material, **Contour distortion** (the existing `textureDisplacement` recipe setting) produces no deformation.
- Texture Strength controls the size of each layer's geometric effect,
  independently of other layers. A 10% material contributes one tenth of
  the same material at 100%, before the global displacement cap.
  Texture Scale and Rotation influence both painted marks and edge relief.
- The fields have continuous, interpolated two-dimensional noise at multiple
  scales with material-specific anisotropy. Fibres, stitches, spots, creases,
  cracks, grain and watercolor blooms respond to the same spatial field.
  Physical marks are drawn at seeded world locations, without repeating an
  image or canvas tile at a fixed interval.
- The surface stays fixed when preview, camera, wallpaper position, dimensions
  and export resolution change. Worker rendering includes overhang but must
  preserve the original visible crop. Stroke character must be chosen from
  persistent coordinates, not crop boundaries.
- Every seed and every texture layer generates its own marks. Saved recipes,
  link shares and PNG exports remain reproducible, so rendering the same
  recipe never secretly rerolls texture. Selecting the same material again
  with an unchanged seed intentionally preserves its original character.
- At 0%, the original contours remain crisp.
- Stripes cannot cross simply because displacement is high: total relief
  stays capped at the smaller of 28 logical units and 34% stripe width,
  multiplied by the global displacement setting.
- Material painting remains available on radial and region structures.
  Their region boundaries do not currently accept texture displacement;
  this is specifically a stripe-contour displacement feature.

## Renderer

The sampler and mark generator use recipe-derived seeds already available in
the resolved scene. No new recipe keys or migrations are required. Layer
strength is applied to both material opacity and contour relief, without
normalizing away the contribution in single-layer cases. Paint is generated
only for the current rendered world bounds. A stable logical-resolution
material surface is composited with the camera transform so DOM Canvas and
OffscreenCanvas don't choose independent vector antialiasing per crop.

## Acceptance

Automated requirements in tests/render.test.js cover all materials, no
repeated canvas patterns, unique seed variation, material-to-contour field
correspondence, per-layer strength, combination of layers, scale/rotation
effects and no-material behavior. CI also tests real Chromium worker/main
parity, foreground pixels, native PNG exports, phone smoke and recipe
reimport/export.

Outstanding aesthetic and hardware checks: visually inspect each finish at
small preview and native export sizes on both backgrounds; compare multiple
seeds, layering, rotation, 0/25/50/100% displacement, woven regularity and
background-only coverage. Evaluate high-density exports and interactive
performance on a physical Pixel 6 Pro. Automated green builds do not
constitute human approval of photo realism or on-device responsiveness.
