# Materials: first seven actual production-rendered appearance findings

## Controlled source of linen sawtooth identified, 2026-10-22

[Chromium experiment #39823468097](https://github.com/gamesbyian/wallgen/actions/runs/39823468097), artifact [#12446026709](https://github.com/gamesbyian/wallgen/actions/runs/39823468097/artifacts/12446026709), produced **three same-seed 480×1040 linen wallpapers** at contour displacement 0, 20 and 68. All other normalized recipe fields matched exactly, and the d68 PNG's pixels were *identical* to the prior `linen-1` art study. The d0 picture retained a visible fabric thread grid with **smooth ribbon boundaries**; 20 caused moderate teeth and 68 visibly aggressive serrations. Thus the stripe-boundary artifact is specifically the high-frequency material-height field being transferred to contour geometry, not the existence of painted fabric threads.

**New soft-edge option actually reviewed (PR #502):** [Chromium #39824713944](https://github.com/gamesbyian/wallgen/actions/runs/39824713944), [two-image artifact #12445822684](https://github.com/gamesbyian/wallgen/actions/runs/39824713944/artifacts/12445822684), compared old `linen` and opt-in `linen-soft` with every other recipe field identical. Both 480×1040 outputs were viewed; the soft version retains the same woven grid and broad relief but greatly reduces the high-frequency serrated edges. Every PNG chunk CRC verified and both embedded recipes match their sidecars. The old-render output was **pixel-identical** to original `linen-1`, confirming backward compatibility. This controlled scene supports acceptance of a selectable *smoother-contour* option, not any claim of physical photorealism. The two-image disposable PR #503 was closed unmerged after reverting temporary CI. Original seven-image findings continue below.



**Completed:** 2026-10-22, one-off [Chromium production-render run #39820925332](https://github.com/gamesbyian/wallgen/actions/runs/39820925332) in disposable [PR #498](https://github.com/gamesbyian/wallgen/pull/498). The [seven-image artifact](https://github.com/gamesbyian/wallgen/actions/runs/39820925332/artifacts/12445010899) contains real 480×1040 PNGs, matching complete `.recipe.json` files, a `manifest.json`, and an HTML gallery. It was downloaded and visually inspected. The temporary workflow step was reverted byte-for-byte, and PR #498 was **closed unmerged**. Artifact retention: seven days.

## Checked evidence

All seven source PNGs successfully decoded. An independent binary read verified every PNG chunk's CRC, including IDAT and ancillary iTXt. In all seven cases, the embedded `ROYGBIV Recipe` JSON was **exactly identical** to its normalized sidecar recipe file. This is actual output of the production browser renderer, not a mock image or unsupported mental reconstruction.

The review base uses `textureStrength:72`, `textureDisplacement:68`, `textureCoverage:'both'`, `textureScale:43`, and `lightingMood:'off'`. These deliberately fairly strong material/displacement values are **not necessarily typical user defaults**. The two seeds differ in both overall geometry and texture features, so evaluate each material's seed family rather than comparing the second seed pixel-for-pixel with the first-seed blank control.

| Case | Image bytes | Visual assessment |
| --- | ---: | --- |
| Untreated control | 74,852 | Clean coloured ribbons on white; natural baseline for seed `material-study-rose` |
| Concrete #1 | 487,646 | Fine fine-grained speckling and lightly mottled white; ribbon edges change subtly |
| Concrete #2 | 480,207 | Similar character with different seeded placement; subtle enough that its identity is not unmistakably poured concrete |
| Linen #1 | 396,812 | Readable horizontal/vertical thread grid; **visibly sawtooth/frayed ribbons** at this high distortion setting |
| Linen #2 | 424,232 | Same family character with markedly regular crosshatch and serrated contours; more graph-paper-like than convincing fine woven cloth at overview scale |
| Watercolour paper #1 | 443,026 | Broad low-contrast soft cloudy wash/mottle in white substrate; coloured ribbons remain crisp |
| Watercolour paper #2 | 382,959 | Seed variation keeps similar cloudy substrate identity; pigment-on-paper appearance is not specifically demonstrated |

At the fixed `material-study-rose` seed, compared with the untextured original using mean absolute RGB channel difference (0–255 scale): Concrete #1 **6.775**; Linen #1 **6.180**; Watercolour paper #1 **10.476**. These values establish visible output differences, not material perceptual realism.

## Source-to-art interpretation

The original `src/material-surface.js` supports the observations:

- Linen explicitly paints vertical and horizontal `threads(..., gap=5, opacity=.20)`, while its relief field has periodic ridge pitch 5. At high `textureDisplacement`, that periodic micro-relief transfers into the ribbon edge; the regular crosshatch and toothlike border are visible in both independent seeds.
- Watercolour paper uses large `blooms`, dots and sparse fibres, with a broad, low-frequency material field. Here it reads as **textured watercolour paper**, not a finished watercolour painting. The UI explicitly labels the material “Watercolour paper”, so do not falsely mark absence of paint pigment as a code defect.
- Concrete uses dots, flecks, short creases and broader low-amplitude height variation. Its restrained character is visible but not yet independently recognizable as poured concrete at contact-gallery size.

**Quality disposition:** the physical renderer and seeded material-displacement links are confirmed working, and same-family materials vary across seeds. **Artistic realism issue #445 remains open.** In particular, the linen case provides a specific observed high-displacement risk worthy of a focused follow-up, not a licence to blindly alter established saved recipes.

## Next efficient targeted experiment

A single **same-recipe, same-seed linen displacement sweep** at 0, 20 and 68 (one texture strength, one camera and identical geometry) would isolate whether the graph-paper/sawtooth character is an unavoidable weave mark or simply an extreme-edge distortion consequence. Judge true woven fibres at full size before changing default values. If changes are desirable, prefer an explicit *opt-in smoother contour* variant or other versioned recipe choice, not silently replacing every historic `linen` design. One small optional review is sufficient: **no new CI gates, no 1000-image screenshot factories**.

Actual Pixel 6 Pro display review, native 3024×6552 performance, mixed material layers, and independently embroidered surfaces are not certified by these seven small source images.
