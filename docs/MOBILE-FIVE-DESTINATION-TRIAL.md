# Five-destination mobile navigation: implementation and qualification

**Status:** five-destination navigation is the default mobile interface. All five destination buttons are static in `index.html`, while the original Shuffle, Favourite and Download button identities are retained with their handlers. `?nav=five` is no longer required or consumed. The historical filename is retained for stable links. Keep testing geometry, accessibility and complete recipe/export fidelity as development continues.

## Destination contract

| Destination | Source | Exact action |
| --- | --- | --- |
| Studio | new `mobileStudio` | Close any mobile sheet and return to unobscured artwork |
| Edit | unchanged `mobileEdit` | Open editor with original form and source controls |
| Explore | unchanged `mobileExplore` | Restore latest twelve-variation contact sheet without rerandomizing |
| Saved | new `mobileSaved` | Show existing favourites in the same gallery component, independently of Explore's cached recipe list |
| More | unchanged `mobileMore` | Original utilities and source-backed Shuffle shortcut |

## Action-preservation relocation

- Original `mobileShuffle`, `mobileFavorite`, and `mobileDownload` remain **the same actual buttons**, not cloned handlers. Shuffle is accessible in More; the real `randomizeAll` source also remains immediately accessible on the left canvas rail.
- Favourite and Download move beside the artwork when Studio is open. They remain reachable through the established editor action rail while Edit is open. No recipe, export format, or gallery data are changed by switching navigation modes.
- Both gallery destinations share a physical panel but have separate view states, accessible titles and expansion states. Pressing one while the other is open switches in place.
- The five destinations are the production default. The historical six-action group survives through the unchanged source IDs (`mobileEdit`, `mobileExplore`, `mobileShuffle`, `mobileFavorite`, `mobileDownload`, `mobileMore`), but only five are dock destinations. No local preference or recipe flag chooses navigation.

## Acceptance and regression gates

1. `npm run check`, mobile browser acceptance, headless render and targeted atlas pass.
2. Inspect actual 412×892, 499/500/790/791 and short-landscape screenshots in cream and dark. Verify no collision between shortcut rail, preview, tray and dock.
3. Confirm all five destinations and three relocated source actions with keyboard, touch and screen-reader semantics; Saved/Explore switch without hidden regeneration.
4. Confirm drawing and generated/exported pixels are unchanged.
5. Default promotion is intentionally completed for this early-development app. Further aesthetic and responsive refinements stay on the normal redesign queue, not behind a feature flag.

## Real Chromium evidence (initial trial baseline)

The initial full five-screen inspection is captured by [Mobile browser acceptance run 39199704468](https://github.com/gamesbyian/wallgen/actions/runs/39199704468), artifact `editor-layout-browser-zoom` (ID `12163388510`). It contains `five-nav-{studio,edit,explore,saved,more}-412x892.png`, alongside the existing editor captures. These are actual application screenshots, not generated design illustrations.

At 412×892, the preview stage ended at CSS y=830 and the dock began at y=840; the wallpaper frame was approximately 682.5 CSS px high. Favourite/Download rectangles ended at x=58.5 while the visible wallpaper began at x=63, so the relocated quick actions did not cover artwork. Chromium also verified the five dock identities, selected/expanded state and Saved↔Explore transitions. The 499, 500, 790 and 791px boundaries, plus a 700×412 landscape viewport, passed dock/preview overlap assertions on that run. At 791px the six-action mobile rail is replaced by the established desktop UI, with source buttons kept connected.

Source-button attachment now follows breakpoint changes, preserving the same Favourite/Download DOM identities as the mobile preview rail is detached and restored. The following pass additionally checks a Favourite on/off roundtrip and captures dark Studio/Saved states. **Visual review:** the cream trial looked coherent in the real five-screen montage, including logo, icons, inspector, gallery and More. This is a preliminary inspection and does not certify other platforms or final visual approval.

## Default source structure

`index.html` declares `mobileStudio`, `mobileEdit`, `mobileExplore`, `mobileSaved`, and `mobileMore` in that order. `mobileShuffle` lives in the More content, and the exact `mobileFavorite`/`mobileDownload` buttons start in `.mobile-five-shortcuts` inside the stage. `src/mobile-five-nav.js` mounts their existing group onto the live left preview rail and keeps it connected across 790/791px viewport transitions. `src/mobile-studio.js` installs those handlers unconditionally. The exact 115 static IDs and source-action trace are versioned under `docs/ui-reference` and browser tested without a navigation query parameter.
