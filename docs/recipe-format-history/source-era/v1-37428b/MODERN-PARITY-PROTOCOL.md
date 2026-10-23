# First-v1 versus modern painter: controlled parity protocol

**Scope:** first original `roygbiv-recipe-v1` source at commit `37428b624e55a0d4526b992bfe6fdf4a01b5f420`, **not** any arbitrary PNG carrying a v1 envelope. The unchanged model, renderer and PNG writer in this directory are the historical authority. The two genuine shadow-on/off image receipts and encoded-IDAT hashes are pinned in [SHADOW-IMAGE-GOLDENS.json](SHADOW-IMAGE-GOLDENS.json). Some browser builds encode PNG differently; IDAT matches are a supporting provenance comparison, not a cross-Chromium pixel gate.

## Run only when useful

From a full checkout with an optional local Playwright/Chromium installation:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 &
node scripts/review-historical-v1-parity.mjs --out-dir artifacts/v1-parity
```

This independently paints **four** 600×1300 Canvas images: original-v1 and hypothetical current-v2 preview, each with the source-era shadow disabled and enabled. The original PNG is annotated using the **original** exporter. The preview is saved separately as an unmistakably named `modern-PREVIEW.png` without altering or re-embedding the historical PNG. The comparison is image-data RGB pixel-by-pixel (including exact pixels, differences above two channel levels, mean absolute RGB difference, and previously pure-black regions), not simply a comparison of recipe keys.

The `scripts/historical-v1-preview-candidate.mjs` helper accepts **only fully normalized original-model recipes with an explicit historical shadow field**. It maps the removed opt-in flag to the current strength (disabled → zero; enabled → original strength) and makes a **hypothesis** that Paths/single/ribbon plus contemporary defaults approximate the legacy painter. A per-field audit identifies erased, added and altered fields. It always returns `safeForMigration:false`. Even a pixel-perfect result on these two controlled fixtures would not establish equivalence for other seeds, materials, orientation modes, historical intervals or older saved PNGs.

### Acceptance and next decision

1. Run the opt-in script on one branch, open its contact sheet and read its `manifest.json` metrics; check original raw v1 writer envelope, original raster IHDR, original iTXt and existing migration refusal.
2. Investigate differences against **both** original shadow goldens. Identify model/scene drift versus painter drift; do not silently replace original model defaults or modify the current renderer to force a one-off fixture.
3. Capture later original-v1 source intervals **separately**, with exact source Git blob SHAs, original writer recipes and image samples. Expand beyond this seed and pair of shadow states only with actual controlled pixel evidence.
4. Consider a production metadata adapter only after explicit model+renderer equivalence is established for a provenance-identifiable interval, and verify preservation of every non-recipe PNG chunk, raw source archival copy, zero active-artwork mutation and unchanged older saved recipes.

**State of evidence at addition:** source code for an executable opt-in parity experiment and deterministic refusal tests. There are no newly claimed Chromium image results until a run is actually retrieved and inspected. The existing `inspectPngMigration` and `migratePngMetadataOnly` continue to refuse all v1 PNGs; no conversion feature has been switched on. Routine CI remains lean.
