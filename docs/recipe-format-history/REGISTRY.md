# ROYGBIV recipe format registry

## Active preservation contract and historical scope closure (23 October 2026)

[#476](https://github.com/gamesbyian/wallgen/issues/476) is **closed not planned** for new historical translators, under the owner's current-canonical-first directive. The utility still safely updates **only fully recognized current canonical v2** metadata into a separate output PNG, leaving the original imported PNG, IDAT and unrelated chunks intact. Exact-byte named-iTXt archive and source reports remain available even where migration is refused. All v1, incomplete/unknown/ambiguous v2 and conflicting records remain a **strict refusal**, not a conversion promise. The authenticated original-v1 candidate failed actual artwork comparison (29.54%/31.47% pixels >2 RGB different); preserve the report but do not spend primary engineering cycles on its parity. Lower 'next' lists are archived hypotheses, not current queue items.


## 22 October first-v1 pixel incompatibility checkpoint

**A proposed narrow preview adapter has been falsified by actual image evidence.** [Four real Chromium Canvas outputs from #530](source-era/v1-37428b/ACTUAL-MODERN-PARITY-FINDINGS-2026-10-22.md) reproduce both original-v1 source-era PNG IDAT goldens **exactly**, but differ from modern candidate previews at **230,413 (29.54%)** and **245,471 (31.47%)** pixels (>2 RGB). Historical separate, slim ribbons become substantially wider and frequently adjoining with changed endpoints in the contemporary painter. The adapter's original-only field is `stripeShadowEnabled` and 54 modern-only fields are normalized; matching most shared scalar fields is not semantic/pixel parity. All historical v1 conversion remains **refused** and the production metadata-only converter is unchanged. The opt-in parity script is for investigation only; retained original PNGs and unmodified iTXt archiving are the master preservation route. Next: source-era scene-width/placement comparisons and pinned subsequent-v1 intervals before any source-specific rewrite. Temporary Chromium CI was removed; quick CI remains the sole gate.

## Current source-era receipt and bounded conversion policy (2026-10-22)

The exact original v1 model, renderer and PNG writer, with pinned Git object hashes, have been committed to [the frozen first-v1 source tree](source-era/v1-37428b/README.md) (#523/#524), **executed in a real Chromium Canvas**, and used to create two real historical v1 PNGs. [The image observations](source-era/v1-37428b/ACTUAL-RENDER-FINDINGS-2026-10-22.md) and [IDAT/source manifest](source-era/v1-37428b/SHADOW-IMAGE-GOLDENS.json) remain source-backed evidence after the temporary workflow artifacts expire. Their original shadow toggle has confirmed visible effect. [#525](https://github.com/gamesbyian/wallgen/pull/525) now includes a short executable source-hash and original writer/refusal test in regular lean quick CI. **This does not prove modern renderer parity or authorize historical v1 conversion.**

The preservation implementation below is **shipped**, not PR-pending. Every historical field/dialect interval still needs a source-era-specific adapter with original-pixel comparison and no-loss guarantees before altering metadata. Use [the current handoff](../AGENT-HANDOFF-2026-10-22.md) for next actions; lower textual plans are older snapshots.


**New executable original-v1 source anchor:** [The unchanged initial normalizer + PNG writer](source-era/v1-37428b/README.md) are pinned by **Git blob SHA**, and four source-era cases test the actual historical v1 exporter end-to-end into today's strict preservation tool. This is stronger than text-grep default inference: it proves original recipe normalization and original envelope semantics for this **one** specific 17 October commit. It is **not** image-pixel parity or a blanket v1 conversion gate. See [fixture file](source-era/v1-37428b/EXPECTED-SEMANTICS.json).

**Byte-level recovery independent of JSON (2026-10-22, merged; historical checkpoint):** Even a **malformed or unsupported** named historical recipe iTXt can now be preserved via `inspectPngRecipeArchive` → `archivePngRecipeRecords`, with full original bytes including CRC (valid outer PNG required). The More UI enables exact-byte rescue after parsing failure; CLI `--archive` runs before inspection and still refuses unsafe migration. `format:null` denotes unreadable record text, never silently replaces the source with modern defaults. Standard recipe importer remains strict. Bounded archive and no-render integrity guarantees remain.


**Historical duplicate recipe preservation (2026-10-22, merged; historical checkpoint):** `inspectPngMigration` now returns `conflictingChunkIndexes` for multiple differing named `ROYGBIV Recipe` iTXt envelopes and refuses replacement. Only JSON-identical duplicate envelopes can be consolidated during metadata-only migration. All conflicting chunks may still be exported byte-exact in the existing `roygbiv-recipe-archive-v1` JSON backup, allowing informed future adjudication. Normal unmodified source PNG remains the master record.


**45 complete source-expression snapshots (2026-10-22, merged; historical checkpoint):** The [machine-readable changed-expression matrix](model-expression-ledger.json), [human interpretation of ten changes](EXPRESSION-CHANGE-LEDGER.md) and [five source-backed expression snapshot batches](model-expression-sources-01.json) extend the verified key ledger across **all** its 45 model revisions. This reveals layer-three activation dependency, shadow default drift, Drawn anchor/path remapping and camera signed-zero updates. The seed initializer is lexically stable but RNG consumption/renderer equivalence remains **unproven**. Do not use this ledger alone to authorize historical v1/v2 migrations.


**Semantic archaeology evidence (2026-10-22, merged; historical checkpoint):** [Four source-blob-pinned default-expression anchors](SEMANTIC-EXPRESSION-ANCHORS.json) and the [v1/v2 semantic adapter gate](SEMANTIC-DEFAULTS-AND-ADAPTER-GATES.md) record verified historical shadow-toggle/strength changes and v2 paths fallback. The 45-source key ledger is still structural only. A full local Git clone can run `node scripts/build-recipe-format-history.mjs --semantic-out docs/recipe-format-history/model-expression-history.json` to enumerate changed source expressions without assuming helper/renderer equivalence or overwriting the baseline ledger. Historic migrations remain refused until semantic parity is separately proved.


**Exact historical backup (2026-10-22, merged; historical checkpoint):** A migration refusal no longer means the UI can save only a status report. The independent `archivePngRecipeRecords` export produces `roygbiv-recipe-archive-v1` JSON containing the original named iTXt chunk bytes as base64, with record order/offset, latest-selected index, source dimensions and optional original filename. This preserves the original textual/byte-level record even if modern JSON normalization would lose duplicate keys or historical semantics. Available from the More PNG tool and `png:migrate --archive`, including v1 refused sources. It does **not** claim to upgrade any historical dialect, nor replace the original PNG.


**Additional source archaeology (PR #480):** [chronological field change ledger](SCHEMA-CHANGE-LEDGER.md) and [45 source-pinned key snapshots](model-key-ledger.json) now track the explicit `normalizeRecipe` field set across the full observed `src/model.js` main-history sequence. Key additions/removals alone do not prove units, defaults or render semantics, but provide a concrete field-by-field starting point for historical adapters.

**Status:** verified PNG envelope origins, partial model-field archaeology. Last checked 2026-10-22. Machine-readable references: [manifest.json](manifest.json). These are **version namespaces**, not a claim that every model default changed only when the PNG envelope changed.

| Format / period | Source evidence | Supported archival action |
| --- | --- | --- |
| PNG descriptive-only (17 Oct 2026) | [metadata introduction](https://github.com/gamesbyian/wallgen/commit/137382968319eeb58643f12a9eb6f0c12940732c), no recipe keyword | Refuse recipe update; preserve image |
| PNG `roygbiv-recipe-v1` (17 Oct onward) | [full recipe/transform introduction](https://github.com/gamesbyian/wallgen/commit/37428b624e55a0d4526b992bfe6fdf4a01b5f420); model `version:1` | Raw inspection; conversion **gated** pending exact historical defaults |
| PNG `roygbiv-recipe-v2` (18 Oct onward) | [radial and regions introduction](https://github.com/gamesbyian/wallgen/commit/2e6039c8d7fcef85b74dfe70435ffeda03929b98); model `version:2` | Only exact, fully recognized canonical v2 recipes currently eligible |
| v2 writer/reader revisions (20 Oct) | [legacy last-record recovery](https://github.com/gamesbyian/wallgen/commit/21d97e1de7f251c71a0c0a7ff17f68c97388c63c), [64 KiB restoration fix](https://github.com/gamesbyian/wallgen/commit/c9313b0655634e9b72cfa213b08b0d20dbc3a692) | Replace duplicate named records; read up to current 1 MiB bound |
| `#s=v1` share fragment (20 Oct) | [portable compressed share transport](https://github.com/gamesbyian/wallgen/commit/03d7efaba995fdf57e9698993162881623e4ec78) | **Different** v1 namespace; not a PNG recipe version |

## Current conversion matrix (first operational slice)

| Input | Detection | Mapping | Confidence / action |
| --- | --- | --- | --- |
| Latest `roygbiv-recipe-v2`, every explicit property already canonical | Envelope + raw object + current `normalizeRecipe` equality | Identity; replace only the recipe iTXt chunk; actual PNG IHDR retained as output dimensions | **Exact field preservation**, re-embed enabled |
| Old `roygbiv-recipe-v2` missing canonical fields | Same plus synthesized-field audit | Historical default lookup **not established** | **Refuse**, report missing keys |
| v2 with unknown extension keys or coercions | Raw key/value diff before normalization | No silent deletion or coercion | **Refuse**, report full key list |
| `roygbiv-recipe-v1` | Original string plus raw payload | Legacy model defaults, structure introduction and renamed/removed fields must be reconstructed from frozen releases | **Refuse**, report historical adapter needed |
| Multiple v1/v2 recipe chunks | Ordered iTXt records, latest chosen | Writer replaces **all** named records on safe update | **Refuse** when earlier raw records conflict; consolidate only raw JSON-identical duplicate records when the selected current-v2 recipe is fully canonical |
| No recipe, malformed named iTXt, unknown future dialect | PNG signature, chunk bounds, named metadata checksum, envelope | None | **Refuse**; never overwrite |
| JSON and compressed share fragments | Distinct transports | Outside this PNG-only workflow | No implicit reinterpretation |

**Preservation model:** `readRawPngRecipe` leaves the original JSON untouched until an explicit audit; the updater uses the existing `embedPngMetadata` writer and checks every non-recipe chunk byte-for-byte, including ancillary colour-profile, EXIF, XMP and all IDAT chunks and original IEND/trailing bytes. A recipe rewrite does not re-render anything and cannot prove current-renderer pixel equivalence.

**Known open archaeology:** establish schema fingerprint intervals between the historical model commits rather than assuming each envelope identifies one immutable schema; reconstruct any changes to seed order, material defaults, object semantics, camera fields, and selectors; freeze representative v1 and early-v2 recipes and tests. The original v1 reader today can load recipes, but that is *not* evidence of faithful archival conversion. Don't auto-migrate v1 on that basis.

**Compact local use:** `npm run png:migrate -- --in wallpaper.png --dry-run` for a report, `npm run png:migrate -- --in wallpaper.png --out wallpaper-recipe-updated.png` for an eligible source. The Files & sharing → Update recipe inside existing PNG control uses the same auditing and rewriting functions without touching the current artwork. Ordinary exports still use the source model's current default output size.
