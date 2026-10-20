# Focus versus All: independent human A/B sign-off protocol

**Scope:** acceptance entry 11 in `docs/UI-REDESIGN-IMPLEMENTATION-QUEUE.md`.
**Status:** human testing **NOT PERFORMED**. Default All controls must not change based on a machine-only click census.

## Controlled setup

Run the same verified build on a phone-scale viewport (412×892), short landscape (700×412) and at least one physical Android Chrome handset if available. Reset the wallpaper recipe and the editor's selected category/tool before each task. Record both recipe JSON and screen recording, not merely a subjective rating.

Randomize presentation order by participant: alternating **All → Focus** and **Focus → All** on the same task, and alternate task ordering. Separate repeat attempts so motor learning does not systematically favor the second mode. Do not reveal the intended winning interface or hide the fact that Focus only proxies genuine scalar range controls.

## Tasks (repeat with both modes)

| Task | Initial state | Successful user action and exact required observation |
| --- | --- | --- |
| Path width | Paths / Shapes / Structure, unlocked | Change stripeWidth by one increment while preserving other recipe values; compare time/gesture count/readability |
| Path inactive | Paths / Path / Geometry, Straight | Find Shape depth, explain effective **0** versus dormant saved nonzero value; do not inadvertently change it |
| Material active | Material / Finish 1, linen strength 48, rotation 17 | Increase strength one real step; switch to rotation and confirm the source numeric/±90/±1 buttons remain accessible via All |
| Material locked | Material / Finish 1, locked strength 63 | Identify saved strength and unlock route; verify no edit until unlocked |
| Colour selector | Colour / Rainbow, palette classic | Change an original non-scalar selector/toggle; Focus must explain the absence of sliders and provide a real All controls exit |
| Recovery | Modified Path or Material task | Undo, reopen Focus/All and explain the restored original value; confirm no draft loss or control focus trap |

## Record per participant, mode and task

- Success, partial success or failure, evaluated against exact normalized recipe.
- Time from opening the named tool to correct result, including Focus entry/exit.
- User actions (taps, swipes, keyboard presses), wrong turns, backtracks and Undo.
- Whether source value, user lock and contextual inactivity were correctly explained.
- Whether a necessary control was physically reachable without an occluded hitbox.
- Errors involving saved state, point geometry or unintended source field edits.
- Participant's preference and reasons, **separately** from objective completion measurements.
- Device/browser, viewport, accessibility settings, input modality and test order.

Do not score Focus as faster from its enlarged slider alone; account for entry/exit overhead and for tasks requiring non-range controls. Do not score All as more accurate merely because Focus has a deliberate source-backed subset. Stratify results by task family and locked/inactive state.

## Decision rule

The shipped **All** inspector remains the default until independently observed users demonstrate that an alternative materially improves usability without reducing successful task completion or discoverability of non-range controls. Prefer a supplemental opt-in Focus mode if advantages are task-specific or disagreement is substantial. Document raw counts and failure examples, not fabricated preference statistics.

The prior machine-only [PR #267](https://github.com/gamesbyian/wallgen/pull/267) evidence uses actual Playwright actions at 412×892 and 700×412 with complete normalized recipe equality. Its two-action All versus three-action Focus measurements begin **after selecting the tool** and do not measure real human speed or preferences. Human sign-off must refer to this separate experiment rather than promoting CI green to product preference.
