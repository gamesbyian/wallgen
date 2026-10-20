# Responsive support scope: portrait first

**Product decision: 2026-10-20.** ROYGBIV is designed primarily for **portrait phone use**. Small-phone landscape editing is not an intended usage pattern and must not consume disproportionate work or delay release.

## In-scope release and visual acceptance

- **Portrait phones:** The 412×892 canonical reference; 320px and 360px narrow-phone cases; the 499/500px CSS breakpoint; portrait sizes at 790px wide; and their cream/dark appearances. Maintain original on-screen actions, seven category tabs, tool chips, source settings, locks, native output, stage/tray separation, safe areas, keyboard/focus and actual canvas legibility.
- **Tablet / desktop:** The 790/791px handoff, 1024px and 1280px desktop layouts, normal laptop/desktop landscape, and their source controls. Usability at the desktop breakpoint, a real range track and unchanged native wallpaper/export geometry remain release-relevant.
- **Other original behaviours:** Normal input, drawing, saves, history, recipe round-trips, exports, accessibility, screen-reader semantics and reduced motion are not relaxed by this decision. Preserve the existing automated witnesses for all orientations. Real-device and aesthetic acceptance remain distinct where explicitly required.

## Out-of-scope for blocking acceptance

- **Phone rotated sideways**, particularly constrained-height viewports such as 600×360 and 700×412, is a non-target secondary layout. Pixel-perfect proportions, alternate side-by-side editing concepts and maximizing the preview there are **not release requirements**.
- [Issue #301](https://github.com/gamesbyian/wallgen/issues/301): the demonstrated 0×0 native canvas at 600×360 remains a truthful **known, low-priority limitation**. It is **not a release blocker** and is not asserted fixed.
- [Issue #294](https://github.com/gamesbyian/wallgen/issues/294): exploratory phone-landscape preview enlargement is **closed as not planned**. The [non-shipping A/B research](landscape-editor-294-option-study.md) remains available if requirements change; do not wire those styles into the application.

A regression in normal **portrait** or **supported tablet/desktop** layouts discovered while investigating a landscape issue is still in scope and must be repaired and tested. Likewise, keep any pre-existing low-cost landscape smoke tests when they help guard shared controls; their success or failure must not be confused with release approval for a non-target orientation.

## Evidence and completion rules

Prioritize actual-source Chromium and physical-device review of portrait reference plates, breakpoint transitions, icon readability and the true source row inventory, in both themes and representative conditional states. **Do not check** an acceptance entry merely because the scope was narrowed: each remaining in-scope capability and visual approval must still be evidenced. Do not mark the old landscape failure fixed, and do not invent a new layout default.

This policy supersedes any wording in older evidence ledgers which described **short-height phone landscape** as a universal redesign/release blocking gate. Those original screenshots and findings remain historically accurate.
