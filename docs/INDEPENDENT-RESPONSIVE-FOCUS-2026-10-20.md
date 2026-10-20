# Responsive Focus keyboard handoff experiment (20 October 2026)

**Lane:** independent adversarial/accessibility, unchecked acceptance entries #2/#11/#15. From current main after merged #280/#288/#302. This supplements the green 92-screen axe and four cold-keyboard Focus journeys without interfering with the visual, control-inventory, or gallery/export owners.

## Counterexample hypothesis

`src/editor-focus.js` closes Focus after `matchMedia('(max-width:790px)')` transitions to desktop. Its `setActive(false)` calls `toggle.focus({preventScroll:true})`. The Focus toggle is a **mobile-only** editor element. A user editing its slider with a keyboard while a browser/phone viewport crosses 790→791px may lose focus to `document.body` or a hidden control. Previous viewport tests only asserted Focus was closed and the recipe unmodified.

`tests/independent-responsive-focus-handoff.mjs` stages an actual focused, enabled Path Geometry source adjustment at 790×892 and 700×412, cream/dark. It performs a real Chromium viewport change to 791×892. It requires an honest, visible, hit-testable DOM focus destination after the media-query event; one keyboard Tab continuing to a visible control; original recipe preserved; and no browser errors. It records failures/screenshots. The starting focus is explicitly programmatic; this is **not** a claim of an all-keyboard cold start or native physical-device action.

The dedicated `independent-responsive-focus.yml` job executes source app + native Chromium, with artefacts, unit tests and an exact source head. **No production repair is justified until the browser hypothesis is tested.** Record CI outcome before changing this document or accepting the behaviour. Human/device gates remain open.

## Reproduced defect and repair

**Source head before repair:** `ff94b87a044260f19ffa3c950097dda269ed13b7`. [CI 39404252957](https://github.com/gamesbyian/wallgen/actions/runs/39404252957) failed in all 4 combinations (790×892 or 700×412 × cream/dark): changing viewport to 791px closed Focus and preserved the wallpaper recipe but stranded the active keyboard user at `document.body`.

**Targeted repair:** `src/editor-focus.js` distinguishes a responsive Focus exit from the user's ordinary All-controls exit. Upon desktop transition, when Focus actually was active and the focused element was inside Focus or lost to body, restore focus to the original enabled source slider **after** its full inspector reappears. If that source is disabled or locked, focus the selected real tool tab instead. Scroll the chosen original control into physical view. A breakpoint change with Focus inactive does not move keyboard focus. The ordinary All button still focuses its mobile toggle; no wallpaper setting, inspector default, generated image, timing or recipe schema changed.

**First passing head:** `9bd3ec822b8b6106408871fb364c727688dc62d8`, [CI 39404696286](https://github.com/gamesbyian/wallgen/actions/runs/39404696286). All 4 previously failing combinations passed; computed focus returned to the exact `shapeDepth` source range, its centre was hit-testable, the next Tab remained visible, and the full normalized recipe was identical.

**Extended locked-state witness:** `75f94aa5d2b0450cee5f7a65d463c9ec21d30784`, [CI 39404987880](https://github.com/gamesbyian/wallgen/actions/runs/39404987880) passed **8/8**: the original 4 live-slider cases and 4 locked/disabled-slider cases. The latter all focused the live `.editor-tool-tab` rather than an unavailable slider, kept its hit-testable centre, continued keyboard navigation and preserved the exact recipe. Structured JSON and actual Chromium screenshots are uploaded by the job. Existing automated suites and full accessibility gate require independent CI confirmation before integration.

**Acceptance:** This fixes and qualifies **only** the source-backed breakpoint keyboard continuity for enabled and locked Path Geometry sliders under headless Chromium. No claim is made of native Android, physical keyboard, AT speech, full WCAG conformance, human Focus-preference approval or the eight unwired SVG aesthetic judgments. Keep acceptance entries **2, 11, 15 unchecked**.
