# Integrated R0 topology acceptance, 23 October 2026

**Status: measured actual-current ROYGBIV artwork.** One-off branch-only [Actions run 39928088177](https://github.com/gamesbyian/wallgen/actions/runs/39928088177), with [five source/candidate pairs and numeric report](https://github.com/gamesbyian/wallgen/actions/runs/39928088177/artifacts/12489604786). Genuine 480×1040 production source PNGs, metadata-free pixel-identical twins and separately retained known recipes. Candidate inference was blind to true source parameters; the existing `drawWallpaper` renderer scored up to six standard editable candidates, plus bounded fitting probes. This is a reproducible narrow acceptance run, not physical-device or human artistic approval.

## Five-image cross-branch integration regression

| Actual image | Best error after reconciling #581 with #584 | Previously proven baseline | Result |
| --- | ---: | ---: | --- |
| 02 diagonal straight | **0.085834786639** | #581 0.085834786639 | Preserved coherent diagonal bands; source recipe floor 0.00879034 |
| 08 radial rays | **0.042984363216** | #584 0.042984363216 | Preserved radial wedge classifier; truth floor 0.02312563 |
| 09 radial rings | **0.100913815045** | #584 0.100913815045 | Preserved concentric-ring recognition; truth floor 0.04974449 |
| 10 nested regions | **0.011951278909** | #584 0.011951278909 | Preserved appearance; radial and nested procedural recipes may produce identical pixels; truth floor 0.00542437 |
| 11 scattered circles | **0.008328914498** | #581/#584 0.008328914498 | Preserved seven movable independent circles; truth floor 0.00449680 |

**Root cause and minimal remedy:** Independent #581 added real-data-proven diagonal recognition via per-hue connected-component principal axes in `image-path.js`; independently merged #584 introduced much stronger bounded radial/nested descriptors and replaced the initial candidate assembly, dropping #581's recognition from `image-reconstruction.js`. The integration restores #581's **existing** coherent five-hue covariance classifier *as a candidate family* inside #584's stronger engine. Radial and nested hypotheses remain unchanged; scattered circles are suppressed only on genuine coherent diagonal hue axes. No duplicate colour masks, RGB classifiers, image upload controls, renderer, recipe dialect or model are introduced.

**Correct evidence boundary:** The tests confirm identical best numerical scores across the five pinned source images, not a universal comparison, visual-perfect reconstruction, original-seed provenance, external-image support, owner touch interaction, memory profiling or physical Pixel approval. Existing R0 deficiencies in wave/hairpin/jagged width, textured/embroidered looks and external media remain #557. Keep standard `npm run check:quick`; the temporary Playwright/Chromium and artifact upload jobs were removed byte-for-byte before merging #589.
