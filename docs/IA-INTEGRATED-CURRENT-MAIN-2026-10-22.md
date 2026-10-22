# ROYGBIV navigation: current implementation delta (2026-10-22)

**Status:** factual integration supplement, not approval to rebuild the editor. Read beside [the historical human-centred atlas](HUMAN-CENTRED-NAVIGATION-MAP-2026-10-22.md) and [applied design assessment](IA-RESEARCH-APPLIED-ASSESSMENT-2026-10-22.md).

The original 40-tool / 87-setting map and 16-task comparison were created **before** #434 and #432. They remain useful as a historical comparison and research model; they are not the current live editor inventory.

**Actual current main:** seven canonical categories, 43 tools, 95 source-bound scalar setting inputs, a distinct local Shape & Path Library, and a **display-only** Colour Vision Preview. The mobile destinations remain Studio, Edit, Explore, Saved, More. Saved stores finished wallpapers; My shapes & paths stores reusable source geometry, not completed wallpapers.

## New/changed artistic controls

| Place | Key | Human effect | Relative impact | Likely use | Natural neighbours |
|---|---|---|---|---|---|
| Path → Regions | `scatteredShapeKind` | Switch analytically perfect circles versus an imported silhouette | 4 | Occasional | Region layout, import, library |
| Path → Objects | `scatteredCount` | Number of individually placed objects (1–70) | 4 | Frequent | Spacing, size |
| Path → Objects | `scatteredMinSize` | Smallest allowable object radius | 3 | Occasional | Maximum radius, size variation |
| Path → Objects | `scatteredMaxSize` | Largest allowable object radius | 4 | Occasional | Minimum radius, cropping |
| Path → Distribution | `scatteredVariation` | Variation among object sizes | 3 | Frequent | Min/max radius, seed |
| Path → Distribution | `scatteredSpacing` | Preferred gap among shapes | 4 | Frequent | Overlap, count |
| Path → Edges & overlap | `scatteredEdgeCrop` | Degree of off-frame cropping | 4 | Occasional | Size range and canvas framing |
| Path → Edges & overlap | `scatteredOverlap` | Separate versus overlapping objects | 3 | Occasional | Clearance, layering |

Impact: 4 changes the overall visual composition; 3 changes a dominant artistic characteristic. Frequency is an analyst hypothesis, not measured usage. These are eight distinct canonical keys across three new tools, making 95 scalar settings and 43 tools, still **seven categories**.

**Two new workflows:** `My shapes & paths` stores/reuses geometry separately from `Saved` wallpapers; importing a silhouette can become a region stamp with its **geometry snapshot embedded in the wallpaper recipe**, so deletion of the library asset does not invalidate that artwork. `Colour Vision Preview` is an opt-in inspection layer with original/simulation comparison. It is not a colour-palette generator, a recipe property or a PNG export transform.

**Existing named feature:** `Rainbow Orbits` is already built in `src/scattered-composition.js` and reachable via `#rainbowOrbitsPreset` in `src/app.js`. It has seeded placement, seven coloured circles, a black backdrop and intentional edge crops. Issue #443 should focus on direct individual-object editing/polish instead of reimplementing the preset.

## Creative navigation choices

The historical **Build / Arrange / Form / Colour / Finish** model can now map all 95 scalar keys. The source-backed comparison tool has been extended with **Scattered objects** and a seventeenth goal, “make seven varied rainbow circles with adjustable clearance and cropping.” It remains an *unweighted route-tree proxy*. Fewer theoretical category jumps cannot establish that a redesign is more joyful or discoverable.

Before reorganizing, prioritize a few short human-intent journeys: “make circles big without crowding them,” “reuse a saved leaf in another wallpaper,” “see the original while comparing colour vision,” “recover a saved favourite,” and “edit one shape without reshuffling the others.” The last remains a real product gap.

**Low-risk immediate improvements:** add contextual shortcuts to the existing related controls, clarify which parameters are dormant and preserve all recipe keys and Undo behavior. Avoid moving 43 tools at once. Coordinate substantive changes with [issue #444](https://github.com/gamesbyian/wallgen/issues/444), artifact #443 for direct shape editing and [issue #445](https://github.com/gamesbyian/wallgen/issues/445) for material quality.

## Historical static reference drift

The optional old screen contract, control inventory and many giant browser acceptance tests still assume 40 tools and 87 keys. They must not be used to remove the three new tools or block focused features. A future low-priority maintenance pass may update source-backed inventories; the **live schema and app are authoritative**. Don't create a screenshot marathon to make a frozen catalogue happy.

## Integration acceptance

The standalone `scripts/ia-structure-evaluate.mjs` must report 95 source homes, 95 unique proposed homes, valid applicability for the 17 analyst-selected tasks and no simulated human data. The lightweight Node test verifies this mapping. Physical-device testing is **not required** merely to accept this analytical document.
