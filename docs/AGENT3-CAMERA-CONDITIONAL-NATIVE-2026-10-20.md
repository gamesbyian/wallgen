# Agent 3 conditional camera/native exports: 12-mode census

**Owner:** Agent 3; phase-2 follow-up after [merged PR #267](https://github.com/gamesbyian/wallgen/pull/267). **Starting main:** `07ab5baed31295b3756075ad754b9e4c6cb42e48`. Does not edit rendering source or the other agent lanes.

**Acceptance being advanced:** unchecked camera and exported-wallpaper line in `docs/UI-REDESIGN-IMPLEMENTATION-QUEUE.md`.

## Scope and risks

All three source structures are enumerated, not represented by a handpicked pinwheel/voronoi-only example:

| Structure | Condition modes | Real UI actions per mode | Native check |
| --- | --- | --- | --- |
| Paths | Wave + manually authored Drawn off-frame | Real Zoom out 80→70, Zoom in 70→80, Fit →100 and pan zero | Download button → actual 3024×6552 PNG, exact embedded recipe, stable foreground/source parity |
| Radial | Sunburst, Starburst, Pinwheel, Spokes, Concentric | Same three controls, with existing nudge nonzero | Same |
| Regions | Voronoi, Organic, Facets, Blocks, Nested | Same three controls | Same |

The twelve variants are distributed across **three independent four-case jobs**, `matrix.shard=0,1,2`, so errors do not hide behind unrelated long-running browser suites. All existing controls and renderer semantics are left unchanged.

For every case, the browser must prove Zoom and Fit change only the five intended camera fields, leave authored path, composition, material and inactive settings alone, maintain the exact scene geometry, align the 600×1300 and 3024×6552 world camera bounds, export through actual mobile Download and decode an exact normalized PNG recipe. Stable source foreground pixels must compare within the pre-existing renderer/native thresholds. Results contain SHA-256, sampled foreground counts and screenshots. This *complements* the merged eight-file native suite, multiple camera pan/More Chrome journeys, and all existing source-geometry invariance tests.

## Acceptance disposition

The condition-matrix CI has not yet run at document creation. **Do not check acceptance #5 until every shard actually passes and any missing UI/conditional export contracts are adjudicated.**

A 12-mode census still does not assert all simultaneous combinations of materials, texture layers, motifs, backgrounds, construction, decorations, animations or batch exports. The queue's original wording says **every structure and applicable conditional export**, so those wider permutations and physical Android hardware must be clearly distinguished from this finite active-mode census. Human Focus evaluation remains unchecked and is not part of these tests.
