# ROYGBIV unified scene, mobile editor and rendering quality audit

Date: 2026-10-18. Scope: unified scene objects introduced in #46, interior
elements in #48, path continuation #49, true metric polygon insets in #50,
contour-style correctness in #51, and their mobile editor and rendering
integration. This audit was prompted by three mobile screenshots showing
clipped control cards, patterned-region defects, and delayed/stale previews.

## Findings and corrections

| Severity | Area | Finding | Action and acceptance |
| --- | --- | --- | --- |
| P0 | Procedural region rendering | Every colour cell painted wave/dot/loop fields over broad offscreen geometry. With 70 rays this multiplies millions of unused line vertices and causes apparent hangs. | Intersect field painting with inverse-rotated logical camera bounds, then restrict each pattern row to a conservative strip of the target polygon, allowing displacement and line-cap overhang. Chromium now stress-renders 70 radial or 70 partition cells with four layers. |
| P0 | Edit events | Native selects and checkboxes triggered duplicate update paths; deferring a committed change until animation-frame paint risked a Favourite/Save operation using the previous recipe. | Commit completed changes synchronously, once; coalesce only continuous range dragging. Browser regression covers pixel refresh and Favourite with editing active. |
| P1 | New Details cards | The layered editor's dynamically created labels bypassed the fixed mobile layout and stacked sliders vertically until the last control was cropped. | Dedicated last-in-cascade `detail-controls.css` keeps labels, selects and sliders aligned in compact rows at both normal and zoomed phone sizes. |
| P1 | Geometry controls | Four regional settings competed for one fixed-height mobile card. | Separate **Regions** (layout and complexity) from **Region detail** (irregularity and polygon sides). Every setting retains its unique schema ownership and scoped reroll controls. |
| P1 | Decorations and masks | A line's visual dash spacing ignored the actual band/pixel line width. Large round-capped strokes looked arbitrary. | Size dash/dot patterns from the effective canvas stroke thickness; retain the owner's exact shape clip. |
| P1 | Coordinate systems | Region **Local** and **Field** used the same unrotated world lattice, making the selection a visual no-op for blocks and facets. | Local pattern origin now follows the shape's centre; Field stays anchored in world coordinates. Rotated radial local fields use inverse-camera culling. |
| P1 | Ribbon placement | The path painter previously ignored `placement` entirely. | Implement path-relative **Local**, near-silhouette **Contour**, and a shared horizontally sampled **Field** clipped to the ribbon mask, with bounded parametric envelope. Distinct Chromium pixel results verify all modes. |
| P1 | Element lock UX | Locking the whole stack blocked changes during normalization but left the controls apparently editable. | Keep element selection and Unlock available while disabling all mutation inputs. |
| P2 | Excessive DOM work | Every scene change destroyed and recreated five Details tool cards, even when no element parameter changed. This loses input focus and creates extra layout work. | Rebuild only when the normalized elements or their stack lock actually change. Browser acceptance asserts control identity survives unrelated changes. |
| P2 | Discoverability | Colour-targeted elements looked mysteriously absent from unrelated wedges. | Show the active element's colour/object scope on the Elements card; preserve seven semantic palette roles. |
| P2 | Dormant settings | Straight decorative strokes exposed amplitude and phase controls that could not affect them. | Grey out irrelevant modulation controls, retaining frequency for field line spacing. |

## Architectural review

**Model:** The recipe holds instructions and normalized ordered elements, not
large generated polygons. `resolveScene()` contains path-group and closed
region objects with independent palette identity. Generated object IDs and
palette indices provide stable decoration targets. No schema migration or
new pigment slots were needed.

**Geometry:** Path ribbons continue to use the tangent/normal sampler and
intersection repaint algorithm; closed regions use polygon vertices and their
mask. Inset contours use signed Euclidean distance on an invariant logical
grid. The regular path geometry sampler and protected drawn-path continuation
are not replaced. Polygon partitions and their colour assignment remain
deterministic from seed.

**Ink compositing:** Decorations are painted into transparent ink before
materials; shapes and strokes respect clipping, with later overlapping regions
occluding earlier layers. The optional shared field repeats within all seven
colours without creating new pigment identities. Outline and divider passes
remain separate from interior ink.

**Camera and exports:** View zoom and nudge preserve a single logical
coordinate frame; drawing is not simulated by stretching a previously clipped
preview bitmap. The nudge cache holds the ink and background separately.
Canvas-wide lighting and silhouette shadow are deliberately excluded from
the ink geometry cache key because they are composited afterward; geometry,
material, zoom and interior elements remain in that key. Headless export uses
the same production renderer and recipe metadata.

**Editor:** Category and tool schemas provide a unique owner for each scalar
setting. Ordered element collections live in the Details editor instead of
inventing scalar fields for every layer. The new CSS is deliberately placed
after legacy editor sheets to isolate the necessary overrides. Seven top tabs
stay one row, tool tabs scroll only horizontally, and the active card should
not require vertical scroll.

## Acceptance evidence

- `npm run check`: schema, model, inset, contour, path and render tests.
- `tests/browser-smoke.mjs`: 412×915 phone and 615×1365 zoomed browser
  editor geometry; all reachable fields inside their cards; changing geometry
  updates actual pixels; locks and colour scope; selection controls persist
  across unrelated edits; all three path placement modes produce distinct
  raster output.
- Native Chromium stress case: 70 radial rays and 70 block regions with
  four independently configured local/field decoration layers. Before
  row/camera culling: approximately 1,218 ms and 704 ms; with camera culling:
  151 ms and 55 ms. Further polygon-strip culling: approximately 119 ms and
  49 ms at 240×520 on GitHub's CI runner. These are comparative engineering
  measurements, not promised phone frame rates.
- Headless rendering workflow: bundled path/region/radial examples, severe
  path-crossing fixtures, off-canvas continuation, inset cases, PNG dimensions,
  and restorable embedded metadata.

## Boundaries and follow-up risks

The application still uses the browser's synchronous Canvas2D renderer. On
slower devices and maximal 8-layer, 70-object designs, an occasional expensive
rebuild may still occupy a main-thread frame. A future worker/OffscreenCanvas
rendering pipeline could provide smoother continuous previews, but it should
be independently designed and feature-detected with robust Safari/iOS fallbacks
rather than bolted on without profiling.

Metric polygon insets are based on analytically evaluated signed distance but
marching-squares approximation at logical sample pitch, not symbolic vector
offsets. Tiny sub-grid features have bounded precision. Contour styles on
closed regions use a canonical perimeter to stabilize phase; branch repair
on ribbon loops uses the original path station.

This document records checked classes of behaviour, not a claim that every
possible recipe/viewport combination is mathematically proven. Visual QA on
real touch devices remains useful for extreme patterns and unusually small
screens.
