<p align="center">
  <img src="assets/roygbiv-logo-transparent.svg" alt="ROYGBIV rainbow phone icon" width="220">
</p>

<h1 align="center"><img src="assets/roygbiv-title-rainbow.svg" alt="R.O.Y.G.B.I.V." width="440"></h1>

<p align="center"><strong>Seven colours. Countless ways to make them your own.</strong></p>

<p align="center">
  A playful, unusually deep wallpaper studio for designing bold, beautiful rainbows.
  Create on your phone, experiment without losing your place, and export your art in glorious resolution.
</p>

<p align="center">
  <a href="https://gamesbyian.github.io/wallgen/"><strong>Open the studio</strong></a>
  · <a href="#get-creative">Explore the possibilities</a>
  · <a href="#run-it-yourself">Run it yourself</a>
  · <a href="#for-developers-and-ai-agents">Developer &amp; agent docs</a>
</p>

---

## A rainbow with a mind of its own

ROYGBIV starts with seven familiar colours: **red, orange, yellow, green, blue, indigo, violet**. From there, almost everything is negotiable.

Send ribbons around loops and hairpins. Break them into dots, dashes, stars or checker patterns. Build compositions from scattered shapes, draw your own paths, import silhouettes, layer tactile materials, add shadows and light, and give the finished image a film or digital-camera treatment.

**Hit Random** for a complete surprise, **Vary nearby** to explore an idea, or fine-tune a single property while keeping everything else exactly where you want it.

It can be a quick wallpaper generator or an obsessively adjustable little art studio. Both are the point.

## Get creative

| Create | Make it yours |
| --- | --- |
| **Shapes & paths** | Straight lines, waves, zigzags, chevrons, hairpins, loops, drawn paths, imported silhouettes, and scattered rainbow orbits. |
| **Ribbons & details** | Adjust stripe width, spacing, taper, outlines, patterns, motifs, overlaps and woven crossings. |
| **Colour & composition** | Work with classic, electric, pastel, jewel and muted rainbow palettes, reversible colour order, backgrounds and repeated rainbow groups. |
| **Materials & texture** | Try paper, canvas, linen, denim, **fine coloured sand**, **beaded sand filigree**, stone, stucco, wood, foil, vinyl and other layered finishes. |
| **Thread & embroidery** | Give selected colours or entire compositions Satin, Soft Satin, Tatami, Running or Chain-stitch treatments. |
| **Light & photography** | Experiment with ambient lighting, independently controlled stripe shadows, glow, grain, halation, film looks and digital-camera-inspired finishing. |
| **Precision tools** | Adjust individual shapes, draw paths, use per-setting locks, nudge and zoom the composition, and undo experiments. |

### Discover, don't start over

The studio supports both happy accidents and careful construction:

- **Randomize** a whole design, a category, a tool or an individual setting.
- **Lock** the things you love while experimenting with everything else.
- **Reroll** for fresh alternatives or **Vary nearby** with Gentle, Moderate and Wild strengths.
- **Explore variations**, revisit recent thumbnails and keep local favourites.
- Turn on **Primes Only** for an especially peculiar constraint on randomized numeric values.

### Built for the little screen

ROYGBIV's phone-first editor keeps a live wallpaper preview visible while you work. Seven creative categories organize a large collection of controls into manageable tools: **Layout, Path, Stripes, Details, Colour, Texture and Light**.

Choose between **Cream Studio** and **Original Dark**. Swipe between tools, adjust settings without burying the canvas, and use on-canvas editing where supported. The interface also works on desktop.

The design target is a Pixel 6 Pro portrait display, with a full-resolution **3024 × 6552 PNG** export, 2.1 times its native dimensions on each axis.

## Create freely. Keep your creations.

A wallpaper is more than a flattened picture here. ROYGBIV can save an **editable recipe** describing its geometry, colours, materials, lighting and other settings.

Download a PNG with its recipe embedded, save portable JSON, or share a link when the recipe fits within the supported link length. Recipes and favourites can be restored without a user account. Editing and experimentation are designed to be non-destructive, with Undo and reusable local assets.

Everything runs as a static, offline-friendly browser app with **no account, tracking or runtime asset-download requirement** for the core studio. Hosting the site is straightforward; the artwork engine doesn't need a backend.

## Run it yourself

Open the [hosted studio](https://gamesbyian.github.io/wallgen/), or serve a local checkout with any static web server:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`. To open it from your phone, make the server accessible on your local network. Use HTTP(S), rather than opening `index.html` as a `file://` URL, because the app uses JavaScript modules.

For development:

```bash
npm test
npm run check
```

## Ask Your Agent: describe a wallpaper, get an editable recipe

Under **More → Files & sharing → Ask Your Agent**, describe a design in ordinary language. ROYGBIV assembles a source-derived reference describing the current JSON recipe format, settings, ranges, visibility rules and interactions. Share the guide with your preferred AI assistant, or copy/save it for manual attachment. You can optionally include the current design for targeted changes.

The assistant can produce a ROYGBIV `.json` recipe. Save it and use **Import design** as usual. There is no built-in AI service, no account or API key, no response monitoring and no automatic result import. Recipient file support varies by device and agent app, so Copy and Save are always offered. The source-informed effect notes are **not** yet measured perceptual response curves. See [AYA recipe handoff and remaining acceptance plan](docs/AYA-RECIPE-HANDOFF-2026-10-30.md).

## For developers and AI agents

ROYGBIV is also an experiment in making a visual editor understandable and controllable by AI agents. The **local MCP/headless integration** lets suitably equipped agents inspect canonical controls, construct and vary editable designs, render real Chromium previews and export wallpapers.

```bash
npm install
npx playwright install chromium
npm run mcp
```

See [agent/headless integration](docs/AGENT-HEADLESS-INTEGRATION.md) for setup and limitations. The local MCP interface is distinct from the **experimental hosted Cloudflare MCP connector**, whose authorization and remote rendering behavior require separate verification. See the [hosted deployment runbook](docs/HOSTED-MCP-CLOUDFLARE-DEPLOYMENT.md). Do not assume hosted ChatGPT or Claude connection and preview capabilities have been fully accepted.

For contributors and development agents, the authoritative starting points are:

- [Product specification](docs/PRODUCT-CONTRACT-2026-10-26.md)
- [Current work queue](docs/CURRENT-WORK-QUEUE-2026-10-24.md)
- [Agent instructions](AGENTS.md)
- [CI and verification policy](docs/CI-OPERATIONS-2026-10-22.md)
- [Active product roadmap](docs/ACTIVE-PRODUCT-ROADMAP-2026-10-22.md)

The project includes extensive engineering notes, visual studies, recipe-format history and acceptance evidence in [`docs/`](docs/). Dated findings describe what was tested at that point in time; they aren't promises of current device-level acceptance. In particular, automated browser checks do not establish physical Pixel performance, accessibility or touch usability.

## Free to use. Free to change. Free to share.

ROYGBIV was created with ChatGPT. Its creator intends the code, designs, artwork and ideas to be available **to absolutely anyone, for any purpose**, including remixing, redistribution and commercial use, without requesting attribution.

The repository carries [The Unlicense](LICENSE), dedicating the creator's copyright interests to the public domain to the extent legally possible. Rights belonging to unrelated third parties are unaffected; the software comes without warranty.

*R.O.Y.G.B.I.V. stands for Rainbow-Only. You Generate Based on Individual Variables.*

For the longer story behind the project, there's also a [Russian-language production diary](prod_diary/README.md).
