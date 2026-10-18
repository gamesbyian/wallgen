# R.O.Y.G.B.I.V. | Cream Studio Pixel 6 Pro visual audit

**Date:** 2026-10-18. **Scope:** `gamesbyian/wallgen`, production UI from current main captured on the audit branch `audit/cream-pixel6pro-20261018`. **Primary appearance:** Cream Studio. **Primary viewport:** 412 × 892 CSS px with Chromium mobile/touch emulation, representing Pixel 6 Pro-size layout.

**Verified final capture:** [Actions run #39166559800](https://github.com/gamesbyian/wallgen/actions/runs/39166559800), [downloadable atlas archive (14-day retention)](https://github.com/gamesbyian/wallgen/actions/runs/39166559800/artifacts/12151472442), [audit implementation PR #76](https://github.com/gamesbyian/wallgen/pull/76). The run produced **1,648 screenshots: 832 mobile, 816 desktop; 0 traversal errors and 0 missing expected states**. Every zoom has 208 mobile and 204 desktop states. The successful capture validated the theme handling and all named, conditional and special UI journeys.

A **27-slide ROYGBIV Cream Studio Visual Audit** was authored as a PowerPoint deck with final verified screenshots, magnified diagnostic crops, side-by-side original/concept comparisons, five generated unified app mockups, peer-app references, and an acceptance plan. The standalone presentation is delivered as a downloadable ChatGPT conversation artifact rather than being committed to the source tree.

## Evidence provenance and limitations

The full UI-state atlas covers Studio, all seven editor categories, named tool cards for paths/radial/regions/tonal structures, conditional controls, dynamic interior elements and colour targeting, drawing/point handles, search, history, mobile rails, metadata, gallery and favourites, image import, and theme states. **Source identity:** final atlas commit `1eb54fe74b6d392d56bdf223e5c925b9cda7de3c`, based on the atlas-tooling merge `a02990d28d61bb96495cd978a184cd3430f9809a`.

The atlas runs at 100%, 75%, 66%, and 50% **CSS-root zoom**. This is a responsive stress approximation, not native Chrome Android page zoom or proof of real-device performance. Wallpaper pixels and gallery artwork are **intentionally masked** to isolate visible controls. The proposed rainbow-filled screens in the presentation are labelled **rendered concepts**, not screenshots of a reimplemented app.

The manifest also flags 1,010 generic `text-or-content-overflow` observations and 1,006 `viewport-edge` observations across many states. These are **diagnostic candidates, not counts of unique confirmed bugs**: horizontally scrollable chips, intentionally transformed off-screen dock controls, and nested scroll panes can produce expected geometries. Validate actual visible/actionable clipping individually before converting a warning into an issue.

There were no old atlas PNG or ZIP files tracked in main. Prior screenshot captures were separate, expiring GitHub Actions artifacts; no repository binary screenshots needed deletion. The new captures likewise live in Actions rather than adding megabytes of snapshots to the Git source tree.

## Recommended unified experience

**Studio:** canvas-first composition, stable pan/fit/zoom controls, bleed visibility, visible undo, randomize and export actions. The camera transforms **only the viewport**; never silently mutate the procedural recipe or crop the exported artwork.

**Edit:** one context-sensitive, explicitly navigated inspector. Keep all seven existing categories, named tools, die/lock/randomise semantics, conditional settings, source artwork and recipe capabilities. A single reusable setting-row vocabulary organizes label, value, slider/stepper, and trailing die/lock action. Search results reveal their tool chip, while manually scrolled chip rows retain their position.

**Explore:** image-forward gallery, a separate Saved/Favourites filter, consistent cards, search/filters and explicit restore-to-Studio behavior. Avoid letting toolbar chrome consume the majority of a gallery's visible height.

**More:** distinct Export/Share/Metadata groups and one global announcement host. Expanding metadata moves inputs into visible scroll context, and does not obscure the editor, canvas or notification area.

**Draw/adjust:** an intentional Draw → Interpret → Adjust → Apply/Cancel task flow. Smoothing should recognise deliberate straight, vertical, horizontal and circular segments; optional anchor/Bézier-style editing must preserve off-frame extrapolation and re-smoothing of adjacent changed segments. Maintain deterministic intersections and exported path geometry.

## Prioritized audit findings

| ID | Priority | Evidence in final archive (mobile/100) | Problem or opportunity | Proposed remedy |
|---|---|---|---|---|
| U01 | P1 | `editor-open`, `tool-paths-layout-arrange`, `special-search-matching-setting` | Seven categories, tool rail and mode selectors create a highly compressed navigational band; text can truncate. | Unified category/tool breadcrumb, clear selected state, visible horizontal overflow cue, search-linked chip reveal without snapping manual scroll. |
| U02 | P1 | `tool-paths-path-geometry`, `tool-paths-material-finish1`, `conditional-diagonal` | Labels, numbers, stepper buttons, dice and locks use inconsistent row grammars. | Typed reusable `SettingRow` variants with reserved action slots and geometry tests; retain distinct four-column material rotation layout. |
| U03 | P1 | `editor-open`, `special-draw-ready-path` | Many compact controls look difficult to touch with precision; their visible icon size may differ from the actual hitbox. | Measure clickable bounds/spacing; expand primary actions toward roughly 40–48 CSS px where feasible without overlap. |
| U04 | P1 | `studio-default`, `shell-mobile-more`, `editor-open` | Preview, editing tray, drawing, gallery and utility mode trade space in ways that fragment the experience. | One shell with explicit modes; deterministic stage/tray reservation and safe-area handling; preserve entire artwork and camera-vs-recipe distinction. |
| U05 | P1 | `special-draw-edit-point-anchors`, `special-draw-ready-path` | Numerous drawing point/smoothing actions compete in a short overlay. | Phase-specific editing UI, larger accessible hit regions, persistent Apply/Cancel and clean point-edit versus camera semantics. |
| U06 | P1 | `special-interior-interior-targets-populated`, `special-interior-band-style` | Interior stack, type, placement, ink and target controls require a clearer nested hierarchy. | Element header + grouped advanced regions, full R/O/Y/G/B/I/V chips, visible hex value, clear lock/disabled meanings. |
| U07 | P1 | `special-gallery-with-favourite`, `shell-mobile-explore` | Gallery title/buttons can occupy scarce space and separate visuals from their recall actions. | Distinct Explore/Saved navigation, image-first regular cards, independent heart button, compact persistent search/filter. |
| U08 | P1 | `special-metadata-expanded`, `shell-mobile-more` | Utility tasks and image metadata are mixed in one long More scroller. | Group Export/Share/Identity, scroll expanded fields into view and use consistent global feedback. |
| U09 | P2 | `conditional-diagonal`, `special-setting-locked` | Dormant fields may appear almost invisible or give no reason for inactivity. | `0 · Inactive` or short contextual explanatory text; disabled/read-only states remain legible. |
| U10 | P2 | `tool-paths-layout-arrange`, `special-vary-wild` | Long values and labels can truncate at narrow viewport widths. | Measured two-line/value presentation with accessible complete names and explicit ellipsis behavior. |
| U11 | P2 | `studio-default`, `tool-paths-path-geometry` | New cream/black dots and delightful rainbow sliders still coexist with inconsistent component spacing. | Preserve approved cream and black outlined circles, stable nonrepeating ROYGBIV sliders **including blue**; adopt shared tokens. |
| U12 | P2 (verify) | `editor-open` at 100/75/66/50 | Simulated CSS root zoom alters label widths/visual gaps. | Validate native Chrome behavior only if reported on device; independently test landscape and 499/500/790/791 breakpoints. |
| U13 | P2 | `shell-mobile-more`, `special-setting-unlocked` | Feedback generated outside More must remain visible and accessible. | Maintain one globally located, theme-aware aria-live host; avoid duplicate or context-obscuring toasts. |
| U14 | P3 | `docs/CSS-COMPONENT-OWNERSHIP.md` | Historical responsive `!important` overrides make ongoing style maintenance delicate. | Continue gradual component-owner consolidation with browser geometry guards rather than a risky wholesale rewrite. |

Findings U01–U08 concern workflow and primary ergonomics. U09–U14 are polish, accessibility or engineering maintenance. This is a **design review**, not evidence for an unconfirmed P0 production bug.

## Proposed design tokens and invariants

- Cream canvas `#F8F3E9`, ivory panels `#FFFCF7`, deep ink `#282638`, muted text `#736F80`, hairline `#E2D8CC`, warm selection `#FFE0BB`.
- The existing two theme circles retain **thin black outlines** and distinct pressed/focus indicators.
- Each active control panel receives a **randomly arranged, stable, flat ROYGBIV slider palette** with no repeated colour. Blue is welcome. Assignments must not flicker after rerenders or edits.
- In production, preserve the approved **Fredoka headings + Rubik text** rather than treating concept-mockup typography as implementation approval.
- Reuse one spacing grid (4, 8, 12, 16, 24 CSS px), bounded corners, readable inactive fields and consistent status/hover/focus/pressed treatments.
- Separate accessibility criteria: WCAG 2.2 AA minimum target **24×24 CSS px or spacing/exception**, compared with Android's recommended **48 dp** touch area. These standards are not the same measurement.

## Peer research informing the proposal

- [Adobe Express mobile editor simplification](https://adobe.design/ideas/behind-the-design-simplifying-animation-in-adobe-express): collapse deeply nested flows into browse/edit views, keep sheet behavior consistent and preserve scroll.
- [Adobe Express mobile UX guidelines](https://developer.adobe.com/express/add-ons/docs/guides/build/design/ux-guidelines/mobile-ux): title/body/footer structure, constrained sheet heights and readable form controls.
- [Canva mobile navigation](https://www.canva.com/help/navigate-canva-mobile-app/): a small set of stable bottom navigation destinations and a separate More area.
- [Figma's contextual properties panel](https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar): property panel follows object/task selection; its example is desktop-oriented and only a design principle reference.
- [Photopea missing-tools report](https://github.com/photopea/photopea/issues/2722) and [mobile usability/clipping report](https://github.com/photopea/photopea/issues/6879): design guardrails against control loss on small screens, not proof of a ROYGBIV issue.
- [Pixlr E](https://pixlr.com/tools/pixlr-e/): powerful editing tools grouped away from primary canvas.
- [NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): make advanced choices available without forcing every choice into initial attention.
- [Android touch-target guidance](https://support.google.com/accessibility/android/answer/7101858) and [W3C target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).

These are public UX references, not copied screens or code.

## Implementation sequence and acceptance tests

**P0: shared shell.** Establish Studio/Edit/Explore state contract and `SettingRow` primitive. Preserve all generator features, deterministic preview/export, canvas zoom, undo/history and present recipe data. Do not redefine geometry or rendering as a side-effect of interface design.

**P1: editor/drawing.** Move all named tools into coherent grouped inspectors; search must reveal the exact chip; implement structured interior controls and Draw/Interpret/Adjust; preserve off-frame editing, locks, randomization and contextual disabled states.

**P2: gallery/output/finish.** Streamline Explore/Saved, More/metadata, notification placement, type/spacing tokens and narrow viewport behavior.

**Acceptance must be falsifiable:** no actionable clipping or overlap at 412 × 892; all 7 categories and 40+ named tools reachable; root-zoom supplemental matrix; explicit short landscape and breakpoint states; camera actions never mutate a recipe; stable panel-specific ROYGBIV slider assignments; gallery/favourite/metadata/PNG export paths round-trip exactly; path editing and anchor extrapolation remain deterministic; focus/keyboard/touch geometry verified; physically test only when device-specific behavior is in dispute.

No permanent server, account service, or proprietary library dependency is proposed. Do not cut feature capability to make the inspector superficially simpler.
