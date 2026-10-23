# Current-art curved reconstruction: production findings (23 October 2026)

**Evidence category:** Genuine current production-renderer artwork, measurement and actual reviewed source/result image pairs. **Not physical Pixel 6 Pro validation or original source-settings recovery.**

## Reproduction

One-off opt-in GitHub Actions [run #39936947767](https://github.com/gamesbyian/wallgen/actions/runs/39936947767) rendered the existing R0 fixture cases 03 Wave, 04 Jagged, 05 Hairpin and 06 Loop at **480×1040** using the original `scripts/render-headless.mjs` painter, verified source PNG embedded recipes and created IDAT-identical metadata-free copies. `scripts/evaluate-reconstruction-r0.mjs` then fitted **blind** canonical candidates, never referencing the true source recipe before the ranking. The artifact **`reconstruction-curve-evidence-4`** retains original/current PNGs, anonymous twins, actual source versus best-fit previews, truth JSON, `evaluation.json` and `evaluation.html` (short retention).

**The actual downloaded PNGs were visually inspected side by side at ~220×478 display size for each artwork on 23 October**, not merely inferred from success logs.

| Source | Previous R0 candidate error ↓ | Current score ↓ | Best editable geometry | Truth render floor ↓ |
| --- | ---: | ---: | --- | ---: |
| Horizontal Wave | 0.206789 | **0.206789** | Drawn centreline | 0.008732 |
| Diagonal Jagged | 0.263117 | **0.263622** | Drawn centreline | 0.010704 |
| U-turn Hairpin | 0.215746 | **0.107867** | Hairpin after 10 real-render fitting trials | 0.023054 |
| Circular Loop | 0.053835 | **0.053835** | Procedural Loop | 0.025147 |

**Direct visual observations:**

- **Wave:** source shows seven *separate*, broad, slightly undulating horizontal stripes with large black gaps across almost the whole width. The selected Draw candidate collapses them into a narrow, tightly grouped rainbow near the middle. The proposed first-pass procedural Wave itself scored **0.3153** before refinement; it did not beat the old Draw candidate. This is a substantial appearance failure, not a successful mode reconstruction.
- **Jagged:** source has seven broad diagonal ribbons with angular bends and negative-space gaps. The selected Draw candidate is a thin, mostly straight diagonal bundle. Proposed editable Jagged scored **0.2804** before refinement versus selected Draw **0.2636**. The minor numeric regression of ~0.0005 compared with baseline is recorded, **not** interpreted as progress.
- **Hairpin:** the source contains seven distinct U-turn bands with a compact turnaround; fitted Hairpin visibly preserves the U topology and much of the direction, but blends stripes more than the source and bends their departure differently. The measured error fell by **50%** with genuinely editable Hairpin semantics. Not a pixel-exact recovery.
- **Loop:** existing best procedural loop preserves broad layout and ring topology. Differences remain in edge definition, ring separation/colour and centre shape; its score was unchanged and the existing winning candidate remained selected.

## Code outcome and constraints

PR #600 introduced a **small source-contour curvature signal** based on the already shared Image Path extractor, optional canonical Wave/Jagged/Hairpin alternatives and parameter refinement using the same renderer and cooperative frame scheduler from PR #597. To ensure a six-render search has one independently editable structure per geometry before redundant rotations/spreads, it added deterministic candidate diversity. The best measured reconstruction remains eligible even if a richer procedural hypothesis loses. Source pixels are not saved or sent to a backend. The optional output recipe provenance now correctly preserves the actual inferred `wave`, `jagged` or `hairpin` candidate kind without claiming recovered original settings.

The temporary browser workflow was removed before integration; only `npm run check:quick` is retained on PRs.

## Next focused artistic/structural work

The two most visible failures share **insufficient multi-ribbon spacing, width and accurate negative-space coverage**, not primarily missing palette names. Improve estimation of seven individual hue-region centre distances, stripe thickness and compositional orientation in `src/image-path.js`, and constrain procedural candidate spacing from those descriptors. Re-evaluate the *same real PNGs*, including per-hue coverage and silhouette/edge quality, before changing fit-score weights. Current candidate scoring should remain comparable until there is measured evidence supporting a new metric. Don't compensate by building a second rasterizer or permanently increasing the mobile fit/render budget.

Owner-supplied or suitably licensed external graphics and physical phone scrolling/touch/export/Undo still have **no demonstrated acceptance evidence**. The source truth controls shown in R0 reports were read **after inference**; no historical seed claim is warranted.

## Full candidate preview investigation (23 October, follow-up R0)

Opt-in all-six-candidate evidence [run #39937813358](https://github.com/gamesbyian/wallgen/actions/runs/39937813358), archived in `reconstruction-wave-jagged-all-candidates`, used genuine production PNGs for `03-wave` and `04-jagged`. The resulting 96×208 source/alternative PNGs were **downloaded and visually inspected side by side** (not merely scored). The one-off workflow was deleted; the useful diagnostic CLI `node scripts/evaluate-reconstruction-r0.mjs --dir <baseline> --alternatives` remains opt-in and does not run in routine CI.

**Wave:** Actual proposed procedural `wave` candidate renders seven recognizably separate horizontal flowing bands, much closer in **geometry** than the winning generic Draw hairline. It is vertically misplaced, with larger pigmented coverage and mismatched stripe-to-stripe separation: quantitative pixel errors were Draw .20679, straight .23955/.25765, procedural Wave **.31531**, Jagged .32627 and Hairpin .33054. Colour occupancy at the fixed 96×208 frame (saturation >45, brightness >75) was source ~.32, Draw ~.05, Wave ~.45. These estimates are diagnostics, not revised scoring. The scorer correctly ranks spatial errors but **initial ranking conceals a promising, unoptimized procedural alternative**.

**Jagged:** Actual procedural `jagged` renders recognizably broad, separated, angled, slightly broken ribbon bands, closer in shape than a narrow diagonal drawn hairline, but relative placement, turns and separation differ. Quantitative errors: Draw .26362, principal-axis Straight .27439, procedural Jagged **.28036**, Wave .29489, Loop .35021, Hairpin .38053. Colour occupancy source ~.42 versus Draw ~.05, Jagged ~.56. Distinct structural quality and current low-res pixel error are **different measurements**; neither can be silently relabelled as full recovery.

**Critical next R3 issue:** The current fitter runs ten bounded renderer trials **only on the top initial candidate**. For Wave/Jagged the top is a Draw path and receives *zero useful procedural refinements*. Test choosing one structurally credible runner-up (prefer extracted curvature) for the **same single ten-render budget**, optimizing frame translation / spread / thickness first, comparing its improved error to the untouched original leader; never fit every hypothesis or block the mobile UI. Validate on the exact 03/04 PNGs, with 05 Hairpin, 06 Loop, diagonal and circles regression checks and ordinary independent UI cancellation tests.


## Integrated safe-Draw plus one procedural challenger (23 October)

**Observed evidence:** [one-off genuine-current-renderer Chromium run #39939268860](https://github.com/gamesbyian/wallgen/actions/runs/39939268860), four 480×1040 production PNGs, metadata-free IDAT-identical copies, separate original recipe truth and all six actual candidate raster previews. Candidate fitting remained blind to truth until after ranking. The PNG artifact **`reconstruction-integrated-proven-four`** was downloaded; source/best-fit pairs were visually opened and compared in a contact sheet, not accepted solely by numerical tests.

| Source | Best canonical recipe | Before #600 | Post-#600 or #602 | Final integration ↓ | Current source-recipe render floor ↓ |
| --- | --- | ---: | ---: | ---: | ---: |
| Straight diagonal | `paths/straight` 24° | .284078 | .148254 (accidental rotation-budget regression) | **.085835** (restored original verified #589) | .008790 |
| Gentle seven-ribbon Wave | `paths/wave` | .206789 | .206789 | **.204330** | .008732 |
| Angular seven-ribbon Jagged | `paths/jagged` | .263117 | .251729 (expanded safe Draw in #602) | **.204590** | .010704 |
| Coloured U-turn Hairpin | `paths/hairpin` | .215746 | .107867 | **.107867** | .023054 |

The deliberately **single** ≤10-render parameter-refinement budget is reassigned to one credible Wave/Jagged/Hairpin candidate when a narrow generic Draw initially wins with poor error. The canonical 6-candidate budget is unchanged; this integration preserves #602 conservative and opt-in expanded Draw alternatives and restores all three significant principal-axis diagonal angles, the Jagged structural alternative and both available Draw alternatives within six. The same selection function powers cancellable browser fitting and synchronous opt-in R0 evidence.

**Visual inspection:** Diagonal source has black gaps between seven adjacent diagonally oriented bands; fitted diagonal has largely contiguous colour, so width/separation remain wrong despite correct overall angle. Wave candidate now draws wide independently coloured, slightly wavy horizontal bands instead of one hairline, but the upper stripe is clipped and gaps/phase differ. Jagged now paints broad separated angled ribbons like the source, with imperfect bend and end alignment. Hairpin U topology is recognizable but its rainbow lanes blend together more and bend more gently than the source. No case is asserted to be pixel-identical, author-approved, or physically validated on Pixel.

**Next:** infer per-colour band centre distances and thickness from the already shared import descriptors; preserve pigment-specific negative-space gaps and improve stripe contour/turn calibration with the same forward renderer. Source-preserving provenance, Undo, locks, save/metadata round-trip, pointer feedback and actual Pixel memory/touch remain tracked separately under #557. The one-off browser workflow was removed before merge.


## Measured seven-pigment ribbon spacing and thickness (23 October)

**Actual current-renderer verification:** [final five-source Chromium run #39941056985](https://github.com/gamesbyian/wallgen/actions/runs/39941056985), cases 02 Diagonal, 03 Wave, 04 Jagged, 05 Hairpin and 11 Scattered circles. Generated current 480×1040 PNGs and retained IDAT-identical metadata-free copies, genuine truth recipe sidecars, blind fitted current canonical recipes, and all six candidate previews. The original source PNGs and fitted output were visually compared, as were diagnostic source hue regions. Ordinary quick CI passed separately. **No physical Pixel device evaluation**.

The shared connected-component hue extractor now exposes each already-computed pigment's **major/minor standard deviations**. Without rescanning image pixels, coherent elongated seven-pigment components reveal source ribbon centre distances and thickness using the area divided by longitudinal extent. At 277×600 analysis size, the reviewed genuine Wave source measured approximately **65.5 px gap and 27.7 px pigment width**, and Jagged approximately **45.4 px gap measured perpendicular to its -42° axes and 29.0 px pigment width**. The algorithm converts this evidence via the existing image-to-design placement and algebraically inverts the **current canonical** `resolveScene` spread/width equations; it does not create a new rasterizer or claim original source settings.

**Cross-validated output:**

| Case | Previous best | Final best ↓ | Status |
| --- | ---: | ---: | --- |
| Jagged | .204590 | **.165655** | Further 19.0% error reduction; recognizably thicker separated diagonal pigments on the actual preview |
| Wave | .204330 | **.204330** | Hold prior recipe; applying physical width seed blindly worsened it, so the new start is gated to observed oblique hue axes |
| Diagonal straight | .085835 | **.085835** | Third proven axis-angle source control preserved |
| Hairpin | .107867 | **.107867** | Previously recovered U topology preserved |
| Scattered circles | .008329 | **.008329** | No false classification as parallel ribbons |

A preliminary full application of the measured starting guesses gave Jagged **.165655** but regressed Wave to **.206789**. A later contour-kind conditional accidentally removed Jagged's advantage because image-path contour labels can misidentify coherent angled ribbons. Final selection keys off the actual measured hue **axis angle** (oblique 12–78°, seven consistent components), and a repeated five-PNG study verified both the Jagged improvement and exact Wave restoration. These are genuine pixel/coverage scores with unchanged scoring and fit budget, not human perceptual success percentages. Inferred provenance remains honestly labelled; no input PNG is modified in the product.

**Open:** explicit centreline phase matching, individual ribbon gap and edge microgeometry at actual-phone output, Wave vertical displacement and wave phase, source overlaps/missing hues, new materials and arbitrary external media. Region widths are trustworthy on *strong, separate, elongated pigments*, not on loops, partially occluded source photos, or unrelated circles. Width/span estimates outside current canonical parameter range are refused. Keep R0 evidence optional and don't retain screenshot CI.


## Full-width Wave recovered through measured physical geometry + rigid hue alignment (23 October)

**Source-backed acceptance:** [one-off five-current-PNG run #39942638256](https://github.com/gamesbyian/wallgen/actions/runs/39942638256), artifact `reconstruction-wave-alignment-5` (short-lived). The actual 480×1040 source PNGs, metadata-free IDAT-identical copies, 96×208 current-renderer approximations and every candidate were produced blind, retained temporarily, downloaded and **visually opened side by side**. The submitted source was generated by ROYGBIV and its authentic truth recipe was read **only after fitting**. Actual Pixel 6 Pro performance, direct external-art success and human/user approval are not asserted.

The old Wave initial candidate was not just displaced: it also had a different colour-to-colour separation. Initial attempts to seed source-measured spacing alone worsened the selection. The 96×208 source/current-renderer raster inspection established a common offset of **−7.35%** for every hue after seeding measured ribbon spacing and thickness. The original, uncalibrated procedural Wave had varying per-hue offsets, so a rigid-registration hypothesis was appropriately refused. The full correction uses the same shared `extractImageColourRegions`, requires all seven matching pigments and a ≤4 percentage-point spread in their displacements, then gives one precisely estimated integer `positionY` trial precedence over speculative alternatives. It does **not** add a new renderer, work across a source image in the background, alter input bytes, or increase the ≤6 initial + ≤10 fit renderer budget.

**Final exact current-art results** (lower is better, same metric and 96×208 comparison):

| Source | Before registration | Verified result | Notes |
| --- | ---: | ---: | --- |
| Seven separated Wave ribbons | .20432967 | **.04614442** | 77.4% error reduction, editable `paths/wave`, `positionY=-7`, coherent source/render pigment alignment |
| Jagged | .16565524 | **.16565524** | Existing hue-thickness/spacing recovery intact |
| Diagonal straight | .08583479 | **.08583479** | Source-proven third principal-axis angle intact |
| Hairpin | .10786670 | **.10786670** | Previous U-turn remains |
| Seven scattered circles | .00832891 | **.00832891** | No false ribbon classifier |

Actual visual review shows the fitted Wave now paints seven broad, clearly separated horizontal pigments in the right vertical region, with approximately the correct gap and overall ribbon width rather than a thin centreline. **Remaining differences** include the exact wave phase, amplitudes/edge stepping, each ribbon's subtle longitudinal alignment and source-specific colour. Jagged remains recognizably similar but not pixel-identical. Exact original seed/geometry controls are **not** recovered from pixels.

The first isolated centroid-registration version made no real improvement: although the code could detect seven coherent hues in a source-relative frame, only a competing lower-initial-error Jagged candidate received the ten-render fit budget. The final implementation prioritizes a measured seven-hue coherent Wave translation within the same single budget, and still judges the final candidate using actual painter pixels. The final run verified the result and its four independent controls. The temporary Chromium evidence workflow was removed before merge; only normal lean quick CI remains.

**Next:** improve precise wave contour phase/amplitude, Jagged angular end caps, multicolour occlusion and region-layer disambiguation; validate with owner-provided/licensed arbitrary images and a real Pixel phone, retaining the current early-development canonical recipe policy.


## 23 October: bounded Wave contour-depth/frequency fit with six genuine sources

[Opt-in current-renderer six-image study #40017482324](https://github.com/gamesbyian/wallgen/actions/runs/40017482324) generated authentic 480×1040 ROYGBIV image/recipe pairs, stripped metadata only on IDAT-identical blind evaluation inputs, and scored normal canonical real-render candidates at 96×208. Short-lived artifact `wave-contour-amplitude-six-current-pngs` contains source/selected raster previews, all six alternatives, source PNGs and ground-truth recipe sidecars. The source and new best Wave preview were **downloaded and visually compared** side by side with the previous actual-R0 best from run #39942638256.

The fitter previously devoted four post-position trials to stripe width and two to spacing, even after `#605`/#606 directly estimated those from seven colour regions and rigid registered Y. [PR #611](https://github.com/gamesbyian/wallgen/pull/611) keeps **exactly** the same six initial candidates plus **≤10** actual-render refinement trials, but uses four registered Y position trials, two `shapeDepth` trials, two `shapeFrequency` trials and two `stripeWidth` trials for procedural Wave. The same canonical lock resolver protects every trial; synchronous R0 and cooperative portrait UI share the single generator. No new model, renderer, source-image retention or mobile render allocation.

| Genuine source | Previous measured ↓ | New measured ↓ | Result |
| --- | ---: | ---: | --- |
| 03 Wave | **.04614442** | **.04121536** | 10.7% lower colour/coverage pixel error; remains `paths/wave` |
| 01 Vertical Straight | .05414624 | .05414624 | No change |
| 02 Diagonal Straight | .08583479 | .08583479 | No change |
| 04 Jagged | .16565524 | .16565524 | No change |
| 05 Hairpin | .10786670 | .10786670 | No change |
| 11 Scattered circles | .00832891 | .00832891 | No change |

**Actual visual nuance:** newly inferred Wave bands are somewhat **flatter** than the genuine current-art source, even though they score more accurately overall than the previous, over-oscillating candidate. Seven-colour order, broad thickness, spacing and background negative-space positions are close. Fine source-specific phase, individual colour contours and gradients still differ. Do **not** interpret the 10.7% numerical improvement as recovered authoring settings, a human aesthetic preference result, or acceptance on a physical Pixel. The true current recipe's render error remains near .00873 under this downsampled comparison.

A prior pure test incorrectly assumed that a Wave with `position`, `spread` and `stripeWidth` locked had **zero** editable parameters. New optional depth/frequency trials can legally update them. The all-locked zero-render test was corrected to include both controls, while an independent partially-locked Wave test proves legal contour fitting and identical sync/async results. One-off Chromium workflow removed before merge. Any further contour tuning should verify multiple independent seeds and genuinely new external sample shapes instead of overfitting this one source.
