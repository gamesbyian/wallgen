# DSLR-inspired lens crispness: targeted three-image art review

**First actual art review completed:** [Actions #39888307174](https://github.com/gamesbyian/wallgen/actions/runs/39888307174) generated three production PNGs, which were downloaded, opened, CRC-validated and matched to the recipe sidecars. See [measured visual findings](DSLR-OPTICAL-PRODUCTION-FINDINGS-2026-10-22.md). The optional reviewer below stays available; the one-time Chromium CI step was removed before merge.

A separate opt-in `camera-dslr-optics` look aims for a restrained high-acutance digital lens impression, without pretending ROYGBIV's flat abstract shapes contain real photographic scene depth, a physically modelled lens, an image sensor, or RAW data. The core image technique follows a standard [luminance unsharp-mask principle](https://www.cambridgeincolour.com/tutorials/unsharp-mask.htm): measure a blurred original luminance field, subtract that from the original, and gently enhance genuine high-contrast edges. Keep radius and gain restrained to avoid halos and colour fringes.

This code samples an authored-world field bounded at 600×1300 (approximately 0.78 megapixels maximum), uses a separable 3×3 Gaussian kernel and bilinear high-pass resampling, with a small threshold and an 18-channel-unit cap. It **does not** allocate a second full 19.8 MP pixel raster. Processing remains post-composition, deterministic and saved in the normal `photoLook` / worker / exported PNG path. Original `camera-natural`, `camera-hdr`, webcam and digicam are pixel-stable.

Run the existing manual art tool for **three real 600×1300 production wallpapers**: untreated, Natural Digital and new DSLR-inspired optical treatment:

```sh
node scripts/review-photo-looks.mjs --focus-lens --out-dir artifacts/optical-lens-review
```

The same seed/geometry and exact JSON recipe/embedded PNG pair accompany every case. Examine narrow hard edges at 1:1 as well as contact size, unexpected light/dark halos, RGB hue shifts, and whether the slight corner falloff improves the art. *Script authored* and *picture actually generated/viewed* are different acceptance states. No compulsory CI/browser matrix. This is the next D2/D3 art judgement, not calibrated DSLR reconstruction.
