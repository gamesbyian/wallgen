# Agent 1 visual gate ledger: four assigned redesign entries

**Branch:** `redesign/agent1-visual-four-gates-20261019` · **PR:** [#266](https://github.com/gamesbyian/wallgen/pull/266) · **Source baseline:** [main at 4f900d8](https://github.com/gamesbyian/wallgen/commit/4f900d8f6fe5f4dd5c1ed114d1777d8d3a393659), October 19, 2026 local time. These are reviewer claims with explicit evidence levels, not user aesthetic approval. The master queue is intentionally not modified in parallel with other agents.

## Four-entry acceptance ledger

| Master queue unchecked entry | Bounded evidence and work performed | Still genuinely open | Verdict |
| --- | --- | --- | --- |
| **3. Actual icon matrix; eight unwired candidates** | Full [68-icon production fixture](../assets/icons/roygbiv/state-matrix.html); [per-icon disposition](ui-reference/eight-candidate-visual-review-2026-10-19.md), 20/24/28px in both themes and normal/selected/disabled/focus states. Actual source-corrected Metadata re-review [run 39363366198](https://github.com/gamesbyian/wallgen/actions/runs/39363366198), the older pre-fix negative capture [run 39353643417](https://github.com/gamesbyian/wallgen/actions/runs/39353643417). Fresh #266 repeat fixture images in `icons/*.png` and `icon-review.html`. | Approval/placement by a human aesthetic reviewer, actual mapped usage in app, and native device optical check. The eight candidates remain unwired; retaining them is not equivalent to approving adoption. | **Not checked.** Source + bounded independent Chromium visual inspection established; human and in-app acceptance not established. |
| **6. Phone, 499/500/790/791 and short landscape, all surfaces** | Prior positive production atlas [run 39350542821](https://github.com/gamesbyian/wallgen/actions/runs/39350542821) and later real gallery height-boundary work [#252](https://github.com/gamesbyian/wallgen/pull/252). #266 expands the [real source screenshot harness](../scripts/visual-reference-audit-agent1.mjs) across all canonical case types at 412×892, 499, 500, 790 and 700×412, with focused 791px desktop surface states. Newly includes metadata expanded, two additional Material layer finish surfaces, interiors/outlines, gallery, history, Focus and Find. Each capture stores source geometry, visible dock labels and stage/tray overlap; real screenshot capture does not itself approve its appearance. | The new #266 real-browser run must finish and every failing screenshot require disposition. 791px uses desktop navigation; it cannot be falsely counted as mobile Saved/More. Modal imported-image candidate phase, long/short heights, other state permutations, font scaling and native Android still need independent scrutiny. | **Not checked.** |
| **7. Typed visual setting rows, special four-column rotation** | Original DOM adapter in [editor-control-roles.js](../src/editor-control-roles.js) preserves row setting keys and kind; dedicated [setting-row presentation](../editor-setting-rows.css) colours seven categories, preserves the original control inputs and the separately owned Material rotation column grammar. #266 collects actual visible row kind, keys, CSS grid columns, card/row horizontal geometry and 5-button+1-number composite identity in the real browser. Prior 320px sixth-button cropping was corrected by [#222](https://github.com/gamesbyian/wallgen/pull/222). | Seven categories × 40 tools × conditional source fields are not exhaustively represented by these cases; some runtime-disabled/locked states and aesthetic density assessments remain unapproved, including independently judged legibility of inactive labels, not just measured rectangles. | **Not checked.** |
| **16. Canonical plates + companion live references** | The 12 existing [canonical screen plates](ui-reference/README.md) remain inventory-first schematics. #266 pairs each with a real browser screenshot; if and only if **zero capture/geometry errors** result, the artifact stages **24 actual 412×892 PNG plates** in `implemented-plates/` (12 modes × two themes) with source provenance and an HTML browser index. No image-generation, mocked wallpapers or moving a reference to conceal a defect. | These runtime implementation plates are provisional until the real-browser checks are green **and** a human accepts visual fidelity. A static deck derived from illustrated proposals should not be silently relabelled as production. Check before promoting or replacing a canonical schematic. | **Not checked.** |

## How to inspect the new actual screenshots

Run `npm install --no-save playwright@1.56.1 serve@14.2.5`, `npx playwright install chromium`, launch `npx serve . -l 4173`, then `node scripts/visual-reference-audit-agent1.mjs --out=artifacts/visual-agent1`. The identical GitHub workflow is [`visual-agent1.yml`](../.github/workflows/visual-agent1.yml) and uploads the real PNG/geometry evidence regardless of a passing or failing run.

Inspect `review.html` for each source SVG-versus-live-browser pair, `manifest.json` for actual rectangles/errors, and `icon-review.html` for all eight staged candidates. Only a zero-error execution produces `implemented-plates/index.html`. Browser screenshot data and programmatic hitbox readings remain **technical evidence**, not a surrogate human reviewer.

## Individual candidate decisions

- `pan`: retain as a labelled **viewport-only** candidate, never co-opt composition nudge.
- `anchor-points`: retain labelled Draw Edit points semantics, small handles at 20px.
- `smooth-path`: retain labelled Interpret/Resmooth, theme-aware neutral guide now readable.
- `extend-path`: caution at 20px; prefer 24px+ or adjacent descriptive text.
- `weave`: retain labelled crossing meaning; colour alone cannot signal over/under.
- `focus-slider`: label Focus and preserve original full inspector default.
- `metadata`: corrected document ink passed actual Chromium source review after #258.
- `restore-variation`: caution at 20px; prefer clear Restore text, keep Undo/History distinct.

**All eight remain unwired and unapproved for adoption.** These are independent bounded technical dispositions and questions for aesthetic review, not manufactured user decisions.

## Independence and scope

This lane owns visual evidence, screenshot-generation code and reference documentation only. No editor event handlers, wallpaper renderer, recipe state or source button tree were modified. Scenario setup sometimes invokes original handlers programmatically and is explicitly labelled as such; it must never be sold as physical tap testing. The human review decision and approval of final plate fidelity cannot be claimed by this agent.
