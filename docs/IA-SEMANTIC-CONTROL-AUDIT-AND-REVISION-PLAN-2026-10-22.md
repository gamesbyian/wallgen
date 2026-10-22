# ROYGBIV semantic control audit and revision plan

2026-10-22. Historical design audit based on commit 75c5e1778a5f5789c44ba95098ca7a4c1161b7f8, followed by an implementation checkpoint. The original maps were documentation-only; later PRs #449, #452, #454 and #455 made focused runtime improvements. The audited architecture remains seven categories, 43 tools and 95 canonical settings.

## Implementation checkpoint: selected interior element stays accessible

**C09 partially addressed.** Details retains five specialised element tools for now (Elements, Style, Wave, Placement and Ink & Targets), but every specialist card exposes a compact selector for the **same underlying ordered element**. Switching to another line or band updates its selected stable element ID without mutating the recipe or requiring a return trip to Elements. Selection works even when the element stack is locked; actual edits remain disabled. Normal sync, Undo, imported collections and focus restoration still build controls from canonical `current.interiorElements`.

This is an intermediate improvement, not a claim that the five tool destinations have been consolidated. A full selected-element inspector should be prototyped only after one real compact-phone check, to avoid making the 5-tab workflow shorter at the cost of hiding the colour targets or wave controls.

## Implementation checkpoint: material layer workspaces (current PR)

The previously identified **C08 Layer/Finish fragmentation** is addressed by grouping each texture into **one canonical layer tool with two compact in-card views**: Material (material, coverage, blend) and Finish (strength, scale, rotation). The Texture category therefore changes from seven tool chips to four (Layer 1, Layer 2, Layer 3, Surface), and the whole editor from 43 to **40 named tools**, while retaining **all 95 setting keys** and the same seven categories and five mobile destinations.

The original lockable DOM controls, scope dice, saved material values, enabled flags, optional layer semantics and Undo/restoration remain intact. The two views are mutually exclusive to fit the portrait mobile edit tray without vertical scrolling. Material status indicators and disabled Finish explanations remain attached to the same layer. The old Finish 1–3 search terms resolve to their corresponding layer, with the Finish view shown.

The agent research map `scripts/ia-semantic-audit.mjs` continues to derive the physical owner from the schema and its historical 43-tool snapshot is preserved in the audit provenance. Candidate five-workspace plans remain **unimplemented comparisons**, not a claim that reorganizing all tabs is universally correct. The next candidate is **C09, persistent selected interior-element editing**, ideally with the same original-node/no-duplicate approach and a small phone viewport check.

## Implementation checkpoint, 22 October 2026

This is a historical audit with a **live issue-status supplement**. Treat the statuses below and the source-linked `scripts/ia-semantic-audit.mjs` register as authoritative; the original finding descriptions further down preserve the reasoning at discovery time.

| Finding | Current status | Implemented evidence / next action |
|---|---|---|
| C01: Clearance under Allow Overlaps | **Resolved on main**, PR #452 | `src/app.js::inactiveSettingKeys` disables `scatteredSpacing` when overlap is allowed, retaining its recipe value. |
| C02: Inaccessible Tonal Bands | **Resolved on main**, PR #452 | The Tonal construction is selectable; global random generation still intentionally excludes it. |
| C04: Individual scattered-object edits | **Implemented on main**, PR #449 | The `scatteredObjectEditor` supports selecting an instance, nudging, resizing, resetting, Undo and portable `scatteredOverrides`. Pointer dragging and z-order remain optional. |
| C12: Contour distortion prerequisites | **Partly addressed on main**, PR #454 | `src/editor-effect-availability.js` reflects the same effective active stripe-applied texture-layer filter as the renderer; the visible inactive hint preserves prior setting values. The broader field-gate model remains future work. |
| C13: Ambiguous Variation labels | **Resolved on main**, PR #454 | Layout/Irregularity versus Stripes/Stripe differences, retaining the separate Vary/Reroll action and old search aliases. |
| C07: Exact setting search and goal synonyms | **Partly addressed on main**, PR #455 | Search ranks exact field names, aliases and selected visual-intent phrases, displays the actual category/tool, and Enter focuses the canonical field if active. Multi-result disambiguation remains a follow-up. |
| C03, C05–C06, C08–C11, C14–C17 | **Open or deliberate design choices** | Resolve by the original evidence-based priorities, not all at once. |

**Next scoped change after these merges:** prototype one coherent texture-layer editor (C08) or a persistent interior-element inspector (C09), whichever fits the mobile edit tray without vertical settings scrolling. Search C07 can later gain a short disambiguated result list if single-best-match proves insufficient. Avoid a wholesale seven-category rewrite; protect stable recipe keys, locks, Undo, Saved and exported framing. Existing issue [#444](https://github.com/gamesbyian/wallgen/issues/444) remains the umbrella.

## How the map has changed

The historical navigation map enumerated 40 named tools and 87 setting keys. The integrated main now contains **seven editor categories, 43 tools, 95 schema keys**, plus substantial non-scalar workflows: interior element collection, Draw/Import, reusable geometry library, seeded scattered shapes, colour vision inspection, variation/locks/history, viewport/framing and export.

The semantic interrogation tool adds five connected map layers: (1) unique source home of each setting; (2) 19 independent perceptual domains describing what changes in the image; (3) 16 creative-intention clusters linking settings across menus; (4) 26 source-reviewed condition/prerequisite groups; (5) 21 navigation and asset workflows tagged available, partial or missing. A sixth layer records 17 prioritised code-linked findings. It captures **95/95 keys**; impact and frequency classifications are analyst hypotheses, not human telemetry.

### Query commands

    node scripts/ia-semantic-audit.mjs --audit
    node scripts/ia-semantic-audit.mjs --setting scatteredSpacing
    node scripts/ia-semantic-audit.mjs --setting textureDisplacement
    node scripts/ia-semantic-audit.mjs --goal "give the circles more room"
    node scripts/ia-semantic-audit.mjs --goal "neon light and shadows"
    node scripts/ia-semantic-audit.mjs --mode regions:scattered
    node scripts/ia-semantic-audit.mjs --mode radial
    node scripts/ia-semantic-audit.mjs --relationships
    node scripts/ia-semantic-audit.mjs --findings
    node scripts/ia-semantic-audit.mjs --workflows
    node scripts/ia-semantic-audit.mjs --report
    node scripts/ia-semantic-audit.mjs --audit --json
    node --test tests/ia-semantic-audit.test.js

Setting queries return original/proposed homes, visual domains, impact/frequency estimates, gate conditions, related settings, creative goals and source-linked findings. Goal queries are simple authored keyword matches, not a reliable NLP engine. Mode queries use live canonical tool applicability, **not a full simulated field-disabled state**. The existing app.js inactiveSettingKeys implementation remains the runtime authority. Audit checks source-to-domain coverage and broken references, not human success or aesthetic excellence.

## Priority 1: observable implementation-level mismatches

**C01: Clearance versus overlap.** The scattered shape Minimum Clearance control (scatteredSpacing) is still editable in Allow Overlaps mode, but src/scattered-composition.js applies its computed gap only inside the !overlap collision-rejection branch. src/app.js inactiveSettingKeys does not gate the field when overlap is allowed. Either make this clearly dormant in overlap mode or give clearance a meaningful soft preference; choose after one targeted pair of actual renderings.

**C02: Dead-end tonal construction.** src/editor-schema.js retains the conditional Band Tones tool and tonalContrast, and toolAppliesToScene shows the tool only under construction=tonal, but index.html marks that construction choice hidden and disabled. src/model.js randomizeAllRecipe filters tonal out. Thus normal creation cannot discover it, although imported legacy tonal recipes may still use it. Decide explicitly whether to support tonal as a first-class option or label it as legacy-only; do not delete its saved-state handling.

**C03: Imported silhouette fallback is visually ambiguous.** In src/scattered-composition.js::buildScatteredObjects, absent/invalid imported shape geometry causes the renderer to retain generated circle objects with a diagnostic. src/app.js separately displays the choose-a-silhouette warning. When the UI source says Imported silhouette, circles are an intentional safety fallback but can appear to be the selected source. Provide an obviously provisional preview or empty/choose-asset state without breaking recipe-safe degradation.

**C04: No per-object direct editing for scattered artwork.** src/scattered-composition.js creates a repeatable set from seed and shared distribution settings. There is no persisted select/move/resize override for one circle or shape. This is a major gap for deliberate artistic composition despite the current seven-circle preset working. Implement stable object IDs, selected-object transforms, Undo and embedded recipe snapshots under existing [issue #443](https://github.com/gamesbyian/wallgen/issues/443). This is planned unfinished capability, not regression.

## Priority 2: interface and causality inconsistencies

| ID | Issue | Evidence | Recommended route |
|---|---|---|---|
| C05 | Smallest Shape can exceed Largest Shape without clear effective-range feedback. | Scattered engine maxRadius is clamped to minRadius; two independent 0–100 controls in index.html. | Explain effective range and handle contradictory inputs while preserving saved recipe data. |
| C06 | Dots and Motif Scale tool chips may lead to entirely inactive cards. | editor-tool-applicability.js exposes them for Paths; app.js disables their fields under solid or nondotted modes. | Link to prerequisite motif/line choices, or contextually collapse dormant tools without losing discoverability. |
| C07 | Search returns the first matching applicable tool, not the exact searched setting. | editor-tool-search.js Array.find, editor-layout.js selectEditorTool; duplicate tool names Structure and Variation. | Ranked disambiguated results, exact-setting matches, creative-language aliases, focus to actual input. |
| C08 | Three texture materials are split into six Layer/Finish sibling cards, plus Surface. | editor-schema.js. | Give each texture its own material, coverage, blend, strength, scale and rotation inspector. |
| C09 | Selected interior element editing is distributed across five peer tools. | app.js::syncInteriorUI creates five related cards for one selected object. | Persistent selected-element header and compact Appearance / Rhythm and Placement / Ink and Targets subflow. |
| C10 | Local cast shadows, Glow and global Lighting are spatially separated. | editor-schema.js puts first two under Details, last under Light. | Contextual Light space or clear reciprocal related links while preserving local/global distinction. |
| C11 | Path tab becomes Geometry for other structures, while most Layout tools disappear. | editor-layout.js scene-dependent tab label; editor-tool-applicability.js. | Mode-specific Form and Arrange affordances; don't pretend path-only Layout works on radial/regions. |
| C12 | UI gating misses some causal material prerequisites. | app.js inactiveSettingKeys treats textureDisplacement as path-only, while renderer distortion also needs suitable active stripe-applied texture. | Shared conditional-reason model for fields/search/Focus/dice, verified by small render pairs. |
| C13 | Variation refers to geometric chaos, individual stripe differences and scoped generative Vary/Reroll. | editor-schema.js + editor-layout.js. | Terminology aligned to visual effect: Irregularity, Stripe Differences, Vary/Reroll. |

These do not automatically justify moving all 43 tools. Some require only a truthful disabled state, an explanatory row, or a related-control shortcut. Never drop old field values when a control is dormant.

## Priority 3: intentional boundaries versus potential omissions

- **C14:** Mobile More groups generation, transport, framing and inspection. Colour Vision Preview is implemented on desktop canvas and inside mobile More > Position & info. It is a preview-only tool, not an unimplemented Colour option. Improve discoverability without creating a sixth mobile destination.
- **C15:** Global randomization intentionally starts with only one texture layer: model.js disables layers 2/3. It limits accidental complexity but also means a casual user might never discover multi-layer textures. Evaluate an explicit opt-in rich-material exploration mode rather than defaulting to arbitrary multi-layer clutter.
- **C16:** The user can choose colour stories and reverse their order but cannot freely edit every semantic rainbow colour. This is a possible creative affordance, **not a verified defect**; the seven-role ROYGBIV constraint may be more valuable.
- **C17:** Scattered distribution lacks higher-order positive layout constraints (focal cluster, align, negative-space mask, designed rhythm). Deliver individual-object adjustment first; new procedural knobs need demonstrated artistic use.

## The most meaningful architectural gaps

**Interaction abstraction mismatch:** an interior element or imported geometry asset is an object with identity and lifecycle, not a numerical slider. Treating its edit phases as independent tabs damages continuity. The count of scalar keys dramatically underrepresents these workflows.

**Contextual relationship mismatch:** a texture's coverage, blending and relief are one material decision; a cluster of colour bands involves width, spacing, outlines and background; lighting includes global and local contributions. The user's most consequential co-adjustments currently cross unnecessary navigation boundaries.

**Incomplete availability semantics:** a tool may be applicable in the renderer but each setting inside it is temporarily inert. A mode-specific tab should either expose meaningful choices, teach the enabling action or disclose why there is nothing to do. Current source has separate tool-level and field-level rules, so source truth needs to be combined rather than guessed by a semantic layer.

**Two meanings of position:** artwork nudging changes composition, world-frame pan changes the exported framing, whereas preview zoom and safe-area overlay are inspection controls. Do not conflate them as simply Zoom and Move. Saved wallpapers and Saved geometry assets are also distinct resources and should remain separately represented.

**Search lacks a human conceptual bridge:** natural goals ("more breathing room", "rougher print", "less muddy glow") are combinations of settings. The semantic graph offers inspectable synonyms and related actions, but runtime search has only direct tool/setting names and legacy aliases.

## Revision programme, with explicit boundaries

### Phase A: repair accuracy with minimal UI churn (issue #444)

1. P1 source-backed mismatches C01–C03 and contradictory shape-size feedback C05; couple of controlled before/after render probes, not a screenshot atlas.
2. Fix misleading dormant controls C06 and C12, including conditional explanation for stripe-applied contour distortion. Persist existing values/locks and restore them when applicable.
3. Clarify multiple Variation meanings C13, with legacy aliases retained. Confirm users can undo, save and restore the same recipe.
4. Audit source-exposed and hidden controls against new semantic graph after each feature merge, not old static 40/87 snapshots.

### Phase B: three small presentation prototypes, using original source nodes

1. Cohesive **per-texture layer cards** rather than alternating Layer/Finish cards.
2. Persistent selected **interior object inspector** rather than five equal sibling destinations.
3. Shared **Lighting** context containing global ambience, local cast shadows and Glow (or clearly marked cross-links where phone space demands).
4. **Goal search and contextual Related** jumps that focus the canonical underlying field, never duplicate mutable inputs.
5. Compare a source-preserving hybrid against the older seven-category and proposed five-workspace designs, with a blind first-click and change-the-artwork exercise, not artificial agent “user success rates”.

### Phase C: fulfil artistic authoring affordances (issue #443)

- Direct position and size editing of individual scattered instances with stable identifiers, reversible edits and portable recipe fields.
- Library asset selector accessible naturally from Build/Draw/Import, while remaining separate from finished wallpaper favourites.
- Only then consider mixing independently chosen assets and adding richer distribution constraints. Coordinate texture fidelity with [#445](https://github.com/gamesbyian/wallgen/issues/445).

### Evidence budget and acceptance

One or two phone-sized real-interface observations, a couple of representative render pairs for conditional claims, and a few tight unit checks per behavioral change. A documentation-only map needs no huge CI or visual matrix. Before any UI refactor, preserve every stable field, saved geometry and favourites, seed/Undo/lock behavior, navigation accessibility and rendering/export semantics.

Suggested blind intent trials: "make scattered circles overlap but leave more breathing room"; "make a wavy dotted stripe pattern"; "put a hole in an off-centre pinwheel"; "make stained-glass borders heavier"; "make texture push actual contours"; "reduce muddiness without changing overall light"; "move just the red circle"; "reuse yesterday's saved silhouette"; "preview colour vision without changing the exported PNG"; "vary the shape but keep my palette".

## Source and related authorities

[Source editor schema](../src/editor-schema.js), [editor navigation](../src/editor-layout.js), [live tool applicability](../src/editor-tool-applicability.js), [live field inactive rules](../src/app.js), [setting search](../src/editor-tool-search.js), [scattered object generator](../src/scattered-composition.js), [geometry library](../src/geometry-library-ui.js), [colour vision preview](../src/colour-vision-preview.js), [current-main IA supplement](IA-INTEGRATED-CURRENT-MAIN-2026-10-22.md), [historical full atlas](HUMAN-CENTRED-NAVIGATION-MAP-2026-10-22.md), [agent field guide](AGENT-HUMAN-EXPECTATIONS-AND-CREATIVE-COMPOSITION.md), [semantic interrogation source](../scripts/ia-semantic-audit.mjs), [focused integrity test](../tests/ia-semantic-audit.test.js), [UX issue #444](https://github.com/gamesbyian/wallgen/issues/444).
