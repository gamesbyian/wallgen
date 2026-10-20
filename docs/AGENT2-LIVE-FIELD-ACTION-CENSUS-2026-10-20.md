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

## Source-confirmed mobile Primes failure, repaired pending final CI

The independent browser matrix reproduced a **real production defect** after fixing only its fixture/harness errors: [run 39395608389](https://github.com/gamesbyian/wallgen/actions/runs/39395608389) had 85 successful browser field edits, with only `primesOnly` timing out waiting for the URL source to change. All other original actions' recipe mutations were scoped to exactly their source property, except deliberate Starting style preset fields and automatic optional material enable flags.

Cause: `src/mobile-preview-tools.js` reparented the *actual* Primes checkbox into a preview rail, while preserving its logical `form="controls"` owner. The checkbox's native `change` event consequently stopped bubbling through `#controls`. The old workaround dispatched a synthetic `change` on the form itself, but the event target became the **form**, so `src/app.js`'s existing delegated listener found no setting name and skipped the update. Thus the visible toggle could disagree with both URL and the next randomized wallpaper.

Repair: delegate the original form-owned settings' `change` handling from `document`, guarded by `event.target.form === form`, using the unchanged `updateControlsFromInputs()` source transaction. Remove ineffective synthetic forwarding from `mobile-preview-tools.js`; refresh script version keys in `index.html`. The test now uses a live DOM-global `data-setting` census to include the preview-mounted Primes field, checks its real recipe change, and verifies the same field after it returns inside `#controls` on desktop. The source count remains **87 globally**, although only **86 are DOM descendants of the form** at 412px: Primes retains `formOwner: controls`.

**Final proof still pending** at the repaired PR head. Do not claim 86/86 until all four shards and main validation pass again; no acceptance item is checked by this repair alone.

## Reconciliation after concurrent merges

The original green PR #282 could not be auto-merged because subsequent main-line changes landed while its Chromium matrix was completing. This branch is recreated from latest merged `main`, carrying only the minimal source form event correction and source-faithful test, and retaining unrelated header/accessibility changes. The current JS cache suffixes are `20261020-primes2` in both modules. All validation must be rerun on this new head. This document's earlier GHA links support the original old head, not new-branch verification.

### Final latest-main reconciliation

This PR branch was force-with-lease rebased to exact integrated main `e799abf9f1a5e559df54128367bbc769ececd317` (which includes Agent4 recovery #281 and queue evidence #290), then the three original source changes and three test/evidence assets were replayed. The current app and toolbar module versions use `20261020-primes3`. All checks on the new exact branch head are required again. Original initial passing runs are preserved as historical reproduction, not substituted for current-head CI.
