# Responsive Focus keyboard handoff experiment (20 October 2026)

**Lane:** independent adversarial/accessibility, unchecked acceptance entries #2/#11/#15. From current main after merged #280/#288/#302. This supplements the green 92-screen axe and four cold-keyboard Focus journeys without interfering with the visual, control-inventory, or gallery/export owners.

## Counterexample hypothesis

`src/editor-focus.js` closes Focus after `matchMedia('(max-width:790px)')` transitions to desktop. Its `setActive(false)` calls `toggle.focus({preventScroll:true})`. The Focus toggle is a **mobile-only** editor element. A user editing its slider with a keyboard while a browser/phone viewport crosses 790→791px may lose focus to `document.body` or a hidden control. Previous viewport tests only asserted Focus was closed and the recipe unmodified.

`tests/independent-responsive-focus-handoff.mjs` stages an actual focused, enabled Path Geometry source adjustment at 790×892 and 700×412, cream/dark. It performs a real Chromium viewport change to 791×892. It requires an honest, visible, hit-testable DOM focus destination after the media-query event; one keyboard Tab continuing to a visible control; original recipe preserved; and no browser errors. It records failures/screenshots. The starting focus is explicitly programmatic; this is **not** a claim of an all-keyboard cold start or native physical-device action.

The dedicated `independent-responsive-focus.yml` job executes source app + native Chromium, with artefacts, unit tests and an exact source head. **No production repair is justified until the browser hypothesis is tested.** Record CI outcome before changing this document or accepting the behaviour. Human/device gates remain open.
