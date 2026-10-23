# Thread Surface on portrait: two browser screens

This intentionally tiny responsive inspection uses the real app, not a mock HTML layout. It navigates to the existing Texture → Surface tool, expands Thread, chooses all stripes and linked Chain, then captures exactly 412×892 and 320×700. It records where every visible input and footer sits relative to the editor card and sidebar, plus scrollbar and target heights.

Run from a local static host with Playwright already installed:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 &
node scripts/review-thread-portrait.mjs --out-dir artifacts/thread-portrait
```

It does not run during ordinary pull requests and does not compare every tool. Any fix should retain the user's single-row 7 categories, existing 44px touch targets and no vertical scrolling within Edit. Browser emulation is not the physical Pixel 6 Pro or Android keyboard. The output should be inspected before declaring the expanded Thread pane accepted.

## Observed defect and minimal source-preserving correction

The first real Chromium run [#39891398707](https://github.com/gamesbyian/wallgen/actions/runs/39891398707) found the expanded disclosure 326px at 412×892 and 365px at 320×700, despite only 178px/168px in the editor card. The last sliders and help text were clipped, and selects were 27px tall. No Android screenshots or keyboard tests were claimed.

A **responsive-only two-control-row reflow** now keeps Target and Style in one 44px-select row, followed by Region angle and the two original 44px-effective range targets. The explanatory small print remains in the accessible HTML but is visually clipped from the tight mobile card; it is not substituted for any control. A separate selected-object picker uses one additional honest row with a conditional tray expansion, leaving the art visible. Original desktop and closed disclosure remain unchanged. The focused browser study now also captures selected-object states at both sizes (four purposeful pictures total), not an atlas. All claims of fit must use the **second** actual browser run after this code, not extrapolate from CSS.
