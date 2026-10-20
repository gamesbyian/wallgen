# Issue #276: source-exact responsive slider qualification

**Status:** Responsive source-control defect **corrected and independently Chromium-qualified** on [PR #278](https://github.com/gamesbyian/wallgen/pull/278). Four release-wide visual queue approvals (3, 6, 7, 16) remain unchecked pending independent aesthetics, exact full-surface reference review and/or a real physical device. Source geometry is a bounded browser gate, not those approvals.

## Reproducible counterexamples found

- Independent [156-card Chromium atlas, run 39381312821](https://github.com/gamesbyian/wallgen/actions/runs/39381312821/artifacts/12246235751): actual **791×892 Path / Geometry** source cards showed Shape frequency and depth with nearly invisible native draggable tracks while the 412px phone source tracks were functional.
- Initial narrower trial, [run 39395509361](https://github.com/gamesbyian/wallgen/actions/runs/39395509361/artifacts/12251627811): 1,500 real tool states, 1,440 source range fields, minimum 72px at 791/850/899; **18 verified failures** due to nested Shadow steppers protruding **86px past their own source field**. An older `flex-flow:row nowrap!important` on nested Shadow/Lighting range fields defeated the stacked correction. Tracks in 900/1024px cards still measured **0px**.
- Expanded desktop census, [run 39396694718](https://github.com/gamesbyian/wallgen/actions/runs/39396694718/artifacts/12251689514): all 864 sampled 791–1150px source tracks measured >=72px and no longer escaped their fields, but a real **6.375px** 500/790/landscape Lighting canvas-shade bottom overflow was found. Crucially, 1151/1280px had **76/76 active source range tracks measuring 0px**, proving the bug existed on wide desktop too.
- Small-card correction reduced the Lighting overflow from 6.375px to 2.42px, then to 0.45px, without shrinking the reserved wallpaper space. All failed runs remain available as source-exact negative fixtures and were never credited as passing acceptance.

## Verified correction

`editor-redesign.css` now places each ordinary desktop range label above **its original native stepper** at **all widths >=791px**; preserves the entire number field, per-setting dice, lock, button identities and handlers; specifically overrides the old forced row layout for nested Shadow/Lighting **range fields only**; leaves selection dropdown siblings and the **four-column Material rotation grammar** unchanged. Mobile <=790px retains its existing source layout.

At 500–790px, only the live Lighting tool reclaims unused internal card padding and makes its original two selectors **36px high**, retaining working native inputs and sufficient touch dimensions while moving the canvas-shade row entirely within the existing card. The preview and dock bounds do not change.

### Independent real-browser regression

[Final green Chromium run 39399135653](https://github.com/gamesbyian/wallgen/actions/runs/39399135653), [**source geometry plus 156 screenshots artifact**](https://github.com/gamesbyian/wallgen/actions/runs/39399135653/artifacts/12254355913), run on the actual application, not mocked cards:

| Measurement | Result |
| --- | --- |
| Source selected-tool states | **1,950** |
| Visible production range fields | **1,872** |
| Desktop >=791px active and disabled range measurements | **1,152** |
| Minimum measured desktop range input width | **72 CSS px** |
| Genuine Chromium source-card screenshots | **156** |
| Issues with source label ink, stepper/number collisions, desktop field overflow or clipping | **0** |
| Minimum bottom clearance of formerly clipped Lighting row | **1 CSS px** |
| Test failures | **0** |

13 CSS viewport profiles are covered at two themes each: **412, 499, 500, 790, 791, 850, 899, 900, 1024, 1150, 1151 and 1280 × 892, plus 700×412 landscape**, across Paths, Radial and Nested Regions. The collector records DOMRange text ink and real `getBoundingClientRect()` of sliders, source labels, native numeric values, steppers, buttons, wrappers, dice, locks and card; it fails on desktop tracks below 64px, any child/label collisions or source-field overflow, and requires **at least one CSS pixel** of lower clearance inside the compact Lighting card. It captures original control cards without redrawing them.

Direct source-exact visual witnesses in the artifact include:
- `range-screens/desktop-791x892/cream/path-geometry.png` and its dark counterpart
- `range-screens/desktop-1280x892/cream/path-geometry.png` and dark Material `material-finish1.png`
- `range-screens/phone-500x892/cream/effects-lighting.png` and `range-screens/landscape-700x412/dark/effects-lighting.png`

`scripts/visual-narrow-desktop-range-agent1.mjs` runs as a **separate parallel CI job** in `.github/workflows/visual-agent1.yml`, preserving measured JSON and screenshot artifacts even when a test fails, rather than blocking behind the much longer 416-screen canonical atlas. Existing `Validate Wallgen` and other browser/export checks must continue to pass on the integration head.

## Explicitly open gates

This green result is sufficient to demonstrate **the specified source-row geometric fix**, not full human aesthetic approval of every family, all conditional screen plates, physical Pixel/Android font scale/OS chrome, actual touch-screen or screen-reader behaviour. The candidate [eight source-exact 20/24/28px SVG glyphs](eight-candidate-visual-review-2026-10-19.md) remain **unwired and not user-approved**; the four already integrated extension icons retain their original mapping. Do not check the master queue's items 3, 6, 7 or 16 or replace its canonical approval SVG references solely on automated geometry or screenshot production. The screenshots are implementation witnesses alongside, not replacements for, the still-unapproved design plates.
