# Very dark but source-visible pigments: accurate no-false-recipe boundary

**Agent 1, issue #557, 26 October 2026.** [Focused PR #746](https://github.com/gamesbyian/wallgen/pull/746), following merged [#743](https://github.com/gamesbyian/wallgen/pull/743). This is a precise **refusal of impossible present colour reproduction**, not a new palette or recovered source painter.

## Source and observable problem

The already retained independently Canvas2D-authored, metadata-free `dim-seven-polygons` original is a **480×1040 seven-pigment image** with strong HSL 88% saturation and **13% lightness** on black. Real source pixels in each polygon have max red/green/blue around **62**, min around **4**. The production hue importer correctly finds **seven** separate semantic pigment regions at **14.30084%** source coverage, so this is NOT a colour-detection problem. The present canonical colour stories' darkest palette, `jewel`, uses 39% lightness, so even the true source-hue shape candidate is too bright.

The normal six-candidate current forward renderer chose a very small, bright `path` outline with **RGB error 0.04562505891779456**, despite almost all seven dark pigment filled areas missing. I retrieved the independent original/source and chosen actual Chromium PNGs and opened them together. A low whole-frame difference is not evidence that this image's source colours were faithfully recovered.

## Conservative existing-evidence test

`plainlyUnsupportedDarkPigments(describeReconstructionImage(image))` uses **only the seven existing shared importer colour-region summaries**, with **no new pixel classifier, buffers, hue masks or forward paints**. It requires:

- Black background, **seven** compact source-verified foreground components/semantic hue slots (`sevenColourRegions`), and at least 8% source hue coverage.
- All seven measured pigment means contain finite RGBA-derived RGB values, each with maximum channel between **55 and 86**, and actual between-channel chroma at least 45.
- Every source hue slot is present in order; mixed light/dark, muted-but-bright, white background, ribbons/stripes, faint unclassified pigment and missing-colour cases must *not* satisfy the guard.

When those strict conditions hold, `reconstructionCandidates` returns no automatic recipe rather than painting inaccurate bright strokes; no score is invented and the source remains unchanged. Existing manual image-to-path/silhouette geometry import and subsequent deliberate recolouring remain possible.

## Real Chromium source/fit acceptance

[One-shot current canonical 22 native + 16 independently authored sources #40369949346](https://github.com/gamesbyian/wallgen/actions/runs/40369949346) **SUCCESS**. Compared against [the immediately prior source-backed #743 full optical corpus #40368877755](https://github.com/gamesbyian/wallgen/actions/runs/40368877755):

- **153 of 153 comparable original and best-fit PNGs are byte-for-byte identical.**
- Of **213 common archive files, 211 byte-identical**, with the only differences `external-low-chroma/evaluation.json` and generated `evaluation.html`.
- The dark source's original PNG is byte-identical; its prior false bright-outline `dim-seven-polygons.r0-best-preview.png` is **intentionally absent** on the new successful run.
- **Exactly one of 38** genuinely independently scored native/external cases has any change in candidate count, selected kind or RGB error: `dim-seven-polygons` goes from **`path`, .0456250589, 6 attempted candidates** to **zero candidates, null kind/error**. All 22 native-current cases have exactly the same selected kinds/errors; all four independent external polygon/star/circle/mixed occlusion, four sparse, four missing-middle, and three other low-chroma cases unchanged. Soft pastel sources remain correctly refused after #743; real normal Jewel-ish and bright palettes remain generated through unchanged candidate routes.
- Normal production max six initial and ten refinement painter calls, source-only provenance, cancellation, worker/reference/export, embedded recipe, per-hue shapes, locks and Undo remain unaltered. The temporary costly PR-triggered Chromium workflow was **removed from the final branch**, leaving manual-only archived evidence.

## Honest next step: creative *representation*, not another silent patch

After independent visible colour masks and source geometry are recovered, the remaining unsolved question is **how to represent genuinely lower saturation/lightness using the canonical editable scene**, without inventing an artist's source recipe. `src/model.js` currently derives each stripe colour from `paletteHsl` using one of eleven fixed `COLOR_STORIES`; the darkest story lightness is 39% and the least saturated is 51%. There is no canonical independent per-source/pigment RGB override in the current model, no matching creator-facing lightness/saturation controls, no proven worker/renderer/export/Undo/locks roundtrip for such a new control. Directly forcing red shapes on muted/near-black source images is not an acceptable replacement for that future engineering.

A genuine colour-control change should first define the **canonical** recipe/scene property and single palette renderer semantics, provide creator-facing opt-in control + locks/Undo/transport, and measure actual source-vs-rendered 19.8MP reference/worker pixel parity and physical-device performance. Neither #743 nor #746 does that. Retained Hairpin/Loop black-space detail, hidden overlap precedence, human source-art owner approval, physical Pixel 6 Pro and Android IME/TalkBack/heap/thermal remain **NOT TESTED / OPEN** under #557 and release ledger.
