# Independent QA: Focus, accessibility and adversarial acceptance (20 October 2026)

## Authority and scope
Own open entries **2, 11 and 15** in `docs/UI-REDESIGN-IMPLEMENTATION-QUEUE.md`.
Read `docs/UI-REDESIGN-ADVERSARIAL-REVIEW.md` and the merged Agent 3/4
browser audits before designing this supplemental probe. These entries remain
**unchecked**, including user aesthetic acceptance and physical-device tests.

## Additional reproducible experiment
`tests/independent-focus-a11y-acceptance.mjs` provides 20 bounded journeys:
2 browser viewports (412×892, 700×412) × 2 themes (cream, dark) × 5
source-backed scenarios (live Path, inactive Path, live Material, locked
Material and sliderless Colour). Uses actual Edit navigation, an opt-in Focus
click, source parameter chips, +, keyboard Home/End where applicable, a
return to All and a second Focus/All cycle.

The resulting evidence records visible source slider count, matching Focus
chip count, disabled-state mirroring, contextual inactive/locked explanation,
exact normalized recipe delta (or immutable recipe when locked/inactive),
keyboard chip selection without recipe mutation, default All state and
repeat toggling. Each case emits a real-browser screenshot; all failures
are retained in JSON and failure screenshots. The test detects browser
`pageerror` emissions. The narrow Colour branch is deliberately a
negative test: no slider should be fabricated for checkbox-based settings.

Run:
```sh
npm test
npm install --no-save playwright@1.56.1 serve@14.2.5
npx playwright install chromium
npx serve . -l 4173
node tests/independent-focus-a11y-acceptance.mjs
```
The dedicated `independent-focus-a11y.yml` job executes the same source
browser journeys and uploads artifacts. **A committed test alone does not
constitute a passing runtime witness**. Record the job URL and its exact head
before promoting browser-observed results.

## Earlier evidence already on main
- `tests/redesign-editor-focus-ab.mjs`: A/B source-vs-Focus value parity,
  selected locked/inactive cases and action-count comparison for Path,
  Material, Colour. A representative live parameter requires two post-tool
  interactions in All (focus slider, ArrowRight), versus three in Focus
  (Focus, choose chip, +). These operational counts do not measure discoverability.
- `tests/agent4-accessibility-acceptance.mjs`: real dock hit tests, selected
  label/status computed contrast, computed destination names, keyboard
  Enter/Escape, live status attributes and runtime reduced-motion preference
  change at 320×700, 412×892 and 700×412 in cream/dark.
- `tests/redesign-mobile-focus-boundaries.mjs`: true Tab visits across
  breakpoint boundaries; distinguishes 791px desktop.
- `docs/AGENT4-ADVERSARIAL-QA-LEDGER-2026-10-19.md`: previous negative
  findings, repairs and head-specific CI evidence.

## Acceptance disposition
**2 NOT VERIFIED:** independent scripted counterexamples expand coverage;
truly unscripted human exploration and icon-candidate aesthetic judgement
remain pending. The eight candidate SVGs must not be approved by a
source inventory or DOM count alone.

**11 NOT VERIFIED:** maintain All as default. Source-backed parity, disabled
and locked semantics, keyboard chip selection and operational interaction
counts inform A/B design but cannot establish human comparative usability.

**15 NOT VERIFIED:** earlier browser checks cover bounded keyboard, hitbox,
contrast and reduced motion. Global accessible names and contrast across
every conditional state, actual assistive-technology speech, screen-reader
reading order and physical device geometry remain pending.

No production defaults, SVG shapes, editor geometry or generation semantics
are modified in this QA contribution.
