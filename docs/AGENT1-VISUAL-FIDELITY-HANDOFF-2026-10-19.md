# Agent 1 visual fidelity evidence handoff · 2026-10-19

This is a **bounded specialist evidence log**, not a substitute for the common implementation queue, an independent accessibility audit, or human/native-device visual approval. Agent 3 owns the overall release/queue verdict. The 12 `docs/ui-reference/*.svg` plates are schematic **feature/layout** references, not literal screenshot goldens. The approved brand mark and the 55 original glyphs remain unchanged.

## Evidence and integration history

| PR | Visual-only purpose | Authority and disposition |
| --- | --- | --- |
| [#155](https://github.com/gamesbyian/wallgen/pull/155) | Raise contrast of genuinely inapplicable category tabs, without enabling those controls | Merged; static contrast/disabled semantics |
| [#157](https://github.com/gamesbyian/wallgen/pull/157) | Standalone actual-Chromium canonical/reference gallery, both themes, source controls/canvas and eight unwired icon previews | Merged; [90 screenshots/zero capture errors](https://github.com/gamesbyian/wallgen/actions/runs/39325630186). This run **found** two 18px landscape Explore overlaps; its CI success originally meant capture success only |
| [#161](https://github.com/gamesbyian/wallgen/pull/161) | Dark-theme visibility of the true Bézier-handle and extrapolation-frame strokes of two **unwired** icons | Merged; SVG, inline source and 68-symbol matrix kept synchronized; eight extension candidates are **not approved/wired** |
| [#176](https://github.com/gamesbyian/wallgen/pull/176) | Remove short-landscape canvas/gallery overlap by respecting the owning short-screen tray reservation | Merged; real 700×412 Explore overlap 18px → 0px both themes, screenshot gate now fails on future overlap >1px |
| [#179](https://github.com/gamesbyian/wallgen/pull/179) | 25×25px desktop setting dice/lock hitboxes at the 791px breakpoint, excluding Material's special rotation row | Merged; desktop live minimum-box assertion |
| [#181](https://github.com/gamesbyian/wallgen/pull/181) | Fit both empty Explore guidance lines, including decorative seven-bar ribbon, in short landscape | Merged; real clipping gate, unchanged app behavior |
| [#183](https://github.com/gamesbyian/wallgen/pull/183) | Actually generate twelve Explore images instead of mocking gallery cards | Merged; live 94-shot evidence found 126.6px of first thumbnail below 700×412 gallery clip |
| [#186](https://github.com/gamesbyian/wallgen/pull/186) | Complete short-landscape thumbnail filmstrip with visible caption, preserve full-size portrait | Merged; [94 shots, zero audit failures](https://github.com/gamesbyian/wallgen/actions/runs/39332088725), hidden canvas reduced 126.6px → 0 |
| [#213](https://github.com/gamesbyian/wallgen/pull/213) | Raise five phone dock labels from 8 to 10 CSS px without height growth | Merged; all five labels' computed font and bounding rectangles checked in live browser; five workflows passed |
| [#216](https://github.com/gamesbyian/wallgen/pull/216) | Expand 320px/360px native-CSS viewport census; fix both lines of 320×640 empty Explore guidance | Merged; initial run found true 4.3px 320px bottom clipping, subsequent [118 screenshots/zero errors](https://github.com/gamesbyian/wallgen/actions/runs/39342623682) |
| [#218](https://github.com/gamesbyian/wallgen/pull/218) | Widen existing Edit dock-recovery chevron from 34 to 40px inside its 40px reserved strip | Merged; existing handler and 45px height unchanged; standard/browser/atlas green |
| [#224](https://github.com/gamesbyian/wallgen/pull/224) | Prevent CSS-only visual changes evading independent live browser acceptance | Merged; visual workflow now watches all owning production CSS, first-paint HTML and icon sources; visual job and source tests green |

## Latest adversarial evidence / outstanding specialist work

- At 320×640, **genuinely populated** Explore is a distinct state from the empty guidance plate. The [first 120-state negative run](https://github.com/gamesbyian/wallgen/actions/runs/39343793726) captured cream/dark thumbnail canvas bottoms 1.406px beyond the visible grid; both captions were clipped.
- That same negative run measured all six actual Material rotation controls. At 320px the last reset button was at x214–232 **outside** the row ending at x212, and a real centre hit failed. At 360px all six controls fitted the row and centre hits succeeded. Screenshot geometry, not visual guesswork, established the defect.
- [#222](https://github.com/gamesbyian/wallgen/pull/222) is the *source-qualified narrow fix* candidate. It releases 22px from the Material label column only for <=340px and reserves about 27px of additional gallery height only for 320-ish small portrait screens rather than hiding captions or shrinking generated images to illegible slivers. Source tests and actual 120-state browser gate must pass on its **final head**; until then, do not promote these two failures to fixed. Agent 1's dedicated screenshots capture both geometry and actual source-control centre-hit status, while preserving the earlier gallery and stage-overlap guards.

## Scope discipline and still NOT VERIFIED

- No Agent 1 PR replaces original app actions, redefines seed/recipe data, manipulates drawing geometry, changes generated art pixels, or claims to simulate real user taps by using `element.click()` in fixture setup. Input hitbox checks use actual rendered rectangles; some source journeys explicitly use original event-handler invocation rather than physical touch.
- The independent reference gallery now covers **cream/dark, 320/360/412/499/500/790/791px, short 700×412 landscape and CSS-root zoom-out approximations**. Only the 320/360 and other explicitly tested states are measured; this is not an exhaustive responsive or hardware matrix.
- Remaining requirements: manual and independent visual review across all source/conditional states, full accessible hit-target and keyboard audit, optical acceptance of eight unwired candidate SVGs in their 20/24/28px and focus/disabled variants, actual native Android Chrome / system font scaling and browser zoom review, and reconciliation of [stale Pan/Fit/icon prose #162](https://github.com/gamesbyian/wallgen/issues/162) by the common QA/queue owner.
- Keep the 12 reference plates, 68-icon exact source matrix and original logo. Do not infer approval from a passing PNG renderer pixel comparison, static source test or successful screenshot capture.

The independent comparison artifact is generated as `artifacts/visual-agent1/review.html` plus `manifest.json` by `scripts/visual-reference-audit-agent1.mjs`, uploaded in the `Agent 1 canonical/live visual comparisons` workflow (artifacts retained 14 days). A failed capture still publishes its current screenshot/geometry artifact for counterexample inspection.
