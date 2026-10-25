# Genuine-source width-profile guard for cropped hue-stamp inference (25 October 2026)

**Issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557). This work builds on merged #679 (source-backed seven editable stamps), #682 (all-hue axis/centreline false-positive guard) and #690 (independently verified mirrored crop, including the previously missing symmetric ribbon-band analyzer). It is restricted to the existing `src/image-path.js` clipped-tail evidence predicate. The branch is based on **main after #690** so the rescued opposite-edge support remains present.

## Demonstrated failure and RED / GREEN test

The merged cropped-stamp detector correctly required four intact translated contours, progressive same-edge crop, coherent **mean** ribbon thickness/axis, and matching visible tail-column centrelines. It did **not** compare **local** width fluctuations along the visible tail. A counterexample can therefore contain seven genuinely distinct connected pigments, four identical 21px-wide source ribbons and three shorter pigments whose local widths alternate between **9 and 33 pixels**. Their `x` centrelines, hue order, overall mean widths, stripe axis angles, and observed crop progression remain consistent with the first four. But the visible source silhouettes of those three are observably different, so representing them as copies of the intact stamp fabricates known pixels.

The initial 220×350 adversarial fixture was **not qualified**: its short violet tail failed the existing elongated-axis check, meaning it did not demonstrate a missing rule. It was rejected rather than shipped. The revised **300×460** source has longer nonoverlapping pigment tails; tests first assert the existing `measuredRainbowRibbonBands` returns a genuine descriptor. Under the merged main `src/image-path.js`, the *exact same* new regression test **failed as expected** because `repeatShape` was falsely emitted. Under the proposed implementation the test passes and the same art with stable widths remains recognized. This was proven in the targeted, Node-only, actual GitHub Actions **RED-main / GREEN-proposal** [#40166296764](https://github.com/gamesbyian/wallgen/actions/runs/40166296764), not inferred merely from a passing new test. Earlier insufficient synthetic runs are kept visible as rejected experiments, never proof.

## Narrow source-only implementation

The existing cropped hue contour checker *already* builds a per-column count and centroid from each original same-pass connected-component mask. It now retains the pixel-count vector and, for **each of the same bounded X translations already tested**, jointly requires:
- source-tail centreline variance below the established resolution-scaled threshold `max(2,height*.0075)`, after free Y translation;
- the **RMS difference of per-column visible pixel count** from the intact reference under the same X translation to remain within `max(3,referenceMeanWidth*.35)`.
- at least **80% overlap of observed tail columns**, unchanged.

This is a meaningful source silhouette measurement; it does **not** infer missing pixels or mask/overlap order. It needs **no new flood fill, mask extraction, forward render, renderer, scene object or canonical key**. Seven fully congruent and arbitrary unsupported mixed-shape inputs follow their existing pathways. Locks, Undo, cancellation, provenance, PNG/JSON transport and the hard budget of **≤6 coarse + ≤10 refinement real renders** are unchanged.

## Genuine production source and baseline controls

One-shot [Chromium image comparison #40166073343](https://github.com/gamesbyian/wallgen/actions/runs/40166073343) regenerated authentic same-byte metadata-free R0 current-renderer sources and evaluated both exact current main and proposed inverse. **#04 ordinary Jagged** remained `0.058758032459779626` (procedural Jagged), while **#16 displaced Jagged** remained `0.05872150342508851` (seven editable imported stamps). No previous visual improvement was traded away.

The independent Agent 3 [actual production-Chromium mirrored source proof #40165889955](https://github.com/gamesbyian/wallgen/actions/runs/40165889955) established a separate current-renderer source and fitted `0.059420072115385116` via merged #690. Its genuine metadata-free PNG from artifact `agent3-683-source/16-mirrored.no-metadata.png` was also independently inspected at 277×600 for local pigment-width agreement. Approximate nearest-ROYGBIV hue connected masks gave a roughly **41.08px** intact-reference average per-column width, a **14.38px** tolerance, and best tail-centreline translated local-width RMS differences **5.61, 3.42 and 11.17px** for blue, indigo and violet respectively. Those are an **independent Python/PIL cross-check of genuine source pixels**, not JS importer instrumentation or a completed new browser evaluation of the mirrored branch.

Remaining proof before merge: the new branch's quick CI and any independent Chromium re-evaluation deemed needed for the mirror. A green Node suite or unchanged ordinary #16 alone cannot establish browser mirror acceptance. No actual physical Pixel performance, owner external artwork or human creative judgement is claimed.

**Open limitations:** heterogeneous pigment silhouettes, occlusion with unobserved source order, partially missing semantic colour slots, precise Hairpin/Loop crossings and Photo/material provenance. Leave #557 **OPEN**.
