# Focus locked-control guidance truthfulness (20 October 2026)

**Independent acceptance lane:** A/B source fidelity and accessibility, entries #11 and #15. Human and physical-device requirements remain open.

## Observed source contradiction

When a source range was explicitly locked, `focusUnavailableReason` always told users to **open All controls to unlock it**, while the same opt-in Focus interface visibly provided a functioning **Unlock** button delegated to that exact source lock. The old wording falsely implied a compulsory mode switch and increased task cost, particularly for keyboard/screen-reader users.

## Narrow implementation

`src/editor-focus.js` now supplies the Focus help formatter with `unlockHere`, true only when the original source lock is present and enabled. In that state the live help says **Choose Unlock here to edit it**. If no working Focus unlock action exists, the original fallback to All remains truthful. This changes no recipe field, toggle identity, lock model, input event, focus policy, visuals or default All inspector.

`tests/editor-focus.test.js` qualifies both direct-unlock and fallback wording. The existing real-Chromium `tests/independent-focus-transitions.mjs` now checks locked Material controls expose the direct Unlock instruction, never the false compulsory All instruction, and that activating the very same button unlocks the canonical recipe setting. That test runs across 412×892 / 700×412 and both themes.

**Status:** pending exact-head passing CI; no automated acceptance signoff is credited until then. Not human preference, physical Android or AT speech approval.
