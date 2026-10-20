# Agent 2 canonical required-source qualification, 2026-10-20

Scope: master acceptance #4, **compare every canonical plate with its exact required feature inventory**. No redesign of the plates, no output/canvas/geometry changes.

The 177-entry source-to-screen traceability manifest has 12 plate scenarios, 121 required, 29 conditional and 27 forbidden claims. Earlier PR #279 proved only **one** genuinely hittable action per plate, which meant an entire source-required feature group could go missing while the per-screen liveness check still passed.

The twelve-screen real Chromium test now additionally requires **every required claim in each scenario to have a matching actual source DOM candidate** and demands one specifically required mapped action have an enabled physical centre-hit witness per screen. It reports per-plate `requiredClaims`, `requiredSourceMapped`, `requiredActuallyVisible`, and `requiredPhysicallyHittable`. Invalid selectors and browser errors remain failures. The test deliberately distinguishes a source match from a visible, enabled, physical, actually clicked control.

Existing conditional cases remain assessed by scenario-specific behavioural tests (e.g., 29-mode source state matrix, true field action census and dormant-lock journeys), not by equating a hidden optional field with a missing required feature. The 27 forbidden claims include subjective/semantic constraints that cannot be fully established through a generic selector. Their separate adversarial and human review gates stay **NOT VERIFIED**. Similarly this test alone cannot promote all 121 feature claims to fully interactive: many are decorative text, canvas or grouped functions, and presence is only source-qualified. Do not check master entry #4 until the remaining action, conditional and forbidden exceptions are individually adjudicated.

Reproduce by running `node tests/redesign-live-plate-coverage.mjs` against real `http://127.0.0.1:4173` Chromium. CI: `.github/workflows/agent2-controls-acceptance.yml`, artifacts under `artifacts/agent2-live-plates`.

Evidence requires a successful run on the proposed head commit. Existing human/physical-device acceptance boundaries remain unaffected.

## Real counterexample found and corrected in traceability

The first strict 121-required mapping test [run 39397435523](https://github.com/gamesbyian/wallgen/actions/runs/39397435523) located one **incorrect source manifest claim**, `focus.required.07` (“Existing colour assignment retained”). The candidate CSS selector `.rainbow-slider` is absent from the genuine ROYGBIV implementation; the production mechanism sets `--roygbiv-slider-color` on each original range using `src/rainbow-sliders.js`. The original field identity is `[data-setting][type="range"]`; no new class or source handler was introduced.

The manifest now maps that one required claim to `[data-setting][type="range"][style*="--roygbiv-slider-color"]`, and the live Focus plate test **also** records both original Geometry source range colours before Focus, selects a different Focus parameter through the real browser and verifies both original colour assignments remain identical and distinct. This adds behavioral evidence beyond a CSS source match, with the broader visual approval still left open.

First-run 11 other plates showed their required source claims fully mapped in real Chromium: Studio 13, Geometry 13, Draw 12, Explore 9, More 14, Material 11, Colour 9, Diagonal 8, Compact 8, History 7, Search 8. That is 112/121 required mappings before repairing the single Focus candidate, NOT a fully green 121-claim report. Wait for the subsequent CI before promoting.
