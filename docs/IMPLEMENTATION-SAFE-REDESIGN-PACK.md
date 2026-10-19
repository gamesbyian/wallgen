# ROYGBIV Implementation-Safe Redesign Pack

**Status:** canonical visual/behavior reference; not a production redesign. **Source:** `gamesbyian/wallgen` main at `7d99e99a5ce391d05ab410fcc90d3eb78420a282`, with a staged icon extension on this documentation branch. [Fresh verified UI atlas: 1,648 captures, zero missing states](https://github.com/gamesbyian/wallgen/actions/runs/39166559800). The illustrated mockups in earlier decks are inspiration, **not specifications**.

**Verified semantic correction (source, 2026-10-18):** Existing Zoom +/− modifies the serialized **`recipe.viewZoom`** field, so both preview and exported PNG use the same framing. Existing directional nudge buttons modify **`recipe.positionX` / `positionY`** and therefore move the composition. They are **not viewport-only Pan**. A separate Pan action is a future feature with unresolved persistence and export semantics; the visual concept was ahead of implementation. Fit would reset only `viewZoom` to `1`. The proposed navigation, symbols and focused slider remain design proposals until a tested PR changes production UI. See [verification matrix](ui-reference/verification-matrix.json) and [source control inventory](ui-reference/source-control-inventory.json).


## Source-of-truth hierarchy

1. **Actual production source and screenshot atlas:** existing controls, code paths, conditional states and current behavior.
2. **[`canonical-screen-contract.json`](./ui-reference/canonical-screen-contract.json):** screen-by-screen required/conditional/forbidden lists; includes every schema category/tool/setting key.
3. **[Twelve deterministic SVG reference plates](./ui-reference/README.md):** the exact approved icon geometry embedded in proposed UI diagrams and a complete side inventory. These are self-contained, non-generated visual references. In any discrepancy, the numbered inventory and JSON win over the phone art.
4. **[ROYGBIV icon manifest](../assets/icons/roygbiv/manifest.json):** original glyphs, exact SVG sources and candidate extension statuses. The logo is always `assets/roygbiv-logo.svg`.
5. **[Canvas-first v2 vision plan](./CREAM-STUDIO-CANVAS-FIRST-REDESIGN-V2.md) and proposal deck:** product goals, colour/style and narrative inspiration, *not exhaustive implementation references*.

**Navigation implementation:** the default mobile dock now has **five destinations**: Studio, Edit, Explore, Saved and More. The previous six-action dock was Edit, Explore, Randomize, Favourite, Download and More. The original Randomize, Download and Favourite source buttons are **preserved and relocated**, not removed or replaced. The historical source-action map and current destinations are in `canonical-screen-contract.json` under `global.previousDockControls`, `global.navigation` and `global.actionRelocations`. Live DOM contracts are in `source-control-inventory.json`.\n\n**Independent review:** [source inventory](ui-reference/source-control-inventory.json), [evidence matrix](ui-reference/verification-matrix.json) and [adversarial acceptance protocol](UI-REDESIGN-ADVERSARIAL-REVIEW.md) are mandatory before claiming full UI fidelity. Source/atlas evidence may disprove a beautiful screen diagram.

**Do not build by copying missing controls from generative mockups.** Required elements are preserved even if the illustrative phone view lacks the space to depict them simultaneously. Feature removal requires a separate explicit product decision.

## Approved icon family and proposed assignments

The baseline contained **55 UI glyphs plus one untouched brand icon (56 SVGs)**. This pack stages **12 additional candidate glyphs**, for **68 total SVGs**. **Four candidates are now wired by successive verified PRs** (Edit, Fit, Import path, PNG export), using existing source controls without changing event semantics; the other eight remain unwired. All candidates are 32×32, rounded 2.4-unit neutral strokes with flat approved ROYGBIV accents, no gradient/filter/raster. The approved poster remains at `assets/icons/references/roygbiv-icon-system-approved.png`. The canonical app brand image must never be regenerated or restyled without separate approval.

| Function | Source SVG | Action | Rule |
|---|---|---|---|
| Studio | home | Keep | Canonical bottom destination |
| Edit | edit → edit-controls | Reassign | Approved pencil is not a good general settings metaphor; new sliders candidate |
| Draw path | draw-path | Keep | Already pencil plus path, clear role |
| Explore | explore | Keep | Four-tile gallery family |
| Saved / Favourites | favourite / favourite-filled | Keep | Distinct selected state |
| More | more | Keep | More action menu |
| Pan viewport | pan (candidate) | Add | Do not confuse with anchor edit |
| Zoom / Fit | zoom-in / zoom-out / fit-canvas (candidate) | Extend | Keep group on canvas side, no top header |
| Path imported | import-path (candidate) | Add | Distinct from image export |
| Anchors / Smoothing / Extend | anchor-points / smooth-path / extend-path (candidates) | Add | Phase-specific draw controls |
| Intersections | weave (candidate) | Add | Weave mode distinct from line style |
| Optional focused slider | focus-slider (candidate) | Add | Not the default editor |
| History restore | restore-variation (candidate) | Add | Separate undo/favourite/recent |
| PNG export | export-png (candidate) | Add | Separate saved recipe JSON |
| Image metadata | metadata (candidate) | Add | Output identity not design parameter |

**Semantics:** Use one action concept per glyph; don't reuse the same figure to mean zooming the camera and editing artwork geometry. Use real labels/aria-labels even where a glyph is displayed alone. SVG art at 20–28px may have 40–48px hit zones; keep focus/active/disabled distinction on the button or chip, not purely by icon hue. Preserve existing theme-aware inline `currentColor` rendering. Extension glyphs are registered in the icon renderer. Their per-icon **integrated** or **candidate/not wired** state and actual source usages are machine-checked in the manifest.

## Feature-preservation census

The repository schema currently has **7 categories and 40 named tools**. This is the minimum named-tool audit, not all UI features; additional dynamic interior controls, cameras, draw tools, export, meta, favourites and history must be covered separately.

| Category | All named tools (current source) | Count |
|---|---|---:|
| Layout | Canvas structure (`structure-mode`), Arrangement (`arrange`), Direction (`direction`), Variation (`variability`) | 4 |
| Path | Geometry (`geometry`), Radial rays (`rays`), Ray shape (`ray-shape`), Origin (`origin`), Regions (`regions`), Region detail (`region-detail`), Constraints (`safety`), Turns (`turn`), Single loop (`single-loop`), Shape detail (`shape-details`), Endpoints (`ends`) | 11 |
| Shapes | Structure (`structure`), Patterns (`patterns`), Marks (`marks`), Motif scale (`motif-scale`), Band tones (`tone`), Character (`character`) | 6 |
| Details | Elements (`interior`), Element style (`interior-style`), Element motion (`interior-motion`), Placement (`interior-placement`), Colour targets (`interior-targets`), Outlines (`outlines`), Dividers (`dividers`), Shadows (`shadows`), Glow (`glow`) | 9 |
| Colour | Rainbow (`rainbow`), Background (`canvas`) | 2 |
| Material | Layer 1 (`layer1`), Finish 1 (`finish1`), Layer 2 (`layer2`), Finish 2 (`finish2`), Layer 3 (`layer3`), Finish 3 (`finish3`), Surface (`surface`) | 7 |
| Effects | Lighting (`lighting`) | 1 |

**Non-schema functional groups to retain:** Studio preview, pan/nudge/recenter/fit/zoom, full image display, generator randomize/undo/Primes-only/bleed, seven scene colours and divider/background; interior stack, enable, style, motion, placement, targeting, reorder/lock, import vector/image path, manual anchor insertion/removal/handles, geometric smoothing up to 10×, resmooth adjacent segments, off-frame extrapolation, loop/hairpin and crossing modes, three layered materials with rotation steppers, per-setting/category/tool die/lock, variation and search, recent history restore, local favourites and gallery, seed/link/recipe PNG JSON import-export, metadata and batch export; keyboard and touch focus, disabled explanations, status toasts.

## Twelve state plates

**01. [Studio / canvas](./ui-reference/studio.svg)**: required 13, conditional 2, prohibited 3. Exact declarations and icon dependencies live in JSON.

**02. [Edit / Path geometry](./ui-reference/geometry.svg)**: required 13, conditional 3, prohibited 2. Exact declarations and icon dependencies live in JSON.

**03. [Draw / interpret / anchors](./ui-reference/draw.svg)**: required 12, conditional 2, prohibited 2. Exact declarations and icon dependencies live in JSON.

**04. [Explore gallery](./ui-reference/explore.svg)**: required 9, conditional 2, prohibited 2. Exact declarations and icon dependencies live in JSON.

**05. [More / outputs](./ui-reference/more.svg)**: required 13, conditional 2, prohibited 2. Exact declarations and icon dependencies live in JSON.

**06. [Material / three layers](./ui-reference/material.svg)**: required 11, conditional 3, prohibited 2. Exact declarations and icon dependencies live in JSON.

**07. [Colour / palette](./ui-reference/colour.svg)**: required 9, conditional 2, prohibited 2. Exact declarations and icon dependencies live in JSON.

**08. [Layout / diagonal direction](./ui-reference/diagonal.svg)**: required 8, conditional 2, prohibited 2. Exact declarations and icon dependencies live in JSON.

**09. [Edit / sparse tool](./ui-reference/compact.svg)**: required 8, conditional 2, prohibited 2. Exact declarations and icon dependencies live in JSON.

**10. [Optional Focus slider](./ui-reference/focus.svg)**: required 9, conditional 3, prohibited 3. Exact declarations and icon dependencies live in JSON.

**11. [Recent variations](./ui-reference/history.svg)**: required 7, conditional 2, prohibited 2. Exact declarations and icon dependencies live in JSON.

**12. [Find setting / tool](./ui-reference/search.svg)**: required 8, conditional 2, prohibited 2. Exact declarations and icon dependencies live in JSON.

## Layout and behavior invariants

- No **“Your canvas” heading** or dedicated **top zoom row**. Use the established logo beside wordmark. Place Pan / Zoom + / Zoom − / Fit on a canvas-side rail, with appropriate nudge/recenter; preserve full artwork and 600:1300 portrait aspect or selected export dimensions.
- Camera controls manipulate **only camera state**, never procedural recipe settings or output image bounds. Never conflate panning with path/anchor movement; off-canvas path data must persist through edits and exports.
- Preserve 5-mode bottom navigation, 7 editor categories, 40 named tools and all conditional settings, with explicit search and scroll recovery.
- Individual panel sliders retain stable **flat randomly arranged ROYGBIV colours** with no repeats; blue remains eligible. Optional Google Photos-inspired Focus slider is **additive and opt-in**, not a forced replacement of multi-slider editing.
- One setting-row vocabulary for labels, value, stepper, lock, die, toggle, selector and colour chips. Do not squeeze the 4-column material rotation shortcuts into 3-column generic lock-grid layout.
- Trim repeated category/tool headings, optional descriptions, and oversized empty trays without hiding essential actions. Small inspectors give canvas height back atomically; full inspector remains scrollable and labelled.
- Draw flow separates Draw → Interpret → Anchors → Apply/Cancel and keeps primary actions reachable; Explore is thumbnails-first, More groups export/metadata tasks, History has Back to tool, Search has visible Close/Escape.
- No minimum hitbox claim without measured geometry; check 412×892, 499/500/790/791 thresholds, short landscape, 100/75/66/50 CSS zoom and browser-native zoom when needed.

## Engineering delivery sequence and acceptance

**1. Symbol system:** review all mappings in this doc and extension sheet; verify at 20/24/28px on cream and dark and disabled/selected backgrounds; no new icon wired to the live app until accepted.

**2. Shell and camera:** brand and navigation; remove top canvas row; side-only camera controls; pixel-safe preview and off-frame path handling; add camera/recipe non-mutation tests.

**3. Inspector:** typed `SettingRow`, complete schema census, dynamic conditional states, search and variation, visible and stable per-panel rainbow sliders; no missing settings or clipped lock/rotate actions.

**4. Complex editors:** manual Draw/Anchors/Smoothing/Extend, interior stack and targeting, material multi-layer, local history, Focus slider A/B prototype. Preserve all baseline behaviors.

**5. Gallery and utilities:** consistent Explore/Saved, More/metadata, notifications, import/export round trips, robust keyboard/screen-reader controls.

A migration PR is not ready unless every declared required/conditional element can be reached, exported path geometry remains correct, tests and screenshot checks pass, and any production deviation from these contracts is documented explicitly. **Do not replace a canonical SVG plate with an image-generated screen.**
