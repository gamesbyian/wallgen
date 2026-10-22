# ROYGBIV recipe format registry

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
| Multiple v1/v2 recipe chunks | Ordered iTXt records, latest chosen | Writer replaces **all** named records on safe update | Eligible only if selected source is already safe; earlier raw records remain available in inspection |
| No recipe, malformed named iTXt, unknown future dialect | PNG signature, chunk bounds, named metadata checksum, envelope | None | **Refuse**; never overwrite |
| JSON and compressed share fragments | Distinct transports | Outside this PNG-only workflow | No implicit reinterpretation |

**Preservation model:** `readRawPngRecipe` leaves the original JSON untouched until an explicit audit; the updater uses the existing `embedPngMetadata` writer and checks every non-recipe chunk byte-for-byte, including ancillary colour-profile, EXIF, XMP and all IDAT chunks and original IEND/trailing bytes. A recipe rewrite does not re-render anything and cannot prove current-renderer pixel equivalence.

**Known open archaeology:** establish schema fingerprint intervals between the historical model commits rather than assuming each envelope identifies one immutable schema; reconstruct any changes to seed order, material defaults, object semantics, camera fields, and selectors; freeze representative v1 and early-v2 recipes and tests. The original v1 reader today can load recipes, but that is *not* evidence of faithful archival conversion. Don't auto-migrate v1 on that basis.

**Compact local use:** `npm run png:migrate -- --in wallpaper.png --dry-run` for a report, `npm run png:migrate -- --in wallpaper.png --out wallpaper-recipe-updated.png` for an eligible source. The Files & sharing → Update recipe inside existing PNG control uses the same auditing and rewriting functions without touching the current artwork. Ordinary exports still use the source model's current default output size.
