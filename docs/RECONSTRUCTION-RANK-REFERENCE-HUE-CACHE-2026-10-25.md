# Reference-frame hue metrics: one shared analysis across reconstruction candidate ranking

**Issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557) • **PR:** [#716](https://github.com/gamesbyian/wallgen/pull/716) • **Genuine 22-image check:** [current-painter GHA #40226109951](https://github.com/gamesbyian/wallgen/actions/runs/40226109951).

## Reproduced duplicate classification

The canonical reconstruction ranker scores at most six current `drawWallpaper` candidate outputs against one immutable reference 96×208 ImageData. Different candidate kinds can independently request already-written source hue registration: `coherentWaveOffsetY` for Wave, `coherentVerticalBandOffsetX` for vertical Straight, source coverage for Loop, and `measuredExpandedDrawRegistration` for unclamped Draw. Before this change, each such helper independently called `extractImageColourRegions(source,HUES)` to reclassify **the identical source frame** and rebuild the same seven component descriptors. Candidate rendered-image components remain distinct and correctly need their own fresh classification.

Furthermore, the cooperative mobile-first ranker calls `rankReconstructionCandidates([candidate],source,render)` separately between cancellation/yield checkpoints. A purely local per-call cache in synchronous rank would not prevent the duplicated source analysis across those yields.

## Narrow optimization

- `rankReconstructionCandidates` now uses a **lazy, invocation-local reference analysis**. Loop, Wave, vertical Straight and Draw source-geometry checks share that same canonical descriptor, with **one source classification at most per ranking operation**.
- A small optional `referenceCache` parameter lets `rankReconstructionCandidatesCooperatively` retain that descriptor between its per-candidate calls and existing cancellation/yield boundaries. It does not persist beyond the current cooperative invocation.
- Reusing the cache with a different **source object** invalidates it before recomputing reference masks. Nothing is stored in a global module, IndexedDB, source PNG, user's recipe, worker or output.
- The public source-versus-render registration helpers preserve the previous two-argument contract: if an optional source-region descriptor is not provided, they still use the same shared importer and reproduce legacy results. The ranking path supplies the precomputed one.
- **No score function, threshold, source classification semantics, actual rendered candidate/colour masks, candidate selection/order, lock, Undo, origin, edit gesture, renderer, or fixed six initial +ten refinement painter calls changed.**

## Acceptance

Unit checks construct a real seven-colour image, compare cached and standalone Wave/vertical-band/expanded Draw measurements, verify source-frame cache reuse and invalidation on a different frame, prove **identical synchronous versus cooperatively-yielded ranked descriptors/errors**, and verify exactly one painter call per hypothesis. The ordinary lean quick CI passed.

A separate one-shot, manual-after-proof GitHub Actions job runs the genuine 22-case metadata-free R0 corpus and compares canonical renderer output against the accepted previous #714/#715 baseline, including actual selected kinds, numerical pixel errors and opt-in research proposal results. **No performance percentage is claimed solely from code structure.** The single analysis pass saved by #714 was independently measured under one Linux Chromium runner; the current reference-cache optimization needs a separate actual browser/Pixel timing experiment before claiming time, heap or battery improvements.

[Previous source-mask reuse exact 22-source result](RECONSTRUCTION-SHARED-HUE-MASK-REUSE-2026-10-25.md) • [Five-case measured source-analysis timings](RECONSTRUCTION-SOURCE-MASK-CHROMIUM-PROFILE-2026-10-25.md) • [Current work queue](CURRENT-WORK-QUEUE-2026-10-24.md)
