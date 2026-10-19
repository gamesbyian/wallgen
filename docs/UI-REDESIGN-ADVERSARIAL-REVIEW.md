# UI redesign adversarial verification protocol

Claims are qualified as source-confirmed, browser-observed, visual-approved, behavior-verified, or NOT VERIFIED. Do not promote a source code list or an attractive diagram into runtime proof.

## Independent reviewer lanes

**Capability lane:** Compare all 115 current static IDs, 87 data-setting fields, 40 named tools, 3 material layers, 7 colour targets, dynamic interiors, drawing/anchor actions, import/export/metadata, saved/history, all six current dock actions. Prove alternate scene applicability via actual UI interactions. Seek missing controls and record CSS selectors and reproduction.

**Behavior lane:** Seek counterexamples to each requirement in the verification matrix. Verify zoom changes serialized viewZoom only; nudge changes positionX and positionY while frame Pan changes only viewPanX/viewPanY; Fit resets both framing axes and zoom without altering composition; point edits alter geometry, while framing guides do not. Compare full before/after recipes, screenshots and PNG output.

**Visual/accessibility lane:** Render actual existing and candidate SVGs at 20, 24 and 28 pixels under cream/dark, active/disabled/focus states. Find lost labels, clashing hitboxes, clipped/hidden controls, short-height landscape failures and theme discrepancies. User approval of new glyphs remains separate from their presence in the repository.

## Counterexample journeys

| Journey | Failure being sought | Evidence |
|---|---|---|
| Studio zoom out → Fit → Export | Any change besides viewZoom, hidden Fit, wrong export | Serialized before/after recipe, PNG parity, rail screenshot |
| Pan view right → left → Fit → Export | Artwork nudge contaminated, panned canvas cropped or hidden More controls | Distinct viewPanX/Y vs positionX/Y diff, off-frame ink and native pixel parity, named controls visible at 412×892 |
| Composition right → left | Other setting changed, position lock bypassed | Delta and roundtrip recipe |
| Edit category → search tool | Hit chip hidden or scroll snaps | Bounding geometry and navigation path |
| Details → Interior → colours | Missing seven chips, incorrect enable state | DOM and normalized recipe |
| Material layers 1–3 | Inaccessible layers, rotation shortcut cropped | Layer state and exact element rectangles |
| Draw → smooth → edit anchor → extend → apply | Corrupt corner, off-frame path removed | Path/anchors and rendered export |
| Explore → favourite → Saved → restore | Lost favourite, history side effect | Selected recipe and gallery screenshot |
| More → metadata → PNG | Field hidden, feedback invisible, data not embedded | Input and decoded PNG metadata |
| Narrow/short viewport, dark & cream | Unreachable actions or overlapping panels | Focus/tab trace and screenshots |

## Sign-off rule

Every design implementation PR identifies source commit, requirement IDs, changed behaviors, reviewer lane and results, CI test URLs, relevant screenshot locations and remaining NOT VERIFIED cases. Independent reviewers actively attempt to falsify implementation claims. Broad CSS-root screenshot-zoom coverage is not proof of native Android Chrome behaviour.

Require targeted test+browser checks per component, complete atlas periodically, and no blanket benchmark runs for unrelated documentation changes. No production feature is removed based only on a generated proposal image.
