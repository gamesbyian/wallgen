# Issue #276: narrow desktop slider track follow-up

## Source finding
The original `editor-redesign.css` places each ordinary range label, native slider, minus/plus controls and number input on one horizontal row. At the 791px desktop breakpoint the editor's available inline space becomes narrow while the existing die and lock retain 25px target boxes. The independently recorded live screenshot counterexample is [issue #276](https://github.com/gamesbyian/wallgen/issues/276), backed by Chromium [156-card editor atlas run 39381312821](https://github.com/gamesbyian/wallgen/actions/runs/39381312821).

## Candidate correction on this branch
A narrowly scoped `@media (min-width:791px) and (max-width:899px)` rule stacks the *existing* label above its native stepper, permitting the input range to consume the available full source-field width. No IDs, handlers, recipe fields, steps, numeric inputs, locks or dice are changed. The rule expressly excludes the special `.texture-rotation-field`. Mobile widths <=790px and desktops >=900px retain prior layout.

## Acceptance remains open
This branch's CSS change is a **candidate remediation**, not completed browser qualification. Before closing #276 or checking visual queue item 7, run live source-exact Chromium card atlases in both themes at **412×892, 499×892, 500×892, 790×892, 791×892, 899×892, 900×892, 1024×892 and 700×412 landscape**, including conditional Path/Material/Colour/Effects fields. For every applicable ordinary slider record bounding rectangles for source input range, number input, label ink, decrement/increment, die and lock, plus centre hit targets. Verify no clipped slider or child, overlap with adjacent row/card/tray, unexpected card vertical overflow, or loss of existing controls. Run `npm run check` and the existing Chromium editor atlas. Compare the 791px track width against pre-change and 412px baselines. These checks are **not claimed as executed by this branch**.

Icon candidates retain the [existing independent review](eight-candidate-visual-review-2026-10-19.md): the eight unwired candidates are **not approved or connected**. Screen plates should be replaced only after source-exact post-fix screenshots pass their full per-theme state matrix. Human aesthetics, physical Android/stylus and screen-reader speech remain explicitly pending.
