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
