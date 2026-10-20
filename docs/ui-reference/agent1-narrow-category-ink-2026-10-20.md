# Agent 1 source category-label ink collision at 320px · 2026-10-20

**Status:** verified visual counterexample and proposed targeted CSS repair under CI. No change to the native wallpaper renderer or recipe semantics. Technical proof is **not** user aesthetic or physical-device approval.

## Source-bound reproduction

In the [green 84-screen real-touch Chromium artifact](https://github.com/gamesbyian/wallgen/actions/runs/39410508073/artifacts/12259925349) from merged [#321](https://github.com/gamesbyian/wallgen/pull/321), open `screens/minimum-320-portrait/cream/edit-material.png` and the same dark screenshot. The source-rendered category captions `LAYOUT PATH SHAPES DETAILS COLOUR MATERIAL EFFECTS` paint across one another in the single `.settings-tabs` row, particularly between Details, Colour, Material and Effects. **Real source button centre taps passed**, because seven equal grid cells still exist; hitbox checks and parent-row overflow measurements failed to notice *glyph ink* overlapping across adjacent tabs.

These are genuine **960×2100 physical PNG pixels** produced by 320×700 CSS px × DPR 3 Chromium on the real app, not an illustrative proposal. Their source screenshot manifest reports 14/14 320px states, zero errors, and original canvas previews 193×418px in Studio, approximately 171×370px when Edit is open and 100×216px with the empty galleries. The category ink collision is a **distinct visual defect** despite those positive overall geometry results.

## Repair and independent browser acceptance

At **CSS widths ≤399px only**, the visual fix converts the existing seven-category bar from `grid-template-columns:repeat(7,1fr)` to **one horizontally scrollable line of original buttons**. Labels retain full text, CSS white-space no-wrap, original role/ID, selected underline, keyboard focus, source category-change callbacks and original per-tab icons (which remain hidden in this compact presentation). The bar keeps its prior compact fixed height; it does **not** wrap into an invisible second row, shrink into unreadable microtext or remove categories. Wider portrait and desktop presentation remain unchanged.

The [real-browser source glyph test](../../scripts/visual-category-ink-agent1.mjs) audits **320/360/399/400/412/499/500px portrait** in both cream/dark: 14 browser layouts and **98 physical Playwright touch taps** across seven source categories. It uses live DOM `Range.getBoundingClientRect()` rather than only CSS grid-cell widths to reject overlapping caption ink, checks document overflow and verifies that each original source category becomes selected and touch-hittable after horizontal scrolling. It stages original screenshots before and after actual Material navigation plus a JSON numeric manifest. The [independent CI workflow](https://github.com/gamesbyian/wallgen/actions/workflows/visual-category-ink-agent1.yml) must pass, as must the application and source-geometry suites. A failing width is a useful counterexample, not permission to remove it from the tested range.

**Acceptance boundary:** this resolves a bounded text collision only after CI and optical inspection. It does not check master visual acceptance entries 3, 6, 7 or 16, does not grant final icon approvals, and does not replace real Android hardware/focus checks.
