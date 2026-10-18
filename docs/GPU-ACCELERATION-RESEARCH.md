# Selective GPU acceleration: technical feasibility and decision record

Date: 2026-10-18. Base: Wallgen main at `a506c6b`, after worker preview,
isolated PNG exports, FIFO history/gallery thumbnails and the icon rollout.

## Recommendation

**Keep the worker-based Canvas2D renderer as the production reference.**
Prototype specific WebGL2 passes before deciding whether any deserve promotion.
Do not rewrite the unified scene model, polygon inset solver, crossing repairs
or rasterized textures merely to claim that the app uses a GPU.

For the Chrome-on-Pixel-6-Pro use case, a WebGL2 context is the most reasonable
experimental acceleration API. WebGPU may be explored later but has additional
capability, driver and fallback considerations. WebGL2 is available from an
OffscreenCanvas in a Worker, so an eventual GPU pass can stay off the main
thread. WebGPU and WebGL2 are alternatives for an individual canvas context;
the same surface cannot be used as both 2D and WebGL2 simultaneously.

Sources:
- https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/getContext
- https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext
- https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvasRenderingContext2D

## Repo-specific assessment

Current runtime architecture:

1. `src/model.js`: deterministic normalized recipe / `resolveScene()`.
2. `src/composition-geometry.js`, `src/path-geometry.js`,
   `src/polygon-inset.js`, `src/contour-decoration.js`: CPU geometry.
3. `src/renderer.js`: Canvas2D drawing of ribbons, filled regions, texture
   tiles, materials, over/under/weave crossings, clip masks and compositing.
4. `src/render-worker.js`: worker-side Canvas2D surface and two-layer
   ImageBitmap transfer; isolated full-resolution PNG exports.
5. `src/render-coordinator.js`: latest-request preview scheduling and
   separate FIFO thumbnail rendering.
6. `src/app.js`: lightweight main-thread presentation, exact recipe state,
   mobile controls and drawing interaction.

The existing worker separation is the right foundation for optional GPU passes.
The meaningful risk is not drawing a fullscreen triangle; it is preserving
existing alpha conventions, compositing order, clipping, pixel aspect, shadow
and texture behaviour across heterogeneous drivers and resolutions.

Priority experiments:

1. **Compositing**. OffscreenCanvas WebGL2 source-over blending and texture
   presentation can be compared against the two cached Canvas2D layers.
   The small probe in `src/gpu-probe.js` verifies shader compilation and
   a simple RGBA compositing equation, but is deliberately *not* a complete
   production-materials implementation. Canvas2D uses pre/postmultiplied
   alpha in different parts of the pipeline; test transparent edges and
   all blend modes before considering replacement.
2. **Repeated interior fields**. The current CPU renderer samples waves,
   dots, zigzags and loops into strokes clipped by arbitrary path/region
   masks. A GPU shader could evaluate a field per fragment while using an
   existing 2D-generated alpha mask, avoiding many line vertices for large
   regions. Test both mask upload overhead and actual raster quality;
   a split backend risks more memory than it saves.
3. **Materials**. Texture tiles, organic/paper effects, glow and atmosphere
   may be shader candidates, but exact deterministic noise seeding must
   agree with recipes and exports. Visual tolerances need to be established
   against the reference painter.
4. **Polygon geometry**. Low priority. The existing CPU metric inset,
   cutting and crossing ordering is complex and tested. Rendering triangles
   alone would not replace those operations.

## Why the current CI cannot measure GPU performance

`tests/browser-smoke.mjs` launches headless Chrome with `--disable-gpu`.
This is appropriate for portable browser/layout acceptance but can force
software-backed contexts or make WebGL2 unavailable. **A passing Chromium
test is not proof of GPU speed**, and an unavailable WebGL2 context in this
mode is not evidence that Android Chrome lacks WebGL2.

The user does not want a device-benchmark programme. Therefore, use browser
CI for geometry/DOM/worker correctness; use optional capability/correctness
probes without production impact; only promote acceleration after a substantial
and independently reproducible advantage in plausible environments, and use
normal user feedback as the real-world performance signal.

## Opt-in probe

`src/gpu-probe.js` provides `probeWebGL2()`. It allocates a 4×4
OffscreenCanvas, requests WebGL2, compiles a minimal fullscreen fragment
program, checks a source-over alpha result against a CPU reference, reports
capabilities and releases the GPU context and resources.

From Chrome DevTools on a supported browser:

```js
const {probeWebGL2} = await import('./src/gpu-probe.js');
console.table(probeWebGL2());
```

This small probe measures *correctness and API availability only*.
Its `milliseconds` field includes setup/readback and must **never** be
reported as representative wallpaper rendering throughput.

## Acceptance gates before a production GPU backend

- A single independent shader backend behind a feature gate; automatic
  Canvas2D fallback for missing contexts, context loss and invalid results.
- Side-by-side raster fixtures for transparent edges, patterned polygons,
  self-crossing path repair, masks, textures and atmosphere in both regular
  previews and 3024×6552 exports.
- No additional mandatory UI control or browser prompt.
- No hidden worker queue or persistent GPU context leaks; explicit
  `WEBGL_lose_context` handling in short-lived diagnostic experiments.
- No degradation to PNG metadata round trips or non-WebGL clients.
- No changes to existing icon/typography work.
- Prefer one operation at a time, with a reversible integration PR.

## Decision

Keep `src/gpu-probe.js` disconnected from application startup. No shader is
enabled by default. The next meaningful research spike should render **one
actual material or interior field through both paths** using the same masks,
not a wholesale rendering rewrite.

## Reusable masked-field session prototype (PR #69)

`src/gpu-fields.js` now offers `createMaskedFieldSession({width,height})`,
a research-only, explicitly owned graphics resource. The earlier
`renderMaskedFieldGPU()` one-shot proof remains available as a thin
compatibility adapter.

The session compiles/link its shader program, initializes a single vertex
buffer and one GPU texture once. Its caller performs:

```js
const session=createMaskedFieldSession({width:300,height:650});
if(session.supported){
  const uploaded=session.setMask(polygonMaskCanvas);
  if(uploaded.supported){
    for(const decorativeElement of eligibleFields){
      const result=session.render(decorativeElement);
      // Consume/copy each result before the next render overwrites it.
    }
  }
  session.dispose();
}
```

The WebGL2 session allocates immutable one-level RGBA8 storage via
`texStorage2D()` once, then every `setMask()` call uses `texSubImage2D()`
to replace pixels without reallocating the texture. A mask is always
reuploaded when the caller explicitly requests it, including if the same
Canvas2D object was repainted in place. `render()` does not upload
again: several independent field elements can share the *same* owner mask.
Only the eligible simple world-field modes are included, and the shader
still redraws its entire output on each call, not a composed layer stack.

**Ownership and recovery:** A session owns its GL context, shaders, program,
vertex buffer and one mask texture. `dispose()` is idempotent, releases
owned objects and attempts to relinquish the context. On
`webglcontextlost` or `webglcontextrestored` it remains unusable; new
sessions must recreate the shader, vertex objects and mask pixels. No
silent recovery attempts occur in a hot render loop. An unavailability or
upload/draw failure is an explicit result; production Canvas2D is not
affected.

**Memory and performance:** A 300×650 RGBA mask is ~0.74 MiB before
GPU/browser copies. The research constructor imposes a 2.5-million-pixel
budget and never attempts a 19.8 MP export texture. Holding a session
avoids repeated shader compilation, context creation and texture
allocation. It does not yet prove an overall acceleration benefit: the
Canvas2D-to-WebGL mask upload and presentation/download costs may exceed
the saved CPU tessellation. Do not infer Pixel 6 Pro speed from the
SwiftShader/ANGLE headless acceptance environment.

This mirrors [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices), which favour explicit immutable texture storage over repeatedly redefining texture levels. Driver-side mask upload costs may still dominate; the change alone is not proof of a performance benefit.

**Tests:** `tests/gpu-fields.test.js` uses an instrumented fake WebGL2
context to prove one shader program, one texture and repeated draws,
same-mask object reupload, size rejection, teardown and context-loss
guarding. `tests/gpu-fields-browser.mjs` exercises three real field
styles through one session and compares the results against the existing
Canvas2D mask and ink renderer. It then clears and reuploads the mask to
catch previously rendered pixels leaking into a later frame.

**Next decision:** Keep this as an isolated graphics research backend
until a meaningful integration proves sufficient visual parity *and*
net savings after polygon-mask upload and final compositing. Prefer
reusing one context for the lifetime of a worker rather than initializing
one for each shape. Production can remain worker Canvas2D indefinitely
if shaders do not deliver meaningful benefit.

## Ordered multi-decoration compositing prototype (PR #70)

`createMaskedFieldSession()` now offers `renderMany(elements,options)`.
Unlike invoking `render()` separately, it renders **one ordered stack of 1–8
eligible field elements in one fragment draw**. A second fragment program is
compiled lazily on the first stack request and shared across subsequent stacks
in the same session. The vertex buffer, mask texture and WebGL context are
reused from the single-element path.

The shader's uniforms carry all eight potentially independent values for
frequency, amplitude, position, phase, thickness, colour, shape and opacity.
It evaluates the same world-anchored lines (including the source -2400
vertical-grid station) and calculates source-over in straight RGBA:

```
nextPremultipliedRGB = newInkRGB * newAlpha + oldPremultipliedRGB * (1-newAlpha)
nextAlpha = newAlpha + oldAlpha * (1-newAlpha)
outputRGB = accumulatedRGB / accumulatedAlpha
```

This avoids the pitfalls of using framebuffer blending factors intended for
premultiplied versus straight alpha, and removes inter-layer readbacks,
uploading output bitmaps or creating additional FBO textures. The final
straight-alpha output can be compared with `CanvasRenderingContext2D`
`getImageData()` more directly. See MDN
[blendFuncSeparate](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFuncSeparate)
for the distinction between RGB and alpha blending factors.

**The entire stack is rejected** if any element uses unsupported features,
is disabled or contains invalid custom colour. The prototype intentionally
only accepts world-field, solid-stroke line elements with no selective
object/colour targeting and straight/wave/zigzag shapes. This avoids silently
dropping selected layers. Zero layers and more than eight are rejected rather
than truncated. No production code invokes this API.

`tests/gpu-fields-browser.mjs` renders three different translucent colours
in order through both Canvas2D and WebGL2; checks RGB and alpha agreement,
the original polygon clip, reverse-order changes, and complete mask
invalidations. `tests/gpu-fields.test.js` confirms one texture upload and
one GPU draw call per full stack, correct resource disposal and unsupported
element rejection. Software ANGLE/SwiftShader validates raster semantics,
**not** hardware performance on the Pixel 6 Pro.

**Production promotion is still blocked** on evaluating whether a unified
GPU render batch saves time once the Canvas2D mask creation, transfer to
WebGL, shader execution and final image presentation are included. Avoid
introducing GPU context ownership, extra memory surfaces and fallback
complexity merely because the shader supports multiple layers. The existing
worker Canvas2D path remains the canonical image renderer and exporter.
