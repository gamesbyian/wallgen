# Source-visible sparse hues: don't silently recolour distinct pigments

**Issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557) • **Focused fix and independent source proof:** [PR #726](https://github.com/gamesbyian/wallgen/pull/726) • **Original external low-chroma discovery:** [#40245853634](https://github.com/gamesbyian/wallgen/actions/runs/40245853634).

## Source-specific observed defect

The real Chromium low-chroma corpus used independent Canvas2D source pixels with source recipe **absent**. Its red+blue-only original was correctly classified as **two** real pigments. Nonetheless, its previous best generic `shape` candidate rendered **two red shapes**. The resulting global mostly-black scoring error **.0357548548** looked deceptively good despite visibly removing blue from the wallpaper. `shape` preserved a complete editable exterior, but its one semantic scattered pigment index was always **red**. The optional source-visible seven-hue compound correctly refused for the five genuinely absent hues. The importer must not substitute colour fiction to keep a nice numeric score.

## Existing native scene's exact capability

The canonical scattered painter instantiates semantic colour slots **0, 1, 2, ... N−1** for `scatteredCount=N`. Source appearances where the only visible hue slots are `[0]` or `[0,1]` can therefore use the already existing one/two `regions` editable-circle proposal without creating any new scene dialect, per-object private paint colour or placeholder source data. This PR extends the established `incompleteColourRegions` strict *compact-first-N* gate from 3–6 to 1–6, still requiring one connected significant source component per present pigment, compact geometry, direct measured hue-slot order and source confidence. The established first-five and seven source behaviour should remain numerically identical.

Sources with only `[4]` (blue) or `[0,4]` (red and blue without intervening slots) **cannot** be represented in the current scattered semantics without inventing orange, yellow and green or silently painting blue in some other hue. `reconstructionCandidates` therefore returns **no automatic colour recipe** for noncontiguous one/two-hue sources. Manual image-to-shape import is a separate, user-directed geometry operation and is not disabled.

The generic portable compound `shape` offer now requires **at most one** source-classified hue, never two pigments painted into one red shape. A single observed `[0]` red pigment remains an ordinary editable source-shape hypothesis. A source with **zero classified hues** may still offer a geometry-only silhouette with explicit UI-facing label and uncertainty: its rendered red fill is a **placeholder, not source-colour recovery**. This prevents dishonest provenance even though current ROYGBIV colour stories cannot paint neutral grey or every low-saturation source.

No new mask classifier, new geometric primitive, source bitmap cache, extra normal render, alternate scene, stored original seed, material approximation, worker or export implementation is introduced. Source image bytes, locks, candidate budget (at most six initial current-renderer paints + ten refinement paints), canonical recipe portability and Undo remain authority.

## Tests and acceptance boundary

Targeted Node checks: clean **one red** and **red+orange** source rectangles yield portable `scatteredCount=1` and `scatteredCount=2` canonical region scenes; generic one-red `shape` remains available, but two pigments never become one red source `shape`. **Single blue** and **red+blue** source rectangles yield **zero** automatic colour candidates and leave pixels unchanged. A neutral dark-navy non-ROYGBIV source retains manual/editable geometry candidate, now honestly labelled geometry-only. Tests do not claim recovered original artist settings.

A second independent truthless Canvas source collection `--collection sparse-hue` holds four graphics: one red polygon; red+orange polygons; isolated blue polygon; noncontiguous red+blue polygons. All are the same kind of generated external inputs as the earlier four real polygons/stars, carrying **no** source recipe or historical seed. The one-shot [#726 genuine Chromium optical acceptance](https://github.com/gamesbyian/wallgen/pull/726) must run these four, the established 22 historical genuine-current-R0 sources, four earlier independent shapes and the low-chroma source controls and confirm source/fitted PNGs, truthful refusal and no scoring regressions. **Do not merge this algorithmic candidate change on targeted Node tests alone.**

## Remaining product / integration gap

An unavailable automatic candidate is currently silently hidden in `src/image-path-ui.js` (the existing zero-candidate path intentionally keeps the separate shape-import workflow accessible). Agent 3 / #664 should consider displaying the specific source-hue gap in a short accessible explanation rather than a blank recipe panel. Algorithm and UI ownership must remain separate. Supporting arbitrary sparse colours or neutral material faithfully will require a justified canonical scene colour contract and real source/render/creator validation, not secret dummy hue objects.
