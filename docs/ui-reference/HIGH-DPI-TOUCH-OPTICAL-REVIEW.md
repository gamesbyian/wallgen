# High-density touch-emulated optical review (Agent 1)

This is a supplementary adversarial screen-raster check for unchecked visual responsiveness entry **6** in the redesign queue. It is **not** a native Android or Pixel 6 Pro acceptance certificate.

The [source-based Chromium runner](../../scripts/visual-high-dpi-touch-agent1.mjs) opens the **actual application**, uses Playwright `locator.tap()` with touch emulation to enter Studio, mobile Edit → Material Finish, Edit → Interior Elements, Explore, Saved, More and Draw, and writes real screenshot PNGs at 3× or 3.5× raster density in both cream and dark. Unlike the older browser atlas, these transitions go through real touch emulation, not direct invocation of the source element's click handler.

Coverage:
- **412×892 CSS px, DPR 3.5**: approximate Pixel 6 Pro browser CSS footprint; expected screenshot PNG dimensions 1442×3122 pixels, not the phone's exact 1440×3120 screen raster.
- **500×892 CSS px, DPR 3**: cross the 499/500 compact-layout threshold.
- **700×412 CSS px, DPR 3**: short landscape with full mobile nav and potentially clipped tray controls.
- Two themes × seven source states = **42 genuine screenshots** if all actions succeed.

The source-run manifest reports CSS and raster sizes, stage-to-panel overlap, horizontal document overflow, dock caption clipping, and whether the five mobile dock button centres remain unobscured. It aborts the green acceptance claim on missing screens or failed taps.

## Visual review instructions

Open `review.html` in the `agent1-high-dpi-touch-optical-evidence` Actions artifact, not a generated reconstruction. Compare cream/dark 3.5× raster edges for the logo, seven rainbow strokes and control SVG glyphs. In Material, inspect the six-part rotation row, original per-setting locks, typography and category tab density; in Interior, inspect card tools and affordances. Compare 700×412 and 500×892 for stage/tray balance and no covered navigation.

A technically passing run still does **not** qualify the real Android font scale, browser insets, OS picker, accessibility announcements or GPU differences. Hardware acceptance must use the real phone. These are supplemental optical witnesses for independent review, not an authorization to mark global acceptance entry 6 as checked.
