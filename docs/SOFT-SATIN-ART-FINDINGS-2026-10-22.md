# Opt-in soft Satin: real three-picture artwork comparison

**Actual render and visual check completed on 2026-10-22:** guarded one-time [Actions #39884499923](https://github.com/gamesbyian/wallgen/actions/runs/39884499923) on feature branch [PR #511](https://github.com/gamesbyian/wallgen/pull/511), source SHA `81de603e8db19856ace095f0f8f01801318ea5b3`. [Artifact #12471259156](https://github.com/gamesbyian/wallgen/actions/runs/39884499923/artifacts/12471259156) holds **three 600×1300 production Chromium PNGs** plus normalized recipe sidecars, gallery and manifest. The three images were downloaded, opened and visually inspected. Every PNG's individual chunks passed independent CRC validation, and its sole embedded ROYGBIV recipe exactly matched the sidecar.

## Controlled artwork and numeric observations

All three use the **same seed, composition, crop, material and shadow/light settings**. Only optional `surfaceTreatments` differs.

| Output | PNG bytes | Observed appearance | Mean absolute channel difference from no-stitch (RGB, 0–255) | Fraction of pixels differing by >2 on any RGB channel |
| --- | ---: | --- | ---: | ---: |
| Untreated loop | 306,224 | Clean original bright red/orange concentric rainbow | 0 | 0% |
| Legacy Satin | 897,424 | Strong white/black ridges, obvious stitch field; warm inner ring becomes brown/desaturated | 8.535 | 30.514% |
| New opt-in Soft Satin | 793,798 | Same stitch path/rib cadence, gentler contour lighting and much closer warm colours | 3.457 | 28.927% |

Average RGB departure fell by approximately **59.5%** relative to legacy Satin for this one representative image, *without removing its stitched area*. At x=447,y=435, an inner warm-pink pixel changes from untreated (246,53,61) to legacy Satin (158,116,118) but to Soft Satin (202,89,93); at x=450,y=360 yellow changes from (246,224,49) to legacy (206,191,75) and Soft (229,211,59). An untouched exterior pixel at x=500,y=625 remained identical (49,151,246) in all three. These are concrete picture facts, not a claim of calibrated perception or realistic textile physics.

## Decision and limitations

**Keep both styles.** Soft Satin is preferable when hue fidelity matters, while the existing stronger Satin may be desired for an aggressively embossed/metallic look. Existing `satin` recipe output must never silently change; Soft Satin is saved under the independent explicit `satin-soft` choice, with the same station geometry, clipping and cached preview/export path.

The controlled test proves the specific goal of lowering black/white overpaint on this tight rainbow loop. It does **not** prove real thread strand shape, gloss/anistropy, fabric underlay, general gamut/AMOLED behaviour, arbitrary imported compound-ring quality, 19.8MP Android performance or mobile touch acceptance. Any further E3 development should start with true thread highlight orientation or fibre/underlay geometry rather than re-running this same shade comparison.

**CI cleanup:** The Chromium install/render/upload lines were temporary and restored *byte-for-byte* to the original `.github/workflows/check.yml` before merging this PR; this proof does not become a permanent suite.
