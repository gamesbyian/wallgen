# Independent Agent 1 portrait optical review · 2026-10-20

**Review status:** bounded direct visual inspection of actual Chromium screen pixels, **not a human aesthetic decision, Android hardware acceptance or complete release gate**. No product CSS, user controls, screenshot pixels or acceptance checkboxes were changed.

## Source-exact evidence

Reviewed the [green 70-screen touch-emulated Chromium run](https://github.com/gamesbyian/wallgen/actions/runs/39408395746) from [PR #314](https://github.com/gamesbyian/wallgen/pull/314), whose [archived original screenshots and manifest](https://github.com/gamesbyian/wallgen/actions/runs/39408395746/artifacts/12257833938) preserve CSS viewports, device scale factors, source DOM click/tap actions and resulting PNGs. Source PR head was `0379ae4759ab21e2278c1b9a428042766be81a53`.

Inspected **56 of the 70 actual pictures** as cream/dark full-view contact sheets for each of the *in-scope portrait widths*: 360×740, 412×892, 499×892 and 500×892; seven application states per width and theme. The fifth profile, 700×412 landscape (14 pictures), remains a historical automated witness and was deliberately **not promoted to portrait release approval**.

The comparison covers `studio`, `edit-material`, `edit-interior`, `explore`, `saved`, `more` and `draw`. The first two editor states were entered via original browser touchscreen-emulated taps; all images are the actual source app, not generated replacement screens.

## Numeric cross-check of original screenshot manifest

In addition to examining the actual PNG pixels, I separately read the `manifest.json` inside the source artifact and filtered to exactly the 56 portrait screenshots. All have **positive native `#preview` dimensions**, **zero reported stage/sheet intersections**, **zero horizontal document scroll**, and **no obstructed five-dock centre hit tests when the dock is visible**. The Edit dock is intentionally off-screen and inert and is not falsely counted as a failed visible target. No manifest errors or warnings were reported.

| CSS viewport (both themes) | Original screenshot cases | Smallest measured `#preview` (CSS px), any sampled state |
| --- | ---: | --- |
| 360×740 | 14 | 113.16 × 245.17 |
| 412×892 | 14 | 153.84 × 333.33 |
| 499×892 | 14 | 153.84 × 333.33 |
| 500×892 | 14 | 153.84 × 333.33 |

This is the rendered **canvas size**, not a claim about artwork density, legibility under magnification or a minimum requirement for every conditional state. The smallest previews occur in empty Explore/Saved where the gallery intentionally takes space. These measurements specifically distinguish supported portrait from the known historical **600×360 zero-canvas landscape** issue, which is still unfixed but out of scope for release blocking.

## Observations in supported portrait widths

| Source surface | Bounded screenshot observation | What this does **not** prove |
| --- | --- | --- |
| Studio | Complete artwork frame remains in its stage at 360, 412, 499 and 500 across cream/dark. The five labelled dock destinations remain on the bottom row. | Native phone insets and physical pinch/zoom; all possible artwork seeds and themes |
| Material Finish 1 | Two-row compact rotation presentation at 360 remains inside the existing editor panel and retains the original five shortcuts and numeric field. The first 499/500 CSS breakpoint does not visibly drop a control. | Every later Material layer, actual 44px pointer-target geometry, lock/disabled/typed-angle semantics or user font enlargement |
| Interior Elements | Existing Elements controls and Add affordance are visibly present in the tool card. Empty-state guidance remains readable in both themes on the reviewed pictures. | Populated multi-element stacks, colour targets and drag/reorder/focus interactions |
| Explore and Saved empty states | Both distinct headings and explanatory hints are visually present; their independently named destinations have visible dock selection. Neither state presents an empty, indistinguishable panel. | Async populated-gallery loading, long favourites lists, storage failures or repeated navigation |
| More | Group heading, seed and top-level actions appear with a visible dismiss and dock route. The panel is deliberately vertically constrained. | **Below-the-fold More controls are not qualified by a single screenshot**; source scroll, keyboard focus and native downloads require separate interaction tests |
| Draw | Original Draw controls are visible beside the source preview, with a separate edit sheet and reachable-looking Apply/Cancel footer. | An enabled Apply state, anchor interpretation, imported complex SVGs or physical touch insertion |

The 499→500 transition was inspected on both themes for all seven states. There was no obvious catastrophic jump, missing destination or preview/tray collision **in these sampled pictures**. That statement is an optical observation only, not a substitute for [measured source-geometry results](https://github.com/gamesbyian/wallgen/actions/runs/39408395746) or an unrestricted acceptance verdict. Image contact sheets were only a viewing aid and were **not** substituted for the original screenshots in any repo source file.

## Remaining independent visual approval

This review does **not** close unchecked master entry 6. Still independently inspect **320px portrait**, the 790/791px desktop transition, ordinary 1024/1280 desktop, full named-tool and conditional-state inventory, real Android font scaling/safe-area behaviour, and the final visual hierarchy with human approval. The 156-editor-card atlas, 24 implementation plates, and 68-icon fixture are separate complementary evidence, not a blanket aesthetic pass. The known [600×360 landscape limitation #301](https://github.com/gamesbyian/wallgen/issues/301) remains honest but non-blocking under the [portrait-first support policy](PORTRAIT-FIRST-RESPONSIVE-SCOPE-2026-10-20.md).

Screenshots were captured at this **specific source commit**, not necessarily today's moving `main`; rerun the profile audit after substantive CSS changes. No user preference for unapproved icons or a new layout was inferred.
