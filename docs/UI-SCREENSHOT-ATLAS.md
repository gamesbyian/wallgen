# UI State Screenshot Atlas

This workflow inventories **visible interface states**, not wallpaper variations or generated-art output. The preview and gallery canvases are visually masked while the real application and controls run. Drawn-path overlays and the import-dialog fixture remain visible because they are themselves UI states.

## Running

The GitHub Actions **UI state screenshot atlas** workflow has two entry points:

- **Pull requests touching UI code:** desktop / 100% *smoke* capture (all registered tools, conditionals and stateful journeys), **plus a bounded 412 × 892 Pixel 6 Pro-sized mobile smoke**. The mobile subset captures all seven editor categories, Fit camera rail, Focus, diagonal/material conditions, cream/dark, Explore/More, and a real three-stage Sketch → Refine → Edit points drawing journey without paying for eight full atlas combinations.
- **Actions → UI state screenshot atlas → Run workflow → full:** all eight viewport/zoom combinations and an uploadable screenshot atlas. Select **smoke** for a quick diagnostic.

Concurrent runs on the same PR/ref cancel superseded runs. Screenshot artifacts are retained for 14 days.

Local run:

```sh
npm install --no-save playwright@1.56.1 serve@14.2.5
npx playwright install chromium
npx serve . -l 4173
node scripts/capture-ui-atlas.mjs --out=artifacts/ui-atlas
# or a single desktop/100% smoke:
node scripts/capture-ui-atlas.mjs --smoke --out=artifacts/ui-atlas-smoke
# compact mobile screenshot subset, separately viewable via index.html:
node scripts/capture-ui-atlas.mjs --mobile-smoke --out=artifacts/ui-atlas-mobile-smoke
```

## Matrix and outputs

Full mode uses desktop **1440 × 900** and Pixel 6 Pro-sized mobile **412 × 892**, at **100%, 75%, 66% and 50%**. It uses **CSS root zoom on a fixed viewport**, an approximation for testing scaled UI and clipping, not literal Chrome-toolbar/browser-native page zoom. The mobile profile emulates browser touch/mobile viewport, not physical device performance.

The artifact **roygbiv-ui-atlas** includes (in ordinary PR smoke mode, the compact mobile atlas is nested under `mobile-smoke/`, with its own `index.html` and `manifest.json`):

- `index.html`: offline, searchable contact sheet with filters for viewport, zoom, UI state and tool, plus a deduplicated, linked clipping-diagnostic table. Unzip the archive and open this HTML document.
- `manifest.json`: capture identities, control context, viewport and zoom, recorded traversal errors, inapplicable tools and explicit expected-state gaps.
- `README.md`: generated run summary.
- `desktop/100/*.png` etc.: one screenshot per distinct navigation/state at a particular zoom, with additional scrolled-tool captures when necessary.

The UI runner fails if it encounters traversal failures, missing expected states, or a screenshot whose visible application state does not match its assigned name. It also asserts actual 26px desktop Material Finish rotation rows contain all original stepper buttons and number fields without clipping, guarding the source-qualified repair in PR #84. The artifact uploads even when the run fails. Every capture records a bounded, severity-ordered interactive-control geometry inspection in `cases[].inspection` within `manifest.json`. Each actionable finding includes an identifiable selector, short control label, visible fraction, missing pixels and clipping ancestor(s), with unbounded `totalFindings` and `ignoredScroll` counts. Controls outside intentional horizontal scroll strips, or outside the visible slice of a deliberately scrolled desktop Explore/metadata page, are excluded from warnings, avoiding the former mass of generic offscreen `button` findings. A warning is not automatically a user-facing defect: inspect the corresponding screenshot and interaction state; only assertions for named required UI states fail the runner.

## Coverage

1. Every named tool in the canonical `src/editor-schema.js`, under paths, radial, regions, nested regions, and tonal construction. Tools that do not apply in a particular structure are recorded separately as inapplicable.
2. Dependent panels and controls for repeated/floating arrangements, diagonal direction, hairpin/single and continuous loops, stepped and chevron paths, radial and region modes, woven/stroke/tonal constructions, dotted motifs, multiple material layers, shadows, lighting, and outlines.
3. Verified Explore-gallery journeys and top/bottom metadata panel visibility, plus stateful UI journeys for editable interior elements (empty/populated, line/band, contour, straight/no-oscillation, custom colour and individual targets, stack locking/reordering); favourites (empty/populated); image metadata (expanded/remembered); search and variation mode; setting locks; cream/dark themes; drawing and smoothing; manual anchor editing; SVG path import; and mobile rails.
4. Visible interactive shells, preview controls and trays. Buttons that initiate system file pickers or downloads are not activated solely to create a screenshot.

The image importer is driven by a synthetic, local SVG containing a strong diagonal, rather than user imagery. The fixed wallpaper canvas is hidden in captures, and the image generator is not varied for screenshot purposes.

## Quality and limits

A completed Actions job demonstrates that the screenshot process ran. Inspect the **manifest's missing-state and error counts** plus the actual images before declaring coverage complete. The schema and explicit state journeys cover identified UI states; they cannot establish mathematical exhaustiveness for every future conditional branch. When adding a new dynamic panel, add an explicit journey and a required-state assertion here.

Native OS dialogs (file picker/download prompt), hover/focus and keyboard-only accessibility states, the full range of toast messages, and actual-device Chrome zoom differ from the simulated browser environment and are not exhaustively represented. Screenshots do not replace device testing or test render-result variations.

Generated PNGs stay in Actions artifacts rather than being committed to the repository.

### Mobile smoke limitations

The 17-state **mobile quick plan** is defined in `scripts/ui-atlas-mobile-smoke-plan.mjs` and independently checked against `EDITOR_CATEGORIES` in `tests/ui-atlas-mobile-smoke-plan.test.js`. It covers every category once, **not every tool and conditional permutation**. Desktop PR smoke retains the full 204-state registered matrix; manually dispatched full captures retain all 1,648 states across the emulated desktop/mobile root CSS zoom matrix. Neither mode measures actual physical Pixel 6 Pro performance or real Chrome toolbar zoom. A mobile smoke success is never described as 832-screen mobile coverage.
