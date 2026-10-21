# Implementation-safe ROYGBIV phone references

**Permanent, independently inspected app screenshots:** [24 actual 412×892 cream/dark implementation plates and eight unchanged icon candidate matrices](ACTUAL-IMPLEMENTATION-COMPANION.md), with exact source/hash proof in [review-provenance.json](actual-implementation/review-provenance.json). The schematic SVG contracts remain intact. The [full conditional Chromium artifact comparison](LIVE-IMPLEMENTATION-PLATES.md) continues to cover additional viewports and unresolved optical/physical judgments. These screenshot-only artifacts are staged after a completely green browser geometry audit; they do not replace the canonical SVG feature contracts or imply human aesthetic sign-off.

Twelve deterministic SVGs render **real ROYGBIV SVG paths**, with an explicit side inventory of required, conditional and forbidden elements. The phone is an explanatory schematic, not a generated app screenshot or fixed-pixel implementation layout. **The inventory and [canonical-screen-contract.json](canonical-screen-contract.json) take priority over artwork.**

- [Studio / canvas](./studio.svg)
- [Edit / Path geometry](./geometry.svg)
- [Draw / interpret / anchors](./draw.svg)
- [Explore gallery](./explore.svg)
- [More / outputs](./more.svg)
- [Material / three layers](./material.svg)
- [Colour / palette](./colour.svg)
- [Layout / diagonal direction](./diagonal.svg)
- [Edit / sparse tool](./compact.svg)
- [Optional Focus slider](./focus.svg)
- [Recent variations](./history.svg)
- [Find setting / tool](./search.svg)

All seven categories and forty named tools are enumerated in the JSON, with exact source setting keys. The existing app icon comes from the approved art; twelve additional SVG candidates were staged, a subset were source-verified and wired to their original Fit/Edit/Import/Export actions, and eight remain unwired pending independent visual review. Presence in an SVG atlas does not constitute visual approval. Keep the verified [1,648-image production atlas](https://github.com/gamesbyian/wallgen/actions/runs/39166559800) as baseline for existing features.

**Semantics and live-browser check (2026-10-19):** Zoom +/− updates the serialized `viewZoom`; Fit restores `viewZoom=1` and centered `viewPanX/Y=0`. The original directional nudges update composition `positionX/Y`; the separately implemented **Move view frame** pad (PR #143) changes only `viewPanX/Y` and is reachable under mobile More → Position & design details. PR #146 fixed path-cap dependence on the moving camera and tests four qualifying foreground geometries. PR #147 verifies actual Pan button reachability in phone and short landscape layouts. A short editor tool returns 43.3 CSS px of preview space at 412×892 without touching the recipe (PR #148). These runtime checks override outdated schematic shorthand, but do not replace subjective visual approval.
