# Imported compound silhouette: one focused embroidery visual proof

This optional study uses the real Shape Library's canonical `roygbiv.geometry-snapshot` recipe format, with **one rectangular region containing a central cutout and a detached island**. The geometry is authored numerically and validated by the existing compound-region normalizer. One explicitly positioned scarlet object is stamped onto the 600×1300 art frame.

```sh
node scripts/review-embroidery.mjs --focus-compound --out-dir artifacts/compound-stitches
```

It generates exactly two ROYGBIV production renderer PNGs with the same seed/geometry/camera: untreated and object-targeted Tatami. Each PNG embeds its canonical JSON recipe; sidecar files and contact gallery are included. This is a small opt-in artistic proof, not an automatic browser test.

The critical **hole-preservation invariant** is that all background pixels within the intentional void, detached negative space between the donut and island, and the rest of the black substrate remain exactly untouched by embroidery. New stitch differences should be bounded to the visible coloured mask. If source geometry changes after import, or stitches leak into the hole, investigate a real renderer bug before adding a new artistic treatment. Reproducible view geometry lets the comparison be inspected pixel-for-pixel rather than relying on a visual thumbnail.

Source/recipe tests alone do not prove that the Canvas even-odd clipping actually works; real Chromium PNGs and independent pixel checks must be recorded separately. No new full CI matrix or physical Pixel claim is required.
