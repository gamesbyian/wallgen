# Camera zoom: geometry-preserving implementation audit

Updated 2026-10-18. PR #71 is integrated with the merged WebGL2 multilayer
research from PR #70 before acceptance.

## Contract

The zoom buttons change `recipe.viewZoom` **only**. A camera change maps
different logical world coordinates into the physical preview/export frame.
It must never regenerate the artwork: ribbon widths, edge relief, motifs,
woven threads, brush scratches, interior modulation and pixel colours at the
same world station remain invariant. Zoom-out is allowed to *reveal* extra
ink outside the original frame. It is not allowed to stretch a previously
clipped bitmap, hide newly revealed ink or change a saved line's shape.

`resolveScene()` produces stable scene objects. `drawWallpaper()` records
`scene.coreExtent` before expanding `scene.extent` for the camera. The
expanded domain controls **which stations are rendered**, while
`stripe.coreExtent` controls any procedural attribute defined in source
coordinates.

## Corrections

- `src/path-geometry.js`: `widthAt()` anchors relief and taper modulation
  to `coreExtent` for *all* geometries. This was previously done only for
  drawn paths, so zoom changed ribbons' width profiles.
- `src/renderer.js`: ribbon-local waves and loop decorations use the
  original extent for their phase even if the rendering station interval
  grows. Previously ordinary path geometry decorations shifted under zoom.
- Regular motif lattices are rooted at the original -coreExtent station,
  not -renderExtent. Newly revealed negative columns are seeded separately,
  so generating them doesn't advance the random-number sequence used for
  existing dots, stars, hatches, diamonds and dashes. Existing 100% source
  stations retain their earlier random variation.
- Woven thread crossings use original-source station indices, keeping
  parity and position fixed while allowing offscreen continuation.
- Brush wear keeps the original seeded scratch stations, and generates
  additional out-of-core scratches using independent deterministic streams.
  New scratches cannot displace the original ones.

## Integration and verification

- `tests/view-camera.test.js`: width-at-station and normalized-scene
  invariance at zoom 100% and 50% across straight, wave, arc, zigzag,
  loop and drawn geometries.
- `tests/browser-smoke.mjs`: compare sampled pixels at identical logical
  locations across two camera scales, excluding antialiased boundaries;
  exercise solid high-taper ribbons, motif dots, woven thread crossings,
  brush wear and path-local decoration. Check actual phone +/- buttons
  change only `viewZoom`, then round-trip the exact recipe and let the
  asynchronous worker settle both previews.
- Existing `tests/browser-smoke.mjs` worker/Canvas2D visual parity covers
  native and worker drawing, including a zoomed composition.
- Existing headless PNG smoke covers camera-continuation and embedded recipe
  restore. GPU shaders are research-only and independent of ribbon width
  profiles, source coordinates and UI camera changes.

The actual production renderer remains asynchronous worker Canvas2D with its
existing reference fallback. The WebGL2 field experiments merged in PR #70
do not affect or change the zooming system.

## Further considerations

Pattern variations are deterministic and anchored in scene coordinates, but
brush and motif effects can differ by an antialiased pixel at different render
resolutions. The visual regression therefore excludes pixel-edge samples and
applies a small channel tolerance; it does not treat GPU/Canvas antialiasing
as a change of the underlying artwork. Dense textured scenes should continue
to be covered by the existing export gallery.
