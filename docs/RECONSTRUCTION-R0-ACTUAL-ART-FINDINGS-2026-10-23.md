# R0 actual-current-art reconstruction: measured findings (23 October 2026)

**Evidence class: real Chromium production-rendered PNGs and measured pixels; NOT human visual approval or physical Pixel 6 Pro observation.** Run [#39924582158](https://github.com/gamesbyian/wallgen/actions/runs/39924582158) used a **temporary PR-only browser job, since removed**. Source commit `797cfc7fa5540e7d33b1aa38880c7e59dce24c50`; 13 current normalized recipes from `scripts/review-reconstruction.mjs`, each 480×1040 through unchanged `scripts/render-headless.mjs`. PNG metadata-bearing originals, IDAT-identical metadata-free copies, per-image canonical truth JSON, a local gallery, machine-readable `evaluation.json`, and small before/after preview PNGs are archived in artifact **`reconstruction-r0-observed-13`**. Script checks exact source embedded recipe and unchanged PNG image chunks. All candidate creation was blind to recipe truth; source truth was read after fitting.

The evaluator decoded each metadata-free source in Chromium, bounded import analysis to a 600-pixel long side, generated up to six ordinary normalized current recipes, rendered each via real `drawWallpaper` at 96×208, compared full colour and negative-space coverage, and optionally tested ten further true renders for straight/loop position and geometry refinement. Source PNG downsampling is not mathematically identical to a fresh 96×208 direct render, so the **true source-recipe render error** is a useful floor. No seed recovery, historic algorithm replay, model-assisted fabrication, source-image mutation or cloud upload is claimed.

| Current source | Best inferred structure / mode | Candidate error ↓ | True recipe at 96×208 ↓ | Takeaway |
| --- | --- | ---: | ---: | --- |
| Vertical straight | paths / straight | 0.15743 | 0.01671 | Correct topology; substantial width/offset mismatch |
| Diagonal straight | regions / scattered circles | 0.28408 | 0.00879 | Serious false circle classification |
| Wave | paths / drawn | 0.20679 | 0.00873 | Generic contour insufficient |
| Jagged | paths / drawn | 0.26312 | 0.01070 | Jagged structure missing |
| Hairpin | paths / drawn | 0.21575 | 0.02305 | Hairpin structure missing |
| Loop | paths / loop | 0.05383 | 0.02515 | Strong gain after procedural topology + ten real-render fit samples |
| Drawn | paths / drawn | 0.04581 | 0.01937 | Useful partial recovery |
| Radial rays | paths / drawn | 0.37294 | 0.02313 | Radial shape classification absent |
| Radial rings | paths / drawn | 0.58121 | 0.04974 | Radial topology absent |
| Nested regions | paths / loop | 0.29038 | 0.00542 | Region topology absent; false loop candidate |
| Seven scattered circles | regions / scattered | 0.00833 | 0.00450 | Visually close current canonical object placement |
| Textured embroidered loop | paths / loop | 0.08814 | 0.01358 | Topology plausible; material/stitches intentionally not inferred |
| Holed compound silhouette | regions / imported compound | 0.00265 | 0.00195 | Geometric outline, hole and detached island portable; almost floor error |

**Progression controlled on the exact same first four PNG cases:**
- Initial #556 candidate: vertical 0.21195, loop 0.26626, seven circles 0.00833, compound 0.03014.
- Morphology-guided structural candidates: vertical 0.18031, loop 0.14835, circles 0.00833, compound 0.00265.
- Bounded forward-fit adjustment: vertical **0.15743**, loop **0.05383**; circle and compound already close enough to skip refinement.

**What this actually supports:** Existing canonical scattered circles and imported compound shapes can recover useful editable appearance without original metadata. Procedural loops are recoverable with a bounded real-render fit pass. Broad full-scene reconstruction is **not accomplished**: diagonal orientation, multi-band wave/jagged/hairpin, radial, nested regions and organic finishes still have large representation/classification errors. Scores are comparative raster distances, **not** a perceptual realism metric, appearance certificate or recovery of original control values. Actual visual inspection of the preserved contact gallery and external permitted geometric images remain work in [#557](https://github.com/gamesbyian/wallgen/issues/557).

**Next executable experiment:** Add *measured, source-backed* structural classification for diagonal bands, radiating wedge fans and concentric rings. Use only current `STRUCTURES`, `RADIAL_MODES`, `REGION_MODES`, `resolveScene` and `drawWallpaper`, then run selected original cases against this exact baseline. Include a score improvement before revising editor UX. On actual phone, verify total fit time, memory, correct lock/Undo transaction and the visible preview comparison. Finish truthful inferred-recipe provenance separately. Do not reinstall permanent screenshot CI or re-run R0 simply because an agent changed a comment.

## Targeted radial/diagonal follow-through (23 October)

[Run #39925723314](https://github.com/gamesbyian/wallgen/actions/runs/39925723314), source branch `agent/reconstruction-structural-radial-diagonal-20261023`, generated four more genuine current-PNG comparisons (diagonal straight, radial rays, concentric rings, nested regions). The temporary Chromium workflow was removed on its branch and is not part of the clean integration PR. Blind candidate synthesis and renderer-based fitting produced:

| Case | Previous R0 score | New score | Recovered candidate |
| --- | ---: | ---: | --- |
| Diagonal straight | 0.28408 | 0.28408 | False seven circles; **unresolved** |
| Radial wedges | 0.37294 | **0.04298** | Procedural radial, 21 wedges with angular fitting |
| Concentric rings | 0.58121 | **0.10091** | Procedural concentric, 21 rings with centre fitting |
| Nested regions | 0.29038 | **0.01195** | 14 concentric canonical regions, presented as radial mode |

The last nested/radial choice is inherently ambiguous: same centre/count and shape painter can yield **identical image pixels** for `regions:nested` and `radial:concentric`, so appearance fit cannot authenticate the source setting. The image's recipe truth was consulted only after candidate selection. Physical visual inspection of the artifact and Pixel memory/timing remain unverified. The diagonal case still needs a colour-edge principal-direction descriptor because disconnected hue centroids fail to produce a credible oblique candidate. Avoid claiming the diagonal lane is fixed.


## 23 Oct follow-up: genuinely measured Vertical Straight width and offset

[One-off genuine current PNG run #40015324666](https://github.com/gamesbyian/wallgen/actions/runs/40015324666) rendered five authentic 480×1040 sources and inferred recipes **without reading any source truth until after ranking**. Source bitmap data was preserved in IDAT-identical metadata-free inputs. Short-lived artifact `vertical-stripe-source-register-five` includes all actual source/fit PNGs, candidate gallery, JSON results and truth sidecars. The 01-Vertical source/best-fit PNG previews were downloaded and **visually compared side by side**; there is no claimed original seed retrieval or physical Pixel approval.

| Current art | Previous verified error ↓ | New measured error ↓ | Geometry |
| --- | ---: | ---: | --- |
| 01 Vertical Straight | .15743 | **.05414624** | Editable `paths/straight` |
| 02 Diagonal Straight | .08583479 | **.08583479** | Unchanged third-angle success |
| 03 Wave | .04614442 | **.04614442** | Unchanged source width and rigid Y registration |
| 04 Jagged | .16565524 | **.16565524** | Unchanged measured oblique thickness |
| 11 Scattered circles | .00832891 | **.00832891** | Unchanged seven editable objects |

**Mechanism:** for clean seven-band vertical sources, reuse the existing hue connected-component covariance, axis angles and pigment areas in `image-path.js` and the same algebraic current `resolveScene` inverse introduced for Jagged/Wave in #605. Prepend ONE measured Straight candidate before existing spread fallbacks. Generalize #606's already shared seven-colour image-centroid registration to X for this *vertical Straight only* (the Wave Y path is unchanged). Both ordinary synchronous R0 scoring and cooperative cancellable browser fitting use the same actual-renderer trials, with **no increase** over ≤6 initial + ≤10 refinement renders, and #609's composite Position lock prevents uncommittable movements.

**Actual appearance:** the recovered seven bands now occupy nearly the same horizontal positions and comparable widths as the authentic Vertical source. Some stripe thickness and black gaps remain slightly different, so the actual painter error .0541 still exceeds the true recipe's .01671 floor. The colour sequence/topology remains correct, and the prior .1574 under-width/offset artifact is substantially reduced. The same exact real-image comparator and baseline were used. No arbitrary external image, human preference or physical-phone performance acceptance follows from this. The temporary Chromium workflow was removed before merge; do not add it to routine CI.
