# Genuine current-renderer nonclassic palette reconstruction (23 October 2026)

**Scope:** Agent 1 issue #557, source-measured current colour-story proposal in PR #645. The established six coarse + ten refinement actual painter-trial limit and canonical scene, locks, Undo and metadata contracts are unchanged.

## Reproduced issue and focused engineering change

Previously all metadata-free images entered reconstruction with `palette:'classic'` regardless of source pigments, so even a perfectly represented nonclassic colour story could not survive candidate production. The existing `extractImageColourRegions` hue-component walk now also records **measured mean RGB** per component. `measuredCanonicalPalette` checks the seven current semantic hue slots against existing `COLOR_STORIES` definitions. It selects a nonclassic starting appearance only when all seven components are credible and one current story is substantially better than classic and the next-best story. Ambiguous/missing hues retain classic, with no new renderer or classifier, and a palette lock wins. Candidate text explicitly states that source palette identity, materials and processing remain **unknown**.

## Genuine current-painter proof

[Temporary optical workflow run #40046796971](https://github.com/gamesbyian/wallgen/actions/runs/40046796971) used existing `scripts/review-reconstruction.mjs --only` to produce four actual **480×1040** current-renderer PNGs and byte-identical-IDAT metadata-free source copies, storing source truth in separate JSON files. The existing browser R0 evaluator ranked at most six candidates and fitted one eligible choice with at most ten real `drawWallpaper` trials. Its produced source/fitted **96×208** PNG pairs were downloaded and arranged into a comparison atlas, then **visually inspected** by Agent 1 on 23 October. This is authentic image inspection, not merely Node metric proof.

| Source artwork | Selected editable family | Best real-painter error | Same original truth re-rendered at evaluation size | Viewed image assessment |
| --- | --- | ---: | ---: | --- |
| 01 classic vertical straight | seven existing portable shape stamps | 0.02888513779 | 0.01670751634 | Seven vibrant classic stripes retained; minor offset/thickness difference |
| 11 classic scattered circles | seven ordinary colour-region circles | 0.00832891450 | 0.00449680273 | Seven separate circles retained, small boundary/size variations |
| **19 Jewel vertical** | native procedural Straight | **0.02528594771** | 0.01160130719 | Distinct **darker Jewel pigments** reproduced on thin vertical bands; narrow spacing and framing reasonably matched |
| **20 Pastel circles** | seven ordinary colour-region circles | **0.01061011344** | 0.00503393665 | Distinct **light Pastel pigments** and seven circle placements recovered; subtle size/position and edge differences |

The truth-render column is a scale/presentation comparison floor, **not** proof of recovering original seed, colour-story identity, physical knobs or paint order. The two new source recipes were authored specifically for this engineering evaluation and withheld from inference. Existing classics remain accurate under this particular optical control. Source-vs-fit image review is **not** external art/human/Pixel acceptance.

Unit tests exercise four distinct current stories in flat pixel source, source-lock preservation, ambiguity refusal, no extra candidate calls, deterministic recipe transport. Genuine images cover Jewel and Pastel only; current-photo/material mixtures, owner-provided independent artwork, other palettes and arbitrary user-authored hues remain unverified. Palette assignment is an **appearance-derived hypothesis**, never a source-origin assertion.

**Disposition:** keep this narrow shared-stage recognizer only after final `npm run check:quick` is green and temporary Chromium workflow removed. #557 remains open for displaced Jagged #16, Hairpin, mixed occlusion, compound/material ambiguity and owner-dependent external/mobile acceptance.
