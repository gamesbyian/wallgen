# Agent 1: candidate SVG optical and semantic review (2026-10-19)

**Source:** the 68-symbol `assets/icons/roygbiv/state-matrix.html`, 55 original glyphs, the original app icon and 12 extension glyphs. Eight extensions below remain **unwired candidates**, not independently approved. Canonical approved family: 32×32 viewBox, 2.4 rounded `currentColor` strokes, flat original rainbow accents, no gradients. The app's brand SVG is unchanged.

| Candidate | Concept at 20/24/28 CSS px | Theme and state review question | Disposition |
| --- | --- | --- | --- |
| `pan` | Four directional arrows surrounding a green pivot | At 20px, are four arrowheads separable from viewport nudge? Is the centre legible in selected/disabled? | Retain candidate, no binding |
| `anchor-points` | Blue curve with red/yellow nodes and dotted Bézier handles | The original dark fixed `#18151F` handle lines nearly merged into the dark sample tile. Inherit foreground for dark/cream while preserving coloured handles. Check at 20px for visual noise. | Two-glyph **presentation fix** here, candidate still unwired |
| `smooth-path` | Purple smoother line over neutral dashed angular path | Neutral dashed ghost could lack contrast on cream at 20px; consider a stronger neutral only after paired screenshot review. | Retain and inspect |
| `extend-path` | Red line crossing a dashed frame with blue exit arrow | Fixed dark frame boundary disappeared into dark tile, hiding the core frame-extrapolation meaning. Inherit foreground in both themes. Small-size dashes still need visual review. | Two-glyph **presentation fix** here, candidate still unwired |
| `weave` | Two flat, differently coloured diagonals with local overpass | At 20px, crossing order may merge into one patch. Compare existing weave/crossing visual semantics before wiring. | Retain and inspect |
| `focus-slider` | Two adjustment rails with unequal knob emphasis | Needs clear distinction from integrated `edit-controls`; may suggest general inspector instead of focused single slider at 20px. | Retain and inspect |
| `metadata` | Cream document with pink identity dot | Test paper boundary against cream and selected warm tile; distinguish from Save/Export. | Retain and inspect |
| `restore-variation` | Green thumbnail in a blue curved return arrow | Distinguish from historical `history` and `reset` at 20px and in disabled state. | Retain and inspect |

## Scope and evidence discipline

The two repaired strokes express the **essential shape** (Bézier handle and canvas edge), not merely decoration. The original stroke colour `#18151F` was effectively black against the preview's dark `#242331` background; `currentColor` yields the existing cream/dark icon foreground from the same state matrix without introducing new palette colours. The canonical SVGs, actual inline glyphs in `src/ui-icon-drawings-e.js`, and exact 68-symbol matrix inventory are kept synchronized; `tests/icon-state-matrix.test.js` already guards exact equality.

`tests/visual-svg-theme-detail.test.js` checks source consistency and theme inheritance; the dedicated Agent 1 comparison workflow (PR #157) captures the candidate matrix at 20/24/28px in cream/dark and normal, selected, disabled and focused treatments. **Static tests are not optical validation.** Do not mark these eight approved, wire them to controls or claim real Android verification. Separate user/independent visual approval remains open.

This review is source-backed and gives testable optical hypotheses; it is not a line-by-line visual approval of all 68 icons.
