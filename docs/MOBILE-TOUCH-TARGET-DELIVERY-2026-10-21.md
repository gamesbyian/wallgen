# Dense-mobile touch target delivery ledger

**2026-10-21 | ROYGBIV WallGen | Status checked against GitHub on 2026-10-21**

This is a living **implementation and evidence** addendum to [multilingual research](MOBILE-TOUCH-TARGET-RESEARCH-2026-10-21.md) and [the five-stage engineering plan](MOBILE-TOUCH-TARGET-IMPLEMENTATION-PLAN-2026-10-21.md). A passing simulated mobile Chromium test is not a physical Pixel 6 Pro approval or evidence of human thumb ergonomics.

## Merged improvements and observed contracts

| PR | Work | Evidence boundary |
| --- | --- | --- |
| [#364](https://github.com/gamesbyian/wallgen/pull/364) | WCAG 2.2 24px spacing **candidates**, per-target neighbour diagnostics, bounded nine-point pointer ownership, original multilingual research and implementation plan | Pure geometry/tangency unit tests, full screenshot atlas, Node; **not** automated WCAG certification |
| [#366](https://github.com/gamesbyian/wallgen/pull/366) | Five destination buttons genuinely 44px high within the existing 52px dock, no extra vertical reservation | Actual browser per-button 3×3 hit ownership and navigation, high-DPI/atlas/visual CI |
| [#367](https://github.com/gamesbyian/wallgen/pull/367) | All seven Interior hue chips at **412–790px** gain 44px-tall native label targets | 412px Chromium genuine touch + exact recipe round trip, nine-point ownership, colour/lock semantics |
| [#368](https://github.com/gamesbyian/wallgen/pull/368) | Optional Focus chips grow from 33px to 44px tall, maintain scrollable tool strip and All default | Multiple-state Chromium Focus/All + correct **scroll-then-nine-point** checks, keyboard roving, all checks green |
| [#369](https://github.com/gamesbyian/wallgen/pull/369) | Chrome fullscreen on **explicit tap**, persistent 44px exit across 790/791 rotation, safe-area and masthead conflict checks; manifest standalone launch | Source browser 320/412/790/791, true enter/exit, recipe integrity, high-DPI, camera and visual regression; final canonical comparison subsequently completed green. Physical Android and actual installation remain **not verified** |
| [#370](https://github.com/gamesbyian/wallgen/pull/370) | At **320–411px**, seven ROYGBIV source labels become native 44×44px cells in a single horizontally scrollable rail, preserving preview height | [Final Chromium acceptance](https://github.com/gamesbyian/wallgen/actions/runs/39563788487): at 320px **248/338px visible/content width and genuine 90px swipe**; at 360px **288/338px and genuine 50px swipe**. Seven 3×3 hit probes, genuine Red/Violet touch and full recipe round trip, both themes; Node, atlas, agent3 and canonical live visual green |
| [#371](https://github.com/gamesbyian/wallgen/pull/371) | Native Favourite and Download controls enlarged to 44×44px in the original preview shortcut rail | [Chromium touch/export](https://github.com/gamesbyian/wallgen/actions/runs/39562845487): 320/412px cream/dark nine hit probes, real favourite/unfavourite and PNG download, exact recipe, unchanged preview; high-DPI, atlas, agent3, visual green |
| [#372](https://github.com/gamesbyian/wallgen/pull/372) | Native preview Random and Primes Only controls enlarged: Random 44×44px, Primes label 44×46px | [Chromium touch](https://github.com/gamesbyian/wallgen/actions/runs/39563297636): 320/412 both themes, full hit ownership, original random recipe action, Primes-only toggle/restore, unchanged preview; all relevant workflows green |
| [#374](https://github.com/gamesbyian/wallgen/pull/374) | Standalone Chrome app launcher hardened with stable manifest ID, 192px original-logo SVG and 512px icon | Browser fetches both real assets and validates manifest; no extra dependencies, new art or fullscreen policy changes; physical Pixel installation still unverified |
| [#375](https://github.com/gamesbyian/wallgen/pull/375) | Focus **Return to All** native exit enlarged from 34px to 44px, independent of parameter-chip strip and browser fullscreen exit | [Independent 30-state Focus/accessibility Chromium](https://github.com/gamesbyian/wallgen/actions/runs/39565026665) confirms nine-point unobstructed exit and real touch return, no recipe changes; Node, high-DPI, agent3, atlas all green |
| [#377](https://github.com/gamesbyian/wallgen/pull/377) | Original More → Shuffle button 40→44px native height, original handler unchanged | [Agent 2 Chromium controls](https://github.com/gamesbyian/wallgen/actions/runs/39565821353) measured source button 360×44 with 9/9 unobstructed hit probes; atlas, visual, Node and consolidated mobile green |
| [#378](https://github.com/gamesbyian/wallgen/pull/378) | Permanent fullscreen exit survives **native image-import showModal top layer** by temporarily living in the existing importer header | [Chromium fullscreen](https://github.com/gamesbyian/wallgen/actions/runs/39569617298): 320/412 modal with full 44px separate hit, native touch/keyboard exit, modal remains open, source button returns on Close and reenters; destination-wide 3×3 reachability, browser/atlas/gallery/Focus/adversarial tests all green |
| [#379](https://github.com/gamesbyian/wallgen/pull/379) | Correct Focus help clipping introduced by taller All exit without shrinking 44px source control | [Actual mobile browser acceptance](https://github.com/gamesbyian/wallgen/actions/runs/39568734579): at 412×892, panel ends y=888 and help ends y=884.23, versus previously y=890.23; preview stage clear, original slider fit, Node/high-DPI/Focus/atlas green |
| [#381](https://github.com/gamesbyian/wallgen/pull/381) | Diagnostic-only original setting lock edge-tap and nearest die measurement | [Chromium source touch](https://github.com/gamesbyian/wallgen/actions/runs/39569923808): shapeFrequency lock **27×29px**, neighbouring die **27×29px** separated by **8px** in both 320 and 412 cream/dark; each of 36 lock/unlock edge-pair experiments restored the exact recipe and disabled/reenabled the source and die. Functionally reachable is **not** the same as 44px ergonomic comfort |

## Work still under verification

- [#380](https://github.com/gamesbyian/wallgen/pull/380): original grouped More import/export/share controls 40→44px in the existing scrollable More sheet. [Real Agent 2 browser acceptance](https://github.com/gamesbyian/wallgen/actions/runs/39569088352) measured **10/10** source action hitboxes (five at 320px and five at 412px), all 44px high and nine-point unobstructed. Independent canonical visual comparison was pending at the time of this ledger update; do not count as merged until that check and merge complete.

## Current implementation boundary

The merged stages above finish the **specified source controls only**. No current PR is a human/device approval or a claim that every 24–35px setting die, lock, category tab, numeric stepper, drawing handle, and zoom/pan action has a 44px independent target. These remain on the open follow-up queue [#365](https://github.com/gamesbyian/wallgen/issues/365).

## Remaining action classes

1. **Small setting-level die/lock and numeric step buttons:** do not blindly enlarge 24–35px cells: the source Settings/Tool row has restrictive column slots, independent locks and special four-column Material rotation. Measure current effective live touch surfaces, prototype alternate row structure and prove nonoverlap, keyboard source order, disabled/locked truth and entire recipe parity. Use fullscreen height as *available*, not as a prerequisite.
2. **Category and tool-strip controls:** compact tabs near 24–27px and horizontal strip require actual brush-free thumb access, nonoverlapping focus and reliable scroll affordance. Keep All default.
3. **Draw/edit points:** keep geometry/export and source path reversibility; evaluate offset/magnification/step alternatives based on actual observed errors rather than fixed arbitrary handle enlargements.
4. **Actual physical phone and people:** Android Chrome system bars, installation, TalkBack, touch accuracy, text scaling, optical preference and Focus/All human A/B remain open, unverified release gates.
5. **Source-wide interactive edge taps:** the atlas geometry/stacking probes and PR-specific real touch workflows provide subsets, **not** whole-source coverage of every possible visible state and neighbouring element combination.

## Engineering dispositions and guardrails

- Primarily support 320/360/412/499/500/790px portrait and 790/791 desktop handoff. Extreme short phone landscape is nonblocking under [the approved responsive scope](ui-reference/PORTRAIT-FIRST-RESPONSIVE-SCOPE-2026-10-20.md).
- Preserve source labels/inputs and their full-range semantics, original ROYGBIV colours, dark/cream appearance, preview framing and original 600×1300 ratio.
- No new backend, dependency, account, paid service, physical-device labour required to complete *automatable* tasks. Do not claim physical/human observations for automated checks.
- For each PR record its **actual exact-head GHA result**, artifact and any exceptions. A draft PR or a passing run on a superseded head does not satisfy merge readiness.
