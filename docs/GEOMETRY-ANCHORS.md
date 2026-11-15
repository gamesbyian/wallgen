# Authored geometry anchors

## Intent

Changing a dimension can move multiple generated elements. The artist chooses
what stays fixed **before** changing that dimension. Anchors operate in the
canonical 600 × 1300 design space or, for path endpoints, the existing world
station parameter. CSS pixels, zoom, camera pan and output resolution never
enter the stored references.

Selecting a new anchor captures its position from the current rendered
geometry in one ordinary recipe / Undo transaction. Selecting an anchor alone
does not shift the picture. Subsequent dimension changes preserve that captured
coordinate, except where a geometric bound makes doing so impossible.

## Settings and ownership

| Source control | Authoring modes | Portable keys | Implementation |
|---|---|---|---|
| Stripes → Spread | Centre (legacy), Red, Green, Violet | `spreadAnchor`, `spreadAnchorPosition` | `src/model.js`, `src/geometry-anchors.js` |
| Layout → Repeat spacing | Centre (legacy), First, Last | `repeatAnchor`, `repeatAnchorPosition` | Same shared geometry helper |
| Stripes → Stripe width | Centre (legacy), Red outer edge, Violet outer edge | `widthAnchor`, `widthAnchorBasis`, `widthAnchorOffset` | Same helper, after ribbon widths resolve |
| Path → Path length | Centre (legacy), Start, End, for independent inset / floating stripes | `pathLengthAnchor`, `pathLengthAnchorPoints` | `src/renderer.js:balanceStripeEnds` |
| Imported shape → Nested outlines | Outermost (legacy), Middle, Innermost | `nestedShapeContours.anchor`, `nestedShapeContours.anchorDistance` | `src/nested-shape-contours.js` |

The ordinary controls are attached beside their existing sliders by
`installGeometryAnchorControls`, after the existing editor moves each original
field to its canonical tool card. The imported-shape control remains owned by
`src/nested-shape-ui.js`. No duplicate slider, navigator or shadow recipe is
introduced.

All reference positions are optional. Old recipes containing no anchor keys
retain exactly their previous geometry, including seed-derived irregular gap
weights, offsets, stripe thickness, repeated groups and floating-end
randomization. Recipe normalization, links, PNG metadata, workers and Undo
carry any chosen anchor and its reference.

### Semantics

- **Red, Green, Violet** refer to *colours*, not ordinal indexes. The
  `reverseStripes` setting reverses slot assignments, so the geometry helper
  translates colour names back into the current slot before applying an anchor.
- **Rainbow Centre** is the midpoint between the two geometric outside stripe
  centre lines, not necessarily the Green stripe when gap irregularity is on.
- **Ribbon width** can hold the group's Red or Violet *outermost physical edge*.
  All seven bands translate as a family as their thickness changes, avoiding
  contradictory per-stripe edge constraints. Its effect is relative to the
  captured stripe-width percentage, so it does not compete with the separately
  anchored spread dimension.
- **Repeated group** anchors hold the selected group's translation offset
  while repeat spacing or group count changes. Centre is the family midpoint,
  including for even repeat counts.
- **Floating endpoint** anchors capture one world-station reference per visible
  stripe. Invisible stripes have a null reference. Shortening a floating stripe
  preserves its selected start, middle or end. If extending the stripe would
  exceed the original feasible in-canvas interval, that interval takes
  precedence and the requested endpoint position is clamped. A selected
  endpoint never authorizes painting outside the canvas.
- **Nested contours** are inward Euclidean offsets from the original silhouette,
  never scaled copies of the previous contour. Middle or Inner anchoring
  derives the first offset from the stored contour distance. If the necessary
  outer margin would be negative, it is clamped to the silhouette boundary and
  the UI explains that the anchor cannot remain fixed. Auto-fit is disabled
  for fixed middle / inner targets, since the operation may need to move the
  very contour the artist has pinned.

### Limitations and follow-up

`pathLength` currently affects *floating*, nondrawn stripes. Drawn/vector
paths use separately authored endpoints and are intentionally excluded from the
floating-length selector. Supporting Start/End anchoring for manually edited
path nodes requires an endpoint-specific interaction model rather than
repurposing the floating cropping algorithm.

A change to the underlying geometry, seed, colour order or camera framing can
still alter the finished composition. These anchors specify the dependency of
a dimensional adjustment, not a global freeze of rendered pixels.

## Regression coverage

`tests/geometry-anchors.test.js` covers choice-without-jump, irregular gaps,
reverse colour order, group counts, thickness edges, floating endpoints and
portable round-trips.

`tests/nested-contour-anchors.test.js` covers true nested distances, physical
constraints, large outer margins, normalization and portable round-trips.

Review both near-boundary examples and touch presentation before release,
particularly end cap cropping and narrow imported silhouettes.
