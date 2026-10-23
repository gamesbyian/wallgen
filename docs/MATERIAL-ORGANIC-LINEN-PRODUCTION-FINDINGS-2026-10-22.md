# Organic linen: actual production-material appearance and revision evidence

**Source-run acceptance, 22 October Calgary / 23 October UTC.**
[PR #535](https://github.com/gamesbyian/wallgen/pull/535) used the original production renderer at exactly **480×1040** and `material-study-rose` seed to compare four normalized, explicitly saved recipes. Two genuine Chromium runs were produced:
[initial art #39898862036](https://github.com/gamesbyian/wallgen/actions/runs/39898862036) exposed problematic straight, ruler-like glints; the strand painter was revised, then
[final reviewed art #39899096552](https://github.com/gamesbyian/wallgen/actions/runs/39899096552) exported and archived [four PNGs #12477828678](https://github.com/gamesbyian/wallgen/actions/runs/39899096552/artifacts/12477828678).

All four files in the **final** run were actually opened and examined at wallpaper size and enlarged detail crop, independently decoded as PNGs, had complete valid per-chunk CRCs and contained exactly **one `ROYGBIV Recipe` iTXt record** matching the adjacent full normalized recipe sidecar. The original `linen` and `linen-soft` PNG pixel arrays **matched byte-for-byte** between the two independent production runs despite the opt-in painter revision.

| Same seed / geometry, texture strength 72 / scale 43 | Real-image observation |
| --- | --- |
| `linen`, displacement 68 | Strong regular square weave and conspicuously sawtoothed rainbow borders, retaining the already-observed old look |
| `linen-soft`, displacement 68 | Old regular grid remains, sharply reduced edge teeth compared with historical linen |
| **`linen-organic`, displacement 68** | Warped, seeded thread stations and lower-opacity short glints replace ruler-straight luminous hairlines from the initial attempt. Weave still visibly orthogonal; softened but slightly irregular ribbon edges at extreme distortion |
| **`linen-organic`, displacement 20** | Same quieter woven fibres with notably smoother contours; useful when material should read as cloth rather than dominate stripe silhouettes |

The RGB change vs historical same-seed `linen` reference (channel mean absolute difference / fraction of pixels with any channel over 2) is: `linen-soft` **1.6698 / 3.41%**, `linen-organic` displacement 68 **5.8308 / 56.31%**, and `linen-organic` displacement 20 **6.5748 / 56.60%**. These numbers confirm a distinct and reproducible optical result, **not a score of textile realism**. Differences arise from painted material and contour changes; the d20 comparison also changes displacement.

## Implementation and preservation

The original `linen` and `linen-soft` material-height, painter, and contour branches remain untouched. A third, explicitly named `linen-organic` material is available in **each existing texture-layer picker** and recipe normalization, using the existing Strength, Scale, Coverage, Blend, Rotation and Displacement controls. Its deterministic seed-anchored relief alters nominal warp/weft spacing and strand crossing heights. Paint marks use low-frequency bends, variable strand thickness and sparse **bent** microglints rather than full-length straight highlights. A 5-point edge filter suppresses hard high-frequency contour teeth; local material relief remains visible. No runtime dependency and no permanent browser CI.

**Boundaries:** This is more natural **stylized handwoven character**, not a simulated photorealistic loom or fibre BRDF. A faint warp/weft grid is inevitable at phone/gallery scale, and high displacement still gives some uneven edges. These samples are not native 3024×6552 or real Pixel device benchmarks. More material revisions should require a concrete newly observed flaw, not generalized material-science speculation. The one-off Chromium CI step was removed before merge.
