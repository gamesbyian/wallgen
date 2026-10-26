# #557 · Canonical palette Tone · real Chromium software acceptance

**Date:** 26 October 2026 (Calgary), **scope:** opt-in creator saturation/lightness editing and canonical painter/worker/export. This is **not** an imported-image inverse fit and does **not** claim recovered source provenance.

## Problem and supported creative capability

The eleven shipped static colour stories cannot express independently Canvas-authored **very soft (HSL S≈23%, L≈70%)** or **dark (S≈88%, L≈13%)** source pigments. Previous [#743 soft](https://github.com/gamesbyian/wallgen/pull/743) and [#746 dark](https://github.com/gamesbyian/wallgen/pull/746) correctly **refuse fake bright source reconstructions**. Refusal is not full source representability; a creator still needs to draw these pigments intentionally. This PR builds on the **one canonical** `paletteHsl -> resolveScene -> shared renderer` path with three opt-in saved settings:

- `paletteToneEnabled` false by default; existing authored/randomized wallpaper appearance unchanged.
- `paletteSaturation` 0..100; `paletteLightness` 0..100. An already selected story still owns seven different hues and per-pigment lightness offsets. Controlled by separate Colour → **Tone** tool. **Band tones** remains a different tool and a distinct `tone` randomizer scope.
- Initially checking Tone captures the current resolved story saturation and lightness in one native Undo transaction, **without a perceptual or pixel jump**.
- Unrestricted Randomize cannot opt into Tone; dormant custom sliders remain preserved. A creator who has explicitly opted in can reroll their Tone values, respecting independent locks. Other user geometry, source images, texture, worker, PNG metadata and normal 6+10 inverse-painter budgets are unchanged.

## Real production editor journeys

[Qualified current-head genuine Chromium run #40384003552](https://github.com/gamesbyian/wallgen/actions/runs/40384003552) **SUCCESS** at the optically qualified branch head, following [first optical #40383638776](https://github.com/gamesbyian/wallgen/actions/runs/40383638776) and [lean quick #40384003580](https://github.com/gamesbyian/wallgen/actions/runs/40384003580) **SUCCESS**.

**Two actual portrait Chromium browser viewports, 320×700 and 412×892**:

- Loaded an encoded canonical, studio/Jewel, seven-scattered-object recipe into the **actual editor**, used the on-screen Edit → Colour → Tone chooser (distinct from Band tones), checked native enable, then manipulated saturation and lightness with **keyboard** Home/End/Arrow keys, not scripted DOM value assignments.
- Before enable vs immediately after enable PNG preview bytes **identical**, including actual painted pixels. The adopted story was **84% saturation, 39% lightness**. Subsequent **23%/70%** edits changed actual preview image bytes and all seven source colours.
- Actual Undo reversed a Tone edit without spontaneously disabling Tone; canonical JSON/URL recipe round-trip recovered exact authored fields. Tone field widgets remained visible/usable at both portrait sizes. Screenshots of the **actual expanded Tone card** are in retained browser artifacts, not relabeled Studio-only shots.
- In 412×892, the visible wallpaper Download control produced an actual **3024×6552 (19,813,248-pixel) PNG** whose embedded canonical source recipe, including enabled Tone and the seven-scattered-object scene, decoded **exactly**. Both browser viewports had **zero unhandled JS exceptions and zero unsolicited GitHub requests**.

## Real render bytes, inspected images

The same job invoked ordinary `scripts/render-headless.mjs` on fully normalized source recipes using **reference and worker production renderers separately**, with exact PNG byte equality required for every pair:

| Source-authored Tone | Output | Reference bytes | Worker/reference |
| --- | --- | ---: | --- |
| OFF, stored S=23/L=13 | 600×1300 | 63,121 | exact |
| ON, soft S=23/L=70 | 600×1300 | 63,081 | exact |
| ON, dark S=88/L=13 | 3024×6552 | 585,537 | exact |

Original baseline classic seven-object composition and soft source share 600×1300; real decoded PNGs differ at **482,857 / 780,000 pixels (61.90%)**, rather than only metadata. Source/worker PNG images and both live-editing 320/412 screenshots were downloaded and **opened/inspected**. Soft art retains recognizably distinct dusty hues, dark art paints genuinely low-light distinct hues and all seven regions retain their relative placement; neither is a claimed reconstruction of independently supplied source artwork. In-browser canvas baseline→first-enable image pairs are exactly equal. These are **current software forward-model tests**, not scientific colour calibration or owner judgment.

[Retained genuine original screenshots, both 3024×6552 exports and recipe files](https://github.com/gamesbyian/wallgen/actions/runs/40384003552/artifacts/12679313321). Experimental optical workflow was returned to **manual-only** before merge. The normally cheap `npm run check:quick` now includes the small dedicated Tone semantic/locks/scoped tests.

## Pre-integration source isolation regression

The genuine Tone creator capability exposed one new inverse-import risk: a user may edit a completely different wallpaper with custom Tone enabled, then import a source PNG with ordinary canonical hues. Without explicit resets, the source candidate base and source-visible per-hue shapes would inherit that stale saturation/lightness, falsely changing source pigment colours while geometry appeared correct.

The same canonical source-state neutrality contract established by merged #728 now resets `paletteToneEnabled:false` (with dormant classic 92/58 values) in `strippedCandidateBase` and source-visible `observedHueShapeRecipe`. Creator-lock projection is preserved; if a locked **enabled** private Tone would make the source-visible seven-hue recipe visually wrong, that particular inferred per-hue candidate is refused rather than pretending it matches the source. Fresh deterministic tests use actual independent raster hue regions and triangular seven-hue polygons, compare clean vs polluted source candidate kinds and all canonical colour settings, prove the original RGBA bytes unchanged, and verify protected-lock refusal. [Final source-isolation quick CI #40385083062](https://github.com/gamesbyian/wallgen/actions/runs/40385083062) **SUCCESS**. This narrow extra change modifies no forward painter algorithms or creator Tone UI; the previously accepted production Chromium Tone optical images therefore remain valid.

## Boundaries and next #557 gate

- This supplies the **ability to paint** source-like low-saturation and very dark hues; it does **not** change `image-path.js` importer thresholds or make the existing automatic inverse fitter recognize them. Keep current source-truth refusals for unsupported sources until an **independent** future opt-in source mask / actual painter acceptance proves a representable seven-hue mapping, shape geometry and output colour.
- No physical Pixel 6 Pro, Android input method, real Android TalkBack, thermal/heap/battery endurance, creator usability judgement, authenticated backup or originally authored human graphic acceptance occurred.
- Preserve active work boundaries: Agent 2 #653 typography, Agent 3 #664 independent final integration/software acceptance; Agent 1 owns reconstruction issue #557. Avoid modifying their shared code to chase a colour-only benchmark. **#557 remains open.**
