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

## Independent branches undergoing final acceptance (do not count as merged)

- [#370](https://github.com/gamesbyian/wallgen/pull/370): proposed **320–411px** native horizontal colour strip, seven independent 44×44px cells. [Original real-browser acceptance](https://github.com/gamesbyian/wallgen/actions/runs/39562583402) measured **248px rail viewport / 338px content at 320px** and **288px / 338px at 360px**, verified all seven 44×44 cells with nine in-view points, source order, real Red/Violet tap recipe recovery and unchanged wallpaper preview. **Important:** the strengthened real CDP *finger-swipe* test was added in a subsequent branch head and must separately pass before merge; synthetic `scrollIntoView()` alone does not qualify swipe reachability.
- [#371](https://github.com/gamesbyian/wallgen/pull/371): proposed original Favourite/PNG preview shortcuts from 43×38px to **44×44px**. [Chromium touch/export acceptance](https://github.com/gamesbyian/wallgen/actions/runs/39562845487) passed four 320/412 cream/dark states: nine owner probes each, real favourite/unfavourite touch, real PNG download, exact recipe recovery and no preview-height change. Full canonical visual review must pass before merge.
- [#372](https://github.com/gamesbyian/wallgen/pull/372): proposed source Random/Primes rail 44px targets, [Chromium source actions](https://github.com/gamesbyian/wallgen/actions/runs/39563297636) passed at 320/412 both themes: Random **44×44**, Primes label **44×46**, nine-point hit ownership, exact Primes setting round trip, distinct rerandomized seed, unchanged preview height. Other exact-head workflows still required.

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
