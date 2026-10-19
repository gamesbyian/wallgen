# Optional Focus slider experiment (source-preserving)

**Status:** opt-in prototype, 2026-10-18. **Do not replace the default inspector.**

The Edit tool chooser now includes a **Focus** chip on mobile. In Focus, a single enlarged slider and ± steppers control exactly **one real original range input** at a time, selected from parameter chips; **All controls** is always visible. There are no replacement recipe inputs, no new serialization fields and no renderer changes. Changes dispatch the original field's native `input` and `change` events, so existing history/undo, normalized recipe, slider-number readout, locks, output, timing and image export remain the authority.

**Scope limits:** only scalar `input[type=range]` settings qualify. Toggle/selector/colour/material/anchor interactions stay available in All controls. Disabled or inactive settings remain visible as labelled chips, but cannot be altered from Focus. When no slider exists, Focus explains that condition and retains a direct return. Disabling or locking a selected field disables its focused control; no lock bypass. Selection or switching tools does not edit values. Focus turns off on return to desktop. It is an experimental interaction, not an approved replacement.

**Review tasks:** A/B alternate between Full and Focus while (a) tuning stripe width and spacing, (b) changing material strength/scale, (c) exploring geometry/radial parameters and (d) searching for a disabled setting. Observe tap count, glanceability and how easily users can compare simultaneously changed values. Explicitly retain default All mode unless user evaluation supports changing it.

**Implementation acceptance:** original form nodes never move or duplicate; focus slider inherits the source field's stable ROYGBIV colour (blue remains eligible); no flicker during rerender; direct keyboard/touch focus and source-state updates; mobile preview and editor never overlap; Chrome screenshots before/after must be compared to existing controls.

**Atlas capture:** mobile full 100/75/66/50% includes `special-focus-stripe-width`, `special-focus-spread` and `special-focus-no-range` captures. Each checks the actual source chip/panel; a parameter switch must not change the original stripe-width control. Desktop atlas intentionally omits this mobile-only option.

## Source-state refresh after external actions

Focus also listens for the application's `roygbiv-controls-synced` notification, dispatched **after** `changeRecipe` has updated canonical form controls. Undo, seed and category randomization, import, and lock changes therefore update the selected shared slider, value readout and disabled/locked treatment immediately, even when no native source `input` or `change` event bubbles. The selected range colour still derives only from the real original input, and clears if no colour is assigned. Chromium browser acceptance explicitly checks **Focus adjustment → Undo while Focus stays open → synced original, shared value, and readout**.

## Empty tool presentation

A tool with no scalar range settings cannot benefit from the one-slider Focus surface. In that state, the unused parameter chooser is hidden, the explanation remains readable, and taller mobile viewports return some sheet height to the artwork. The **All controls** escape remains available and maintains every non-range field. Selecting a tool with ranges restores the complete Focus slider and its original source values; closing Focus removes the empty-state styling. This is a layout-only improvement, not a change to recipe applicability.

## Parameter-chip keyboard access

Focus has one tab stop for its parameter choices. Left/Right cycle within the current tool, Home/End jump to bounds, and keyboard focus follows the selected real source field. Horizontal reveal is limited to the chip strip. A disabled or locked underlying range remains selectable so its inactive status can be explained, but the shared adjustment stays disabled. All controls remains an independent exit. This is an accessibility refinement only; it changes no recipe values unless the user subsequently adjusts the source-backed slider.

## Tall-phone visibility verification (2026-10-19)

The real 412×892 Chromium atlas showed the active Focus slider partly below the bottom of the visible editing sheet. When Focus has at least one source-backed range and the viewport is 740px tall or more, reserve `clamp(295px, 34dvh, 330px)` for the tray, atomically contracting the wallpaper preview rather than overlapping it. Keep the existing `clamp(192px, 23dvh, 215px)` compact rule for range-free Focus tools. Landscape/short devices continue to use the scrollable panel. Mobile browser acceptance now inspects the *actual rendered* slider, help, tray and preview rectangles at 412×892, without substituting a screenshot zoom.
