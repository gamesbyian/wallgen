# Historical recipe normalizer expression-change ledger

**45 source-blob-verified main-history revisions · 16–22 October 2026.**
The [machine-readable 45-revision expression matrix](model-expression-ledger.json) contains **10 changed top-level field expressions** across **7 revisions**, beyond field additions/removals. Five [reconstructible source batches](model-expression-sources-01.json), [02](model-expression-sources-02.json), [03](model-expression-sources-03.json), [04](model-expression-sources-04.json), [05](model-expression-sources-05.json) carry the full per-commit expression dictionary and original blob SHA. The [key-membership ledger](model-key-ledger.json) remains separate. These resources were obtained from actual repository blobs, not extrapolated release names.

| Source revision (UTC) | Changed top-level expressions | Practical migration concern |
| --- | --- | --- |
| [`884281d1c5`](https://github.com/gamesbyian/wallgen/commit/884281d1c51b928ba25ab67afa059203dfc0087e) · 2026-10-17T00:56 | `textureLayer3Enabled` | Layer 3 enablement briefly depended on Layer 2; later decoupled. |
| [`c66c477dca`](https://github.com/gamesbyian/wallgen/commit/c66c477dca71ad4b1b1252333fab33228b9f5154) · 2026-10-17T23:06 | `textureLayer3Enabled` | Layer 3 enablement briefly depended on Layer 2; later decoupled. |
| [`e88b30c3ed`](https://github.com/gamesbyian/wallgen/commit/e88b30c3edf434b130b751ae855453c47755a83c) · 2026-10-18T00:57 | `stripeShadowStrength` | Shadow strength fallback changed from 45 to 0 after an enable-toggle removal. |
| [`2e6039c8d7`](https://github.com/gamesbyian/wallgen/commit/2e6039c8d7fcef85b74dfe70435ffeda03929b98) · 2026-10-18T05:58 | `version` | Envelope-era normalizer version advanced from 1 to 2. |
| [`d8f5ea5537`](https://github.com/gamesbyian/wallgen/commit/d8f5ea55373c96450f256f70c0eb1d109225acdc) · 2026-10-19T21:49 | `customPath`, `drawnAnchors`, `drawnCorners` | Drawn path now passes through an explicit pre-normalized variable. Drawn anchors now remap through path-index normalization. Drawn corners now remap through path-index normalization. |
| [`54f8299711`](https://github.com/gamesbyian/wallgen/commit/54f82997113af85e616406b1473c4c0f669faed1) · 2026-10-20T09:40 | `viewPanX`, `viewPanY` | Signed-zero normalization added to X camera pan. Signed-zero normalization added to Y camera pan. |
| [`b728568e3f`](https://github.com/gamesbyian/wallgen/commit/b728568e3f56860964b569e3b03f86a5cc8e9344) · 2026-10-20T09:47 | `interiorElements` | Interior normalization now passes through a pre-normalized variable. |

## Concrete conclusions

1. The early v1 shadow combination is **not** equivalent to using today's defaults: the original model had `stripeShadowEnabled` and a `stripeShadowStrength` default of 45; a later commit removed the flag and changed the strength fallback to 0. A conversion adapter needs a source-era shadow-state fixture.
2. The third material texture layer toggled between dependent and independent activation. Preserving a saved value is not enough without reproducing the source-era layer-activation rule.
3. Path/anchor mapping, interior normalization and camera signed-zero behavior have explicit source-expression changes. Some replace inline code with helper or precomputed variables: the expression history captures **that boundary**, but not the actual behavior inside the referenced helper.
4. The local `seed` initializer is lexically unchanged across these 45 `model.js` snapshots. **This does not prove seeded artwork identity**, because `resolveScene`, RNG consumption, palette code, renderer and other modules changed. Renderer parity remains an independent requirement.
5. A small count of changed top-level expressions does **not** imply that few pixels changed: field additions, material functions, palette enums and renderer code account for many behavior changes outside this extraction.

## Regeneration and safety

Run `node scripts/build-recipe-format-history.mjs --semantic-out docs/recipe-format-history/new-expression-history.json` in a full local checkout for all reachable revision-expression changes. The generated local history can include other branches and differs in format from the source-blob-pinned main-history matrix. It does not overwrite the archival snapshots or their provenance.

**Keep historical PNG migration gated.** These source facts help construct a conversion matrix, but historical v1/partial v2 recipes should be rewritten only after source-era defaults, renderer and seed semantics, golden fixtures and unknown-field preservation have been independently verified. Original recipe chunks can already be archived byte-for-byte via the separate no-render backup tool.
