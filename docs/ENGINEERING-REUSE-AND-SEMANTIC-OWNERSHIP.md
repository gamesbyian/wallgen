# Engineering reuse and semantic ownership contract

## Updated product-development compatibility policy (owner direction, 22 October 2026)

**This overrides contrary historical compatibility requirements elsewhere in this document.** The project is early-development, and the current best recipe system is the source of truth. Exact old recipe schemas, old saved images, historic seed streams, former pixels and backwards-compatible transports are **nice-to-have only**. Never block a useful schema, algorithm, renderer or shared-engine improvement on historical fidelity. Consolidate genuine duplication even if a documented legacy visual break is unavoidable and warranted; evaluate current functionality with focused tests. Preserve raw imported/source artwork from unintended mutation and never falsely present a reconstructed recipe as authentic. Historical import/archival aids remain available as optional separate utilities, not a dependency of everyday development. New image reconstruction must follow the [shared inverse-graphics plan](IMAGE-TO-RECIPE-RECONSTRUCTION-PLAN-2026-10-22.md).


**Status:** active contributor guidance, 22 October 2026. Applies to all ROYGBIV development, not only image-to-recipe reconstruction. Source inventory reviewed against `main` at `6abe1f89bbec2f86490d81b948b257860c033fc1`. Recheck current source before implementing: paths and responsibilities can evolve.

## Intent

Grow one coherent, efficient engine rather than independent mini-engines hidden in each tool. Prefer shared data contracts, reusable pure operations and a single authoritative implementation per *genuinely identical* behaviour. Distinct algorithms can share an interface without sharing their maths. Preserve older recipes, exported pixels, worker/reference parity, geometry portability, lock and Undo behaviour and mobile performance. This is a design constraint, **not** an instruction to refactor everything first, add dependencies, create an abstraction layer for its own sake, or run expensive routine CI.

## Existing owners and reuse routes

| Responsibility | Source of truth / existing entry point | Rule for new features |
| --- | --- | --- |
| Recipe schema, defaults, deterministic scene | `src/model.js` (`normalizeRecipe`, `resolveScene`, `rng`, `respectSettingLocks`) | Reconstructors and new tools emit candidate inputs for the canonical recipe normalization path, then use `resolveScene`. Do not invent private recipes, alternate defaults or a second scene resolver. |
| Structural composition | `src/composition-geometry.js`, `src/scattered-composition.js`, `src/path-geometry.js`, `src/drawn-path.js` | Reuse established scene object types and coordinate meanings. Add a small shared geometry primitive only when the existing structure cannot express a real need. |
| Portable geometry, validation, storage | `src/geometry-asset.js`, `src/geometry-library-store.js`, `src/geometry-library-backup.js` | Validate and serialize through existing versioned geometry contracts. A renderable recipe must carry its required shape snapshot, never depend upon a future library lookup. |
| Raster image import and extraction | `src/image-path-ui.js`, `src/image-path.js`, `src/svg-import-safety.js` | Extend the existing decode/candidate workflow and reusable RGBA extraction helpers. Do not build an unrelated second image uploader, contour tracer or opaque bitmap cache. Preserve existing file/type/size/safety limits unless change is justified and tested. |
| Rendering and materials | `src/renderer.js`, `src/material-surface.js`, `src/embroidery.js`, `src/photo-look.js` | All final compositions pass through the one scene painter and its shared surface/Photo pipeline. New render modes or fitting previews call this renderer rather than approximating it with another output engine. Preserve opt-in treatment semantics. |
| Preview, workers, exports, headless | `src/render-coordinator.js`, `src/render-worker.js`, `scripts/render-headless.mjs` | Reuse the established worker/coordinator and renderer entry points, with bounded resolution/allocations for optimization. No independent high-resolution rendering pipeline. |
| Persistence and recipe transport | `src/png-metadata.js`, `src/png-recipe-migration.js`, `src/share-recipe.js`, `src/favorites-store.js` | Use the canonical recipe serializer and source-preserving PNG routes. Keep inferred recipes separately identified from authentic embedded records; never rewrite original artwork to imply invented provenance. |
| Controls, state and applicability | `src/app.js`, `src/editor-schema.js`, `src/editor-layout.js`, `src/editor-tool-applicability.js`, `src/editor-control-roles.js` | Reuse canonical controls, applicability/lock policy, recipe transactions and Undo. Avoid multiple independent models of one setting or uncoordinated parallel DOM state. |

These are ownership boundaries, not claims that every listed file is already fully deduplicated.

## Source-observed seams to watch

1. **Raster recognition is already shared in part.** `extractImagePathCandidates` and `extractImageShapeCandidates` both live in `src/image-path.js` and reuse background sampling, connected components and contour extraction. An inverse-graphics importer should build on this module and introduce reusable segmentation/shape descriptors only when multiple consumers actually need them. Keep path/compound-region distinctions explicit.
2. **Deterministic randomness has several intentional dialects.** `src/model.js` exposes `hashString`/`rng`; `src/scattered-composition.js` contains its own hash/stream; `src/material-surface.js` and `src/photo-look.js` contain coordinate-noise hashing; `src/path-geometry.js` has one-dimensional noise. They are candidates for *documented interfaces or common utilities*, but may be semantically different. **Do not swap algorithms, seed namespaces or evaluation order for existing presets:** that can change historical pixels. Any eventual deduplication requires identity fixtures for all affected old seeds and output modes; otherwise leave stable implementations in place and share only the safe contract.
3. **Colour and luminance processing has different purposes.** Raster edge/shape detection, material relief, photographic grading and colour-vision preview may all sample RGB, but do not necessarily use interchangeable colour spaces, alpha treatment or performance budgets. Share pixel-bound validation, sampling and reusable colour transforms only where the same numeric semantics can be proven. Avoid a universal colour helper that silently changes behaviour.
4. **Object geometry and render identity are related but distinct.** Portable asset geometry, per-object transforms, region polygons and ribbon centreline paths must converge through the established scene contract. Avoid an inverse-only shape model or a second object tree. Any new independently editable objects should be added as an explicit backward-compatible scene/recipe extension, not held in transient importer state.
5. **Input, transformation and provenance have separate authorities.** Raw image data is evidence; an extracted contour is a candidate; a normalized recipe is an editable model; a rendered PNG is output; genuine historical metadata is original provenance. A reconstruction result cannot impersonate an original stored recipe, and ordinary metadata-only migration must keep its existing refusal gates.

## Decision procedure for every implementation

Before coding, find the current owner module, public entry point, recipe field(s), tests and other consumers. Search the repository for equivalent math and pipelines, including browser/worker/CLI paths. Record why the existing primitive is reusable, insufficient, or intentionally semantically distinct. Design the smallest extension to the **shared contract** first.

When two call sites need the *same operation with the same numerical and error semantics*, consolidate in the existing owner or a cohesive pure module; migrate callers deliberately. When they merely look alike but differ in behaviour, keep separate implementations with explicit names and tests. Avoid circular imports, global mutable caches, shared state hidden inside render helpers, giant utility buckets and infrastructure built for hypothetical future consumers.

Prefer a single sequence for data: **untrusted input → validated candidate → normalized recipe/geometry → resolved scene → shared renderer → standard persistence/export**. Editor actions join at the canonical state transaction boundary, not by mutating the DOM and repairing the recipe afterward. Features should be composable and usable through import, editor, preview, worker and export without each endpoint reimplementing domain logic.

Use stable, versioned contracts for serialized data. Add fields or separately named opt-in modes rather than silently redefining previous controls. New helper modules should have one reason to exist and a named owner. For optimization, preserve original source images, fit at small preview resolution, limit parallel canvases/work, and use the existing renderer as the final authority. Reuse is desirable only when it does not introduce hidden heavy work into ordinary mobile rendering.

## Practical audit with a feature PR

- **Ownership:** Which existing module is the authoritative owner? What existing functions were evaluated for reuse, and why is any new helper needed?
- **Data contract:** Are inputs/outputs typed by existing recipe/geometry/scene conventions, with explicit validation, coordinate spaces, bounds and failures? Is inferred provenance separate?
- **Single semantics:** Would an equivalent setting, transform, seed-derived effect, format conversion, lock or export be interpreted differently in another tool? If so, resolve the divergence or document why it must persist.
- **Compatibility:** Will saved old recipes render identically, including dormant fields and RNG streams? Add focused old/new or baseline checks where that invariant could change.
- **Surfaces:** Does one implementation work through current editor, reference renderer, worker/export, PNG/JSON share/restore and Undo where applicable? Avoid parallel render or serialization implementations.
- **Performance and testing:** Verify one small relevant pathway and only necessary regression fixtures using `npm run check:quick`; use optional actual-image evidence for visually meaningful changes, without new permanent screenshot factories.
- **Traceability:** Document only substantive architectural decisions and outstanding duplication with a measurable next action. Do not create speculative cleanup tasks from superficial naming similarities.

## Application to image → recipe work

1. Add descriptive image-analysis outputs to `src/image-path.js` and its coherent helper(s); reuse the existing UI decode pipeline. Keep original path/shape candidate APIs stable.
2. Represent recovered paths/regions using `src/geometry-asset.js` and existing scene object vocabulary. Identify genuine representational gaps before adding new model types.
3. Generate multiple candidate *standard* recipes, normalize with `normalizeRecipe`, and evaluate via `resolveScene` and `drawWallpaper` at bounded preview size. The optimizer is a consumer of the renderer, never a substitute renderer.
4. Compose any eventual fitting algorithms from source-independent steps (feature extraction, candidate generation, metric evaluation, optimization) so the same operations can serve native and external images. Source-specific priors belong in strategy/weights, not duplicate pipelines.
5. Preserve original images unchanged. Display whether output is an inferred visual approximation, a procedurally fitted guess, or a genuinely recovered embedded recipe. Never claim exact seed/recipe provenance from pixels alone.

**Default posture:** consolidate when evidence supports genuine semantic identity; otherwise document and preserve the difference. Engineering unity must reduce the number of conflicting truths, not increase the number of abstractions.
