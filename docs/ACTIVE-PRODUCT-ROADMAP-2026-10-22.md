# ROYGBIV: active product roadmap and work queue

## Live UX delivery and completion queue (2026-10-22)

**Current `main` checkpoint:** 7 Edit categories, **40 named tool cards, 95 canonical schema setting keys**; separate dynamic interior-element objects, Shape & Path Library, five mobile destinations. This supersedes the historical 40/87 and intermediate 43/95 maps for **live navigation**. Old snapshots remain historical research records, not today's menu specification. The original recipe/PNG/Saved identifiers were not migrated for these navigation fixes.

**Shipped and tested:** [#452](https://github.com/gamesbyian/wallgen/pull/452) truthful overlap/tonal choice; [#454](https://github.com/gamesbyian/wallgen/pull/454) contour prerequisites / Variation naming; [#455](https://github.com/gamesbyian/wallgen/pull/455) exact-field search and selected artistic-intent terms; [#459](https://github.com/gamesbyian/wallgen/pull/459) unified Texture Layer 1–3 with Material/Finish views (**43→40 tool cards**); [#460](https://github.com/gamesbyian/wallgen/pull/460) same selected interior element switchable in Style/Wave/Placement/Ink & Targets; [#461](https://github.com/gamesbyian/wallgen/pull/461) honest scattered size and imported-placeholder feedback; [#462](https://github.com/gamesbyian/wallgen/pull/462) direct Light/Shadow/Glow links; [#463](https://github.com/gamesbyian/wallgen/pull/463) dormant Dots/Motif Scale activation routes; [#465](https://github.com/gamesbyian/wallgen/pull/465) deliberate Design Type → relevant Geometry next step. All applicable existing PR Node CI passed; **a new physical-phone usability or multi-breakpoint visual acceptance was not run for these changes**.

**Outstanding, not silently closed:** C07 search multiple-match disambiguation and keyboard flow; C09 optional reduction of the five interior-element *tool* destinations into a cohesive selected-object inspector (persistent selection is already shipped); C10 evaluate whether direct lighting links suffice before making a giant mixed-effects card; C11 optional intent-first Arrange/Form prototype; C03 decision on temporary silhouette placeholder versus alternative empty state; targeted Pixel portrait fit, screen-reader/touch/restore checks for the recent controls; review other live semantic findings C14–C17 before marking them inapplicable. Remain within a small evidence budget and avoid compulsory CI screenshot matrices. Main [roadmap](docs/ACTIVE-PRODUCT-ROADMAP-2026-10-22.md) and [UX queue](docs/UI-REDESIGN-IMPLEMENTATION-QUEUE.md) are the operational tracking authorities; [#444](https://github.com/gamesbyian/wallgen/issues/444) remains the umbrella.

### Execution order and closure gates

| Next | Work / owner | Concrete next action | Evidence and closure condition |
|---|---|---|---|
| **P1 · UX agent, next focused session** | **Phone-first acceptance of #459–#465** | On a real 9:19 portrait screen, spot-check 320-ish compact and regular portrait if available: each Texture layer Material↔Finish and rotation; selected interior element locked/unlocked and Undo; Dots activation; links and design-type continuation; scattered warning. | Log *actual observations* and repair only witnessed clipping/inaccessible controls. Node passing alone is not visual acceptance. |
| **P2 · UX agent** | **C09: one object, five scattered element destinations** | Prototype a single selected-element inspector or tighter navigation using canonical interior IDs and live original handlers; compare with the shipped per-tool switcher first. | No lost object targeting/colour chips, focus, order, Undo, stack lock or mobile preview space; choose based on real interaction, not route-score alone. |
| **P2 · UX agent** | **C07 search disambiguation** | Check representative collisions/aliases; if misroutes occur, add small labelled multiple-result selection and explicit inactive prerequisite cues. | Exact setting, canonical source, keyboard focus, mode gating and no form-submit regressions; don't build a free-form NLP service. |
| **P2 · UX/product** | **C10 light links and C11 design-type flow** | Evaluate whether shipped cross-links/Continue action already resolve user tasks; consider compact Arrange/Form prototype only against a current-flow baseline. | Record discoverability, hits and space trade-offs; no mass taxonomy migration without positive evidence. |
| **P2 · shape/editor agent** | **C03 imported silhouette fallback** | Decide whether explicit *temporary circles* are sufficient or imported-with-no-asset should render empty/offer inline library entry. | Safe deterministic fallback, recoverable imported geometry, Undo/Saved correctness; don't silently change content. |
| **P3 · audit agent** | **C14–C17 / terminology and map drift** | Re-run source semantic audit, compare 40/95 schema and current pending feature PRs; clear superseded findings or open tiny reproducible issues. | Current receipts and status per finding, with only relevant code evidence. |

**Ordering:** first qualify the smallest real-phone journeys, then decide whether C09 consolidation produces a real gain, followed by C07 if confusion is demonstrated. Cross-category context shortcuts are shipped; do not requeue them as unbuilt. Embroidery and film-filter work on separate [PR #464](https://github.com/gamesbyian/wallgen/pull/464) is a planning track, not part of these merged UX implementations. The semantic findings document is research/evidence; this board is the actionable queue.


---

**Updated:** 2026-10-22 · **Live UX checkpoint:** `main` after #465 (40 named tools / 95 keys); earlier embedded SHA is historical · **Scope:** this personal, offline-first wallpaper creator.  
**Working rule:** put real artistic capability and data continuity ahead of administrative polish, giant testing matrices, and blanket zero-regression claims. The quick PR gate runs automatically; optional tests are selected because a particular change warrants them.  
**Use together with:** [reconciliation tracker #439](https://github.com/gamesbyian/wallgen/issues/439), [pragmatic CI policy](CI-OPERATIONS-2026-10-22.md), [geometry system specification](SHAPE-PATH-LIBRARY-AND-SCATTERED-SHAPES-PLAN-2026-10-21.md), [geometry implementation queue](SHAPE-PATH-LIBRARY-IMPLEMENTATION-QUEUE-2026-10-21.md), [terminology audit](UI-TERMINOLOGY-AUDIT-2026-10-21.md).

## Integrated checkpoint (2026-10-22)

**Later same-day progress:** PR #446 integration of the human-centred map; #449 portable individual-circle/silhouette editing; #53 safe manifest salvage; #451 short-portrait Draw panel unblocking candidate; #450 semantic audit, with targeted follow-up for misleading scatter-spacing state, missing imported shape fallback and optional tonal construction. Their current status is reflected in the table below; do not requeue already merged implementations.


Three formerly stranded features are now on `main`, not merely queued:

- [#435](https://github.com/gamesbyian/wallgen/pull/435) **Russian production diary**, importer and explicitly partial provenance archives: merged `21ee31f`.
- [#434](https://github.com/gamesbyian/wallgen/pull/434) **Shape & Path Library**, IndexedDB reuse, shape backups, scattered circles and imported silhouette stamp support: merged `b806497`. Focused Node integrity/backup checks and one real Chromium IndexedDB/image-import journey passed. The named **Rainbow Orbits** preset, effortless single-object editing and additional portability belong to #443, not a duplicate foundation.
- [#432](https://github.com/gamesbyian/wallgen/pull/432) **Colour Vision Preview**, display-only Machado/Brettel simulation and split comparison: merged `6ef7321` without replacing the geometry editor. Quick checks passed; personal-device optical/performance observations are still unverified.

At the **historical integration checkpoint**, the editor had **7 categories / 43 tools / 95 source editor settings**, plus view-only vision and a distinct reusable shape/path library. Frozen 40/87 source inventories are historical verification artifacts; rectify those under #444 without removing new tools. A detailed [human-centred navigation study, PR #446](https://github.com/gamesbyian/wallgen/pull/446), has been authored from the earlier 40-tool baseline and awaits an integrated-main addendum. Retain its analysis; don't equate conceptual approval with shipping a redesign.

**Current unresolved priority:** review actual texture quality #445; refine only the navigation mismatches that demonstrably make artwork harder to create (#444); verify the short-portrait Draw control remedy #422 and react to real user friction. Rainbow Orbits and individual circle/shape editing are already on main. The 17 source-backed semantic findings from #450 form a scoped candidate backlog, not a mandate to implement all 17. Leave extreme landscape #301 as acknowledged low priority. The single old video-preparation draft #53 remains a preserve/port-or-close decision.

## Product objectives, in priority order

1. **Preserve and integrate work already done.** Get the Russian diary and repeatable archive flow (#435) safely into `main`; integrate reusable geometry (#434); integrate colour vision (#432). Do not duplicate unmerged implementations on new branches. Protect existing personal artwork, favourites, imported paths and round-trip recipes.
2. **Unlock new artwork.** Use the geometry library to ship scattered ROYGBIV circles and Rainbow Orbits, then image-defined silhouettes and compound region stamps: [#443](https://github.com/gamesbyian/wallgen/issues/443). A minimal creative interaction beats a perfect multi-mode UI.
3. **Make the settings intelligible.** Produce a source-backed human-concept navigation map, compare alternatives and act on high-impact moves, not superficial relabeling: [#444](https://github.com/gamesbyian/wallgen/issues/444).
4. **Improve artistic texture where warranted.** Examine actual materials and displacement, sample a tiny set, repair confirmed repetition or realism defects: [#445](https://github.com/gamesbyian/wallgen/issues/445).
5. **Fix experienced friction, not hypothetical ergonomic edge cases.** Correct the 500×700 Draw overlay occlusion [#422](https://github.com/gamesbyian/wallgen/issues/422), then cherry-pick real, visible touch-target improvements from parent [#365](https://github.com/gamesbyian/wallgen/issues/365). Keep 600×360 landscape collapse [#301](https://github.com/gamesbyian/wallgen/issues/301) low-priority unless it affects supported views.
6. **Resolve small stranded branches and housekeeping.** Decide whether old phone-video preparation draft #53 is valuable enough to forward-port; otherwise close with preservation note. De-duplicate GitHub Pages build configuration if useful; leave branch protection optional for a solo app. Keep [#439](https://github.com/gamesbyian/wallgen/issues/439) until PR dispositions are reconciled.

## Immediate execution board

| Priority | Work | Currently | First executable action | Closure means |
|---|---|---|---|---|
| Done | [#435 Russian diary](https://github.com/gamesbyian/wallgen/pull/435) | **Merged:** archive and safe importer in main, with authentic full transcripts explicitly unavailable | Add genuine exported conversation transcripts if later obtained, not a release gate | Current provenance and importer are integrated; no invented two-sided coverage |
| Done | [#434 geometry library](https://github.com/gamesbyian/wallgen/pull/434) | **Merged:** reusable shapes/paths, local library, import/export, scattered composition foundation | Use the new tools artistically; advance #443 named preset/edit UX | Foundation on main with focused data-safety and Chromium checks; UI snapshot maintenance #444 |
| Done | [#432 colour-vision preview](https://github.com/gamesbyian/wallgen/pull/432) | **Merged:** simulation, comparison UI and display-only integration | Optional physical-device glance only where useful | On main without changing native recipe/PNG export; no visual-perfection gate |
| Done / optional polish | [#443 shapes & Rainbow Orbits](https://github.com/gamesbyian/wallgen/issues/443) | **Merged:** named Rainbow Orbits preset already existed in #434; #449 adds independent circle/silhouette position/size/reset with recipe and Undo | Optionally consider direct finger dragging, advanced ordering and ZIP portability only if artistically useful | Seeded seven-circle design, saved overrides and compound stamp geometry are working foundations |
| P1 device check / P2 follow-ups | [#444 creative navigation](https://github.com/gamesbyian/wallgen/issues/444) | **Merged:** research #446/#450 and focused implementation #452/#454/#455/#459/#460/#461/#462/#463/#465 | Run focused portrait UX spot-check; then prioritize C09 selected-element inspector or C07 search ambiguity against observed friction | Research taxonomy and focused mapping checks on main; source IDs remain stable |
| P2 | [#445 texture quality](https://github.com/gamesbyian/wallgen/issues/445) | Texture displacement was repaired in #430; subjective realism not freshly assessed | Inspect material code and 3×2 samples; file concrete defects only | Material character and distortion are believable enough for personal creative use |
| Verification | [#422 Draw occlusion](https://github.com/gamesbyian/wallgen/issues/422), [#365 targets](https://github.com/gamesbyian/wallgen/issues/365) | **Candidate merged #451:** short portrait Draw controls auto-collapse into right gutter when editing anchors | Confirm 500×700 actual finger hit ownership if convenient; address further *experienced* touch friction only | Source-level remedy merged, hardware/browser hit test explicitly unverified |
| Done | [#53 manifest preparation](https://github.com/gamesbyian/wallgen/pull/53) | **Merged:** safe JSON-only manifest helper salvaged onto latest main | Do not record, render or dispatch without an explicit separate request | Old draft reconciled, no media produced |
| P3 | [#301 landscape](https://github.com/gamesbyian/wallgen/issues/301) | Known 600×360 collapse | Defer | Work only if it affects supported portrait or normal desktop views |

## Actual dependencies and collisions

```text
#435 archive --------> merge independently, then later recover complete authentic exports
#434 library --------> #443 circles/preset --------> image silhouette and region stamps
                 \
                  \---> #444 map refresh (new library tools)
#432 colour vision --> reconcile #434's index.html/app presentation, not renderer/export
#444 navigation -----> selective moves, terminology and conditional control cleanup
#445 material -------> source-driven realism fixes (can proceed independently)
#422 touch ----------> #365 broader ergonomic backlog (do not expand scope by default)
#53 video prep ------> disposition independent of user wallpaper features
```

**Potential merge conflicts:** #434 and #432 both affect the editor and `index.html`, and #435 modifies README from an old base. Integrate by semantic behavior, not “theirs wins.” Scripts and archives should not silently overwrite more recent contents.

## Implementation principles

- **Each patch should do something tangible.** One user-visible capability or a directly enabling foundation. Stage optional enhancements afterward. Avoid one-assertion PRs and administrative churn.
- **Personal artwork is the high-stakes asset.** Preserve recipe v1/v2 recovery, PNG metadata, image assets, IndexedDB/library semantics, favourites and undo. Changes in schema/import/storage get focused round-trip tests and backups; visual spacing does not demand a regression atlas.
- **Simple changes:** Node quick check plus an informed glance; **new renderer geometry:** focused unit tests and one representative wallpaper; **persistence changes:** conflict and import/export recovery tests; **major UI flow:** one supported phone viewport, not every breakpoint.
- **Truthful statuses:** planned, implemented on branch, merged, tested, user/device-approved are separate claims. Optional old browser suites are not required checks. A failure in a retired 40-tool inventory may mean the inventory is stale, not that three new controls should be deleted.
- **No compulsory physical-device human approval** to merge low-stakes work. Still mention unverified device/visual concerns that materially impact the change, rather than describing them as passed.
- **Retain source and history.** Do not delete a feature branch until recoverable unique work is on main or its disposition is explicitly recorded. An unfinished request is not closed by documentation alone.

## Reconciliation and housekeeping

Current snapshot: merged #435, #434, #432, #446 navigation research, #449 individual-shape editing, #450 semantic audit, #53 preparation-only video manifest, and #451 short-portrait Draw candidate. No legacy unfinished PRs remain. Open product queues #443, #444, #445; live ergonomic issues #422, #365 and low-priority #301. The current CI is one quick PR gate, with optional deep suites. `main` includes lean CI via #441/#442; 12 active Actions definitions, 54 archived one-off suites. Two Pages deployment paths still appear in Actions, both historically successful, and can be consolidated via repository settings when convenient.

**Update rule:** after each integration, mark the corresponding board row merged and update its remaining next action. Keep this short board authoritative, link the older detailed plans rather than cloning them into a second giant unchecked list.

## Newly specified artistic workstreams: embroidery and photographic camera finishing (2026-10-22)

**Documentation status only, not an implementation claim.** Tracked in [PR #464](https://github.com/gamesbyian/wallgen/pull/464). This section is part of the active queue and must not disappear during roadmap reconciliation. Previous highest-priority integration/material-art tasks and the lightweight CI policy remain in force.

| Queue priority | Workstream / specification | Current status | First concrete implementation action | Accept/close only when |
| --- | --- | --- | --- | --- |
| P2 artistic expansion | [Geometry-aware material targeting and embroidery](GEOMETRY-AWARE-EMBROIDERY-AND-SURFACE-TREATMENTS-PLAN-2026-10-22.md) | **Planned only**, E0–E5; not implemented | E0 compare borrowed stitch/fill code and benchmark Canvas2D/WASM; then E1 semantic assignments; link #445 material findings | Multiple targeted stripes, shapes, regions, outlines and interior elements show genuine geometry-following thread; compact Texture > Treatments UX, saved deterministic recipe and export parity |
| P2 artistic expansion | [Photographic film looks](PHOTO-FILM-LOOKS-AND-FILTERS-PLAN-2026-10-22.md) | **Planned only**, shared F0–F5; not implemented | F0 create a tiny film colour/grain/halation comparison atlas with actual ROYGBIV art; adopt unified photoLook model | Film looks configurable under one Photo tool, correct grain/optics and whole-image previews/exports, fully reversible and reproducible |
| P2 artistic expansion | [Modern digital camera, smartphone HDR, DSLR and webcam looks](DIGITAL-CAMERA-AND-COMPUTATIONAL-PHOTO-LOOKS-PLAN-2026-10-22.md) | **Planned only**, D0–D5; not implemented | D0 evaluate smartphone HDR/RAW DSLR/webcam signatures; D1 settle unified photoLook recipe **before** film F1 | Camera/Film categories and named digital presets, tone/detail/signal controls, deterministic virtual capture artifacts, accessible Photo UX and stable high-resolution PNG |
| Shared enabling | Photo postprocessing and renderer integration | **Planned only** | After D1, implement one final compositor/worker-export/headless film+digital pipeline, honoring nudge and colour-vision display-only mode | A single finishing renderer with neutral no-op, bounded memory, baseline-preserving old recipes, no parallel film/camera implementations |

**Dependencies and anti-overlap:** E0/E1 target role/masks, not the whole-image Photo renderer; film and digital **share** final finishing and normalized `photoLook`, and should be integrated as coordinated increments rather than duplicate tools. Embroidery can ship independently and can feed an eventual photo look. Maintain current 7 editor categories and 5 mobile destinations. Initial UI: **Texture > Treatments** (embroidered objects) and **Light > Photo** (Camera/Film look family, with Looks/Tone/Detail/Character compact views). Update the semantic setting audit and work queue whenever new controls are actually introduced. The existing 3 material layers and their Material/Finish inspectors remain untouched.

**Work-state rule:** "Documented" is not "started", "merged" or "done". On each implementation PR reference E#, F# and D# stage names, update this table and leave remaining phases open. Use representative scene fixtures, one real phone/Chrome check and the existing quick gate; no large mandatory image matrix. Any third-party source port must record credit, exact source revision and compatible licences. See [AGENTS.md](../AGENTS.md) for onboarding.
