# Metadata-free independently authored graphics: reconstruction evidence (23 October 2026)

## Measured angular Draw registration (#615, 23 October)

[Focused PR #615](https://github.com/gamesbyian/wallgen/pull/615) advances the **existing canonical widened Draw** using measured seven-hue gaps and centre displacement from the same shared image importer. The first rigid-only experiment did nothing because source hue-centre gaps were approximately **8.94%** of frame height while the current widened Draw gave only **4.7–4.8%**: the seven offsets drift *linearly* across colour slots. A ten-render, lock-safe test of current **spread, positionY and stripeWidth**, preceded by the unchanged six coarse renders, achieved independent V-ribbon error **0.192433 → 0.116525** (39.4% lower) with normal editable `paths/drawn` output. Its true source recipe and seed remain **null** because this graphic was independently authored in SVG outside ROYGBIV.

[Actual selected source-versus-fitted PNG pairs and scores, one-shot run #40025249788](https://github.com/gamesbyian/wallgen/actions/runs/40025249788), were downloaded and opened for optical review. The result now follows the angular bend, seven separately coloured full-width bands and black spacing much better than the hairline predecessor. However, red/blue/indigo/violet local V corners exhibit **self-intersecting triangular or arrow-like defects**; the fit is a substantial recovery, not pixel parity or source-setting identification. A longer-baseline angular-turn measure on the already extracted centreline detected **two** source elbows; smoothing defeated the prior adjacent-vertex sharp-turn counter (zero). The same measure reports **zero** on independent smooth Wave and genuine production Wave/Jagged, and **one** on Hairpin, so only geometrically supported wide Draw may displace the established coherent Wave registration.

No measured-control regressions in the same live actual-renderer run: independent Wave **0.104807**, islands **0.049353**, current Wave **0.041215** (true renderer floor **0.008732**), Jagged **0.165655** (floor **0.010704**), Hairpin **0.107867** (floor **0.023054**). True canonical structure was independently known only for the current-renderer controls; no original seed or all original controls are claimed to have been recovered. The temporary browser workflow and extra diagnostic trials were removed before integration. Physical Pixel, human-provided/licensed external images and occluded/compound scenes still lack representative approval.

## Chevron hypothesis disposition (23 October)

[PR #613](https://github.com/gamesbyian/wallgen/pull/613) **closed without merge** after downloaded/visually inspected source and candidate PNGs from [one-off run #40020773615](https://github.com/gamesbyian/wallgen/actions/runs/40020773615). The independent angular V-band source scored .192433 with thin safe Draw, .215221 with the revised existing Chevron preset, and .226618 with a full-width Draw alternative. The last alternative visually follows the two angular bends but has an obvious vertical placement discrepancy. Original Chevron-first selection also displaced real Hairpin, regressing it from .107867 to .234696 in an earlier run; corrected prioritization restored Hairpin and the genuine Wave/Jagged controls but did not improve the failing external source. Do not ship or repeat this speculative Chevron configuration. A future source-informed translation/negative-space fit of the existing expanded Draw candidate is more promising. All source images in this trial are *independently authored test fixtures*, not owner-supplied external artworks. The one-off workflow is absent from main.


**Evidence boundary:** Three SVG graphics were authored **independently of ROYGBIV's canonical renderer**, in this repository under `tests/fixtures/reconstruction-external/`, then rasterized into 480×1040 RGB PNG files using standard Chromium SVG image decoding. Their pixels were never created by `drawWallpaper`, nor do they contain or have an original ROYGBIV recipe/seed. They are **self-authored test graphics**, *not* user-provided human art or third-party works with demonstrated licences. Do not represent this study as a comprehensive external-art evaluation.

## Actual study

[One-off browser study #40018856507](https://github.com/gamesbyian/wallgen/actions/runs/40018856507), artifact `independently-authored-external-style-three` (short retention). The unchanged real 96×208 `reconstructionCandidates` → ≤6 initial `drawWallpaper` scoring → one ≤10-trial `refineReconstructionCandidate` pipeline processed the three anonymous source PNGs, producing actual source/selected-preview pairs and all six ranked candidate previews. The downloaded images were **visually opened and inspected**, not inferred from a passing workflow log.

| Source | Selected editable canonical mode | Measured colour/coverage error ↓ | Observed appearance |
| --- | --- | ---: | --- |
| `independent-soft-waves` | `paths/wave` | **.104807** | Seven matching broad flowing colour bands; peaks, phase, source stroke edges and negative-space gaps differ |
| `independent-colour-islands` | `regions/scattered` editable circles | **.049353** | Seven distinct movable coloured circles, close overall placement and colour but imperfect individual radii |
| `independent-angular-stripes` | `paths/drawn` thin colour centreline | **.192433** | **Unsuccessful structural fit:** source has seven broad bent V-shaped ribbon bands, candidate compresses nearly all pigment into one thin trace |

The error is the established current 96×208 RGB/ink metric, lower better. It is **not** a subjective image quality rating. Crucially, the evaluated `trueStructure`, `trueGeometry` and `trueRecipeRenderError` fields are **null** for every independent image. A source SVG was never normalized as a canonical recipe, and no invented source seed appears in the manifest or report. Original SVG and generated source PNG files were not modified by evaluation.

## Delivered evaluator change

[PR #612](https://github.com/gamesbyian/wallgen/pull/612) extends **the existing** opt-in R0 evaluator with a separate `roygbiv-reconstruction-external/v1` manifest for at most four local metadata-free PNGs. It enforces safe local filenames, distinct IDs and sources, rejects an embedded ROYGBIV source recipe and forbids misleading `recipeFile`/`seed` fields. Reports carry an explicit `roygbiv-reconstruction-external-evaluation/v1` schema and no fake canonical truth. Real current-production R0 manifests still require separately held truth recipes and preserve the exact existing data contract.

To evaluate independent owner-provided PNGs locally, create a directory with 1–4 PNGs and a `manifest.json` such as:

```json
{
  "schema": "roygbiv-reconstruction-external/v1",
  "source": "owner-provided graphic",
  "items": [
    {
      "id": "example-ribbons",
      "metadataFree": "example-ribbons.png"
    }
  ]
}
```

Then run `node scripts/evaluate-reconstruction-r0.mjs --dir path/to/study --alternatives` after installing optional Playwright/Chromium. It produces `evaluation.json`, local gallery and real source/fit preview PNGs without uploading or overwriting input artwork. For PNGs containing ROYGBIV metadata, use the app's existing exact recipe import instead; the external study deliberately refuses that provenance mismatch. Never claim a human authored the particular source in this fixture study.

## Next high-value engineering question

The original Chevron-only hypothesis was rejected by #613. Current widened Draw now restores broad angular topology after physically measured gap and centre correction, but real source/fitted images show local **overlapping wedge/arrow artifacts near V bends** and width/nonuniform-end differences. Investigate those specific visible defects with the existing drawn-path curvature-safety/offset logic and current renderer, plus radial rings/rays, mixed-colour/occluded compounds and calibrated appearance-versus-procedural ambiguity. Require live source-pair evidence before adding a new scene representation.

Remaining #557 acceptance: independently licensed or owner-supplied real external graphics, true Pixel 6 Pro memory/touch/TalkBack, noncanonical palette and occlusion, and user review of artistic quality. The one-off screenshot workflow was removed before merge; no recurrent Chromium CI is needed.
