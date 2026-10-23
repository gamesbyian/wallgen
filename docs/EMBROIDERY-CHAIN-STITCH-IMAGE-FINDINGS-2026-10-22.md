# Linked Chain stitch: actual production images, not diagrammatic stand-ins

**Observed 22 October 2026.** [One-time Chromium Actions #39890740813](https://github.com/gamesbyian/wallgen/actions/runs/39890740813), source `5368bb075f0191f65a6af7fdbfcc98538d63e654`, [four-image artifact](https://github.com/gamesbyian/wallgen/actions/runs/39890740813/artifacts/12473714664). All four actual 600×1300 PNG wallpapers were downloaded and opened, including enlarged actual-pixel crops of the concentric ribbon and scattered circles. Every PNG chunk CRC passed independent validation and each embedded ROYGBIV Recipe JSON exactly matched its saved canonical recipe sidecar.

| Artwork | PNG bytes | Mean absolute RGB difference vs matched untreated | Pixels differing by >2 RGB units in any channel | Previously pure black pixels modified |
| --- | ---: | ---: | ---: | ---: |
| Untreated loop ribbon | 306,224 | 0 | 0% | n/a |
| Opt-in Chain ribbon | 723,175 | **3.5974** | **17.177%** | **0 / 368,911** |
| Untreated scattered circles | 307,371 | 0 | 0% | n/a |
| Opt-in Chain regions | 874,646 | **3.9066** | **22.024%** | **0 / 365,292** |

**Visible:** three loop chains follow the ribbon's tangent and become concentric linked ovals on circular sections; the region filler forms staggered, mutually overlapping oval links, visibly different from both short Running dashes and Tatami straight hatching. The same rainbow identity survives. No source-black pixels changed, confirming no stitches leak into the bare substrate. The faint grid is already present in untreated artworks because the same deliberate linen-soft material covers background.

**Aesthetic limitation:** tight inner red/orange concentric turns make the loops crowded and metallic-looking in places; this is not true thread tension/fibre physics. Curvature-aware new options might eventually help, but do not silently alter existing or now-saved Chain artwork. Full device-scale/Pixel performance, physical screen interpretation and imported complex holes with this particular new stitch still need specific evidence.

**Preservation:** all old style painting paths and untouched designs remain unchanged; Chain is opt-in in the same normalized `surfaceTreatments[].style` field. The one-off Chromium install and upload steps were removed from the workflow before merge. The persistent reviewer remains available via `node scripts/review-embroidery.mjs --focus-chain`.
