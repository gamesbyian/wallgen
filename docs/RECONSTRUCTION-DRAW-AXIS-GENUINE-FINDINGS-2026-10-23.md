# Draw winding reconstruction: genuine current-image review (23 Oct 2026)

**Decision:** positive, narrowly scoped image-to-recipe improvement. [PR #630](https://github.com/gamesbyian/wallgen/pull/630) replaces unconditional horizontal pixel-column averaging with **dominant-axis** scanning of the existing chromatic component, using the same median-range centre and bounded nine-station fairing. This affects the shared image-to-path importer and thus ordinary manual imports as well as R0 reconstruction, but creates no alternative scene or renderer.

## Evidence and objective result

[Real six-image renderer/import evaluation #40040643861](https://github.com/gamesbyian/wallgen/actions/runs/40040643861) produced actual current-renderer PNGs and metadata-free IDAT-identical evaluation copies. A separate [prior genuine control run #40039691336](https://github.com/gamesbyian/wallgen/actions/runs/40039691336) provides the baseline. I downloaded source, prior-fit and candidate-fit PNGs and **visually inspected them side by side**.

| Current-renderer source | Prior fit pixel error | New fit pixel error | Result |
| --- | ---: | ---: | --- |
| 07-drawn, winding S path | 0.045805151 | **0.044522707** | Same editable Draw family; major visible bend-continuity improvement |
| 03-wave | 0.041215356 | 0.041215356 | Winner unchanged |
| 04-jagged | 0.165655244 | 0.165655244 | Winner unchanged |
| 05-hairpin | 0.107866704 | 0.107866704 | Winner unchanged; alternate traced-path scores differ |
| 06-loop | 0.053834959 | 0.053834959 | Winner unchanged |
| 16-offset-jagged | 0.222146120 | 0.222146120 | Winner unchanged |

The Draw source bends right then left as it progresses downward; its X coordinate reverses while its Y remains monotonic. The previous X-station centreline connected unrelated intersections and produced nearly vertical/sudden angled segments. The new Y-station centreline follows the actual winding stroke, smoothing the visual discrepancy far more dramatically than the 2.8% whole-frame pixel-score gain implies. The other tested top choices were preserved.

## Controls and limits

- Uses exactly the shared `extractImagePathCandidates` → `pathToWallpaper` → canonical recipe pipeline, with the same cheap component pixels, fairing/window and data bounds. No new bitmap retention, network inference, renderer, candidate count or refinement passes.
- New pure Node test creates a tall coloured sinusoidal stroke, asserts the extracted arc progresses monotonically in Y and preserves opposite X bulges, and exercises the same portable `pathToWallpaper` transform. Small importer tests are now part of `npm run check:quick`; [quick gate #40040664931](https://github.com/gamesbyian/wallgen/actions/runs/40040664931) passed.
- **Not general skeletonization.** A true loop, path reversing in both axes or multiple overlap crossings can still mislead ordered scanlines. Hairpin's rounded procedural approximation and Jagged's non-rigid colour-band phase remain separate issues. Keep actual current-art quality ahead of historical pixels; do not expand to a second path engine.
- No actual Pixel 6 Pro interaction, external owner/licensed graphics, human creator feedback or authentic source setting/seed recovery is claimed. One-off browser workflow was deleted from the PR branch before merge.

Follow-up if needed: diagnose simultaneous X/Y reversals with existing geometry assets and curve preservation, but only after a real failure example warrants a more complex representation.
