# Mobile immersive/fullscreen behaviour and acceptance

Date: 2026-10-21. Scope: Pixel 6 Pro portrait and supported mobile widths, without disturbing drawing, image output, source recipes or the existing five-way dock.

## Browser/platform decision

Chrome on Android supports the Fullscreen API, but `requestFullscreen()` requires transient user activation. Automatic page-load fullscreen, silent relaunch or a deferred timer are forbidden by browser policy and cannot be promised. We **do not** hijack the first randomize/edit/gallery tap to request fullscreen. The mobile 44px overlay button explicitly invokes the API from its own click, with `navigationUI:'hide'`. `fullscreenchange` and `fullscreenerror` synchronize its label and pressed state. Android gestures and Escape remain native exit mechanisms.

An installed PWA with `display:"standalone"` launches without the Chrome URL bar without requesting a gesture. This is automatic *browser chrome reduction*, **not** guaranteed system-bar removal. We intentionally did **not** set manifest `display:"fullscreen"`: manifest fullscreen is independent from `Document.fullscreenElement`; `document.exitFullscreen()` cannot reliably exit the installed application's fullscreen display mode, so presenting that button as an always-working exit would be misleading. In-page fullscreen instead offers an app-controlled exit.

References:
- https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
- https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display
- https://developer.chrome.com/blog/edge-to-edge

## Interaction and layout contract

- Mobile only (<=790 CSS px). Desktop at 791px has no overlay.
- Native button 44x44 CSS px, small glyph, unobtrusive surface. Positioned `fixed` over the existing viewport (not an extra row in the dock, masthead, preview action rail or Edit tray).
- Normal mobile placement: upper-right of preview under the normal masthead. While HTML fullscreen: top-right with safe-area insets. Position is visually responsive and independently hit-testable; the background canvas should remain meaningful.
- Fullscreen button is dynamically instantiated near the editor recovery chevron, without adding a static ID to the frozen 116-ID source inventory. It has a unique accessible name that toggles Enter/Exit, `aria-pressed`, visible keyboard focus and no participation in tool selector/slider roving focus.
- Existing mobile Edit/Explore/More and camera/source controls must remain interactive with fullscreen active. Browser surface changes never alter camera zoom/pan, generation settings, favourites, PNG or URL recipe.
- The control remains accessible during ordinary Studio/Edit/Explore/Saved/More. The native image-import modal uses a top layer that can cover the body overlay; while it is open, the **same button** moves into the dialog's existing header, before its separate Close action. It returns to the reserved shell location on modal close. Neither modal nor shell gains an extra toolbar row, second fullscreen listener, duplicated source ID or fake top-layer z-index. This applies only to the application's known native importer; unknown future modal top layers require separate validation.

## Automated acceptance and release boundary

`tests/mobile-fullscreen.test.js` checks source contracts and PWA mode. The dedicated `tests/mobile-fullscreen-acceptance.mjs` in `.github/workflows/mobile-fullscreen.yml` drives real Chromium at 320, 412, 790 and 791 CSS px: responsive visibility, 44px control region, control owns its pointer-centre and 3x3 exit region, first explicit touch requests fullscreen, event-driven label changes, Edit still works, exit by touch restores browser state, and exact recipe URL remains unchanged. The same suite now opens an actual SVG through the source image-import input while fullscreen, checks the in-modal button's 44px native bounds and nine-point ownership, confirms separate Close geometry and keyboard focus, exits via genuine touch *without closing the dialog*, then closes the modal and confirms the original exit returns to the shell and can reenter fullscreen. Other existing source/browser/visual suites guard layout isolation.

**Not yet evidenced:** physical Pixel 6 Pro Chrome system-bars/safe-area geometry, Android navigation gestures, installed WebAPK launch appearance, TalkBack spoken names, actual finger accuracy, and human visual approval. A successful Chromium headless fullscreen transition is not all-device certification.

## Change ownership

`src/mobile-fullscreen.js` owns state, event subscriptions and dynamic control instantiation. `mobile-fullscreen.css` owns its visual target geometry and safe-area positioning. The manifest controls installed launch only. No shared CSS overrides or renderer changes. Initial fullscreen PR: #369. Image-import top-layer continuity fix: #378. Independent regression discovered in the previous Focus heading enlargement is now repaired in merged #379 (the 412×892 browser smoke, atlas and Focus accessibility checks are green); this branch must still independently pass source-level and phone smoke on the **current integration base**. Physical Android device remains unverified.
