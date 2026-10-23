# Source-anchored recipe default and expression boundaries

## Pinned original v1 renderer and optical shadow fixture (2026-10-22)

The exact first-v1 source renderer SHA `5c12b7c505e7044db6a6ca04ddd31938ffd7f05b` now lives alongside the original model and PNG writer in [the frozen source archive](source-era/v1-37428b/README.md). A standalone, optional Chromium [two-picture capture](../../scripts/review-historical-v1-render.mjs) executes the archived renderer and demonstrates the legacy shadow toggle at *source-era pixel* level, rather than only probing the current normalizer. The output must still be checked against modern output and subsequent v1 versions before permitting any adapter. It is never called by routine CI.

## Executable first-source v1 model and PNG writer now preserved (2026-10-22)

[The exact first-v1 JavaScript source modules](source-era/v1-37428b/README.md) are imported directly by a focused Node test, not recreated by rewriting today's normalizer. Four raw-v1 inputs exercise disabled and enabled shadows, missing strength and Layer 3 dependency; their original `roygbiv-recipe-v1` envelopes are created using the original exporter and archived without modification. Git blob checksums guard accidental edits. This establishes concrete **original normalizer/serializer behaviour**; source renderer pixel parity and multiple later v1 eras still need independent fixtures. No historical converter is enabled.

## Read-only v1 shadow evidence implemented (2026-10-22)

The historical original [renderer at 37428b6](https://github.com/gamesbyian/wallgen/blob/37428b624e55a0d4526b992bfe6fdf4a01b5f420/src/renderer.js#L556-L570) explicitly requires `stripeShadowEnabled && stripeShadowStrength > 0`; its matching model uses old strength fallback 45. At the later [flag-removal renderer](https://github.com/gamesbyian/wallgen/blob/e88b30c3edf434b130b751ae855453c47755a83c/src/renderer.js#L729-L735), only positive strength remains. The current migration inspector emits **read-only** `historicalShadowEvidence` only for explicit former flag presence, retains exact original raw field values in `sourceEnvelope`, and refuses v1 conversion regardless of this narrow certainty. Do not guess a v1 source era when the flag is absent or infer full render equivalence from this isolated semantic rule.


**Evidence level:** four verified `src/model.js` blobs and a reproducible full-history **source-expression diff tool**. Lexical property expressions are not proof of the resulting renderer pixels. Do **not** turn these findings into a blanket v1→v2 migration.

[Machine-readable pinned lines](SEMANTIC-EXPRESSION-ANCHORS.json) record commit SHA, model blob SHA, seed initializer and selected exact source expressions. [The earlier 45-revision key ledger](model-key-ledger.json) tracks explicit property membership but intentionally omits shorthand `seed,`, optional spreads and helper/renderer changes.

## Verified semantic boundaries

| Boundary | Exact source evidence | Consequence for a future migration adapter |
| --- | --- | --- |
| [First PNG v1 recipe](https://github.com/gamesbyian/wallgen/commit/37428b624e55a0d4526b992bfe6fdf4a01b5f420) | `version: 1`; `stripeShadowEnabled: input.stripeShadowEnabled === true || input.stripeShadowEnabled === 'true'`; `stripeShadowStrength: finiteRange(input.stripeShadowStrength, 45, 0, 100)`; `seed` local initializer retains `rainbow-001` fallback | Two shadow fields jointly represent shadow intent. Missing original strength cannot safely be interpreted with today's zero default; its historical fallback was **45** even when the old enable flag was false. |
| [Shadow flag removed](https://github.com/gamesbyian/wallgen/commit/e88b30c3edf434b130b751ae855453c47755a83c) | `stripeShadowEnabled` is absent, and `stripeShadowStrength: finiteRange(input.stripeShadowStrength, 0, 0, 100)` | Potential flag-aware mapping is conditional: an explicitly **disabled** legacy shadow suggests a neutral destination strength of zero; an enabled legacy shadow suggests retaining its separately normalized old strength. **Do not enable** without confirming exact source renderer behavior, source default provenance and representative fixtures. |
| [PNG v2 and regions](https://github.com/gamesbyian/wallgen/commit/2e6039c8d7fcef85b74dfe70435ffeda03929b98) | `version: 2`; `structure: STRUCTURES.includes(input.structure) ? input.structure : 'paths'` | V1 recipes precede `structure`, and a plausible path-only v1 adapter could supply `paths`; still check older geometry defaults and renderer semantics before enabling. |
| Current model [pinned snapshot](https://github.com/gamesbyian/wallgen/commit/db4fb855e629506a2d1e1659ed92fa85d15ffc45) | `version: 2`, `structure` paths fallback, shadow strength zero fallback; seed shorthand still present | Current normalizer is not a version-independent default oracle. In particular `normalizeRecipe(oldRaw)` is **not** valid archival evidence of the original author's scene. |

**Additional chronology:** `viewZoom` is absent in initial PNG v1 source and present by the flag-removal anchor, where it defaults to 1. This alone cannot date a PNG: the envelope remained v1 through multiple normalizer revisions.

## Operational tool

In a complete local Git checkout:

```bash
node scripts/build-recipe-format-history.mjs --semantic-out docs/recipe-format-history/model-expression-history.json
```

This walks all reachable `src/model.js` history and emits per-commit **added, removed and changed top-level field expressions**, including shorthand field membership. It has no Node dependencies beyond built-ins, creates no GitHub Actions runs and deliberately writes an **independent output** rather than overwriting the canonical 45-commit key ledger. Its `--all` Git scope can include branch revisions absent from the canonical main-history snapshot.

**What it does not find:** changes inside `finiteRange`, `normalizeRotation`, `resolveScene`, RNG order, material/color helper modules, encoder/transports, canvas compositor, default enum arrays or global constants. It detects lexical expression differences, not equivalent executable semantics. Source changes outside the normalizer need separate archaeology before conversion approval.

## Next safe migration gate

For each historically supported source interval: pin the exact model, renderer and exporter revisions; freeze a historical normalized recipe (including omitted-field fixtures and both shadow states); compare field expressions and helper/enum/renderer diffs; implement an explicit adapter with a no-loss audit and golden file output; only then widen `inspectPngMigration` eligibility. Source container preservation is already implemented and independent from recipe-equivalence confidence. Existing [original-chunk archival export](REGISTRY.md) is a reliable fallback while this work continues.
