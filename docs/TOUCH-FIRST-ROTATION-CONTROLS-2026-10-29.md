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
