# Reconstructing incomplete leading-hue scenes: actual current PNG review (23 October 2026)

**Agent 1 issue #557.** This result recovers a genuinely supported canonical topology that the previous importer unnecessarily omitted. Only **3–6 compact separate regions occupying the first N ROYGBIV semantic hue slots**, one per colour, qualify. This does **not** solve arbitrary missing-middle pigments, overlapping occlusion, per-object material settings or noncanonical colour identities. No duplicate scene/render engine or extra 6+10 trial budget.

## Canonical failure and direct correction

The existing source RGB connected-component descriptors already provided pigment index, area, axis ratio, fill ratio and centroid. However, scattered editing candidates were emitted only for **all seven hues** or **exactly two islands per hue**. Five isolated coloured circles, expressible directly in the existing `regions/scattered` scene and normal `scatteredOverrides`, were not given that candidate.

The focused fix checks 3–6 distinct contiguous initial hue slots, exactly one compact component per hue, and excludes stretched masks, measured diagonal bands, radial signatures, missing intermediate indices and lock-impossible region candidates. It maps source centres and area-derived radii through the established imagePlacement transform into existing normal editable circles. No private colour map, source metadata, painter, importer or geometry dialect.

## Genuine renderer-blind evaluation and viewed source/fits

[Optional Chromium current-painter R0 run #40048180655](https://github.com/gamesbyian/wallgen/actions/runs/40048180655) produced current **480×1040** source PNGs with separate truth sidecars and IDAT-identical metadata-free twins. The existing blind source-to-recipe evaluator ranked ≤6 candidates and performed ≤10 refinement trials on one eligible option. The resulting actual **96×208** source/fit pairs and 3-case atlas were downloaded and **visually inspected**.

| Actual source | Selected editable hypothesis | Best error | Original-source re-render presentation floor | Visual outcome |
| --- | --- | ---: | ---: | --- |
| #11 seven circles | seven normal editable circles | 0.00832891450 | 0.00449680273 | All original seven colours and positions preserved; minor size/edge difference |
| #17 fourteen two-per-hue circles | fourteen editable circles | 0.00524014894 | 0.00326159109 | All colours and 14 separate positions present; control held |
| **#21 five-hue islands** | **five canonical editable circles** | **0.00418414561** | **0.00233952756** | **Five distinct Red/Orange/Yellow/Green/Blue disks retained** with accurate approximate centres/radii and no fabricated Indigo/Violet |

Reconstruction is a visually close *appearance fit*. The source recipe, original seed, missing-colour intent and painter order cannot be inferred in arbitrary external images. Even current-renderer truth was withheld during hypothesis selection. The source-render floor is an evaluation-presentation measurement, not an attainable-accuracy theorem or proof of original recipe semantics.

Synthetic/Node tests separately exercise a five-object canonical scene, ordinary JSON round-trip, refusal of missing middle hue slots, 6-candidate gate and canonical edit/lock projection. No owner-provided licensed external artwork, physical Pixel device, human art judgement or prior historical recipe compatibility is claimed.

**Disposition:** ready for merge after green final quick CI and temporary browser workflow deletion. #557 remains open for genuine Hairpin/offset Jagged, mixed occlusion, material/Photo and unverified owner/device acceptance.
