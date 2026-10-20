# Independent review of the eight remaining ROYGBIV icon candidates

**Status:** 2026-10-19, independently inspected, **not yet user-approved and not wired**. Exact source-rendered matrix checked at 20/24/28 CSS pixels in cream/dark themes and normal/selected/disabled/focus states. This report is a bounded visual review, not an assertion of keyboard, screen-reader or physical Pixel device usability.

## Evidence and decision boundary

- [Source-exact 68-icon state matrix](../../assets/icons/roygbiv/state-matrix.html) and [icon manifest](../../assets/icons/roygbiv/manifest.json) are the source of candidate glyph geometry and status.
- [Independent real-browser screenshot artifact](https://github.com/gamesbyian/wallgen/actions/runs/39353643417) includes `icons/{name}-states.png` for all eight reviewed candidates. This is the **pre-metadata-contrast correction** baseline. Inspect #258's regenerated source matrix after it merges, not the old screenshot, for the corrected metadata page.
- This review looked at distinctiveness, legibility and state persistence. It does **not** replace the user's approval, a final in-app control assignment or a physical device comparison. Leave all eight unwired until approved and source-mapped.

| Candidate | Visual review of 20/24/28px cream/dark states | Disposition |
| --- | --- | --- |
| `pan` | Four-direction arrows and centre dot remain distinct at all three sizes, including selected/focus. The matrix's text search also matches original `chevron-down` title "Expand"; choose the actual Pan row when reviewing. | **Candidate retained**, requires named View Pan control mapping and approval; avoid confusing it with composition nudge. |
| `anchor-points` | Blue curve with multi-point handles remains legible in both themes. At 20px the handle accents are small; source button text should carry the Edit points semantics. | **Candidate retained**, never substitute for the original Draw pencil. |
| `smooth-path` | Distinct dotted/smoothed-line motif after earlier dark-theme legibility refinement (#241); recognizable as a transformation, not a freehand pencil. | **Candidate retained**, clarify Interpret/Resmooth via labelled action. |
| `extend-path` | Frame/dashed boundary and extrapolating line are recognizable at 24/28px, but comparatively dense at 20px. | **Caution: prefer 24px+** where geometry permits, or retain clear adjacent label. Validate on open/closed paths rather than inferring applicability from the icon. |
| `weave` | Crossing red/blue segments are crisp across themes and states. Icon alone does not distinguish over/under choice or renderer semantics. | **Candidate retained with text**, no colour-only indication of selected crossing order. |
| `focus-slider` | Slider motif remains readable in both themes, but could be confused with the wired `edit-controls` glyph. | **Caution: label Focus explicitly**, retain All controls default and visibility of source parameter/locks. |
| `metadata` | **Adversarial finding:** in the baseline matrix, cream-filled page used inherited light strokes, erasing its document rules/edge in dark normal and selected. | **Fix in #258, awaiting current matrix validation**: pin page edge and rule ink to ROYGBIV dark `#18151F` while preserving fill and geometry. Re-review before approval. |
| `restore-variation` | Three-colour overlapping paper/loop motif visible in normal/focus; relatively busy at 20px and perceptually closer to refresh than an explicit history destination. | **Caution: labelled Restore**, 24/28px preferable for important actions. Keep Undo and History semantics separate. |

## Source and accessibility constraints before wiring

1. Map any candidate only to its semantically corresponding existing control and preserve source button IDs, handlers and keyboard focus. `pan` must be viewport-only, not composition nudge.
2. Confirm all state combinations in the current **live app**, not only the offline approval fixture. Re-run the screenshot atlas and mobile keyboard/touch checks after any substitution.
3. Make disabled/selected/focus/locked states discernible without interpreting small coloured pixels; retain accessible names and help text.
4. User approval is still outstanding for the candidates. Do not claim that an independently inspected row constitutes approval of its eventual placement, size or meaning.

**Follow-up required:** re-run and inspect corrected `metadata` 20/24/28px matrix after #258 succeeds; record explicit user decisions for all eight before changing their candidate status.
