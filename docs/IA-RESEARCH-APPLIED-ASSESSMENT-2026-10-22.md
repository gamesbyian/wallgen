# ROYGBIV: applied HCI / creative composition IA assessment

## Post-research implementation and evidence update (2026-10-22)

**Current `main` checkpoint:** 7 Edit categories, **40 named tool cards, 95 canonical schema setting keys**; separate dynamic interior-element objects, Shape & Path Library, five mobile destinations. This supersedes the historical 40/87 and intermediate 43/95 maps for **live navigation**. Old snapshots remain historical research records, not today's menu specification. The original recipe/PNG/Saved identifiers were not migrated for these navigation fixes.

**Shipped and tested:** [#452](https://github.com/gamesbyian/wallgen/pull/452) truthful overlap/tonal choice; [#454](https://github.com/gamesbyian/wallgen/pull/454) contour prerequisites / Variation naming; [#455](https://github.com/gamesbyian/wallgen/pull/455) exact-field search and selected artistic-intent terms; [#459](https://github.com/gamesbyian/wallgen/pull/459) unified Texture Layer 1–3 with Material/Finish views (**43→40 tool cards**); [#460](https://github.com/gamesbyian/wallgen/pull/460) same selected interior element switchable in Style/Wave/Placement/Ink & Targets; [#461](https://github.com/gamesbyian/wallgen/pull/461) honest scattered size and imported-placeholder feedback; [#462](https://github.com/gamesbyian/wallgen/pull/462) direct Light/Shadow/Glow links; [#463](https://github.com/gamesbyian/wallgen/pull/463) dormant Dots/Motif Scale activation routes; [#465](https://github.com/gamesbyian/wallgen/pull/465) deliberate Design Type → relevant Geometry next step. All applicable existing PR Node CI passed; **a new physical-phone usability or multi-breakpoint visual acceptance was not run for these changes**.

**Outstanding, not silently closed:** C07 search multiple-match disambiguation and keyboard flow; C09 optional reduction of the five interior-element *tool* destinations into a cohesive selected-object inspector (persistent selection is already shipped); C10 evaluate whether direct lighting links suffice before making a giant mixed-effects card; C11 optional intent-first Arrange/Form prototype; C03 decision on temporary silhouette placeholder versus alternative empty state; targeted Pixel portrait fit, screen-reader/touch/restore checks for the recent controls; review other live semantic findings C14–C17 before marking them inapplicable. Remain within a small evidence budget and avoid compulsory CI screenshot matrices. Main [roadmap](docs/ACTIVE-PRODUCT-ROADMAP-2026-10-22.md) and [UX queue](docs/UI-REDESIGN-IMPLEMENTATION-QUEUE.md) are the operational tracking authorities; [#444](https://github.com/gamesbyian/wallgen/issues/444) remains the umbrella.

For dates and historical examples, read all subsequent sections below as **snapshots at their stated commits**. In particular, mentions of six distinct Layer/Finish tools or 43 named tools describe *the pre-#459 application*, and should not be used for new changes. Exact current setting homes must be retrieved from `src/editor-schema.js` and `src/editor-layout.js`. Causality and research insights still apply; the five-workspace concept has not been implemented. See the [live completion queue](UI-REDESIGN-IMPLEMENTATION-QUEUE.md) before work.


---

**2026-10-22 | Experimental design finding; no live navigation changes.**

Read with [HCI and generative-art research field guide](AGENT-HUMAN-EXPECTATIONS-AND-CREATIVE-COMPOSITION.md) and [full 87-setting atlas](HUMAN-CENTRED-NAVIGATION-MAP-2026-10-22.md).

## Evidence boundaries

**Observed in code:** live seven-category source schema, 40 tools, 87 setting keys, source applicability, dynamic interior manager, five mobile destinations; each setting has exactly one current source home. **Modelled:** a candidate five-intent categorization maps the same 87 keys, plus 16 analyst-authored fixed-order tasks. **Unknown:** whether a human expects to discover these categories, can use a compact phone layout faster, or enjoys the resulting creative workflow. No user study, task completion data, mobile prototype or aesthetic preference survey has been conducted. The candidate structure exists in a [pure comparison utility](../scripts/ia-structure-evaluate.mjs), not the production editor.

## 1. Deterministic structure comparison, with caveats

Validation: source and proposed keys each 87, no omissions/duplicates, 16 task routes. The authored script's evaluation functions were executed in an isolated V8 harness against the real schema data with a source-equivalent applicability adapter, confirming 87/87 coverage and the reported totals; the standalone Node CLI was not executed from a checked-out repository in this environment.

| Metric, **not** a human usability measurement | Existing 7-category editor | Proposed 5-intent editor |
|---|---:|---:|
| Total unweighted route-tree edges for the 16 predefined task sequences | **130** | **80** |
| Cross-category switches across those sequences | **12** | **6** |
| Known setting keys represented | 87/87 | 87/87 |
| Tasks | 16 | 16 |

**Interpretation:** The proposed grouping has fewer *theoretical category/tool route transitions for these particular goals*. This figure cannot be reported as clicks saved, seconds saved, mental effort saved, success rate or artistic quality. The tasks were hand-picked to probe suspected friction; different task mixes, tool-tab widths, keyboard shortcuts, persistent selections and users can reverse the result. The sum may be inappropriate as a weighted score until real task frequencies are known.

Example unweighted route distances in schema-level steps:

| Human intention | Current → proposed | Assessment |
|---|---|---|
| Make paths curl, bend and diverge | 10 → 4 | Strong candidate for a contiguous bend/variation cluster |
| Tune dotted motifs | 8 → 2 | Combine Patterns, Dots and Motif Scale in one selected pattern editor |
| Tune radial burst, central hole, offset origin | 6 → 2 | Radial as one contextual instrument, origin accessible while tuning rays |
| Combine glow, local shadow and ambient light | 8 → 2 | Most compelling cross-category Light consolidation |
| Texture two materials | 8 → 4 | Self-contained per-material cards reduce Layer/Finish toggling |
| Make stained glass with separators | 8 → 6 | Some improvement, but design-type/geometry/edges still span three intentions |
| Width, spacing and outline treatment | 6 → 6 | Potential tie: contextual Related controls matter more than category reduction |
| Diagonal rotation and repeated group spacing | 4 → 4 | Current Layout/Direction/Arrangement is already coherent |
| Rework hairpins while protecting geometry | **6 → 8** | **Regression to investigate.** Candidate separates geometry/coherence from Special Paths. A one-size universal Form layout can harm an existing sequence |

The hairpin regression is a useful falsification check: do not select a new hierarchy because its aggregate proxy wins. Adapt a selected-geometry inspector or add a visible Constraints link beside hairpins, then test again.

## 2. Cognitive walkthroughs, explicitly hypotheses

Apply [NN/g four questions](https://www.nngroup.com/articles/cognitive-walkthroughs/): will the user seek the step; notice the control; associate it with goal; perceive appropriate feedback?

### Task A: "Make it neon, but less muddy"

**Current path:** Details → Glow, Details → Shadows, Light → Lighting.

- Goal: a person may reasonably infer that Glow, Shadows and Lighting belong together under "Light" rather than split across Details and Light.
- Notice: only Lighting lives under the current Light category. A person exploring Light for Glow might assume Glow is absent, then hunt through Details.
- Association: "Glow" and "Shadows" are unambiguous individual labels, but "Details" gives weaker scent for atmospheric lighting than for ornaments.
- Feedback: live preview should reveal changes. Need actual browser check for whether all three effects are separately perceivable under selected palette/background; present data is source-level only.
- Candidate **Finish → Light** groups glow, stripe shadow and global ambience. Potential disadvantage: finding Light *under Finish* may be less predictable than a top-level Light tab. Test label scent before adopting.

### Task B: "Make two convincing textile layers"

**Current path:** Texture → Layer 1 → Finish 1 → Layer 2 → Finish 2.

- Goal: users generally reason about one material with its scale/strength/blending, then add the next material if needed.
- Notice: Finish 1 might be read as a physical polish operation rather than controls belonging to Layer 1; separate horizontal tool chips introduce work.
- Association: one layer card containing Material, Coverage, Strength, Scale, Rotation, Blend makes scope and result directly visible.
- Feedback: compare actual canvas at phone resolution; tiny grain can be difficult to see. Disabled third layer must clearly say "No texture" and not misleadingly suggest active material.
- Candidate **Finish → Surface → Layers**. Do not infer an artistic preference for realism, merely improve the ability to adjust the intended material.

### Task C: "Create an off-centre pinwheel with a clear middle"

**Current path:** Layout → Design Type = Radial; Path/Geometry → Radial Rays → Ray Detail → Origin.

- Goal: choose radial composition, then control radial counts, twist, centre and position.
- Notice: changing structure changes applicability and the label Path → Geometry; users need a visible indication of current construction.
- Association: "Origin" is a technical term. "Centre / Position" might be better in radial context, but would need a comprehension test.
- Feedback: pinwheel centre and central gap should change visibly at constant seed; use two controlled renders to assess.
- Candidate **Build → Radial**, **Form → Radial inspector** with the ray and centre controls together. Avoid presenting path-only stripe settings.

### Task D: "Make a broad coherent hairpin"

**Current path:** Path/Geometry → Geometry → Turns → Constraints.

- The proposed Form grouping leaves **Geometry** in Path motion and **Turns, Crossing** in Special paths while **Coherence** remains in Path motion. This task's structural route proxy gets worse.
- A safe alternative: **Form → Path shape → Hairpin** displays the Hairpin Radius, Turn Angle and Preserve Coherence controls together, with Crossings nearby. Keep source fields canonical.
- Only a prototype and a real-user observation can distinguish that contextual layout from a simpler links-based repair to the current editor.

## 3. Three QOC alternatives, no predetermined winner

**Question:** How can a user find and co-adjust artistic variables most naturally while retaining expert depth and mode fidelity?

| Option | Advantages | Failure risks | Low-cost test |
|---|---|---|---|
| **A. Current seven categories, improved cross-links** | Low implementation churn, current location memory preserved, existing labels familiar | Keeps redundant/hard-to-predict Lighting and Layer/Finish splits; related operations still physically far apart | Prototype "Related" links for Glow/Light, Texture Layer/Finish, Geometry/Chaos |
| **B. Five intention-led workspaces (Build/Arrange/Form/Colour/Finish)** | Fewer structural route edges in present model, intuitive outcome verbs, mode-specific grouping possible | Form/Finish become crowded; potential label scent regression for specialist features; Hairpin counterexample | Label-only tree test with 16 task prompts; small phone card prototype; one-user feedback |
| **C. Hybrid: maintain 7 editorial labels but use contextual selected-object inspectors** | Keeps existing high-level tab muscle memory, solves texture/interior fragmentation locally, least code risk | May leave broad cross-section flows; inconsistent depth if not systematically designed | Prototype self-contained texture and selected interior inspector; evaluate against A and B |

**Recommendation at current evidence level:** do not wholesale replace the current seven categories yet. Prototype **C first** for Texture and dynamic Elements; compare **B** in a tree test using the same task prompts. Move Glow/Shadows next to Lighting if a simple label test supports that relationship. Keep the existing structure as the baseline, not an obsolete branch.

## 4. Human evaluation (small, meaningful, not CI theatre)

Use the app owner's actual workflow and a handful of realistic prompts, chosen before seeing the candidate menus:

1. Present the *task, not the target control label*. Write down first category chosen, found tool, and any detours. Do not coach toward the proposal.
2. Preserve the current wallpaper/seed; compare layouts by trying to produce the same rendered intent.
3. Ask **expected before click** ("What do you think this will change?") and **observed after click** ("Did that happen?"). Disagreement reveals causal/model mismatch even when the control was found.
4. Follow one discovery journey (random → protect → vary → compare → save) and one deliberate editing journey. They exercise different mental models.
5. Explicitly ask what changes are difficult to undo or visually judge, and whether the available controls invite experimenting further.
6. Do not record statistical human performance, population averages or CSI scores without actual subjects and instrument conditions. The user may directly approve one layout on preference and that's appropriate for a single-user tool.

No general-purpose data collection needed. The agent should create a short task-note table with source vs proposal expectations and actual user observations when provided.

## 5. Engineering handoff ordered by impact

1. **Near-zero risk:** document context labels and intent synonyms in search (when implementing), and make the causal relationships explicit in the map. Keep old search aliases.
2. **Small targeted prototype:** one self-contained Texture layer card and one selected interior element inspector, reusing original DOM controls. Contextual view change, no altered recipe keys.
3. **Small targeted prototype:** test ambient/local lighting/Glow as one control space while showing what is global versus object-specific.
4. **A/B menu architecture:** tree test the existing seven-category hierarchy, five-intent proposal, and hybrid. Maintain identical task list, randomize choice order if several humans participate.
5. **Merge only evidence-backed improvements:** explicit UX acceptance, source/recipe invariant smoke and perhaps one narrow browser check, not an expensive global screenshot suite for speculative rearrangements.

**Future integration:** draft Shape & Path Library PR #434 and Colour Vision Preview PR #432 are not assumed to be merged. The library belongs to Build/use-geometry and Saved geometry assets; the vision tool is a non-recipe canvas inspection mode. Evaluate after branches merge.

## 6. Rerun the comparison

```bash
node scripts/ia-structure-evaluate.mjs --markdown
node scripts/ia-structure-evaluate.mjs --json
```

Its purpose is to flag structural differences while making all task assumptions explicit. It is not added to default app CI and must not become an aesthetic scorekeeper. Update candidate routing and task catalog deliberately, with the source schema as authority.
