# Independent expanded breakpoint and WCAG 2.2 QA, 20 October 2026

## Scope

Continues merged #280 on latest main in the independent acceptance/accessibility lane (#2, #11, #15), without touching gallery, path geometry or Agent 1 visual-review ownership.

## New experiment

`tests/independent-axe-diagnostic.mjs` expands from 24 to **72** actual Chromium audits: six viewport profiles (320×700, 412×892, 499×892, 500×892, 700×412, 790×892), both themes and all six previously tested screen states: Studio, Material Edit, Focus Edit, Explore, Saved and More with Metadata expanded.

Adds WCAG **2.2 AA** tagged checks to the existing 2.0/2.1 A/AA set. Retains structured violation-node evidence, incomplete-rule selectors and real screenshots. The suite fails on any automated WCAG violation or return of the formerly fixed unsupported labels.

## Verification

A committed browser test is a **pending witness** until a passing, exact-head Actions run. Automated axe success alone is not general WCAG conformance or physical TalkBack/VoiceOver verification. The human comparative Focus usability gate (#11) and eight SVG semantic-review approvals (#2) remain open.

## Desktop screen expansion

`tests/independent-desktop-axe-diagnostic.mjs` adds **20 real desktop**
snapshots: widths 791×892 and 1024×768 × cream/dark × Studio, Path,
Material, Colour and expanded Metadata. All source tool/navigation
actions execute against Chromium rather than synthetic DOM dispatch.
Both scripts evaluate WCAG 2.0, 2.1 and 2.2 AA tagged automated
rules and preserve exact failing nodes, incomplete checks and screenshot
witnesses in CI artifacts. Combined planned coverage is **92** screens.

The 791px desktop handoff, including precisely the first desktop CSS
pixel, is deliberately distinct from the 790px mobile threshold.
A **passing Actions run is required** before signing off any increased
coverage. The existing queue remains unchecked for human/native gates.

## First qualified mobile result; desktop red counterexamples

At `29fc5c63a76c33fb563a9cc3d43e3212eab13b45`, the independent
[CI run 39399526570](https://github.com/gamesbyian/wallgen/actions/runs/39399526570)
executed all **72 mobile cases** successfully against WCAG 2.0, 2.1 and
2.2 tagged axe checks, including the exact 499/500/790px boundaries.
The mobile diagnostic emitted `INDEPENDENT_AXE_AUDIT_RECORDED`;
the **20 desktop cases executed but failed**, correctly preserving
counterexamples. Never present the full 92-case run as passing.

Desktop failure occurred in both themes at **791×892** and **1024×768**,
across actual Studio, Path, Material, Colour and Metadata screens.
The source seven-colour swatch stack had `aria-label` on an unroled
generic `div`, yielding `aria-prohibited-attr`. Source markup now
specifies `role="img"` and preserves the descriptive colour name.

Recorded desktop contrast failures included the light-theme workspace
eyebrow **2.18:1**, details labels **3.05:1**, the metadata persistence
label **1.60:1**, category tabs **4.19:1**, and the dark vertical
caption **4.09:1** (target 4.5:1). Additional light desktop header,
dimensions, resolved-style and caption labels ranged **3.25–4.46:1**.
An intentionally desktop-only colour correction to
`studio-themes.css` darkens cream descriptive text and tabs while
lightening dark's vertical caption; selected-tab accent, type,
control geometry, mobile skin and output are unchanged.
The source palette image's computed name is now also checked.

**Verification status:** contrast and role repairs must pass the exact
post-fix 92-case Actions run before being marked behaviour-verified.
All axe `incomplete` warnings still require manual assessment,
including background-image select fields. Native Android/TalkBack and
human visual/UX acceptance remain pending.

## Cold keyboard-only Focus A/B route (separate gate)

`tests/independent-keyboard-focus-journey.mjs` adds **four** source
Chromium cases: 412×892 and 700×412 × two themes. Every action after page
load uses physical Playwright keyboard input: Tab until the real
`mobileEdit` destination, Enter opens Edit, Tab to the active Layout
category, ArrowRight switches to Path, Tab to Focus, Enter opens it,
Tab to its parameter chip, End selects a source slider, Tab to its
real range proxy, ArrowRight edits it, Shift+Tab to All, Enter exits.
The test records Tab counts, unobstructed focus, exactly one changed
recipe field and preservation of the adjusted wallpaper after exit,
without `.focus()`, `.click()` or direct DOM `input` dispatches.
This is a **pending witness** until actual CI passes. It does not
substitute for screen-reader speech or physical keyboard evaluation.
