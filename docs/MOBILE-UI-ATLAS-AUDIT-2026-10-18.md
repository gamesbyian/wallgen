# Mobile UI atlas audit and remediation plan

**Date:** 2026-10-18  
**Status:** Diagnosis and implementation plan. No application UI changes are included in this audit branch.  
**Evidence:** [full eight-matrix atlas, run 39122470134](https://github.com/gamesbyian/wallgen/actions/runs/39122470134), [artifact 12135122316](https://github.com/gamesbyian/wallgen/actions/runs/39122470134/artifacts/12135122316), commit `53ebd9f4c1a96383fddc7f138d2765459adb731f` (atlas PR #67).

## Method, scope and limits

The full ZIP contains 1,652 captures: **208 mobile captures each at 100%, 75%, 66% and 50% CSS-root zoom** (832 mobile in total) and 205 desktop captures per zoom. I visually inspected representative images and side-by-side zoom states throughout the mobile inventory, checked targeted panel states, and matched findings with `index.html`, `editor-redesign.css`, `detail-controls.css`, `mobile-editor-rail.css`, `studio-themes.css`, `mobile-compact.css`, `draw-path.css`, `src/editor-layout.js`, `src/exploration-history.js`, and `src/app.js`. Their content on main matched the captured snapshot at audit time.

**Important:** The owner explicitly likes blue slider bars and requests random, nonrepeating ROYGBIV slider colours per panel; see M02. CSS root zoom is not native Chrome browser zoom on a Pixel 6 Pro. The atlas masks wallpaper pixels on purpose. These captures reveal UI geometry and visual consistency, not real-device performance. The full run recorded **zero missing *named* expected states, but four mobile navigation errors** attributable to the same redundant editor-search click at each zoom. “Screenshot exists” does not prove that a claimed surface is actually visible: see the atlas-fidelity appendix below.

References such as `pixel-6-pro/100/conditional-diagonal.png` are paths within the ZIP. They should become named visual regression cases during implementation.

## Prioritization

| ID | Priority | Problem | Remediation |
|---|---|---|---|
| M01 | P1 | Checkbox separated from its textual label | Shared compact checkbox row |
| M02 | P1 | Interior controls inconsistent; rainbow slider opportunity | Shared fields and unique ROYGBIV slider colours per panel |
| M03 | P1 | Seven colour-target checkboxes too small | Accessible whole-cell colour toggles |
| M04 | P1 | Search results select a panel without exposing its active chip | Source-aware chip scrolling |
| M05 | P1 | Tool chips clipped at edges without scroll indication | Edge affordances and safe scroll padding |
| M06 | P1 | Header select text and current values truncated | Compact display labels and width allocation |
| M07 | P1 | History view visually collides with editor content | Exclusive history panel mode |
| M08 | P1 | More panel has cramped inline utility links | Grouped touch-size action rows |
| M09 | P1 | Disabled/locked controls lose too much contrast | Semantic inactive-state tokens |
| M10 | P1 | Draw/edit anchor actions too tiny and crowded | Action hierarchy and touch-sized controls |
| M11 | P2 | One-setting tools waste most of reserved editor tray | Measured compact/standard/expanded tray |
| M12 | P2 verify | Reduced zoom leaves excessive unused vertical gap | Native zoom test, then geometry rationalization |
| M13 | P2 | Custom-colour swatch resembles empty/disabled field | Distinct swatch + value |
| M14 | P2 | Image importer visual language inconsistent with cream theme | Documented themed or intentionally dark modal |
| M15 | Technical | Cascading CSS overrides make these regressions likely | Consolidate responsive ownership |
| M16 | P1 | Critical mobile buttons have undersized hit targets | Minimum effective 40–44 px tap areas |
| M17 | P1 | Success/status messages nearly invisible on cream | Theme-aware notice palette and placement |
| M18 | P1 | Feedback may be hidden when More tray is closed | Global visible transient status region |
| M19 | P1 | Explore header/actions crowd out gallery thumbnails | Compact toolbar, usable visible cards |
| M20 | P1 | Expanding metadata can leave its new fields off-screen | Scroll revealed section into view |
| M21 | P1 | Search overlay hides its own toggle/close control | Reachable explicit close action |

### M01. Checkbox/label separation, P1

**Evidence:** `pixel-6-pro/100/conditional-diagonal.png` shows the Mirror horizontally and Mirror vertically checkboxes stacked above their captions; the reroll/lock controls form separate right-hand columns. Also inspect `tool-paths-colour-rainbow.png` for Reverse stripe order and `special-interior-one-element.png` for Enabled.

**Root cause:** Mirror fields are plain `label.field.mirror-field` with inline input/text in `index.html`. `editor-redesign.css` excludes `.mirror-field` from its generic horizontal label rule while other layouts use `justify-content:space-between`. Interior controls use a 35%/65% label-to-checkbox grid.

**Implement:** Create one shared toggle-setting row (input and adjacent `span` as a single native clickable label, fixed reroll/lock actions in a trailing column). Render mirror text inside a dedicated `span` without reordering the checkbox away from it. Apply to Reverse stripe order, all mirrored flags, pattern homogeneity, Enabled, and any ordinary checkboxes. Never float a standalone checkbox above its caption. Keep wrap in the label column.

**Acceptance:** The checkbox sits immediately next to the associated text, including at 50% zoom; the entire label toggles it; die and lock never overlap. Keyboard and pointer behavior are unchanged.

### M02. Rainbow slider-bar system with consistent component ergonomics, P1

**Evidence:** `pixel-6-pro/100/special-interior-interior-style-populated.png`, `...-interior-motion-populated.png`, `...-interior-placement-populated.png`, and `special-interior-band-style.png`. Select styling and layout are inconsistent with other control panels. **The blue slider bars themselves are a feature, not a defect.**

**User-approved design direction (2026-10-18):** Slider bars should receive **random ROYGBIV colours**, with **no repeated colour within an individual control panel**. Blue must remain an eligible colour and its playful presence should be preserved. Do **not** replace sliders with monochrome, cream or uniformly purple tracks.

**Implement:** Extract accessible shared control primitives for dynamic interior collections, including styled selects, labelled sliders with optional numeric readout/steppers, colour swatches and grouped checkboxes. For the sliders, add a dedicated panel-scoped colour allocator rather than hard-coding a global `accent-color`. Each control panel gets a shuffled *permutation* of red, orange, yellow, green, blue, indigo and violet; its concurrently visible sliders receive unique assignments. Seed the permutation from a stable panel identifier plus a generation/session key, so colours are randomized per logical panel/generation but **do not jump around during edits, undo, rerenders or reordering**. Blue is one of the seven colours, not an error. If a panel contains more than seven simultaneous slider bars, create meaningful subpanels or expand the pool to distinct ROYGBIV-derived hues rather than duplicate a colour inside the same panel. Support WebKit and Firefox tracks/thumbs and accessible colour-independent value indication. Preserve existing callbacks, undo, locks and element identity.

**Acceptance:** Every visible slider bar is recognizably rainbow-themed, no panel repeats a slider colour, existing blue appearance remains part of the repertoire, values still have readable numeric/text indicators, and changing panel selection does not randomly recolour it mid-interaction. Dropdown geometry and disabled/focus states match the surrounding studio on both themes.

### M03. R/O/Y/G/B/I/V selection boxes too small, P1

**Evidence:** `pixel-6-pro/100/special-interior-interior-targets-populated.png`, `special-interior-selected-colour-targets.png`. Seven tiny native blue checkboxes have very little visual or touch separation.

**Root cause:** `src/app.js` creates seven inline checkbox+letter labels; `detail-controls.css` forces `repeat(7,minmax(0,1fr))`, with no robust minimum hit size.

**Implement:** A seven-colour segmented toggle-chip row: the entire chip is clickable and visibly selected, letter remains inside its cell, full name in accessible label, selected state not conveyed by colour alone. Target approximately 36–44 CSS px in normal mobile usage; allow controlled wrap or explicit horizontal scrolling at very narrow widths. Preserve “cannot deselect last remaining target” and “all selected means all colours” semantics.

**Acceptance:** Every colour is reliably tappable, the chosen set obvious, and chip boundaries do not collide.

### M04. Search result and tool strip disagree, P1

**Evidence:** `pixel-6-pro/100/special-search-matching-setting.png`. Search for “shadow” shows shadow sliders while the horizontally scrolled chips still show unrelated interior tools; the selected Shadows chip is off-screen.

**Root cause:** `src/editor-layout.js` `selectEditorTool()` intentionally preserves scroll position on all tool selections. That is desired for manual taps, but search and programmatic navigation have different expectations.

**Implement:** Introduce an optional navigation-source argument (`manual`, `search`, `category`, `keyboard`). Preserve offset exactly on manual selections. For an explicit jump when the target is *entirely* outside the strip viewport, minimally `scrollIntoView({block:'nearest',inline:'nearest'})` within the chooser; never center or reset it on every click.

**Acceptance:** Searching “shadow” leaves the Shadows chip clearly visible and selected; manually swiping/tapping chips never snaps the rail to the start.

### M05. Partially clipped chip labels without affordance, P1

**Evidence:** `pixel-6-pro/100/tool-paths-layout-direction.png`, `special-interior-interior-style-populated.png`, `tool-paths-material-layer3.png`. First/last chip labels are physically cut at the scroller boundary, while the left pinned Tool reroll action consumes horizontal room.

**Root cause:** `editor-redesign.css` uses an invisible-scrollbar horizontal chooser, natural-width nowrap chips and a sticky leading action. There is no fade/overflow cue or safe end padding.

**Implement:** An edge fade or minimal arrow/overflow indicator only when more chips exist in that direction; scrolling content padding at both ends; prevent sticky reroll from visually covering text. Preserve native touch-drag, manual position, and active-chip visibility for programmatic navigation. Do not force wrapping onto two rows.

**Acceptance:** Partial chips read as intentionally scrollable, no active chip is hidden under rail, and labels remain intact inside their own button.

### M06. Truncated top strip values, P1

**Evidence:** `pixel-6-pro/100/editor-open.png` and `special-vary-wild.png` truncate the Auto family and strength fields; `shell-mobile-more.png` truncates the header theme (“Cream …”).

**Root cause:** `editor-redesign.css` assigns 34% to the family control and fits two more selects plus three small buttons into the remaining row; `studio-themes.css` constrains theme width to 88 px.

**Implement:** Short display option names while preserving stable underlying values and full accessible descriptions; a common `minmax(0,1fr)` allocation with minimum sensible widths; avoid shrinking main value labels ahead of ornamental actions; permit an alternate compact stacked row only when space truly requires it. Make “Cream”/“Dark” fully visible in header.

**Acceptance:** Current values of family, reroll/vary, strength and theme are readable at each zoom, with no text protruding into arrows or borders.

### M07. History behaves like an overlay over editor content, P1

**Evidence:** `pixel-6-pro/100/special-history-empty.png`, `special-history-with-variations.png`. The history area consumes the control-card slot; faint remnants/edges of underlying content remain and the unlabeled history icon gives little explanation.

**Root cause:** `src/exploration-history.js` inserts `#editorHistory` as a sibling, while `editor-redesign.css` applies `flex:1` plus an `.editor-history-open .editor-category-panel` override.

**Implement:** Explicit editor `mode='tool'|'history'` with mutually exclusive rendering of card/history. Keep the current tool/category and chip scroll offset. Add a clear small heading and Back/Close action. Scrolling belongs to the history strip, not the underlying card. Use one bounded flex child rather than overlapping grow areas.

**Acceptance:** Clean border and heading, coherent empty/populated states, no subordinate panel peeking through, return restores precisely the prior tool.

### M08. More tray contains tiny run-on text links, P1

**Evidence:** `pixel-6-pro/100/shell-mobile-more.png`. “Restore design from PNG” and “Edit image metadata” run together; Copy link, Copy recipe JSON and Save recipe JSON appear as small pink underlined phrases with ambiguous hit regions.

**Root cause:** `src/mobile-studio.js` moves original desktop utility DOM sections into `#mobileToolsContent`, retaining desktop inline-link layouts.

**Implement:** Retain original button elements and event handlers but arrange actions in touch-friendly full-width or two-column rows (about 40–44 CSS px minimum height); group Restore/Metadata, Sharing/Recipe, and generated-image actions, with consistent icon/label spacings, borders and selected/expanded states. Make metadata panel's open state visually explicit. Preserve desktop positioning.

**Acceptance:** Every utility action has a clearly bounded tap area; labels don't run into one another; keyboard order matches visual order; sheet scroll never overlaps the fixed dock.

### M09. Disabled states have insufficient visual contrast, P1

**Evidence:** `pixel-6-pro/100/tool-paths-material-finish1.png`, `tool-paths-path-shape-details.png`, `tool-paths-effects-lighting.png`, `special-interior-style-read-only.png`. Some disabled values and controls nearly vanish against cream.

**Root cause:** compounded low-opacity styles, including `.editor-setting-die:disabled{opacity:.27}` in `editor-redesign.css`, `select:disabled,input:disabled{opacity:.4}` in `detail-controls.css`, and pale cream variables.

**Implement:** Theme-specific foreground/border tokens for disabled but legible controls; fade actionable affordances rather than entire parent rows. Make lock/disable reasons identifiable via concise title/accessible descriptions and occasional compact hint. Keep controls looking disabled without being practically invisible.

**Acceptance:** Inactive settings are discoverable and their labels readable at 100%; their enabled/disabled differences remain unmistakable at reduced zoom.

### M10. Path-drawing action bars too dense, P1

**Evidence:** `pixel-6-pro/100/special-draw-edit-point-anchors.png`, `pixel-6-pro/75/special-draw-ready-path.png`, `pixel-6-pro/50/special-draw-ready-path.png`.

**Root cause:** `draw-path.css` wraps many buttons into a compact panel with mobile 9–10 px fonts and 26 px minimum action heights. CSS zoom further shrinks them.

**Implement:** Separate primary “Use path / Cancel / Edit points” row from smoothing, redraw and anchor-management groups; give primary hitboxes clear visual priority and 36–44 CSS px effective targets at normal zoom. Make secondary controls scroll internally when required, and keep the panel away from the live anchor workspace and fixed rail. Do not modify path geometry code.

**Acceptance:** Every operation is reachable with a finger, with no clipped caption or invisible primary action, and active smoothing/edit modes are obvious.

### M11. Fixed-height card wastes preview space, P2

**Evidence:** `pixel-6-pro/100/tool-paths-layout-structure-mode.png`, `tool-paths-colour-canvas.png`, `tool-paths-details-glow.png`. One or two controls occupy the same tall tray reserved for complicated panels.

**Cause:** `--mobile-tray-height` and `height:100%;flex:1` are chosen primarily by viewport rather than actual content.

**Implement:** Stable measured density tiers (`compact`, `standard`, `expanded`) based on rendered applicable controls, with hysteresis to avoid resizing while sliding; allocate reclaimed height to preview while preserving no-overlap rule.

**Acceptance:** Single-setting card uses less space, long cards remain fully reachable, and switching tools does not introduce jitter.

### M12. Huge middle gap at reduced atlas zoom, P2 / VERIFY

**Evidence:** `pixel-6-pro/50/editor-open.png`, `50/special-draw-ready-path.png` versus 100%. Preview shrinks toward top while bottom-fixed editor stays distant.

**Caveat:** Root CSS zoom is not native Android Chrome zoom; this gap may be amplified by the harness.

**Implement:** First reproduce under intended device/browser scaling. If real, unify `.layout`, `.studio-stage` and tray-height calculations; favor aspect-ratio-aware preview filling the reserved space. Preserve rendered artwork fidelity and no preview/export mismatch.

**Acceptance:** All four zoom settings allocate space coherently without squeezing interactive controls.

### M13. Custom-colour input is not recognizable, P2

**Evidence:** `pixel-6-pro/100/special-interior-custom-colour-enabled.png`. A white colour input looks like an empty white field against the cream surface.

**Implement:** A visible bordered swatch with a numeric hex label, backed by a real native `input[type=color]`; distinguish enabled/disabled state and support white/black swatches.

**Acceptance:** The component reads as a colour picker at a glance and remains keyboard-accessible.

### M14. Import dialog stylistic disconnect, P2

**Evidence:** `pixel-6-pro/100/special-image-import-candidate-or-error.png`. Navy, purple and bright pink import modal uses a different visual vocabulary from the cream editor.

**Implement:** Decide explicitly between theme-matched dialog tokens and an intentional dark, high-contrast image-inspection workspace. Harmonize headings, input heights, selection borders and primary/secondary controls without reducing candidate preview legibility.

**Acceptance:** Consistent intentional appearance and usable controls in both studio themes and at all four zoom settings.

### M15. Responsive CSS ownership is fragmented, technical

**Evidence:** Competing mobile selectors in `studio-themes.css`, `mobile-compact.css`, `mobile-editor-rail.css`, `editor-redesign.css`, `detail-controls.css` and `type-system.css`, with multiple overrides for `--mobile-tray-height`, controls, tabs, selectors and disabled states.

**Implement:** Consolidate authoritative responsive layout geometry in the editor shell/styles, keep component-local style rules in their respective files, establish shared tokens for tray heights/rail width/field spacing/checkbox rows/disabled appearance. Remove superseded `!important` rules as each part is migrated instead of layering new overrides. Preserve the explicit 500–790 px compensation and desktop behavior. Coordinate CSS/icon ownership with agents working on icon assets.

**Acceptance:** One clear owner per mobile component family and no regressions in screenshot matrix.

### M16. Touch targets too small beyond the drawing panel, P1

**Evidence:** `pixel-6-pro/100/editor-open.png`, `tool-paths-layout-variability.png`, `tool-paths-details-shadows.png` and `tool-paths-material-layer1.png`. Editor category cells are roughly 34 px high, tool chips 27 px, the reroll/lock dice often 24–26 px, and the upper operation-row actions 25×29 px. At 50% CSS zoom, their rendered touch rectangles become smaller still.

**Root cause:** `editor-redesign.css` fixes short row heights and compact per-field action sizes; the 500–790 px compensation partly addresses typography but not all physical tap targets.

**Implement:** Audit *interactive hit rectangles*, not only visual glyphs. Prefer a target of 44×44 CSS px at normal physical mobile sizing where layout permits; at minimum ensure controls don't share a pixel-tight ambiguous hit area. Expand hit regions via padded group cells, move rare actions into an accessible overflow control if space is genuinely insufficient, and preserve the preview/editor no-overlap contract. Do not blindly make every 24 px die into a 44 px square without reflowing its row.

**Acceptance:** Randomize, lock, slider stepper, category/tab, history, search, tool chip, mobile rail and close actions are each independently tappable with no adjacent hitbox collision.

### M17. Theme-blind success message colour, P1

**Evidence:** `pixel-6-pro/100/special-metadata-scrolled-controls.png` and `shell-mobile-more.png` show faint green notice text nearly disappearing on cream.

**Root cause:** `styles.css` sets `#notice{color:#c2e9be}` for a dark background; the cream theme does not override this text colour. That foreground has only **approximately 1.32:1** contrast against the cream tray's `#fffdf8`, well below the 4.5:1 target for small text.

**Implement:** Add `--notice-foreground` and optional `--notice-surface` theme tokens with legible contrast against both light and dark backgrounds. Use the same treatment for undo, saved, copied, imported and other transient messages. Preserve unobtrusiveness without sacrificing readability.

**Acceptance:** A sample of each notice is legible in cream and dark themes at the smallest supported zoom.

### M18. Status messages can be moved into an invisible tray, P1

**Evidence and source:** `#notice` resides in `.secondary-actions`, which `src/mobile-studio.js` relocates into `#mobileToolsContent`. Actions originating from the live editor rail can trigger `showNotice()` while More is closed; the text therefore exists but is not visible to the user.

**Implement:** Use one accessible, application-level transient status host outside all mutually exclusive trays, positioned above the bottom dock/action rail while respecting safe-area insets; announce changes with `role=status`/`aria-live=polite`. Keep More's button/action layout but do not rely on it to convey global action success. Avoid duplicating notices and do not cover wallpaper preview controls.

**Acceptance:** Save/favourite, undo, import, copy and randomize notifications can be seen after invocation from both the compact dock and full editor, even if More is closed; transient status never obscures interactive controls.

### M19. Explore gallery reserves too little visible room for previews, P1

**Evidence:** `pixel-6-pro/100/shell-mobile-explore.png` (a genuine gallery-open screenshot, unlike the formerly mislabeled favourite journeys). The “Explore variations” heading and large Generate 12 / Favourites 0 actions stack vertically, leaving only a tiny sliver of the actual card row above the dock. The corrected empty/populated captures must be used to quantify this precisely.

**Root cause:** `studio-themes.css` caps the mobile gallery tray height while `.gallery-head` and `.gallery-buttons` occupy a large share of it; the gallery grid is separately horizontally scrollable and vertically constrained.

**Implement:** Make the gallery title compact and place Generate / Favourites as adjacent bounded controls (or a segmented mode switch plus Generate button). Reserve an explicit minimum visible height for at least one complete thumbnail and its caption. Let the gallery tray expand to a *measured* density or user-adjustable height if necessary, with the live canvas resizing above it. Avoid clipping thumbnail captions or relying on vertical scrolling before users can see what Explore does. Keep the gallery scroll rail independent from the controls.

**Acceptance:** On the 412×892 mobile reference viewport, the open gallery immediately shows at least one full favourite/generated thumbnail and its label, without covering the preview or dock. Empty-state message and populated grid both remain legible at all four zoom settings.

### M20. Metadata expands below the current More viewport without revealing fields, P1

**Evidence:** The original `pixel-6-pro/100/special-metadata-expanded.png` shows the “Edit image metadata” link near the bottom of More but not the expanded form; `special-metadata-remember-checked.png` exposes the form only after a later scroll. This is both a capture-harness false-positive and a genuine discoverability problem in the app's normal interaction.

**Root cause:** `src/app.js` toggles `#metadataPanel.hidden` in place without scrolling the new section into the active tray view. On mobile, `#mobileToolsSheet` is a fixed, height-limited scrolling container.

**Implement:** After a user opens metadata, schedule a layout-safe reveal of the heading/first editable field inside the More tray using `scrollIntoView({block:'nearest'})` or precise local scrolling. Do not scroll the entire application or steal focus unexpectedly. Keep expanded/collapsed aria state and ensure the panel returns to the right scroll position when closed. The atlas should assert actual onscreen fields, not merely an expanded attribute.

**Acceptance:** Tapping “Edit image metadata” on a phone immediately displays the form heading and an editable field without requiring blind exploratory scrolling. Closing it leaves the user in a sensible location.

### M21. Expanded search input obscures the control needed to close it, P1

**Evidence:** `pixel-6-pro/100/special-search-expanded-empty.png` shows a full-width search input covering the top operation strip. The capture script had to invoke `.editor-search-toggle.click()` programmatically to dismiss search because the original toggle may be underneath the input.

**Root cause:** `editor-redesign.css` positions `.editor-search-input:not([hidden])` absolutely across the entire row (`left:0;right:0;width:100%`, `z-index:20`), but `src/editor-layout.js` only provides a toggle button elsewhere in that same row.

**Implement:** Render a genuinely visible close/cancel button in the search row, giving the input its own bounded flex space. Differentiate the browser-native clear-query affordance from “close search”; optionally accept Escape and return focus to the original search action. Preserve current category/tool selection unless the user intentionally resets it.

**Acceptance:** On mobile at all zooms, search can be opened, cleared and closed by touch alone, and the dismiss control never sits behind the input.

## Atlas-fidelity and automation follow-up

These are test **limitations**, not conclusions that the app's gallery or metadata is broken.

**A01. Gallery images are false positives.** `pixel-6-pro/100/special-gallery-empty-favourites.png` and `special-gallery-with-favourite.png` still show the editor. The journey needs to close the editor, open Explore, assert `body.mobile-gallery-open` and visible gallery content, then capture both empty and populated cases. “Capture returned a PNG” is not enough.

**A02. Metadata snapshots miss the panel.** `pixel-6-pro/100/special-metadata-expanded.png` shows More controls but not necessarily the metadata form farther down. Add explicit viewport/scroll captures for top and bottom metadata fields; assert `metadataPanel.hidden===false`, and that expected form elements fall inside the screenshot.

**A03. Navigation and physical zoom are not certified.** The full run's four search failures all occur when a redundant final `.editor-search-toggle` click is intercepted by `#mobileActionDock`. Atlas PR #67 has a later change removing that redundant step; its actual full-run qualification must still be checked. Track surface class, expanded/selected controls, bounding boxes, intersection ratio and clickability for each claimed state; flag false-positive captures. The four root CSS zoom screenshots are *scaling approximations*, not verified Android native Chrome zoom.

**A05. Browser scaling is not equivalent to breakpoint coverage.** The requested 100/75/66/50 captures all use a fixed 412px Playwright viewport with `document.documentElement.style.zoom`. That means the 500–790px responsive rules in `editor-redesign.css` and `detail-controls.css` may not be exercised as they would be by native Chrome zoom. Add a *supplementary* browser-breakpoint matrix at 499/500/600/790/791 CSS viewport widths and small-height landscape cases, separately from the four user-requested zoom captures; assert when the `mobile-studio` breakpoint turns on/off. Do not silently rebrand root CSS zoom as native device zoom.

**A04. Add automatic geometric linting to the atlas.** For each visible control and associated label, record DOM rectangle, parent panel rectangle, line box overflow (`scrollWidth > clientWidth` where non-scrollable), z-index hit-test at center, and accidental intersections with fixed rail/dock. Exempt intentionally scrollable tool chips and preview. Retain evidence snapshots, not only a summary percentage.

## Recommended execution order

**Pass 1, accessibility and architecture:** M01, M02, M03, M09 with shared control primitives, panel-unique randomized ROYGBIV slider colours (including blue), and theme tokens. Lock down active/disabled/selection behavior and compare both themes.

**Pass 2, navigation and utility surfaces:** M04, M05, M06, M07, M08. Respect the existing requirement that manual horizontal chip scrolling must remain at its chosen offset. Fix A01/A02 in the capture runner simultaneously.

**Pass 3, advanced tools and proportions:** M10, M11, M12 (after device confirmation), M13, M14. Consolidate M15 incrementally rather than a wholesale CSS rewrite.

**Acceptance gate:** 412 × 892 mobile screenshots for every named UI surface at 100%, 75%, 66%, 50%; no hard clipping, unintended overlaps or text spilling beyond control borders; no false-positive panel-state captures; full controls reachable on Chrome/touch; both cream and dark themes, keyboard focus and disabled states reviewed; wallpaper and recipe behavior unchanged. Retain the image archive externally rather than adding hundreds of PNGs to Git history.
