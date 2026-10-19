# Implementation-safe ROYGBIV redesign queue

**Status: living design and implementation queue.** Checked items describe source-qualified work, not blanket visual approval. Never implement a generated vision screenshot literally. [Canonical contract](ui-reference/canonical-screen-contract.json) · [Source traceability](ui-reference/component-traceability.json) · [Screen references](ui-reference/README.md) · [Icon manifest](../assets/icons/roygbiv/manifest.json). The approved logo remains `assets/roygbiv-logo.svg`.

## Phase A — approval and reference integrity

- [x] Version and verify all 115 current static IDs (including native Studio and Saved destinations), 87 configuration attributes and 40 source-defined tools.
- [x] Correct prior Pan/Zoom/Nudge semantics against actual renderer and UI code.
- [ ] Qualify **all** static/conditional controls against runtime interaction coverage; source inventories do not establish reachability.
- [x] Browser-click the enabled named tools across Paths, Radial, Voronoi and Nested Regions, recording actual selected cards and explicitly flagging the preserved but HTML-disabled legacy Tonal mode instead of awarding false reachability (PR #110).
- [ ] Independent negative testing of real screen states using the [adversarial protocol](UI-REDESIGN-ADVERSARIAL-REVIEW.md), including unscripted interactions and candidate SVGs.

- [x] Inventory existing 55 glyphs + existing brand icon.
- [x] Enumerate all 7 editor categories and 40 tools from the code.
- [x] Stage 12 SVG candidates without rewiring live controls.
- [x] Publish 12 source-driven wireframe plates with required/conditional/forbidden inventories.
- [x] Record current six dock actions versus proposed five navigation destinations and action relocations.
- [x] Add automated SVG/spec/asset tests and saved approved reference source hashes.
- [x] Wire source-qualified Fit and Edit adjustment symbols to existing controls; verify actual source markup/handlers.
- [x] Wire Import path and Export PNG icons to their matching pre-existing actions, without altering button identities.
- [x] Publish an offline exact-SVG icon matrix covering 68 symbols at 20/24/28px in cream/dark/selected/disabled/focus states (visual review fixture; no approval implied).
- [ ] Human/independent visual review of actual icon matrix, including source-tested candidate status; approve/refine eight unwired candidates before UI use.
- [ ] Compare every canonical screen plate to exact feature inventory, including uncommon conditional states; annotate any implementation exception.

## Phase B — canvas-first shell

- [ ] Keep exact approved app icon beside R.O.Y.G.B.I.V. in all modes.
- [x] Replace three legacy decorative cream-stage and dock colour gradients with solid surface fills, preserving functional scroll edge masks and artwork colour (PR #120).
- [x] Remove remaining decorative base/dark Studio, lighting and shadow card gradients while retaining generated artwork and functional scroll masks (rebased PR pending).
- [x] Keep (already existing) canvas-side Zoom+/− and add Fit/100% using the actual `viewZoom` source; no dedicated top zoom header on mobile. (PR #79)
- [ ] Implement a **separate viewport Pan** with explicit preview/export persistence, *without* relabelling composition nudge as Pan.
- [x] Consolidate default mobile navigation following source-action preservation and tested screen geometry; all original source action IDs retain live handlers (PR #101 and default-promotion PR).
- [ ] Preserve zoom increments, full fit, camera-only state, drawn-path extension and exported wallpaper dimensions.
- [x] Migrate six source action identities to a five-destination default dock, retaining direct Randomize, Favourite and Download in their source-backed surfaces.
- [x] Qualify five-destination trial through all four CI workflows and promote to static first-paint HTML; no URL feature flag (PR #101 and default-promotion PR).
- [ ] Verify 412×892 phone, 499/500/790/791 boundaries, constrained landscape; no artwork/tray overlap.
- [x] Extend genuine Chromium breakpoint census beyond Studio to *open Edit*, asserting the preview remains above the tray, original actions and selected tool survive, and retaining boundary phone/landscape screenshots (PR pending).

## Phase C — component system and named editor controls

- [x] Add typed, source-preserving setting-row semantics for all ordinary static editor fields; no duplicate inputs or changed handlers (PR #80).
- [ ] Apply the unified visual row layout family-by-family with per-viewport screenshot approval, preserving the special four-column rotation controls.
- [x] Apply a flat ROYGBIV category accent rail to all source-annotated setting rows (7 categories), with cream/dark shape distinctions, inactive cues and no layout/control reparenting (PR #106).
- [x] Real Chromium screenshot review found 3px accent overlapping flush-left setting labels; move rail outside each row with no layout or source-control changes (PR #108).
- [x] Keep seven categories and 40 named tools; inventory source keys and test structure-aware applicability (PRs #94, #96, #97).
- [x] Keep blue and randomly shuffled, session-stable, unique ROYGBIV accents on original range inputs across tool navigation, with explicit seven-hue source contract (PR pending).
- [x] Preserve manually scrolled tool-strip position while source-visible-name searches (including layer rotation accessible names) reveal their destination beside Focus, retaining internal-key aliases (PR pending).
- [x] Make Find setting structure-aware: search applicable tools and explain dormant settings (PR #99).
- [x] Add roving keyboard navigation for applicable tools and Focus parameters, preserving manual chip scroll (PRs #94 and #98).
- [ ] Reduce excess short-panel height only on navigation, with atomic preview/tray resize.
- [ ] Ensure all inactive values/locks remain comprehensible and true to generation logic.
- [x] Prove in actual Chromium that changing Zigzag → Straight displays zero and disables inapplicable Shape frequency/depth while preserving their nonzero recipe values, then restores them on reactivation (PR pending).
- [x] Name per-setting randomize dice using the visible source label or explicitly authored accessible name, not internal recipe keys (PR #109).
- [x] Explain separately why a Focus range is locked, contextually inactive, or otherwise unavailable, without altering its source controls (PR #105).

## Phase D — complex tool journeys

- [ ] Keep Draw → Interpret → Edit anchors → Apply/Cancel, including resmoothing, corners, points and 10× interpretive smoothing.
- [x] Add three real 412×892 Chrome drawing-phase screenshots to the 20-state mobile atlas, enforcing the live phase sequence and real pointer controls (PR #114).
- [x] Address genuine semi-transparent drawing-panel ghosting discovered in those three mobile screenshots, while preserving original pointer plane and actions (PR pending).
- [x] Group drawing controls into Interpret, Refine and Finish with live Sketch/Refine/Edit points state and keep all source handlers, smoothing, anchor and extension identities; complete touch-fidelity review remains open (PR #112).
- [ ] Keep path extrapolation beyond boundaries and intersections/weave/over/under.
- [x] Distinguish genuine imported-image Analyze / Select path / No paths phases in the existing modal with flat cream/dark visual states, real source-candidate browser screenshots and reset behavior (PR pending).
- [x] Fix source-proven 10px clipping of desktop material rotation buttons (36px inherited minimum inside 26px control row), preserving existing rotations and mobile sizing (PR #84).
- [x] Fix the matching 10px clipping on compact Pixel 6 Pro material rotation buttons. The new 17-state mobile atlas exposed this separately; assert source button bounds on both desktop and mobile (PR #91).
- [x] Lock down actual desktop Material Finish button bounds as a CI-enforced atlas invariant (PR #86).
- [ ] Preserve all three material layers, coverage, strength/scale/rotation shortcuts (−90,−1,value,+1,+90) through the complete redesign.
- [x] Give the three existing material chooser chips source-backed Off / Automatic / Active / 0% status without changing input identity or navigation geometry (PR #113).
- [x] Explain off/zero-strength Finish 1–3 states within the original Material card, without substituting inputs or altering controls (rebased PR pending).
- [ ] Preserve dynamic interior element stack, ink selection, colours, placement, locking, reordering.
- [x] Replace repeated Interior Elements empty-state copy with tool-specific guidance while preserving the original Add control and all element operations (PR pending).
- [x] Show selected interior element index, total, enabled/hidden state and targeting scope in the already-present compact manager line, without new inputs or card-height changes (PR pending).
- [x] Implement opt-in single Focus slider prototype backed by existing original range inputs; default All controls preserved (PR #87).
- [ ] A/B evaluate Focus versus full inspector on Path, Material and Colour workflows, especially locked/disabled states; do not change default without user testing.

## Phase E — gallery, history, output and quality

- [ ] Keep image-first Explore, independent Saved, history restore, user favourites and gallery loading semantics.
- [x] Preserve the most recent Explore contact sheet while opening Saved favourites; restore it without re-randomizing, with explicit accessible gallery mode labels (PR #100).
- [x] Browser-test populated Explore → Saved → Explore using all twelve original recipe seed identities (PR #102).
- [ ] Preserve global status announcements and grouped More with seed, import, output, metadata, batch, share.
- [x] Introduce source-preserving semantic groups inside More for create/seed, import/export/share and composition/details, retaining original handlers and desktop positions (PR #104).
- [ ] Test all existing PNG/JSON recipe round-trips and exact preview/export geometry.
- [x] Matrix-test source recipes with off-frame drawn paths, independent material layers, custom interior ink/locks, nested regions and hidden legacy tonal mode across JSON, shared URLs and embedded PNG; full-resolution export geometry acceptance remains open (PR pending).
- [ ] Test touch targets, keyboard/focus, colour contrast, screen reader names and reduced motion.
- [x] Raise the Image import → Edit / Use path button's white-text contrast above 4.5:1 in dark and cream, retaining the original import/angle actions (PR pending).
- [x] Keep the off-screen mobile Edit dock inert while preserving the visible dismiss handle and restoring keyboard navigation on close (rebased PR pending).
- [x] Keep the offscreen Edit dock inert to keyboard focus, while leaving the visible dismiss/expand affordance available and restoring the dock on exit (rebased PR pending).
- [ ] Update screen plates and companion deck with real implementation screenshots only after fidelity review.

## Acceptance gates for every implementation PR

1. Source/current UI feature inventory, canonical screen required states and icon mapping checked against actual application DOM.
2. No dropped controls, ghost actions, inaccessible alternative states or hidden randomize/download affordances.
3. Source geometry, camera-vs-recipe zoom, anchor extrapolation and exported recipes preserved.
4. `npm run check`, Chromium mobile acceptance, PNG/headless smoke and UI state atlas targeted journeys pass.
5. Exact change of user-visible semantics declared, not inferred from a glamorous illustration.
