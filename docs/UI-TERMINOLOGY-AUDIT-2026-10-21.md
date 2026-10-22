# ROYGBIV UI language audit: sections, tools, settings and actions

Date: 2026-10-21 (America/Edmonton). Base: `main` commit `ec35ea7540978e6459af044da31615afeac89612`. **Review-only proposal. No runtime UI, recipe, accessibility label or test was changed.**

## Evidence and governing principles

This audit reads the live source hierarchy in `src/editor-schema.js` and its placement in `src/editor-layout.js`, the original labels in `index.html`, behavior in `src/app.js`, `src/model.js`, `src/scoped-random.js`, `src/mobile-studio.js`, `src/mobile-preview-tools.js`, `src/editor-tool-applicability.js` and the dynamic element/drawing/import components. It considers the 7 currently defined categories, all 40 tools, all 87 editor-schema setting keys (including the 2 hidden layer enable flags), plus source toolbar controls `family` and `primesOnly`, navigation, gallery, drawing, export, metadata, and mobile More groups.

Naming standard: (1) describe the *rendered effect or performed action*, not the variable/implementation; (2) favor familiar visual-editor language; (3) shorten within unambiguous context, not at the expense of standalone accessibility; (4) keep one noun per concept across visible labels, assistive names, status text and documentation; (5) preserve stable recipe keys, IDs, localStorage, share/PNG interoperability and event contracts. Avoid changing names merely for novelty.

External precedents:
- [Nielsen Norman Group: match system language to user concepts](https://www.nngroup.com/articles/match-system-real-world/)
- [Material writing: concise, familiar, direct interface text](https://m1.material.io/style/writing.html) and [2026 Material writing codelab](https://codelabs.developers.google.com/codelabs/material-communication-guidance)
- [Figma: design properties and layered appearance](https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar)
- [Adobe Illustrator: appearance, fills/strokes, effects](https://helpx.adobe.com/uk/illustrator/using/appearance-attributes.html) and [blend modes](https://helpx.adobe.com/illustrator/using/transparency-blending-modes-alt.html)
- [Canva: a safe zone is inside an edge; bleed is outside the trim](https://www.canva.com/help/margins-bleed-crop-marks/)

## 1. Navigation and category names

**Mobile destinations: KEEP all five**: Studio (unobscured canvas), Edit (source-control inspector), Explore (generated contact sheet), Saved (device favourites), More (advanced utilities). Renaming Saved to Favourites would be more exact but much longer; keep the compact familiar destination and clarify its scope in an empty-state line: "Saved on this device." Preserve brand R.O.Y.G.B.I.V. and Colour spelling.

| Source category (stable ID) | Visible now | Recommendation | Judgment |
|---|---|---|---|
| `layout` | Layout | **Layout** (KEEP) | Conventional placement and overall structure |
| `path` | Path | **Path / Geometry** (KEEP) | Source dynamically calls this Geometry for radial and region constructions; preserve adaptive wording |
| `stripes` | Shapes | **Stripes** (PROPOSE) | Only exposed for path/ribbon construction; Shapes suggests unrelated polygon objects |
| `details` | Details | **Details** (KEEP) | Interior decoration, outlines, dividers, stripe shadows, glow |
| `colour` | Colour | **Colour** (KEEP) | Existing Canadian English; don't mix Color and Colour |
| `material` | Material | **Texture** (PROPOSE) | Paper/textile/grain overlays; mainstream visual editors call these textures; shortens name |
| `effects` | Effects | **Light** (PROPOSE / TEST) | Only Lighting is present; avoid the implication that glow and stripe shadows live here. Consider future category expansion before final choice |

**Important conditional caveat:** the tab called Path changes its visible name to Geometry for non-path structures; the Shapes tab is disabled there. "Stripes" is therefore a particularly safe, honest replacement for Shapes in the path-only category. The broader Geometry concept and actual path-geometry tool should remain distinct.

**Effects and Lighting:** Because Effects contains only the Lighting tool while glow and stripe shadows live under Details, the current category promises more than it holds. Preferred small-screen candidate: **Light**. A possible second choice is **Lighting**. If new non-lighting effects are imminent, retain Effects and put a better explanatory heading in the category; do not rename until the taxonomy decision is made.

## 2. Exhaustive named-tool review

The table is generated from the canonical 40-tool schema, not a legacy four-tab drawing or an imagined interface. Unlisted replacements explicitly mean **Keep**.

| Category | Current tool (stable ID) | Outcome | Behavior / reason |
|---|---|---|---|
| Layout | Canvas structure (`structure-mode`) | **Structure** — PROPOSE | Tool groups the canvas-construction type selector; label the selector **Design type** so header and setting are distinct |
| Layout | Arrangement (`arrange`) | **Keep** | Current terminology correctly groups 3 settings. |
| Layout | Direction (`direction`) | **Keep** | Current terminology correctly groups 4 settings. |
| Layout | Variation (`variability`) | **Keep** | The group provides context for a Chaos slider; a duplicate Chaos tool and slider would add no information. Explain that it affects controlled geometric randomness, not Vary/Reroll scope |
| Path | Geometry (`geometry`) | **Keep** | Current terminology correctly groups 3 settings. |
| Path | Radial rays (`rays`) | **Keep** | Current terminology correctly groups 3 settings. |
| Path | Ray shape (`ray-shape`) | **Ray detail** — PROPOSE | Controls twist, coverage and centre opening |
| Path | Origin (`origin`) | **Keep** | Current terminology correctly groups 2 settings. |
| Path | Regions (`regions`) | **Keep** | Current terminology correctly groups 2 settings. |
| Path | Region detail (`region-detail`) | **Keep** | Current terminology correctly groups 2 settings. |
| Path | Constraints (`safety`) | **Keep** | Current terminology correctly groups 2 settings. |
| Path | Turns (`turn`) | **Keep** | Current terminology correctly groups 2 settings. |
| Path | Single loop (`single-loop`) | **Loop** — PROPOSE | One loop mode; shorter |
| Path | Shape detail (`shape-details`) | **Keep** | Current terminology correctly groups 3 settings. |
| Path | Endpoints (`ends`) | **Keep** | Current terminology correctly groups 3 settings. |
| Shapes | Structure (`structure`) | **Keep** | Current terminology correctly groups 3 settings. |
| Shapes | Patterns (`patterns`) | **Keep** | Current terminology correctly groups 3 settings. |
| Shapes | Marks (`marks`) | **Dots** — PROPOSE | Both controls are dot diameter and spacing |
| Shapes | Motif scale (`motif-scale`) | **Keep** | Current terminology correctly groups 2 settings. |
| Shapes | Band tones (`tone`) | **Keep** | Current terminology correctly groups 1 settings. |
| Shapes | Character (`character`) | **Variation** — PROPOSE | Changes stripe individuality and pattern differences; Character is vague |
| Details | Elements (`interior`) | **Keep** | Current terminology correctly groups contextual element controls. |
| Details | Element style (`interior-style`) | **Style** — PROPOSE | Element shape, line/band type and stroke; parent category supplies context |
| Details | Element motion (`interior-motion`) | **Wave** — PRIORITY | Amplitude, frequency and phase of *static* decoration, no motion/animation |
| Details | Placement (`interior-placement`) | **Keep** | Current terminology correctly groups contextual element controls. |
| Details | Colour targets (`interior-targets`) | **Ink & targets** — PROPOSE | Combines stroke colour and the ROYGBIV target checkboxes |
| Details | Outlines (`outlines`) | **Keep** | Current terminology correctly groups 3 settings. |
| Details | Dividers (`dividers`) | **Keep** | Current terminology correctly groups 2 settings. |
| Details | Shadows (`shadows`) | **Keep** | Current terminology correctly groups 3 settings. |
| Details | Glow (`glow`) | **Keep** | Current terminology correctly groups 1 settings. |
| Colour | Rainbow (`rainbow`) | **Keep** | Encompasses the Palette selector and Reverse colour order toggle; changing tool and field both to Palette would duplicate words |
| Colour | Background (`canvas`) | **Keep** | Current terminology correctly groups 1 settings. |
| Material | Layer 1 (`layer1`) | **Keep** | Current terminology correctly groups 4 settings. |
| Material | Finish 1 (`finish1`) | **Keep** | Current terminology correctly groups 3 settings. |
| Material | Layer 2 (`layer2`) | **Keep** | Current terminology correctly groups 4 settings. |
| Material | Finish 2 (`finish2`) | **Keep** | Current terminology correctly groups 3 settings. |
| Material | Layer 3 (`layer3`) | **Keep** | Current terminology correctly groups 3 settings. |
| Material | Finish 3 (`finish3`) | **Keep** | Current terminology correctly groups 3 settings. |
| Material | Surface (`surface`) | **Keep** | Current terminology correctly groups 2 settings. |
| Effects | Lighting (`lighting`) | **Keep** | Current terminology correctly groups 4 settings. |

### Texture layer/finish pairing

"Layer 1 / Finish 1" (and 2/3) is internally consistent, but "Finish" is unusual for controls that only change **strength, scale, rotation**. Alternatives: "Texture 1 / Adjust 1" (compact but "Adjust" is generic), or "Layer 1 / Settings 1" (familiar but repetitive). **Hold the existing pair** until a screenshot and label comprehension trial shows a clear winner. A more impactful quick win is to remove "Layer 1/2/3" from *the individual scalar labels* when their contextual tool heading and assistive group identify the layer.

## 3. Exhaustive editor-setting disposition

There are **87 unique keys** in `EDITOR_CATEGORIES`; two are hidden state switches (`textureLayer2Enabled` and `textureLayer3Enabled`) and have no direct independent setting label. `family` (starting style) and `primesOnly` (generation constraint) sit outside the ordinary category schema. Every defined editor key is accounted for below. "Keep" means the actual current user-visible label remains sensible, not that a lower-level engine key should be exposed.

| Category/tool | Stable setting key | Current source label | Outcome |
|---|---|---|---|
| Layout / Canvas structure | `structure` | Canvas structure | **Design type** (PROPOSE) — Three genuinely different construction modes |
| Layout / Arrangement | `composition` | Composition | **Keep current label** |
| Layout / Arrangement | `repeatCount` | Rainbow repetitions | **Repeats** (PROPOSE) — Counts 2–6 rainbow groups |
| Layout / Arrangement | `repeatSpacing` | Repeat spacing | **Keep current label** |
| Layout / Direction | `orientation` | Direction | **Keep current label** |
| Layout / Direction | `diagonalRotation` | Diagonal rotation | **Rotation** (CONTEXTUAL) — Inside Direction, a shorter label works only if the relative-angle hint stays |
| Layout / Direction | `mirrorHorizontal` | Mirror horizontally | **Keep current label** |
| Layout / Direction | `mirrorVertical` | Mirror vertically | **Keep current label** |
| Layout / Variation | `chaos` | Controlled chaos | **Chaos** (PROPOSE) — Conventional creative-control label; remove Controlled |
| Path / Geometry | `geometry` | Path geometry | **Keep current label** |
| Path / Geometry | `shapeFrequency` | Shape frequency | **Bend frequency** (PROPOSE) — Low = broad bends; high = tight bends, as existing help says |
| Path / Geometry | `shapeDepth` | Shape depth | **Bend depth** (PROPOSE) — Amplitude of geometry deformation |
| Path / Radial rays | `radialMode` | Radial design | **Keep current label** |
| Path / Radial rays | `rayCount` | Ray count | **Keep current label** |
| Path / Radial rays | `rayRotation` | Ray rotation | **Keep current label** |
| Path / Ray shape | `rayTwist` | Ray twist | **Keep current label** |
| Path / Ray shape | `rayCoverage` | Ray coverage | **Keep current label** |
| Path / Ray shape | `rayCore` | Centre clearance | **Centre gap** (PROPOSE) — Inner opening rather than unclear Clearance |
| Path / Origin | `fieldCenterX` | Origin X | **Keep current label** |
| Path / Origin | `fieldCenterY` | Origin Y | **Keep current label** |
| Path / Regions | `regionMode` | Region layout | **Keep current label** |
| Path / Regions | `regionCount` | Region complexity | **Region count** (PROPOSE) — Controls discrete region count, not abstract complexity |
| Path / Region detail | `regionJitter` | Region irregularity | **Irregularity** (CONTEXTUAL) — Within Region detail; source label is Region irregularity |
| Path / Region detail | `regionSides` | Nested shape sides | **Shape sides** (PROPOSE) — Keep 0 = circle and 3–12 = polygon hint; 'Polygon sides' alone hides the zero mode |
| Path / Constraints | `geometrySafety` | Preserve stripe coherence | **Keep current label** |
| Path / Constraints | `crossingMode` | At intersections | **Crossing order** (PROPOSE) — Over, under, weave at intersections |
| Path / Turns | `turnRadius` | Hairpin radius | **Keep current label** |
| Path / Turns | `hairpinAngle` | Hairpin turn angle | **Keep current label** |
| Path / Single loop | `loopRadius` | Loop radius | **Keep current label** |
| Path / Single loop | `loopSweep` | Loop turn angle | **Keep current label** |
| Path / Shape detail | `stepCount` | Step count | **Keep current label** |
| Path / Shape detail | `chevronSharpness` | Chevron sharpness | **Keep current label** |
| Path / Shape detail | `loopAspect` | Loop aspect | **Keep current label** |
| Path / Endpoints | `pathLength` | Floating stripe length | **Stripe length** (CONTEXTUAL) — Only for floating stripes; clarify in contextual help |
| Path / Endpoints | `endTaper` | Taper stripe ends | **End taper** (PROPOSE) — Short established visual-editing term |
| Path / Endpoints | `extendDrawnPath` | Extend open drawn path | **Extend open paths** (PROPOSE) — Also applies to imported paths; current drawn-only label omits that |
| Shapes / Structure | `construction` | Stripe construction | **Stripe type** (PROPOSE) — Ribbon, line, tonal stripe construction |
| Shapes / Structure | `stripeWidth` | Stripe thickness | **Stripe thickness** (KEEP) — Matches actual width/thickness rendering |
| Shapes / Structure | `spread` | Stripe spacing | **Stripe spacing** (KEEP) — Distinguishes spacing from thickness |
| Shapes / Patterns | `motif` | Stripe pattern | **Keep current label** |
| Shapes / Patterns | `lineStyle` | Stripe line style | **Line style** (PROPOSE) — Continuous/dotted/dashed; category supplies Stripe context |
| Shapes / Patterns | `patternHomogeneity` | Pattern homogeneity | **Pattern uniformity** (PROPOSE) — More familiar; same behavior across 0–100% |
| Shapes / Marks | `dotSize` | Dot diameter | **Keep current label** |
| Shapes / Marks | `dotSpacing` | Dot spacing | **Keep current label** |
| Shapes / Motif scale | `motifSize` | Motif size | **Keep current label** |
| Shapes / Motif scale | `motifFrequency` | Motif density | **Motif density** (KEEP) — Already describes repeats/density |
| Shapes / Band tones | `tonalContrast` | Tonal contrast | **Keep current label** |
| Shapes / Character | `individuality` | Stripe individuality | **Stripe variation** (PROPOSE) — Describes per-stripe geometric differences; avoids personification |
| Shapes / Character | `overridePatternHomogeneity` | Override pattern homogeneity with stripe individuality | **Vary patterns too** (PROPOSE / TEST) — Meaning is to let individuality affect motif size/rotation/opacity; must preserve full help text |
| Details / Outlines | `outline` | Stripe outlines | **Outline style** (PROPOSE) — Current Stripe outlines includes style options, not just on/off |
| Details / Outlines | `gap` | Outline thickness | **Keep current label** |
| Details / Outlines | `outlineBuffer` | Outline buffer | **Outline offset** (PROPOSE) — Gap between stripe and outline; conventional stroke-offset term |
| Details / Dividers | `dividerColor` | Region dividers | **Divider colour** (CONTEXTUAL) — Options select divider colour (including none) |
| Details / Dividers | `dividerWidth` | Divider thickness | **Keep current label** |
| Details / Shadows | `stripeShadowStrength` | Shadow strength | **Strength** (CONTEXTUAL) — Within Shadows tool, no need for Shadow prefix |
| Details / Shadows | `stripeShadowSoftness` | Shadow softness | **Softness** (CONTEXTUAL) — Within Shadows tool, no need for Shadow prefix |
| Details / Shadows | `stripeShadowDirection` | Shadow light source | **Light direction** (CONTEXTUAL) — Within Shadows tool, sets shadow light source |
| Details / Glow | `glow` | Neon glow | **Glow** (CONTEXTUAL) — Within Glow tool, Neon glow may be shortened |
| Colour / Rainbow | `palette` | Colour story | **Palette** (PROPOSE) — Current Colour story is evocative but not an actionable property label |
| Colour / Rainbow | `reverseStripes` | Reverse stripe order (violet first) | **Reverse colour order** (PROPOSE) — Works beyond stripe layouts; retain violet-first explanatory hint |
| Colour / Background | `background` | Background | **Keep current label** |
| Material / Layer 1 | `material` | Texture layer 1 | **Keep current label** |
| Material / Layer 1 | `textureCoverage` | Apply texture to | **Apply to** (CONTEXTUAL) — Already inside texture layer tool |
| Material / Layer 1 | `textureBlend` | Blend mode | **Keep current label** |
| Material / Layer 1 | `textureLayer2Enabled` | (hidden layer flag) | **Internal, keep hidden** (material selection controls activation) |
| Material / Finish 1 | `textureStrength` | Layer 1 strength | **Strength** (CONTEXTUAL) — Within Finish 1 card, removes redundant Layer 1 |
| Material / Finish 1 | `textureScale` | Layer 1 scale | **Scale** (CONTEXTUAL) — Within Finish 1 card |
| Material / Finish 1 | `textureRotation` | Layer 1 rotation | **Rotation** (CONTEXTUAL) — Within Finish 1 card |
| Material / Layer 2 | `material2` | Texture layer 2 | **Keep current label** |
| Material / Layer 2 | `textureCoverage2` | Apply texture to | **Apply to** (CONTEXTUAL) — Already inside texture layer tool |
| Material / Layer 2 | `textureBlend2` | Blend mode | **Keep current label** |
| Material / Layer 2 | `textureLayer3Enabled` | (hidden layer flag) | **Internal, keep hidden** (material selection controls activation) |
| Material / Finish 2 | `textureStrength2` | Layer 2 strength | **Strength** (CONTEXTUAL) — Within Finish 2 card, removes redundant Layer 2 |
| Material / Finish 2 | `textureScale2` | Layer 2 scale | **Scale** (CONTEXTUAL) — Within Finish 2 card |
| Material / Finish 2 | `textureRotation2` | Layer 2 rotation | **Rotation** (CONTEXTUAL) — Within Finish 2 card |
| Material / Layer 3 | `material3` | Texture layer 3 | **Keep current label** |
| Material / Layer 3 | `textureCoverage3` | Apply texture to | **Apply to** (CONTEXTUAL) — Already inside texture layer tool |
| Material / Layer 3 | `textureBlend3` | Blend mode | **Keep current label** |
| Material / Finish 3 | `textureStrength3` | Layer 3 strength | **Strength** (CONTEXTUAL) — Within Finish 3 card, removes redundant Layer 3 |
| Material / Finish 3 | `textureScale3` | Layer 3 scale | **Scale** (CONTEXTUAL) — Within Finish 3 card |
| Material / Finish 3 | `textureRotation3` | Layer 3 rotation | **Rotation** (CONTEXTUAL) — Within Finish 3 card |
| Material / Surface | `textureDisplacement` | Texture displacement | **Contour distortion** (PRIORITY) — Changes actual stripe contour edges even with no material selected, as on-screen help explicitly states |
| Material / Surface | `brushRoughness` | Pigment roughness | **Keep current label** |
| Effects / Lighting | `lightingMood` | Lighting mood | **Mood** (CONTEXTUAL) — Inside Lighting tool only; source label Lighting mood |
| Effects / Lighting | `lightDirection` | Light from | **Direction** (CONTEXTUAL) — Inside Lighting tool only; source label Light from |
| Effects / Lighting | `lightStrength` | Light intensity | **Intensity** (CONTEXTUAL) — Inside Lighting tool only; source label Light intensity |
| Effects / Lighting | `shadowStrength` | Canvas shade | **Shading** (CONTEXTUAL) — Inside Lighting tool only; source label Canvas shade |

Additional source controls: `family`: rename the visible "Visual family" to **Starting style** while removing the adjacent repeated Starting style heading; the chosen preset materializes actual editable settings. `primesOnly`: **keep Primes only**, plus existing exact hint that it constrains percentage and texture-angle randomization (not all numeric settings). Do not collapse its wording to "Prime mode" without explanation.

### Settings that should NOT lose technical precision

Keep **Seed**, **Geometry**, **Blend mode**, **Opacity**, **Anchor point**, **Phase**, **Radial rays**, **Ray rotation**, **Origin X/Y**, **Tonal contrast**, **Chevron sharpness**, **Outline thickness**, **Loop aspect**, **Colour targets** *only if you reject Ink & targets*, and **Material layer** in explanatory text where materially accurate. They distinguish controls that genuinely do different things. "Opacity" is conventional and shorter than "Transparency" with an inverse scale. Keep **Mirror horizontally/vertically** explicitly directional. Keep separate **Stripe thickness** and **Stripe spacing**, and keep separate **Move composition** and **Move view frame**: both affect final PNG framing, but only the first changes the artwork offset. The separate camera controls are persisted in the recipe.

## 4. Other section names and dynamic controls

| Current UI label | Recommendation | Rationale and migration condition |
|---|---|---|
| **Bleed** button on preview | **Safe area** (HIGH) | Source draws an inset 90% guide, with no effect on recipe/export. Bleed conventionally sits *outside* trim; this is an inner safe-area/margin guide. Tooltip/aria: "Show 90% safe-area guide (preview only)". |
| **Fit whole wallpaper at 100%** | **Reset view** (HIGH, accessible name), icon may stay | Action resets persisted view zoom/pan; distinguish reset of frame from resizing artwork. Help: "Reset zoom and frame position". Confirm actual zoom contract in browser first. |
| **Custom path** drawing heading | Keep | Distinguishes a drawn/imported path from procedural geometry. |
| **Edit points**, **Add point**, **Delete point**, **Make corner**, **Make smooth**, **Re-smooth**, **Undo point**, **Redraw**, **Use path** | Keep | Drawing verbs are compact and match actual actions. "Geometric" is a mode, not an action, which is okay with selectable two-state presentation. |
| **Detected geometry** in image import | **Detected paths** | User chooses among image-derived path candidates, not generic geometry properties. |
| **Edit / Use path** | **Edit path** (test) | Current single action loads image-derived path into the draw/editor flow; tooltip clarifies application afterward. Keep "Use angle" separate. |
| **Create & seed** (More group) | **Generate** (test) | Groups Randomize, Generate 12, New variation, Seed. "Generate" is a scannable umbrella. |
| **Import, export & share** (More group) | **Files & sharing** | Actual content includes restore from PNG/JSON, download, metadata and portable links. |
| **Position & design details** (More group) | **Position & info** | Includes two distinct motion pads plus recipe readout; shorter with same promise. |
| **More tools** heading inside More | **More** or omit duplicate heading | Parent destination already says More; avoid stacked repeated words where hierarchy is clear. |
| **Generate 12 variations in Explore** | **Generate 12** (visible) | In More generation group; retain "Generate 12 wallpapers in Explore" in accessible action name / hover hint. |
| **Restore design from PNG or JSON** | **Import design** | Standard action verb; retain explicit file types in aria-label or adjacent helper text. |
| **Copy design link**, **Copy recipe JSON**, **Save recipe JSON**, **Download PNG** | Keep | Users need to distinguish sharable URL, recipe JSON, and a real picture file. |
| **Save or remove favourite** | **State-dependent Add to favourites / Remove from favourites** (HIGH) | An icon-only toggle should announce *what a click will do*, not two mutually exclusive actions; mirror source button, preview shortcut and editor proxy while preserving aria-pressed. |
| **Focus** / **All controls** | Keep | True one-slider mode versus whole inspector; role-specific accessible descriptions are already more explicit. |
| **Reroll** / **Vary** | Keep with clear helper: **New values / Small changes** | Actual behavior: Reroll swaps eligible values; Vary mutates around current ones with Gentle/Moderate/Wild strength. Visible compact names are efficient; helper must explain scope and respect for locks. |
| **Tool** / **Category** random-action chips | Keep visible compact names, improve action-specific accessible names | Tool-die says "Randomize [tool]" already. Category die should include the actual category. With Vary active, accessible verbs should change to "Vary" rather than always "Randomize". |
| **Element** selector (line/band) | **Type** | Under Details > Style, line/band is the element *type*; "Element" is too generic. |
| **Geometry** selector for a decorative element | **Shape** | Straight/wave/zigzag/loop are its shape choices, not a global geometry setting. |
| **Wave amplitude / Frequency / Phase**, dynamic labels | Keep scalar names | Actual static shape parameters; renamed tool Wave supplies correct context. |
| **Line width**, **Band width %**, **Position**, **Opacity**, **Stroke**, **Ink** | Keep | Meaningful and precise given element type and placement. |
| **Black theme** | **Dark theme** (optional) | Dark mode is conventional wording; Cream theme remains specific. Compare exact implementation before change; the paint is near-black. |
| **Saved wallpapers / Explore variations** headings | Keep | Correct separate gallery modes; avoid labelling saved as downloaded. |

### The two distinct kinds of 'variation' matter

- **New variation** in the main action tray changes **only the seed**, preserving the current controls and creating a new rendering. The user-facing name is defensible, but a tooltip should say "New seed; keep settings."
- **Random / Randomize all** regenerates setting values (subject to locks and the editorial geometry-safety guard); it is not equivalent to New variation.
- **Reroll / Vary** in Edit are confined to the selected category, tool, or setting, with lock and inactive-state respect.
- **Generate 12** builds a contact sheet of twelve different *seeds* from the current settings. Do not label it "Randomize 12 settings".
- **Saved** is locally saved favourites, not files already downloaded as PNGs.

A naming rollout must preserve those differences. Replacing them all with "Shuffle" would actively destroy discoverability.

## 5. Suggested implementation sequence

1. **Highest-semantic-error PR, independent of large reorganizations:** Safe area replacing Bleed (visible, tooltip, accessible label); static Wave replacing Element motion; Contour distortion replacing Texture displacement; image import Detected paths; state-specific favourite button names. Preserve saved data and icon/DOM identity.
2. **Taxonomy PR:** Shapes → Stripes, Material → Texture, Effects → Light (conditional on future-effects roadmap); reorganize *names only*, with same IDs and tool eligibility. Validate compact 412×892 and 360-wide displays, category tab spacing, horizontal scrolling, and screen-reader names.
3. **Focused setting-label PR:** Palette, Repeats, Bend frequency/depth, Centre gap, Region count, Pattern uniformity, Extend open paths, Outline offset; short contextual material and lighting labels. Preserve all source form controls and lock buttons.
4. **Secondary copy PR:** More group headings, import and Generate 12 labels, dynamic element Type/Shape, theme and Focus/Reroll help, source docs/readme, search synonyms.
5. **A/B test:** Finish vs Adjust texture subtools, Effect(s) category label, and advanced "Stripe variation" wording. Prioritize first-try correctness over personal aesthetic preference.

### Acceptance contract (required before any runtime merge)

- Every one of the 40 tool IDs, all 87 schema keys, both external controls, and all hidden/conditional cases remain reachable with matching expected effects. Internal IDs and recipe JSON **never change**.
- Search must accept **both old and new words** for at least one release; stale recipes and bookmarks need no migration. Help, status messages, history, screen readers, tooltips and empty states use the same vocabulary.
- Verify actual Chromium mobile widths (360, 412, 499, 500, 790, 791), cream/dark, path/radial/region, enabled/disabled/locked, and keyboard selection, especially the seven-tab rail and dynamic tools.
- Accessible names must remain meaningful **outside** visual category context. If visible label is "Strength", the underlying control must be announced as e.g. "Texture layer 2 strength", not one of three indistinguishable Strength sliders.
- No control identity changes, no reparenting or altered render semantics, no changes to `src/model.js` schema, PNG metadata, seed determinism, sharing, stored favourites or Undo.
- Source-bound screenshots; human language comprehension review is a final quality gate, not a substitute for automated source-contract checks.

## Scope and limitations

This is a code-and-design-references naming review against the above main SHA; it is **not** live physical-device research, an exhaustive localization audit, or verified before/after usability testing. The active UI includes conditional source controls; historical `docs/ui-reference/source-control-inventory.json` calls its own snapshot non-exhaustive. Some labels should change only *with contextually accurate accessibility names*, and some should remain stable to avoid needless retraining. High-confidence corrections are separated from alternatives requiring a screen-size or comprehension comparison.

Counts derived from actual `EDITOR_CATEGORIES`: 7 categories, 40 tools, 87 unique mapped setting keys. The two external source controls are `family` and `primesOnly`.
