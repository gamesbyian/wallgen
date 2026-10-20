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
