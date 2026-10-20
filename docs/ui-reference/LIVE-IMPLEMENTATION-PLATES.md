# Live implementation screen plates: real source screenshots

The twelve SVGs in this directory are **canonical inventory-first schematic contracts**, not literal screen goldens. The [Agent 1 live Chromium audit](../../scripts/visual-reference-audit-agent1.mjs) now stages **24 actual 412×892 source UI screenshots** (12 modes × cream/dark) under `implemented-plates/`, but **only if the complete browser census reports zero errors**.

| Screen | Verified source UI scenario | Real file basename |
| --- | --- | --- |
| Studio | Studio canvas, rail and navigation | `studio.png` |
| Geometry | Edit → Path → Geometry | `geometry.png` |
| Draw | Source drawing overlay and real pointer stroke | `draw.png` |
| Explore | Independent Explore destination | `explore.png` |
| More | Grouped original source actions | `more.png` |
| Material | Material → Finish 1 | `material.png` |
| Colour | Colour → Rainbow | `colour.png` |
| Diagonal | Layout → Direction | `diagonal.png` |
| Compact | Single-setting editor card | `compact.png` |
| Focus | Optional Focus slider | `focus.png` |
| History | Editor history state | `history.png` |
| Search | Find setting / shadow | `search.png` |

Each file is prefixed `cream-` or `dark-`. Open `implemented-plates/index.html` from the `agent1-canonical-live-visual-evidence` [workflow artifact](https://github.com/gamesbyian/wallgen/actions/workflows/visual-agent1.yml). Images are captured from **the running app in Chromium**, never created with an image generator or manually redrawn. The companion `review.html` compares the existing canonical SVG contract against the live screenshot. `manifest.json` retains viewport sizes, source UI actions, exact bounding rectangles, source row kinds/keys, Material shortcut inventory and counterexamples. Failed runs publish the counterexample screenshots but **do not stage implementation plates**.

## Additional live conditional states

The same artifact examines the 412, 499, 500, 790 and 791 CSS-pixel breakpoint handoffs, constrained 700×412 landscape, 320/360px narrow phones, actual empty/populated Explore and Saved, expanded metadata, Material layer 2/3, Interior, Outlines, Effects, Focus, History, Find, and a real native-file-input image-path dialog. The 791px desktop state deliberately uses desktop rather than pretending the mobile dock remains.

See the [eight candidate icon dispositions](eight-candidate-visual-review-2026-10-19.md) and [four-entry acceptance ledger](../AGENT1-FOUR-GATE-VISUAL-LEDGER-2026-10-19.md). Technical browser measurements do **not** grant human visual approval. Each plate must still be reviewed for consistency with the [canonical contract](canonical-screen-contract.json), including hidden/conditional feature states, before it can be approved or replace a reference. Do not alter the schematic to make a visual defect appear to pass.

## Reproduction and provenance

Install `playwright@1.56.1` and `serve@14.2.5`, serve the repository at `http://127.0.0.1:4173`, then run `node scripts/visual-reference-audit-agent1.mjs --out=artifacts/visual-agent1`. The GitHub job executes the same script and uploads evidence even on failure. Artifacts expire after 14 days; permanent publication of a visually approved PNG must carry source commit, viewport and browser method.

### Source-bound provenance verification

The real-browser screenshot manifest includes a `sourceProvenance` object with **the exact checked-out/tested GitHub commit** (`GITHUB_SHA`), the PR's separate head and base SHA, and an immutable workflow run URL. GitHub's pull-request build commonly checks out a temporary merge commit, so **branch head is not necessarily the code that produced the PNG pixels**. Each of the 24 staged plates repeats the tested checkout, PR head/base and run URL.

CI runs `scripts/validate-visual-source-provenance-agent1.mjs` immediately after the visual audit. The verifier rejects any missing, duplicate, misattributed or non-PNG canonical plate, wrong 412×892 raster dimensions, and any PNG not **byte-identical** to its associated live `screens/phone-412x892/{theme}/{screen}.png` screenshot. A geometry-failing run cannot stage approved-to-review plates. The extra guard validates traceability and actual browser pixels, **never** subjective fidelity, physical Android rendering or authority to replace the schematic contracts.
