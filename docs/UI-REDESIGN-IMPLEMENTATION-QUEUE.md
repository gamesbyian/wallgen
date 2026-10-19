# Implementation-safe ROYGBIV redesign queue

**Status: planning/reference only.** Do not treat checked items as shipped UI, and never implement a generated vision screenshot literally. [Canonical contract](ui-reference/canonical-screen-contract.json) · [Source traceability](ui-reference/component-traceability.json) · [Screen references](ui-reference/README.md) · [Icon manifest](../assets/icons/roygbiv/manifest.json). The approved logo remains `assets/roygbiv-logo.svg`.

## Phase A — approval and reference integrity

- [x] Establish independent snapshot of 113 static IDs, 87 configuration attributes and 40 source-defined tools, with a versioned verification matrix.
- [x] Correct prior Pan/Zoom/Nudge semantics against actual renderer and UI code.
- [ ] Qualify **all** static/conditional controls against runtime interaction coverage; source inventories do not establish reachability.

- [x] Inventory existing 55 glyphs + existing brand icon.
- [x] Enumerate all 7 editor categories and 40 tools from the code.
- [x] Stage 12 SVG candidates without rewiring live controls.
- [x] Publish 12 source-driven wireframe plates with required/conditional/forbidden inventories.
- [x] Record current six dock actions versus proposed five navigation destinations and action relocations.
- [x] Add automated SVG/spec/asset tests and saved approved reference source hashes.
- [ ] Review staged glyphs at 20/24/28px on both cream and dark, selected/disabled; approve/edit candidates before UI wiring.
- [ ] Compare every canonical screen plate to exact feature inventory, including uncommon conditional states; annotate any implementation exception.

## Phase B — canvas-first shell

- [ ] Keep exact approved app icon beside R.O.Y.G.B.I.V. in all modes.
- [ ] Remove canvas heading and top Fit/100% row; move Pan, Zoom+/−, Fit to canvas side, nudge/recenter logically adjacent.
- [ ] Preserve zoom increments, full fit, camera-only state, drawn-path extension and exported wallpaper dimensions.
- [ ] Migrate six dock actions (Edit/Explore/Randomize/Favourite/Download/More) to five destinations (Studio/Edit/Explore/Saved/More) **without losing Randomize, Favourite or direct Download**.
- [ ] Verify 412×892 phone, 499/500/790/791 boundaries, constrained landscape; no artwork/tray overlap.

## Phase C — component system and named editor controls

- [ ] Implement typed setting rows and lock/die/stepper slots without changing recipe or event semantics.
- [ ] Keep all seven categories and 40 named tools; verify full source keys and applicability rules.
- [ ] Keep blue and random stable unique ROYGBIV slider accents inside each panel.
- [ ] Preserve search match-to-tool and manual horizontal chip scroll state.
- [ ] Reduce excess short-panel height only on navigation, with atomic preview/tray resize.
- [ ] Ensure all inactive values/locks remain comprehensible and true to generation logic.

## Phase D — complex tool journeys

- [ ] Keep Draw → Interpret → Edit anchors → Apply/Cancel, including resmoothing, corners, points and 10× interpretive smoothing.
- [ ] Keep path extrapolation beyond boundaries and intersections/weave/over/under.
- [ ] Preserve all three material layers, coverage, strength/scale/rotation shortcuts (−90,−1,value,+1,+90).
- [ ] Preserve dynamic interior element stack, ink selection, colours, placement, locking, reordering.
- [ ] Prototype optional shared Focus slider, A/B against full multi-row inspector; NEVER force removal of all-controls mode.

## Phase E — gallery, history, output and quality

- [ ] Keep image-first Explore, independent Saved, history restore, user favourites and gallery loading semantics.
- [ ] Preserve global status announcements and grouped More with seed, import, output, metadata, batch, share.
- [ ] Test all existing PNG/JSON recipe round-trips and exact preview/export geometry.
- [ ] Test touch targets, keyboard/focus, colour contrast, screen reader names and reduced motion.
- [ ] Update screen plates and companion deck with real implementation screenshots only after fidelity review.

## Acceptance gates for every implementation PR

1. Source/current UI feature inventory, canonical screen required states and icon mapping checked against actual application DOM.
2. No dropped controls, ghost actions, inaccessible alternative states or hidden randomize/download affordances.
3. Source geometry, camera-vs-recipe zoom, anchor extrapolation and exported recipes preserved.
4. `npm run check`, Chromium mobile acceptance, PNG/headless smoke and UI state atlas targeted journeys pass.
5. Exact change of user-visible semantics declared, not inferred from a glamorous illustration.
