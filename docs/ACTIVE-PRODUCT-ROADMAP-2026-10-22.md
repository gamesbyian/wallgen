# ROYGBIV: active product roadmap and work queue

**Updated:** 2026-10-22 · **Source:** `main` at `a4a685021f789d6911484a926d858b192a0367ab` · **Scope:** this personal, offline-first wallpaper creator.  
**Working rule:** put real artistic capability and data continuity ahead of administrative polish, giant testing matrices, and blanket zero-regression claims. The quick PR gate runs automatically; optional tests are selected because a particular change warrants them.  
**Use together with:** [reconciliation tracker #439](https://github.com/gamesbyian/wallgen/issues/439), [pragmatic CI policy](CI-OPERATIONS-2026-10-22.md), [geometry system specification](SHAPE-PATH-LIBRARY-AND-SCATTERED-SHAPES-PLAN-2026-10-21.md), [geometry implementation queue](SHAPE-PATH-LIBRARY-IMPLEMENTATION-QUEUE-2026-10-21.md), [terminology audit](UI-TERMINOLOGY-AUDIT-2026-10-21.md).

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
| P0 | [#435 Russian diary](https://github.com/gamesbyian/wallgen/pull/435) | Non-draft branch, 20 literary episodes; 0 verified full two-sided transcripts | Integrate its unique files with current main without overwriting newer README/other transcripts; run importer and quick source tests | Diary, manifest, explicit partial-data disclosures and safe importer on main; authentic transcript restoration remains a separate future task |
| P0 | [#434 geometry library](https://github.com/gamesbyian/wallgen/pull/434) | Draft, true 43-tool versus frozen 40-tool contract failures; independent image-shape browser timeout | Merge latest main into implementation, update only genuinely stale UI inventories and test actual image-shape activation | Save/reuse/export/import shapes and paths with explicit durability warning/fallback and data-preserving recovery on main |
| P1 | [#432 colour-vision preview](https://github.com/gamesbyian/wallgen/pull/432) | Draft, substantive past Chromium and Node evidence; overlaps `index.html` with #434 | Reconcile current main and #434 interface before applying; verify display-only simulation and unchanged PNG/recipe export | Accessible opt-in simulation and split view available, no export alteration; device checks only for issues actually found |
| P1 | [#443 new art modes](https://github.com/gamesbyian/wallgen/issues/443) | Full technical specification but artist-facing steps not shipped | Implement circles, off-canvas placement and preset first | One real seven-colour scattered-circles wallpaper can be generated, saved, edited, exported and reproduced |
| P2 | [#444 conceptual navigation](https://github.com/gamesbyian/wallgen/issues/444) | Terminology audit exists; conceptual behavior map requested | Inventory source-backed controls and settings; rank effect size, frequency, interactions, flow | Complete comparison map and first high-value source-preserving UX changes |
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

Current snapshot: open PRs #435, #434, #432, #53; open issues #439, #422, #365, #301; newly queued issues #443, #444, #445. `main` includes lean CI via #441/#442; 12 active Actions definitions, 54 archived one-off suites. Two Pages deployment paths still appear in Actions, both historically successful, and can be consolidated via repository settings when convenient.

**Update rule:** after each integration, mark the corresponding board row merged and update its remaining next action. Keep this short board authoritative, link the older detailed plans rather than cloning them into a second giant unchecked list.
