# Agent orientation for ROYGBIV

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
- **Material quality not yet approved:** [#445](https://github.com/gamesbyian/wallgen/issues/445); a validated [seven-image review script](docs/MATERIAL-SEVEN-IMAGE-ART-REVIEW-2026-10-22.md) exists (#453/#458), but actual samples have not been visually inspected in this thread.
- **NEW, planned rather than shipped:** [embroidery #467](https://github.com/gamesbyian/wallgen/issues/467), [film #468](https://github.com/gamesbyian/wallgen/issues/468) and [digital-camera looks #471](https://github.com/gamesbyian/wallgen/issues/471), with full specifications below. **Film and Camera share one versioned photoLook and Light → Photo UI.** Implement small working artwork milestones and keep them independent.
- **Specific usability decisions:** [#444](https://github.com/gamesbyian/wallgen/issues/444) C07/C09/C10/C11 after a few real art tasks, [#365](https://github.com/gamesbyian/wallgen/issues/365) only observed phone tap friction; short Draw issue #422 has been closed, extreme landscape #301 is low-priority.
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

## Proposed artistic systems (plans only, not yet implemented)

- [Geometry-aware surface treatments and embroidery](docs/GEOMETRY-AWARE-EMBROIDERY-AND-SURFACE-TREATMENTS-PLAN-2026-10-22.md): stitch generation, material coordinate frames, target scopes, physically shaded thread, licenced reuse candidates, mobile Treatments inspector and proportionate delivery gates.
- [Photographic film looks and filters](docs/PHOTO-FILM-LOOKS-AND-FILTERS-PLAN-2026-10-22.md): film colour response, grain, halation, bloom, final-composite processing, seeded export parity, Film as one family of the planned shared Light > Photo finishing inspector, with issue #468.

These documents specify **proposals**, not existing controls or renderer behaviour. Reconcile current main and relevant active work before implementation; do not use them to alter baseline artwork, expand CI or redesign all navigation by default.

### Modern photography expansion and queue tracking

- [Modern digital-camera and computational-photo looks](docs/DIGITAL-CAMERA-AND-COMPUTATIONAL-PHOTO-LOOKS-PLAN-2026-10-22.md): smartphone/iPhone-inspired HDR, Pixel-like tonal mapping, DSLR/RAW-like detail, webcam/early-digicam compression and sensor signatures; unified photoLook recipe and compact **Light > Photo** UX. This **supersedes the Film-only menu placement** in the earlier film draft without replacing the film algorithms.
- [Digital-camera look implementation #471](https://github.com/gamesbyian/wallgen/issues/471): D0–D5, coordinated with film #468 via one shared neutral photoLook.
- [Active roadmap queue](docs/ACTIVE-PRODUCT-ROADMAP-2026-10-22.md): explicit **E0–E5** embroidery, **F0–F5** film and **D0–D5** digital camera phases; all are *planned, not implemented*. Update stage status as work is merged. Avoid reopening old 43-tool IA, creating two Photo/Film engines or inflating routine CI.

When researching modern photo looks, separate real camera/ISP research from approximate artistic simulation of an already rendered rainbow scene. Do not imply a synthetic iPhone/DSLR/Webcam preset reproduces proprietary hardware firmware or RAW acquisition.
