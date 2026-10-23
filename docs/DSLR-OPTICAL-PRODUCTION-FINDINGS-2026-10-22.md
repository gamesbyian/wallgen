# DSLR-inspired optical acutance: actual production-rendered evidence

**Three real ROYGBIV PNG images generated, retrieved and viewed on 22 October 2026.** Temporary PR #517 Actions [run #39888307174](https://github.com/gamesbyian/wallgen/actions/runs/39888307174) on commit `36167fb99cd4ee724cd27b81422629cb65d1d67e` installed Chromium, used the unchanged production headless renderer, and uploaded [artifact #12473781290](https://github.com/gamesbyian/wallgen/actions/runs/39888307174/artifacts/12473781290). The images were downloaded and opened as a contact comparison and a deliberately magnified 1:1 source-pixel crop. Complete independent per-chunk PNG CRC validation passed for all three; the single embedded ROYGBIV recipe in each exactly matches its normalized JSON sidecar. No synth/AI preview was substituted for the app's renderer.

## Controlled first picture results

All three pictures use one 600×1300 same-seed untextured seven-ribbon scene, same frame/crop/light. The only variable is Photo finishing.

| Treatment | PNG bytes | Mean absolute RGB-channel departure from untreated | Any RGB channel differs by >2 | Visual evidence |
| --- | ---: | ---: | ---: | --- |
| Untreated | 94,151 | 0 | 0% | Clean flat hard-edged rainbow and black background |
| Natural Digital | 324,846 | 2.755 | 52.194% | Subtle colour/tonal rendering, clean hard edges |
| DSLR-inspired optics | 269,925 | 2.571 | 52.192% | Subtle restrained finish and sharper local transitions; no conspicuous colourful fringing or thick halos in magnified inspection |

**Optical local-detail is functional, even though the whole picture looks similar.** New optics differs from Natural by 1.3415 mean absolute channel units and 30.195% of pixels differ by >2 on at least one channel (maximum 21 units). At a 3x enlarged cropped rainbow boundary there is only a subtle light/dark accent rather than a large white or coloured outline. The full black substrate is protected: **all 372,824 original-black RGB pixels remain pure black** in the new preset, without a charcoal film floor. Native alpha from the RGBA processor is also preserved by targeted Node tests.

## Decision and limits

**Keep as a separate restrained, clearly simulated optical style.** It exercises a genuinely spatial luminance high-pass instead of repeating the digicam saturation treatment. On already digitally drawn perfectly sharp shapes, the perceived gain is limited; marketing it as a reproduction of an actual DSLR's lens or sensor would be misleading. For more visibly photographic results, consider source geometry with intricate surface/material marks or a separately designed lens aberration mode before adjusting this saved preset. Physical Pixel export timing, colour management, long-duration memory performance, textured material/embroidery integration, optical transfer functions and camera calibration remain open.

The original Natural/HDR/Webcam/Digicam presets retain unchanged processing paths. The one-off three-image Chromium workflow has been **removed byte-for-byte** before merging; there is no new permanent CI matrix, browser dependency or large screenshot factory.
