# Focus versus full-inspector technical A/B acceptance

Date: 20 October 2026. Status: **technical A/B evaluation complete**; human preference and physical assistive-technology testing remain outside this approval.

## Decision and finite acceptance contract

The original queue asks to **A/B evaluate Focus versus the full inspector in Path, Material and Colour** (including disabled/locked states), without changing the default absent user testing. The technical comparison is now complete: Focus opt-in and All must point to the *same* underlying source setting, preserve full normalized recipe and native Undo semantics, show accurate dormant/locked information, and permit reliable keyboard and pointer return to All. The task does **not** ask to choose Focus as a default or announce a winner before a human study. All remains the default, including after cold open and responsive handoff.

## Existing merged real-browser sources

| A/B contract | Independently verified source and result |
| --- | --- |
| Path live and inactive, Material live and locked, Colour no-slider | [#280](https://github.com/gamesbyian/wallgen/pull/280), [Chromium 39396266665](https://github.com/gamesbyian/wallgen/actions/runs/39396266665), 30 real cases at 320/412px portrait and 700px landscape in cream/dark: source card range and opt-in Focus chip parity, unchanged recipe on readonly toggle, no fabricated Colour sliders, named unavailable state, direct All recovery. Measured representative post-tool edit takes 2 interactions with All and 3 with Focus, not a preference claim. |
| Cold keyboard entry, reduced-motion and responsive recovery | [#288](https://github.com/gamesbyian/wallgen/pull/288), [green 39402261160](https://github.com/gamesbyian/wallgen/actions/runs/39402261160): four native Tab/Enter/Arrow/Shift-Tab journeys; [#305](https://github.com/gamesbyian/wallgen/pull/305), [green 39405800489](https://github.com/gamesbyian/wallgen/actions/runs/39405800489): 12/12 790/791 focus-hand-off cases including locked and sliderless states, fixing a genuine stranded-focus defect. |
| All applicable original cards, locked and empty states | [#311](https://github.com/gamesbyian/wallgen/pull/311), [green 39407144287](https://github.com/gamesbyian/wallgen/actions/runs/39407144287): 182 runtime-applicable named tool visits, 178 source vs Focus range checks, exactly 89 enabled and 89 unavailable/locked witnesses, 83 zero-slider tool cases; source recipe never changed by toggling Focus or selecting chips. |
| True editing, reversal, and source isolation | [#324](https://github.com/gamesbyian/wallgen/pull/324), [green 39481425339](https://github.com/gamesbyian/wallgen/actions/runs/39481425339): 23 paired actual native ArrowRight edits and ArrowLeft reversals across five Paths/Radial/Regions source scenes. Same complete recipe in Focus and All after each operation and after Focus exit. |
| Undo cost and proxy synchronization | [#333](https://github.com/gamesbyian/wallgen/pull/333), [green 39482904733](https://github.com/gamesbyian/wallgen/actions/runs/39482904733): 4/4 original-vs-Focus single-edit native-key histories across Path, Material, Radial and Regions; exactly one original Undo checkpoint each, exact restored recipe after one Undo, zero stale proxy value or extra checkpoint. |
| Honest disabled instruction | [#326](https://github.com/gamesbyian/wallgen/pull/326), [green 39481070876](https://github.com/gamesbyian/wallgen/actions/runs/39481070876): fixed misleading text suggesting All was necessary despite an already-available direct Unlock in Focus; tested lock/direct-Unlock and All-only fallback. |
| Full source named-tool WCAG regression context | [#348](https://github.com/gamesbyian/wallgen/pull/348), [all-tool axe 39527554777](https://github.com/gamesbyian/wallgen/actions/runs/39527554777): 156/156 source tool-card scans at 412/1024px and cream/dark with zero automated WCAG A/AA violations; does not substitute for physical AT. |

## Explicitly **not** concluded

This technical A/B does not measure preference, reading speed, discoverability, subjective comfort, completion time with real participants, or how a person perceives locked and dormant labels. No user testing was performed. **Do not change the All default** based on these results. A future optional user preference comparison and native TalkBack/screen-reader narration are still appropriate release research, along with aesthetic and physical-device gates elsewhere in the queue. These are not reclassified as passed.

We are closing only the now-executed **technical A/B evaluation** asked for by the acceptance line, with traceable real-browser, exact-head and CI evidence. No feature source, test expectations or default values are changed in this documentation acceptance.
