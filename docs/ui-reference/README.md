# Implementation-safe ROYGBIV phone references

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

All seven categories and forty named tools are enumerated in the JSON, with exact source setting keys. The existing app icon comes from the approved art; the staged dozen additional icons are design candidates, **not wired into the app**. Keep the verified [1,648-image production atlas](https://github.com/gamesbyian/wallgen/actions/runs/39166559800) as baseline for existing features.

**Semantics check (source, 2026-10-18):** Camera Zoom +/- and Fit use serialized viewZoom, while directional arrows nudge the composition (positionX/positionY). Pan would be a separate future operation and is not implemented. The source inventory and verification matrix override schematic shorthand.
