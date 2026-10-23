# Agent orientation for ROYGBIV

## Camera Photo output evidence now includes Early Digicam (2026-10-22)

[Five actual source-rendered camera images](docs/CAMERA-PRODUCTION-RENDER-FINDINGS-2026-10-22.md) were downloaded, CRC validated, recipe-matched and visually inspected (Actions #39887351549). The 360-column Digicam is distinct from the 200-column Webcam, but mainly appears punchier in colour rather than showing true camera optics. Natural and HDR remain subtler stylized finishing choices. Preserve both original camera capture profiles and their saved recipes; prefer a meaningful separate DSLR/lens signature to yet another tonal grade. Browser proof was one-off only and removed before merge. Real Pixel/named-device fidelity is unverified.


## Deep-black negative Photo output confirmed in real art (2026-10-22)

The original Film negative remains unchanged. The new `film-negative-deepblack` opt-in setting protects dark wallpaper substrate instead. [Three controlled Chromium PNGs](docs/DEEP-BLACK-FILM-ART-FINDINGS-2026-10-22.md) were **rendered, opened and validated** (Actions #39885066432): original black stays (0,0,0), legacy negative lifts it to (17,16,13), and every one of 405,237 bright source pixels has exactly identical output under both film profiles. The temporary art probe was removed from workflow before merging. Pixel performance and photochemical fidelity remain untested.


## Soft Satin correction visually supported (2026-10-22)

An opt-in `satin-soft` treatment now reduces overpaint on tight red/orange loops while retaining legacy `satin` unchanged. [Three actual production PNGs](docs/SOFT-SATIN-ART-FINDINGS-2026-10-22.md) were downloaded, visually opened, CRC-checked and matched to their stored recipes (Actions #39884499923): measured RGB deviation fell from 8.535 to 3.457 on one controlled scene. The temporary Chromium probe was removed before merge. Physical Pixel optics/performance and further textile realism remain unverified.


## First actual embroidery picture review complete (2026-10-22)

[Seven real production-rendered samples](docs/EMBROIDERY-PRODUCTION-ART-FINDINGS-2026-10-22.md) were downloaded, viewed, CRC-validated and matched to saved PNG recipes (Actions #39883744519). Running seams visibly follow loops; targeted Satin changes only one circle; Satin on tight inner loops can visibly desaturate rainbow ink and short regional stitches remain mechanically repetitive. This is **real output evidence**, but does not approve physical Pixel rendering or realistic sewn fibre. The one-off Chromium gate was removed byte-for-byte. Advance any realism work opt-in, retaining earlier saved pixels.


## Opt-in soft-edge linen, not a legacy material rewrite (2026-10-22)

Actual [Chromium three-image linen experiment #39823468097](https://github.com/gamesbyian/wallgen/actions/runs/39823468097) isolated the serrated stripe outlines to high `textureDisplacement` (0 smooth, 20 visible, 68 strong); the original painted weave stays at displacement zero. New normalized `linen-soft` uses the same paint and `materialHeight` as `linen`, but `materialContourHeight` applies a bounded half-pitch five-point prefilter **only** when sampling edge relief. Old linen never changes pixels, and the existing three material selectors display both choices. Avoid auto-converting old recipes, duplicating inspector controls or installing permanent screenshot CI. **One controlled visual comparison was completed:** [Chromium #39824713944](https://github.com/gamesbyian/wallgen/actions/runs/39824713944) renders visibly smoother soft-edge linen at 68 displacement with unchanged fabric background; both recipes/PNG metadata verified and old linen pixel-identical to previous baseline. Do not extrapolate to physical Pixel/native-resolution/material realism, which remain open.


## Material realism now has actual judged PNG output (2026-10-22)

[Seven-image material production review](docs/MATERIAL-PRODUCTION-RENDER-FINDINGS-2026-10-22.md): [Chromium Actions run #39820925332](https://github.com/gamesbyian/wallgen/actions/runs/39820925332) generated seven exact-recipe 480×1040 images. All PNG CRCs, embedded source recipes and sidecars independently matched; images actually viewed. Linen at displacement 68 shows regular grid texture and sawtooth edges, watercolor paper cloudy texture, concrete fine speckles. This is controlled evidence **at strong displacement, not a verdict on all user defaults**. If improving linen, first compare same seed/geometry at displacement 0/20/68; avoid silent old recipe changes. Temporary review workflow removed and PR #498 closed unmerged. No screenshot CI expansion.


## First actual Photo artwork review is no longer pending (2026-10-22)

[Photo production-render findings](docs/PHOTO-PRODUCTION-RENDER-FINDINGS-2026-10-22.md) document seven downloaded, visually inspected 600×1300 production PNGs from one-shot Chromium Actions #39819624080, plus independent per-image CRC and recipe equality checks. The temporary review PR #496 was closed **unmerged** after restoring `.github/workflows/check.yml` exactly. Do not reintroduce browser reviews into routine CI. Halation currently looks subtly localized even at max; Muted Negative visibly raises black toward warm charcoal. Address artist/visual expectations in separately named or explicitly versioned treatments, not by silently shifting stored preset semantics. Physical Pixel/material/embroidery QA remains open.


## Neutral Photo optimization without skipping spatial effects (2026-10-22)

`isNeutralPhotoLook` tests the **entire normalized transform**, not just the Grain or Halation slider, before skipping `applyPhotoFinish` get/put image data. An active `camera-webcam-signal` must always run because its downsample/chroma-loss stage is inherently non-neutral. Even a neutral active `processPhotoPixels` call still rejects invalid pixel-buffer dimensions. Preserve stored recipes and non-neutral output exactly. This reduces avoidable 19.8 MP readbacks without introducing screenshot CI or claiming device-benchmark evidence.


## Legacy PNG restoration must not claim pixel equivalence (2026-10-22)

`extractPngRecipeWithProvenance` in `src/png-metadata.js` provides one-read validated v1/v2 importer provenance (normalizer changes and duplicate-record count); existing `extractPngRecipe` delegates with its original return contract. The ordinary Restore UI shows a short caution when current normalization alters old fields or a v1/multiple-record PNG is imported. Import remains available through existing recipe/Undo transaction. Do **not** mislabel successful import as exact historical renderer/pixel regeneration or conflate import with the strict, no-render migration/archival path. No new CI workload.


## Photo secondary control is contextual (2026-10-22)

Light → Photo uses the same two-slot grid for Amount + a preset-dependent second control: Grain for most looks, Halation for `film-halation-only`. Keep original `photoGrain` source control and the contextual `photoHalation` input. `syncPhotoSecondarySlot` hides the irrelevant field, with CSS `[hidden]` taking precedence over generic range styles, and `fromControls` maps active halation to `photoLook.parameters.halation`. Do not add a duplicate control row, top-level destination, hidden grade changes or expensive CI. Real Pixel tray fit still needs manual confirmation.


## Exact-byte rescue does not require valid historical JSON (2026-10-22)

`archivePngRecipeRecords` is now a raw iTXt **byte collector**, not a semantic recipe reader. `inspectPngRecipeArchive` validates the complete original PNG structure/CRC, bounds count and chunk sizes, and finds named recipe records even when JSON is malformed or text encoding cannot be interpreted. More → Files & sharing exposes the archive despite `inspectPngMigration` throwing; CLI `--archive` writes it before semantic inspection. Formats for unreadable records are null; full original chunk bytes remain. Do not weaken ordinary recipe parsing or permit automatic conversion of unknown/ambiguous metadata. Source PNG remains the authority, and no CI expansion is needed.


## Photo appearance evidence, not screenshot factories (2026-10-22)

Before asserting F2/D3 optical quality or closing Film/Camera issues, use the optional `scripts/review-photo-looks.mjs` with the [seven-image manual guide](docs/PHOTO-SEVEN-IMAGE-ART-REVIEW-2026-10-22.md). It exports six opt-in Photo looks plus untreated source through `render-headless.mjs --recipe` using one canonical seed/source state and matching PNG/JSON. The tool is **not CI**; its existence is not evidence that art samples have been generated, viewed or approved. Record precise visual findings before tuning render effects. Avoid expanding to large routine screenshot suites.


## Conflicting historical PNG recipe records are evidence, not debris (2026-10-22)

The metadata-only updater must refuse to replace a PNG containing distinct previous `ROYGBIV Recipe` envelopes, even when the selected latest one is canonical. `inspectPngMigration` exposes `conflictingChunkIndexes` and points to `archivePngRecipeRecords` for exact-byte backup. JSON-identical duplicates may be consolidated. Do not loosen this rule merely to widen historical coverage; investigate each source-era record, preserve provenance, and test conversion fixtures first. This does not change ordinary PNG export behavior or add CI.


## Fully indexed 45-revision normalization expression history (2026-10-22)

Before implementing v1/early-v2 adapters, inspect the [source-blob-pinned expression ledger](docs/recipe-format-history/model-expression-ledger.json), [10 changes/7 revision summary](docs/recipe-format-history/EXPRESSION-CHANGE-LEDGER.md) and [original source-expression snapshots](docs/recipe-format-history/model-expression-sources-01.json) (five 10-revision batches). Every parsed field set agrees with the original 45-revision structural key ledger. Verified source-expression changes cover third-layer activation dependency, v1 shadow 45→0 fallback, Drawn path/anchor remapping, camera signed zero and schema version. These are **lexical field expression** facts, not runtime parity across helper modules, RNG or renderer. Keep automatic history conversion gated until golden source-era fixtures prove preservation. No routine new CI workflow.


## Historical default conversion evidence (2026-10-22)

The 45-revision field-membership ledger now has companion [SHA/Blob-pinned semantic expression anchors](docs/recipe-format-history/SEMANTIC-EXPRESSION-ANCHORS.json) and [migration decision matrix](docs/recipe-format-history/SEMANTIC-DEFAULTS-AND-ADAPTER-GATES.md). `scripts/build-recipe-format-history.mjs --semantic-out <path>` can inventory lexical normalizer field changes from a full Git clone. First concrete hazard: PNG v1 originally stored `stripeShadowEnabled` and defaulted `stripeShadowStrength` to 45; a later revision removed the boolean and defaulted strength to 0. V2 added `structure` default `paths`. Lexical source changes are *not* renderer/seed semantic proof. Keep historic conversions gated until full adapters and fixtures exist; no routine new workflow.


## Historical PNG rescue even when schema migration is unsafe (2026-10-22)

Use `archivePngRecipeRecords` in `src/png-recipe-migration.js` to export exact original ROYGBIV named iTXt chunks (base64-encoded as full chunk bytes, with order/offset metadata) into a separate JSON backup. More → Files & sharing and `png:migrate --archive` expose this even when v1/early-v2 translation is refused. Retain original PNG as master; archival bundle is **not** a normalized or safely upgraded recipe. Bounds: at most 64 named records/16 MiB total. No UI editor mutation or new CI workflow.


## Photo optical preview boundary (2026-10-22)

The shared Photo compositor now includes `film-halation-only`: an opt-in source-luminance, authored-resolution spatial mask that spills warm light around edges, distinct from geometry Glow, and does not allocate another export-scale RGBA buffer. This is an approximation, not linear-light film-stock physics. `parameters.halation` belongs only to the new preset; preserve historical `photoLook.parameters` shapes and noise kernels for prior looks. Photo remains after all surface treatments in the existing shared renderer/worker/export path. Device visual approval is pending.


## PNG migration input integrity (2026-10-22)

Before any archival recipe rewrite, `validatePngMigrationContainer` in `src/png-recipe-migration.js` now checks every original PNG chunk CRC, legal IHDR/header structure, PLTE and IDAT ordering, and refuses unknown critical chunks. `inspectPngMigration` and `migratePngMetadataOnly` use this shared gate; rewritten output is validated too. It preserves all pixels and non-recipe ancillary bytes unchanged. Never relax historical recipe semantic refusal just because the PNG framing is valid. Keep testing proportional; no permanent workflow needed.


## Historical recipe archaeology (PR #480, 2026-10-22)

To implement v1 or early-v2 recipe migration, consult [45-revision key ledger](docs/recipe-format-history/model-key-ledger.json), [chronological model changes](docs/recipe-format-history/SCHEMA-CHANGE-LEDGER.md) and [format registry](docs/recipe-format-history/REGISTRY.md). The ledger is **source-field membership**, not default or renderer semantic proof. A complete Git clone can reproduce it via `node scripts/build-recipe-format-history.mjs`. Current PNG migration refuses ambiguous historic conversions by design; never infer unobserved defaults from newest `normalizeRecipe`.

## Historical PNG recipe migration work queue (#476)

[Specification](docs/PNG-RECIPE-MIGRATION-AND-FORMAT-REGISTRY-PLAN-2026-10-22.md) · [issue](https://github.com/gamesbyian/wallgen/issues/476). Implement raw source-era schema detection and conversion before modern normalization. Preserve original PNG critical chunk bytes, ancillary metadata and historical recipe semantics where possible; report ambiguity and do not claim regenerating the same old pixels. This is a More/PNG utility, not a new editor destination. Planned M0–M5; no new CI screenshot burden.


## PNG preservation implementation alert (PR #479, 2026-10-22)

[#479](https://github.com/gamesbyian/wallgen/pull/479) adds raw versioned recipe inspection and an opt-in non-destructive PNG recipe updater. Use `readRawPngRecipe` for archaeology, **not** `extractPngRecipe` (which normalizes away unknown fields). The same `migratePngMetadataOnly` API backs Files & sharing and a headless CLI, and refuses v1/early-v2 uncertain conversions until frozen history fixtures exist. The sole PNG metadata writer remains `embedPngMetadata`, and image bytes/EXIF/ICC remain unchanged. See the format registry and migration plan before touching serialization. No background overhaul, new CI workflow or unqualified historical migration claims.

## Embroidery implementation alert (PR #474, 2026-10-22)

[#474](https://github.com/gamesbyian/wallgen/pull/474) starts E0/E1 in `src/embroidery.js` with strict optional `surfaceTreatments` and palette/object/global fill targeting, first path/region stitch overlays and a small Texture → Surface editor. Keep all old artwork pixel-unchanged when omitted, and do not duplicate material layers, change the 40-tool navigation, or claim finished stitch physically accurate. Planned stages E2–E5, object selection/outline/interior treatments and actual image/device review remain open; see the active roadmap. No third-party code copied.

## Implementation alert: Photo work has begun (2026-10-22)

[PR #473](https://github.com/gamesbyian/wallgen/pull/473) is the first actual shared Photo implementation: versioned opt-in `photoLook`, a simple sRGB tone/grain finish, and a compact Light-pane switch. It advances F0/F1 and D1/D2 but does **not** complete film optics, webcam compression, advanced inspector, real rendered-art review or phone signoff. Before working on photo finishing, inspect latest main and that PR's merge status; use `src/photo-look.js` as the sole film-and-camera postprocessor. Preserve old recipe pixels when Photo is off. Do not add a second Film tool or a second camera processor. See the active roadmap checkpoint.

## Live work authorities, as of 2026-10-22

**START HERE:** [active product roadmap, art + UX queues](docs/ACTIVE-PRODUCT-ROADMAP-2026-10-22.md). It is the single authority for current priority, status, issue owner and closure conditions. Older plans and large QA ledgers retain historical evidence, **not** current per-PR gates. Current editor: seven categories, 40 named tools, 95 scalar settings.

- **Working shipped art:** Rainbow Orbits + imported silhouettes and reusable geometry (#434), selected-object nudge/reset (#449) and opt-in direct canvas dragging (#456), scientific **display-only** colour-vision inspection (#432), Material/Finish consolidation and guided settings (#452/#454/#455/#459–#465). Preserve recipe/Undo/export semantics, and don't rebuild already shipping modes.
- **Material quality reviewed in production PNGs:** #499 visually inspected seven real material samples; #502 compared opt-in soft-edge linen at identical strong displacement with preserved historical linen pixels. Broader material art/physical Pixel acceptance remains open under [#445](https://github.com/gamesbyian/wallgen/issues/445).
- **Shipped but incomplete art:** Embroidery #467 (#474/#478/#481/#482/#504) now supports exact object precedence and region tatami; Film #468 and Camera #471 share the opt-in versioned Photo compositor, grain, halation, webcam and new early-digicam capture (#473/#486/#493/#505). Advanced E2–E5/F2–F5/D3–D5 remain scoped art/UX work, not invitations to rebuild the engines.
- **Specific usability decisions:** [#444](https://github.com/gamesbyian/wallgen/issues/444) C07 multi-match routing shipped #475 (physical keyboard validation pending); C09/C10/C11 are optional observed-workflow prototypes. [#365](https://github.com/gamesbyian/wallgen/issues/365) should advance only on actual phone tap friction; #301 short landscape remains low priority.
- **Verification policy:** [lean CI](docs/CI-OPERATIONS-2026-10-22.md): one quick Node PR gate; specialized Chromium/atlas workflows are voluntary. Tests for changed persistence or rendering paths should be proportional. Avoid claiming optical or physical-device verification without seeing/trying it.

## Live UX handoff and completion tracking (2026-10-22)

**Live navigation:** 7 categories / **40** named tools / **95** canonical schema keys, after #459. Original 40/87 and intermediate 43/95 documents are historical samples, not current UI contracts. Six related incremental PRs [#459](https://github.com/gamesbyian/wallgen/pull/459), [#460](https://github.com/gamesbyian/wallgen/pull/460), [#461](https://github.com/gamesbyian/wallgen/pull/461), [#462](https://github.com/gamesbyian/wallgen/pull/462), [#463](https://github.com/gamesbyian/wallgen/pull/463) and [#465](https://github.com/gamesbyian/wallgen/pull/465) are merged, with regular Node CI green; physical-phone UX acceptance is still open.

**Before taking more UX work:** read the current [active roadmap](docs/ACTIVE-PRODUCT-ROADMAP-2026-10-22.md), [redesign queue](docs/UI-REDESIGN-IMPLEMENTATION-QUEUE.md), and [C01–C17 live status ledger](docs/IA-SEMANTIC-CONTROL-AUDIT-AND-REVISION-PLAN-2026-10-22.md). Work from fresh `main`; read the now-merged [embroidery](docs/GEOMETRY-AWARE-EMBROIDERY-AND-SURFACE-TREATMENTS-PLAN-2026-10-22.md) and [film](docs/PHOTO-FILM-LOOKS-AND-FILTERS-PLAN-2026-10-22.md) specifications and their implementation issues #467/#468 before modifying material/render code. Prefer one user-visible fix plus targeted tests, preserving original recipe keys, short phone tray and five mobile destinations. Never close #444 simply because source mapping or Node tests pass.


---

The code and current product behavior are authoritative; design plans and research documents are hypotheses until deliberately implemented and verified.

## If working on navigation, UX, visual controls or AI-directed design

Read these documents **before recommending menu reorganisation or changing source controls**:

- [Human expectations, creativity and procedural composition: agent field guide](docs/AGENT-HUMAN-EXPECTATIONS-AND-CREATIVE-COMPOSITION.md): evidence-backed HCI methodologies, artistic/perceptual vocabulary, research sources, and safeguards against simulated human evidence.
- [Semantic intent and prerequisite interrogation tool](scripts/ia-semantic-audit.mjs): current source-linked 95-key map, goal and mode queries; analysis, not a human usability study.
- [Current control gap and UX revision plan](docs/IA-SEMANTIC-CONTROL-AUDIT-AND-REVISION-PLAN-2026-10-22.md): behavior-backed findings, design limitations and proportionate fixes.
- [Historical 43-tool geometry and Colour Vision update](docs/IA-INTEGRATED-CURRENT-MAIN-2026-10-22.md): historical source taxonomy; follow live 40-tool material inspector schema for current menu, risk-aware interaction priorities and what remains unbuilt.
- [40-tool historical navigation atlas](docs/HUMAN-CENTRED-NAVIGATION-MAP-2026-10-22.md): every current category, named tool and setting, its visual effect and closely interacting controls; distinguishes source implementation from proposals.
- [Applied HCI/creative composition IA assessment](docs/IA-RESEARCH-APPLIED-ASSESSMENT-2026-10-22.md): comparative cognitive walkthroughs, QOC options and structural-proxy findings.
- [Source-driven structural comparison utility](scripts/ia-structure-evaluate.mjs): a no-dependency comparison of two hypothetical trees across 17 explicit artistic goals; it does **not** measure humans.

### Operational requirements for this kind of work

1. State the human's creative **goal** and expected visual change before naming a control. Verify actual behavior using source and the rendered outcome, including active-mode applicability, locks and preservation.
2. Consider information scent, recognition versus recall, adjacent-setting relationships, reversibility, artist exploration, and how the UI provides visible feedback. Use the field guide's four-question cognitive walkthrough; do not substitute source-key groupings for user expectations.
3. Separate **observed user feedback**, **reproducible code facts**, **published research**, **structural/proxy models**, and **agent hypotheses**. Do not fabricate participants, click measurements, eyetracking, AI aesthetic scores or user preferences.
4. Retain stable recipe keys, rendering, stored files, export semantics, and the existing five mobile destinations unless a deliberately scoped change has explicit evidence. A proposed grouping is not approval to rewrite the live editor.
5. Prefer small comparison prototypes, contextual deep links and narrow source checks. Documentation/IA study does not call for exhaustive screenshot suites or extra per-PR CI requirements.

For changes outside UX, the relevant application source, current project documentation and active PRs take precedence. This file is a map of relevant research, not a replacement for specific engineering requirements.

## Artistic systems (original proposals, now partly implemented)

- [Geometry-aware surface treatments and embroidery](docs/GEOMETRY-AWARE-EMBROIDERY-AND-SURFACE-TREATMENTS-PLAN-2026-10-22.md): stitch generation, material coordinate frames, target scopes, physically shaded thread, licenced reuse candidates, mobile Treatments inspector and proportionate delivery gates.
- [Photographic film looks and filters](docs/PHOTO-FILM-LOOKS-AND-FILTERS-PLAN-2026-10-22.md): film colour response, grain, halation, bloom, final-composite processing, seeded export parity, Film as one family of the planned shared Light > Photo finishing inspector, with issue #468.

These documents combine original proposals with later implementation checkpoints. Read current main and the active roadmap before changing features: old artwork, existing UI destinations, and lean CI remain protected.

### Modern photography expansion and queue tracking

- [Modern digital-camera and computational-photo looks](docs/DIGITAL-CAMERA-AND-COMPUTATIONAL-PHOTO-LOOKS-PLAN-2026-10-22.md): smartphone/iPhone-inspired HDR, Pixel-like tonal mapping, DSLR/RAW-like detail, webcam/early-digicam compression and sensor signatures; unified photoLook recipe and compact **Light > Photo** UX. This **supersedes the Film-only menu placement** in the earlier film draft without replacing the film algorithms.
- [Digital-camera look implementation #471](https://github.com/gamesbyian/wallgen/issues/471): D0–D5, coordinated with film #468 via one shared neutral photoLook.
- [Active roadmap queue](docs/ACTIVE-PRODUCT-ROADMAP-2026-10-22.md): explicit **E0–E5** embroidery, **F0–F5** film and **D0–D5** digital camera phases; all are *planned, not implemented*. Update stage status as work is merged. Avoid reopening old 43-tool IA, creating two Photo/Film engines or inflating routine CI.

When researching modern photo looks, separate real camera/ISP research from approximate artistic simulation of an already rendered rainbow scene. Do not imply a synthetic iPhone/DSLR/Webcam preset reproduces proprietary hardware firmware or RAW acquisition.
