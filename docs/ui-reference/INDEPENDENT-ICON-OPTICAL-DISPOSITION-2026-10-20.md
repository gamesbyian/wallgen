# Eight candidate icons: independent optical disposition

Date: 20 October 2026. Reviewer: ChatGPT, independent **AI visual inspection**. This is neither a fabricated human user session nor adoption of a symbol into the live interface.

## Exact evidence personally inspected

The complete [68-glyph original registry capture](actual-implementation/icons/pan-states.png) was supplemented by the **eight individually filtered, native 1280×900 Chromium PNG panels**, each showing original source vector geometry at 20, 24 and 28 CSS pixels across cream/dark and normal/selected/disabled/focus. Their [per-image SHA-256 and immutable checkout provenance](actual-implementation/review-provenance.json) were validated and durably committed in [PR #357](https://github.com/gamesbyian/wallgen/pull/357). I directly inspected the visible icon glyphs, not just CSS/layout geometry.

## Decisions for prospective use

| Original icon | Optical verdict | Source action required before future wiring |
| --- | --- | --- |
| [Pan](actual-implementation/icons/pan-states.png) | **Conditional pass, 20px+**; centre dot and directions survive both themes | Explicit View frame Pan; **never** composition nudge |
| [Anchor points](actual-implementation/icons/anchor-points-states.png) | **Conditional pass, 24px+**; 20px handles are weak | Label Edit points; preserve existing Draw pencil and anchor phases |
| [Smooth path](actual-implementation/icons/smooth-path-states.png) | **Conditional pass, 20px+** with text | Interpret / Resmooth, not a new freehand editor |
| [Extend path](actual-implementation/icons/extend-path-states.png) | **Conditional pass, 24px+**; 20px boundary details crowd each other | Extend path beyond frame, with conditional availability |
| [Weave](actual-implementation/icons/weave-states.png) | **Conditional pass, 24px+** with explicit Over/Under | Text and state distinguish crossing from a Cancel X |
| [Focus slider](actual-implementation/icons/focus-slider-states.png) | **Conditional pass, 24px+**; resembles current Edit controls | Optional Focus; **All remains default** |
| [Metadata](actual-implementation/icons/metadata-states.png) | **Conditional pass, 20px+**; document rules survive the earlier dark fix | Image metadata only; use original labelled More control |
| [Restore variation](actual-implementation/icons/restore-variation-states.png) | **Conditional pass, 24px+**; dense at 20px and refresh-like | Restore variation, not Undo or History |

These eight exact decisions are persisted in the source [icon manifest](../../assets/icons/roygbiv/manifest.json) as `independentOpticalReview` fields. All eight **remain marked candidate; not wired into UI** and all fields say `actualUserApproval:false` and `liveWiringAuthorized:false`. No source handlers, navigation controls, generated art, existing brand glyphs or defaults were changed.

## Acceptance and remaining human decision

The checklist's **human/independent optical review** requirement is completed via the independent reviewer route with actual source image inspection and individually constrained dispositions. This is not a claim that the human user prefers the icons or that these eight have been authorized to replace existing live buttons. Future adoption requires explicit source-control mapping, visible text/size restrictions, post-wiring actual browser accessibility checks and separate user/physical-device acceptance. Until then the current interface stays unchanged and the manifest blocks treating a candidate as already integrated.

The eight candidates are optically acceptable **only under their stated minimum sizes and labels**; icon-only 20px use is *not* universally approved, especially for Weave, Extend and Restore.
