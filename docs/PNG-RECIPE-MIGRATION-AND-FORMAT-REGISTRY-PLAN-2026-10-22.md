# PNG recipe metadata migration without image changes
Status: specified and queued, not implemented. 2026-10-22.

## User contract
Upload a ROYGBIV PNG containing a recognized historical recipe, inspect migration outcomes, then download a PNG with **the original image unchanged** and exactly one current-format embedded recipe. This is archival modernization, not a render or retouch. Never replace the historical visual truth with a claim of current-renderer equivalence that cannot be demonstrated.

The operation has two separately reported invariants:
1. **Raster/container invariant:** all original critical chunks (especially IHDR, PLTE, all IDAT, IEND), frame order and bytes remain byte-for-byte unchanged; preserve unrelated ancillary records, ICC/gamma/color-space, EXIF, XMP and user descriptive metadata unless deliberately targeted. Only ROYGBIV recipe-bearing ancillary chunks may be replaced/inserted. Do not decode or re-encode pixels, use Canvas or change color management. Verify original and output critical chunk byte SHA-256 or byte comparisons and optionally compare a decoded pixel sample.
2. **Recipe semantic invariant:** the translated canonical recipe preserves all authoring parameters, geometry/anchors, palette, masks, compositing order, procedural seeds, materials, camera framing, locked values, explicit defaults and nested objects that can be represented. Mark ambiguous/lossy cases, never silently coerce away unknown keys. Image identity does not prove recipe fidelity.

## Actual current implementation and format inventory
Source: `src/png-metadata.js`: PNG `iTXt` keyword `ROYGBIV Recipe`, uncompressed UTF-8, envelope `{format:'roygbiv-recipe-v2',recipe,output:{width,height},generator}`. Current extractor accepts `roygbiv-recipe-v1` and `roygbiv-recipe-v2`, requires a nonblank seed, additionally requires structure paths/radial/regions on v2, chooses last recognized record and immediately calls `normalizeRecipe`. Writer already replaces duplicate `iTXt` recipe chunks without touching `IDAT`; reader/writer cap recipe chunk at 1 MiB. **Immediate normalization is lossy as an archival interface** because unrecognized historical keys and their original default semantics can disappear. Existing `tests/png-reembed-recipe.test.js` demonstrates byte-identical IDAT and latest-recipe deduplication, not historical semantic parity.

Other transports to inventory independently:
- Plain JSON recipe / legacy `?r=` share URL: unversioned recipe object; provenance inferred carefully, not presumed from present day.
- Compressed `#s=v1.` share token: `{v:1,r:<canonical nondefault delta>}` using deflate/base64url (`src/share-recipe.js`); **this v1 is a distinct version namespace** from PNG `roygbiv-recipe-v1`.
- Saved/local library and any headless CLI recipe export: investigate their shape and default policy; don't confuse storage schema, PNG envelope and renderer revision.
- Historical PNG exports with duplicate recipe chunks on either side of IDAT, legacy missing `structure`, and any other observed `tEXt`/`zTXt`/iTXt variants must be recorded from actual commits/fixtures before adding decoders.

## Historical archaeology deliverable: living format registry
Create `docs/recipe-format-history/REGISTRY.md` plus machine-readable `docs/recipe-format-history/manifest.json` and bounded fixtures with source SHA and copyright/provenance, each entry recording: format ID, date range, introducing/retiring commit(s), envelope and PNG keyword/chunk, transport, exact normalization/default code SHA, geometry and seed semantics, output dimensions and camera transform, extensions, known issues, sample bytes/JSON and verified import/export evidence.

First known lineage anchors, **candidate commit references, not yet proven schema boundaries**: search repository commits for 'recipe' and 'metadata'; inspect diffs and adjacent parent revisions including `8ff1b723`, `37428b62`, `c9313b06`, `21d97e1d`, `13738296`, `2e162fae`, `a5264611`. Record exact introduction/revision dates only after checking code. Enumerate every change to `src/model.js`, `src/png-metadata.js`, original embedded/export handlers, renderer, output constants and serializer; use `git log --follow -p` and tag snapshots to capture renamed/removed/default-shift fields. History inspection must account for branches merged without linear ancestry and pre-module implementations. Use source-derived golden fixtures, not guessed versions.

## Migration and conversion matrix
Maintain a version-by-version table: from-format/version -> detector -> field/path mapping -> unit transform -> default provenance -> representation in current schema -> confidence (exact / invertible transform / approximation / unrepresentable) -> fixture IDs -> action. Include every field, nested scene object and renderer-effect contract, not just top-level setting names.

Examples of *categories to audit*, not assumed renames: geometry family and `structure` introduction, stripe order, reversed palette, paths/segments/bezier knots and extrapolation, waves/hairpins, over-under/weave masks, seeded randomness, radial/region layout, per-object placements, imported silhouettes, texture-layer count and material textures, lighting/shadows, viewZoom/viewPan and logical-to-export pixel geometry, opt-in `photoLook` and `surfaceTreatments`, metadata/custom EXIF, defaults that changed across releases.

Migration: `readRawPngRecipe` returns envelope + raw JSON + ordered chunk provenance without current-schema normalization; `detectRecipeDialect` uses explicit version and structural fingerprints, rejecting conflicting candidates; pure chained, idempotent `migrateRecipe` functions apply source-version defaults **before** destination normalization and preserve unknown original material in an optional namespaced archival payload, never silently treat it as render settings. Reject prototype pollution, oversize/compression bombs, invalid UTF-8/CRC, PNG boundary errors and unsupported critical chunks. Keep migration trace, warnings and deterministic canonical serialization. Introduce explicit schema version separate from transport and renderer version; bump only when migration evidence supports it.

| Input family | Read | Migrate | Re-embed | Eligibility |
|---|---|---|---|---|
| PNG iTXt recipe v2 / current | already supported | canonicalize with audit | existing writer | exact if all fields recognized |
| PNG iTXt recipe v1 | already supported, defaults synthesized today | historical defaults and field map needed | existing writer | conditional until fixtures prove semantics |
| legacy plain JSON / ?r= | supported in ordinary load | identify era first | via PNG input only for this workflow | conditional |
| compressed share v1 | separate transport reader | decode then classify underlying schema | via PNG input only | conditional |
| unknown/newer/corrupt metadata | must not coerce | none | none | visible refusal, preserve original input |

## UI and interaction
Entry in **More → image metadata / PNG tools**, not a new Edit destination: 'Update recipe in an existing PNG'. Android file picker accepts .png (and validates signature). No wallpaper preview mutation, no switch of the active design, no history/Undo changes. After input show file name, dimensions, recipe generation/version, detection confidence, counts of exact/translated/unknown fields and what stays unchanged; optional expandable before/after and migration report. Button **Download PNG with updated recipe** active only when semantic migration is safe. Warn clearly 'The picture stays exactly the same; opening this recipe in a newer generator may render differently.' Offer raw recipe/report JSON for ambiguities; do not present an unsupported conversion as successful. Download with distinct `-recipe-updated.png` suffix; retain source file and originals. Keyboard, touch/44px, screen readers, focus recovery and small portrait tray are required.

## Architecture and acceptance sequence
M0 history registry and actual version boundaries; M1 raw non-destructive parser and independent schema detection; M2 explicit field migration matrix and fixture-backed adapters; M3 surgical ancillary writer and provenance/report (reuse `src/png-metadata.js`; avoid parallel PNG engines); M4 More UI / safe download and error handling; M5 focused tests and realistic PNG examples.

Acceptance: for v1/v2 and every observed historical dialect, input PNG critical chunks and ordered IDAT byte arrays are identical in output; unrelated ancillary payloads remain unchanged; exactly one recognized updated recipe survives; reader returns the intended normalized current recipe; all mapped fields verified against frozen historical code/fixtures; migration idempotence; no changes to current on-screen state. Failure must leave input exportable unchanged. Large assets, malformed chunks, duplicate stale recipes and unknown future formats get focused negative tests. One fast Node unit suite and 1–3 manual examples; **no new compulsory CI matrix**.

## Risks and policy
A PNG's pixels can be faithfully preserved even when the original artwork can no longer be regenerated by current code. Maintain provenance/unknown fields for forensic future use and report render-equivalence separately. Never rewrite output width/height metadata to current constants when source IHDR dimensions differ: historical dimensions are documentary facts. Keep original PNG ancillary metadata where possible, and distinguish modifying only the recipe from modifying user-authored EXIF/titles. Gate shipping on meaningful old-format coverage, not a cosmetic version-label change.
