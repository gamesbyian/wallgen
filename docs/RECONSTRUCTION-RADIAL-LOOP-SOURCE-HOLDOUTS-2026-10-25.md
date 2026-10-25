# False concentric-ring classification: source-visible Hairpin/Loop rescue

**Issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557) • **Candidate correction:** [PR #721](https://github.com/gamesbyian/wallgen/pull/721) • **Independent discovery:** [22 original plus eight blinded authentic sources, GHA #40234332602](https://github.com/gamesbyian/wallgen/actions/runs/40234332602).

## Real cross-variant discovery, no inferred source truth

Four new Hairpin and four new Loop sources were generated with the **existing production renderer** at 480×1040, using **eight separate previously unseen seeds**, varied turn angles/radii, orientations, offsets, widths and Loop sweeps. Their source bytes had embedded recipe metadata removed while preserving the exact PNG IDAT payload. During reconstruction the source sidecar recipes were unavailable; only after selection did the evaluator read source settings as a diagnostic. Source-versus-fitted 96×208 current-painter PNGs were saved and directly visually reviewed.

Five real wallpapers visibly lost most ribbon width in the normal six-candidate chooser. The existing radial classifier interpreted the rounded U/spiral turn as concentric rings and supplied four radial/nested candidates plus redundant thin drawn outlines, **never offering the existing seven-hue source-visible editable compound**. The independently called same canonical adapter nevertheless reproduced visible pigment shapes with the same painter, with far smaller errors. The candidate kind is an *appearance hypothesis*, not recovered source procedural geometry or crossing order.

| New anonymous current-painter source | Normal best kind | Normal best error | Best separate genuine hue-shape research error* |
| --- | --- | ---: | ---: |
| #23 tight Hairpin | path | .250260515 | .01735237 |
| #24 wide Hairpin | hue-visible-shapes | .021691373 | .01993876 |
| #25 diagonal Hairpin | path | .228403190 | .02536784 |
| #26 offset Hairpin | hue-visible-shapes | .021905539 | .02161517 |
| #27 tight Loop | hue-visible-shapes | .024621159 | .02447760 |
| #28 wide Loop | path | .319897817 | .01773033 |
| #29 oblique Loop | path | .244576617 | .01236969 |
| #30 shifted Loop | path | .225978526 | .01506705 |

*The displayed separate best is the **best of five research-only contour extraction tolerances**, and is **not a legitimate predicted normal candidate score**. This study also proves that tolerances preferred by different sources vary dramatically: no single contour tolerance was qualified as a default. The full immutable evidence includes all raw stdout HUE_CONTOUR_PROBE records, actual PNGs and recipes in that GHA artifact. Values are rounded from source-backed measurements.

## Narrow proposed correction

In `src/image-reconstruction.js` make source-visible seven-hue compound proposals eligible for a `radial.kind === 'rings'` hypothesis, but keep ordinary rays, compact circles, real incomplete hue slots and unsafe/incomplete shape masks on their historical paths. All normal source-visible gates still apply: seven meaningful pigments, source-only hue masks already computed, 16 meaningful islands per hue plus overflow refusal, portable canonical ring validator, Apply-compatible lock projection and truthful inferred provenance. **Replace only a redundant drawn-outline trial** when six initial candidates are filled, keeping all four established radial/nested hypotheses for bona fide concentric art. No additional true painter calls or new classifier / scene / renderer.

**Pending final acceptance:** [PR #721 one-shot independent current-renderer gate](https://github.com/gamesbyian/wallgen/pull/721) must reproduce all eight new cases and all original 22, confirm no circle/radial/compound/Jewel regression, source and new actual-fit PNG optical inspection, and ≤6 initial plus ≤10 refinement paints. Until then this is a source-backed *proposal*, not a claimed merged solution.

## Remaining limits

A source-visible compound cannot recover unseen overlap order, hidden strand topology, original procedural seed, exact original palette/material, or off-canvas contours; no physical Pixel 6 Pro, TalkBack, IME or human creator acceptance was performed. Keep issue #557 open after any narrow merge. Typography Agent 2 and mobile final integration Agent 3 retain independent ownership.
