# Deep-black Muted Negative: controlled production comparison

**Actually run and observed on 22 October 2026.** One-time guarded [Chromium Actions run #39885066432](https://github.com/gamesbyian/wallgen/actions/runs/39885066432), PR #512 review branch at `e09314bdca3c30c53c0f82372fa693544671b199`, produced [three actual 600×1300 production PNGs and full sidecar recipes](https://github.com/gamesbyian/wallgen/actions/runs/39885066432/artifacts/12471789819). The images were downloaded and viewed together; every PNG chunk CRC validated independently, and the one embedded `ROYGBIV Recipe` envelope in each exactly matched its corresponding JSON source. The temporary Playwright Chromium installation/render/upload step was removed from the PR branch before merge. Routine CI remains the original quick Node check.

## Results, same source art and seeded film parameters

| Scene | Size | RGB at (20,20), original black | Mean absolute RGB deviation from untreated | Fraction of RGB pixels exactly black |
| --- | ---: | --- | ---: | ---: |
| Untreated diagonal rainbow | 94,151 bytes | (0,0,0) | 0.000 | 47.798% |
| Original Muted Negative | 1,208,000 bytes | (17,16,13) | 15.156 | 0.000% |
| New opt-in Deep-black Negative | 690,675 bytes | (0,0,0) | 8.073 | 47.798% |

A pixel at (450,360) with source RGB (246,148,49) was mapped to (230,150,68) in both processed presets. Across **all 405,237 pixels** with source Rec.709 encoded-sRGB luma ≥22/255, the old and new treatments were **exactly identical in all three output channels**, including deterministic grain. Across all **372,824 source-black pixels**, the new treatment remained (0,0,0); the old treatment lifted them. A narrow near-black transition band handles the boundary without hard colour-space thresholding. This is direct source and production-image evidence for the precise wallpaper-background goal; it is not physical linear-light colour science.

## Human-readable visual judgement and limits

The legacy Muted Negative produces an intentionally soft charcoal paper-like substrate. The new Deep-black alternative keeps the rich, softened negative-like ribbon colours but restores a visibly black AMOLED-suitable field, as designed. It appears close to the old negative on bright stripes, rather than a separate arbitrary colour treatment. Both modes remain useful; neither should silently replace the other.

This comparison is real software output inspected by an agent, not a fabricated human preference study. It **does not** certify a named film stock, photographic accuracy, Pixel 6 Pro display black level, 19.8MP RAM/runtime or other source compositions. The only new setting is opt-in `film-negative-deepblack`; original `film-negative` stored recipes must remain pixel-stable.

The one-time artifact has limited GitHub retention, but this finding and the permanent `--focus-deep-black` three-scene reviewer allow future repeatability without a permanent CI screenshot factory.
