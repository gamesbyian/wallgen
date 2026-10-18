# GPU masked decorative-field experiment

2026-10-18. The experimental path in `src/gpu-fields.js` is a
concrete follow-up to [GPU acceleration research](GPU-ACCELERATION-RESEARCH.md).

## Real operation, limited scope

`renderMaskedFieldGPU({mask,element,logicalWidth,logicalHeight})` renders the
same world-anchored regular *field* that `drawRegionInteriors()` can draw,
using a WebGL2 fragment shader and an existing Canvas2D polygon mask.
The alpha channel of that mask is sampled per fragment, so the shader does
not need to reimplement the geometry solver or polygon rasterizer.

The worker-side 2D renderer remains the reference and production backend.
The experimental GPU code is **not imported by ROYGBIV's app**. There are no
changes to the UI, recipes, export formats or production rendering. Explicit
eligibility requires an enabled, nontransparent, solid **line** with global
`field` placement, a straight/wave/zigzag shape and direct
white/black/custom colour. It excludes dashed/dotted strokes, tonal bands,
loops, region IDs and per-colour targeting. These still require the existing
Canvas2D implementation. It also caps research masks at 2.5 million pixels.

For eligible fields, the fragment shader uses the original field's:
- logical canvas coordinate origin and pattern baseline at -2400;
- field spacing `max(12,160/frequency)`;
- sinusoidal/triangular wave and phase handling;
- position and amplitude;
- ink colour and opacity;
- antialiasing via WebGL2's built-in derivatives (`fwidth`).

## How correctness is checked

`tests/gpu-fields-browser.mjs` requests ANGLE/SwiftShader in a separate
Chromium launch; ordinary mobile smoke continues to disable the GPU for
deterministic layout tests. The test paints a real concave polygon using
Canvas2D, feeds its alpha mask into WebGL2, and compares the result against
`drawRegionInteriors()` for straight, wave and zigzag patterns.

The test checks:
- no painted pixels outside the owner's mask;
- both implementations produce meaningful, opaque detail;
- average alpha difference and significant pixel disagreement remain bounded.

This is a raster *tolerance* test, not proof of exact pixel identity.
Canvas2D stroking and shader signed-distance coverage have different
antialiasing kernels. The signed-distance calculation measures vertical
distance from a wave rather than true perpendicular distance, so at steep
slopes the shader may still differ from Canvas2D. Subtle edges should be
visually inspected before any production promotion.

`tests/gpu-fields.test.js` independently tests that unsupported elements,
invalid masks, absent contexts and malformed colours fail closed.

## Performance and platform caution

This prototype creates a WebGL2 context, compiles the shader, uploads a
Canvas2D alpha mask and releases the context for each render. That is
intentional for research safety, **not an efficient production pattern**.
A production backend would need one long-lived, worker-owned context, reused
programs, mask textures or atlases, context-loss handling, bounded queues,
and careful control of maximum texture size and memory pressure. It must
also account for upload/download overhead and coexist with the existing
preview ImageBitmap cache.

Chrome on Pixel 6 Pro is the primary experiential target, but no mandatory
physical-phone benchmarking is required. Native GPU speedups must not be
claimed from ANGLE/SwiftShader test timings.

## Further work and promotion gates

1. Evaluate a long-lived GPU worker that reuses shader programs and textures,
   while preserving the latest-only preview scheduler and independent PNG
   worker.
2. Compare multiple repeated fields applied to one shared polygon-mask
   texture rather than duplicating masks for all seven colours.
3. Improve tangent-aware antialiasing and support real looping fields,
   strokes with cap/dash semantics, selective palette/object targeting and
   alpha accumulation for more than one element.
4. Test pathological concave regions, overlapping masks, eight-element
   stacks, 50% zoom and the original/export camera coordinate system.
5. Promote only an independently qualified operation with evidence of
   benefit. Keep automatic Canvas2D fallback for WebGL2 absence, shader errors,
   GPU context loss, and excessive allocation.

Relevant implementation references:
- WebGL2 fragment derivatives:
  https://developer.mozilla.org/en-US/docs/Web/API/OES_standard_derivatives
- texture-upload and alpha unpacking:
  https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/pixelStorei
- image-to-GPU texture:
  https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
