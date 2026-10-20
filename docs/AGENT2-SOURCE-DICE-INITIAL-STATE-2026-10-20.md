# Agent 2 first-import setting dice truthfulness, 2026-10-20

**Scope:** original individual-setting randomization buttons on initial recipe URL import; separate from wider Tool/Category randomization and other agent lanes.

## Source defect

The original `toControls()` and `syncInactiveSettings()` correctly disable fields for imported locks and dormant conditions. But the miniature `[data-random-setting]` buttons were synchronized **only** inside `changeRecipe()`, which does not run on the initial URL restoration path: startup calls `toControls(loaded)` and `render(current)`. Thus an imported locked or dormant setting could display an apparently active randomization button that merely reported “No unlocked, applicable settings changed.” The Geometry Safety control has a further policy contradiction: `randomizeScope` explicitly refuses to alter this editorial guardrail, but its “randomize only” die was generated and shown as enabled.

## Narrow reconciliation

- Call `syncScopedSettingDice()` from the canonical `toControls()` path after source disabled/dormant state settles. This covers initial load, Undo, import, user interaction and randomization without two copies of dice-state logic.
- Keep the underlying Geometry Safety checkbox operable but mark **its randomize die** disabled, with explicit explanatory accessible name/title. Do not alter Safety's model value, source field or the intended randomization prohibition.
- Preserve the original settings and hidden conditional values, More/Draw/export, scene rendering and source geometry.
- Bump only the app module's existing browser cache token.

## Negative browser acceptance

`tests/agent2-initial-setting-dice.mjs` starts with an imported recipe containing source-locked **Shape Frequency** and **Motif Size**, dormant **Gap**, **Outline Buffer** and **Stripe Shadow Softness**, and the separately active **Geometry Safety**, **Crossing Mode** and **Dot Size**. Across 412×892 and 700×412 the browser tests disabled/active dice **before any edit**, then confirms manual Safety editing and full recipe return, an actual Dot Size die action that changes no other recipe key, lock→unlock die reactivation, and dormant Gap reactivation after a real outline change. Failure screenshots and source URL deltas are retained in CI.

**Status: VERIFIED AND MERGED.** Two true Chromium import/recovery journeys across portrait **412×892** and constrained landscape **700×412** passed in [run 39479919993](https://github.com/gamesbyian/wallgen/actions/runs/39479919993); final production integration [#315](https://github.com/gamesbyian/wallgen/pull/315) passed **19/19 workflows** at head `89bf5eff` and merged as `9cb3514`. Geometry Safety's original setting stays manually editable; only its intentionally unsupported randomize die is disabled, with an accessible explanation. **Separate 83-setting source die Reroll/Vary coverage:** [draft #327](https://github.com/gamesbyian/wallgen/pull/327) is pending its own browser matrix and must not be credited as passed until that run succeeds. Human optical/Android/OS speech acceptance remains unclaimed. Human optical/Android/OS speech acceptance remains unclaimed.
