# Agent 2 reversible conditional source actions, 2026-10-20

**Scope:** control reachability, real conditional-state fidelity and truthful dormant-source values (unchecked redesign acceptance 1, 4, 8). This experiment follows merged [#289](https://github.com/gamesbyian/wallgen/pull/289), which independently exercised **86/86 currently applicable original `data-setting` controls** and fixed the genuinely inert mobile Primes change event.

## Newly falsifiable missing scenario

Original [#268](https://github.com/gamesbyian/wallgen/pull/268) checked **29** representative source-state fixtures for displayed zero, disabled status and retained URL values. [#284](https://github.com/gamesbyian/wallgen/pull/284) separately proved **20** real locked→dormant→recovered journeys. Neither experiment broadly checked the **same live source driver through both forward and reverse actions, the dependent field state before/after, and exact full recipe restoration** at both portrait and short-landscape viewports.

The `tests/agent2-conditional-active-action-matrix.mjs` test adds **16 source-driven transitions**, repeated at **412×892** and **700×412**, totaling **32 actual Chromium interaction journeys**:

| Conditional family | Original source driver | Dependent source value | Transition |
| --- | --- | --- | --- |
| Radial Spokes | Ray coverage | Twist | Remains dormant |
| Radial Concentric | Ray count | Twist | Remains dormant |
| Regions Nested | Polygon sides | Jitter | Remains dormant |
| Regions Voronoi | Jitter | Polygon sides | Remains dormant |
| Lighting off | Lighting mood | Direction | Reenabled |
| Zero light strength | Light strength | Direction | Reenabled |
| Material Layer 2 zero strength | Layer strength | Layer scale | Reenabled |
| Material Layer 3 zero strength | Layer strength | Layer angle | Reenabled |
| Horizontal direction | Orientation | Diagonal angle | Reenabled |
| No outline | Outline type | Gap | Reenabled |
| No Regions dividers | Divider colour | Divider width | Reenabled |
| Single composition | Composition | Repeat count | Reenabled |
| Woven construction | Construction | Motif size | Reenabled |
| Solid ribbon | Motif | Motif size | Reenabled |
| Zero individuality | Individuality | Individuality override | Reenabled |
| Zero stripe shadow | Stripe-shadow strength | Shadow softness | Reenabled |

Each case starts with an exact normalized URL recipe, uses **real mobile Edit → canonical category → named tool** selection, observes actual native field disabled and `data-inactive` attributes, confirms a zero readout without erasing the retained recipe, performs a genuine pointer-operated slider step or native select, waits for the source URL to change, checks the dependent's expected status and value, then performs the reverse browser operation and requires the **complete serialized recipe** to be bit-for-bit-equivalent after normalization. Failure screenshots and per-case details are saved to the workflow artifacts.

**Status: VERIFIED AND MERGED.** All **32/32 real Chromium journeys passed**, eight independent source-driven tests in each of four shards at [run 39403426414](https://github.com/gamesbyian/wallgen/actions/runs/39403426414); [Validate Wallgen 39403426406](https://github.com/gamesbyian/wallgen/actions/runs/39403426406) passed. Merged [PR #299](https://github.com/gamesbyian/wallgen/pull/299), implementation commit `90f36b8f3bc533761fb3698b746dd4a93c849893`. The first red run found a **test fixture dependency mistake**: light direction remained legitimately active because shadowStrength had not been zeroed along with lightStrength. Both contributions are zero in the corrected fixture, and the final real-browser evidence passes. Existing 39 named-tool click qualification, all 121 required canonical selector mappings, six objective forbidden-state canaries and all 86 eligible field action witnesses remain distinct evidence classes. Unbounded mode/value combinations, native Android Chrome, OS screen-reader output and human review remain unverified.

Reproduce via `npx serve . -l 4173`, then `AGENT2_CONDITIONAL_SHARDS=4 AGENT2_CONDITIONAL_SHARD=0 node tests/agent2-conditional-active-action-matrix.mjs` and repeat shards 1..3. CI configuration: `.github/workflows/agent2-conditional-active-action-matrix.yml`.
