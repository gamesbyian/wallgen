# High-density touch-emulated optical review (Agent 1)

This is a supplementary adversarial screen-raster check for unchecked visual responsiveness entry **6** in the redesign queue. It is **not** a native Android or Pixel 6 Pro acceptance certificate.

The [source-based Chromium runner](../../scripts/visual-high-dpi-touch-agent1.mjs) opens the **actual application**, uses Playwright `locator.tap()` with touch emulation to enter Studio, mobile Edit → Material Finish, Edit → Interior Elements, Explore, Saved, More and Draw, and writes real screenshot PNGs at 3× or 3.5× raster density in both cream and dark. Unlike the older browser atlas, these transitions go through real touch emulation, not direct invocation of the source element's click handler.

Coverage (current portrait-first scope):
- **320×700 CSS px, DPR 3**: minimum supported portrait width, expected PNG **960×2100**, now navigated using real source taps rather than relying only on indirect button click tests.
- **360×740 CSS px, DPR 3**: narrow portrait, PNG **1080×2220**.
- **412×892 CSS px, DPR 3.5**: approximate Pixel 6 Pro browser CSS footprint, PNG **1442×3122**, not the phone's exact 1440×3120 raster.
- **499×892 CSS px, DPR 3** and **500×892 CSS px, DPR 3**: both sides of the compact-layout transition, PNG **1497×2676** and **1500×2676**.
- **700×412 CSS px, DPR 3**: short landscape at PNG **2100×1236**, kept as **non-blocking historical diagnostic only**, not a release gate. The known 600×360 landscape limitation is not claimed fixed.

Five supported portrait profiles × two themes × seven original source states = **70 required portrait pictures**. The optional landscape adds 14 more, for **84 source screenshot records** if all capture actions succeed. The earlier green [70-frame run](https://github.com/gamesbyian/wallgen/actions/runs/39408395746) predates the new 320px portrait touch case and remains a separate verified baseline.

The source-run manifest reports CSS and raster sizes, stage-to-panel overlap, horizontal document overflow, dock caption clipping, and whether the five mobile dock button centres remain unobscured. It fails required portrait acceptance on missing source screenshots, failed taps, collapsed source preview, blocked visible dock targets, or horizontal document overflow. Historical sideways-phone failures are recorded as non-blocking diagnostics, per product scope.

## Visual review instructions

Open `review.html` in the `agent1-high-dpi-touch-optical-evidence` Actions artifact, not a generated reconstruction. Compare cream/dark 3.5× raster edges for the logo, seven rainbow strokes and control SVG glyphs. In Material, inspect the six-part rotation row, original per-setting locks, typography and category tab density; in Interior, inspect card tools and affordances. Compare 320, 360, 412, 499 and 500px portraits for stage/tray balance, source canvas legibility, intact Edit/Draw and uninterrupted navigation. Historical 700×412 captures must not be mistaken for a release-blocking target.

A technically passing run still does **not** qualify the real Android font scale, browser insets, OS picker, accessibility announcements or GPU differences. Hardware acceptance must use the real phone. These are supplemental optical witnesses for independent review, not an authorization to mark global acceptance entry 6 as checked.
