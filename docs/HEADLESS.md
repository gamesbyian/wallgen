# Headless generation

The headless CLI uses the **same** `src/model.js`, `src/renderer.js` and
`src/png-metadata.js` as the interactive studio. No alternate artwork
implementation or approximations are maintained.

## One-time setup

Node 20+ and a Chromium installation are needed. The normal web studio and
`npm test` still have **no dependencies**. For CLI rendering install the
optional Playwright driver and Chromium:

```sh
npm install --no-save playwright
npx playwright install chromium
```

You can also use an already-installed compatible Chromium binary with
`--browser /absolute/path/to/chromium`.

## Render

```sh
npm run render -- --seed my-wallpaper --out output/wallpaper.png
npm run render -- --recipe saved-design.json --out output/restored.png
npm run render -- --seed proof --width 600 --height 1300 --out output/preview.png
npm run render -- --seed stars --set motif=stars --set geometry=wave --set material=linen
npm run render -- --recipe design.json --metadata metadata.json --out output/print.png
npm run render -- --help
```

By default the PNG is rendered at **3024 × 6552**, the same output size as
the app. A smaller resolution is helpful for large search batches; the scene's
logical coordinate system remains 600 × 1300. For faithful wallpaper aspect
ratio, provide dimensions with the same 600:1300 ratio.

`--recipe` accepts either a recipe object saved from the studio or an object
with a `recipe` property. `--set name=value` may be repeated for any known
normalized recipe property. Invalid setting names and invalid output dimensions
produce a nonzero exit code. `--seed` and `--set` override JSON recipe fields.
`--metadata` accepts the same optional metadata object that the studio's
PNG writer accepts.

The command writes one JSON result on stdout (including absolute output
path and image dimensions), useful for scripting. It embeds the normalized
recipe in every PNG as `ROYGBIV Recipe`, including small previews. The PNG
recipe is validated by extraction immediately before saving. It performs no
cloud calls, and the temporary HTTP server binds to loopback only.

## Automation / research

The CLI is suitable for systematic searches over geometry, colours, materials,
textures, seeds, and randomization. Run several invocations with separate
output paths and parse the JSON lines. The recipe is the canonical identity
of a wallpaper; keep it alongside image hashes and any visual ratings.

Because the CLI invokes the production browser renderer directly, previews
and full-resolution exports share rendering logic. This is deliberately
slower than a simplified server-side drawing approximation but avoids a
second engine falling out of visual parity. Browser/OS colour management,
rasterization and PNG encoding may cause differences across Chromium versions.
Pin the browser version for strict pixel-comparison campaigns.

Worker parity: `npm run render -- --backend worker --recipe tests/fixtures/metric-inset-pinwheel.json --width 600 --height 1300 --out worker.png`. The default `--backend reference` uses the existing production Canvas2D renderer. Both embed restorable recipe metadata.
