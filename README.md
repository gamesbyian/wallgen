# WALLGEN

Seed-based, offline-friendly, static rainbow wallpaper studio. Seven identifiable stripes always follow **red, orange, yellow, green, blue, indigo, violet** over a black or white canvas. No runtime dependencies, accounts, tracking, asset downloads, or build pipeline.

## Launch

Serve the repository directory with any static web server, for example:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173` on your computer. To access from a phone on the same Wi-Fi, bind your server to the LAN interface and visit its address. JavaScript modules require HTTP(S), so don't double-click `index.html` via `file://`.

Run `npm test` to check the reproducibility and structural invariants, or `npm run check` for syntax plus tests. Host the root directory on GitHub Pages for installation-free access.

## Output

- Google Pixel 6 Pro native screen: **1440 × 3120**.
- Each linear dimension multiplied by **2.1**: **3024 × 6552** PNG (19,813,248 pixels).
- Full resolution renders freshly; the preview and gallery use inexpensive rasterizations of the same seed-based scene.
- Base logical coordinate system: 600 × 1300, preserving the 6 Pro aspect ratio exactly.
- Unused pixels use the selected opaque background (`#000000` or `#ffffff`); individual marks in patterned stripes are placed whole without cropping at stripe boundaries or canvas edges.

## Controls

- Eight scene families: Studio, Currents, Fracture, Confetti, Deco, Tapestry, Signal and Contour.
- Orientation: vertical, horizontal, diagonal or seeded selection.
- Geometry: straight, wave, zigzag, jagged, stepped, arc and contour.
- Motifs: solid, dots, stars, dashes, diamonds, chevrons, hatch and checker.
- Palettes: classic, electric, pastel, jewel and muted. Their hues stay in ROYGBIV order.
- Outlines: none, white or black hairline, solid, double, broken and single-side, with a buffer coloured to match the selected background.
- Materials: paper grain, watercolour, construction paper, handmade paper, corrugated board; linen, canvas, denim, knit and felt. Texture may cover both stripes and background (default), only the stripes, or only the background. Texture strength and scale are independent.
- Chaos, thickness, spread, geometric individuality, glow and outline buffer. Individuality adjusts per-stripe directions, parallelism, shape and edge profile, while all stripes retain the same motif.
- **New variation** changes only the seed, preserving all settings. The prominent **Randomize all** changes the seed, family, geometry, motif, palette, material, background, outline, texture coverage and every slider. `Auto` settings resolve according to the seeded style family.
- Generate twelve thumbnails, open any thumbnail, save up to sixty local favourites, download a PNG, copy a share URL or a portable JSON recipe.

**Determinism:** the current version's recipe seed and controls generate the same *scene geometry and colours* at preview and export resolution. Fine raster details are subject to canvas implementation and browser anti-aliasing. A recipe's version and generation code should both be archived for pixel-exact reproducibility after future algorithm changes.

## Architecture

- `src/model.js`: input normalization, deterministic PRNG, style rules and invariant seven-stripe scene model.
- `src/renderer.js`: paths, motif geometry, outlines and procedurally generated material patterns; pixel-independent 2D drawing.
- `src/app.js`: UI, URL recipes, gallery, local favourites, and 3024 × 6552 PNG export.
- `styles.css`: responsive desktop and mobile layout.
- `tests/model.test.js`: deterministic design, geometry and export contract tests.
- `tests/render.test.js`: lightweight canvas smoke tests, background material coverage and motif boundary tests.

## Known considerations

At 3024 × 6552, PNG rendering needs multiple substantial canvas buffers. On memory-constrained browsers exports may fail; the app catches and reports encoding failures. Non-photorealistic procedural material textures are deliberately used rather than scanning copyrighted materials. SVG export and user-supplied material scans are potential future additions. The phone home screen may crop or pan wallpapers; inspect the exported art in the phone wallpaper picker before applying.

## Publishing to GitHub Pages

A `Publish Wallgen` workflow tests and deploys the root static site on pushes to `main`. On first use, enable **Settings → Pages → Build and deployment → Source: GitHub Actions** in the GitHub repository if it is not enabled already. The expected URL is `https://gamesbyian.github.io/wallgen/` once a deployment succeeds. There is no domain, cloud infrastructure or API dependency.
