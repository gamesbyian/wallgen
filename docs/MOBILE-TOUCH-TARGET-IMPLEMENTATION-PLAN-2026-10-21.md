# Mobile touch-target implementation plan and evidence ledger

**Created:** 2026-10-21. **Base:** `6389e4ec7dc3a71f37656ba2b72ad04a747d6e2e`. **Owner lane:** cross-surface *touch geometry, browser instrumentation and ergonomic QA*. **Companion:** [multilingual R&D report](MOBILE-TOUCH-TARGET-RESEARCH-2026-10-21.md). **Current implementation status:** [delivery and measured-evidence ledger](MOBILE-TOUCH-TARGET-DELIVERY-2026-10-21.md).

This is an additive ergonomics initiative. Do **not** reopen historically completed functional checkboxes in `docs/UI-REDESIGN-IMPLEMENTATION-QUEUE.md` or conflate the remaining supported-layout **human visual approval** gate with a new numeric touch-target goal. Preserve source controls, actual behaviour, normalized recipes, camera invariants, generated output, five-way dock, Focus opt-in, icon authorization, and portrait-first support policy.

## Common agent working rules

1. Start from fresh `main`, read the live queue, CSS ownership table, browser atlas/geometry scripts, existing acceptance records and recent PRs/issues. Perform the 3-project reuse preflight before inventing utilities. Inspect competing open PR heads and coordinate file ownership; do not overwrite another lane or claim parallel-agent work as this lane's evidence.
2. Work on a dedicated topic branch. Make narrow, independently understandable commits, open a PR, inspect applicable exact-head CI and actual evidence, repair genuine regressions and merge **only when gated**, with the project owner retaining any required aesthetic/hardware sign-off.
3. Work ahead on independent tasks rather than repeatedly polling CI. Carry findings, reproduction, exclusions, precise URLs/source SHA and remaining gates in this ledger. No 'passed' claims until the exact executable witness has actually run.
4. No paid service, new account, permanent backend, third-party runtime JS dependency, manual phone-work prerequisite or user intervention for automatable tasks. Do not pursue tiny sideways-phone layouts.
5. Do not change drawing math, serialized schema, wallpaper texture, output size, palette/source art, locks or randomization scope for an ergonomic task. No cosmetic icon swaps without authorizing their semantic/size use. For production CSS, edit the owning stylesheet named in `docs/CSS-COMPONENT-OWNERSHIP.md`, not a new layer of `!important` overrides.

## Stage A: reliable measurement and falsification instrumentation (P0; owner: this PR)

- [x] Identify available baseline: `scripts/ui-atlas-geometry.mjs` and its tests; `scripts/ui-atlas-inspect.mjs` already record target-box size and associated-checkbox-label rectangles. Read merged overlap fix [#315](https://github.com/gamesbyian/wallgen/pull/315).
- [x] Add **pure and tested** 24px spacing-candidate calculations separate from the existing `inspectTargetBox()` API. For an undersized target, check its 24px-diameter exclusion circle against independent regular target rectangles and other undersized circles; handle tangency, vertical/horizontal/diagonal cases. Avoid treating checkbox and *its own* associated label as independent conflicting targets. Mark rectangle-only conclusions as **candidates** if shape/paint/DOM must be checked.
- [x] Integrate *diagnostic-only* counts into the atlas: sampled independent targets, potentially failing 24px spacing, <44px recommendations, bounded selectors/sizes/nearby-neighbour evidence. Include all checked and excluded counts; preserve existing `smallActionCount`/`under44Count` shape so prior consumers do not break.
- [x] Add bounded diagnostic-only 3x3 `elementFromPoint()` sampling to up to 32 visible undersized buttons per atlas capture, with blocked-point examples. This probes stacking, not actual tap outcomes.
- [ ] Add genuine independent Playwright `tap()` actions at sampled edge/near-neighbour locations in a separately bounded acceptance matrix. Deduplicate nested/wrapped controls and do not force pointer events on unavailable elements.
- [x] Verify no effect on recipes, downloads, focus, tool/conditional selection or atlas screenshot rendering for the initial diagnostic-only code. Exact-head [Validate Wallgen run 39554399082](https://github.com/gamesbyian/wallgen/actions/runs/39554399082) and [UI screenshot atlas run 39554399073](https://github.com/gamesbyian/wallgen/actions/runs/39554399073) completed successfully for `2836fde84fb15e2004cca0ec2fe5d747f6d6bf4c`. **Gate:** `npm run check`, unit tests for spacing, actual Chromium atlas/representative mobile browser and exact-head CI green; record source-bound numbers. Testing locally without a browser is unit proof only.

## Stage B: source-specific target corrections (P1; owner: owning visual/editor component agents)

- [ ] Mobile `.settings-tab` (24px), per-setting `.setting-lock` (26px), scoped dice and Focus toggle/chips: measure **actual** effective regions first; compare 44/48px reserved cells versus full-row labels without collision.
- [ ] Interior select/range controls (27px) remain to be measured and redesigned; seven ROYGBIV chips at 412–790px now have 44px native labels in merged [#367](https://github.com/gamesbyian/wallgen/pull/367). The 320–411px horizontally swipeable variant is proposed in [#370](https://github.com/gamesbyian/wallgen/pull/370), with a genuine touchscreen swipe gate, not merely programmatic scroll.
- [x] Five-destination mobile dock 42px → 44px via merged [#366](https://github.com/gamesbyian/wallgen/pull/366), actual click/3×3/visual tests green. Remaining physical safe-area and native Android acceptance still open.
- [ ] Preview shortcut actions: source Favourite/PNG 43×38 → 44×44 proposed in [#371](https://github.com/gamesbyian/wallgen/pull/371), and Random/Primes 44px proposed in [#372](https://github.com/gamesbyian/wallgen/pull/372). Do not mark completed until exact-head CI/merge. Other preview controls still need audit.
- [ ] Material 1/2/3 rotation and the special four-column rail: test all six controls, clipping/spacing, locks and active/dormant states; never generalize generic setting-row columns.
- [ ] Add **target-specific browser regression** including no accidental sibling activation, scroll still available, right/error states, before/after recipe deltas and width/theme screenshots.
- **Gate:** PR-specific source evidence, no regression in canonical plates/camera/export, all required workflows green.

## Stage C: reusable compact design language (P1/P2)

- [ ] Introduce component tokens for touch-cell, visible tile, icon art, gutter, focus ring, inactive opacity/legibility and labels, without overriding all existing CSS with a global `min-height`.
- [ ] Convert selected typed rows/categories rather than mass-rewriting: ordinary range, selection, lockable, scoped-die, dynamic Interior, and special Material rotation remain distinct.
- [ ] Evaluate category-chip horizontal scroll cue versus responsive wrap; preserve all seven named categories and keyboard source navigation. Compare saved full inspector and opt-in Focus side by side.
- [ ] Verify 200% text/zoom and reasonably enlarged Android font settings in emulation; note actual Android as pending.
- **Gate:** real-source multiwidth cream/dark captures, no extra blocked taps, no undue loss of preview, no behavioural/recipe diffs.

## Stage D: precision drawing and consequential actions (P2)

- [ ] Inspect anchor/Bezier handle targeting, Draw/Edit/Apply/Cancel, point insertion/deletion, re-smoothing and Undo at 320/412px. Quantify false selections and nearby target overlaps.
- [ ] Prototype optional magnifier/tolerance/stepped nudge only if reproducible precision or accessibility issue exists. Preserve source geometry, off-frame extension, intersections/weave and output exactly.
- [ ] Use confirmation only when needed; preserve efficient Undo for reversible actions. Avoid adding friction to ordinary parameter tuning.
- **Gate:** genuine pointer/keyboard end-to-end tests, source geometry parity and no camera/recipe contamination.

## Stage E: independent acceptance and future design choices (P2, human/device gate only)

- [ ] Run A/B (A unchanged, B visually identical enlarged hit areas, C adjusted grouped/reflow rows) on tasks: choose colour, single-setting randomize while locked neighbour stays unchanged, Material rotate, point edit+undo, favourite/restore, export.
- [ ] Capture wrong-target tap rate, first-success, task time, Undo/recovery counts, thumb reach, motor accessibility, subjective effort and artwork visibility; include actual Android Chrome, TalkBack spoken names/focus and font settings.
- [ ] Preserve unscripted user aesthetic approval as *not verified* until genuinely performed.
- **Gate:** independently observed human/device evidence. No scheduled agent may self-approve.

## First integration slice status

- Baseline source/cascade reviewed and external primary standards checked. On start only unrelated [PR #53](https://github.com/gamesbyian/wallgen/pull/53) was open; still refresh before merge.
- This initial branch commits the R&D report and plan before implementation to preserve the reasoning.
- Stage A pure geometry classifier, unit tests, atlas spacing candidates and bounded 3x3 button pointer ownership diagnostics implemented in [PR #364](https://github.com/gamesbyian/wallgen/pull/364); exact tested source head and UI atlas above are green. This is observation, not altered CSS or physical hit-target validation. The next independent real-tap matrix remains pending.
- The initial stage should remain diagnostic-only; do not change production CSS before recording a trustworthy baseline.

## Future evidence record template

For each implementation PR record: base SHA, tool/category/screen, selector, theme/viewport, effective pointer bounds and nearest active neighbour, screenshot/artifact URL, exact touch witness, before/after normalized recipe, pass/failed CI run, code/visual change, exceptions and *unverified* hardware/human items. Distinguish (a) under24 size, (b) WCAG spacing candidate, (c) under44 ergonomic target and (d) verified collision, and never report these different populations as interchangeable counts.
