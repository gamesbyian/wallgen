# ROYGBIV dense-mobile button and hit-target research audit

**Date:** 2026-10-21. **Base:** `gamesbyian/wallgen@6389e4ec7dc3a71f37656ba2b72ad04a747d6e2e`. **Type:** design/R&D evidence and implementation recommendations, **not** usability or device sign-off.

## Executive decision

Preserve the artwork-forward portrait application, current five-destination dock, all seven editing categories, both themes, Fredoka/Rubik identity, palette, source controls and Focus as an optional alternative. Introduce a **visible-control versus effective-interaction-region contract**. Aim for **44 CSS px** minimum actionable square for ordinary custom touch targets, **48 CSS px** where frequent, crowded or high-consequence, while accepting documented WCAG exceptions and alternate methods where screen geometry cannot accommodate them. A 24 CSS px icon may remain visually small inside a larger *non-overlapping* interaction region.

These are design objectives, **not** a claim that 44px is a WCAG 2.2 AA absolute minimum or that Android dp and web CSS px are mechanically identical. Do not blindly set every field/button to 48px: the preserved preview and coherent task grouping matter too. Do not expand invisible hitboxes on top of an independent sibling.

## Method and quality boundaries

Reviewed original-language Japanese, Korean, Chinese and English-language authorities and related European-language accessibility discussions, favouring government/platform/standards primary sources over SEO articles. Read actual production CSS, `scripts/ui-atlas-inspect.mjs`, `scripts/ui-atlas-geometry.mjs`, `tests/ui-atlas-geometry.test.js`, the current acceptance queue and documented actual-browser runs. Source attributes are **risk indicators**; the exact post-cascade, post-clip *effective pointer region* requires live browser measurement. This report does not include newly obtained on-device measurements, fresh user tests, TalkBack speech, or independent visual approval.

### Normative accessibility versus ergonomic design

| Source | What it establishes | Correct qualification |
| --- | --- | --- |
| W3C WCAG 2.2, SC 2.5.8 (AA) | At least 24 x 24 CSS px, **or** a defined spacing/equivalent/inline/user-agent/essential exception | The spacing method draws a 24px-diameter circle around the bounding-box centre of **undersized** targets; circle must not intersect a different target or other undersized circle. A mere width/height census cannot determine this. A slider/gradient spatial target is specially interpreted. |
| W3C SC 2.5.5 (AAA) | At least 44 x 44 CSS px for custom targets, with narrower exceptions | An aspirational ergonomic standard, **not** the mandatory AA threshold. |
| Apple HIG Buttons | At least 44 x 44 pt general recommended hit region | Platform point units and exceptions differ from CSS px; press feedback and legible meaning also matter. |
| Android Accessibility | At least 48 x 48 dp, typically 8 dp spacing, ~9mm physical size | The **target** can exceed visible artwork; its examples include 24dp icon inside padded target. Native `TouchDelegate` is an analogy, not a web implementation API. |
| Japan Digital Agency DADS ボタン（概要） | 44 CSS px or more target area despite visible Small/X-Small buttons under 44px tall | Strongest directly applicable visual-density precedent: preserve small visuals and reserve full operable area, without overlap. |
| South Korea KRDS / Korean public design practice | Distinctly identified icon actions, systematic component tokens, visible focus and non-colour-only state cues | Do not claim a specific numeric Korean rule unless verified directly against its official component standard. |
| China Semi Design 复选框 | Checkbox clickable area extends across associated text and, when supplied, supporting explanation | Broader label activation can improve density, but avoid invalid nested interactions and accidental toggling. |

Primary sources (original-language labels preserved):

- W3C [Understanding Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), [Enhanced](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced), and [CSS technique C42](https://www.w3.org/WAI/WCAG22/Techniques/css/C42.html).
- [Apple Human Interface Guidelines: Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons).
- [Google: Touch target size, Android Accessibility Help](https://support.google.com/accessibility/android/answer/7101858?hl=en).
- [デジタル庁 デザインシステム: ボタン（概要）](https://design.digital.go.jp/dads/components/button/), including `ボタンのターゲット領域`.
- [한국 정부 디자인 시스템 KRDS](https://www.krds.go.kr/). See also implementation examples rather than assuming all third-party interpretations are government requirements.
- [字节跳动 Semi Design: Checkbox 复选框](https://semi.design/zh-CN/input/checkbox), section `键盘和焦点`.
- [U.S. Web Design System: Button accessibility tests](https://designsystem.digital.gov/components/button/accessibility-tests/).

### Experimental evidence and applicability

- Parhi, Karlson, Bederson, *Target Size Study for One-Handed Thumb Use on Small Touchscreen Devices*, MobileHCI 2006: study suggests ~9.2mm discrete and ~9.6mm serial thumb targets, varying with location and task. [Microsoft Research original publication](https://www.microsoft.com/en-us/research/publication/target-size-study-for-one-handed-thumb-use-on-small-touchscreen-devices/). Older small screens and limited experimental tasks mean **do not turn the measurements into universal phone-CSS breakpoints**.
- Park and Han, *One-handed thumb interaction of mobile devices from the input accuracy perspective*, 2010, 40 participants; 3 physical sizes x 25 locations. [DOI 10.1016/j.ergon.2010.08.001](https://doi.org/10.1016/j.ergon.2010.08.001). Target position and one-handed posture matter in addition to size.
- Effective hitboxes do not establish interpretability: test action-language understanding, neighbouring actions and disabled-state meaning, plus accidental taps, undo and touch fatigue. Representative controlled comparisons are more probative than decorative pixel mocks.

## Source-specific ergonomic risks (not confirmed conformance failures)

Current source-confirmed CSS and modules, to be remeasured in original Chromium:

| Priority | Source | Current CSS clues | Concern; preserve |
| --- | --- | --- | --- |
| P1 | `mobile-compact.css` | `.settings-tab` min/max height 24px; `.setting-lock` 26x26px | Very dense category and individual-setting actions; make the **real operable target** larger without stealing adjacent buttons. |
| P1 | `detail-controls.css` | Interior selects, ranges and colour inputs 27px height; `.interior-targets` seven `1fr` columns with 2px gap | Seven targets at 44px require 308px before padding/gaps, mathematically incompatible with some narrow tray widths. Reflow or scroll, preserving all R/O/Y/G/B/I/V choices and source values. |
| P1 | Source scoped die/lock actions | 83 eligible miniature per-setting dice across conditional tools | Randomize scope is consequential; preserve locks, dormant semantics, exclusive action and explicit accessible name. |
| P2 | `editor-focus.css` | toggle overridden to 27px, chips 33px, steps/locks 40px | Focus must offer **operable** optional density, with legible help, no false locked affordance and exact All return. |
| P2 | `draw-path.css` | anchor/point actions 36px; Apply/Cancel/Edit 40px | Phase-critical precision and accidental operation. Preserve Draw/Interpret/Adjust/Apply/Cancel and geometry/export invariants. |
| P2 | `mobile-five-nav.css`, `mobile-compact.css` | preview favorite/download 43x38px; dock nominal 42px | Close to objective; verify actual clickable region and edge/corner hit tests before changing footprint. |
| P2 | `viewport-pan.css` | pan pad minimum 36px | Frequent but reversible; inspect hand posture, target separation and clarity of camera-only effects. |
| P3 | Typography/layout | 9-11px mini text and many `!important` overrides | Font scale, truncation, dark/light states and cascade maintenance, not merely touch sizing. |

**Existing evidence:** `scripts/ui-atlas-inspect.mjs` computes `measuredTouchTargets`, `smallActionCount`, `under44Count` and a bounded set of <24px examples, treating associated label rectangles specially. It does **not** adjudicate spacing exceptions, effective pseudo-element hit regions, overlap, corner/edge pointer dispatch, accessibility-tree speech or real-phone thumb precision. `tests/ui-atlas-geometry.test.js` already tests bounding-box classification. Real source overlap between sticky Focus and Tool actions was previously found and repaired in [PR #315](https://github.com/gamesbyian/wallgen/pull/315); it validates expanding beyond source presence and centre hits. [Accessibility evidence](AUTOMATED-ACCESSIBILITY-ACCEPTANCE-2026-10-20.md) explicitly separates completed automated testing from hardware/human conformance.

## Design recommendations

1. **Geometry system:** separate `icon-art` (~20-24px), `visual-tile` (often ~28-36px) and `touch-cell` (~44px; 48px preferential for high-consequence). Use reserved layout cells or genuinely clickable associated labels, not pseudo-element extensions into neighbouring active targets. Hover/focus/pressed/disabled must describe the **whole** activation region.
2. **Interaction grammar:** distinguish navigation, toggle, edit, randomize-one, randomize-tool/category/all, and destructive/recovery actions by more than hue. Pair small glyphs with concise visible text where feasible; maintain precise accessible names.
3. **Responsive categories/colours:** on 320-360px portrait, compare horizontally scrollable rails with visible overflow cues against wrapping rows. Seven colour targets may need 4+3 responsive layout; never shrink hitboxes solely to keep seven items on one line. Keep exact selected colour, keyboard semantics and saved recipe invariant.
4. **Typed setting rows:** reserve non-overlapping action slots for label, value, slider/stepper, die and lock; keep the Material Finish rotation rail's **special four-column** geometry, never apply generic setting grids to it.
5. **Drawing:** evaluate anchor magnification, hit tolerance, keyboard/step nudge and persistent Undo/Cancel for precision operations. Do not alter serialized geometry, camera, intersect/weave algorithms or export as a side effect of hit-target work.
6. **State language:** make selected, active, locked, dormant, disabled, focus and pending distinct without sole reliance on colour; keep text readable in both themes and at larger OS font settings.
7. **Layout costs:** optimize first-try taps and completion time, not 44px compliance in isolation. If a spacing fix shrinks the canvas or creates several screens of extra scrolling, prototype and test an alternate layout before adopting it.
8. **Performance:** use bounded geometry scans in CI, distinguish independent sibling targets from one checkbox plus its label, never synthesize clicks on disabled/hidden controls, and preserve deterministic seeds/state.
9. **Human evaluation:** compare current UI, same-visual larger-target variant and responsive/reflow variant using task outcomes (wrong-control hits, time, recoveries, perceived effort) including one-handed and motor-accessibility cases. No AI/bot run can substitute for this approval.

## Acceptance gates and evidence separation

- **Automatable:** reproducible source-exact browser control census at 320/360/412/499/500/790/791 plus desktop handoff; measured effective rectangles with clipping; WCAG 24px spacing *candidate* diagnostic and 44px ergonomics report; 3x3 hit sample per suitable button, counterexamples where neighbour receives interaction, keyboard focus, conditional/disabled tests, saved recipe and export invariants.
- **Design evaluation:** screenshot evidence in cream/dark; independently compare density, typography, selected states, icon meaning, overflow and canvas space across full/Focus inspectors. No unapproved icon substitutions.
- **Human/physical-device pending:** actual Android Chrome touch precision, OS text scaling, TalkBack spoken feedback, one-handed error rate and personal optical taste. Do not mark these verified from Playwright emulation.
- **Scope:** portrait 320/360/412/499/500/790 and 790/791 handoff/tablet/desktop. Extreme low-height phone landscape is non-blocking per [portrait-first policy](ui-reference/PORTRAIT-FIRST-RESPONSIVE-SCOPE-2026-10-20.md). Keep regression coverage of shared behaviours without creating a new landscape design project.

See [executable work plan](MOBILE-TOUCH-TARGET-IMPLEMENTATION-PLAN-2026-10-21.md). Completion means passing CI **and** meeting each stage's actual evidence standard; a plan/document does not itself prove user-facing improvements.
