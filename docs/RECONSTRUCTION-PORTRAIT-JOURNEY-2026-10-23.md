# Source-backed 412×892 portrait image-reconstruction journey (23 October 2026)

**Evidence type:** actual Chromium running the real production ROYGBIV app with a 412×892 touch-emulated viewport at 2.625 DPR. Not an actual physical Google Pixel 6 Pro, Android native keyboard, hardware memory measurement or screen-reader acceptance.

## What was executed

[One-off GitHub Actions run #39943939880](https://github.com/gamesbyian/wallgen/actions/runs/39943939880), artifact `reconstruction-portrait-actual-journey`, after the narrower reusable `scripts/check-reconstruction-journey.mjs` harness landed. Source input `03-wave.no-metadata.png` was generated from an actual current 480×1040 ROYGBIV Wave output using the shared R0 renderer, then stripped of all descriptive metadata while preserving its IDAT data. Source file SHA-256: `fc37a156253300bb36101b87a3145b8c26db9f638edfcb9954d34d9ac1f55b83`.

The browser performed, in order, using the **actual app picker / state / painter / metadata writer**:

1. Save a baseline recipe JSON from the app before import.
2. Load the metadata-free image through `#imagePathFile`, await real cooperative 96×208 forward fits, and verify coloured source and reconstructed preview pixels.
3. Inspect the visible portrait dialog (screenshot), check 44px minimum hit target for Apply and Close, then tap **Use editable recipe**.
4. Save the accepted current canonical recipe JSON. Verify explicit `reconstructionOrigin.origin === 'inferred-image'` plus source 480×1040 dimensions and acceptance-time error. This is **not** the original authored seed/settings.
5. Click the ordinary **Download PNG** control and separately parse its embedded recipe using the existing `extractPngRecipeWithProvenance`. Verify the inferred origin is preserved.
6. Undo the Apply and download a new JSON receipt; assert the entire recipe is exactly identical to the baseline.
7. Restore the saved PNG with the existing `#importRecipeFile`, save another JSON receipt, and assert full equality to the accepted reconstructed recipe.
8. Hash the original metadata-free PNG again and assert unchanged source bytes.

**Verified results:** all eight assertions passed, with **zero uncaught page errors**. Candidate: `Editable flowing wave · fitted`, source-relative fitting error **0.040538** for the UI's current seed (versus **0.046144** in the separate anonymous-seed R0 evidence). Two preview canvases each 96×208 contain actual coloured ink. The native dialog measured **874px client and scroll heights**, so no dialog overflow at 412×892. The Apply control measured **244×44 CSS px** and Close **44×44 CSS px**. Chromium reported candidate fitting **1,087ms**, PNG export **293ms**, complete browser journey **3,001ms**, full PNG **799,113 bytes**. These timings depend on the GitHub-hosted Chromium runner and MUST NOT be called a Pixel handset performance measurement.

## Reproduce manually, not permanent CI

Serve the repository locally, then run the **opt-in** checker; Playwright/Chromium must be present:

```bash
python3 -m http.server 8712 --bind 127.0.0.1
node scripts/check-reconstruction-journey.mjs \
  --url http://127.0.0.1:8712 \
  --source artifacts/reconstruction-r0/03-wave.no-metadata.png \
  --out-dir artifacts/reconstruction-journey-manual
```

The checker requires an explicit metadata-free input and a local URL, refuses to overwrite previous evidence, saves report JSON, baseline/accepted/undone/restored JSON recipes, screenshot and the real recovered metadata-bearing PNG. The app itself stores **no source file pixels**; the opt-in script operates on its explicitly provided local test fixture. There is no permanent browser workflow: the temporary single-run Actions job was removed before merging this deliverable.

## Actual screenshot inspection and remaining UX work

The 412×892 screenshot was downloaded and opened. Its existing large image preview, exposed source/reconstruction pair, and both portrait actions are visible; no global dialog scrolling was required. **Remaining cosmetic/usability observation:** the reconstruction uncertainty/status prose truncates inside the small two-line scrollable paragraph, and the `Editable recipe approximations` label sits very near the rounded outline. This should be addressed with a concise, truthful summary and optional accessible details rather than lengthening the dialog or reducing preview space. The large source image shows existing extracted cyan path outlines, distinct from the much smaller actual rendered candidate comparison. Focus remains tight and tap targets pass this emulated viewport.

Still unverified: physical Pixel 6 Pro PWA installation, Android keyboard/TalkBack, memory/thermal profile, actual wallpaper installation, user-approved artistic quality, and independently licensed arbitrary external image success. Keep #557 open for those; the browser test does **not** close that work.


## Follow-through: the unreadable fit disclaimer is now readable (23 Oct, #608)

[Source-backed 412×892 touch-emulated Chromium run #40013772974](https://github.com/gamesbyian/wallgen/actions/runs/40013772974) exercised the full preexisting **real** metadata-free Wave → fitted candidate → Apply → PNG export → exact Undo → exact current-PNG re-import journey while adding one targeted explanation test. Opt-in artifact `reconstruction-readable-portrait-why-proof` contains both **actual browser screenshots** (`import-portrait.png` and `fit-explanation-portrait.png`), JSON receipts and exported PNG. Both screenshots were downloaded and visually inspected; the explanation opens above the native image importer without destroying the image or source/candidate pair.

The previous screenshot showed the visible "Editable recipe approximations" label overlapping its parent border and cut a technical explanation off mid-sentence. A screen-reader-only label now owns the same accessible select; visible card status reads **"Difference 0.041 · lower is better · inferred"** and a 44px **Why?** trigger opens a native, dismissible popover containing the complete candidate uncertainty, source/provenance warning and any locked setting differences. The source and reconstructed raster previews are unchanged. The entire dialog still measures **874px client/scroll height**, no parent scrolling. Actual card **152px client/scroll** and summary **13px client/scroll**, both exactly fitting. Apply target **244×44 CSS px**, Why **44×44**, Close **44×44**. The HTML popover opened, displayed the complete explanation and dismissed before Apply; no uncaught page errors.

The first one-off run correctly caught a **four-pixel card overflow** despite quick CI passing. The card's padding/cap was adjusted by only a few pixels and verified in the repeated browser run, without introducing a compact status scroll trap or sacrificing the generous source image preview. Estimated fit was **1,286ms** and PNG export **308ms on the CI Chromium host only**; these are not Pixel performance numbers and can vary.

The reusable `scripts/check-reconstruction-journey.mjs` now tests visible/complete summary, 44px actions, accessible details, and the original complete PNG/Undo/source-byte transaction. The source file remains untouched and original author settings are **not falsely asserted**. Only existing lean `check:quick` runs automatically. The temporary browser workflow was removed before merge.

Remaining: physical Pixel Chrome/PWA touch, Android font scaling/TalkBack, owner visual sign-off, arbitrary licensed imports. Continue #557; do not treat a browser screenshot as device acceptance.
