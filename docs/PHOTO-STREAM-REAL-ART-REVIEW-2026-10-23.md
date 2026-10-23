# Shared Photo bounded-readback: actual-image acceptance (23 October 2026)

**Evidence source:** real current production Chromium Canvas, [one-off GHA run #39924179021](https://github.com/gamesbyian/wallgen/actions/runs/39924179021), [four-source PNG/recipe/manifest artifact](https://github.com/gamesbyian/wallgen/actions/runs/39924179021/artifacts/12488114102). Artifact retention is only two days; independently executable source is `node scripts/review-photo-looks.mjs --focus-stream-parity --verify-stream --out-dir <unique-output>` with Playwright/Chromium installed. This was a **temporary branch-gated** browser action, removed before merge. The official `Validate Wallgen` PR gate remains only `npm run check:quick`.

## What was actually executed and inspected

Four authentic **600 × 1300 ROYGBIV production PNGs** with the same seed and source composition were generated from the existing `drawWallpaper` and headless exporter. They were downloaded and **visually opened together**: untreated `00-original`, `11-wide-warm-diffusion`, `09-camera-digicam`, `10-camera-dslr`. Every PNG independently passed per-chunk CRC checks and had **one complete embedded canonical-v2 recipe matching the corresponding sidecar JSON exactly**. No alpha changed versus the untreated source. The source frames were *not* mockups or synthetic stripes drawn by this QA script; rendering used the normal ROYGBIV renderer.

Before exporting each finished PNG, the `--verify-photo-stream` branch evaluated the **same real original artwork pixels** through three paths: direct full-buffer `processPhotoPixels`; new bounded Canvas2D `applyPhotoFinish`; and independently invoked normal production `drawWallpaper` with Photo enabled. **All 3,120,000 RGBA bytes matched exactly for each of the three active looks.** These results are recorded per case in `manifest.json` (all `exactStripParity: true` and `exactProductionParity: true`), and the one-off job exited successfully.

| Same-seed finish | Actual PNG bytes | Average absolute RGB change versus untreated | Pixels with >2 change in any RGB channel | Production/direct/strip byte comparison |
| --- | ---: | ---: | ---: | --- |
| Untreated source | 94,151 | 0.000 | 0 | Control |
| Wide Warm Halation | 279,831 | 2.809 | 327,138 / 780,000 | 3,120,000 / 3,120,000 exact |
| Early Digicam Signal | 569,031 | 10.194 | 416,450 / 780,000 | 3,120,000 / 3,120,000 exact |
| DSLR-inspired Acutance | 269,925 | 2.571 | 407,096 / 780,000 | 3,120,000 / 3,120,000 exact |

The byte counts, CRC checks and measurements were independently recovered from the generated artifact, not solely accepted from the Actions log. Alpha is unchanged in all four images. The source image itself has many black pixels and soft-edged, separately spaced seven-colour waves, giving these finishes genuine rainbow-to-black boundaries to process.

**Visual read:** the Wide Halation render shows clear warm red/orange fringes spilling into adjacent black gaps while leaving distant black dark; this is visibly wider than no Photo at contact size. Digicam increases apparent yellow/green saturation and alters edge/colour character substantially. DSLR is subtler as a visible optical change at contact size, though the underlying pixel differences are real; its main purpose remains restrained edge local contrast. These three images are plausible, useful distinct artistic treatments, with no indication of strip seams, shifted contours or changed alpha in the viewed gallery. This is a **specific one-seed 600×1300 result**, not a stock/sensor calibration, exhaustive visual survey, or evidence of physical Pixel OLED appearance.

## Implementation and limits

[#553](https://github.com/gamesbyian/wallgen/pull/553) changed ordinary grading/Flash to at-most-2 MiB readback strips; [#569](https://github.com/gamesbyian/wallgen/pull/569) uses the same bounded source reader for original/Wide Halation; [#571](https://github.com/gamesbyian/wallgen/pull/571) reuses it for Webcam/Digicam signal and DSLR acutance. The source-dependent fields must be fully sampled **before** the first finished destination strip, preserving original colour/position math. No old Photo presets, canonical recipe fields, manual Before/After or visual UI were silently changed. The current Photo API now avoids a single approximately 79.2 MB full-frame Canvas2D getImageData at the target **3024×6552** wallpaper dimensions.

**Do not infer:** browser/JS peak heap (Canvas storage, decoded PNGs, per-look fields, GPU memory and concurrency are additional), elapsed time or perf improvements on a physical Pixel 6 Pro, Android activity survival, image quality on multi-texture/embroidery compositions, colour-space/linear-light fidelity, or reproduction of a real sensor/film stock. Those require a separate observed bug or native-device test; they are not release gates. The small sampled fields and stream buffer are independently bounded; streaming may incur additional browser readback calls with performance tradeoffs. No permanent Chromium CI was added.
