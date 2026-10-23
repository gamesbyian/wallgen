# Jagged reconstruction: genuine-image negative evidence (23 October 2026)

**Status:** measured current-renderer source/fitted-image evidence, not artist or handset acceptance. The working hypothesis of a rigid two-axis Jagged registration was **rejected** and experimental PR [#628](https://github.com/gamesbyian/wallgen/pull/628) closed without merging its fitted-code changes. Only the durable 16th production-art fixture is proposed here.

## Actual generated-image evidence

- [Authentic control R0 study #40039691336](https://github.com/gamesbyian/wallgen/actions/runs/40039691336) rendered six current ROYGBIV recipes into PNG, stripped metadata in byte-identical image-stream copies and ran blind canonical inversion. The artifact's source/fit pairs were **downloaded and visually reviewed**. Wave and radial orientation were broadly preserved, while Jagged's lower ribbon pack and edge spacing visibly drift. Draw's narrow ribbon has angular segments where its source has smooth bends; that is a separate follow-up, not proof that Jagged translation can fix shape mismatch.
- [Focused genuine displaced-Jagged R0 study #40039872858](https://github.com/gamesbyian/wallgen/actions/runs/40039872858) added a real current-renderer **16-offset-jagged** image with source `positionX:18`, `positionY:-12`, `shapeDepth:55`, `shapeFrequency:68` and diagonal orientation. The separately held truth sidecar was not supplied to fitting.

| Blinded source | Best canonical hypothesis | Reconstruction pixel error | Source-render comparison floor | Coherent 7-hue registration |
| --- | --- | ---: | ---: | --- |
| 04-jagged | Jagged | 0.165655 | 0.010704 | X unavailable, Y +6 |
| 16-offset-jagged | Jagged | 0.222146 | 0.014424 | X unavailable, Y unavailable |
| 02-diagonal-straight (control) | Straight | 0.085835 | 0.008790 | not applicable |
| 03-wave (control) | Wave | 0.041215 | 0.008732 | not applicable |
| 14-offset-radial-rays (control) | Radial rays | 0.038620 | 0.022640 | not applicable |

Lower reconstruction error is better. The “floor” is the evaluator's comparison of the downscaled source with the same original truth re-rendered at fitting size; it is **not an achievable theorem or proof of original setting recovery**.

## What the experiment proved and disproved

The shared seven-hue centroid offset gate, already useful on a Wave/straight pack, cannot establish a **rigid horizontal displacement** across current Jagged source and re-render. One isolated vertical offset on the original is insufficient. An extra bounded joint X/Y refinement trial correctly solves a synthetic case where a greedy sequence of single-axis probes fails, and preserved the real-image controls; however, it **never activates on the two representative authentic Jagged sources**. Merging an extra optimizer solely for this synthetic win would impose complexity without demonstrated artistic value, so it was rejected.

The actual image discrepancy is primarily **non-rigid ribbon geometry/phase and per-hue registration**, with effects near cropped ends. A future focused R3 attempt should first measure source-versus-rendered per-colour bent contour and changing inter-band gaps, then spend the existing six coarse plus ten refinement painter budget on justified **current canonical curve controls or shared Draw geometry**, not a larger generic translation grid. Require actual source/fit image review and no-regression Wave/diagonal/Draw/Hairpin samples. Do not revive rejected Chevron #613 or radial dividers #625.

The preserved `16-offset-jagged` is just an additional **repeatable negative R0 fixture**. It neither makes reconstruction more accurate by itself nor claims recovery of actual original seed, phase, historical artwork, photographer intent, external licensed art or Pixel 6 Pro human acceptance. Only separately authorized actual external art can close that evidence gap. No permanent Chromium workflow remains.
