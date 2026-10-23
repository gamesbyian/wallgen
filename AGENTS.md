# ROYGBIV: agent instructions

This is the **task router and permanent operating contract** for ROYGBIV. Do not treat it as a running changelog. For *what to do next*, reconcile current `main`, active PRs/issues and the [current handoff](docs/AGENT-HANDOFF-2026-10-22.md) against the [active product roadmap](docs/ACTIVE-PRODUCT-ROADMAP-2026-10-22.md). Their dated passages can be superseded by newer code and decisions. Historical implementation reports and the [previous agent-orientation snapshot](docs/archive/AGENT-ORIENTATION-SNAPSHOT-2026-10-22.md) are evidence, never another queue.

## Product priority and freedoms

**Owner direction (22 October 2026): this is early development. Optimize the best *current* canonical recipe, renderer and creative experience.** Backwards compatibility with any previously exported artwork, old recipe JSON, legacy seeds, source-era PNG or historical output pixels is a **nice-to-have**, not a release gate, blocking constraint or independent high-priority programme. Make justified improvements to present schemas, defaults and rendering, even when they require a documented legacy break. Do not silently rewrite original uploaded images; preserve source bytes, accurate provenance, and honest disclosure of import/reconstruction limitations. Narrow archival tools can remain but should not dictate the product's direction.

The app is a mobile-first, one-screen portrait creative tool for constructing ROYGBIV wallpapers, emphasizing exploratory randomization, precise edit/locks/Undo, meaningful visual controls, and reliable output. The primary physical design target is Pixel 6 Pro portrait Chrome/PWA. A browser viewport is a useful proxy, not a substitute for handset touch, performance or accessibility testing.

## Find the right authority

| Work | Minimal route |
|---|---|
| Current priority, owned issues, parallel lanes, latest merge | [Handoff](docs/AGENT-HANDOFF-2026-10-22.md), relevant part of [active roadmap](docs/ACTIVE-PRODUCT-ROADMAP-2026-10-22.md), current PR/issue and source |
| Canonical recipe, geometry, renderer, transport or new subsystem | [Engineering reuse and semantic ownership](docs/ENGINEERING-REUSE-AND-SEMANTIC-OWNERSHIP.md), then actual owner modules/tests |
| Metadata-free ROYGBIV image or arbitrary external image → recipe | [Image-to-recipe reconstruction plan](docs/IMAGE-TO-RECIPE-RECONSTRUCTION-PLAN-2026-10-22.md), then existing image importer, geometry, recipe and renderer |
| Editor navigation, UI/UX or human expectations | [Human expectations and creative composition](docs/AGENT-HUMAN-EXPECTATIONS-AND-CREATIVE-COMPOSITION.md), [IA controls audit](docs/IA-SEMANTIC-CONTROL-AUDIT-AND-REVISION-PLAN-2026-10-22.md), relevant source |
| Physical portrait touch, control reach, focus and navigation | Current #365 / #444 dispositions in roadmap and corresponding source; observe actual phone when available |
| Materials, embroidery, film/digital camera effects | Owning art specification in roadmap, `src/material-surface.js`, `src/embroidery.js`, `src/photo-look.js`, shared painter |
| Existing generated PNG metadata or historical recovery | [Recipe history registry](docs/recipe-format-history/REGISTRY.md), [PNG migration plan](docs/PNG-RECIPE-MIGRATION-AND-FORMAT-REGISTRY-PLAN-2026-10-22.md); **optional compatibility**, never an automatic priority |
| Human session evidence or opt-in usage recorder | [Human-expectations guide](docs/AGENT-HUMAN-EXPECTATIONS-AND-CREATIVE-COMPOSITION.md), [creative behaviour recorder proposal](docs/CREATIVE-BEHAVIOUR-RECORDER-PLAN-2026-10-22.md), issues #537/#542; distinguish proposal from implementation |
| Test, browser run or workflow change | [Lean CI policy](docs/CI-OPERATIONS-2026-10-22.md), relevant unit/headless fixture and workflow source |

Read the owning section and relevant current source, not the whole multi-month archive. Never infer task priority from the length of a historical research document.

## Shared-engine obligations

- **One canonical recipe and scene.** `src/model.js` owns `normalizeRecipe`, `resolveScene`, settings locks, seeds and canonical meanings. Before adding logic, check the existing geometry/composition/portable shape, image import, `src/renderer.js`, `src/render-coordinator.js`, worker/export and state/Undo/transaction interfaces. Normalize common semantics; do not fork a mini-renderer, duplicate photo processor, second file picker or private recipe dialect.
- **Preserve meaningful differences.** Reuse contracts where semantics truly match. A shared interface need not erase deliberate colour-space, material, geometry or noise mathematics. New abstractions must remove real duplication or make another feature appreciably simpler.
- **Reconstruct using the same forward model.** Image-to-recipe fitting produces candidate canonical recipe/scene state, compares against actual render outputs and returns uncertainty. No claim that arbitrary images have unique or authentic ROYGBIV source settings without provenance.
- **Keep feature paths aligned.** A new setting/operation must propagate across editor controls, locks/randomize, presets, Undo/redo, normalized recipe, preview, worker/headless render, export and metadata where applicable. Test these shared seams rather than shipping an isolated demo that looks correct.
- **Be willing to break the past deliberately.** Current-product improvements can change historical output. Identify the intended behavior change, protect current invariants and original imported image bytes, and document any affected import assumptions. Do not create large historical pixel-parity suites merely to defend obsolete semantics.

## Agent execution protocol

1. **Preflight:** Reconcile latest `main`, active issue/PR owners, implementation and authoritative queue. If the requested feature already exists, validate/extend it instead of recreating it. Avoid shared `index.html`, `src/app.js` and control-tree collisions with parallel agents.
2. **Choose useful work:** Establish the actual creator goal and visible outcome, affected source owners, cheapest tests and expected before/after behavior. Prefer shipping a narrowly complete improvement to introducing a large speculative redesign or documentation-only repetition.
3. **Proportionate proof:** Use `npm run check:quick` and targeted Node tests for ordinary changes. For visual quality, view **actual generated ROYGBIV images** and compare controlled recipes. For UX, check real route/control behavior and accessibility; no simulated persona or script counts as human observation. Use optional bounded Chromium/atlas workflows only when needed, and retire temporary workflows before merge. Do not add permanent routine screenshot CI.
4. **Evidence labeling:** Distinguish source inspection, deterministic test, browser emulation, viewed exported PNG, real Pixel handset and actual human use. State the build/recipe/seed, viewing conditions, changed pixels or observed behavior as relevant. An unviewed artifact or green CI cannot sign off artistic quality, handset ergonomics or creator satisfaction.
5. **Responsible learning:** Agent predictions about creative behavior must be labeled and ideally recorded *before* observation, without inventing participants or test results. The creative usage recorder and optional one-question surveys are installed but **off until explicitly enabled**; GitHub backup is separately opt-in, limited to the existing private `general-purpose` repository and must not be called live-validated without a real upload. Keep source provenance, local inspect/export/delete and participant privacy; test claims must distinguish mocked transport from physical-device or real human use. Never covertly collect human sessions or silently upload recipes.
6. **Finish autonomously:** Use a focused branch/PR; run relevant tests and reconcile against advancing main. Update the **single current owning** roadmap/issue/handoff only when a fact or deliverable actually changes, leaving concise measured results, limitations and next executable work. Do not turn ordinary merges into large historical appendices.

## Validation and closure

A code path can pass unit tests yet still fail on a phone or generate poor-looking art. Treat functionality, image fidelity, accessibility, export integrity and real-user comprehension as distinct claims. Do not weaken a guard merely to pass CI. If evidence disproves the premise, close or narrow the effort and record the discriminator; do not create another experiment simply to keep a lane active.

Agents may choose a better technical design than an old plan when they show why it serves the current product better. Significant UX structure changes should preserve the established seven-category mental model unless concrete evidence justifies changing it; they must be evaluated against actual tasks, not only tidy parameter groupings.
