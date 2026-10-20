# Agent 2 live source-field action census, 2026-10-20

**Scope:** unchecked control reachability / canonical screen functionality / dormant and locked behaviour (master acceptance entries 1, 4 and 8). Continue after green, merged #279 (twelve canonical screen minimum hitability gate) and merged #268 (29 conditional scenes, 87-field browser state census, JSON/More functions).

## New independent experiment

`tests/agent2-live-field-action-matrix.mjs` enumerates the **actual 87 `data-setting` original fields in a running browser** and, in four independent Chromium CI shards, tries to perform one genuine user input action for each currently supported field. Each case starts from a deterministic normalized URL recipe; chooses the original category and named tool; requires enabled/not-dormant original field; operates a native select, checkbox, source range step button or numeric input; waits for the real URL recipe to change; and verifies the exact source key changed. Available source locks are also locked/unlocked with a disabled-field witness. All exceptions and screenshot failures are recorded as negative evidence, never silently omitted.

Fixture selection covers Paths/Ribbon, hairpin/loop/loops/stepped/chevron/Drawn, floating, radial pinwheel, Voronoi and nested Regions, diagonal transform, material layers and light/shadow. The test intentionally excludes historical `tonalContrast`: its only native creation route, Tonal construction, remains HTML-disabled. The two genuine layer-enable checkboxes are *not* part of the 87 `data-setting` inputs; they are hidden source fields controlled by the actual Material layer UI and have separate regression coverage in #268 and #202.

The script is **a test proposal until its own CI passes**. The precise count of proven action witnesses, failures, locks and unexpected multi-key changes must come from `evidence.json` produced by CI. Do not infer 86/86 success from source inventory.

## Reproducibility

`npm install --no-save playwright@1.56.1 serve@14.2.5`; `npx playwright install chromium`; serve the repository on `http://127.0.0.1:4173`. Run `node tests/agent2-live-field-action-matrix.mjs` to exercise all, or set `AGENT2_FIELD_SHARDS=4` and `AGENT2_FIELD_SHARD=0..3` for parallel jobs. In GitHub Actions use `.github/workflows/agent2-live-field-action-matrix.yml`, whose per-shard artifacts include both passes and failure screenshots.

A verified non-change, disabled field, or intercepted pointer is a **failing test**. Any underlying defect must be reproduced and fixed in its original source handler, with a regression in this lane. Unrelated visual CSS, exports, galleries and Draw phase implementation belong to other agents.

## Acceptance boundaries

All three assigned master checkboxes remain unchecked pending complete independent adjudication of disabled values, mode combinations, all 177 canonical required/conditional/forbidden assertions and true browser operability. This suite deliberately does not claim exhaustive permutations, subjective visual approval, genuine Android touch hardware, OS-level accessibility or native screen-reader verification.
