# Original v1 painter: first authentic image evidence

**Executed and inspected on 22 October 2026:** [one-off Chromium Actions run #39894186610](https://github.com/gamesbyian/wallgen/actions/runs/39894186610) on PR #524, [two PNGs and original recipes](https://github.com/gamesbyian/wallgen/actions/runs/39894186610/artifacts/12475469830). This is the **actual October 17 v1 normalizer, Canvas renderer and PNG exporter**, all unchanged Git blobs from commit `37428b624e55a0d4526b992bfe6fdf4a01b5f420`. No modern model or painter was used to make the images.

Both images have the same `historical-v1-shadow-image-001` seed, classic diagonal rainbow wave, black field, no texture, `stripeShadowStrength:45` and `stripeShadowSoftness:55`. Only the **original** `stripeShadowEnabled` toggle differs. The original images were downloaded and opened as a contact comparison, independently checked for every PNG chunk CRC and exact embedded `roygbiv-recipe-v1` JSON equality with their genuine source-era normalized recipe sidecars.

| Result | V1 shadow off | V1 shadow on |
| --- | ---: | ---: |
| Actual PNG IHDR | 600×1300 | 600×1300 |
| Historical exporter `output` declaration | 3024×6552 | 3024×6552 |
| PNG bytes | 112,912 | 188,858 |
| Original IDAT SHA-256 | `6de06318f36aed432fd7fc7e02535a7ff9e010416d444c89c1e2d8abaa5c31dc` | `8c5fe670bd23b921922261d68bc4b694492bb6b0abd3a0849eb56a5273c1314f` |

**Pixels actually changed by legacy shadow:** 40,662 pixels differ by more than two values in at least one RGB channel; mean absolute RGB-channel difference across 780,000 pixels is **0.197**. Of 416,496 pure-black baseline pixels, 37,837 change by more than two RGB levels. The shadow is subtle at gallery scale but visibly softens the boundaries; the rest of the black field stays intact. This confirms the original two-field shadow rule has a genuine visual effect.

The metadata's native 3024×6552 declaration is **historical original exporter behaviour**, not the actual 600×1300 IHDR of these preview samples. A future metadata-only adapter must preserve actual source raster dimensions using IHDR rather than trusting the old native-size claim.

**What remains unproven:** matching contemporary model/renderer output, every subsequent v1 revision, other geometries/materials/camera transforms, actual 3024×6552 legacy output, or colour accuracy across different Chromium builds. Keep v1 conversion blocked pending explicit source-interval adapter and **side-by-side historical/current rendered parity**. The machine-readable original [digest and recipe manifest](SHADOW-IMAGE-GOLDENS.json) survives the short-retention art artifact.

The one-off browser/PNG capture workflow was **removed completely** before merging. Routine quick Node CI remains unchanged.
