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

**Final genuine-source acceptance PASSED:** [PR #721 one-shot GHA #40235807070](https://github.com/gamesbyian/wallgen/actions/runs/40235807070) completed successful independent 22-original-plus-eight-blinded-current-renderer evaluation. All **8/8** unseen Hairpin/Loop sources selected `hue-visible-shapes` through the *ordinary six-candidate painter*, with **zero refinement paints for their selected winners**. Critically the five previously catastrophic cases improved **#23 .250260515→.017359049; #25 .228403190→.025775653; #28 .319897817→.017717760; #29 .244576617→.012786242; #30 .225978526→.015232607**. The three existing successfully ranked holdouts retained their prior selected error exactly (#24 .021691373, #26 .021905539, #27 .024621159).

All **22/22** original current-painter R0 sources passed: **21 selected error scores remained exactly identical**, including Hairpin #05 .030539353, Loop #06 .037259517, Jagged #16 .013308549 and Jewel #19 .015307629; **radial displaced rings #15 improved .061937924→.050102321 (19.11% decrease)** with source-visible seven-hue geometry. The real radiating rays, centred rings, nested regions, circles, repeated compound stamps and reversal controls retain their previous results. Downloaded baseline #716/#717 and PR #721 artifact ZIPs and independently compared all **22 metadata-free source PNGs byte-for-byte unchanged**, **21/21 original winning preview PNGs byte-for-byte unchanged** except intentional improvement #15, and all **8/8 independent held-out original/source/recipe/source-preview files byte-for-byte identical between before and after**. Original/old/new full 8-case contact atlas opened and visually reviewed: formerly thin paths now paint broad correctly located seven-hue loop/hairpin silhouettes. No hidden source recipe, original seed/order, external-owner art, physical Pixel or human creative acceptance is claimed. Production remains at **≤6 initial + ≤10 refinement paints**.

[Actual 22+8 optical artifact and gating](https://github.com/gamesbyian/wallgen/actions/runs/40235807070) • [Original blinded source/negative contour research](https://github.com/gamesbyian/wallgen/actions/runs/40234332602). The research-only global contour tolerance experiment [#719](https://github.com/gamesbyian/wallgen/pull/719) was **closed unmerged**: varied Hairpin/Loop sources prefer incompatible contour tolerances. Only the strongly reproduced candidate-routing fix and eight independent sources are qualified for integration.

## Remaining limits

A source-visible compound cannot recover unseen overlap order, hidden strand topology, original procedural seed, exact original palette/material, or off-canvas contours; no physical Pixel 6 Pro, TalkBack, IME or human creator acceptance was performed. Keep issue #557 open after any narrow merge. Typography Agent 2 and mobile final integration Agent 3 retain independent ownership.
