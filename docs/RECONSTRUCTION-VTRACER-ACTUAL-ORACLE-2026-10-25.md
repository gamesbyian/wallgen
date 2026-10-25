# #557: pinned external VTracer source-vectorization oracle (25 October 2026)

**Status:** Completed genuine current-renderer source experiment with an **offline, reusable benchmark tool**, not a product import, production renderer change, source-seed recovery, editable recipe proposal or mandatory CI gate. This implements Experiment A in [inverse-vision algorithm plan](RECONSTRUCTION-VISION-ALGORITHM-REUSE-AND-TEST-PLAN-2026-10-24.md).

## Independent reference binary and reproduction

VTracer/visioncortex official GitHub release **`1.0.0-alpha.4`** (published 29 August 2026). Pinned Linux x86_64 MUSL archive:

- URL: `https://github.com/visioncortex/vtracer/releases/download/1.0.0-alpha.4/vtracer-x86_64-unknown-linux-musl.tar.gz`
- Verified publisher-declared **SHA-256 `2058f611b48ed49497f78883bde47435531e9e17e3a79428432d1528bdb12e2a`**, checked with `sha256sum -c` on the Linux GHA runner **before execution**.
- Official repo `visioncortex/vtracer` is dual MIT / Apache-2.0 licensed. This document does not vendor the binary, a Rust runtime, model weights or third-party code into the PWA.

Run with an independently downloaded/verified trusted VTracer executable (the Python script intentionally does not download a binary):

```bash
python3.13 -m pip install -r docs/reconstruction-vtracer-requirements.txt
node scripts/review-reconstruction.mjs --out-dir artifacts/r0-sources \
  --only 04-jagged,05-hairpin,06-loop,16-offset-jagged,18-repeated-compound-hole-island,22-overlapping-reversed-circles
python3.13 scripts/benchmark-reconstruction-vtracer.py \
  --source-dir artifacts/r0-sources \
  --out-dir artifacts/vtracer-r0 \
  --binary /path/to/pinned-vtracer
python3.13 -m unittest discover -s tests -p test_reconstruction_vtracer.py -v
```

For trusted source SVGs from an already completed offline experiment, omit the CLI and reuse `--existing-svg-dir /trusted/vtracer-dir`. Input PNGs are **read-only**, identified by SHA-256, limited to at most 50 sources and ≤650,000 pixels each. The source and restored vector PNG are separate artifacts. XML shapes with external/embedded images, URL resources, DTD/ENTITY references and huge payloads are refused. This trusted reference utility is **not an arbitrary untrusted SVG opening service**. Metrics assume black input backgrounds (the R0 corpus uses black) and are not the canonical perceptual/winner score.

## Real current production Chromium evaluation

The actual one-shot [GitHub Actions run #40167184750](https://github.com/gamesbyian/wallgen/actions/runs/40167184750) successfully installed pinned VTracer with checksum verification, generated **six genuine 480×1040 current `render-headless` PNG artworks** and metadata-free pixel-preserving twins, vectorized all six through the independent Rust CLI, and rasterized the resulting SVG using **CairoSVG 2.8.2 on the same dimensions**. Original and vector-raster artwork PNGs were downloaded, inspected and compared directly side by side, including bent Hairpin U, Loop ring/crossover, hue-clipped Jagged endings, compound shape holes and layered circles. Source-original recipes were never supplied to the vector oracle.

| Genuine R0 source | SVG paths | SVG bytes | SVG RGB mean absolute error (0–1) | Bright-ink IoU | CLI seconds |
| --- | ---: | ---: | ---: | ---: | ---: |
| #04 ordinary Jagged | 13 | 29,100 | .006866 | .98194 | .133 |
| #05 Hairpin | 17 | 30,331 | .012025 | .95870 | .159 |
| #06 Loop | **107** | 45,231 | .013846 | .97165 | .157 |
| #16 cropped Jagged | **73** | 36,534 | .007453 | .97913 | .142 |
| #18 repeated compound holes/islands | 22 | 4,827 | **.001256** | .96736 | .032 |
| #22 reversed-layer overlapping circles | 8 | 6,688 | .002239 | **.99148** | .052 |

These are *SVG->PNG reference reconstruction scores at 480×1040*, **not comparable numerically** to the product's existing 96×208 `compareReconstructionPixels` error. `bright-ink IoU` is a simple thresholded bright-foreground mask, **not per-hue Jaccard nor verified topology**. CLI seconds exclude Chromium source production, Python/CairoSVG rasterization, container setup and binary installation. No cross-run performance benchmark was claimed. Appearance is impressively close on the reviewed contact sheet, but SVG contour complexity is highly irregular and preserves neither original procedural controls nor the canonical objects. In particular **Loop produces 107 independent path commands/objects** for an apparently continuous seven-colour spiral. Directly converting that into canonical editable regions would create a brittle, crowded object library rather than a meaningful Loop.

## Engineering outcome

**Adopt as an optional offline comparison tool only. Do NOT bundle VTracer in the browser/PWA or silently substitute the canonical inverse importer.** The existing canonical contour path already supports compounds/holes and seven editable hue stamps, and the product must preserve sensible manipulation, lock/Undo/worker/export parity, 6+10 forward-render cap, private font/image source safety and exact provenance. VTracer is useful as an **independent appearance upper-bound/quality oracle**, not evidence of the original seed, painter order, material, hidden geometry or human creative approval.

Potential next bounded followups, requiring independent optical proof:

1. Compare the vector oracle's visible **per-hue negative-space/edge agreement** with the newly merged `inspect-reconstruction-topology.py` EDT metrics, particularly Hairpin #05 and Loop #06; discard topology-unsafe extra tiny holes.
2. Count path simplification and glyph/shape editability cost **before** considering an optional contour adapter; proof must include canonical normalization, 3024×6552 export, multiple real source/fit controls and detailed visual approval.
3. Use current renderer's *already generated* source and candidate PNGs for scoring experiments; no new source-truth leaks, render budgets or default GHA jobs.
4. Prioritize real Hairpin return-leg spacing/black gaps over adopting a generic SVG renderer. Loop's error is smaller and the 107-path trace is warning evidence.

No physical Pixel 6 Pro, TalkBack/IME, outside-permissioned owner artwork or human acceptance was tested. Issue [#557](https://github.com/gamesbyian/wallgen/issues/557) remains **OPEN**. The one-shot Chromium+CLI workflow was **removed** after its artifact `reconstruction-557-vtracer-pinned-oracle` was preserved; no routine CI change.
