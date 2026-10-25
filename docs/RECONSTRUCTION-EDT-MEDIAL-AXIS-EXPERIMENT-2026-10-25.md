# #557: opt-in independent negative-space / medial-axis optical oracle (25 October 2026)

**Status:** Implemented and tested offline evidence tooling. This is **not** a new inverse model, a browser dependency, an automatically weighted fit scorer or a claim that visible source pixels reveal unique original geometry.

## Why this exists

Our current source-versus-current-painter comparator, `compareReconstructionPixels`, is the authoritative pixel/ink error for the bounded 6+10 canonical candidates. It is effective at gross coverage, but can obscure local colour-stripe errors, unexpected tiny holes/crossings, and black-channel separation. The immediate failure modes are genuine R0 [Hairpin #05 and Loop #06](https://github.com/gamesbyian/wallgen/issues/557). The existing source/fit art was opened and reviewed, and its true source metadata was not fed into this diagnostic.

The new **`scripts/inspect-reconstruction-topology.py`** is deliberately external: Pillow/NumPy/SciPy/scikit-image approximate all seven current product hue masks at **277×600**, calculate connected components and filled-holes, and apply medial-axis / Euclidean distance transforms and symmetric bidirectional boundary Chamfer. Results are per-hue source/fit observations, rainbow foreground agreement and black-background/negative-space agreement. It reads PNG files only, **never source truth JSON, and never writes/changes recipes or image pixels**. Its independent HSV masking is comparable but **not byte-identical** to the browser importer. Skeleton endpoints/branches and hole counts are raster observations, not recovered original scene topology.

## Reproduction

Requires Python 3.13 for the published pinned optional wheel set:

```bash
python -m pip install -r docs/reconstruction-diagnostics-requirements.txt
python -m unittest discover -s tests -p test_reconstruction_topology.py -v
python scripts/inspect-reconstruction-topology.py \
  --source /path/to/05-hairpin.no-metadata.png \
  --fit /path/to/05-hairpin.r0-best-preview.png \
  --out artifacts/hairpin-morphology.json
```

Both inputs must be actual artwork PNGs at the same apparent orientation. The CLI bounds analysis to at most **650,000 pixels**; default 277×600. Its output is version-tagged JSON with absent-mask safeguards and finite values. The optional requirements are separately pinned; **nothing is added to `package.json`, client JS, browser worker or default `npm run check:quick`.** scikit-image 0.26.0 is BSD-licensed; the other four pinned scientific/image dependencies follow their own upstream licenses, not bundled here. The opt-in one-shot Python3.13 Actions [test #40166975130](https://github.com/gamesbyian/wallgen/actions/runs/40166975130) passed synthetic closed ring / seven-hue source equality / empty pigment / bounded dimensions, and its temporary workflow should be removed from the final branch.

## Real independently generated current-renderer artwork proof

Source and selected reconstructed PNGs were read from Agent 3's genuine production-Chromium [R0 #05/#06 before-after artifact in run #40154034365](https://github.com/gamesbyian/wallgen/actions/runs/40154034365), specifically `agent3-r0-source/*.no-metadata.png` and `agent3-r0-proposed/*.r0-best-preview.png`. Source is 480×1040; the accepted fit is 277×600. Both are resized/read at 277×600. The resulting local script's output was inspected along with side-by-side real artwork.

| Independent observable at 277×600 | Hairpin #05 | Loop #06 |
| --- | ---: | ---: |
| Average seven-hue pixel Dice | **0.64500** | **0.90545** |
| Average symmetric hue-boundary Chamfer (px) | **3.79444** | **1.11053** |
| Rainbow foreground Dice | 0.87936 | 0.92872 |
| Black negative-space Dice | 0.92306 | 0.92814 |
| Red per-hue Dice | **0.368** | 0.889 |
| Orange per-hue Dice | **0.460** | 0.890 |
| Visible source holes per hue | 0 all hues | 1 each hue |
| Visible fitted holes in orange/yellow/blue/indigo | 0/0/0/0 | **5/7/8/10** |

**Interpretation, not a new quality score for choosing recipes:** Hairpin's red/orange coloured exit arms and pigment separation are still much more badly aligned than Loop even though both render source-recognizable geometry. Loop recovers most colour pixels while leaving several **small erroneous hue-mask holes around its crossover**, consistent with the directly viewed source/fit artwork. Resize/aliasing, HSV cutoffs and the independent skeleton algorithm can add some holes; do not interpret these counts as a unique reconstructed path, definitive original occlusion order or painter bug diagnosis. A broad black Dice above .92 includes the large background and does not certify the narrow channels within the rainbow.

The normal inverse candidate scoring and existing reference-renderer output are **unchanged**. These diagnostics identify promising hypotheses for experiment B/C in [the inverse-vision plan](RECONSTRUCTION-VISION-ALGORITHM-REUSE-AND-TEST-PLAN-2026-10-24.md): source-measured local channel distance and hue-edge/topology disagreement, *then* review actual current-painter candidate PNGs before any adjustment to the ≤6+≤10 acceptance algorithm.

## Next justified engineering

1. Compare the same diagnostic JSON over **all six actual coarse candidates and ten refinement images only if already painted**; do not add rendering calls solely for this metric.
2. Prototype source-measured U-left/right pigment gap and outgoing-leg profile, not general blind angle/width guessing. Defend Hairpin black channels against current `stripeWidth:65` / `spread:32` overlap while retaining source-correct position/angle; test genuine #05 and non-hairpin controls.
3. Identify Loop's extra per-hue small holes from exact painter output before considering a topology penalty. Require lower hole errors and no worse pixel/colour alignment on actual generated artworks.
4. Continue VTracer as a separately pinned, opt-in SVG oracle only after independent source/fit corpus comparison. No VTracer package has been added in this PR.

**Not done:** private uploaded/owner external art, physical Pixel 6 Pro/Chrome memory/thermal/touch, TalkBack/IME, new production scoring policy, actual human creative rating, or general arbitrary-occlusion reconstruction. Keep [#557](https://github.com/gamesbyian/wallgen/issues/557) open.
