# Metric polygon inset solver

## Purpose and geometry contract

`src/polygon-inset.js` replaces the former centroid-interpolation algorithm for
the **Details → Placement → Contour** treatment in radial and regional scenes.

The requested inward offset at distance `d` is the boundary of the set

`{p inside the original polygon | distance(p, original boundary) >= d}`.

This is an inward **Euclidean offset**, including around concave corners. It is
not a global transform or vertex scaling operation. When narrow passages become
narrower than `2d`, the inset can split into two or more disconnected loops;
when the entire region becomes too thin it can disappear. Hole edges move
*outward* into remaining material as expected for an inward erosion.

## Algorithm

1. Sanitize vertices (duplicates, degenerate rings, nonfinite coordinates).
   Single closed rings and even-odd arrays of rings are accepted.
2. Evaluate point-in-polygon parity and the minimum squared distance to each
   original segment. The resulting signed-distance function is exact at any
   queried coordinate, including concavities and hole boundaries.
3. For each requested inset distance, mark candidate sampling cells in a
   capsule surrounding the original boundary. This avoids running a dense
   full-canvas field solve through a large region interior.
4. Sample that signed distance on a **canonical world-aligned grid**, with a
   spacing normally between 1.15 and 3.2 logical design pixels. The spacing
   depends only on the requested inset distance, not on bitmap output size or
   camera bounds. Optional fixed test resolution overrides are supported.
5. Use threshold-interpolated marching squares to extract contour segments.
   Ambiguous diagonal cells are resolved by evaluating their exact centre.
   Edge IDs stitch segments into closed loops or open contours at camera
   limits, without drawing artificial straight caps across the viewport.
6. Draw all extracted contours independently. The original region clip remains
   in effect, and later shapes still occlude earlier shapes correctly.

The resulting curves approximate exact Euclidean level sets to sampling
precision. This is numerical polygonization, not algebraically exact
straight-skeleton or circular-arc vector output. It gives correct underlying
metric geometry and topology at the chosen sampling scale.

## Distance controls and bounds

The existing fractional placement control is converted into an actual
logical-unit distance using the polygon's area/perimeter-derived characteristic
length (capped at 100 units to avoid oversized radial rays creating invisible
insets). Each layer uses an increasing offset distance.

A single polygon may extend thousands of logical units beyond the canvas,
especially for sunburst and spoke geometry. The solver evaluates only boundary
neighbourhoods intersecting the camera's logical `renderBounds` plus inset and
stroke overhang. The distance field is always evaluated against **the uncropped
source polygon**. A clipped screen edge is never treated as an actual polygon
edge. Re-rendering at preview or export resolution shares the same underlying
world-coordinate samples and does not scale a bitmap crop.

## Invariants and acceptance coverage

`tests/polygon-inset.test.js` covers constant metric distance on convex and
concave polygons, consistent winding, narrow-bridge separation, holes, vanishing
insets, degenerate inputs, camera clipping without artificial caps, stable
world-space inset samples and the existing radial/region shape families.

`tests/render.test.js` verifies the shared renderer actually paints contour
strokes in multiple geometry families. `tests/browser-smoke.mjs` checks visible
pixel differences using native Chromium rasterization for radial and regional
wallpapers, including a zoomed-out camera.

## Scope

This solver applies to **closed polygonal regions**. Path-group/ribbon interior
lines continue to use their parametric tangent/normal geometry and crossing
repainting because a self-crossing ribbon is not equivalent to one non-self-
intersecting polygon. Existing unrelated materials, palette slots, borders,
recipe normalization, history, nudging and PNG metadata are preserved.
