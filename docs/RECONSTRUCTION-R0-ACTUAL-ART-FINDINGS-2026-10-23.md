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
