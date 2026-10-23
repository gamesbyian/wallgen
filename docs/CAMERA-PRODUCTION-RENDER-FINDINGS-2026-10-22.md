# Camera Photo appearance: five actual production images

**Actual pictures generated and inspected** 22 October 2026 in the one-time guarded [Chromium Actions run #39887351549](https://github.com/gamesbyian/wallgen/actions/runs/39887351549), PR #516 branch `111397bf7bebff7f2693c8fb4287d3914fc6a23d`. Its [five-image artifact](https://github.com/gamesbyian/wallgen/actions/runs/39887351549/artifacts/12473352114) contains the production-rendered 600×1300 PNGs, exact normalized source recipes, local HTML contact gallery and manifest. Downloaded and visually inspected all five. Independently validated *every PNG chunk CRC* and verified that the single `ROYGBIV Recipe` iTXt envelope's recipe matches its corresponding sidecar JSON exactly (5/5). There are no modified source pixel or film simulations in this analysis.

## Same-seed comparisons

All pictures share the same source seed, geometry, background, stripe spacing, lighting, and material state. Preset identity/parameters are the controlled variable. Signed mean absolute RGB channel differences below are **magnitudes** (not brightness deltas); the units are original 8-bit channel values.

| Source look | PNG bytes | Mean absolute RGB difference vs untreated | Pixels with any RGB channel difference >2 | Observed appearance |
| --- | ---: | ---: | ---: | --- |
| Untreated | 94,151 | 0 | 0% | Clean black substrate with seven sweeping rainbow ribbons |
| Natural Digital | 324,846 | 2.755 | 52.194% | Gentle tonal/colour finish; almost indistinguishable at contact size without side-by-side comparison |
| Smartphone HDR | 269,808 | 3.918 | 52.060% | Moderately punchier, less subtle highlights, retains mostly black substrate |
| Low-res Webcam (200-column sensor) | 852,596 | 6.844 | 54.486% | Visible low-detail smearing and roughening of the stripe boundaries, softer/desaturated yellow/red/indigo relationships |
| Early Digicam (360-column sensor) | 569,031 | 10.194 | 53.391% | Brighter, harder-edged saturated orange/blue/red and distinct quantized signal aesthetic, though still visually clean at gallery size |

Webcam and Digicam differ from one another by **15.824 mean absolute RGB channel units** across the whole frame; 54.771% of pixels differ by more than 2 in at least one channel. Both simulated capture presets visibly operate rather than behaving as colour-grade aliases. Both sampled downscales are bounded in the renderer rather than allocating a second full-resolution raster. On this abstract scene, however, the Digicam signature is substantially **colour/contrast dominated**: it looks punchier than Webcam but does not convincingly establish the grain, sensor mosaic, chromatic lens, colour science or block compression of a named historical camera. No fake calibrated-camera claim.

## Decision and remaining work

D3 spatial-capture implementations have now passed the concrete first **real artwork observation** gate, not only Node unit tests. A further full-resolution test is reasonable when checking Pixel 6 Pro memory/performance or export-size artifacts, but no general screenshot suite is justified for a personal app.

For D2/D3 future work, compare a restrained **DSLR/interchangeable-lens** optic rather than a fourth global saturation profile, or extend an independently named digicam variant with a grounded lens/sensor characteristic if a desirable effect can be demonstrated. Preserve old `camera-webcam-signal` and `camera-digicam-signal` pixel/seed semantics. Given the source artwork is flat procedural colour, depth-of-field, bokeh, and RAW fidelity cannot honestly be inferred from a cartoon scene. Prefer deliberate optical sharpening/vignetting if implemented and label it as stylistic simulation.

The one-time Chromium install/render/upload workflow steps are removed from `.github/workflows/check.yml` *byte-for-byte* prior to merging this evidence into main. Permanent testing stays the original quick Node check. Physical Pixel performance, tactile accessibility and actual named camera reproduction remain unverified.
