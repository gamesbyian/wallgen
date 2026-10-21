# Canonical twelve-plate comparison and exception register

Date: 20 October 2026. Scope: **completed exhaustive source-to-contract comparison and explicit exceptions**, not human approval of all twelve screen pictures.

## Comparison census

The canonical screen contract is `docs/ui-reference/canonical-screen-contract.json`. Every original statement, its plate identity, original source selector (or lack of selector for forbidden mockup claims), and bounded evidence paths are paired one-to-one in `docs/ui-reference/agent2-runtime-plate-traceability.json`. The new [exception register](ui-reference/canonical-plate-exception-register-2026-10-20.json) reconciles all entries without changing their original text.

| Plate | Required | Conditional | Forbidden |
| --- | ---: | ---: | ---: |
| Studio | 13 | 3 | 3 |
| Geometry | 13 | 3 | 2 |
| Draw | 12 | 2 | 2 |
| Explore | 9 | 2 | 2 |
| More | 14 | 2 | 2 |
| Material | 11 | 3 | 2 |
| Colour | 9 | 2 | 2 |
| Diagonal | 8 | 2 | 2 |
| Compact | 8 | 2 | 2 |
| Focus | 9 | 4 | 4 |
| History | 7 | 2 | 2 |
| Search | 8 | 2 | 2 |
| **Total** | **121** | **29** | **27** |

Every one of **177 claims** has an unchanged canonical phrase, recorded source candidate or deliberate absence, supporting source-bound browser test path and explicit comparison disposition. `tests/canonical-plate-exception-register.test.js` fails if any claim is missing, reordered, rewritten or changes class. It also requires each conditional/forbidden claim to carry a scoped exception note.

## Browser evidence and differences found

- [Merged #285](https://github.com/gamesbyian/wallgen/pull/285), [source Chromium 39398306129](https://github.com/gamesbyian/wallgen/actions/runs/39398306129) verified all **12 navigated plates**, **121/121** required source candidates and **88/121** applicable source elements with physically centre-hit witnesses in the representative plate. A previous false `.rainbow-slider` source selector was corrected to the actual original coloured range, without inventing new fields.
- [Merged #287](https://github.com/gamesbyian/wallgen/pull/287) added six concrete negative canaries (including wrong top Fit placement, duplicate Geometry heading, invented saturation, invented Glow properties, detached mirror labels and uncloseable search). These are *testable counterexamples*, not automatic clearance of all forbidden artistic requirements.
- [Merged #299](https://github.com/gamesbyian/wallgen/pull/299), [#352](https://github.com/gamesbyian/wallgen/pull/352), [#342](https://github.com/gamesbyian/wallgen/pull/342), [#339](https://github.com/gamesbyian/wallgen/pull/339) and [#345](https://github.com/gamesbyian/wallgen/pull/345) supply conditional source-driver / Material/lock/rotation/search state proof. The register still marks all **29 conditional** claims *bounded*, because these actions cannot exhaust their Cartesian combinations.
- Of the **27 forbidden** reference assumptions, **20** have a source-testable or model-evidenced negative class with individually named evidence; **7** have an explicitly subjective or effectively unbounded interpretation exception. For the 20 objective cases, the register distinguishes bounded source/model witness from a universal proof that a visual counterexample can never occur.

## Adjudication: what is actually closed

The task was to **compare all twelve canonical plate contracts to exact source inventory and annotate exceptions**, including uncommon conditional modes. This comparison is complete: no missing or silently discarded required claim, no conditional silently granted verified status, and no forbidden aesthetic claim silently treated as absence. New test continually guards exact 177-claim reconciliation.

What is **not** accepted: full human screen-plate optical equivalence, each untested dynamic recipe permutation, aesthetics or recognizability of eight unwired icons, companion deck approval, any native Android/TalkBack or subjective review of the seven qualitative forbidden cases. Those remain in other unchecked visual, icon and device release gates. The original twelve SVG wireframes continue to be schematic contracts, never misrepresented as browser PNGs.

No renderer/UI defaults are changed, nor are incomplete claims fabricated as passed. This is an acceptance of an exhaustive **audit/comparison artifact**, not a universal statement of implementation correctness.
