# Optional Focus slider experiment (source-preserving)

**Status:** opt-in prototype, 2026-10-18. **Do not replace the default inspector.**

The Edit tool chooser now includes a **Focus** chip on mobile. In Focus, a single enlarged slider and ± steppers control exactly **one real original range input** at a time, selected from parameter chips; **All controls** is always visible. There are no replacement recipe inputs, no new serialization fields and no renderer changes. Changes dispatch the original field's native `input` and `change` events, so existing history/undo, normalized recipe, slider-number readout, locks, output, timing and image export remain the authority.

**Scope limits:** only scalar `input[type=range]` settings qualify. Toggle/selector/colour/material/anchor interactions stay available in All controls. Disabled or inactive settings remain visible as labelled chips, but cannot be altered from Focus. When no slider exists, Focus explains that condition and retains a direct return. Disabling or locking a selected field disables its focused control; no lock bypass. Selection or switching tools does not edit values. Focus turns off on return to desktop. It is an experimental interaction, not an approved replacement.

**Review tasks:** A/B alternate between Full and Focus while (a) tuning stripe width and spacing, (b) changing material strength/scale, (c) exploring geometry/radial parameters and (d) searching for a disabled setting. Observe tap count, glanceability and how easily users can compare simultaneously changed values. Explicitly retain default All mode unless user evaluation supports changing it.

**Implementation acceptance:** original form nodes never move or duplicate; focus slider inherits the source field's stable ROYGBIV colour (blue remains eligible); no flicker during rerender; direct keyboard/touch focus and source-state updates; mobile preview and editor never overlap; Chrome screenshots before/after must be compared to existing controls.
