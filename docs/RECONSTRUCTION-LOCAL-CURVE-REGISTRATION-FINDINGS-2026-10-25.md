# Local curve registration: genuine R0 negative and geometry discovery

**Issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557) • **Draft:** [#708](https://github.com/gamesbyian/wallgen/pull/708) • **Five-source production Chromium run:** [40217651636](https://github.com/gamesbyian/wallgen/actions/runs/40217651636) • **Artifact:** r0-ink-geometry-source-fit (ID 12608395108)

## Objective and implementation

After [#707](https://github.com/gamesbyian/wallgen/pull/707) disproved global stripe-width and spread changes, this experiment asks whether **bounded local residuals** identify a better procedural Hairpin/Loop curve hypothesis.

The existing seven shared hue masks produce five fixed image-height occupancy envelopes at Y fractions 5–24%, 24–42%, 42–60%, 60–78%, and 78–96%. Each records the source and already-rendered canonical proposal's ink count, x-centroid, left/right observed endpoints and contiguous occupied runs **without inferring hidden pixels**. It derives paired residuals only where both masks contain meaningful art. It is a read-only report in `compareRainbowInkGeometry`; no new segmentation, hidden model, estimator, or renderer.

The new optional `--probe-local-curve` flag **reuses the already rendered best candidate** from the normal ≤6 initial and ≤10 refinement fitting and tries six additional, distinctly labelled **offline-only** true `drawWallpaper` outputs for Hairpin or Loop when stable source upper-band gap evidence exists. All trial PNGs, errors and variations are saved, **without entering the production fitting budget or committing a recipe**. The standard comparator continues to select the ordinary original candidate; source truth sidecars are not available during inference.

## Actual results, October 25 2026

[CI #40217651636](https://github.com/gamesbyian/wallgen/actions/runs/40217651636) succeeded, including **15 focused geometry/driver tests**. These are five genuine current-renderer source pairs, not invented coloured SVGs. Existing scores for #16 displaced Jagged, #18 holed repeated compound and #22 reversed occluded circles remain exactly unchanged.

| Source | Existing fitted error | Offline perturbation from current best | Actual error |
| --- | ---: | --- | ---: |
| #05 Hairpin | **0.08447791** | Width 65→57 | 0.09178224 |
| #05 Hairpin | **0.08447791** | Width 65→52 | 0.09899958 |
| #05 Hairpin | **0.08447791** | Spread 32→38 | 0.08935974 |
| #05 Hairpin | **0.08447791** | Spread 32→44 | 0.12474135 |
| #05 Hairpin | **0.08447791** | Turn radius 35→42 | 0.10133851 |
| #05 Hairpin | **0.08447791** | Exit angle 145→135 | 0.09447331 |
| #06 Loop | **0.04977317** | Loop radius 62→56 | 0.05406444 |
| #06 Loop | **0.04977317** | Loop radius 62→68 | 0.05766413 |
| #06 Loop | **0.04977317** | PositionX 6→0 | 0.15736914 |
| #06 Loop | **0.04977317** | PositionX 6→12 | 0.16746186 |
| #06 Loop | **0.04977317** | Loop sweep 355→345 | 0.14556644 |
| #06 Loop | **0.04977317** | Loop sweep 355→360 | 0.12671952 |

**All twelve isolated adjustments were worse**. Do not add them to normal fitting. Modifying values toward the known original R0 recipe after the fit is not a valid inference method and can still worsen a painter whose source seed and other coupled geometry controls differ. The actual past original recipes are used solely for separately labelled after-the-fact R0 floor validation, not any experiment's ranking or hints.

## Region-specific observations

- **Hairpin #05:** In upper zone (Y 10–49 of 208), source centroid x=31.3548 versus fit x=29.5, a **+1.8548px source-minus-fit** residual; lower zone Y 162–199 source x=48.8589 versus fit x=52.0554, **−3.1965px**. Residual sign reverses between stem and U-turn. Mean occupied row runs differ dramatically: **5.0 vs 1.0** at the top, **4.27 vs 1.61** at the bottom, indicating missing visible pigment separations even where occupied silhouette area largely agrees. Uniform translation and thickness are intrinsically insufficient.
- **Loop #06:** Envelope centroids differ by less than ~1.11 px in all five zones, and the upper silhouette bounds differ only ~1px; yet the source has **6.375 runs/row vs 3.85** at the top and **6.816 vs 3.447** at the bottom. The failure is predominantly **local pigment channels, winding/crossing shapes and stroke topology**, not macro scene registration. Raw flood-fill component mismatch (62 at 96×208) is strongly affected by aliasing, so it cannot be treated as 62 real missing objects.

**Direct optical review:** The actual GHA R0 source, normal fitted, and twelve separately rendered trial PNGs were downloaded and opened together at matched visual scale. Hairpin variations independently thin, widen, round or displace U-turn pigment but never simultaneously retain the black channels and exit position; Loop radius adjustments change ring placement slightly, while sweep variation and X translation visibly deform or detach winding tails. The numeric losses agree with these visible defects. This is independent assistant imagery review, **not** owner/human or physical Android signoff.

## Disposition and next engineering work

**Keep** the mask-based five-zone local residual report, tests and manually triggered optical study as diagnostics. **Reject** all twelve source-gated single-control procedural changes. The current fitted candidate remains production best; no new runtime dependency, changed recipe schema, worker path, palette, locks, provenance, Undo or default rendering.

The decisive remaining architectural question for #557 is **per-hue editable observed silhouette geometry**. A single canonical `scatteredShape` snapshot is currently applied identically to each scattered hue stamp; `scatteredOverrides` permits index-specific position/radius but **not an independent compound geometry per hue**. Real Hairpin/Loop pigments have different curved and crossing outlines, so a shared stamp cannot faithfully preserve visible source shapes even if VTracer can trace them. Investigate an **opt-in, bounded per-object portable geometry override** inside the existing canonical scattered-scene model, with exact source-visible islands/holes, legacy default unchanged, scene/renderer/worker/export parity and full 3024×6552 receipt tests. Avoid a second scene model or raw pixel layer. This does not invent clipped/invisible strand geometry or recover original procedural seed.

Other alternative: improve Draw path fitting with visible source-derived curves per hue; only promote if the actual current renderer produces source-backed gains within its 6+10 budget.

**Do not treat this diagnostic PR as solving #557.** Maintain Agent 1 source implementation and Agent 3 final QA boundaries. Physical Pixel 6 Pro, voice/IME and creative approval remain not tested.

[Research plan](RECONSTRUCTION-VISION-ALGORITHM-REUSE-AND-TEST-PLAN-2026-10-24.md) • [previous Hairpin/Loop findings](RECONSTRUCTION-INK-GEOMETRY-GENUINE-FINDINGS-2026-10-25.md) • [engineering ownership](ENGINEERING-REUSE-AND-SEMANTIC-OWNERSHIP.md)
