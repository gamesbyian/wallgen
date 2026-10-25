# Hairpin/Loop inverse fitting: production source optical follow-up (24 October 2026)

**Scope:** Issue [#557](https://github.com/gamesbyian/wallgen/issues/557), focused [PR #675](https://github.com/gamesbyian/wallgen/pull/675). No scene/schema/renderer or typography/mobile modification.

## What was reproduced and directly viewed

The canonical current-renderer 480×1040 source PNGs from opt-in [R0 production run #40140340944](https://github.com/gamesbyian/wallgen/actions/runs/40140340944), already stripped of metadata without changing IDAT, were independently loaded at the fixed 96×208 inference frame. The same `drawWallpaper` and normalized current recipe pipeline reproduced **exactly** the previously measured control scores using a local Skia Canvas2D surface, rather than a hand-implemented renderer or invented image. A source/old-fit/new-fit image plate was opened and inspected directly; visual improvements are described below, and a creator/physical-Pixel acceptance is NOT claimed.

The first major issue is genuine Hairpin #05: the ten-render fitter probed `hairpinAngle` after radius but **before** correcting source-visible group separation and the overall X/Y position. The angle 145° temporarily scored worse at the incorrect placement and was rejected; a shallower departing leg remained in the best result even though the later aligned U supported the steeper exit. Reordering the **same** parameter pairs to radius → spread → position X → position Y → angle, with exactly ten unchanged `drawWallpaper` refinements, lets the correct shape win. Hairpin best error **0.10786670437405782 → 0.08447790975364527**, a **21.68% decrease**, and the selected current canonical controls become `turnRadius:35, spread:32, positionX:7, positionY:7, hairpinAngle:145` rather than 120. The direct image review shows the returning leg closer to the source steepness, although the source's separately black-gapped coloured ribbons remain overly blended.

For genuine Loop #06, the existing ±10 radius test overshoots a visibly smaller best ring. At the selected X placement, the source-fitted neighbouring radius is 62 rather than 66. The same painter/metric finds **0.053834959464556284 → 0.04977316647813097**, a **7.55% decrease**, with `loopRadius:62` instead of 66. The central ring and colour spacing look modestly closer on the inspected source/fit images, while local crossing and separate stripe widths still differ.

## Independent present-era render variants and a caught regression

Six additional renderer-authored cases were created from the current canonical sources, with truth kept out of the inverse fitter. These are source/painter output tests, **not** third-party art or proof of owner acceptance. Each used the **same** six candidate cap and single ten-refinement painter budget. An initial universal narrow-radius Loop change **regressed a very thick-ribbon variant** by 0.03798 (0.06746 → 0.10544). Reallocating two width probes to extra radius samples was therefore *not* accepted universally.

Instead, the shared hue component extractor measures **pigment ink coverage from the already-rendered first Loop preview** and the source (no extra painter call). A conservative gate `0.90 ≤ source ink / candidate ink ≤ 1.06` tries both coarse and fine radii (`±10, ±6`) while preserving Spread correction. All other cases retain the original ±10 radius, Spread and StripeWidth refinements. Cases with missing hue coverage, large pigment mismatch or non-black source background use the proven baseline. No new inference-only model or original seed claim.

| Rendered source | Old error | New error | Disposition |
| --- | ---: | ---: | --- |
| #05 genuine Hairpin | .10786670 | **.08447791** | 21.7% better, steeper leg |
| Hairpin variant, wider U/shallow exit | .13761155 | .13761155 | Exact parity |
| Hairpin variant, tight U/steep exit | .21449741 | .21449741 | Exact parity, fallback Draw |
| #06 genuine Loop | .05383496 | **.04977317** | 7.5% better, inner rings |
| Loop variant, lower radius, smaller sweep | .23158367 | .23158367 | Exact parity, fallback Draw |
| Loop variant, larger radius/off-centre | .18633942 | .18633942 | Exact parity |
| Loop variant, 85% thick stripes | .06745852 | .06745852 | **Regression caught and prevented** by coverage gate |
| Loop variant, 25% thin stripes/off-centre | .13913958 | .13913958 | Exact parity, fallback Draw |
| Loop variant, thick, enlarged/off-centre | .38005250 | .38005250 | Exact parity, fallback Draw |

These numbers are scored by the **same canonical painter** at 96×208, not perceptual/structural quality claims. Current accepted Jagged #04 .05875803246 is unchanged by the curvature-specific code; displaced #16 clipped-band improvement #666 remains separate and untouched.

## Invariants and next evidence

- **No more painter invocations:** six initial hypotheses, ten or fewer real forward refinements for **one** selected candidate, same per-trial `respectSettingLocks` and cooperative cancellation.
- Existing source PNG bytes unchanged; canonical recipe JSON/export, Undo and inferred provenance unchanged.
- New synthetic tests check the formerly masked Hairpin angle after proper placement, deterministic sync/cooperative equivalence, no impossible locked Position previews, bounded calls, and Loop coarse-vs-fine and thickness fallback.
- Source/old/new artwork was actually opened. Genuine Hairpin pigment gaps, Loop crossings, displaced Jagged negative-space/cropped endpoints and arbitrary mixed object/occluded pigmentation remain unresolved. No Pixel 6 Pro touch, Android IME, TalkBack, human ratings or owner-supplied external artwork was performed.
- This opt-in evaluation used locally available Skia Canvas2D with the **exact shared JavaScript renderer** and has the same numeric scores as prior production-browser R0 controls. Ordinary GitHub CI evidence is separate. An unreviewed artifact or a green CI alone is not visual sign-off.

**Keep #557 open.** Follow up with direct curved source geometry or negative-space measurements, rather than broad speculative parameter/seed searches or the already rejected #648 Hairpin alternatives.
