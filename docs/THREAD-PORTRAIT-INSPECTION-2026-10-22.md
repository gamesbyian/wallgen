# Thread portrait UX correction: actual browser measurements, bounded follow-up

## Evidence from completed real Chromium runs (22 October 2026)

The actual app was opened in the editor at **412×892** and **320×700**, not a mock, using the browser in [Actions #39891398707](https://github.com/gamesbyian/wallgen/actions/runs/39891398707). When Thread treatment was expanded, the first layout contained 326.2px/364.8px of content within only 178px/168px of a fixed editor card; the footer and sliders were clipped. At that point native selector heights were less than 44px. These were **real defects**.

A first experimental six-column flattening [run #39891759843](https://github.com/gamesbyian/wallgen/actions/runs/39891759843) did not work: the app's upstream CSS shrank the select controls to 27px, and the object picker plus fields still overflowed. Those experimental rules have been removed.

A more robust reflow grouped the original, handler-bound fields into two compact rows: **Target + Stitch style**, and **Region angle + Stitch spacing + Relief**. It reserved more tray height only when Thread opens, a little more for a specifically chosen object, and left desktop unchanged. A second actual [run #39892124094](https://github.com/gamesbyian/wallgen/actions/runs/39892124094) showed the **object-targeting** state fit in both browsers, with its last control reaching y847 (card bottom 888) at 412×892 and y676 (card bottom 696) at 320×700. Those rendered selectors/range tracks were 44px. However, the simpler **All** state was still clipped (last y909/y735): the 44px object picker was incorrectly occupying space despite being marked `hidden`, due to a too-broad `display:flex!important` rule.

The latest source fixes that native-hidden regression via an explicitly scoped `.embroidery-object-picker[hidden]{display:none!important}` selector and enlarges the paired numeric input hitboxes to 44px. Removing that uninvited picker row should recover the observed 56px deficit, without extra scrolling or moving actual handlers, but **the final post-fix visual run has not succeeded**. [The next Chromium run #39892310232](https://github.com/gamesbyian/wallgen/actions/runs/39892310232) stalled on dependency installation and was cancelled when this branch's CI was restored. No final physical-phone or final updated-browser acceptance is claimed.

## Final source rules and remaining practical check

- Native original DOM inputs remain unique and still use their original `fromControls` / `toControls` / Undo / recipe names; the changes are structural grouping and CSS only.
- In 320–412 portrait, two control rows use 44px selectors/angle/range inputs. The target-specific object selector only appears when its native `hidden` attribute is false; an extra tray row is reserved then. Preview space remains nonzero in completed browser screenshots.
- The explanatory small text is visually screen-reader-only while Thread expands in mobile Edit. Its original DOM and text persist. No extra popup or vertical scrolling was introduced.
- A focused Node source regression test covers unique fields, the hidden selector and intended 44px styles. These do **not** establish actual pointer hit areas on an Android handset.
- Repeat *only* the optional `scripts/review-thread-portrait.mjs` when Chromium network installation is reliable, or test the two real portrait sizes and two targeting states on the user's Pixel. Do **not** add another thousand-image atlas or rerun network-limited browsers solely to declare CI green.

## Run the small manual study

```sh
python3 -m http.server 4173 --bind 127.0.0.1 &
node scripts/review-thread-portrait.mjs --out-dir artifacts/thread-portrait
```

The script captures exactly 4 screenshots: 2 viewports × All/single-object targeting, plus bounding rectangle measurements and warnings in `report.json`. It is opt-in and does not belong in ordinary Pull Request CI.
