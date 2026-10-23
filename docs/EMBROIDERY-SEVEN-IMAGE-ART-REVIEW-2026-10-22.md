# Seven-image embroidery quality review (manual, opt-in)

The production script is `scripts/review-embroidery.mjs`. It renders precisely **seven 600×1300 PNG wallpapers**, not fake schematic previews: three same-seed loop ribbon scenes (Off/Satin/Running) and four same-seed scattered regions (Off/Tatami/Running/one selected object's Satin). Each output embeds the exact normalized authoring recipe saved alongside it as `.recipe.json`. The tool also creates `manifest.json` and a local HTML contact gallery.

Run in a full repository checkout with the same installed Playwright/Chromium required by `render-headless.mjs`:

```sh
node scripts/review-embroidery.mjs --out-dir artifacts/embroidery-review
# Optional: --seed my-art-study --browser /usr/bin/chromium
```

The tool refuses to overwrite previous evidence, produces no routine GitHub Actions job, and never modifies the live user's favourite designs.

## Questions for an actual observer

For loop ribbons: does Running genuinely follow the centreline in three intermittent parallel seams, including overpass/underpass branch touch-ups? Does Satin still look like transverse raised ribs? Is either method too bright, mechanical or visually thin on narrow turns? Check if the lace of lines escapes clipping.

For scattered regions: do Tatami and Running have distinguishable stitch cadence, preserving individually cropped circles and leaving holes/islands unfilled where source geometry excludes them? Does a single-target treatment affect only region-3, with other circles and the background untouched? Compare at original output size as well as thumbnails.

Record facts separately: **script implemented**, **pictures successfully generated**, **pictures actually opened and judged**, **real physical Pixel use**. The first fact is source-backed by this change; the latter three do not follow until someone actually runs and inspects it. Quality issues should be reported with the exact seed, recipe, output file and observed artefact. One further full-size output is reasonable only if a particular visual/performance problem warrants it.

Related: [embroidery specification](GEOMETRY-AWARE-EMBROIDERY-AND-SURFACE-TREATMENTS-PLAN-2026-10-22.md), [active queue](ACTIVE-PRODUCT-ROADMAP-2026-10-22.md), historical [material study](MATERIAL-SEVEN-IMAGE-ART-REVIEW-2026-10-22.md).
