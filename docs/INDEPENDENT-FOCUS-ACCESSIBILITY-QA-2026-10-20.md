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

## Dynamic transition qualification (replaces pending statement above)

At `a74d31f6fe6257a04b13707961dc51bd17f2695b`,
[dedicated CI run 39394353417](https://github.com/gamesbyian/wallgen/actions/runs/39394353417)
passed unit tests, original 20-case Focus matrix, the new **four real-browser
Material lock/unlock → resize → Colour → motion** journeys, and the 192 SVG
candidate samples. The run uploaded 35 files including browser screenshots
and machine evidence (artifact `12251042459`). This qualifies the four
state-transition journeys on that head. It still does not establish human
A/B preference, full WCAG conformance or physical-device acceptance.

## Automated accessibility counterexample and targeted correction

At head `4f32707a9852c3d1c0d211c442ba417ecab4697e`,
[CI 39394489094](https://github.com/gamesbyian/wallgen/actions/runs/39394489094)
successfully ran the independent axe-core diagnostic across all **24
source-rendered browser states**. It reported **7 WCAG 2.x automated
`color-contrast` violations**, all on `.mobile-zoom-level` in the cream
theme. The first live computed witness was **4.25:1**: foreground
`#747486`, background `#fbf6ee`, 8px font. Expected **4.5:1**.
No other automated axe rule violation was reported in that 24-state sample.
That is not a claim that axe evaluates every accessibility requirement.

**Corrective change:** keep existing markup, 8px/11px size rules, mobile
rail layout, paths and controls intact; change only the cream mobile zoom
percentage text colour to `#696576` (computed expected contrast ≈5.24:1
against the observed background). Leave dark unchanged. Bump the CSS
cache-buster in `index.html` so returning clients do not retain an older
stylesheet URL. The corresponding 24-state axe suite now asserts zero
automated WCAG violations at its tested real-browser screens, saves all
findings and failure screenshots, and fails CI if another is detected.

**Validation boundary:** before/after computation identifies a verified
contrast defect and narrowly scoped repair; do not describe the repair as
browser-verified until the **post-fix** Actions run is green. Native Android,
TalkBack, all possible dynamic editor screens and human evaluation are
still **NOT VERIFIED**. Entry #15 remains unchecked.

## Expanded More-panel counterexample: second repair

The stricter `zero automated WCAG violation` assertion caught a separate
**cream-theme expanded More → Metadata** failure at the post-zoom-fix head
`342a1eac7f3a23edabe75ee941f766ac6735ed8c`:
[red CI run 39395007270](https://github.com/gamesbyian/wallgen/actions/runs/39395007270).
The original zoom-label violation was gone, but axe identified
`label[for="seedInput"]` at **2.44:1**, metadata explanatory text
at **2.33:1**, and enabled Title/Creator/Description labels at **1.60:1**
in 412×892 and/or 700×412 cream More. Dark passed. Source trace:
`styles.css` supplied dark-on-dark labels whose colours were inherited
by cream's light `studio-themes.css` surfaces; the input foreground
itself already used a cream override. These are legibility defects on
genuine enabled labels, **not** intended disabled-state opacity.

Remediation adds only colour overrides to `studio-themes.css`:
cream seed and metadata guidance `#625d70`, cream metadata labels
`#5b5366`. Computed expected contrast exceeds **6:1** on the light
surfaces observed by axe; does not alter font size, placement, controls,
input values, locks, dark theme or export. The `index.html` stylesheet
version is bumped so cached clients receive the repair.

**Next verification:** require zero axe WCAG 2.x automated violations
across the same 24-state browser matrix at a post-fix head. Diagnostic
`incomplete` nodes now retain target selectors for manual review;
automated success cannot qualify physical TalkBack or full WCAG.

## First fully passing post-repair browser checkpoint

**Verified commit:** `f37e9f176e6e8864d0f936a1749712f2689fac6a`

**Run:** [39395495847](https://github.com/gamesbyian/wallgen/actions/runs/39395495847),
all steps **success**. Decoded GitHub job log confirms:
- **30** successful opt-in Focus/All cases: 320×700 narrow phone,
  412×892 portrait, 700×412 short landscape × two themes × five
  Path/Material/Colour scenarios.
- **4** successful dynamic transitions with original Material lock/unlock,
  responsive desktop/media handoff, Colour empty mode and motion changes.
- **8** source-exact independent candidate SVG checks, **192 render samples**.
- **24** independent axe-core WCAG 2.x browser scans across Studio,
  Material Edit, Focus Edit, Explore, Saved and expanded More, two
  viewports and both themes. **Zero automated rule violations** after
  the two targeted cream-text repairs, compared with earlier
  **7 zoom-label violations** and separately observed **More labels
  as low as 1.60:1**.

This qualifies only the automated checks and exact tested source head.
Automated axe completion is not a substitute for complete WCAG
conformance, TalkBack/VoiceOver interaction, independent human A/B
preference or physical touch-device use. Entries **2, 11, 15 remain open**.

## Accessible-name counterexample discovered by retained axe incompletes

The expanded diagnostic samples at head
`591891baf879e00e57ea7cae1f65686a7ba69803`
([CI run 39395530721](https://github.com/gamesbyian/wallgen/actions/runs/39395530721))
exposed **`aria-prohibited-attr` manual-review warnings**:
`.mobile-preview-rail-left` used `aria-label="Generation shortcuts"`
on a generic, unroled `div` in every tested state. The original
`.composition-positioner` used `aria-label="Position the composition"`
on another generic `div`, appearing in expanded More. These author names
are not reliably part of a computed accessible-name contract without a
valid semantic role.

The containers hold related controls rather than interactive controls
themselves, so both now receive **`role="group"`**, retaining their
existing labels and all descendants, listener identities and layout.
The 24-state real-browser check now requires exactly one computed
`Generation shortcuts` group in every state, a computed
`Position the composition` group in expanded More and zero unresolved
`aria-prohibited-attr` axe results. Require a green post-change head
before treating this as verified. The remaining axe `color-contrast`
incompletes on single-character coloured title glyphs and symbol-only
seed buttons remain manual-review data and are **not** automatically
certified by the other zero-violation checks.
