# Agent 2 controls, navigation and conditional-state acceptance

**Date:** 2026-10-19 / 2026-10-20 UTC. **Lane:** controls/state/navigation/More, without drawing engine, image styling, or wholesale layout redesign. **Baseline:** `main@4f900d8f6fe5f4dd5c1ed114d1777d8d3a393659`. **PR:** [#268](https://github.com/gamesbyian/wallgen/pull/268).

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

## Acceptance entry dispositions

| Assigned unchecked entry | Current evidence | Status / missing proof |
| --- | --- | --- |
| **1**: Qualify all static/conditional controls | Source identity and tool/browser census already merged; new real pointer/keyboard, JSON, batch, Focus and state tests | **PARTIAL**. Full conditional inner-controls and OS AT reachability for all 87 source settings and dynamic states not certified |
| **4**: Compare every canonical screen plate with inventory | Exact **177-claim** traceability map across all twelve canonical screens, selectors and candidate tests | **PARTIAL**. No claim that every plate and uncommon state received independent visual/behavioral sign-off; source candidate is not an operated control |
| **8**: Inactive values/locks truthful | Real Zigzag → Straight/Hairpin/Loop/Drawn → Zigzag cycles added for zero display, retained nonzero source values and disabled dormant locks (new CI awaiting qualification); imported texture lock; Focus lock delegation and dormant suppression | **PARTIAL**. Four-geometry real-browser assertions passed dedicated conditional-controls CI at 7a3a11b; newly added radial Spokes/Pinwheel/Concentric, nested/Voronoi regions, lighting-off/zero and optional material layer 2/3 enabled/disabled/zero-strength real-browser assertions await final-head CI; need broader diagonal and layered interior lock combinations |
| **13**: Global announcements and full grouped More | Global `role=status aria-live=polite aria-atomic=true`; notice parity, repeated clipboard emissions, seed lock/apply, JSON/PNG import, share, downloadable JSON, metadata memory, original batch route | **PARTIAL**. More metadata Tab clearance in short landscape must pass on current head, plus broad error/race/OS announcement timing tests |

## Operational gates

1. Dedicated `.github/workflows/agent2-controls-acceptance.yml` executes true Chromium interaction tests and uploads an independent evidence JSON or failure screenshot. Existing consolidated Agent 3 suite includes keyboard More and adversarial import, clipboard, draw, material and other browser checks.
2. `tests/agent2-plate-traceability.test.js` fails if any of the 177 canonical requirements disappears or changes without updating the matrix, and requires each row's named exercise and candidate test to exist.
3. Run `npm run check`, mobile browser, screenshot atlas, headless render, native PNG and consolidated independent mobile acceptance on **the final same PR head**, and review failures rather than extrapolating from earlier green SHA.
4. Do not check queue entries 1, 4, 8 or 13 until each is exhaustively independently demonstrated. Physical Android/assistive speech and final human visual acceptance are outside browser simulation.

## Guardrails

No source setting keys, recipe schema, original mobile source action identities, drawing algorithms or renderer geometry were removed or renamed. The JSON importer preserves existing PNG file-handler behavior. The batch handoff invokes existing generation code once. The optional Focus lock delegates to original source buttons rather than updating locks independently. Browser coverage is a falsifiable subset, not a percentage of overall redesign completion.
