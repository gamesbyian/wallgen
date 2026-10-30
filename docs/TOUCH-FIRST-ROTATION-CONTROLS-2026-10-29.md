> **30 October 2026:** Rotation remains an already accepted specialized implementation. Generalize its proven gesture/Undo/preview principles only where they fit vector-native editing; [touch-first vector interaction plan](TOUCH-FIRST-VECTOR-INTERACTION-PLAN-2026-10-30.md) now owns the broader control overhaul. Recipe schemas are pre-release and may evolve; a new UI field is never a reason to preserve the old shape indefinitely.

# Touch-first rotation controls | ROYGBIV
Owner request: 2026-10-29. Current status: planned specification and incremental implementation; no physical Pixel acceptance yet.

## Design objective
Make all editable angles predictable, immediate, precise, and comfortable with one thumb. No pointerdown jump, no tiny circular gestures, no snap flicker, and no inconsistent rotation semantics. Preserve canonical recipes, locks, randomization, exported pixels, and Undo.

## Research
- Adobe Illustrator iPad: constrained rotation; Photoshop iPad: direct rotate plus numeric editing.
- Procreate: transform grips, 15/45 degree magnetic steps, numeric entry.
- Figma: horizontal scrubbing and vertical sensitivity modulation.
- Konva Transformer: rotation snap tolerances, off-centre grip geometry and corner rotate zones. MIT: https://github.com/konvajs/konva/blob/master/src/shapes/Transformer.ts
- Fabric.js: pivot-based angle math and snap settings. MIT: https://github.com/fabricjs/fabric.js/blob/master/packages/core/src/controls/rotate.ts
- Moveable and interact.js: reference for larger gesture architecture, without importing another renderer. https://github.com/daybrush/moveable and https://github.com/taye/interact.js
- tldraw: conceptual inspiration only; do not assume permission to reuse its source without reviewing its licence.

## Interaction rules
1. Large, explicit, at-least-44px **Precision rotate** entry attached to existing angle controls; retain existing original controls during rollout. Opening and touching without moving never changes a value.
2. Drag horizontally using RELATIVE movement from pointerdown. Default gain approximately 0.45 degrees per CSS pixel. Moving finger downward selects fine 0.04 degrees per pixel; upward selects fast 1.6 degrees per pixel. Integrate each incremental dx at the gain for that movement so switching modes never teleports.
3. Snapping modes: Free, 45 degrees, 15 degrees. Hysteretic magnet: acquire at 2 degrees, release past 4 degrees (tunable test parameters), keep unquantized raw angle while snapped. Show live exact numeric value and presets; fine mode should default to free movement.
4. Live preview follows gesture through existing responsive render worker; coalesce moves to animation frames. Do not create Undo entries until pointerup. A completed gesture is ONE history transaction; pointercancel or lost capture restores its starting value without history.
5. Existing keyboard numeric editing and shortcut steppers remain; Escape closes panel; focus returns to initiating control; pointer capture and touch-action prevent browser sheet swipes; locked/inactive fields cannot open or change.
6. Dynamic visuals cannot falsely approximate canonical texture orientation: always settle exact full-quality render on commit. If a visual cache is ever used, demonstrate its equivalence or explicitly mark approximation.
7. Screen-space on-canvas object rotation should use consistent pivot/pointer coordinates, zero movement at initial touch, seam-safe angular deltas, and a centre deadzone.
8. Camera rotation (if supported later) must remain separate from artwork geometry. No wholesale replacement graphics framework.

## Angle semantics
- textureRotation, textureRotation2, textureRotation3: existing canonical 0..359.9 modulo 360, 0.1-degree precision.
- diagonalRotation, rayRotation, rayTwist: existing -180..180 relative degrees, clamp.
- hairpinAngle: existing 60..180, clamp.
- loopSweep: existing 240..450, clamp. NEVER wrap this sweep to 0..360.
- textOverlays[].rotation: existing -180..180 normalization and object-relative pivot.
- Future parameters: explicit registration rather than guessing via name.

## Execution order
R0 Pure reusable relative drag, angle normalization, snap/hysteresis maths + unit tests.
R1 One reusable real-input touch scrubber, numeric entry and presets. Preserve existing buttons/fields; integrate responsive preview with atomic Undo/cancellation, locks, and source sync. Browser check 320x700 and 412x892, keyboard, touch targets, no unintended tray swipe.
R2 Improve text-object on-canvas handle using shared math, real screen-space geometry and tiny-object grip rules; then extend to other canonical selected shapes where actually supported.
R3 Measure input-to-preview latency on representative material and text recipes. Optimize only measured bottlenecks with fidelity and worker/export evidence.
R4 After qualified touch evidence, consider collapsing the old 6-item Material rotation rail into Advanced, never silently remove controls now.

## Acceptance
Touch-down/up alone: no change or history. Multi-revolution movement remains continuous across seams. Fine mode supports 0.1 degrees, fast covers at least 180 degrees without re-gripping. Snap capture/release avoids flicker. Numeric/presets exact. Cancel zero history; committed drag one Undo; locks/inactive protect state; original source data preserved. Genuine browser keyboard and pointer flows + PNG/JSON roundtrip for touched controls. Physical Pixel, TalkBack, native IME and subjective comfort remain separately unverified.

Code ownership: pure `src/rotation-gesture.js`, UI `src/rotation-scrubber.js` and stylesheet, `src/app.js` canonical transactions, existing `src/model.js` normalizer and `src/text-direct-geometry.js` object math. No new recipe dialect or renderer.

## Implementation receipts (29 October 2026)

**R0 + R1 integrated:** [PR #855](https://github.com/gamesbyian/wallgen/pull/855), merged at `b4f4815715dda158c82b091fef6f9c1b461277b5`. Shared pure geometry, large touch-first precision scrubber for existing registered angle form fields, vertical sensitivity, hysteretic snaps, numeric/preset/large-step parity and canonical one-Undo transactions. The six tiny Material rotation shortcuts were consolidated on phones into one 44px entry, with full-size controls in the modal. Actual emulated Chromium at 320x700 and 412x892 passed direct pointer plus `touchStart/touchMove/touchCancel`, no-op tap, locks, numeric 359.9, one-step Undo and light/dark 4.5 contrast checks: [browser acceptance #40958404488](https://github.com/gamesbyian/wallgen/actions/runs/40958404488). Temporary workflow was deleted before merge; exact-source reusable test retained.

**R2 text on-canvas grip follow-up:** [PR #856](https://github.com/gamesbyian/wallgen/pull/856) uses the same pure rotation module for screen-space incremental bearing deltas. Prevents off-centre start jumps, continues through 360-degree seams/multiple revolutions, ignores ambiguous movement near the pivot, then resumes without a jump. Existing separate move/scale paths, locked text, focus and one-Undo remain intact. [Actual 412x892 Chromium/worker proof #40959229346](https://github.com/gamesbyian/wallgen/actions/runs/40959229346) passed 44px grips, rotate/scale/Undo/keyboard, no browser exceptions and exact worker/reference image pixels. Only software emulation; physical Android touch remains untested. Source scope does not yet upgrade scattered/imported shape handles.

**Outstanding:** R3 instrument actual pointer-to-preview latency and dropped frames for expensive material rotations before adding caches; targeted performance work only after a reproduced bottleneck. R4 evaluate whether desktop Material's old six-key row should be collapsed after human use. Further adapt the common control to text overlay rotation/shadow and other explicit semantic fields, without treating geometric sweeps as cyclic angles. Do not claim the universal rotation migration is fully complete.

## R3 baseline measurement, Linux Chromium 412x892 (29 October 2026)

A deliberately reproducible 40-step drag at approximately 16 ms per input showed that only the last preview was normally delivered, even though the numerical angle control updates continuously. [Original untouched renderer run #40964233800](https://github.com/gamesbyian/wallgen/actions/runs/40964233800). These are NOT physical Pixel 6 Pro or repeat-sample statistical performance claims:

| Design | Input events | Intermediate images presented | Final exact preview after last input |
| --- | ---: | ---: | ---: |
| Single-layer linen | 40 | 1 | ~917 ms |
| Three material layers | 40 | 0 | ~1294 ms |
| Complex loop path | 40 | 0 | ~808 ms |

The first linen intermediate arrived about 3145 ms after the initial drag sample, and about 339 ms after its nearest preceding input. A single Linux runner pass cannot isolate total GPU/CPU variance, but the inability to display intermediate frames on 2 of 3 cases is reproducible by the attached `scripts/rotation-latency-browser.mjs`. The source pipeline is latest-only: pending interactive requests supersede in-flight frames before presentation. **Next falsifiable intervention:** accept a completed lower-resolution provisional frame only while it belongs to the SAME ongoing rotation gesture, and never after a commit, cancel, change of tool or other design. Continue rendering the newest exact canonical final image. Repeat the same benchmark and ensure Undo/export/reference parity and no stale cross-gesture leak.

## R3 measured intervention: live-gesture provisional frames (29 October 2026)

[Repeat benchmark #40964997275](https://github.com/gamesbyian/wallgen/actions/runs/40964997275) from the same 40-input Chromium script, now with a strictly gesture-scoped provisional frame allowance:

| Scenario | Before → after intermediate frames | First intermediate | Last input → settled, before → after |
| --- | --- | --- | --- |
| Single-layer linen | 1 → 9 | ~3145 → ~257 ms | ~917 → ~488 ms |
| Three material layers | 0 → 5 | None → ~433 ms | ~1294 → ~1005 ms |
| Complex loop path | 0 → 6 | None → ~321 ms | ~808 → ~512 ms |

A completed **interactive-quality, low-resolution** frame may now be delivered while queued newer interactive rotation revisions have the **identical active gesture token**. The coordinating app checks the same live transaction before presenting a key-mismatched bitmap. No stale bitmap becomes authoritative cached composition, gallery art or native PNG. Existing exact settled composer remains unchanged. Separate node tests enforce expiry when gesture changes, settles, is invalidated or is not a rotation. No stale frame can be rendered after a completed/cancelled gesture or another design. Times are unpaired, single Linux CI runs; do not interpret them as guaranteed speedup, statistical significance or actual phone measurement. The measured benefit here is primarily increased visible intermediate feedback.

## R2 extension: text object and shadow angles (29 October 2026)

The reusable precision inspector now accepts an object-bound angle adapter, reusing the same actual selected text object and the existing `changeRecipe`/Undo/worker/export contracts. Two explicit field semantics: `textRotation` clamps -180..180°, and `textShadowAngle` wraps 0..359°. The second trigger is disabled with no active text shadow. The original text sliders remain available, and both large precise controls live within their existing More text options/Shadow sections. Selection changes invalidate a bound dialog, preventing edits to the wrong object.

[Chromium 320x700 and 412x892 acceptance #40966012830](https://github.com/gamesbyian/wallgen/actions/runs/40966012830) passed: drag and exact numeric, single Undo, shadow gate, object selection identity, zero page exceptions, and exact worker/reference rendered pixels for the selected 359° shadow. These are software-browser results, not physical Android IME/TalkBack or subjective thumb feel.

## R2 extension: regional embroidery direction (29 October 2026)

**Source implementation browser-qualified:** The same precision dialog now supports the editor-owned `surfaceTreatments[id=editor-stitches].direction` angle as a signed -180..180° 0.1° control. This is a nested surface assignment, not a top-level `embroideryDirection` recipe key. The existing exact numeric source input remains authoritative and available, and a 44px Precision entry appears only in Texture → Surface → Thread treatment. It disables for path structures (whose ribs follow the ribbon tangent) and when the editor-owned treatment is off. Drag, numeric, preset, Undo and cancellation run through the existing single-transaction code, preserving unrelated surface treatment entries. [Chromium acceptance #40974711607](https://github.com/gamesbyian/wallgen/actions/runs/40974711607) passed at 320x700 and 412x892: visible 44px control, exact 73.5° input, single-Undo drag, disabled Off state and independent authored-treatment preservation. The test isolated an existing worker/Canvas2D stitch raster rounding difference: **maximum per 8-bit channel delta 3**, both at the original 38° and adjusted 73.5°, with zero difference when embroidery is removed. Rotating stitches changed 108,953 pixels in reference and 109,025 pixels in worker renderings (240x520). The test now enforces this measured bounded raster tolerance and demonstrates real visible changes; do **not** claim pixel-perfect stitch parity. Reproducible script: `tests/embroidery-precision-angle-browser.mjs`. No physical Pixel/TalkBack or human ergonomic claim. The acceptance also revealed and corrected a pre-existing tool visibility contradiction: the Surface editor was hidden for Regions although regional embroidery is supported there.
