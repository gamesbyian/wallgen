# CSS component ownership (2026-10-18)

The production wallpaper renderer, preview camera, recipe data and exported image are independent of these presentation styles. Mobile presentation is intentionally a series of components, not one global pile of `!important` overrides.

## Ownership

| Component | Canonical stylesheet | Scope |
| --- | --- | --- |
| Baseline desktop UI | `styles.css` | Shared layout, fields, locks, foundations |
| Theme tokens, masthead, two theme dots | `studio-themes.css` | Dark/cream surface colours and theme switcher |
| Responsive workspace reservation | `studio-themes.css` | Stage/tray separation, gallery and More sheet |
| Compact phone shell/dock | `mobile-compact.css` | Collapsed header, dock and editor-open behavior |
| Default five-destination mobile dock | `mobile-five-nav.css` | Five-destination styling and preview quick-action relocation; base dock geometry remains in `mobile-compact.css` |
| Grouped More source controls | `mobile-more-groups.css` | Three labelled content groups; mobile-only layout, not recipe or handler ownership |
| Editor-side camera buttons | `mobile-editor-rail.css` | Action rail, left/right preview shortcuts |
| Editor tabs, named tools and rotation | `editor-redesign.css` | Base editor structure, compact card and rotation row |
| Flat source setting-row accent family | `editor-setting-rows.css` | ROYGBIV category rails, flat theme surfaces, disabled-state cues; zero control geometry changes |
| Material layer chooser statuses | `editor-material-status.css` | Tiny source-backed Off / Auto / On / Zero accent rail on original three material chips |
| Interior element selectors, checkbox alignment and colour chips | `detail-controls.css` | Dynamic element controls, ink targeting, colour picker states |
| Imported path dialog | `image-path.css` | Import preview/dialog in both themes |
| Drawn path editing | `draw-path.css` | Drawing overlay, source action grouping, live phase pill, point controls, hint/action bars |
| Cross-component audit refinements | `ui-audit-fixes.css` | Only remaining shared exceptions, search/history, More/gallery proportions, short tray and material rotation width |

## Precedence and cleanup contract

1. Keep legacy baseline CSS loaded before the component refinements, preserving the current specificity-sensitive mobile layouts.
2. Put new component-specific declarations in the owning stylesheet, not another patch block in `ui-audit-fixes.css`.
3. Delete a superseded selector only after verifying it does not still provide a unique declaration for desktop, 500–790px, short landscape or 100–499px.
4. Maintain the rotation row's **four-column** layout separately from standard **three-column** die/lock settings. Applying generic `.lockable-setting` grid columns to `.texture-rotation-field` pushes +1°, +90° and reset buttons outside the card.
5. Keep the two-colour-theme circles' black outlines and pressed state in the theme stylesheet. The retired `#studioTheme` dropdown must not be reintroduced.
6. Preserve stable distinct ROYGBIV slider colours per card. The JS allocator (`src/rainbow-sliders.js`) owns assignment, while CSS owns range appearance.
7. After changing layout cascade, run `npm run check` and `node tests/browser-smoke.mjs`. The latter checks no control clipping, stage/tray separation, zoom, navigation, theme switching, slider uniqueness, and renderer parity.
8. Root CSS zoom in the screenshot atlas is an approximation, not guaranteed to match native Chrome browser zoom; treat discrepancies accordingly.

This consolidation removed retired theme-dropdown styling and the original 13-pixel interior colour-target checkboxes. Circle styling moved to `studio-themes.css`, imported-path styling to `image-path.css`, and interior control styling to `detail-controls.css`. Further changes should reduce the remaining exception sheet by migrating individual features only after browser geometry checks confirm equivalence.

## 2026-10-18 source-proven dead-rule cleanup

The old native theme dropdown and its sibling label were removed earlier, replaced by two native buttons with thin-black-outline cream/dark circles. `index.html` and `src/mobile-studio.js` no longer create a `.theme-switcher select` or descendant `label`. Four dead CSS selector arms were removed from the owning `studio-themes.css` stylesheet; no current theme button, brand, layout or recipe property was changed. A unit test checks that the retired selectors cannot quietly return. Continue CSS consolidation only after demonstrating selector death at the applicable viewport and verifying both live themes.
