# Genuine reconstructed Hairpin/Loop: native-resolution reference/worker proof (27 October 2026)

**Owner:** [reconstruction #557](https://github.com/gamesbyian/wallgen/issues/557). **Acceptance PR:** [#805](https://github.com/gamesbyian/wallgen/pull/805). This is a follow-through test of merged #804's source-visible contour AA change, not proof of original painter settings, human approval or Android handset behaviour.

## Actual end-to-end source → editable recipe → native PNG

Opt-in [Chromium Actions run #40441481288](https://github.com/gamesbyian/wallgen/actions/runs/40441481288) PASS, [source PNGs, actual inferred JSON recipes, reference/worker PNG pairs and machine report #12705929885](https://github.com/gamesbyian/wallgen/actions/runs/40441481288/artifacts/12705929885). The test invoked the **real, existing** `scripts/review-reconstruction.mjs` to generate original current-painter **480×1040** sources for 05 Hairpin and 06 Loop. The `scripts/evaluate-reconstruction-r0.mjs` inference used only metadata-free pixel sources, never the separate true recipes. The winners were both source-visible editable **seven independent colour-shape** scenes, including the new bounded, evidence-gated contour inset.

For each actual inferred winner, the test invoked the unchanged production `scripts/render-headless.mjs` twice, with `--backend reference` then `--backend worker`, specifying `--width 3024 --height 6552`. All four actual PNGs were decoded; `extractPngRecipe` restored each complete normalized canonical recipe and the seven scene objects retained all seven pigment slots. The originally imported metadata-free source SHA-256 bytes matched exactly before/after export. The decoded **3024×6552 × 4** pixel channels were compared byte for byte between reference and worker:

| Genuine inferred source | Fit error at 96×208 after #804 | Native export/reference | Worker | Encoded SHA-256 parity |
| --- | ---: | ---: | ---: | --- |
| 05 Hairpin | **0.027273637820513563** | 3024×6552, 19,813,248 pixels | **0 differing pixel channels** | Both `9eec208cd76b0071010a417f34a63927714540aa0c5daded35c0f18508faffaa` |
| 06 Loop | **0.03629169416163889** | 3024×6552, 19,813,248 pixels | **0 differing pixel channels** | Both `4a7397a5cb73efebb325f4c0b13abb868fa18b6259f5583dfb79b341040274ee` |

**39,626,496 output pixels / 158,505,984 individual RGBA channel comparisons** across both wallpapers, no mismatch. Each reference/worker PNG pair is also byte-identical including embedded metadata. The source/JSON/PNG link is source-preserving and fully portable with the current shape model, without new shader, font, Undo, recipe dialect, internet connection or server for render.

## What the actual PNGs look like

The generated sources and *actual native-resolution inferred PNGs* were retrieved, rescaled to a common display viewport and **opened side by side**, rather than treating successful files as visual approval. Hairpin retained the recognisable turn, seven coloured ribbons and internal black channels; Loop retained the concentric rings and overlap ribbons. However, this visual inspection also exposed **stepped pixel-cell edges** in parts of the 19.8MP vector silhouette and small jagged boundaries around Loop crossings. The source-visible paths are traced from finite-resolution thresholded hue masks at approximately 277×600 source-analysis pixels, then scaled through the canonical editable compound-ring geometry to native output. Subpixel source-to-fit AA registration (#804) improves the 96×208 score but does not itself give those discrete traced rings smoothly authored vector topology at arbitrary export zoom.

This matters for honest acceptance: **full-resolution technical parity is proven, but 4K-quality source-reconstruction edge smoothing and crossover aesthetics are NOT signed off.** Do not hide this with global source silhouette scaling (#803 was source-backed worse), arbitrary path smoothing around holes/branch pinch points, new renderer-only bitmap blur or guessed invisible layer orders. A future fix should compare actual native source/fit visuals and apply selectively to corners/continuations with validated topology, preserving intentional jagged source contours and clipped boundaries.

## What the evidence does NOT establish

No native physical Pixel 6 Pro execution, Android storage/memory/touch/IME/TalkBack, human creative judgement, genuine owner-submitted external source, independent recovered original procedural parameters, or authenticity of invisible occluded artwork is proven. This test runs **headless Chromium** on GitHub CI with the production code, even for its genuine source; optional Playwright and PNG decoder are **disposable research-only packages**.

Keep #557 OPEN, and preserve the normal **6 initial + 10 refinement real paint budget**. Full-resolution PNG export is not part of that inverse-fitting budget. The one-shot heavyweight PR workflow is **deleted before merge** while `scripts/reconstruction-contour-fullres-browser-proof.mjs` remains available for future manual acceptance.
