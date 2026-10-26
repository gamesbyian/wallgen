# Compact missing-middle pigment: representability refusal

**Owner:** [issue #557](https://github.com/gamesbyian/wallgen/issues/557) · **Research and focused change:** [PR #734](https://github.com/gamesbyian/wallgen/pull/734) · **Baseline real Chromium painter:** [#40253188360](https://github.com/gamesbyian/wallgen/actions/runs/40253188360) · **After real Chromium painter:** [#40253400722](https://github.com/gamesbyian/wallgen/actions/runs/40253400722).

## Reproduced source failure and concrete model bound

Four metadata-free, independently authored Canvas2D 480×1040 artworks were added only to the explicit offline source-study generator. They contain no original ROYGBIV recipe, hidden seed, source painter parameters, or claim of creator approval. Two show three/five separate polygons in **gapped** semantic ROYGBIV slots `[0,3,4]` (red, green, blue) or `[0,1,3,4,6]` (red, orange, green, blue, violet). Two are truthfully representable **contiguous first-N** controls `[0,1,2]` and `[0,1,2,3,4]`. This separates the semantic colour question from nonrepresentable external materials or poor hue classification.

The original source analyser **correctly classified all three or five** semantic hue regions. Nevertheless the normal six-candidate current canonical painter returned a **tiny rainbow procedural path** where the source contains separate coloured polygons. Native best errors `0.06289190155227467` and `0.09216776253769228` appeared superficially modest because almost all other pixels are black. The source and prior fitted PNGs were directly opened and visually inspected: all real polygon shapes vanished. This is a concrete incorrect **shape and colour reconstruction**, not merely a lower-fidelity circle approximation.

The current canonical scattered painter emits semantic slots `0..N-1` for `scatteredCount=N`. Choosing N=3 for `[0,3,4]` paints red/orange/yellow, not red/green/blue. Manufacturing extra off-frame orange/yellow objects to address the missing gap would invent unseen source pigments and an unverifiable creator history. A seven-stripe path cannot stand in for disjoint three/five polygon regions. **Automatic inference must refuse** this specifically evidenced unrepresentable compact source class. Manual shape extraction remains separately available.

## Minimal production change

The existing `describeReconstructionImage` already measured one compact significant source component per hue, bounded source area, connected-region fill ratio, aspect and consistent non-diagonal axes for partial scenes. Factor those *identical* checks into `compactPartialRegions`; keep the previous validated `incompleteColourRegions` when every source index is exactly `0..N-1`. Expose `unsupportedCompactHueGaps` only when the compact checks pass but there is a missing semantic colour slot. At the beginning of `reconstructionCandidates`, refuse that exact class with `[]`, reusing the accepted one/two missing-slot refusal from merged #726. No different hue classifier, new scene, remapping of colours, fake invisible objects, alternative rasterizer, extra renderer invocation, locks/Undo/worker/export changes, or image mutation.

Do not extend the refusal to arbitrary long bands, incomplete cropped procedural paths, radial structures, textured/source-ambiguous pigment, or sources without measured compact independent islands. The current original seed, invisible layer order and historical procedures remain unknown.

## Source-first optical acceptance and no regressions

| Independent artwork | Baseline source-blind real painter | After this fix | Observed outcome |
| --- | --- | --- | --- |
| `gapped-red-green-blue` (slots 0,3,4) | Procedural `path`, 0.062891901552, 6 normal paints | **0 candidates** | Refuses false squiggle and counterfeit orange/yellow |
| `gapped-five-colours` (0,1,3,4,6) | Procedural `path`, 0.092167762538, 6 paints | **0 candidates** | Refuses invented yellow/indigo, source PNG retained |
| `leading-three-control` (0,1,2) | `regions`, 0.030102379493 | **exact same** | Three individually editable real hue objects |
| `leading-five-control` (0,1,2,3,4) | `regions`, 0.036677507541 | **exact same** | Five editable hue objects and all original source pixels |

**Both optical runs succeeded**, including source manifest/independent truth checks. All four original source PNG bytes are identical baseline vs after, and the two contiguous reconstructed PNGs and candidate scores are unchanged. The two gapped formerly generated erroneous fitted PNGs are deliberately **absent** after the fix. This is a faithfulness **refusal**, so there is no artificially claimed error percentage improvement; `null` candidate/error means *no faithful automatic candidate*.

Independently check all **22 native current-renderer R0 images** with the same actual Chromium painter in [#40253400722](https://github.com/gamesbyian/wallgen/actions/runs/40253400722): **22/22 exact winning kind+error identity** against accepted #726 optical baseline and **106/106 common native source/fit/comparator PNGs byte-identical**. Hairpin/Loop/Jagged/occlusion/one-to-seven native controls are not rearranged by this source-only semantic guard. Existing first-one/two sparse refusal remains. Normal six initial paints and ten refinement paints are unchanged (unrepresentable input now costs zero paints). Lean unit CI passed; the temporary heavyweight PR optical trigger was removed after proof, while the four independent gapped source images remain accessible behind a **manual-only** workflow input `include_gapped_hue`.

## Residual limits and integration

Source-hidden pigment precedence and hidden geometry cannot be derived from visible pixels; mixed opaque occlusion is not solved by refusal alone. The canonical renderer cannot necessarily paint low-chroma/neutral arbitrary RGB accurately, and Hairpin/Loop negative-space fidelity remains measurably approximate even for representable seven-hue scenes. This result is browser/Linux source-art evidence, **not** real Pixel 6 Pro runtime heap, native IME/TalkBack, owner-supplied art, human creative acceptance, or authentication/recovery testing.

The missing-candidate accessible message is owned by Agent 3 #664; the importer must make clear that **some colours are missing from the canonical ordered palette, and the original pixels remain untouched**, instead of silently showing an empty panel. Merge/reconcile this after [source state #728](https://github.com/gamesbyian/wallgen/pull/728) and [partial visible shapes #731](https://github.com/gamesbyian/wallgen/pull/731), without duplicating typography #653 or Agent 3's mobile UI. Keep #557 open for other source-backed engineering limitations and owner/hardware acceptance.
