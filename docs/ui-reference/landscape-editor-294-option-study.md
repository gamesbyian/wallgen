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

The temporary CSS prototype is guarded by **570–790px wide, ≤530px high and orientation: landscape**, with an original-source inspector occupying 47% of the width and the original canvas stage taking 53%, both at full viewport height. The proposed ratio is **for research only**; it is not a feature or an approved product layout.

The script captures actual production and style-injected scenes at **600×360**, **700×412**, **790×500**, and a **412×700 portrait negative control**, in **cream/dark themes**, across **Path Geometry**, **Material Finish**, and **Colour Rainbow**. That's 24 direct A/B pairs and 48 source-browser screenshots. Each pair records real preview/canvas/stage/sidebar bounding boxes, source form-field inventory, selected row/cell coordinates, horizontal page overflow, hover-independent centre hit tests and whether the stage and inspector intersect.

## Decision rubric

The prototype should earn further work only if it substantially increases the rendered wallpaper **without breaking** the source editor, original control identity or physical hit areas. Inspect quantified canvas-area gains and the editable card's usable height rather than extrapolating from screenshot attractiveness. Specifically scrutinize:

- The 700×412 live preview, art aspect ratio and left/right pan/zoom tools, compared to actual production coordinates
- Horizontal category/tool strips, the five quick actions and the dock-return control on short landscapes
- Path, Material and Colour rows including disabled states and six original rotation actions
- The 600×360 case: controls may no longer have enough horizontal width to remain usable
- The 412×700 portrait negative control: no injected layout effect whatsoever

**No default change is requested or justified by this study alone.** Real phone/stylus/on-screen keyboard tests and independent aesthetic/user review remain required; do not check redesign visual acceptance entry 6 or replace canonical screen plates. A green experiment-run check means evidence captured and basic invariants passed, **not** that the alternative design has been approved.
