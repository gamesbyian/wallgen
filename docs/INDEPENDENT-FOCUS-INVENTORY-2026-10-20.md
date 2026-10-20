# Independent Focus vs All named-tool sweep (20 October 2026)

## Scope

Own unchecked A/B and independent adversarial entries #11 and #2, following merged #280/#288/#305. The earlier Focus/All evidence sampled five representative scenarios; this exercise attacks broader structure/tool combinations in **actual Chromium** without inventing settings or changing defaults. It does not displace Agent 2's source-control inventory or Agent 1's human visual review.

## Reproducible test

`tests/independent-focus-tool-inventory.mjs` runs seven deterministic runtime environments over:
- Paths/wave and Paths/arc, with alternate material and theme.
- Paths/wave with shape/texture parameters explicitly locked.
- Radial/pinwheel and radial/rays in portrait and constrained landscape.
- Regions/nested and regions/voronoi under both themes.

For each enabled source category and runtime-applicable tool it selects the **real** chip, measures source range inputs that are not under a hidden ancestor, enters opt-in Focus, and compares one-to-one chips, actual numeric values, disabled/inactive/locked status, context help, and computed author-provided names. Tools without ranges must present an empty, noninteractive Focus slider state. Every parameter selection, Focus entry and All exit must preserve the complete normalized recipe; errors and screenshots are retained in artifacts. Unavailable categories/tools are explicitly logged, rather than claimed as tested.

The dedicated `independent-focus-inventory.yml` job requires syntax/unit checks, real Playwright Chromium and machine-readable evidence. **No browser results are claimed until CI passes at the exact head.**

## Signoff limits

This extends automatable parity evidence only. It is neither unscripted human testing nor an A/B *preference* study, does not approve unwired icon designs, and cannot certify native Android, TalkBack or actual screen-reader narration. Keep entries #2, #11, #15 unchecked.

## Final verified CI and integration

**Merged [PR #311](https://github.com/gamesbyian/wallgen/pull/311)** at
`8b5cadce6434fd35921faa6eb7d4151e4aa8c270`.

**Green exact-head run:** [39407144287](https://github.com/gamesbyian/wallgen/actions/runs/39407144287)
at source `58b7108dbb35698d81f19282a935b0405484a809`.
All **7/7** Chromium scenes passed with **182 runtime-applicable named
tool visits**, **178 real source range-state comparisons** (89 enabled,
89 disabled/inactive/locked), and **83 sliderless tool visits** that
correctly exposed no active Focus range control. The suite explicitly
logged **78** tool candidates as scene-inapplicable or disabled, without
claiming them as tested. Every Focus view and return to All preserved
the normalized recipe; no runtime browser errors were reported.
`npm test`, syntax checks and repository validation were also green.

This proves additional bounded source-to-Focus fidelity, with no
production styling or generation changes. It does not complete a
human comparative usability study, native screen reader confirmation,
physical device verification or visual approval. Acceptances #2/#11/#15
remain unchecked.
