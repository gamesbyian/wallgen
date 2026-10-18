# ROYGBIV icon library (approved concept, implementation pending)

This directory holds 55 standalone production SVGs prepared from the approved ROYGBIV icon-system concept. **This commit stages assets only: no application source, existing branding, CSS, recipe behavior, or UI markup is altered.** The established original `assets/roygbiv-logo.svg` stays untouched.

- Icon paths: `assets/icons/roygbiv/<name>.svg`, each a transparent scalable 32×32 SVG with accessible title, rounded 2.4-unit dark/currentColor strokes, and solid color accents.
- Icon index: [manifest.json](./manifest.json), including intended meaning, role, palette and reference pointer.
- [Review sheet](./review.html), a standalone HTML icon inventory outside the app.
- Approved visual source: `assets/icons/references/roygbiv-icon-system-approved.png` (the original approved 1448×1086 generated raster) and `assets/icons/references/roygbiv-icon-system-approved.svg` (a companion self-contained vector reconstruction; icons are hand-authored translations, not crops or automated traces).

## Design grammar

Use consistent 32×32 coordinate space, round caps/joins, and 2.4 stroke. The brand spectrum is red `#FF474E`, orange `#FF9B39`, yellow `#FFE25B`, green `#4FDD87`, blue `#53AAFF`, indigo `#6359E5`, violet `#BB64ED`. Use flat fills and strokes only: **no gradients, filters, raster fragments, emojis or font glyph icons**. Neutral strokes inherit `currentColor` when SVGs are inline; standalone `<img>` uses a dark browser default. Never communicate state exclusively by colour; retain text labels, checked states, and accessible button names.

Icons are artwork, not touch targets. Keep a recommended minimum 44×44 CSS-pixel interactive hit box on mobile while artwork can be 20–28px. A selected control can use a solid tinted tile, clear outline, or text treatment; the icon's own rainbow palette should not be modified arbitrarily. For disabled controls, apply UI state/opacity to the container rather than editing SVG geometry. Mirroring directional glyphs is optional; named directional icons are provided.

## Integration checklist (deliberately NOT performed)

1. Map the existing controls in `index.html`, `src/app.js`, `src/mobile-studio.js`, and related editor/mobile CSS to manifest icon names. Preserve button labels and keyboard/screen-reader semantics.
2. Review mobile preview rails, nav bar, panel tab actions, generator controls and effect utilities at 20/24/28px before substitution. Compare touch targets, optical centring and 100% zoom layout.
3. Use an icon-rendering strategy with stable caching (external SVG via `img`, or inlined SVG when `currentColor` theming is needed). Avoid runtime network fetches for each icon.
4. Implement hover/focus/pressed/selected/disabled states in CSS, using accessible contrast. Ensure icon labels still announce what an action does.
5. Keep existing app branding unless a separate brand-icon change is specifically approved.
6. Run existing `npm run check` and mobile/browser-smoke after integration, comparing the before/after screenshots with the saved reference.

No live controls are wired to these icons yet, by explicit request.
