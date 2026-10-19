# Independent viewport Pan and composition move

**Status:** implemented and merged (#143), with independent live More viewport accessibility (#145, #147) and source-world raster parity repair (#146), 2026-10-19. This is an explicit redesign distinction, not an alias for the old nudge.

## Two different operations

**Move composition** (positionX, positionY, ±30%, source data-nudge) translates the final coloured ink relative to the wallpaper frame. It is the existing, independently lockable action. Its original controls, ±1 percentage-point increments and reset remain unchanged.

**Move view frame** (viewPanX, viewPanY, ±50%, new data-view-pan) moves the virtual camera through logical world coordinates, without changing the generated path, stripe layout, source objects or composition translation. Positive X looks farther right, sliding the image left; positive Y looks farther down. Buttons step by 5 percentage points and have a separate recenter control.

Both frame coordinates are percentages of the canonical 600×1300 logical design. They are stored in normalized version-2 recipes with one decimal place and pass through share links, JSON, history, favourites and embedded PNG metadata. No browser zoom, CSS transformation of clipped pixels, or unsaved viewport state is involved. Default is centered (0,0). Zoom remains 0.5–2.5. Fit restores zoom=1 and pan=(0,0), preserving composition position.

## Implementation guarantees

The viewCamera(width,height,zoom,{panX,panY}) world transform is used for preview and native export. The renderer expands world extent for pan/zoom instead of recycling clipped preview ink. Preview worker, main-thread fallback, thumbnails and full-resolution export share the same source function. Camera edits invalidate cached artwork, while composition nudges may reuse cached ink.

A source-backed Move view frame row appears below composition positioning on desktop and under More → Position & design details on mobile. Its five controls and live status are independent of the original nudge controls. The side-rail Zoom+/− and Fit remain directly accessible.

## Qualification

- tests/view-camera.test.js: preview/export invariance, bounds/clamps, roundtrip and scene invariants.
- tests/viewport-pan-contract.test.js: separate handlers, source controls and Fit/randomize semantics.
- tests/browser-smoke.mjs: actual mobile More pan-right action, field-diff check and recenter, plus original nudge assertions.
- Headless workflow: same wave recipe at 600×1300 and 3024×6552, zoomed out and panned on both axes; compare embedded normalized recipe and stable coloured interior pixels.

This is discrete button-driven pan, not drag-to-pan. Moving the viewing frame past a finite authored ribbon may legitimately expose background. Additional structure-specific **native export** pixel comparisons remain future acceptance work.

The follow-up UI atlas now records an explicit mobile More → Move view frame → +5% state and rejects clipped/unnamed frame controls. This is a visual/reachability guard; it does not substitute for physical device acceptance.

## Cross-structure pixel-invariance check (2026-10-19)

The browser smoke now independently samples exact common world-space pixels from **two fresh Canvas2D renders**, one centered and one panned +10% X/−10% Y at 240×520. Translation is exactly 24 screen pixels left and 52 down. After excluding antialiased boundaries, it requires sufficient coloured artwork and fewer than 4% mismatched stable samples in four foreground-qualified geometries: zigzag, dotted wave, radial pinwheel and Voronoi regions. Initial straight/loop seeds generated too little foreground ink in the common view to qualify and are explicitly excluded, not silently treated as passes. This catches extent changes that alter real motif positions or clip coloured ink, which the wave-only native PNG test cannot establish. Zero texture/material avoids nondeterministic or resolution-sensitive surface variation; broader recipe coverage remains an explicit release gate.

## Regression discovered during independent pan acceptance

PR #146 found that the renderer passed the *panned* `camera.viewBounds` to `balanceStripeEnds` / `stripeFrameContacts`. Some path stripe caps therefore changed merely when the viewer moved. The renderer now computes composition-side contact and cap decisions against the **centered source bounds**, while retaining the genuinely panned camera and expanded render bounds for display/export. The fresh Canvas2D pan-vs-centered pixel test proves four nonempty foreground families stay stable instead of merely reusing the same painted screenshot.

PR #147 qualifies the actual mobile More sheet at **412×892, 499×892, 500×892, 790×892 and 700×412**. For every size Chromium scrolls each of the five Pan buttons into view and checks that the center is inside the sheet, hit-testable above overlays, at least 34×34 CSS px, and accessibly named. It also performs live +5% / Recenter recipe changes with composition X/Y unchanged, rejects dock intrusion, and keeps boundary screenshots for review. CI success here is not user visual approval or an Android hardware test.
