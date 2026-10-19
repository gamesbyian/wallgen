# Agent 3 independent redesign acceptance ledger (2026-10-19)

**Baseline:** `main` at `c16b7220ea83ee653c5bf312d5a3d4875344961a`. **Owner:** acceptance, shared orchestration, master queue. No Agent 1 stylesheet/SVG or Agent 2 Draw/Material/Interior production file was modified.

Evidence status terms are **source-confirmed**, **browser-observed**, **behavior-verified**, **visual-reviewed**, **human-approval-pending**, and **not verified**. A screenshot file or passing gallery enumeration is not evidence of actual source-visible interaction or image fidelity.

| Assertion | Classification as of this commit | Evidence, qualification, gap |
| --- | --- | --- |
| 116 tracked static IDs / 87 setting names / 40 source tools / seven categories | **source-confirmed** | `docs/ui-reference/source-control-inventory.json`, `src/editor-schema.js`; former 115-ID claim in queue corrected. Conditional reachability is **not verified** globally. |
| Default five navigation destinations and source quick action relocation | **source-confirmed** | `src/mobile-five-nav.js`, `src/mobile-studio.js`, original `index.html` controls; existing mobile browser-smoke reports **browser-observed** semantics. |
| One Explore sheet of twelve distinct recipe identities persists across Saved visits | **source-confirmed**; independent **not verified** | Request-ID invalidation and `explorationRecipes` in `src/app.js`; source/gallery-view tests do not simulate real rapid navigations. New `tests/redesign-navigation-acceptance.mjs` must pass on an actual Chromium page before promotion. |
| Explore → Favourite → Saved → Restore → Edit → Undo | **not verified** in Agent 3 independent lane | New runner traverses five-destination UI and asserts whole normalized recipe equality, not just a seed or thumbnail count. Evidence pending CI screenshot and `evidence.json`. |
| More output/seed/metadata/copy/JSON/export/source actions remain directly reachable | **source-confirmed**, broad reachability **not verified** | `index.html` and mobile More source regrouping. New runner independently scrolls and hit-tests named controls, exercises metadata retention and performs real clipboard and JSON download actions; no approval before green CI. |
| Complex PNG recipe restore via actual file-input handler | **source-confirmed**; independent **not verified** | Existing `tests/recipe-transport-matrix.test.js` proves codecs in Node, not actual More/file event. Agent 3 runner supplies valid metadata PNG and checks radials, independent material layers, interior IDs and camera state. Actual native-resolution export remains a separate, incomplete matrix. |
| Draw panned handles before Apply | **not verified** until PR #154 merges and visual evidence is reviewed | PR #154 is open, changes `tests/browser-smoke.mjs` and is owned by another lane. This branch does not touch it. Passing source checks alone would not grant visual approval. |
| Exact icon family match, reference fidelity, 499/500/790/791 and landscape, native-device contrast/focus | **human-approval-pending** or **not verified** | Existing atlas is valuable **browser-observed** evidence but its fixed/masked art does not establish fidelity to twelve canonical plates or native Android Chrome behaviour. |
| Native export world-coordinate parity across all unusual geometry, zoom/pan/material combinations | **not verified** as a release-wide matrix | `tests/verify-export-geometry.mjs` and targeted camera tests are narrower and foreground-qualified. |

## CI evidence policy

`ui-screenshot-atlas.yml` now runs independent gallery/More/PNG input acceptance **before** capture, writes `artifacts/agent3-acceptance/evidence.json` upon success and `failure.json` plus a screenshot on failure. It uploads its own evidence separately from the masked atlas. Do not classify the new journeys as **behavior-verified** until the job passes against the relevant head SHA and the evidence is reviewed.

## Unresolved release gates

- A true runtime crawl of the 116 source IDs and conditional controls under every applicable screen state, including negative hidden/inert hit-tests.
- Complete qualified output pixel comparisons at native and preview resolutions, for Drawn, radial and regions with layered materials and interiors, not merely background agreement.
- Accessibility sweep including touch target spacing/size, focus sequence, contrast, reduced motion, announcements, text alternatives and device/viewport limits.
- Visual comparison of real implementation screenshots against canonical plates, including source SVG size/contrast at 20/24/28 pixels and explicit human sign-off.
- Cross-agent integration after Agent 1 visuals and Agent 2 complex editor changes merge. Independent test results against an earlier main SHA cannot qualify later UI behaviour.

No release completion claim is made by this ledger. The 61/80 source queue checkmarks recorded before these additions are useful task accounting, not a weighted or independently verified readiness score.
