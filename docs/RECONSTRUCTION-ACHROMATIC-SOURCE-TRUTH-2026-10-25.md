# #557 · Refuse falsified rainbow pigments in independently authored neutral source

**Date:** 25 October 2026, Calgary; 26 October UTC. **Agent:** Agent 1.
**Scope:** only automatic inverse colour attribution. Canonical scene, manual image-to-shape import, palette model and renderer are unchanged.

## Reproduced visual source/fit defect

The earlier merged [#725 independent low-chroma source generator](RECONSTRUCTION-LOW-CHROMA-EXTERNAL-CONTROLS-2026-10-25.md) supplies four **metadata-free Canvas2D** originals, not ROYGBIV-source recipes or proprietor artwork. Its `neutral-seven-control` has seven **gray** geometric ink silhouettes on almost-black background, with **zero canonical hue masks**. Ordinary six-painter automatic inference nevertheless proposed an editable **red** one-shape candidate. The current browser RGB difference was **0.07736348746228457**. That score is **not** proof of colour fidelity: the fitted artwork visually changed gray diamonds/pentagons into red shapes. The independent original and previous fitted PNGs were opened and inspected side by side.

This is not a need for a new shape engine. The canonical ROYGBIV scene assigns hues to scattered colour slots; it has **no neutral-gray slot** for a source set of seven gray silhouettes. The correct automatic action is to refuse a claimed faithful colour recreation, while leaving existing **manual geometry-only contour import/recolour** available for the artist.

## Narrow fail-closed source witness

`plainlyAchromaticForeground(image, colourRegions)` in `src/image-reconstruction.js` requires:
- Valid, bounded original RGBA image, no source-verified semantic hue regions (using the **same shared hue importer**).
- Four opaque and mutually consistent background corners within 16 channel values.
- A bounded grid at roughly 12,000 pixels, with >=3.5% foreground pixels differing from the actual corner background by at least 48 RGB channel values.
- >=92% of those salient pixels having strongly neutral gray channels (max-min <=8, brightness between 55 and 220).
- Otherwise no new inference/restriction. In particular, ambiguous chromatic soft pastels, dim-but-colourful seven-hue examples, red-plus-gray mixtures, transparent artwork, sparse coloured examples and all 22 native seven-colour sources follow the previous route.

This checks **visible source colour**, not historical painter state. It adds no true painter call (positive refusal uses zero), no image retention, no new dependency, no scene setting, no worker divergence, and does not mutate the original imported RGBA.

## Genuine Chromium painter acceptance

[One-shot source-blind real Chromium run #40255113802](https://github.com/gamesbyian/wallgen/actions/runs/40255113802) **SUCCESS**, with all 22 independently generated current-renderer native R0 images and each of four externally authored original pigment, low-chroma and sparse source controls (34 total).

Against **merged #726 original complete source/art acceptance ZIP** [#40247842572](https://github.com/gamesbyian/wallgen/actions/runs/40247842572), downloaded and compared actual archive members:

- **198** common artifact files; **196 byte-identical**. Only `external-low-chroma/evaluation.json` and its generated `evaluation.html` viewer differ because the neutral source now has no false winner.
- **143/143 comparable original-source and fitted PNGs byte-identical**. The neutral original source PNG is still identical; its previously fabricated *red* fitted preview remains in baseline archive but is **not produced** after correct refusal.
- **All 22 native R0** original sources, best kinds and fit-error scores exactly unchanged.
- **Four independent original polygon/star/circle/overlap** painter outcomes exactly unchanged.
- **Four sparse source controls** outcomes unchanged, including continued refusal of isolated blue and gapped red+blue, and the independent first-two red+orange circles on this base. Source-visible first-two polygons are separately qualified by #731, pending ordered integration.
- **Other three low-chroma controls** outcomes exactly unchanged: `dim-seven-polygons` remains a modest-fitting `path`; `soft-seven-stars` still imperfectly chooses a monochrome-red shape; `partial-two-hues` keeps its previous justified refusal. Neither the dim nor the soft-pastel case is falsely claimed fixed by this narrow patch.
- `neutral-seven-control` changes **5 candidates, `shape` best error .07736348746228457** → **0 candidates, `null` best error**. This is a truthful refusal, not a lower recovered reconstruction score.

All tests pass in original targeted/lean CI, including independent artificial gray, soft pastel, dark ink, actual rainbow, red + gray, all-black and unreliable-background source controls. Temporary opt-in **PR-triggered costly Chromium workflow was restored to manual-only** before integration. Normal application painter budget remains <=6 initial, <=10 refinement paints.

## Known boundaries and handoff

Only a clearly predominantly neutral foreground is gated. **Muted coloured stars remain poorly represented**, because the canonical hue importer requires delta >=55 and a high-relative-chroma threshold; broadening that classifier without colour, topology and reference/worker evidence would be unjustified. Genuine hidden paint order, original seed/material/lighting, non-contiguous omitted semantic pigments, Hairpin/Loop negative-space contour fidelity, physical Pixel 6 Pro, owner art and Android TalkBack/IME/thermal acceptance remain unresolved.

Integrate [#728](https://github.com/gamesbyian/wallgen/pull/728) (now merged), then independently reconcile [#731](https://github.com/gamesbyian/wallgen/pull/731) and [#734](https://github.com/gamesbyian/wallgen/pull/734) before this focused refusal through Agent 3 #664. **Keep #557 open.** Agent 2 #653 typography and Agent 3 mobile/accessible `no candidate` UI are not altered.
