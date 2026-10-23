# Camera Photo finishing: five-image production-render review

Run the existing opt-in production Photo reviewer with its `--focus-camera` option in a full local checkout that has Playwright/Chromium:

```sh
node scripts/review-photo-looks.mjs --focus-camera --out-dir artifacts/camera-review
# Optional: --seed camera-study-002 --browser /usr/bin/chromium
```

It generates **five real ROYGBIV 600×1300 wallpapers** on the same seed, base geometry, camera/frame and material: untreated original, Natural Digital, Smartphone HDR, low-bandwidth Webcam and Early Digital Compact capture. Every PNG uses `render-headless.mjs --recipe` with the exact normalized authoring JSON alongside it. It saves a contact `index.html` and a manifest. It deliberately refuses to overwrite existing outputs.

Compare visible sampling/aliasing at curved edges, quantized chroma, banding, hue retention, digital noise, contrast on black, and whether the 360-column digicam signature is meaningfully distinguishable from the 200-column webcam at native gallery size. No claim of exact camera hardware reproduction, encoded JPEG artifacts, real sensor demosaicing, RAW data or calibrated colour is made. If the camera modes are merely different filters rather than evocative looks, log exactly *which* images fail before introducing more effects.

**Acceptance boundaries:** script implemented and focused Node tests are separate from **actually running Chromium**, **visually viewing the five resulting pictures**, matching embedded PNG recipes to JSON sidecars, and any physical Pixel 6 Pro performance review. This is an explicitly requested manual artistic probe, not an automatic screenshot factory. See [camera plan](DIGITAL-CAMERA-AND-COMPUTATIONAL-PHOTO-LOOKS-PLAN-2026-10-22.md) and [camera issue #471](https://github.com/gamesbyian/wallgen/issues/471).
