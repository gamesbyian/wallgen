# Agent 3 independent redesign acceptance ledger (2026-10-19)

**Baseline:** `main` at `c16b7220ea83ee653c5bf312d5a3d4875344961a`. **Owner:** acceptance, shared orchestration, master queue. No Agent 1 stylesheet/SVG or Agent 2 Draw/Material/Interior production file was modified.

Evidence status terms are **source-confirmed**, **browser-observed**, **behavior-verified**, **visual-reviewed**, **human-approval-pending**, and **not verified**. A screenshot file or passing gallery enumeration is not evidence of actual source-visible interaction or image fidelity.

| Assertion | Classification as of this commit | Evidence, qualification, gap |
| --- | --- | --- |
| 116 tracked static IDs / 87 setting names / 40 source tools / seven categories | **source-confirmed** | `docs/ui-reference/source-control-inventory.json`, `src/editor-schema.js`; former 115-ID claim in queue corrected. Conditional reachability is **not verified** globally. |
| Default five navigation destinations and source quick action relocation | **source-confirmed** | `src/mobile-five-nav.js`, `src/mobile-studio.js`, original `index.html` controls; existing mobile browser-smoke reports **browser-observed** semantics. |
| One Explore sheet of twelve distinct recipe identities persists across Saved visits | **source-confirmed**, independent **behavior-verified** at merged #159 | Request-ID invalidation and `explorationRecipes` in `src/app.js`; source/gallery-view tests do not simulate real rapid navigations. Real Chromium passed in [GHA 39323816367](https://github.com/gamesbyian/wallgen/actions/runs/39323816367), with exact seed order and repeated live navigation. |
| Explore → Favourite → Saved → Restore → Edit → Undo | **behavior-verified** in merged #159 | Actual 412×892 Chromium navigation and complete normalized recipe restoration/Undo assertions passed; evidence and screenshots uploaded separately in GHA 39323816367. No approval of native Android/visual fidelity. |
| More output/seed/metadata/copy/JSON/export/source actions remain directly reachable | **browser-observed** for eight hit-tested controls; **behavior-verified** for covered actions | Real click, metadata memory and clearing, typed seed/reroll, clipboard, downloaded JSON, share link passed in GHA 39323816367. Remaining controls and status paths are **not verified**. |
| Complex PNG recipe restore via actual file-input handler | **behavior-verified** for tested file-import fixture | Existing Node codecs and a new real Playwright file-input restore passed in GHA 39323816367 for radial, independent material layers, interior IDs and camera; actual native-resolution export remains a separate, incomplete matrix. |
| Draw panned handles before Apply | **not verified** until PR #154 merges and visual evidence is reviewed | PR #154 is open, changes `tests/browser-smoke.mjs` and is owned by another lane. This branch does not touch it. Passing source checks alone would not grant visual approval. |
| Exact icon family match, reference fidelity, 499/500/790/791 and landscape, native-device contrast/focus | **human-approval-pending** or **not verified** | Existing atlas is valuable **browser-observed** evidence but its fixed/masked art does not establish fidelity to twelve canonical plates or native Android Chrome behaviour. |
| Native export world-coordinate parity across all unusual geometry, zoom/pan/material combinations | **not verified** as a release-wide matrix | `tests/verify-export-geometry.mjs` and targeted camera tests are narrower and foreground-qualified. |

## CI evidence policy

`ui-screenshot-atlas.yml` now runs independent gallery/More/PNG input acceptance **before** capture, writes `artifacts/agent3-acceptance/evidence.json` upon success and `failure.json` plus a screenshot on failure. Independent acceptance and atlas **both passed** on #159 head `4dd6b68a3a715d39faa5ff6c9de41d02665044d3` in [Actions run 39323816367](https://github.com/gamesbyian/wallgen/actions/runs/39323816367), with separately uploaded `roygbiv-agent3-acceptance` and `roygbiv-ui-atlas` artifacts. This qualifies the specific tested journeys, **not** visual signoff or a native device.

## Unresolved release gates

- A true runtime crawl of the 116 source IDs and conditional controls under every applicable screen state, including negative hidden/inert hit-tests.
- Complete qualified output pixel comparisons at native and preview resolutions, for Drawn, radial and regions with layered materials and interiors, not merely background agreement.
- Accessibility sweep including touch target spacing/size, focus sequence, contrast, reduced motion, announcements, text alternatives and device/viewport limits.
- Visual comparison of real implementation screenshots against canonical plates, including source SVG size/contrast at 20/24/28 pixels and explicit human sign-off.
- Cross-agent integration after Agent 1 visuals and Agent 2 complex editor changes merge. Independent test results against an earlier main SHA cannot qualify later UI behaviour.

No release completion claim is made by this ledger. The 61/80 source queue checkmarks recorded before these additions are useful task accounting, not a weighted or independently verified readiness score.

## After first acceptance merge

- PR [#159](https://github.com/gamesbyian/wallgen/pull/159) merged as `86be3ec8e993e040a77312cf5de32cb78e484213` after general [validation 39323816419](https://github.com/gamesbyian/wallgen/actions/runs/39323816419) and [independent browser + atlas 39323816367](https://github.com/gamesbyian/wallgen/actions/runs/39323816367) passed.
- PR [#163](https://github.com/gamesbyian/wallgen/pull/163) proposes an isolated focus-return fix after selecting an Explore/Saved thumbnail. Source review finds the clicked element becomes hidden by `display:none` upon gallery dismissal; browser regression qualification is pending. Do not promote as fixed before a green run and merge.
