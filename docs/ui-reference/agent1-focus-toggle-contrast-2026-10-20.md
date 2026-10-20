# Focus toggle caption contrast · Agent 1 source visual finding

## Original screenshot counterexample

The [real 320×700 CSS px, cream/dark Chromium screenshots](https://github.com/gamesbyian/wallgen/actions/runs/39483415187/artifacts/12292031834) show the editor's existing `Focus` toggle while **not pressed**. In the dark-theme original `minimum-320/dark/material-after-physical-navigation.png`, the button uses the inherited dark `var(--surface)` background, but its label is rendered in the browser-default dark button text colour. Its pink outline is legible; the actual word **Focus** is not. The equivalent cream button is readable. This is a production **contrast defect** independently of the newly fixed horizontal category labels.

## Deliberately small styling repair

`editor-focus.css` now gives the original `.editor-focus-toggle` **`color:inherit`**, so it matches the editor's actual cream/dark foreground in its normal state. When pressed, the existing pale peach background deliberately uses explicit `#292433` dark foreground, not inherited white, which would be unreadable against peach. The original Focus button, label, border, size, selected behaviour, source input ownership and default multi-row inspector are unchanged.

The [original source browser contrast test](../../scripts/visual-focus-label-contrast-agent1.mjs) tests **320/360/412/499/500 CSS px × cream/dark** in Material → Finish 1. It reads genuine `getComputedStyle` text/background values, computes WCAG relative-luminance contrast and **fails below 4.5:1** for both normal and pressed states. It uses real Playwright `.tap()` to enter Edit, select Material/Finish 1, activate Focus, and exit back to the original selected tool without losing state. Its PNG and numeric evidence appear under `focus-contrast/` in the [high-DPI workflow](https://github.com/gamesbyian/wallgen/actions/workflows/visual-high-dpi-agent1.yml). All prior 84-source-screen optical/geometry checks also rerun.

**Unverified remains:** physical Android font scaling, screen-reader announcements, other parameter/lock workflows, human approval of Focus's design, and optional Focus-versus-All comparative satisfaction. This narrow contrast fix does not change Focus default or check master acceptance #15.
