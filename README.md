# R.O.Y.G.B.I.V.

*Rainbow-Only. You Generate Based on Individual Variables.*

## Made with ChatGPT · Free for absolutely anyone

R.O.Y.G.B.I.V. was made by its project creator with **ChatGPT**. The creator
**claims no ownership of the code, ideas, concepts, or repository contents**
and wants anyone to be free to use the program, source files, generated
wallpapers, and other contents however they like, **for any purpose**, with
or without credit. That includes modification, redistribution, remixing and
commercial use. No permission or attribution is requested.

The repository includes a public-domain dedication under **[The Unlicense](LICENSE)**.
To the extent the creator holds copyright interests in these materials, those
interests are dedicated to the public domain; this cannot waive rights
belonging to unrelated third parties. There is no warranty.

Seed-based, offline-friendly, static rainbow wallpaper studio. Seven identifiable stripes always follow **red, orange, yellow, green, blue, indigo, violet** over a black or white canvas. No runtime dependencies, accounts, tracking, asset downloads, or build pipeline.

## Launch

Serve the repository directory with any static web server, for example:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173` on your computer. To access from a phone on the same Wi-Fi, bind your server to the LAN interface and visit its address. JavaScript modules require HTTP(S), so don't double-click `index.html` via `file://`.

Run `npm test` to check the reproducibility and structural invariants, or `npm run check` for syntax plus tests. Host the root directory on GitHub Pages for installation-free access.

## Phone-first Studio interface

**Cream Studio** is the new default appearance. The original charcoal **Original Dark**
design remains available from the header Theme selector, unchanged in `styles.css`.
Theme choice is remembered in this browser only and never enters a wallpaper recipe,
URL, favourite, seed, or PNG. To restore the old interface colours, select
**Original Dark**. The new `studio-themes.css` supplies light tokens and the
mobile layout on top of the intact original dark stylesheet.

**Swipe-first live editing:** the Edit tray stays below the visible, continuously
updated wallpaper. It now contains a small pull-down grabber, Randomize,
Primes only, and four compact category tabs. **Swipe left/right** across
individual setting cards to adjust the next control, including locks; **swipe
horizontally across the tab bar** to change the active category. Swiping
outward at the beginning or end of a card rail also moves to the adjacent
category. A small counter shows your position within each category. All
existing controls, optional texture layers, shadows, and numeric entries
remain the original live form elements; there are no proxy sliders or lost
settings. **Swipe down** on a noninteractive part of the tray or grabber to
dismiss it; tapping the picture or the Edit dock button also closes it. There
is no separate Done or Larger preview button, and no vertical scrolling
through the editor itself. The canvas always has its own unobstructed space.
**Expanded-preview editing:** when Edit opens, the header slides out above
the viewport and the action dock recedes to the right, leaving only a small
left-pointing expand arrow. The horizontal setting cards move into that same
bottom space, instead of sitting above the dock. Randomize, Primes Only and
the four category tabs become tightly spaced text-only controls. The regular
action dock is also shortened when the editor is closed. Pressing the expand
arrow restores the full toolbar and header; downward swipe and tapping the
picture still dismiss Edit. On a 412 × 915 viewport the preview should retain
over 640 CSS pixels of height even while actively editing. All features remain
accessible, unchanged in both Cream Studio and Original Dark.

Explore and More still occupy reserved space beneath the preview. This works
in both Cream Studio and Original Dark, without altering saved designs.

The primary interface is designed for the **Pixel 6 Pro portrait viewport** (the
wallpaper itself is still drawn at a 600 × 1300 logical aspect ratio, exported
at 3024 × 6552). At 790 CSS pixels and narrower the available viewport is shared
between a live wallpaper preview and any open adjustment tray; with trays
closed, the wallpaper regains the full preview area. A thumb-accessible, compact six-button dock provides
Edit, Explore, Randomize, Favourite, Download and More. When editing, the dock
moves off to the right, the header recedes upward, and the horizontal
setting-card editor occupies the reclaimed bottom strip. Explore opens a horizontal, swipeable
gallery; selecting a variation closes it and reveals the preview. More reveals
seed editing, Undo, New variation, nudge, the full metadata editor, link and
recipe export, and detailed scene information. The actual generating model,
saved recipes, original dark colours, texture and lighting options are retained.
The document itself does not need vertical scrolling on portrait mobile; only
the open editing/tools sheets scroll. The desktop layout remains available on
larger screens.

### Paired brand assets

The original raster artworks inspired matching, editable vector variants.
`assets/roygbiv-logo.svg` is the primary dark masthead icon, also available
as `assets/roygbiv-logo-dark.svg`; `assets/roygbiv-logo-cream.svg` is the
cream companion. Their seven staggered stripes are raised 2% within the icon
and finish before its outside edges, behind a contrasting phone outline.
`assets/roygbiv-logo-dark.png` and `assets/roygbiv-logo-cream.png` are
512 × 512 antialiased PNG versions produced deterministically from the same
geometry by `node scripts/build-logo-raster.mjs`. Both source and derived
files are free to use without credit under the repository dedication.

## Downloadable PNG metadata

Below the Download PNG controls, **Edit image metadata** opens a collapsed-by-default
editor. Fields include title, creator/artist, description, copyright/usage notice,
keywords, comment, software, creation date/time, and optional camera/device
make and model. Blank fields are omitted. PNG export embeds UTF-8 **iTXt** metadata
and compatible **eXIf** TIFF-style metadata, preserving the original pixel data.
Metadata is not drawn on the wallpaper and is not added to share links.

The optional **Remember these fields on this device** checkbox stores the metadata
in browser local storage. It is off by default; clearing the fields also updates
any remembered copy. This is PNG metadata, not JPEG EXIF; support for displaying
particular metadata fields varies among image-viewing applications.

## Output

- Google Pixel 6 Pro native screen: **1440 × 3120**.
- Each linear dimension multiplied by **2.1**: **3024 × 6552** PNG (19,813,248 pixels).
- Full resolution renders freshly; the preview and gallery use inexpensive rasterizations of the same seed-based scene.
- Base logical coordinate system: 600 × 1300, preserving the 6 Pro aspect ratio exactly.
- Unused pixels use the selected opaque background (`#000000` or `#ffffff`); individual marks in patterned stripes are placed whole without cropping at stripe boundaries or canvas edges.

## Brand and SVG logo

The app uses `assets/roygbiv-logo.svg` as its masthead mark and browser icon. Paired dark and cream vector variants and raster PNGs are described above. These assets share the repository's public-domain dedication; attribution is not required.

## Controls and workspace

The settings column uses four accessible tabs: **Design** (family, direction, paths and patterns), **Colour** (palette, background, outlines, light and shadow), **Texture** (three independent material layers and relief), and **Refine** (spacing, thickness, individuality, glow). Tab selection is remembered in the browser session, works with keyboard arrow keys, and does not re-render the current wallpaper. On narrow devices the four tabs remain in one compact horizontal row, with shorter labels where needed.

**Explore Variations** now lives in the preview column below the canvas, with responsive thumbnails, its own Generate 12 control and favourites; it no longer spans both columns.

The balanced-width **Randomize** button sits next to an equally prominent, always-unlocked **Primes only** checkbox above the tabs. With Prime mode on, every numeric percentage generated by Randomize is a prime from **2 to 97**, and all texture rotations are prime integer degrees from **2 to 359**. The seed is still a random string, and discrete choices (e.g. background and geometry) remain ordinary choices. Locked values have priority and may legitimately be non-prime. Prime mode itself is saved in the design recipe but deliberately has no lock; switching it doesn't change an existing image until you randomize.

- Eight scene families: Studio, Currents, Fracture, Confetti, Deco, Tapestry, Signal and Contour.
- Orientation: vertical, horizontal, diagonal or seeded selection. Stripes that meet the wallpaper edge on one side without reaching the opposite edge get paired inset ends; stripes that traverse opposed edges remain continuous.
- Geometry: straight, wave, zigzag, **chevron (repeating pointed-V ribbon path)**, jagged, stepped, arc and contour. The Design tab's **Shape frequency** slider changes how often wave/zigzag/chevron/stepped/jagged/contour bends repeat; **Shape depth** varies their amplitude. Both have a neutral 50% midpoint that preserves legacy designs.
- **Stripe line style** is independent of the **Stripe pattern** selector. Continuous, dotted and dashed *ribbon silhouettes* can be combined with **any path geometry**, whether straight, wavy or chevron, and independently combined with the existing filled dot/dash/chevron/checker/etc. motif patterns. Dotted styles use separate circular segments; dashed styles use short pieces of the selected path. These styles work with the existing material, outline and nudge pipeline.
- Stripe patterns (previously called Stripe construction): solid, dots, stars, dashes, diamonds, chevrons, hatch and checker.
- Palettes: classic, electric, pastel, jewel and muted. Their hues stay in ROYGBIV order.
- Outlines: none, white or black hairline, solid, double, broken and single-side, with a buffer coloured to match the selected background.
- **Ambient light & shade (Colour tab):** choose Off (default), Soft daylight, Golden hour or Cool moonlight, and a corner for the light source. Light intensity adds a soft warm/cool wash across the **whole canvas**, including the background and stripes; Canvas shade darkens the opposite region with a broad gradient. Canvas ambience does not cast shadows from the stripe silhouettes. An independent **Cast stripe shadows** option lives in Design (off by default), with strength, softness and light-source direction. Those optional shadows follow the completed stripes when nudged, while the ambient light stays fixed in canvas space. Old designs default to Off, and the controls remain lockable, deterministic and saved in recipes.
- Materials: paper grain, watercolour, construction paper, handmade paper, corrugated board, linen, canvas, denim, knit, felt, corduroy, concrete, stucco, stone, adobe, drywall, wood grain, vinyl sheet, foil, and glossy paper. The ungrouped menu works across three independent material layers. Layer 2 is hidden until **New texture layer** is clicked under layer 1; layer 3 can be added in the same way under layer 2, and either extra layer can be removed. Each layer has its own strength, scale, surface coverage (background, stripes, or both), ±90° buttons, freely editable angle (including fractional degrees), and blend mode (normal, multiply, screen, overlay, soft light, difference). Rotations and enabled layers persist in URLs, saved recipes, favourites and PNG exports.
- Chaos, thickness, **stripe spacing**, geometric individuality, pattern homogeneity, glow and outline buffer. Stripe spacing now adjusts only the distance between stripe centres, while thickness is controlled solely by Stripe thickness; at tight settings the ribbons can deliberately overlap. Every slider has −/+ adjustment buttons and an editable numeric percentage field immediately after +. Individuality adjusts per-stripe directions, parallelism, shape and edge profile, while all stripes retain the same motif.
- **Texture displacement** (0–100%) actually warps the stripe contours using a higher-resolution procedural height field. Material type, rotation, scale and strength change the relief, and a seeded neutral grain is used when no stripe texture is selected, so the slider is never silently inert. Increased sampling and bounded displacement make the effect visible on phone previews without allowing the stripe edges to cross. At 0% the original crisp geometry is unchanged. This is edge-geometry displacement, not GPU bump mapping.
- Five compact directional controls in a single row above the preview nudge the **already composed artwork** up/down/left/right by 2% of frame size per press (up to ±30% per axis), plus reset. The preview caches stripe ink **with 30% off-frame overscan on every side**, so ribbons that already run outside the wallpaper remain unbroken when nudged; stripes intentionally ending inside the frame retain those endpoints. Nudge clicks move this immutable image under a stationary background, without rerunning edge-balancing or regenerating geometry. Full-resolution exports generate only the overhang needed for the saved offset to limit memory usage, while preserving the same composition and background textures. These offsets travel with saved recipes, links, favourites, Undo and PNG export. **Undo** restores prior designs and their locks (up to 80 changes). **New variation** changes the seed unless it's locked. **Randomize**, now above the settings tabs, changes only unlocked settings and respects the optional prime-number constraint; each setting (including seed, composition position, texture rotations and whether layers are enabled) has a small line-art open/closed padlock control. Locking an automatic setting also freezes its actual resolved choice, and locks survive saved recipes, favourites and share links. `Auto` settings resolve according to the seeded style family.
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

At 3024 × 6552, PNG rendering needs multiple substantial canvas buffers; textures reuse a scratch surface for each additional layer, but three active textures can make exports more demanding on mobile devices. On memory-constrained browsers exports may fail; the app catches and reports encoding failures. Non-photorealistic procedural material textures are deliberately used rather than scanning copyrighted materials. SVG export and user-supplied material scans are potential future additions. The phone home screen may crop or pan wallpapers; inspect the exported art in the phone wallpaper picker before applying.

## Publishing to GitHub Pages

A `Publish Wallgen` workflow tests and deploys the root static site on pushes to `main`. On first use, enable **Settings → Pages → Build and deployment → Source: GitHub Actions** in the GitHub repository if it is not enabled already. The expected URL is `https://gamesbyian.github.io/wallgen/` once a deployment succeeds. There is no domain, cloud infrastructure or API dependency.
