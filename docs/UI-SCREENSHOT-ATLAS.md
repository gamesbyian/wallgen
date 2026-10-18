# UI State Screenshot Atlas

Purpose: exhaustive **UI surface** reference captures, not render-result testing. Each frame holds the same wallpaper seed, while navigation, structure, control availability and panel state change.

Run the **UI state screenshot atlas** GitHub Actions workflow on demand, or let it run when UI code changes. Download the `roygbiv-ui-atlas` artifact. It contains `manifest.json`, a generated README and PNGs arranged by viewport / zoom / state.

Local run:

```sh
npm install --no-save playwright@1.56.1 serve@14.2.5
npx playwright install chromium
npx serve . -l 4173
node scripts/capture-ui-atlas.mjs --out=artifacts/ui-atlas
```

The test deliberately spans **desktop 1440×900** and **mobile 412×892**, both at **100%, 75%, 66%, 50%** zoom. Zoom currently uses CSS root zoom on fixed viewports; this exercises scaled controls and clipping but is not an exact browser toolbar zoom emulation. Do not describe results as identical to Chrome's native page-zoom path.

Coverage is generated from `src/editor-schema.js`, covering every currently registered tool. It walks paths, radial, regions, nested regions and tonal states; exercises conditionally enabled subcontrols; and visits standard shells including drawing, tool search, favourites and mobile docks. The manifest distinguishes screenshots, deliberately inapplicable tools and traversal failures. The runner exits nonzero on unhandled failures, but uploads its partial inventory anyway.

**Boundaries and next coverage expansions**: input-dependent image-import candidate selection, actual manually drawn path anchors, the stateful interior-element editor, toast/undo/locked/search-results states, distinct gallery empty/populated states and platform-specific upload/download dialogs need dedicated deterministic fixtures and explicit journey scripts. Until those are covered, this workflow is an initial broad atlas, **not proof of complete UI-state coverage**. Further state inventory should inspect dynamically created controls in the DOM and compare reachable named states with an explicit expected-state registry. Keep screenshots focused on UI and avoid generating varied wallpaper artwork.

A CI run should be evaluated for failed navigation, cropped panels, invisible steppers, docks obscuring the editor, and controls disappearing at smaller zoom settings. Images themselves should not be committed; download the Actions artifact for visual review.
