# Agent 2: canonical plate hitability gate (2026-10-20)

## Scope

Control reachability, inactive states, locks and canonical screen functionality (acceptance entries 1, 4 and 8). This is a narrow independent follow-on to merged PR #268, **not** a new claim of complete acceptance.

## Defect in acceptance instrumentation

The existing twelve-plate Chromium test recorded `physicallyHittable` for each mapped control but only required **some CSS-visible source control** on each screen. A plate covered by an overlay could pass that condition without a single enabled, centre-hittable canonical control. Invalid CSS selectors were also collected without failing the suite.

The regression now requires each of the twelve real navigated plates to expose at least one enabled source-mapped canonical action whose centre resolves to itself or a descendant using `document.elementFromPoint`. Invalid contract selectors fail explicitly. The per-plate evidence report includes `physicallyHittableClaims`, making reachability independently inspectable rather than implied by a successful screenshot.

This is deliberately a **minimum screen-liveness criterion**, not evidence that every mapped control works or that touchscreen OS gestures behave. Existing script exercises conditional disabled settings and locks separately, including all 87 original fields across representative source-state fixtures.

## Verification and acceptance boundaries

Run `node --check tests/redesign-live-plate-coverage.mjs` and the Agent 2 workflow `.github/workflows/agent2-controls-acceptance.yml`, which serves the real app and runs Playwright Chromium against the twelve screens. CI outcomes must be checked before merging; this authoring session cannot run the browser locally because the GitHub connector's repository is not mounted and the local runtime has no GitHub network resolution. The PR therefore remains draft unless and until CI passes.

Keep acceptance entries **1, 4 and 8 unchecked**: one-hit-per-screen is insufficient for exhaustively proving all conditional control actions, all screen inventory exceptions and every lock transition. Human visual approval, physical Android/stylus, and platform assistive-technology validation remain separately pending. No production UI, default, renderer, structure or export change is proposed.
