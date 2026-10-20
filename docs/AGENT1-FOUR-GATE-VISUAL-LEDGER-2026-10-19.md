# Agent 1 visual gate ledger: four assigned redesign entries

**Branch:** `redesign/agent1-visual-four-gates-20261019` · **PR:** [#266](https://github.com/gamesbyian/wallgen/pull/266) · **Source baseline:** [main at 4f900d8](https://github.com/gamesbyian/wallgen/commit/4f900d8f6fe5f4dd5c1ed114d1777d8d3a393659), October 19, 2026 local time. These are reviewer claims with explicit evidence levels, not user aesthetic approval. The master queue is intentionally not modified in parallel with other agents.

## Four-entry acceptance ledger, latest actual browser result

**[Chromium run 39379099941](https://github.com/gamesbyian/wallgen/actions/runs/39379099941) passed.** It produced **416 real screenshots, zero screenshot/geometry errors, 24 source-exact cream/dark implementation plates, eight source-identity-isolated icon candidate plates**, and an independent browser row census of **39/39 currently applicable editor tools** across **380 tool-state inspections** in two themes and the 412×892/791×892 breakpoints. The [actual artifact](https://github.com/gamesbyian/wallgen/actions/runs/39379099941/artifacts/12245555452) contains `review.html`, `implemented-plates/index.html`, `icon-review.html`, `manifest.json` and `row-census.json`. The latter records 736 source-row observations, including 724 visible rows and 48 Material rotation rows, with zero row-identity, card-overflow or rotation-composite failures. `tone` is a declared legacy tool but **not applicable in a live selectable state**: its tonal construction option is deliberately hidden and disabled. This must not be misreported as an ordinary reachable control.

| Master queue entry | What the real source now proves | Remaining actual condition | Verdict |
| --- | --- | --- | --- |
| **3. All 68 icon symbols, eight unwired candidates** | The original [68-glyph fixture](../assets/icons/roygbiv/state-matrix.html) plus eight real Chromium exact-ID candidate snapshots: 20/24/28px, cream/dark, normal/selected/disabled/focus. Source-exact `=pan` now excludes the unrelated *Expand* title that previously appeared in a substring search. Existing app-chrome corrections, including Metadata, were optically inspected. | Human review of candidate use, 20px legibility, placement and actual adoption. **No candidate was wired or aesthetically approved.** | **Open. Technical fixture complete.** |
| **6. 412, 499/500, 790/791, constrained landscape, navigation, editor and galleries** | 416 actual responsive/conditional screenshots at specified breakpoints and additional 320/360px/height edges; five mobile dock captions, source preview/sheet overlap, gallery thumbs, More metadata, imports, multi-layer Material, Focus mobile-only / 791 desktop All, and row clipping checks all passed. I separately inspected downloaded 320/412, 499/500, 790/791 and 700×412 cream/dark samples. | Native Android, font scaling, and independent product-level optical judgement. At 320px the seven-label category row is dense; landscape 700×412 intentionally has a very small preview when a full panel is open. These are observations, **not acceptance**. | **Open. Chromium checks green.** |
| **7. Source-owned seven-category parameter grammar, four-column Material rotation** | Real browser `row-census.json` covers 7 categories × relevant Paths/Radial/Regions modes × 2 themes × 412/791 widths. It visited all **39 applicable** tools and recorded 380 selected-card state inspections, 736 typed source-row observations, including 48 six-control rotation rows. Each source named field remains in its tool card; actual visible rows remain within their card. | Legacy tonal mode is intentionally gated; conditional inactive/locked semantic explanations and final visual density require independent human judgement. A source inventory of 40 is **not** proof that disabled tonal is reachable. | **Open. Runtime source-row census green.** |
| **16. Canonical companion real implementation plates** | The approved-inventory **12 SVG schematic contracts remain unchanged**. The zero-error run exported **24 actual** 412×892 implementation PNG screenshots with source screenshot paths, exact viewport, Chromium method and review annotations, plus an HTML comparison deck. | Human fidelity approval and decision to permanently promote plate PNGs. CI `GITHUB_SHA` on a pull request may point to the synthetic merge commit; artifact run and PR head identify code lineage. No schematic has been redrawn to conceal divergence. | **Open. Provisional real plates exist.** |

A technical check passing does not authorize checking these human-approval gates in `docs/UI-REDESIGN-IMPLEMENTATION-QUEUE.md`. The source desktop breakpoint is 791px; optional Focus intentionally applies only through 790px. Original source controls, locks, randomization and exports were not altered in this lane.

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
