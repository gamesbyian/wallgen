# R0 diagonal ribbon recovery: two genuine current wallpapers (23 October 2026)

**Actual accepted evidence** from one-off branch-specific [Actions run #39926253657](https://github.com/gamesbyian/wallgen/actions/runs/39926253657), [actual 2-image source/candidate artifact](https://github.com/gamesbyian/wallgen/actions/runs/39926253657/artifacts/12488899988), `evaluation.json`, and the production Chromium renderer. We downloaded the PNG artifact, examined both source/best candidate pairs side-by-side, and checked the exact reported metrics. No simulated user, physical Pixel, invented external images, or historical recipe parity.

## Concrete controlled improvement

| Actual canonical 480×1040 source | Prior R0 baseline fit ↓ | New exact same R0 fit ↓ | Recovery |
| --- | ---: | ---: | --- |
| `02-diagonal-straight` | **0.28408** as seven stacked circles | **0.0858347866** as straight/diagonal paths, fitted | Large topology gain; error decrease ~69.8% |
| `11-scattered-circles` | **0.0083289145** as scattered circles | **0.0083289145** as scattered circles | No regression to a correct independent-object layout |

The actual source and inference PNGs are legitimate current-renderer artwork at 480×1040 with exact original unmodified metadata-free twins, separate source recipe truth and **blind** candidate inference. The low-res 96×208 evaluator ranked <=6 canonical recipes and refined the selected straight candidate with <=10 additional actual shared `drawWallpaper` evaluations. The 0.00879 source-recipe error floor for the diagonal is still much lower than 0.08583; exact source settings and seed are *not* recovered.

**Viewed side by side:** before this change, diagonal stripes were placed as seven overlapping, nearly vertical coloured discs. Now all seven colours traverse the canvas at the proper rising diagonal, preserving their sequential ROYGBIV grouping and broad spatial occupancy. The new ribbons are still packed closely enough to obscure the genuine original's seven narrow black separating lines, and positions/ends differ. The seven-circle comparison retains seven separate correctly positioned circles, including individual radius differences and black gaps. This is a genuine **useful visual quality improvement**, not exact reconstruction or a perceptual metric endorsement.

## Shared-engine code and boundaries

[#581](https://github.com/gamesbyian/wallgen/pull/581) added principal-axis orientation and elongation descriptors to **existing** hue connected-component `extractImageColourRegions` (second moments of the same component members). Five or more coherent elongated colour components with a stable diagonal covariance angle produce a few canonical `structure:paths,geometry:straight,orientation:diagonal` candidates and suppress misleading seven-circle construction; original circular components keep the existing path. No second colour-mask engine, separate graphics model, new picker, parallel rasterizer or changed canonical recipe schema. Both paths use existing normalizer, `respectSettingLocks`, renderer, fitting, Undo and Save.

**Outstanding:** accurate black-gap/stripe-width recovery, broader diagonal orientations and complex curves, radial/ring/nested classification, exterior image diversity and measured physical-device performance. The results above cover **two** genuine sources, not a universal classifier benchmark. No temporary Chromium task remains in `.github/workflows/check.yml` after merging; only `npm run check:quick` is required.
