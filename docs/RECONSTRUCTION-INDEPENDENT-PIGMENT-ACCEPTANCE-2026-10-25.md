# Independently drawn compact rainbow pigments: real-painter optical controls

**Issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557) • **Source/evidence:** [#722](https://github.com/gamesbyian/wallgen/pull/722) • **Corrected four-source run:** [#40243926440](https://github.com/gamesbyian/wallgen/actions/runs/40243926440) • **Accepted candidate hypothesis under separate review:** [#723](https://github.com/gamesbyian/wallgen/pull/723).

## Real standalone source, not a ROYGBIV truth set

`scripts/review-reconstruction-external-pigments.mjs` uses disposable standalone browser Canvas2D calls to **author independent testing sources**, not to render candidate wallpapers. Four fixed 480×1040 black-ground originals have seven coloured: distinct triangles/polygons; six-point concave stars; actual circles as a negative control; and partly overlapping polygon/star shapes with all seven visible hue regions. Each has a metadata-free PNG with `extractPngRecipe(...) === null`, a strict `roygbiv-reconstruction-external/v1` manifest, **no original ROYGBIV seed, sidecar or hidden painting recipe**.

A diagnostic defect in the first concave test source assigned its star-notch radius **0.62 pixels**, resulting in tiny near-black slivers with no qualified seven-hue region. That **invalid source and its rejection cannot be used as evidence** of an image recognizer shortcoming. Corrected to `outerRadius * .62`, generated new PNGs, and reran real Chromium drawing and evaluation in [successful #40243774715](https://github.com/gamesbyian/wallgen/actions/runs/40243774715), then independently repeated with opt-in source-descriptor diagnostics in [successful #40243926440](https://github.com/gamesbyian/wallgen/actions/runs/40243926440). The source inputs are held fixed during before/after comparisons; no truth enters reconstruction.

## Measured existing source-versus-current and existing research comparator

| Canvas-authored source | Ordinary selected kind | Ordinary actual score | Separate source-visible compound score |
| --- | --- | ---: | ---: |
| Seven polygons | seven editable circles | 0.046984685300399315 | **0.03580729166666851** |
| Seven concave stars | seven editable circles | 0.0504163524384065 | **0.03552870867898636** |
| Seven partly occluded mixed polygons/stars | seven editable circles | 0.0486878024446926 | **0.037243707579186096** |
| Seven circular pigment disks | seven editable circles | **0.036686247014832585** | 0.03759574142156916 |

The same original PNGs, ordinary results and one **research-only** shape comparator PNG per case were opened and visually compared, alongside real numerical 96×208 `compareReconstructionPixels` scores. The portable seven-shape comparator improves visible outline fidelity on the first three and is **worse on actual circles**, which is a meaningful negative control. None of these numbers implies recovered original source recipes. Canonical palette RGB differences remain visible and no physical phone/owner aesthetic acceptance has been claimed.

The existing `describeReconstructionImage` original shared source masks computed **seven source regions for all four**. The existing exposed-circle fit produces **seven complete circle hints only for the actual disk case** (zero hints for polygons, concave stars or overlaid mixed shapes). This permits the small [focused #723](https://github.com/gamesbyian/wallgen/pull/723) rule: permit ordinary seven-pigment compact sources with incomplete circle evidence to offer existing portable observed contours *as a competing candidate*, never adding an initial renderer paint. Complete seven-circle arc evidence keeps the existing circular path unchanged.

## Full independent production-painter acceptance of the routing correction

[Successful one-shot genuine Chromium GHA #40244686266](https://github.com/gamesbyian/wallgen/actions/runs/40244686266) evaluated the ordinary <=6 initial and <=10 refinement true-renderer candidates on all **22 original metadata-free current-renderer R0 sources**, then all **four standalone external graphic sources**. Final PR-head [lean CI #40244686268](https://github.com/gamesbyian/wallgen/actions/runs/40244686268) also passed the targeted seven-triangle vs seven-circle test (including portable JSON/PNG recipe serialization and resolved scene object types).

| External independent source | Previous normal kind/error | New normal kind/error | Outcome |
| --- | --- | --- | --- |
| Seven polygons | regions / 0.046984685300399315 | hue-visible-shapes / **0.03576546003016776** | Noncircular contours preserved |
| Seven concave stars | regions / 0.0504163524384065 | hue-visible-shapes / **0.03553175276521056** | Genuine concavity preserved |
| Seven overlaid polygon/stars | regions / 0.0486878024446926 | hue-visible-shapes / **0.03724675166541032** | Source-visible occlusion retained |
| Genuine seven circular discs | regions / **0.036686247014832585** | regions / **0.036686247014832585** | Round-object control unchanged |

The **22/22 original R0 selected kinds, scores and fitted preview PNGs are exactly identical** to the merged #722 accepted baseline; the **22/22 original metadata-free source PNGs** and **all four external standalone source PNGs** are also independently verified **byte-for-byte identical** between baseline and #723 artifacts. Both complete archives were downloaded, enumerated and compared, and a four-row contact sheet of actual source, previous winner and new winner was opened and inspected. Source palettes differ from ROYGBIV colours, so residual scores do not imply colour identity or original painter provenance. The third case encodes only visible overlapping pigment boundaries; it does not infer hidden polygon geometry or invisible layer ordering. There is no physical handset or owner aesthetic acceptance.

The one-shot expensive PR trigger was removed from the workflow before merge, leaving manually opt-in `include_external_pigments` and `include_holdouts` gates only. Standard CI remains lean.

## Limits and retained acceptance boundaries

No model was asked to reconstruct source-invisible overlapped pixels, historical painter order/seed, missing off-frame contours, gradients, materials or ambiguous original palette. No inference path may assume all images are seven bright ROYGBIV patches. Failure to obtain seven qualifying masks, overflow of 16 significant islands/hue, malformed compound geometry, locks or source byte alterations must still refuse. `--source-signature` is an explicit **research-only** evaluator flag and introduces no routine execution overhead. The existing `reconstruction-hue-shapes-experiment.yml` remains **manual-only**, with an optional `include_external_pigments` boolean; normal quick PR checks must remain lean.
