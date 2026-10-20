# Agent 2 controls, navigation and conditional-state acceptance

**Date:** 2026-10-19 / 2026-10-20 UTC. **Lane:** controls/state/navigation/More, without drawing engine, image styling, or wholesale layout redesign. **Initial baseline:** `main@4f900d8`. **Integration:** Agent 1, 3 and 4 merged main `07ab5ba` into Agent 2 as two-parent commit `a7a4c08`, preserving overlapping gallery and focus-scroll behavior. **PR:** [#268](https://github.com/gamesbyian/wallgen/pull/268).

## Exact canonical traceability

See [machine-readable 177-claim mapping](ui-reference/agent2-runtime-plate-traceability.json). It records the exact canonical phrase, screen, required/conditional/forbidden classification, source candidate(s), applicable runtime state, browser exercise protocol, evidence suites and per-claim qualification. The twelve plates comprise **121 required, 29 conditional, 27 forbidden assertions**. These 177 entries are canonical *design claims*, not 177 independently verified interactions.

The frozen source inventory retains **116 historical static IDs**, **87 data-setting names**, **40 source tools** in seven categories. Three historic category IDs intentionally retired with replacement navigation and one legacy Tone tool remains unselectable through the HTML-disabled Tonal option. Existing Agent 3 browser tests qualify 39 genuinely select-able tool chips across Paths, Radial and Regions, but do not by themselves prove all nested/conditional form controls. The inventory's own historical source-data exceptions must not be silently rewritten to manufacture proof.

## Concrete discrepancies corrected

| Canonical contract | Runtime discrepancy | Resolution | Evidence |
| --- | --- | --- | --- |
| More: Import recipe JSON/file | Original file chooser only accepted and decoded PNG | Original `#importRecipePNG` / `#importRecipeFile` now explicitly supports PNG and bounded JSON; no duplicate importer; rejects malformed or unrelated JSON, normalizes source recipe, preserves Undo and original PNG errors | `tests/redesign-controls-conditional-acceptance.mjs`, existing positive/negative PNG suites |
| More: Batch output | Explore `#batch` existed but no More route | Create & seed now includes a button that invokes the original `#batch`, opens Explore, and retains distinct generated recipe identities across Saved/Explore | New Chromium suite |
| Optional Focus: increment/decrement **and lock** | Focus exposed locked help and disabled shared slider but no in-Focus source-lock action | Focus now delegates new lock control to the *existing* setting lock button, preserving original recipe transaction/Undo and disabling lock action for contextually inactive source controls | New Chromium Focus lock/unlock and dormant case |
| Short landscape metadata | Intermittent 700×412 keyboard focus placed expanded Description textarea below fixed More sheet on consolidated suite despite earlier passing head | Recheck More scroll clearance synchronously and after browser-native focus scroll, using instant sheet scrolling; never changes focus or recipe | `tests/redesign-more-keyboard-traversal.mjs` (independent existing suite), passed on prior branch head; repeat on final head required |

## Live source census and positive-minimum regression

The dedicated browser workflow now listens to both PR updates and branch-scoped pushes. At integrated commit `a7a4c08`, its true Chromium control suite and general tests passed, and independent mobile, native export and Agent 4 gallery/accessibility suites passed as separate jobs. Subsequent targeted test additions must be qualified at their own final head.

The real mobile browser enumerates **all 87 canonical `data-setting` controls** across **17 explicit conditional fixtures**, including radial Spokes/Pinwheel/Concentric, nested/Voronoi regions, lighting off/zero, optional material layers 2/3 enabled/disabled/zero strength, orientation, stripe shadows and composition. It compares DOM disabled state with inactive/source-lock semantics and verifies visible zeros, native select placeholders, checkbox unchecking, disabled dormant locks, exact canonical values, and records per-setting active/inactive observation sets. This is a broad runtime census, not all possible configuration combinations.

**Source-discovered bug:** native range elements with positive minimum bounds (including ray/region counts at min 7, hairpin turn angle min 60, loop sweep min 240, step count min 1) clamp an attempted inactive value of zero back to a nonzero minimum. `syncInactiveSettings` now temporarily sets `min=0` only while a positive-minimum control is dormant, preserving the original bound and restoring it on reactivation. It does not mutate `current`, serialization or locks. Chromium passed a live Paths → Regions → Paths value/minimum reversal; later test coverage adds Hairpin/Loop/Stepped activation cycling.

## Acceptance entry dispositions

| Assigned unchecked entry | Current evidence | Status / missing proof |
| --- | --- | --- |
| **1**: Qualify all static/conditional controls | Source identity and tool/browser census already merged; new real pointer/keyboard, JSON, batch, Focus and state tests | **PARTIAL**. Full conditional inner-controls and OS AT reachability for all 87 source settings and dynamic states not certified |
| **4**: Compare every canonical screen plate with inventory | Exact **177-claim** traceability map across all twelve canonical screens, selectors and candidate tests | **PARTIAL**. No claim that every plate and uncommon state received independent visual/behavioral sign-off; source candidate is not an operated control |
| **8**: Inactive values/locks truthful | Real Zigzag → Straight/Hairpin/Loop/Drawn → Zigzag cycles added for zero display, retained nonzero source values and disabled dormant locks (confirmed by browser acceptance); imported texture lock; Focus lock delegation and dormant suppression | **PARTIAL**. Four-geometry real-browser assertions passed dedicated conditional-controls CI at 7a3a11b; cross-family and 87-setting browser census green at a7a4c08; remaining gaps: combinatorial geometry/structure interactions, layered interior locks and native assistive technology |
| **13**: Global announcements and full grouped More | Global `role=status aria-live=polite aria-atomic=true`; notice parity, repeated clipboard emissions, seed lock/apply, JSON/PNG import, share, downloadable JSON, metadata memory, original batch route | **ACCEPTED (source/browser)**. More grouped source actions, denied/allowed clipboard, positive/negative JSON and PNG restoration, native download, metadata, original batch and repeat live status assertions are exercised in Chromium; native spoken screen-reader delivery belongs to the separate accessibility gate |

## Operational gates

1. Dedicated `.github/workflows/agent2-controls-acceptance.yml` executes true Chromium interaction tests and uploads an independent evidence JSON or failure screenshot. Existing consolidated Agent 3 suite includes keyboard More and adversarial import, clipboard, draw, material and other browser checks.
2. `tests/agent2-plate-traceability.test.js` fails if any of the 177 canonical requirements disappears or changes without updating the matrix, and requires each row's named exercise and candidate test to exist.
3. Run `npm run check`, mobile browser, screenshot atlas, headless render, native PNG and consolidated independent mobile acceptance on **the final same PR head**, and review failures rather than extrapolating from earlier green SHA.
4. Entry 13 is checked after source/browser acceptance for all named More and status actions, with independent negative and native-export suites. Entries 1, 4 and 8 remain unchecked until their whole acceptance scope is independently demonstrated. Physical Android/assistive speech and final human visual acceptance are outside browser simulation.

## Guardrails

No source setting keys, recipe schema, original mobile source action identities, drawing algorithms or renderer geometry were removed or renamed. The JSON importer preserves existing PNG file-handler behavior. The batch handoff invokes existing generation code once. The optional Focus lock delegates to original source buttons rather than updating locks independently. Browser coverage is a falsifiable subset, not a percentage of overall redesign completion.
