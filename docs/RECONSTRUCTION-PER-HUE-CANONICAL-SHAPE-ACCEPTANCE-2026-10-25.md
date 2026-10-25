# #557: portable per-hue visible compound geometry, canonical first proof

**Status:** opt-in canonical scene foundation; no imported-source reconstruction candidate enabled yet. [PR #709](https://github.com/gamesbyian/wallgen/pull/709). Actual [GHA painter/worker/full-resolution run #40218632661](https://github.com/gamesbyian/wallgen/actions/runs/40218632661), artifact `canonical-per-hue-shapes-png-receipt` (ID 12608675863).

## Why this model extension exists

The source-authoritative [local Hairpin/Loop study](RECONSTRUCTION-LOCAL-CURVE-REGISTRATION-FINDINGS-2026-10-25.md) rejected twelve single-control painter changes; other global width and width+spread changes also failed. In a current Hairpin image the seven visibly distinct pigments have *different curves* and negative spaces. Existing `scatteredShape` uses one identical compound geometry for every coloured imported stamp. No choice of seven positions and radii reproduces noncongruent visible source silhouettes.

## Opt-in data contract

- `scatteredShapeOverrides:[{index,shape}]` is a compact optional array, only hue slots **0–6**, never generated during ordinary random wallpaper creation. `shape` uses existing `roygbiv.geometry-snapshot/v1` (schema plus version 1, compound region with evenodd holes and islands) and is fully embedded in the existing recipe.
- Canonical `normalizeRecipe` validates and canonicalizes through shared `normalizeCompoundRegion`, cap **1200 source vertices per hue** before expensive intersection checking and **192 KiB aggregate** for all seven geometry snapshots, refuse malformed, self-crossing, oversized or noncanonical items.
- Existing `scatteredOverrides` still owns per-object position and size. New shape overrides own **only** the visible shape. No alternate object renderer: `buildScatteredObjects` maps validated per-index geometry into the current `{kind:'region',id,colorIndex,vertices,rings,editCircle}` contract; the normal renderer, worker, export and shape gestures still use it.
- Existing shared `scatteredShape` remains the fallback for unspecified hue slots. With no global shape, missing individual shapes are **not** substituted by circles and scene builder reports precisely how many slots were absent. Circle mode still paints circles irrespective of dormant opt-in imported snapshots.
- The new property is a standard lockable setting; omitted for all old recipes. No external libraries, imported image bytes, asset library ID, hidden source shape guesses or palette rewrite enters stored recipes.

## Real proof

The one-shot GHA [optical run #40218632661](https://github.com/gamesbyian/wallgen/actions/runs/40218632661) passed four semantic/transport/lock/error tests plus the complete existing lean PR sanity suite. It authored seven different coloured geometric objects: a red hollow rectangle with detached island, orange triangle, yellow pentagon, green hexagon, blue trapezoid, indigo polygon and a violet concave compound. The downloaded actual **480×1040** production PNG was opened and directly visually inspected: all colours and shapes appeared in their intended slots, the hole remained transparent/black, the detached red island survived, and there was no accidental duplication or palette mismatch.

The same recipe painted via production reference renderer and production worker at 480×1040 with **zero different RGBA pixels across 499,200 pixels**, and **38,346 visible-ink pixels**. PNG metadata extracts identical complete seven-shape recipes. The ordinary production renderer also generated **3024×6552** full-resolution PNG (490,670 bytes) with the same embedded reconstructible recipe and no failure. These are GHA Linux/Chromium observations, not owner Android UI/IME/TalkBack acceptance.

## Next: source mask → portable per-hue shapes

Do **not** treat a synthetic seven-polygon fixture as a successful Hairpin/Loop image reconstruction. Implement a separate opt-in extraction experiment on the already segmented seven source masks in `src/image-path.js`, using existing `components`, `shapeEdgeLoops`, hole/island analysis and `normalizeCompoundRegion`. For each pigment, produce one bounded geometry with a real source-local crop viewBox, independent centre/scale, and origin declared as *visible pixel hypothesis*. Avoid using source recipe truth to select geometry.

Then convert these into a normal scattered imported scene by source-derived centre and radius, preserve the current painting/export workers, and run an **independent one forward-painter opt-in** comparison against genuine metadata-free #05 Hairpin / #06 Loop and false positive R0 cases before considering any default candidate slot. Watch for disconnected antialias fragments and high contour complexity; refuse instead of inventing hidden contours, missing pigments or unknown palette. Any actual source-vs-render gain must be optically inspected and transport/Undo/full-resolution verified, while normal fitting stays within six initial and ten refinement paints. Agent 1 owns #557 and Agent 3 integration.

The completed source comparison/report and model must remain distinct from the VTracer Python/CairoSVG cross-renderer oracle in #706, which is a separate parallel PR.
