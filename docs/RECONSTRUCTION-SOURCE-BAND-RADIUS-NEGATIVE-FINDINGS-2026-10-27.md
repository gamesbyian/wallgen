# Source-visible hue silhouette resizing: genuine Hairpin and Loop negative result (27 October 2026)

**Owner:** [reconstruction #557](https://github.com/gamesbyian/wallgen/issues/557). **Evidence PR:** [#803](https://github.com/gamesbyian/wallgen/pull/803). This experiment is **NOT** a new recipe fitter, source recovery method or user-facing auto-correction.

## Real source/fit picture inspection

The preceding [#801 seven-image matched A/B actual Chromium artifact](https://github.com/gamesbyian/wallgen/actions/runs/40434874103/artifacts/12703755887) was downloaded, decoded, and **source, fitted and enlarged RGB residual PNGs actually viewed side by side**. Unlike inspecting only numerical scores, this disclosed a clear local defect:

- **05 Hairpin:** the fitted seven hues follow the source's overall U path, but narrow separate black channels between pigments are partially filled in, especially around the bend and incoming/outgoing leg boundaries. They appear locally 1 fitting pixel different, not simply a global shape displacement.
- **06 Loop:** the fitted concentric rings, centre and incoming leg are broadly aligned; some black channels and local colour boundaries around the ring/crossing narrow or blur, again mostly local outline/raster registration, not a single global scaling issue.
- **03 Wave**, ordinary **04 Jagged** and **16 Offset Jagged** are comparatively well aligned, useful constraints on any future smoothing/erosion proposal.

All of these **are genuinely produced by the current ROYGBIV renderer from independent current authored source recipes**; none is a separate third-party owner's graphical illustration, exact seed recovery, physical Pixel check or human approval. The source PNG pixels remain unmodified in the app and artifact.

## Falsified hypothesis: shrink or enlarge all hue silhouettes uniformly

An isolated opt-in [actual browser experiment](https://github.com/gamesbyian/wallgen/actions/runs/40437075592) created seven source wallpapers with `scripts/review-reconstruction.mjs`, fitted them via the live canonical renderer once with `scripts/evaluate-reconstruction-r0.mjs --save-best-recipe`, and then rendered candidate variants using the same **actual `drawWallpaper`** and the canonical `scatteredOverrides.radius`. Tested factors **0.98, 0.985, 0.99, 0.995, 1.0, 1.005, 1.01, 1.02** uniformly across the recovered seven hue shapes. The source comparison used the corrected all-pixel 96×208 RGB+brightness error plus existing hue IoU and edge Chamfer. This sweep occurs **only** in the explicitly run analysis harness, **not the product** and not in its bounded 6+10 automatic painter budget.

| Actual source case | Baseline full-frame error at 1.0 | Best of seven altered factors | Decision |
| --- | ---: | ---: | --- |
| 01 Straight Vertical | .024289 | No winner | Keep original |
| 03 Wave | .013694 | No winner | Keep original |
| 04 Jagged | .018603 | No winner | Keep original |
| **05 Hairpin** | **.028936** | Next best 0.995 at **.034767** | **Reject shrink: +20.1% error** |
| **06 Loop** | **.036731** | Next best 1.005 at **.039934** | **Reject enlargement: +8.7% error** |
| 11 Scattered Circles | .005508 (native circles) | Ineligible: not a 7-hue shape snapshot | Leave untouched |
| 16 Offset Jagged | .013304 | No winner | Keep original |

The opt-in job's **first attempt failed before painting research variants** due a local HTTP test server classifying the `/` route as an octet-stream download instead of HTML; correcting that test server yielded a complete passing actual-Chromium run. Its real [source PNGs, 48 variant PNGs (six eligible source cases × eight factors; 42 altered and six baselines), scores, and JSON report](https://github.com/gamesbyian/wallgen/actions/runs/40437075592/artifacts/12704781842) were preserved. Source/base/0.995/1.005 Hairpin and Loop PNGs were **also visibly inspected** after the successful run, confirming uniform resize changes whole centreline registration and crop as well as channel width, so it cannot isolate the local 1px channel residual.

## Engineering consequence

**Do not ship any universal per-pigment radius multiplier or quiet silhouette shrink** as a supposed Hairpin/Loop improvement. It is source-backed worse, not just an intuition. It cannot fix the original source's local pixel-cell border placement or true overlap ambiguity by resizing a large silhouette about its centre, particularly a path extending partly beyond the frame. Existing native procedural Hairpin/Loop and source-visible hue geometry remain available without new automatic painter expense. A credible next proposed repair must target **local contour registration and limited black-channel preservation**, distinguish genuine source geometry from antialias, test separately curved crossings and narrow straight legs, view real before/after art and check all seven colour slots + control sources, not infer hidden layer order.

Reusable `scripts/probe-hue-shape-radius-browser.mjs` is **manual-only, source-visible current-renderer research**. Its `playwright` dependency is installed only for opt-in exploration; it never alters product recipes. Temporary heavyweight automatic PR trigger is removed before merge and final lean CI required. The test is reproducible without storing original source bytes or public private user fonts in the repo.
