# Five-destination mobile navigation trial

**Status:** gated implementation, not the production default. Append `?nav=five` on mobile Chromium to exercise the new shell; omit it to retain the current six-action dock. Do not advertise the trial as fully approved until its browser acceptance and multi-viewport screenshots are reviewed.

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
- The existing nav and six original action IDs remain the default unless the query switch is present. No local preference or recipe flag is written.

## Promotion gates

1. `npm run check`, mobile browser acceptance, headless render and targeted atlas pass.
2. Inspect actual 412×892, 499/500/790/791 and short-landscape screenshots in cream and dark. Verify no collision between shortcut rail, preview, tray and dock.
3. Confirm all five destinations and three relocated source actions with keyboard, touch and screen-reader semantics; Saved/Explore switch without hidden regeneration.
4. Confirm drawing and generated/exported pixels are unchanged.
5. Only then consider making the five-item dock default in a separate PR. Human icon/art direction approval remains separate from these technical gates.
