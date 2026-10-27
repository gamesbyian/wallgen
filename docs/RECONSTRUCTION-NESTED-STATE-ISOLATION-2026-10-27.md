# Independent reconstruction must not inherit previously authored nested outlines

**27 October 2026 UTC** · issue [#557](https://github.com/gamesbyian/wallgen/issues/557) · qualified correction [#827](https://github.com/gamesbyian/wallgen/pull/827).

## Source-backed regression

The opt-in imported-shape Nest feature ([#817](https://github.com/gamesbyian/wallgen/pull/817)) added the optional canonical `nestedShapeContours` key. The earlier source-independent reconstruction candidate base `strippedCandidateBase` already neutralized the unrelated creator's Photo, material, palette reversal, layer order and per-slot shape overrides, but **not** the new Nest key. The independent seven visible-pigment adapter `observedHueShapeRecipe` bypassed that shared base and also inherited it.

In the real renderer, an enabled `nestedShapeContours` targeting `region-0` replaces that region object's solid hue fill with seven separately coloured offset strokes. Consequently a source image containing seven source-visible solid pigments can reconstruct a solid **red rectangle as rainbow nested lines**, solely because the *previous unrelated editor state* had Nest enabled. This silently misrepresents source evidence; no authoring intent, source recognition or painter history can justify the inherited effect.

## Narrow correction

Both `src/image-reconstruction.js` (`strippedCandidateBase`) and `src/image-hue-reconstruction.js` (`observedHueShapeRecipe`) explicitly omit stale Nest via `nestedShapeContours:undefined` **before canonical `normalizeRecipe`**. This does not disable legitimate user-created nesting on the existing artwork. It changes no renderer, visible artwork settings, source bytes, lock list, undo, private storage, reconstruction origin, PNG metadata schema or normal 6 initial + 10 refinement evaluations. No new dependencies.

Source-independent Node regressions use two existing distinct image classes: seven independent colour shapes with a source-visible red hole and detached red island, plus seven independent circles. For each, compare all full candidate kinds/recipes for otherwise identical clean vs polluted creator state, ensure no carried Nest key and exact JSON round-trip. These cases are covered by ordinary lean CI.

## Actual real-painter acceptance and reviewed PNGs

The opt-in [real Chromium run #40586500995](https://github.com/gamesbyian/wallgen/actions/runs/40586500995) passed, retaining the original 240×520 source PNG, clean reconstructed recipe, reconstructed recipe with previous Nest enabled, explicitly old-contaminated recipe, the three **480×1040 genuine renderer PNGs**, a visual contact sheet and report JSON in [artifact #12772955004](https://github.com/gamesbyian/wallgen/actions/runs/40586500995/artifacts/12772955004).

**Results:** Clean-source and previous-Nest-independent reconstructed PNGs are *encoded byte-identical*, with complete equal canonical editable recipes. The counterfactual previous behaviour changes **6,966 RGB pixels** (first changed pixel at image offset 26,443), visibly turning the original solid red first pigment and its hole into seven rainbow nested outlines while leaving six other solid pigments alone. The actual PNG contact sheet was opened and visually inspected; the incorrect red transformation is immediately obvious. Source RGBA bytes are exactly unchanged, the six-candidate initial budget remains intact, and each PNG embeds its own exact canonically round-trippable recipe.

The actual browser run measures software source-state fidelity, **not** physical Pixel 6 Pro, TalkBack, Android IME, creator-supplied image aesthetics or undocumented painter provenance. The temporary CI workflow is deleted after acceptance; the opt-in reproducible renderer proof remains in `scripts/reconstruction-nested-state-image-proof.mjs`.

## #557 disposition

This closes a demonstrable **modern feature cross-lane regression** that was inside canonical reconstruction representability. Issue #557 remains open only for the independently evidenced original Hairpin/Loop black-space/overlap fidelity or other supported source-visible cases, per its [finite exit contract](RECONSTRUCTION-TYPOGRAPHY-COMPLETION-2026-10-27.md). No new reconstruction dialect or unobservable history is inferred.
