# Existing source-measured palette reused in editable seven-hue silhouettes

**Issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557) · **Candidate:** [PR #712](https://github.com/gamesbyian/wallgen/pull/712) · **Genuine full-22 source/fit Chromium R0 proof:** [#40222117789](https://github.com/gamesbyian/wallgen/actions/runs/40222117789).

## Failure reproduced

The shared image descriptor in `image-reconstruction.js` has already performed `measuredCanonicalPalette(desc.colourRegions)`: only a clearly supported current canonical colour story, e.g. Jewel, is returned, and ambiguous/changed images fall back to Classic. Ordinary procedural reconstruction candidates already use `palette:desc.paletteHypothesis?.palette??'classic'`.

The newer source-visible seven-hue shape candidate from merged #710/#711 **overrode this conservative source-only knowledge with `palette:'classic'`**, even where the source colours measured unambiguously as Jewel. Source-visible geometry correctly approximated the source silhouette but was repainted in the wrong rainbow palette, causing an unnecessarily worse actual comparison. Since the shape candidate is allowed to compete inside the same six paints, this was an actionable reconstruction defect.

## Narrow solution

- Pass the existing `desc.paletteHypothesis?.palette??'classic'` through to `observedHueShapeRecipe`; no second colour classifier, inferred source seed, material, shadow, compositing, or source painter history. The default remains Classic for ambiguous inputs.
- Validate with ordinary `normalizeRecipe` and `respectSettingLocks`. A user-locked palette remains authoritative; new source hints cannot bypass it. Seven independently editable source-visible compound silhouettes and their bitmap-independent portable geometry remain byte-for-byte identical under differing palette hints.
- Make the optional `--hue-visible-shapes` genuine-source research comparator use the *same* independently measured source palette before painting. Previously its standalone comparison incorrectly continued to paint Classic, so its suggested preview and the normal winning candidate could disagree.
- No additional normal `drawWallpaper` calls: exactly up to six candidates plus ten refinement renders as before; the distinct offline research preview is opt-in and does not enter production ranking. No JS dependencies or schema change.

## Genuine evidence

[Actual 22-source current-painter acceptance run #40222117789](https://github.com/gamesbyian/wallgen/actions/runs/40222117789) passed 11 new focused test assertions and the normal app quick check. The recovered **Jewel vertical source #19** changed from existing native **.0252859477124** (ordinary procedural straight ribbons) to native **.0153076294620** (seven independent editable compound source-visible shapes), a **39.46% reduction in the unchanged 96×208 RGB/brightness error**. All 21 other source best scores and candidate kinds were numerically identical, including real Hairpin .03053935, Loop .03725952 and displaced Jagged .01330855 and the existing native circles/compound/radial/partial-hue controls. There are no inferred original seeds or backfaces.

The original source art, previous native fit and new native source-palette silhouette fit were extracted from their **actual separately generated GHA artifact archives**, displayed at identical 240×520 visual scale and directly inspected. The new Jewel fit has the correct restrained dark ruby/indigo/blue/green/gold tones and closer source-aligned coloured boundaries. The earlier separate opt-in Classic-only research proposal was visibly neon/bright and inappropriate; the comparator correction is necessary to avoid displaying this misleading alternate preview. The image improvement is visible in a pixel-perfect reproduction rather than inferred solely from the numerical error.

Follow-up acceptance workflow adds an explicit #19 ≤ .016 current-painter ceiling and rechecks all 22 genuine sources with the corrected opt-in comparator. Heavy GHA optical proof is manually dispatched after acceptance, never default quick CI. No Pixel physical rendering/interaction, Android IME/TalkBack or owner creative approval is claimed.

## Next source-justified work

Do not multiply parallel palette experiments or tune the historical seed. The remaining visible appearance discrepancies in Hairpin/Loop/Jagged have already been isolated to exact pigment contours and aliasing at curved junctions. Benchmark source/fit **per-hue negative-space edge agreement** against the now-merged [VTracer offline oracle #706](RECONSTRUCTION-VTRACER-ACTUAL-ORACLE-2026-10-25.md), but avoid importing VTracer's 107 independent Loop SVG shapes into the editor. Prioritize bounded source-visible editing fidelity over speculative alternate paint layers or unearned pixel-exact claims.
