# Metadata-free independently authored graphics: reconstruction evidence (23 October 2026)

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

The angular failure is partly **representational, not simply fitting error**. The existing current canonical model already supports `geometry: 'chevron'` with `chevronSharpness`, `shapeDepth`, band width/spacing and meaningful editing. The six candidates offered here include generic Draw, Wave, Jagged and Straight, but no explicit Chevron candidate. Test **that existing mode** on the actual independent angular source and the current 04 Jagged/03 Wave controls before adding any new subsystem or changing scoring/renderer budgets. It may not match exact authored bends and must not displace a better Draw fallback without actual score improvement.

Remaining #557 acceptance: independently licensed or owner-supplied real external graphics, true Pixel 6 Pro memory/touch/TalkBack, noncanonical palette and occlusion, and user review of artistic quality. The one-off screenshot workflow was removed before merge; no recurrent Chromium CI is needed.
