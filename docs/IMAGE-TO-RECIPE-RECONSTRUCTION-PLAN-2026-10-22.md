# Image-to-recipe reconstruction: native and external imports

**R0 reproducibility checkpoint (23 October):** [PR #564](https://github.com/gamesbyian/wallgen/pull/564) adds opt-in `scripts/review-reconstruction.mjs`.
Execute from repo root with Playwright/Chromium installed:

    node scripts/review-reconstruction.mjs --out-dir artifacts/reconstruction-r0-unique-run

`--browser /usr/bin/chromium` can specify an installed binary. `--list` inspects thirteen cases without browser. The script invokes the **existing** `render-headless.mjs` for 13 standardized straight/diagonal/curved/jagged/hairpin/loop/drawn/radial/nested/scattered/material/fibre/compound cases at 480×1040, verifies embedded canonical source recipes, then creates IDAT-identical metadata-free evaluation copies through `scanPngChunks`, retaining original full images and `.recipe.json` truth separately. It refuses to overwrite prior evidence, writes `manifest.json` and local gallery with status `produced-not-reviewed`.

**This script has not been executed against actual Chromium production PNGs by this agent.** R0 actual-render and visually inspected acceptance remain open in #557. External graphic examples must be permissioned/supplied, never fabricated. No automatic browser CI or historical PNG parity tests were added.


**23 October 2026 implementation checkpoint:** [PR #556](https://github.com/gamesbyian/wallgen/pull/556) introduces a working **R1–R4 first slice**: shared bounded seven-hue component descriptors; editable canonical seven-circle scattered overrides and drawn-path alternatives; no more than six real `drawWallpaper` evaluations at 96×208 with low-resolution pixel/coverage ranking; alternate choice and inferred-result disclosure inside the existing import modal; normal lock-respecting Undo/Save transport. Focused synthetic metadata-free and external-raster tests join the lean quick check. **Not yet proven:** R0 actual current-artwork PNG corpus or visual inspection; material reconstruction, fine segmentation, fully independent coloured shapes/layering, numerical iterative optimization, source provenance carried into saved output, real handset interaction and rendered-image artistic quality. Follow-up [#557](https://github.com/gamesbyian/wallgen/issues/557) owns those tasks. Green quick CI is only code/test evidence, not R0 or real-image acceptance.


**Status:** proposed staged development track; no full-scene inverse renderer currently implemented. 22 October 2026. See [shared-engine ownership](ENGINEERING-REUSE-AND-SEMANTIC-OWNERSHIP.md) and the active roadmap. **Early-development priority:** optimize the best current recipe system; compatibility with past saved recipes, historical generator pixels, old exports or older schema generations is a nice-to-have, never a default blocker or high priority. Do not overwrite original imported images or misrepresent inferred recipes as authentic metadata.

## Purpose and two related input cases

1. **Metadata-free ROYGBIV image:** fit an editable standard recipe to the observed pixels. Leverage knowledge of the app's palette, composition structures and actual renderer. A visually faithful reconstruction is useful even when the historical seed and exact original recipe cannot be identified.
2. **Arbitrary external image:** recognize any geometry, colours, arrangements and material qualities the current ROYGBIV engine can express. Translate them into one or several editable candidates. Unsupported content gets explicit partial reconstruction rather than false fidelity.

Offer two meaningful results when justified: **appearance reconstruction** via editable custom paths/regions, and **procedural reconstruction** via recognized structural modes and controls. These optimize different qualities; do not conflate image similarity, parametric editability and historical authorship.

## Current source-backed foundation

- `src/image-path.js` already estimates border background colours, connected components, colour masks, line orientation, contours, colour-band centrelines, silhouettes with holes and separated islands. `src/image-path-ui.js` accepts PNG/JPEG/WebP/safe SVG and runs bounded local decode/downsampling with candidate preview. Tests `tests/image-path.test.js` and `tests/image-shape-extraction.test.js` cover synthetic extraction, **not** full recipe recovery.
- `src/geometry-asset.js`, `src/drawn-path.js`, `src/composition-geometry.js` and `src/scattered-composition.js` provide normalized portable paths, compound regions and scene objects. Imported geometry already survives normal transport. Some layouts cannot represent independent heterogeneous shapes, arbitrary colour/object assignments or layer relationships; observe that representational limitation before implementing an inverse-only object model.
- `src/model.js` is the canonical recipe normalizer and deterministic scene resolver; `src/renderer.js` is the authority for final appearance, including materials, stitching, Photo and viewport. `src/render-coordinator.js` and `src/render-worker.js` handle preview/export. The optimizer should use bounded real renderer samples, not construct a rival rasterizer.
- Recipe PNG metadata handling and strict source-preserving archival are separate workflows. Existing historical source archives and comparisons are interesting evidence, but exhaustive legacy archaeology **must not** be prerequisite to current-era image reconstruction.

## Fundamental limits

The inverse problem is not one-to-one: many combinations of hidden/dormant settings and seeded random decisions can produce identical or near-identical pixels. The original arbitrary seed is ordinarily impractical to recover and external images have no such seed. Distinct old renderer versions may have outputs the current engine cannot reproduce exactly. Never promise exact original settings or claim confidence where multiple recipes explain the same pixels.

Many external graphics are tractable (parallel ribbons, circles, nested shapes, ray fans, simple illustrations). Complex photos, translucency, illumination, textiles and mixed unrelated objects pose harder recognition and representation problems. Treat colour/shape/geometry fidelity separately from material look; match coarse structure before fine texture.

## Proposed implementation, progressively useful

### Stage R0: small ground-truth study, no code redesign

Collect 10–20 **actual currently generated ROYGBIV PNGs** representing straight, diagonal, wave, hairpin/loop, drawn, radial, nested/scattered, outlined and textured compositions. Keep known recipes only as evaluation truth; strip metadata from copies for analysis. Add a handful of permissively usable external simple geometric examples. Report recovered image similarity separately from recovered actual settings. Include difficult, overlapping examples and openly document failures. No broad screenshot factories or routine CI.

### Stage R1: compositional image descriptors

Reuse `image-path.js` input/decode/component logic, extending pure helpers for semantic hue masks, negative space, spatial region arrangement, bands and centrelines, stripe order/reversal, stroke thickness, outline/boundary characteristics, symmetry, radial centres and repeated shapes. Preserve existing extraction API and its image-size limits until new measured needs justify change. Report candidate ambiguity, occlusion, anti-aliasing and lossy JPEG issues. Distinguish actual image dimensions/crop from the wallpaper logical 600×1300 frame.

### Stage R2: standard recipe candidate synthesis

Map recognized structure into current `normalizeRecipe` inputs and existing path/geometry snapshots. Produce several ranked candidates: Paths, Drawn, Radial, Regions, Scattered, or truthful partial approximation. Use selected palette family/reversal, background, thickness, spacing and orientation as explicit candidate parameters. Don't add a proprietary reconstruction recipe schema or write directly to rendered scene internals. If the current recipe vocabulary prevents a good fit, propose a backward-*optional* improvement to the canonical current schema rather than building a parallel graphics engine.

### Stage R3: real render/compare/fit

Render candidate normal recipes through `resolveScene`/`drawWallpaper` at low bounded resolution, compare to source with combinations of semantic-colour region overlap, contour/centreline distances, background coverage, spatial composition and gradually finer pixel/texture metrics. Pixel RMSE alone over-penalizes slight geometric shifts. Use coarse-to-fine, bounded iterations, cancellation, deterministic candidate logs and capped concurrency/memory suitable for Pixel 6 Pro. Reuse workers where actually helpful. Tune global topology first, then positioning/width, then fine colour/outlines/material and Photo. No requirement to infer original PRNG seed; custom editable geometry can represent the apparent image better.

### Stage R4: user-controlled acceptance and reuse

Show source beside candidates with what was and wasn't recovered. Permit alternate candidate selection, region and geometry corrections, and normal Edit continuation. Apply changes in one standard recipe transaction respecting current locks/Undo; save through existing PNG/JSON/Favourites paths. Record reconstruction provenance/confidence separately; never label an inferred recipe as source-authentic embedded metadata. Keep original upload unchanged.

### Stage R5: selective advanced improvements

Explore better colour grouping, difficult mask segmentation, multiple interleaved objects and object layering only after evidence shows the current scene language cannot express useful images. Consider classical vision first, then optional ML for ambiguous structure/material classification; avoid compulsory network/API uploads. Evaluate WebAssembly/OpenCV.js, graph fitting or differentiable vector-rendering research without importing dependencies by default.

## Shared architecture rules

Use [engineering reuse contract](ENGINEERING-REUSE-AND-SEMANTIC-OWNERSHIP.md). Single pipeline: **image bytes → decoded RGBA and validated candidate descriptors → standard geometry/recipe → canonical scene → existing renderer → shared storage/export**. Native and external imports use the **same** segmentation, candidate, optimization and comparison logic; only priors and candidate ranking may differ. Do not implement duplicate uploads, RGB conversions with conflicting semantics, geometry formats, RNGs, model normalization, renderers, workers, Undo paths or serializers. A helper extraction is justified when multiple concrete callers share truly identical numerical semantics; leave purpose-specific algorithms distinct when necessary. Prioritize current functionality and speed over legacy pixel-for-pixel preservation.

## Acceptance and dispatch

- R0: source PNG fixtures and objectively recorded render/image comparisons, plus observed counterexamples. No claim of recovery just because contours can be extracted.
- R1–R2: at least one straight/curved, one radial/region and one external graphic produce real normalized candidate recipes, re-editable and transportable using current paths. Record which features remain unsupported.
- R3: measured comparisons demonstrating improvement over first-guess baseline across varied original images, with a bounded mobile work budget and no massive CI.
- R4: normal Save/Undo/import workflows intact; imported original never changed and provenance truthful.
- Each PR names reused source boundaries and explains any new primitive or schema extension. Small focused tests and a few actual output images suffice. Do **not** gate R0–R4 on historical-v1 parity, migrated legacy PNG compatibility, old recipe byte stability or exhaustive historical matrices.

**Priority guidance:** exploratory R0 can begin now; broaden implementation after meaningful baselines. Existing core authoring and render quality continue to take precedence over optional archaeological parity work when priorities conflict.
