# Phone UI construction video: preparation checkpoint

**Status: preparation only. No recording has started.**

## Scope

Create a *real phone UI* tutorial for the current v2 ROYGBIV recipe supplied in chat on 2026-10-18 (seed `t0b4v5-ice7lf`). The recipe is a tapestry/regions composition using the new scene model. Its many stored controls include a drawn path and interior elements; do not assume it corresponds to previously uploaded screenshots. Its current normalized rendering, not old screenshots, is the output oracle.

This work must remain on a branch until the user explicitly approves actual production. No video, headless render, screen capture, or workflow dispatch is authorized yet.

## Repo observations

- `src/model.js` is the source of normalized recipe semantics; `src/composition-geometry.js` produces ordered scene objects.
- `src/editor-schema.js` owns settings/category/tool mapping and `WIZARD_STEPS`.
- `src/app.js` runs the real UI and handles state, imports and the draw/image path tools.
- `scripts/render-headless.mjs` already uses Playwright with production renderer for an independent target-image oracle. Do not create a parallel renderer.
- The mobile app uses the actual editor rail and tap targets. Record a live Chromium mobile viewport with genuine pointer interactions and visible artwork.

## Prepared now

`node scripts/prepare-phone-video.mjs --recipe /path/to/recipe-v2.json --out artifacts/phone-video/manifest.json`

This checks the recipe format, normalizes it using the **current model**, partitions changed controls into canonical tool/category stages and reports operations requiring special UI handling. It writes only a JSON manifest. It never opens Chromium or produces a video. The fixture should be saved byte-for-byte from the user's message on the recording branch or provided as a file at execution time. Do not substitute reconstructed paths.

## Work remaining before the first recording

1. Import/store the *complete exact* user recipe, including every `customPath` point, both `interiorElements` entries (including the disabled entry), seed and controls. Keep an immutable exact source fixture and check normalization/round trip.
2. Independently establish the target image with existing production headless renderer **only after the user authorizes creation**.
3. Implement a recorder with explicit `--record` permission gate and an otherwise safe `--dry-run` default. Use the actual mobile UI and standard controls; expose deterministic tool selectors where necessary without changing their human behavior.
4. Solve the drawn path UI tracing. Recipe path coordinates extend outside `[0,1]`; panning/zooming or a genuine app path editor import may be needed. Never inject the full recipe into app state and pretend it was constructed.
5. Handle interior elements through real editor actions, including disabled second element. Confirm hidden/inapplicable fields are not incorrectly set or shown.
6. Use a target-bound acceptance oracle: read the end-state recipe using app export, compare normalized semantic values, and compare final canvas to production headless rendering. On mismatch, fail closed and *do not* publish a misleading tutorial.
7. Record the full phone viewport. Preserve an uninterrupted evidence recording before editing any accelerated presentation version. MP4 encoding can use ffmpeg. Add recording output to gitignore if video files are local artifacts.
8. Keep differences between stored but inactive controls and *visually active* controls clear. Changing an inactive setting solely to make the video longer is not a valid user tutorial.

## Suggested filming order

Layout → Path → Shapes → Details → Colour → Material → Effects, following `WIZARD_STEPS`, with the drawn-path gesture in Path and interior line/placements in Details. Finish on the wallpaper, with a target image and normalized recipe equality check.

## Exit criteria for preparation phase

A manifest tool committed on an isolated branch, handoff notes and no attempted video production. Actual end-to-end recorder remains a separate, explicitly gated development milestone.
