# Real source editor row optical atlas

The visually dense settings inspector needs more than a source schema and bounding-box tests. The independent [Agent 1 Chromium source-row census](../../scripts/visual-setting-row-census-agent1.mjs) now publishes two complementary artifacts for the original seven-category editor:

1. **`row-census.json`**: real DOM identity, tool ownership, setting names, row kinds, boundaries, and the six original Material rotation controls for every applicable Paths, Radial, Voronoi and Nested Regions tool state.
2. **`row-review.html` and `row-screens/`**: a responsive HTML sheet of *real Chromium screenshots cropped from each selected original editor card*, one per applicable tool at **412×892 / 791×892 in both cream and dark**. A successful audit should contain **156** such crops, one for each of 39 applicable tools × 2 CSS viewports × 2 themes.

The screenshot source is the real `.editor-tool-card[data-editor-tool]` with its original descendants. It is **not** manually assembled, image-generated, or a painting of an expected layout. Each card's label includes the actual scene mode and source keys. The tests check the screenshot count and fail if a tool crop is missing. Browser screenshot capture scrolls a card into the viewport so the visual reviewer sees its source surface; this is not proof of hardware touchscreen behaviour or a natural user swipe to that tool.

## Required independent optical review

- Compare the tiny **412px** crop against the **791px** crop and both themes: no concealed text or conflicting borders, legible values and meaningful colours, clear selection/disabled states.
- In Material `finish1`, `finish2`, `finish3`, verify visually all five original shortcuts (−90°, −1°, +1°, +90°, reset 0°), numeric angle and original lock/die affordances. JSON enforces the six-control grammar, but the actual screenshot establishes visual density.
- Check that a category's vertical accent rail and row background do not imply a setting is editable when the original source value is inactive/locked. Use `row-census.json` for truth, and direct browser controls for interaction verification.
- For geometry switch between Paths, Radial and nested Regions and confirm no orphan or inaccessible controls. The `row-census.json` records more modes than the per-tool screenshot sheet deliberately captures; inspect the record for all cases.
- Inspect each category in both viewport widths, not only the seven most attractive frames. Report any counterexample with the exact `row-screens/<viewport>/<theme>/<category>-<tool>.png` path.

**Explicit reachability exception:** the declared `stripes/tone` tool needs legacy layered tonal construction, whose source `option[value=tonal]` is intentionally `hidden disabled`. Thus the current browser has **40 declared named tools but only 39 reachable**. It is misleading to stage a fake active Tone screenshot or award 40/40 visual acceptance.

## Reproduction

On the app checkout, run `npm install --no-save playwright@1.56.1 serve@14.2.5`, `npx playwright install chromium`, launch `npx serve . -l 4173`, and run `node scripts/visual-setting-row-census-agent1.mjs`. Open `artifacts/visual-agent1/row-review.html`. The [Agent 1 workflow](https://github.com/gamesbyian/wallgen/actions/workflows/visual-agent1.yml) executes this after the 416-source-screen baseline; `upload-artifact` preserves screenshots even on a failure.

**Acceptance boundary:** this adds durable, reproducible optical evidence to unchecked master queue entry **7**; it is **not** a substitute for independent aesthetic approval or native-device screenshots. Do not check the entry solely on successful image generation or zero horizontal overflow.
