# Source-visible soft pigments: truthful inverse-colour refusal

**Agent 1 #557, 26 October 2026 (Calgary).** Proposed in [PR #743](https://github.com/gamesbyian/wallgen/pull/743). This is a focused **colour-fidelity refusal**, not a recovered painter, new palette, or improved RGB source-fit score.

## Reproducible artwork

The independently Canvas2D-authored, metadata-free `soft-seven-stars` 480×1040 original (retained since merged #725) has seven visible distinct red, orange, yellow, green, blue, indigo and violet concave star polygons in HSL **23% saturation / 70% lightness** on near-black. Actual source and prior best PNGs were downloaded, viewed together, and directly inspected. The shared production strong-hue importer correctly refuses to claim a source hue region with chroma delta below its **55-channel** confidence threshold; it reports **zero** strong source hue masks for this image.

Before this PR, the normal ≤6 initial + ≤10 refinement renderer nevertheless selected one editable `shape` candidate at RGB error **0.06574489771869778**, painting **all seven different pastel stars red**. That is an incorrect colour assignment even if whole-frame score appears low. The present canonical colour-story spectrum's lowest saturation is **51%** (`muted`); the actual source needs **23%**, so trying to repaint the pastel colours with today's canonical palette is unsupported. Manual import of geometry, paths or visible silhouettes and deliberate author recolouring remain separate creative actions.

## Conservative source-only witness

`plainlyUnsupportedSoftPigments` is deliberately used only in `reconstructionCandidates`, and only when the **existing strong importer found no hues**. It does not relax/change the shared segmentation thresholds, alter any source bytes, create new colours/geometry, attach source pixels, or fabricate an original palette/seed. Its observable conditions:

- Input bounded to existing ≤650,000 analysis pixels. Four opaque corners must agree within 16 RGB values.
- Sample at most roughly 12,000 deterministic source pixel positions, with no temporary per-pixel masks.
- A qualifying pixel is foreground-separated (≥75 RGB-channel difference from source background) with genuinely chromatic yet soft hues: light channel 160..230, dark 110+, channel span 20..52, and a source hue within 14° of one of the seven semantic positions.
- At least six distinct source-colour groups must each have substantial individual support (at least 12 samples / 0.2% of sample area) and be spatially **localized** (≤35% canvas width, ≤20% canvas height). At least 3.5% of all samples must belong to the localized multi-group source evidence.
- Any incomplete, single-colour, ambiguous, diffuse, low-light, opaque-corner-inconsistent, transparent or confidently detected normal palette source follows the old route.

This signature is **not an alternative HSV importer**: it never emits masks, palette scores or source assignment to recipe slots. It is a narrow way to recognize when the existing canonical renderer *cannot truthfully reproduce* the observed source colours.

## Actual Chromium acceptance

[Opt-in 22-native + 16-independent source-artist browser #40368877755](https://github.com/gamesbyian/wallgen/actions/runs/40368877755) **SUCCESS**. It ran the same real app forward renderer inside ≤6+10 user painting bounds and preserved native current source PNGs. The expensive temporary PR trigger was **removed from the final PR**; all source/fit experiments remain manual-only.

Against the retrieved [#735 first-achromatic-fix genuine corpus #40255113802](https://github.com/gamesbyian/wallgen/actions/runs/40255113802), **141 of 142 comparable source/fit PNGs were byte-identical**, and the one differing fitted preview is the separately merged/#737 correction for red+orange polygon silhouettes that occurred **between** those baselines. All 22 native R0 best kinds/scores and their PNGs are unchanged. All four original external polygon/star/circle/opaque-overlap cases have exactly the same winner kinds/errors and source PNG bytes. All four current sparse originals (including newly integrated red+orange) and four gapped sources are compatible with existing independent truthfulness rules.

| Independent low-chroma input | Before current PR | After #743 |
| --- | --- | --- |
| Soft seven pastel stars | **`shape` .0657448977, 5 candidates**, falsely red | **0 candidates; best kind/error null**, original pixels intact |
| Seven dim-colour polygons | `path` .0456250589 (poor geometry) | Same as before, not fixed |
| Seven neutral-gray shapes | 0 candidates (merged #739) | Same |
| Isolated red+blue unsupported source | 0 candidates (merged #726) | Same |

The actual `soft-seven-stars.png` original retains **39,926 identical PNG bytes** in before/after corpus, and its previous fabricated-red fitted preview is deliberately not generated after refusal. This is *truthful non-reconstruction*, **not** a lower numeric source-fit error. Source-backed Node tests cover normal strong hues, gray pixels, partial three, one-colour pastel, multi-colour diffuse stripes, dark chromatic ink, unreliable background, transparent source, and input immutability; final-head quick CI evidence is recorded on the PR.

## Still unresolved

The app cannot yet truthfully fit the dark seven-colour polygon source either: current `dim-seven-polygons` source has seven actual dark pigments around RGB max 62, and its best renderer produces an inaccurate tiny coloured outline. A conservative future source-colour representability gate can use **existing seven measured meanRGB** instead of guessing dark palette controls. Hairpin/Loop black-space details, genuinely hidden overlap precedence, arbitrary gradients, owner-provided art and actual physical Pixel 6 Pro / Android IME / TalkBack / heap/thermal are not accepted by this browser proof.

Keep #557 open. Agent 2's typography #653, previously closed Agent 3 software integration #664 and normal 6+10 painter are untouched.
