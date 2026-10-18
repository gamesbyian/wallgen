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

Seed-based, offline-friendly, static rainbow wallpaper studio. Seven identifiable stripes use **red, orange, yellow, green, blue, indigo, violet** (or the explicitly reversed violet-to-red order) over a black or white canvas. No runtime dependencies, accounts, tracking, asset downloads, or build pipeline.

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

**Exploration-first editor:** The full wallpaper remains visible in its own
reserved space above the editing tray, even while adjusting settings. Opening
Edit removes the header and dock, then proportionally reduces the preview's
screen size without changing the artwork's saved zoom or crop. No editor,
popover or history view covers a stripe. There is **no vertical scrolling** in
the editor.

The old Design/Colour/Texture/Refine mixture has been replaced by six
unambiguous creative categories: **Layout, Path, Stripes, Colour, Material and
Effects**. Each category contains named tools; tap a category and its tool for
direct access. A sideways swipe can advance to the next *named* tool, but
swiping blindly through a long stack is no longer required. The same real
form controls, numeric steppers, locks and recipe fields serve desktop and
phone. Inactive controls stay disabled and show zero.

**Granular generation:** the large Random button still generates a completely
new wallpaper, respecting locks. Within Edit, ✳ next to a property rerolls
*only that property*, ✳ Tool changes only that named tool's controls, and
✳ Category changes only the current category's controls. Locks, seed,
background camera, positions, and all unrelated fields are preserved.
Select **Reroll** for independent alternatives or **Vary nearby** for smaller
local adjustments; Gentle, Moderate and Wild control variation strength.
Scoped operations never implicitly add secondary texture layers. The
**Starting style** selector now materializes editable default settings, so
the Visual Family no longer imposes an invisible stripe-width multiplier.

The **Recent variations** control offers a horizontal strip of actual saved
wallpaper thumbnails, allowing promising alternatives to be recalled without
destroying Undo history. It occupies the same lower editing region as the
ordinary tools and therefore never covers the image.

Texture layers remain optional. Each has a **Layer** tool for material,
coverage and blending, and a **Finish** tool for strength, scale and rotation.
Layer 2 and 3 materials can be chosen directly, without Add/Remove controls or
an extra lock. Their default Smooth selection means off.
The same named pattern applies to layers 1, 2 and 3, so all adjustments
remain accessible without scrolling inside any card.

The six-category metadata in `src/editor-schema.js` supplies the canonical
tool membership, dependencies and `WIZARD_STEPS` ordering. A future opt-in
Wizard Mode can reuse the existing control objects and scoped randomization
without duplicating settings, renderer logic or recipes. No wizard UI is
forced on ordinary users.

**Preview tools** remain beside the wallpaper: Random, Primes Only, Undo,
Draw Path, five directional nudges, and Zoom ±. Zoom changes the actual
render camera and is saved with the wallpaper; opening the settings drawer
only changes the on-screen available space. The full-resolution PNG still
renders the exact framed composition. Downward swipe on an empty part of
the tray or the grabber dismisses Edit; the arrow restores the full dock.
All stripes stay visible during editing.

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
make and model. Blank user-entered fields are omitted, but **every saved PNG
always contains a complete, normalized, machine-readable design recipe** in a
dedicated UTF-8 **iTXt** entry named `ROYGBIV Recipe`, independent of optional
metadata. It records the seed, all generation settings, stripe order, diagonal
transforms, layers, locks and position together with a recipe-format version and
intended export dimensions. The **Restore design from PNG** command beside the
metadata editor reads the embedded recipe, validates its checksum and restores the
exact controls needed to regenerate the design. The images also carry any requested
human-readable iTXt and compatible eXIf TIFF-style metadata, preserving the
original pixel data. Recipe metadata is not printed on the wallpaper. Older PNGs
without this recipe cannot be automatically reconstructed from pixels alone.

The optional **Remember these fields on this device** checkbox stores the metadata
in browser local storage. It is off by default; clearing the fields also updates
any remembered copy. This is PNG metadata, not JPEG EXIF; support for displaying
particular metadata fields varies among image-viewing applications.

## Parametric geometry and combined stripe modes

The renderer uses the same path sampling functions for straight and nonlinear lines, including hairpins and looping paths. Each path yields a tangent and normal so width, taper, outlines and procedural materials can follow bends. Returning hairpins may have two endpoints crossing the same image edge intentionally; loops can fold back over their own earlier path.

The capabilities are equal members of the corresponding Path, Stripes, Layout, Material and Effects tools. There is no separate mode for the reference images, no fixed style priority, and no option to add arbitrary extra colours or switch to monochrome. **Exactly seven hues remain in each rainbow.**

The headless renderer accepts the same saved recipe options as the studio:

```bash
npm run render -- --seed hairpin-test --set geometry=hairpin --set turnRadius=65 --set construction=tonal --width 600 --height 1300 --out hairpin.png
npm run render -- --seed spring-test --set geometry=loops --set construction=stroke --set shapeFrequency=85 --set shapeDepth=90 --width 600 --height 1300 --out spring.png
npm run render -- --seed groups-test --set composition=repeat --set repeatCount=4 --set repeatSpacing=55 --set geometry=straight --width 600 --height 1300 --out groups.png
```

## Draw a path with your finger

The **Draw path** action lives beside Randomize, Primes Only and Undo on the
preview's left mobile rail (and in the desktop controls). **Undo is directly
beneath Primes Only.** Tap Draw path, trace one continuous curve over the
wallpaper with touch, pen or mouse, then lift to see a finished path.

- **Smooth** suppresses input jitter and preserves the gesture's curves.
- **Geometric** simplifies the sketch, aligns near-horizontal, vertical and
  45-degree segments, and rounds their joins.
- **Redraw** clears only the uncommitted trace; **Use path** applies all seven
  rainbow stripes along its trajectory; **Cancel** leaves the design unchanged.
- Applying a path creates a single undo checkpoint. Normal colour, texture,
  stripe width, spread, line construction, effects, favourites and exports
  continue to work with the new trajectory.
- The path is stored as at most 96 bounded normalized points inside the ordinary
  recipe and PNG metadata. Share links, CLI recipes and full-resolution PNGs all
  reconstruct the exact same centreline.
- The drawing tool accounts for the actual camera framing when capturing finger
  positions. The overlay is temporary and does not appear in exported pixels.

A hand-drawn geometry appears in the normal Path geometry selector once a path
has been saved. Randomize does not invent arbitrary hand-drawn paths, but locking
Path geometry preserves your traced curve during further randomization.

## Flowing curves and expanded controls (October 2026)

The canvas path tool now uses **arc-length resampling, Gaussian curve fairing
and centripetal spline interpolation**. Smooth produces more balanced curves
without preserving each jittery finger movement. Geometric still offers
simplification and snapping for more deliberately constructed paths.

When Draw path is active, the entire preview stage captures pointer input:
you may **begin outside the wallpaper and draw into it**, or finish outside.
Coordinates beyond the frame are stored in the recipe, so full-resolution
exports clip only the resulting painted image, never the intended centreline.
Camera zoom uses **50% through 250%** framing with 10% steps available
immediately on initial generation, persisted in saved recipes and PNG exports.

Additional existing-control upgrades:

- **Nudge:** 1% per tap in each direction, halved from 2%.
- **Stripe spacing and thickness:** substantially expanded mappings at both
  ends of the same familiar sliders, with independent control.
- **Chevron geometry:** much broader shape frequency and depth ranges.
  Chevron *stripe patterns* also reuse Shape frequency and depth for independent
  mark frequency and size. These sliders stay active for chevron patterns even
  when the underlying path itself is straight.
- **Hairpin:** a separate 60°–180° turn-angle slider is grouped with the
  existing turn-radius control; the exit leg remains tangent to the bend.
- **Mobile swipe cards:** every range control includes visible, working
  decrement/increment buttons, a draggable track, and a numeric entry. The
  no-vertical-scroll card layout and inactive/zeroed settings remain intact.

## Frame-faithful zoom and export

Zooming now redraws the underlying procedural composition through one camera
instead of scaling an already-clipped HTML canvas. Zooming out exposes freshly
painted geometry beyond all four edges of the earlier 100% crop, with unchanged
rainbow order, motif repetition, texture and seed. Finite custom paths retain
their intentional endpoints. Background textures cover the newly visible frame.

The selected camera magnification (`viewZoom`, 0.50–2.50) is recorded in the
ordinary recipe and embedded PNG metadata; Undo, favourites, URL sharing, headless
rendering, and Download all use the same framing. **Download saves the exact
wallpaper-frame view at 3024 × 6552 pixels**, with full-resolution detail, even
after zooming in or out. Its rendering does not depend on the preview's screen
pixels or the CSS scale of an old cropped bitmap.

Six more **Color Stories** sit alongside the originals: Sunset Glow, Candy Pop,
Arctic Ice, Earth & Mineral, Twilight Violet, and Citrus Punch. Each keeps all
seven named rainbow stripes in order and selects a coordinated hue/saturation/
brightness relationship. These are ordinary palettes available in randomization,
locks, recipes, and headless generation.

```bash
npm run render -- --seed framed-rainbow --set geometry=wave --set palette=twilight --set viewZoom=0.7 --width 3024 --height 6552 --out framed.png
```

## Smoothing, quick controls and branding (October 2026)

After tracing a finger-drawn path, adjust the live **Smoothing** slider from
**1×** (the previous curve fairing, completely unchanged) to **10×**.
Strengths 1×–5× retain their original calculations. Above 5×, the tool
increasingly interprets geometric intent instead of indiscriminately blurring
the stroke: confident freehand lines are fitted straight, nearly level or
vertical strokes become perfectly horizontal or vertical, and circular loops
and partial round arcs can be reconstructed from their traced points.
Multiple loops may be identified within a single continuous path.
The strongest setting reaches the exact fitted geometry when the gesture
supports that interpretation; otherwise stronger continuous fairing is used.
Recognition uses pixel-space residuals, least-squares circle fitting, stroke
winding/closure and conservative local segment fitting to avoid snapping
arbitrary curves into unintended shapes.

Both Smooth and Geometric finishing modes update the preview immediately
when strength changes, without asking for a redraw. The finished normalized
points are saved in the wallpaper recipe and PNG metadata, so rendering,
Undo and regeneration remain deterministic. Snapping is an interpretation
rather than a guarantee that every gesture is a particular shape; ambiguous
strokes retain their smoothed form.

The header title spells R.O.Y.G.B.I.V. with each letter tinted in its
corresponding colour. The mobile Edit button now uses a pencil, and Favourite
uses a deliberately wide, low-profile heart SVG on both phone and desktop.
These stay in place when selected rather than switching font glyphs.

The narrow mobile preview rail reads **Random** and splits **Primes / only**
and **Draw / path** onto two lines so button text fits. **Randomize All**
now always leaves extra texture layers disabled. You can still explicitly
enable and customize the second and third layers from the Texture controls;
existing manual multi-layer designs remain fully functional.

## Self-intersections: Over, Under and Weave

**Path → Constraints → At intersections** offers **Over**, **Under** and
**Weave** for **Single loop**, **Continuous loops** and **Drawn path**.
The setting is greyed out on other path geometries, but its saved choice
is retained when returning to one of the supported paths. It changes
how the seven coloured ribbons visually intersect themselves without
altering the underlying path geometry:

- **Over**: the later traversal passes above the earlier one, with the
  rainbow acting as a cohesive bundle.
- **Under**: the earlier traversal passes above the later one.
- **Weave**: alternate colours pass above and below in rainbow order; the
  phase reverses at successive crossings, giving woven interlacing.

The crossing solver samples the actual spatial centreline and finds
transverse segment intersections. Each overpassing portion is repainted
from its **local traversal segment** rather than the entire self-crossing
stripe path. Folded loop masks are unions of consistently wound small cells,
preventing unrelated arms from poking through or cancelling into shards.
The segment is clipped to the opposite rainbow branch's footprint.
Motifs, outlines, roughness and material texture continue to use the
existing production renderer. Parallel passes and tangencies are not
treated as false crossings. All three modes survive wallpaper recipe
metadata, editing, locking and full-resolution PNG export. Old recipes
without a crossing choice default to Over.

## Single loop path

**Path → Geometry → Single loop / circular turn** creates one prominent round
loop with a straight incoming section and a tangentially connected outgoing
section. It is deliberately distinct from **Continuous loops**, which keeps
repeating smaller loops along the stripe.

**Path → Single loop** has two controls: **Loop radius** (the size of the
circular turn) and **Loop turn angle** (240°–450°, with 360° closing exactly
one circle). Angles below a full revolution form open sweeping curls; angles
above it continue past the start and permit deliberate crossing. Incoming,
circular and outgoing portions share a constant physical arc-length
parameterization, so they join without kinks.

All seven colours follow one shared circular centreline with true
perpendicular stripe offsets, just as Hairpin does. With **Preserve stripe
coherence** enabled, the radius spans a nested, frame-conscious range.
Disabling safety unlocks oversized and tightly folded loops without replacing
the saved requested radius or sweep. The settings respect locks, scoped
randomization, recipes, PNG metadata, orientation, zoom and the usual
material/outline/stripe controls.

## Geometry safety and expanded artistic controls

The Path → Constraints tool contains **Preserve stripe coherence**, enabled by
default, and **At intersections** for the self-crossing path types. It keeps freehand stripe spacing and hairpin bend radius within
geometry-aware limits and scales loops to their actual lane width. Turning it
off unlocks intentional folding, extreme loop sizes and overlapping stripes.
The request is retained: switching safety back off restores the user's
unrestricted parameters, and changing the setting is undoable. The Constraints
tool reports the effective radius, loop height or stripe pack spacing when
the coherent renderer imposes a limit. Scoped Reroll/Vary never changes this
preference by accident. Random retains the user's explicit setting.

Geometry has shape-specific **Step count** (1–16, Step geometry only),
**Chevron sharpness** (Chevron only), and **Loop aspect** (Loops only).
Shape Frequency changes the curvature of Arc and logarithmically controls
loop pitch; Shape Depth now scales loops across their complete slider
range even with several repeated seven-colour bundles. Thin Stroke
construction responds through the full thickness range, End Taper accepts
genuinely small percentages, and high Individuality preserves the user's
chosen geometry family instead of randomly switching it.

Stripe Patterns has separate **Motif size** and **Motif density** so
decorative marks can change size or spacing without modifying the actual
wave/chevron geometry. The existing Dot Diameter and Dot Spacing controls
also affect the Dots motif. Context-specific settings are disabled when
inapplicable and show zero without discarding their stored values. Vary
uses the actual bounds of each range or count rather than assuming all
settings are percentages.

All geometry modes and numeric settings remain part of the ordinary
reproducible recipe and PNG metadata. No separate restricted/unrestricted
rendering engine exists: they share the production renderer and parameter
definitions.

### Stripe-specific finishing controls

**Stripes** now groups Structure → Outlines → Patterns → Marks → Motif scale → Band tones → Character → Shadows → Glow. Outline style/thickness/buffer, shadow strength/softness/direction, and neon glow belong to stripe styling. **Effects** contains the independent canvas-wide Lighting tool. Removing the cast-shadow checkbox frees vertical space and keeps all shadow controls visible together in the phone editor. Strength 0 is Off; increasing it immediately casts shadows.

## Output

- Google Pixel 6 Pro native screen: **1440 × 3120**.
- Each linear dimension multiplied by **2.1**: **3024 × 6552** PNG (19,813,248 pixels).
- Full resolution renders freshly; the preview and gallery use inexpensive rasterizations of the same seed-based scene.
- Base logical coordinate system: 600 × 1300, preserving the 6 Pro aspect ratio exactly.
- Unused pixels use the selected opaque background (`#000000` or `#ffffff`); individual marks in patterned stripes are placed whole without cropping at stripe boundaries or canvas edges.

## Brand and SVG logo

The app uses `assets/roygbiv-logo.svg` as its masthead mark and browser icon. Paired dark and cream vector variants and raster PNGs are described above. These assets share the repository's public-domain dedication; attribution is not required.

## Stripe ordering and diagonal transformations

The Design category includes **Reverse stripe order**. When enabled, violet
takes the first position and red the last; path positions, width and line
geometry remain unchanged. The colour reversal is saved in shareable recipes
and PNG exports, and is independently lockable for randomization.

Select **Diagonal** under Direction to reveal a signed rotation slider
(−180° to +180°) and **Mirror horizontally** / **Mirror vertically** toggles.
Rotation is an *offset* relative to the seed-generated diagonal. Zero degrees
preserves the legacy appearance of previously saved seeds, rather than
silently replacing their original diagonal angle with a fixed angle. Mirroring
reflects the stripes, not the canvas texture, and can be used in combination
with rotation or reversal. These controls share one compact mobile swipe card
and disappear when a non-diagonal direction is explicitly selected.

## Controls and workspace

The settings column uses four accessible tabs: **Design** (family, direction, paths and patterns), **Colour** (palette, background, outlines, light and shadow), **Texture** (three independent material layers and relief), and **Refine** (spacing, thickness, individuality, glow). Tab selection is remembered in the browser session, works with keyboard arrow keys, and does not re-render the current wallpaper. On narrow devices the four tabs remain in one compact horizontal row, with shorter labels where needed.

**Explore Variations** now lives in the preview column below the canvas, with responsive thumbnails, its own Generate 12 control and favourites; it no longer spans both columns.

The balanced-width **Randomize** button sits next to an equally prominent, always-unlocked **Primes only** checkbox above the tabs. With Prime mode on, every numeric percentage generated by Randomize is a prime from **2 to 97**, and all texture rotations are prime integer degrees from **2 to 359**. The seed is still a random string, and discrete choices (e.g. background and geometry) remain ordinary choices. Locked values have priority and may legitimately be non-prime. Prime mode itself is saved in the design recipe but deliberately has no lock; switching it doesn't change an existing image until you randomize.

- Eight scene families: Studio, Currents, Fracture, Confetti, Deco, Tapestry, Signal and Contour.
- Orientation: vertical, horizontal, diagonal or seeded selection. Stripes that meet the wallpaper edge on one side without reaching the opposite edge get paired inset ends; stripes that traverse opposed edges remain continuous.
- Geometry: straight, wave, zigzag, **chevron**, jagged, stepped, arc, contour, **hairpin** (returning nested curves), **single loop** (one circular turn with tangent-connected entrance and exit), and **continuous loops** (repeated looping paths). A shared parametric path sampler supplies centreline, tangent, normal and normal-offset boundaries to outlines, ribbon silhouettes, marks and frame-contact tests. Shape frequency and depth control the repeated-loops pitch/amplitude. Hairpins have their own turn radius/angle; Single loop has independent radius and sweep-angle controls.
- **Composition:** a single seven-colour rainbow, repeated complete seven-colour groups (two to six) with adjustable inter-group spacing, or seven independently inset paths with configurable physical length. Inset paths can end in visible tapers. Repetition never creates an eighth hue; it paints additional instances of the same seven stripe identities.
- **Stripe construction:** existing patterned ribbons, fine continuous pen lines, multitone ribbons and woven diagonal lattice columns. These are ordinary construction choices that combine with geometry, palette and texture, not separate gallery presets.
- **Brush and mark controls:** adjustable dotted-line diameter and pitch, end taper, tonal contrast and procedural ink wear/roughness. Inapplicable controls appear disabled and show zero while retaining their stored values.
- All of these settings participate in seeded randomization, per-setting locks, undo, favourites, share links, headless rendering and embedded PNG recipe restoration. The Design tab's **Shape frequency** slider changes how often wave/zigzag/chevron/stepped/jagged/contour bends repeat; **Shape depth** varies their amplitude. Both have a neutral 50% midpoint that preserves legacy designs.
- **Stripe line style** is independent of the **Stripe pattern** selector. Continuous, dotted and dashed *ribbon silhouettes* can be combined with **any path geometry**, whether straight, wavy or chevron, and independently combined with the existing filled dot/dash/chevron/checker/etc. motif patterns. Dotted styles use separate circular segments; dashed styles use short pieces of the selected path. These styles work with the existing material, outline and nudge pipeline.
- Stripe patterns (previously called Stripe construction): solid, dots, stars, dashes, diamonds, chevrons, hatch and checker.
- Palettes: classic, electric, pastel, jewel and muted. Their hues stay in ROYGBIV order.
- Outlines: none, white or black hairline, solid, double, broken and single-side, with a buffer coloured to match the selected background.
- **Ambient light & shade (Effects → Lighting):** choose Off (default), Soft daylight, Golden hour or Cool moonlight, and a corner for the light source. Light intensity adds a soft warm/cool wash across the **whole canvas**, including the background and stripes; Canvas shade darkens the opposite region with a broad gradient. Canvas ambience does not cast shadows from the stripe silhouettes. **Stripe shadows** live under **Stripes → Shadows**. Shadow Strength at **0** is Off, with no separate checkbox; softness and light direction become dormant at zero and return when strength increases. The shadows move with the stripes, while ambient light stays fixed in canvas space. Their settings remain lockable, deterministic and saved in recipes.
- Materials: paper grain, watercolour, construction paper, handmade paper, corrugated board, linen, canvas, denim, knit, felt, corduroy, concrete, stucco, stone, adobe, drywall, wood grain, vinyl sheet, foil, and glossy paper. The ungrouped menu works across three independent material layers. Layers 2 and 3 remain available as named tools, initially set to **No texture / smooth**. Selecting a real material activates that layer, and choosing Smooth disables it. Layer 3 can be used independently of Layer 2, without Add/Remove buttons. Each layer has its own strength, scale, surface coverage (background, stripes, or both), ±90° buttons, freely editable angle (including fractional degrees), and blend mode (normal, multiply, screen, overlay, soft light, difference). Rotations and enabled layers persist in URLs, saved recipes, favourites and PNG exports.
- Chaos, thickness, **stripe spacing**, geometric individuality, pattern homogeneity, glow, outline thickness and outline buffer. Stripe spacing now adjusts only the distance between stripe centres, while thickness is controlled solely by Stripe thickness; at tight settings the ribbons can deliberately overlap. Every slider has −/+ adjustment buttons and an editable numeric percentage field immediately after +. Individuality adjusts per-stripe directions, parallelism, shape and edge profile, while all stripes retain the same motif.
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

### Shorter Materials editor, Bleed and outlines (October 2026)

The mobile Edit panel is roughly 12% shorter, and optional texture layer
selectors stay available instead of requiring add/remove buttons. The rotation
angle uses a narrow numeric input in the same row as its label, ±90° shortcuts,
per-setting reroll and lock. Save and Favourite from the vertical Edit action
rail no longer collapse the editor.

The preview-only 90% Bleed guide follows the rounded frame corners. Its
hairline is white for a black wallpaper background and black for white,
regardless of the stripe colours crossing the guide; it is never exported.

**Outline thickness** is the old adjustable outline-width parameter (the
historical `gap` recipe field). A separate **Outline buffer** (`outlineBuffer`)
sets the transparent distance between the stripe edge and that outline. The
buffer reveals the actual backdrop, including paper/material textures, and
does not alter outline thickness. Both values are serialized in the recipe.
