# Auto-fit inner-rainbow readability: source-backed correction

**Date:** 27 October 2026 UTC. **Owner issue:** [#815](https://github.com/gamesbyian/wallgen/issues/815). **Depends on:** [native 3024×6552 source-art audit](NESTED-AUTOFIT-NATIVE-ART-2026-10-27.md). **Scope:** *explicit one-click Auto-fit only*. Rendering, current saved recipes, import geometry, camera, worker, export and randomization are unchanged until the creator chooses Auto-fit.

## Actual source/image witness

The default existing Auto-fit maximized gap subject to seven *nonempty* Euclidean contour levels. Native reference+worker production 3024×6552 image pairs, examined as actual full-art previews and native 1:1 crops, exposed a meaningful gap between **seven surviving geometric levels** and **seven substantial visible colour outlines**. An irregular long cloud had 112 high-chroma violet raster pixels to 1,756 red; a pointed Delta with a genuine hole had 93 to 3,202. Both were truthful geometric insets, but the innermost colour was severely diminished by medial-axis pinch and strong erosion.

A bounded opt-in study then rendered the same original canonical source vertices through **the real current reference painter** with their original fitted maximum gap, a moderately tighter 75%-gap candidate and a 65%-gap candidate. Each source remained byte-identical; all 7 colours remained genuinely painted. [Matched run #40582273328](https://github.com/gamesbyian/wallgen/actions/runs/40582273328) and [actual contact images, six-plus genuine PNGs and source JSON artifact #12770262181](https://github.com/gamesbyian/wallgen/actions/runs/40582273328/artifacts/12770262181) allow actual visual comparisons.

| Source | Maximum-gap Auto-fit, violet/red ink | Moderate (75%) | Tighter (65%) | Chosen behaviour |
| --- | ---: | ---: | ---: | --- |
| 52-point long cloud | 0.0638 (gap 7) | 0.4351 (gap 5) | **0.4499 (gap 4.5)** | balance, if an inner remnant is tiny |
| 88-point skinny ellipse | **0.4019 (gap 3)** | 0.6382 (gap 2) | 0.7255 (gap 1.5) | preserve existing gap 3: violet already readable |
| Delta with triangular hole | 0.0290 (gap 7.5) | 0.4213 (gap 5.5, 4 innermost components) | **0.7064 (gap 4.5, 2 normal components)** | balance the near-vanished violet |

The geometric ratio (total last-level contour arc length divided by total first-level arc length) strongly agreed with **actual painted violet/red pixel area** for each fixture, so the explicit fitter can make a conservative, source-backed decision without performing image rendering or storing an extra recipe field.

## Finite production rule

When the creator **explicitly** invokes Auto-fit, the existing true Euclidean fit is still computed first. If the requested count is seven, the now-verified gap is at least 3.5 design pixels, and the inner-to-outer Euclidean contour length ratio is below **10%**, try **one** further spacing candidate at 65% of the first result rounded down to half-pixel units, with a floor of **2 design pixels** for this optional visual enhancement. Adopt the proposal **only** if the exact current contour planner verifies all seven levels **and** the inner-length fraction is at least **25%** and strictly improves. Otherwise preserve the original Auto-fit result. The artist can Undo. Never silently edit shape vertices or render-time geometry; neither a tiny gap nor an unsubstantiated topological join is invented.

An already readable ellipse (or a creator who selects 1–6 lines) is not compressed by this rule. A saved recipe containing tiny violet fragments remains pixel-identical until the maker clicks Auto-fit again. Early-exit and full-planner variants share the exact result. The existing button and one Undo transaction remain the UI; the notice now distinguishes the choice when additional inner-colour readability was applied.

## Acceptance, caveats and reproduction

The [independent balanced native Chromium run #40583022739](https://github.com/gamesbyian/wallgen/actions/runs/40583022739) and [actual native source/reference-worker PNG/contact artifact #12769699554](https://github.com/gamesbyian/wallgen/actions/runs/40583022739/artifacts/12769699554) verified three **3024×6552** exact encoded worker/reference pairs, their 480×1040 preview pairs, unchanged source snapshots, embedded canonical recipe transport, seven truly painted hue slots, and all actual native 1:1 crops. The cloud now has one continuous component in every level; the Delta has two normal hole-bound contour components per level, rather than the previous collapsed and fragmented inner islands. Native art inspected: cleanly separated colours and rounded Delta apex, with no spurious isolated dots in tested crops. A newer CI pass after preserving old-recipe explicit re-fit verifies the same native source scenario.

Limits remain: three fixtures do not establish all-source aesthetic supremacy, forced seven continuous loops are mathematically impossible for sufficiently narrow parts, and no physical Pixel, TalkBack, human artistic preference, or privacy/remote acceptance has been fabricated. The 10% and 25% thresholds are **a bounded current-art heuristic**, not a universal psychophysical law. Different colour orders use geometric outer/inner lengths regardless of pigment names. A further optical backend/Boolean dependency is **not justified** by this evidence.

Manual proof remains opt-in: `node scripts/nested-inner-colour-balance-study.mjs` and `node scripts/nested-shape-native-autofit-proof.mjs`, with Playwright and pngjs test-only installed. Temporary heavy workflows are removed before integration. Ordinary quick source tests cover original/fitted parity, 7-level confirmation, cloud/Delta improved inner length, safe ellipse no-op, previously saved Auto-fit and unchanged canonical geometry.
