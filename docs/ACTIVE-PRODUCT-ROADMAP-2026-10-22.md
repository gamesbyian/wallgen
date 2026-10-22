# ROYGBIV: active product roadmap and work queue

**Updated:** 2026-10-22 · **Source:** `main` at `6ef73211f1449b38fd90fe3755665748f985061b` · **Scope:** this personal, offline-first wallpaper creator.  
**Working rule:** put real artistic capability and data continuity ahead of administrative polish, giant testing matrices, and blanket zero-regression claims. The quick PR gate runs automatically; optional tests are selected because a particular change warrants them.  
**Use together with:** [reconciliation tracker #439](https://github.com/gamesbyian/wallgen/issues/439), [pragmatic CI policy](CI-OPERATIONS-2026-10-22.md), [geometry system specification](SHAPE-PATH-LIBRARY-AND-SCATTERED-SHAPES-PLAN-2026-10-21.md), [geometry implementation queue](SHAPE-PATH-LIBRARY-IMPLEMENTATION-QUEUE-2026-10-21.md), [terminology audit](UI-TERMINOLOGY-AUDIT-2026-10-21.md).

## Integrated checkpoint (2026-10-22)

Three formerly stranded features are now on `main`, not merely queued:

- [#435](https://github.com/gamesbyian/wallgen/pull/435) **Russian production diary**, importer and explicitly partial provenance archives: merged `21ee31f`.
- [#434](https://github.com/gamesbyian/wallgen/pull/434) **Shape & Path Library**, IndexedDB reuse, shape backups, scattered circles and imported silhouette stamp support: merged `b806497`. Focused Node integrity/backup checks and one real Chromium IndexedDB/image-import journey passed. The named **Rainbow Orbits** preset, effortless single-object editing and additional portability belong to #443, not a duplicate foundation.
- [#432](https://github.com/gamesbyian/wallgen/pull/432) **Colour Vision Preview**, display-only Machado/Brettel simulation and split comparison: merged `6ef7321` without replacing the geometry editor. Quick checks passed; personal-device optical/performance observations are still unverified.

The editor now has **7 categories / 43 tools / 95 source editor settings**, plus view-only vision and a distinct reusable shape/path library. Frozen 40/87 source inventories are historical verification artifacts; rectify those under #444 without removing new tools. A detailed [human-centred navigation study, PR #446](https://github.com/gamesbyian/wallgen/pull/446), has been authored from the earlier 40-tool baseline and awaits an integrated-main addendum. Retain its analysis; don't equate conceptual approval with shipping a redesign.

**Current unresolved priority:** finish #443's user-facing Rainbow Orbits preset and direct compositional editing; integrate #446's human navigation map with today's settings; inspect actual texture quality #445; fix #422's obstructed Draw point when convenient. Leave extreme landscape #301 as acknowledged low priority. The single old video-preparation draft #53 remains a preserve/port-or-close decision.

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
| P1 | [#443 new art modes](https://github.com/gamesbyian/wallgen/issues/443) | Scattered circles and imported shape stamps now exist via #434; **Rainbow Orbits named preset and direct editing** still missing | Make the seven-circle reference wallpaper effortless to generate, adjust, save and reproduce | Useful art outcome, not hundreds of screenshot states |
| P2 | [#444 conceptual navigation](https://github.com/gamesbyian/wallgen/issues/444) | Baseline design map [#446](https://github.com/gamesbyian/wallgen/pull/446) authored for 40 tools; current source has 43 tools/95 keys | Reconcile addendum then consider selective flow improvements | Source-backed intent/effect map and practical navigation choices, no large refactor by default |
| P2 | [#445 texture quality](https://github.com/gamesbyian/wallgen/issues/445) | Texture displacement was repaired in #430; subjective realism not freshly assessed | Inspect material code and 3×2 samples; file concrete defects only | Material character and distortion are believable enough for personal creative use |
| P2 | [#422 Draw occlusion](https://github.com/gamesbyian/wallgen/issues/422), [#365 targets](https://github.com/gamesbyian/wallgen/issues/365) | Some genuinely awkward controls remain | Solve measured 500×700 selected point obstruction; prioritize actual user annoyances | Unblocked point editing and visibly better frequent taps without making the canvas smaller |
| P3 | [#53 video prep](https://github.com/gamesbyian/wallgen/pull/53) | Ancient draft; no footage permitted by scope | Inspect usefulness of source, port only self-contained safe manifest helper | Disposition recorded, no unfinished open ghost PR |
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

Current snapshot: merged PRs #435/#434/#432; outstanding PRs #446 human-centred design study and #53 video preparer; open issues #439, #422, #365, #301, #443, #444, #445. `main` includes lean CI via #441/#442; 12 active Actions definitions, 54 archived one-off suites. Two Pages deployment paths still appear in Actions, both historically successful, and can be consolidated via repository settings when convenient.

**Update rule:** after each integration, mark the corresponding board row merged and update its remaining next action. Keep this short board authoritative, link the older detailed plans rather than cloning them into a second giant unchecked list.
