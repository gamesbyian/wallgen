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

## Verified CI checkpoint

At head `2ffbe2892155bd19e5873270de1e2e17030846b3`,
[GitHub Actions run 39393555576](https://github.com/gamesbyian/wallgen/actions/runs/39393555576)
completed **successfully**. Both `npm test` and the actual Playwright
Chromium 20-scenario Focus/All run passed, with screenshots and structured
observations uploaded. This establishes a bounded, head-specific **behaviour-
verified** witness for the five scenarios at two viewports in both themes;
**not** a release-wide accessibility or human preference signoff.

## Additional adversarial probes (separate evidence gates)

**Eight SVG candidates:** `tests/independent-svg-candidates-acceptance.mjs`
reads all eight `candidate; not wired into UI` entries directly from the
manifest. The true source-registered visual fixture renders 8 × 2 themes ×
4 states × 3 sizes = **192 visual samples**; assertions check SVG viewBoxes,
standalone titles, nonempty exact fixture renderings, in-cell SVG dimensions,
disallowed raster/executable/gradient elements, decorative
`aria-hidden=true`, and manifest status. The source-exact matrix and 20
Focus/All browser journeys passed at head
`936c5810077c78e6aea2d4624f405a3eb59034dc`
in [CI run 39394165173](https://github.com/gamesbyian/wallgen/actions/runs/39394165173).
These **rendering diagnostics** establish no aesthetic approval or intended
semantic interpretation. Human review of icon recognizability and all eight
candidate artworks remains **NOT VERIFIED**.

**Transitions:** `tests/independent-focus-transitions.mjs` performs real
Material Focus lock → unlock → +, responsive 791px desktop handoff → mobile
return, Colour's empty Focus panel, user motion preference changes, and All
restoration. This supplements earlier static A/B with four multi-action
journeys across both viewports and themes. Its CI status is independent
from the earlier successful 20-case matrix and must be assessed at the
latest head before accepting new conclusions.

**WCAG diagnostics:** `tests/independent-axe-diagnostic.mjs` collects
automated axe-core 4.10.3 browser reports for 24 states (2 viewports ×
2 themes × 6 screens, including opt-in Focus and expanded More metadata).
It records exact violation identifiers and affected selectors plus
incomplete/manual-review checks and screenshots. The diagnostic deliberately
does not auto-certify WCAG by a zero-exit code, and any reported defect
must be inspected and remediated independently.

### Current disposition

The successful 20-case Focus/All matrix and 192 candidate fixture samples
are bounded, repeatable proof. The additional transition and axe-core suites
are **pending at the latest head** and may reveal further defects.
Entries #2, #11, #15 remain unchecked; physical-device screen reader,
touch hardware and human aesthetic/usability approval remain explicit.
