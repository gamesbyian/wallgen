# Issue #294: short-landscape source layout experiment

## Scope and strict production boundary

The [independent 700×412 Chromium visual review](https://github.com/gamesbyian/wallgen/issues/294) identified a **legibility concern**, not a failing generation function. The real wallpaper preview shrinks to a roughly 94px-high stage while the lower editor occupies approximately 300px. Original tap/keyboard and source-panel regression tests pass; this is not authorization to change the default interface.

This branch contains **no application CSS, JavaScript, HTML, model, icon or export changes**. It adds a *temporary injected-style* A/B research runner, disposable on page close, operating on original live DOM and original native canvas. The **production** screenshots precede injection and are unaltered; **experimental** screenshots are labelled as such and are not approved design reference plates.

## Reproduction

The script [`scripts/visual-landscape-prototype-agent1.mjs`](../../scripts/visual-landscape-prototype-agent1.mjs) launches actual Chromium against the served repository. Its [dedicated CI workflow](../../.github/workflows/visual-landscape-294.yml) publishes `measurements.json`, `review.html`, and pairs of browser PNGs under `production/` and `experimental/`.

Use:

```bash
npm install --no-save playwright@1.56.1 serve@14.2.5
npx playwright install chromium
npx serve . -l 4173
node scripts/visual-landscape-prototype-agent1.mjs
```

The temporary CSS prototype is guarded by **570–790px wide, ≤530px high and orientation: landscape**. The current trial uses a **420px wide source inspector** with the remaining viewport width allocated to the original canvas stage, both full-height, and a two-row original category-strip arrangement. This is **for research only**, not a feature or approved product layout. The source rotation control itself is never restyled, shortened or replaced.

The script captures actual production and style-injected scenes at **600×360**, **700×412**, **790×500**, and a **412×700 portrait negative control**, in **cream/dark themes**, across **Path Geometry**, **Material Finish**, and **Colour Rainbow**. That's 24 direct A/B pairs and 48 source-browser screenshots. Each pair records real preview/canvas/stage/sidebar bounding boxes, source form-field inventory, selected row/cell coordinates, horizontal page overflow, hover-independent centre hit tests and whether the stage and inspector intersect.

## Decision rubric

The prototype should earn further work only if it substantially increases the rendered wallpaper **without breaking** the source editor, original control identity or physical hit areas. Inspect quantified canvas-area gains and the editable card's usable height rather than extrapolating from screenshot attractiveness. Specifically scrutinize:

- The 700×412 live preview, art aspect ratio and left/right pan/zoom tools, compared to actual production coordinates
- Horizontal category/tool strips, the five quick actions and the dock-return control on short landscapes
- Path, Material and Colour rows including disabled states and six original rotation actions
- The 600×360 case: controls may no longer have enough horizontal width to remain usable
- The 412×700 portrait negative control: no injected layout effect whatsoever

**No default change is requested or justified by this study alone.** Real phone/stylus/on-screen keyboard tests and independent aesthetic/user review remain required; do not check redesign visual acceptance entry 6 or replace canonical screen plates. A green experiment-run check means evidence captured and basic invariants passed, **not** that the alternative design has been approved.

## Negative and interim independent Chromium evidence

Before attempting any product change, the first two rounds exposed both an existing defect and unsafe prototype tradeoffs:

| Run and prototype | 600×360 actual preview | 700×412 actual preview | Material's six original actions at 600 / 700 |
| --- | --- | --- | --- |
| Production source (unaltered) | **0px** | **23.1px** | 6/6, 6/6 |
| [Initial 47% inspector / 53% stage, run 39403144781](https://github.com/gamesbyian/wallgen/actions/runs/39403144781) | 140.3px | 164.3px | **2/6, 3/6**, unfit |
| [62% inspector / 38% stage, run 39403890788](https://github.com/gamesbyian/wallgen/actions/runs/39403890788) | 80px | 118px | **5/6, 6/6**, still unfit |
| [64% inspector / 36% stage, run 39404491641](https://github.com/gamesbyian/wallgen/actions/runs/39404491641) | 68px | 104px | **5/6, 6/6**, still unfit |

All dimensions are actual Chromium `#preview.getBoundingClientRect().width`, not a marketing mock-up or export resolution. The source canvas at 600×360 is actually **0×0**; this functional loss is now tracked in [issue #301](https://github.com/gamesbyian/wallgen/issues/301), separately from the discretionary landscape visual design issue #294. No prototype that loses the Reset rotation button is eligible to ship regardless of wallpaper gain.

The final [fixed **420px** source-inspector trial, Chromium run 39404969462](https://github.com/gamesbyian/wallgen/actions/runs/39404969462), [48 matched source-browser screenshots and JSON](https://github.com/gamesbyian/wallgen/actions/runs/39404969462/artifacts/12255264223), completed with **zero experiment-invariant failures** while explicitly preserving all **six real Material rotation actions** as centre-hittable at every size/theme. The browser produced 24 direct original-vs-injected pairs, 48 screenshots, 6 documented zero-sized baseline canvases, and no portrait change, stage-inspector overlap, missing source inputs, clipped active source card or unreachable selected category/tool/setting.

With **420px left for the original inspector**, native `#preview` width increases at **600×360 from 0 to 32px**, at **700×412 from 23.06 to 132px** (5.72×), and at **790×500 from 63.69 to 204.92px** (3.22×). The 32px 600-wide preview remains *visually inadequate* for precise editing. The geometry tests cannot establish that this is an acceptable default, and the source quick-action rail limits available horizontal canvas space. This is **not a production fix for #301**.

The independent Playwright runner explicitly **fails** if any of the six rotation controls, selected category, selected named tool or active source setting control is covered; it also checks original control count, no stage/inspector overlap, card bottom clipping and portrait negative-control invariance. Each failure is retained in screenshot/JSON artifacts rather than rewritten into a passing contract.

Do not merge any proposal into product defaults solely because the experiment itself passes. Source-accurate UI aesthetics, real device navigation, form keyboard, OS overlays and ongoing functional accessibility remain separate signoffs.
