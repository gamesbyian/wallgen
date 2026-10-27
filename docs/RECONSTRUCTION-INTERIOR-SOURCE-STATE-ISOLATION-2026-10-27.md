# Previous Interior Elements are not evidence in independent image reconstruction

**Date:** 27 October 2026 UTC. **Owner issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557). **Fix:** [#828](https://github.com/gamesbyian/wallgen/pull/828). Builds on source-state isolation for inherited Nest outlines [#827](https://github.com/gamesbyian/wallgen/pull/827), not a different reconstruction engine.

## Reproduced source-to-painter defect

`strippedCandidateBase` and direct `observedHueShapeRecipe` previously retained an unrelated creator's active `interiorElements` stack when interpreting an independently uploaded seven-hue source image. The canonical `drawRegionInteriors` renderer legitimately draws these elements on each inferred region, producing visible *white contour decorations inside seven otherwise solid source pigments* even though the new source PNG has no such strokes. The previous scene state is not an observation of the newly imported image.

**Narrow correction:** explicitly clear `interiorElements:[]` in both source-blind candidate constructors. Existing saved/current user designs retain their normal Elements editing and render semantics. When the creator has **locked** an existing Interior Elements stack, the direct `hue-visible-shapes` candidate refuses its otherwise source-clean automatic appearance hypothesis rather than invisibly bypassing the lock or painting source-unsupported decoration. Manual image/path/shape routes remain available. No change to canonical scene, source masks, geometry, source image bytes, PNG format, text overlays, Undo, privacy, or the ≤6 initial + ≤10 refinement real-render budget.

## Independently reviewed actual artwork

[One-shot Chromium real-painter workflow #40587143084](https://github.com/gamesbyian/wallgen/actions/runs/40587143084) passed, storing unchanged independent 240×520 source PNG; clean, prior-unlocked-Elements, and explicit old-behaviour counterfactual canonical recipes plus their **real 480×1040 production-renderer PNGs**; the contact image; and report JSON in [artifact #12772413307](https://github.com/gamesbyian/wallgen/actions/runs/40587143084/artifacts/12772413307).

**Observed in viewed PNG contact sheet:** clean and contaminated-prior reconstruction now make **byte-identical encoded PNGs**, with identical full candidate recipes and no Elements stack, while manually reintroducing the prior white `contour` element changes **29,776 RGB pixels**. In the counterfactual, all seven distinct red/orange/yellow/green/blue/indigo/violet source shapes acquire prominent white inset loops, including the source-visible red hole/island. The underlying source bytes are unchanged. Every PNG contains and round-trips its own precise current normalized recipe. Tests also verify clean vs polluted *full six-candidate selection parity* for the independent source and a separate seven-source-circles case, and refuse a contradictory locked Elements stack.

**Scope:** This is a genuine modern source-visible false-render correction, not an attempt to infer original artist's hidden painter order or unknown materials. Art is independent synthetic source, not private creator art. Physical Pixel speed/thermal, Android IME/TalkBack, and human aesthetic judgement remain untested. The temporary heavy workflow is deleted after the successful optical proof; repeatable opt-in `scripts/reconstruction-interior-state-image-proof.mjs` remains available.

#557 retains only bounded independent Hairpin/Loop/canonical visible-geometry counterexamples under [finite software exit contract](RECONSTRUCTION-TYPOGRAPHY-COMPLETION-2026-10-27.md).
