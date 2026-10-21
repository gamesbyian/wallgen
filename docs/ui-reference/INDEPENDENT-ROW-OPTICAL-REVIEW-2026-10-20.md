# Independent source-row visual acceptance: seven original families

**Review date:** 20 October 2026. **Reviewer:** AI conducting direct optical examination of real screenshot pixels (not human user approval). **Disposition:** conditional visual/layout pass following source defect repairs #358 and #360, with human/physical-device aesthetic sign-off still separate.

## Evidence actually examined

The source [Agent 1 live Chromium run 39527554784](https://github.com/gamesbyian/wallgen/actions/runs/39527554784) yielded **234 distinct exact source-tool-card PNGs**: all **39/39 reachable named tools** at **320×700, 412×892 and 791×892** × cream/dark, across four real Paths/Radial/Regions/Nested source modes. The independent reviewer inspected contact sheets showing *each actual rendered card*, grouped by viewport and theme, and opened raw PNG details for visually questionable Character and Material cards. This is not a generated approximation, source inventory, or hypothetical design study. The immutable workflow retains `row-census.json`, 234 named images and **570 state/tool visits with zero original geometry-model failures**.

| Category family | Source-identifiable cards inspected | Concrete independent observation |
| --- | ---: | --- |
| Layout | 24 | Original Arrangement, Direction, Canvas structure and Variation distinguish active coloured sliders from deliberately inactive rows; control keys remain visibly associated with labels |
| Path | 66 | Eleven source-specific Path tool cards include Radial/Regions conditional inactive values, guarded turns/loops and one-label range rows; no missing fifth-column control or unexpected expanded Geometry header |
| Stripes | 30 | Original Structure, Patterns, Marks, Scale and Character rows show the standard coloured left rail; **Character override long-help text was vertically cut on small portrait cards**, despite its source row fitting horizontally |
| Details | 54 | Divider/Outline/Shadow/Glow plus actual Interior empty-state tool cards retain original source controls; Glow remains a single-setting control, and empties carry a text explanation |
| Colour | 12 | Background and Rainbow show selectors and original Reverse stripes checkbox; no invented colour slider or control-row type |
| Material | 42 | All three layers and Finish controls retain the independent 5-button + numeric rotation grammar; **Finish 2 and 3, when disabled, clipped the lower portion of the original rotation buttons at 320px** |
| Effects | 6 | Lighting four-setting rows retain their disabled/zero values with legible source labels and original lock/die actions |
| **Total** | **234** | **39 source-applicable named tool cards × three viewport profiles × two themes** |

## Negative findings repaired, not waived

1. **Character prose clipping**: The real 320/412px source screenshots showed the checkbox explanation severed by the fixed-height card. [Merged #358](https://github.com/gamesbyian/wallgen/pull/358) hides redundant visual prose only in the compact phone card, retains the complete original text in its label title and checkbox `aria-description`, and proves the 16 actual source-recipe/label input journeys at 320, 360, 412, 499, 500, 790, 791 and 1024px, cream/dark. Exact screenshot after fix was individually inspected at 320px; the original checkbox label now finishes fully inside the card.
2. **Material inactive Finish 2/3 clipping**: The 320px source crop showed the lower six native rotation/numeric controls cut below the card. [PR #360](https://github.com/gamesbyian/wallgen/pull/360) reduces *only* inactive-state explanatory padding, preserves full wording and user controls, and extends **both** a dedicated 28-case 320–791px real Chromium visual regression **and** the full 39-tool row census to reject controls escaping **any of the four card bounds**, no longer just left/right. A new 320px raw post-fix crop was individually inspected and shows all six angle/numeric controls fully inside the card.

Prior verified source row evidence remains relevant: [PR #278](https://github.com/gamesbyian/wallgen/pull/278) repaired the 791/1151/1280px compressed desktop slider tracks and proved **1,152 measured rows**, while [PR #345](https://github.com/gamesbyian/wallgen/pull/345) recorded **120 real Material rotation shortcut centre-hit actions** across 791, 1024, 1151 and 1280px, two themes and three layers; minimum shortcut width 25px, 40px at 791/1024. [PR #323](https://github.com/gamesbyian/wallgen/pull/323) verified 570 tool-state inspections and all 234 real source card images.

## Independent visual disposition and remaining boundary

**The row-layout implementation meets the checked technical/independent optical component contract, under the above separately verified fixes**: same original named source fields, consistent category accent grammar, no lost rotation shortcut, no misplaced active row, no visually severed Character help, responsive coverage of the deliberately difficult 320px and 790/791px handoff. No new user-default or visual mockup was introduced.

This is a **conditional independent AI optical/layout pass**, not a human user having approved the product. It does **not** declare subjective beauty, individual perceptual legibility, OS-scale text, 320px physical tap comfort, large Android system fonts, every uncommon conditional screenshot, or real screen-reader experience complete. Those remain unapproved under the separate supported-viewport **human and physical-device** acceptance item. Extremely short phone landscape is outside supported release scope.

The screenshots are historical source captures and cannot silently stand in for a later moving `main`. Each repaired case has its own immutable source-bound post-fix Chromium run and screenshot artifact; rerun all CI on any later CSS change before changing these conclusions.
