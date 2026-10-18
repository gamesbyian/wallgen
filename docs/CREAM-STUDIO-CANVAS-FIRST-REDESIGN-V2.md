> **Implementation source of truth:** [Implementation-Safe Redesign Pack](IMPLEMENTATION-SAFE-REDESIGN-PACK.md), [12 canonical non-generative reference plates](ui-reference/README.md), and [machine-readable full control contract](ui-reference/canonical-screen-contract.json). Previous generated vision mockups are not exhaustive and **must not be implemented literally**. The real UI atlas and screen contract decide required functions.\n\n# Cream Studio | Canvas-first v2 design plan

**Revision:** 18 October 2026. **Status:** design recommendation, no production UI change. **Evidence:** [1,648-image completed atlas](https://github.com/gamesbyian/wallgen/actions/runs/39166559800), of which 832 captures represent 412 × 892 CSS px Pixel 6 Pro-sized mobile/Chromium touch emulation. Screenshot root zoom at 100/75/66/50% is **not** native Chrome zoom. The gallery/wallpaper art is masked in evidence captures; the proposed rainbow images are illustrations.

**Full original audit:** [Cream Studio Pixel 6 Pro analysis](CREAM-STUDIO-PIXEL6PRO-UI-AUDIT-2026-10-18.md).

## User-approved decisions

1. **Remove the unnecessary “Your canvas” heading and Fit/100% field above the wallpaper.** The artwork is self-evident, and Fit/zoom readouts do not justify their own permanent horizontal row.
2. **Place Pan, Zoom +, Zoom − and Fit together in a compact camera rail at the side of the artwork.** Place directional nudge tools on the opposite side where useful. Camera controls must act on the viewport only, never alter recipe-generation settings, exports, or the wallpaper's full extent. A numeric zoom value can appear on interaction or in a side-rail affordance, but not in a second header.
3. **Preserve the original app icon.** Keep exactly `assets/roygbiv-logo.svg` in the upper-left masthead beside the rainbow R.O.Y.G.B.I.V. name, matching the current app. Do not replace it with a generic symbol or generated logo. Keep the approved cream and black theme dots with thin black outlines.
4. **Maximize usable vertical space across *every* screen**, not just Studio. Remove redundant headings, explanatory copy, oversized gallery commands and fixed-height empty editor cards where possible. Preserve clear hierarchy and reachable controls instead of simply shrinking fonts.
5. **Preserve flat, colourful ROYGBIV sliders.** Randomly assign stable colours within each panel with no repeats; blue stays eligible. Never reshuffle because of a rerender, parameter switch or undo.
6. **Retain production complexity and functionality.** Changes are visual/interaction-level proposals, not permission to remove geometry, loops, path smoothing/anchors, interior targeting, layered textures, history, locks/dice, metadata or export features.

## Illustrated screen geometry: why the top bar should go

The original *proposal* had a 97px masthead followed by a roughly 48px canvas-heading/zoom region. Its wallpaper frame began at y≈145px. The **v2 illustration** has a compact ≈73px masthead and no separate canvas label or top zoom row. The wallpaper begins at y≈83px, a **62px earlier start in the proposal illustration**. This is not a direct measurement of wasted space in the running app. V2's illustrative Studio frame measures **312 × 676px**, matching the original **600:1300** artwork aspect ratio (rounded). Actual responsive sizing should be derived from dynamic viewport, safe areas, available side gutters, editor height and bottom navigation, not fixed percentages borrowed from the mockup.

The viewport should use the screen as follows:

- **Masthead:** approved logo + wordmark, cream/black circles; long title expansion/version/status may move to a context menu or About section on mobile.
- **Studio:** canvas immediately beneath the masthead, maximum complete artwork, side camera rail and persistent bottom navigation. Do not spend a dedicated row on “Canvas,” “Fit 100%,” dimension badges or redundant status.
- **Edit:** preview plus one bounded contextual inspector. Reduce multiple category/title/selected-value ribbons to one compact route/breadcrumb and useful setting rows.
- **Draw:** visible anchor canvas and phase-specific actions; keep Apply/Cancel persistently available, but collapse lengthy instructional text.
- **Explore:** search + filters then artwork-first cards. Prioritise thumbs over headings and action bars. Saved/favourites remains distinct from recent history.
- **More:** group Export, Share and Identity/Metadata. Don't waste a quarter of the sheet on decorative preview when the output task needs controls.

## Twelve coherent concept screens

The revised 36-slide deck now includes twelve constructed 412 × 892 proposal screens:

| Screen | Focus |
|---|---|
| Studio | Canvas-first with no heading/zoom row; camera controls beside artwork. |
| Edit / Geometry | Consistent slider/value/stepper, breadcrumb and advanced settings. |
| Draw / Anchors | Smoothing, extension, Apply/Cancel in a phase-specific pane. |
| Explore | Immediate searchable thumbnail grid, compact filter row. |
| More | Compact export, share and metadata groups. |
| Material | Three-layer textures and predictable small rotation shortcuts. |
| Colour | Seven ROYGBIV targets and stable flat-colour controls. |
| Diagonal | Rotation, whole-row mirror and reverse controls. |
| Compact tool | One setting returns spare inspector height to the preview. |
| Focused shared slider | Optional one-parameter-at-a-time presentation. |
| Recent variations | Actual wallpaper cards, clear restore context. |
| Search results | Find exact setting and reveal target without losing scroll. |

All concepts contain the **same original product-logo art** and design vocabulary. They are *not* generated screenshots of already-implemented production features. Additional deck material includes screenshot close-ups from the verified atlas, side-by-side current/concept frames, implementation tables and a separate generated rainbow-print lifestyle glamour image labelled as art direction.

## Other second-pass improvements

**Reduce stacked navigation without hiding features.** The current seven categories and 40+ named tools must remain available. A single category/tool breadcrumb plus a horizontal, searchable tool chooser can replace redundant headings, but users must always know which parameter is active. Selection from search should reveal the selected chip; freely scrolled tools should retain their manual position.

**Dynamic inspector height.** A one- or two-setting tool need not consume the same height as a three-layer material editor. Reserve the remaining height for artwork, and recalculate preview/tray boundaries atomically only on navigation/expansion, never on every input event. No artwork/control overlap is permissible.

**Shared component grammar.** Reuse typed row layouts for slider+numeric+steppers, selector, toggle, colour picker, compound rotation and nested layer. Die/lock trailing slots are reserved when present and otherwise don't waste an entire row. Disabled controls retain legible reasons for inactivity.

**Touch and accessibility.** The visual icon can be small while its actionable surface is larger (roughly 40–48 CSS px for major tools where feasible). Meet applicable WCAG 2.2 target size/spacing and maintain visible focus, explicit labels, screen-reader announcements, keyboard operability and reduced motion. Avoid overlapping hitboxes along tight camera gutters.

**Preserve exact semantics.** Nudge and zoom are camera transformations, not recipe changes; point/path adjustments and smoothing mutate actual editable geometry only when explicitly selected. Continue off-frame path extrapolation and full-frame export, including hidden parts of a path. Make history/favourite/undo contexts explicit rather than reusing similar-looking actions with different effects.

**Gallery and utilities.** Search/filter chrome must earn its height. Remove repeated page titles that duplicate bottom navigation without aiding orientation. Keep image actions separate from favourites. Metadata expansion should scroll fields into view, and global success/error notices must never be hidden inside an inactive More sheet.

## Google Photos-inspired shared slider: optional hybrid, not compulsory

Google Photos' 2025 Android editor exposes [categories and selectable adjustment tools](https://support.google.com/photos/thread/363127706/easy-edits-with-our-new-editor?hl=en), with value sliders that appear for the selected adjustment. This supports the **interaction principle** of selecting a parameter and adjusting it using a shared visual control; it does not prove Google Photos literally uses one persistent UI slider widget internally.

**Proposed A/B study:** keep the visible multi-slider inspector as the **default** for power users and comparative tuning. Add an opt-in **Focus** mode with parameter chips and **one large slider**, numeric value and stepper. Selecting another chip updates the slider's label, value and already-assigned colour **without changing other recipe parameters, reassigning colours or undoing edits**. A mode switch must preserve all values, lock/reroll states and edit history. Always allow returning to “All controls.” 

**Advantages:** larger touch target, less inspector height, one-handed adjustment, more artwork visible. **Risks:** concealed parameter state, more taps when tuning several variables, difficulty comparing effects, harder discoverability of disabled or locked settings. Evaluate tasks across Path, Material and Colour before deciding whether Focus merits implementation. References: [Google Photos help](https://support.google.com/photos/answer/6128850?co=GENIE.Platform%3DAndroid&hl=en), [2025 mobile editor analysis](https://9to5google.com/2025/09/05/google-photos-editor-redesign-android/), [Adobe Lightroom mobile gestures](https://helpx.adobe.com/lightroom/mobile/get-started/gesture-controls-in-lightroom-for-mobile.html).

## Roadmap

**P0 - Brand, camera and screen geometry:** retain exact icon + wordmark, remove decorative canvas title/zoom bar, relocate Fit/+/- and Pan, preserve full preview geometry, keep camera state separate from the recipe and ensure preview/tray non-overlap. Ship a narrow viewport regression test.

**P1 - Inspector and tool discovery:** one breadcrumb hierarchy, component-owned setting rows, dynamic short inspectors, semantic disabled/locked states, search reveal and manual-scroll persistence. Keep all tools and numeric controls.

**P1 experimental lane - Shared slider:** prototype optional focused parameter chooser, assess interaction cost against normal multi-row form; do not change default prematurely.

**P2 - Task workflows:** phase-specific drawing pane; space-efficient gallery and Saved/history distinction; grouped More/metadata; improved global announcements.

**P3 - Polish:** per-component CSS ownership, brand and typography checks, short-height landscape, screen-reader and keyboard focus, reduced-motion behavior.

## Regression gates

- No “Your canvas” / separate top Fit 100% row; original app logo appears directly beside the wordmark on every proposal/implemented mode.
- Camera Fit, zoom and pan operate from the canvas side; zoom steps follow app convention and do not change active recipe data or exported content.
- No clipping, obscured primary actions or preview/tray overlap at 412 × 892, width boundaries 499/500/790/791 and constrained-height landscape; on-device spot checks if physical Chrome issues are reported.
- All seven categories and named tools, three material layers, colour targeting, shape/intersection controls, anchors and exported paths remain reachable and deterministic.
- Tool selection/search/horizontal scroll are predictable; slider hues stable with no within-panel repeats; focused mode, if built, is optional and retains all values.
- Atlas state coverage, Chromium journeys, renderer and PNG round-trip checks remain green. The 1,648-image atlas is a valid UI baseline but does **not** establish physical Pixel 6 Pro performance.

## Research and provenance

Baseline atlas [run #39166559800](https://github.com/gamesbyian/wallgen/actions/runs/39166559800) and [downloadable ZIP (14-day retention)](https://github.com/gamesbyian/wallgen/actions/runs/39166559800/artifacts/12151472442): **1,648** images, **0** traversal errors, **0** missing states. Static GUI concept screens and glamour imagery are illustrations. No production code was changed by this revision.

Peer principles: [Adobe Express mobile UX](https://developer.adobe.com/express/add-ons/docs/guides/build/design/ux-guidelines/mobile-ux), [Canva](https://www.canva.com/help/navigate-canva-mobile-app/), [Figma](https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar), [Google Photos](https://support.google.com/photos/thread/363127706/easy-edits-with-our-new-editor?hl=en), [NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) and [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).
