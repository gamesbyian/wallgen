# ROYGBIV icon integration

The approved SVGs in `assets/icons/roygbiv/` are now used by existing primary navigation, editing and preview controls. This pass deliberately changes **only icon contents**, not the bounding boxes, grid structures, responsive breakpoints, button labels, DOM identities, or user interaction events. The masthead's existing logo is retained.

- Source icon helper: `src/ui-icons.js`, with four generated geometry inventories. Static HTML keeps app-relative SVG fallbacks and the helper upgrades them to inline SVG so neutral strokes inherit the selected cream/dark theme's `currentColor` without recolouring the rainbow accents. No runtime network fetch is necessary.
- CSS: `icon-system.css`, last stylesheet, defines image sizing within existing glyph slots; no new button layout, no positioning, and no new responsive panel rows.
- Dynamic editor: `src/editor-layout.js` and `src/editor-schema.js` apply the same asset vocabulary as the static dock. Settings dice and locks retain their original event handlers and aria state.
- Dynamic preview: mobile zoom, direction controls, and favorite-on/off graphics reflect existing state.
- The individual asset files remain standalone; no production asset uses a gradient.

## Placement invariants

- Seven editor categories stay on the same mobile row. Their labels are not pushed by icon artwork because the existing mobile rule hides category icon spans.
- All six main-dock and six editor-rail controls retain their original IDs, native button parents, short labels and mobile rail sizes.
- All five nudge controls, two zoom buttons, variable steppers, lock buttons, and their hit-area geometry stay unchanged.
- The app keeps the same favourites/undo/download behaviors. Favourite icons update from aria-pressed, rather than overlaying a second decorative heart.

To validate: run `npm run check`, then `node tests/browser-smoke.mjs` in an environment with Chromium. Open/close Edit at Pixel 6 Pro portrait and check the editor tab row, preview rails, settings, lock/unlock, favourite state and zoom before accepting visual parity.
