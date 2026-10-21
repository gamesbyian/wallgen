# Final human and device visual sign-off

**Status:** pending real participant/device inspection. All automated control, output, accessibility, row, candidate-icon, and screen-inventory acceptance items are completed separately in [the implementation queue](../UI-REDESIGN-IMPLEMENTATION-QUEUE.md). Do not tick the final supported-viewport gate from emulation or screen captures alone.

## Five-minute portrait phone session

Use real mobile Chrome on a normal phone in **portrait**, normal system text size first, then larger text if you normally use it. Open the current ROYGBIV build directly, not a recorded mockup. A real phone has browser chrome, safe areas, OS keyboard, touch tolerance, scroll inertia and font rasterization that CI emulation cannot certify.

- [ ] **Studio:** the wallpaper remains fully framed, left/right actions are visible, five destinations have readable names; Fit/Zoom work without hiding artwork or popping under browser bars. Try thumbs without precise aiming.
- [ ] **Edit (the busiest view):** switch Path → Material → Colour → Details. Active, locked, inactive and no-slider controls remain understandable; all seven categories and each named tool can be reached without cramped or unreachable touch targets. Try a 90° rotation shortcut and a numeric slider; test a disabled Material layer and re-enable it.
- [ ] **Explore/Saved:** generate, favourite, switch tabs, restore a wallpaper. Tiles, image previews and empty/loading states remain legible; no clipping in the gallery or obscured content at the bottom.
- [ ] **More:** reach grouped Seed, Position, Metadata and export functions by scrolling; open/close Metadata and return to Studio. No stuck focus, clipped close action or trapped scroll.
- [ ] **Draw:** create one quick line, enter Edit points, Cancel and Apply in turn. Footer and anchor controls remain visible, and the keyboard/safe area do not obscure essential actions.

Afterwards compare [12 actual cream/dark implementation screenshots](ACTUAL-IMPLEMENTATION-COMPANION.md) with what the real browser showed. Those screens were captured in source Chromium at 412×892. They are **reference witnesses**, not a replacement for your live session. An unanticipated screen difference is useful evidence to report, not reason to update the schematic to match a bug.

## Two human judgment questions

1. Is the *actual* compact row family at your reading distance comfortably readable and attractive, including dormant/locked labels and the dense Material six-control rotation row? Document any spacing/contrast/style objections rather than treating successful source geometry as preference.
2. Are the existing icons recognizable, and are the [eight independently reviewed unwired candidate glyphs](INDEPENDENT-ICON-OPTICAL-DISPOSITION-2026-10-20.md) visually acceptable for the **specific** labelled actions/minimum sizes listed? Approval would only authorize a **future separately reviewed wiring change**, not imply those icons are currently in use.

## Optional hardware accessibility

If TalkBack, enlarged system fonts, a physical keyboard, high-contrast mode or Switch Access matter to release, check actual spoken names, focus order and meaningful disabled instructions. The computer-tested 156/156 zero axe violations are not evidence a native assistive reader spoke the controls correctly. Any missing test is **NOT VERIFIED**.

## What counts as approval

Record phone/browser model and viewport, date, whether the five tasks were actually completed, and explicit visual decisions for the two judgment questions. A failed screen deserves a reproducible screenshot and direct defect PR. **Only then** may the final visual supported-phone/device checkbox be checked. Unsupported ultra-short phone landscape is expressly not a required case.

No approval has been obtained by authoring this sheet, and no user is being asked to retroactively endorse the independent AI review.
