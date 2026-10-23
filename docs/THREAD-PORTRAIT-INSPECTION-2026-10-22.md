# Thread Surface on portrait: two browser screens

This intentionally tiny responsive inspection uses the real app, not a mock HTML layout. It navigates to the existing Texture → Surface tool, expands Thread, chooses all stripes and linked Chain, then captures exactly 412×892 and 320×700. It records where every visible input and footer sits relative to the editor card and sidebar, plus scrollbar and target heights.

Run from a local static host with Playwright already installed:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 &
node scripts/review-thread-portrait.mjs --out-dir artifacts/thread-portrait
```

It does not run during ordinary pull requests and does not compare every tool. Any fix should retain the user's single-row 7 categories, existing 44px touch targets and no vertical scrolling within Edit. Browser emulation is not the physical Pixel 6 Pro or Android keyboard. The output should be inspected before declaring the expanded Thread pane accepted.
