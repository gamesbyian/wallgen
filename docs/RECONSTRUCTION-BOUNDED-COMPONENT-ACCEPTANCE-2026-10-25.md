# Bounded source-component retention: full genuine-R0 exact-artifact acceptance

**Issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557) • **Change:** [PR #717](https://github.com/gamesbyian/wallgen/pull/717) • **Approved comparator:** [#716's all-22 source-painter run #40226109951](https://github.com/gamesbyian/wallgen/actions/runs/40226109951) • **New one-shot source-painter run:** [#40228539978](https://github.com/gamesbyian/wallgen/actions/runs/40228539978).

## Reproduced bounded-memory defect

The single shared `src/image-path.js` `components()` importer always returned at most eight source components to ordinary consumers or at most seventeen to the source-visible independent-pigment adapter (sixteen plus one overflow sentinel). Previously it built and retained *every qualifying source island and its member-index array* before globally sorting and slicing those results. A sufficiently fragmented source could therefore retain many more qualifying component-member arrays temporarily than any downstream consumer ever used. The input-area cap already limited the total pixels, so this is **relative excess transient retention**, not an unbounded-memory or memory-leak allegation.

The change keeps at most the requested N qualifying island records/member arrays during one unchanged full flood-fill. Largest area wins. An explicit source scan ordinal breaks equal-area ties, reproducing the previous JavaScript stable sorting semantics including when a later larger region displaces an earlier smaller one. The general eight-component historical default and the independent hue-shape sixteen-plus-overflow policy are unchanged; the seventeenth meaningful hue island still refuses incomplete geometry. Existing segmentation, stroke contouring, scene, painter, worker/export, Undo, locks and original raw input are unchanged.

## Evidence and independent checks

1. Exact-head standard lean PR quick CI [#40228539984](https://github.com/gamesbyian/wallgen/actions/runs/40228539984) passed, including the new 225-island adversarial synthetic mask at 360×360. The test checks retention of the exact eight largest real components, stable tie ordering, deterministic repeat, no raw pixel mutation and strict refusal of 17+ source-visible pigment islands. The prior 16-accepted / 17-rejected canonical snapshot tests remain in the lean gate.
2. Independently compared the old global sort/slice against the bounded selection on **210,000 deterministic randomized synthetic arrays**, with retention N=1,2,8,17 and array lengths 0–349 with repeated/zero area values. **Zero selected-area/order differences.** This check independently tests top-N ordering, rather than a real renderer or browser's memory.
3. The one-shot **actual Chromium production-source/production-renderer** run [#40228539978](https://github.com/gamesbyian/wallgen/actions/runs/40228539978) completed successfully and performed the existing 22-case six-coarse + ten-refinement source-visible hue-shape acceptance, including full-resolution 3024×6552 image exports for representable Hairpin/Loop/displaced Jagged.
4. Downloaded the full artifact ZIP for the accepted [#716 reference run #40226109951](https://github.com/gamesbyian/wallgen/actions/runs/40226109951), artifact **12610943558**, and the #717 run, artifact **12612533041**. Enumerated and independently byte-compared **all 147 matching entries**. **147/147 exact content equality**, including genuine metadata-free sources, source/fitted/independent hue-shape RGB PNGs, embedded portable recipes and `evaluation.json`. Independently compared the evaluation object: all 22 selected kinds, floating-point scores, hue shape proposals and component-count diagnostics exact. Four representative Hairpin, Loop, displaced Jagged and Jewel source/fitted/research images have **zero pixel-channel differences between runs**; opened and visually inspected those actual pairs.
5. These source-to-fitted pairs remain *imperfect*. Hairpin #05 still loses thin inter-hue black channels and shifts the lower U/exit; Loop #06 still misses some crossing/interior ring details and black channels; displaced Jagged #16 has subtle contour/endpoint drift; Jewel #19 has source-to-fit band placement differences. Neither #717 nor #718 is claimed to improve the baseline fidelity metrics.

| Genuine source | Baseline #716 error | PR #717 error | Pixel/score change |
| --- | ---: | ---: | --- |
| 05 Hairpin | 0.03053935316113644 | 0.03053935316113644 | **Exactly zero** |
| 06 Loop | 0.03725951718828642 | 0.03725951718828642 | **Exactly zero** |
| 16 displaced Jagged | 0.013308548579688537 | 0.013308548579688537 | **Exactly zero** |
| 19 Jewel | 0.015307629462041908 | 0.015307629462041908 | **Exactly zero** |

## Scope and remaining gates

This proves **retained top-N record count and real-art output parity**. It does **not** supply a measured change in JS heap high-water mark, garbage collection, total reconstruction wall time, Pixel 6 Pro RAM/thermal/battery load or physical editor acceptance. Those require explicit separate browser/handset profiling. Code without new image classifiers, new dependencies, UI features, renderer branches or additional production painter calls. Keep true mixed opaque occlusion, invisible crossover painter order, external pigment topology and native phone/human judgement open under #557. Agent 2 typography and Agent 3 release/mobile ownership are unaffected. The temporary PR trigger added solely for #717 proof was removed before integration; the heavyweight workflow remains **manual-only**.
