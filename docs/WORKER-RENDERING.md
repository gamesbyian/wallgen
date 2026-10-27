# Worker-first rendering architecture

## Target and compatibility

Primary interaction target: Chrome on Pixel 6 Pro. Production remains an
unbundled browser ES-module application, deployed from GitHub Pages. The
existing Canvas2D rasterizer remains authoritative and doubles as the
main-thread fallback. No graphics scene, colour, outline, inset, intersection,
camera or texture algorithms were independently rewritten.

## Rendering surfaces

`src/renderer.js` creates all intermediate painting canvases via
`createRenderSurface(width,height,canvasFactory)`. On the main thread this
defaults to `document.createElement('canvas')`; inside a Worker, it defaults
to `new OffscreenCanvas(...)`. Callers can inject a factory for unit tests.
The two paths therefore share precisely the same painter and deterministic
recipe normalization. The interactive drawing and image-import overlays
remain main-thread input tools.

## Worker protocol and lifetime

`src/render-worker.js` is a dedicated ES-module Worker. It verifies
OffscreenCanvas, Path2D, ImageBitmap transfer and PNG encoding before
acknowledging `{type:'ready',protocol:1}`.

Messages sent to the worker:

- `{type:'preview',id,key,recipe,width,height,quality:'interactive'|'settled'}`
- `{type:'export',id,recipe,width,height}`

Messages received by the main thread:

- `{type:'frame',id,key,quality:'interactive',frame,ms}`, a small
  transient ImageBitmap intended for scaled preview while dragging.
- `{type:'frame',id,key,quality:'settled',background,ink,overhang,ms}`,
  the immutable compositing layers for a definitive preview and fast nudge.
- `{type:'exported',id,blob,ms}`, a browser PNG blob without metadata.
- `{type:'error',id,operation,error}` and `{type:'unsupported',error}`.

All ImageBitmaps are transferred in the message transfer list. The main
thread must explicitly `close()` discarded or replaced bitmap resources.
The worker releases its own underlying OffscreenCanvas backing stores in
`finally`. Large PNG exports use `convertToBlob()`, not a base64 transfer.

## Scheduler and state semantics

`src/render-coordinator.js` uses **one active job and one replaceable
pending preview**, with monotonically increasing request IDs. A slow synchronous
Canvas2D draw cannot be interrupted simply by sending `postMessage()`;
instead, obsolete queued requests are skipped and obsolete completed frames
are closed, never displayed. A watchdog covers stuck startup and renders.

The UI recipe, undo history, URL, favourite state and selected controls commit
**synchronously** on the main thread. Worker display is asynchronous.
A finished worker frame must match the latest recipe art key and revision.
When only nudge, shadow or compositing settings change, cached ink/background
are presented immediately with the pre-existing `presentNudgedArtwork()`
rather than scheduling another geometry solve.

During slider movement **and discrete Randomize All/new-seed actions**, the
worker may render a provisional 62% preview first. After the existing 170 ms
quiet period, the scheduler requests a definitive 100% preview. If that timer
expires while the provisional paint is still active, its result may still be
presented before the queued definitive one **only when both requests reference
identical full canonical recipe values (object identity or serialized equivalence)**. A differently valued recipe invalidates the old
frame even if its artwork key matches; unsolicited/duplicate frame IDs never
release the active worker slot. Temporary frames never populate the
authoritative nudge cache or replace exact wallpaper export. On initial page
load the visible canvas is drawn by the reference renderer before the worker
starts, preserving fast startup and the existing screenshot contract.
The quick preview reduces the first frame's pixels (about 38% of full at
matching aspect ratio), but actual latency depends on painter complexity and
device resources; no physical-Pixel timing is implied.

Failed feature detection, worker script errors, communication failures,
context errors and request timeouts disable the worker path and invoke the
reference Canvas2D renderer. No second worker is spawned in an uncontrolled
retry loop.

## Background thumbnails and history fidelity

A separate small-canvas FIFO worker lane renders Explore gallery cards and
Recent Variations snapshots independently. Recent Variations retains exact
recipes on every Random or scoped change, but **defers thumbnail painting
until that panel is opened**. It renders visible history images one at a time,
newest first, and stops scheduling further work when the panel closes. This
avoids using CPU and GPU bandwidth for hidden thumbnails during rapid phone
randomization; the full preview and exact history/Undo recipes are unchanged. Each archived history image comes
from its saved normalized recipe, not the visible canvas, which may still
show an older asynchronous frame. FIFO ordering and stable identities prevent
swapped image/recipe pairs. If thumbnail workers are unsupported, the small
reference Canvas2D renderer remains available. Pending image resources are
closed when their card is no longer visible; thumbnail worker failures reject
all affected jobs rather than leaving the controls stuck.

## Export isolation

The Download action snapshots the exact normalized recipe before rendering.
A separate, short-lived worker renders 3024 × 6552 pixels and encodes a PNG
blob. Once the blob arrives, the main thread embeds the original recipe
snapshot and metadata using the existing PNG metadata writer. A worker error
can fall back to the previous Canvas2D export implementation.

This export worker never blocks the preview worker's request queue. However,
separate workers do not eliminate physical memory pressure; expensive exports
should not be launched concurrently. The UI already disables its Download
control while busy.

A raw 3024 × 6552 RGBA surface occupies about 75.6 MiB before overscan,
textures and encoder allocations. Browser implementations may allocate further
copies; lower-power devices can still fail on extreme combinations.

## Acceptance strategy

- `scripts/progressive-randomize-browser-proof.mjs`: opt-in real Chromium 412×892 emulation, instruments real Randomize/seed button handlers, provisional and settled frame order/timing, worker dimensions, actual preview screenshots and page errors; requires Playwright/Chromium. The 27 October 2026 first source-backed run is [#40447670702](https://github.com/gamesbyian/wallgen/actions/runs/40447670702) (first frames 148/116 ms, settled at 530 ms). A repeat exposed an intermittent dropped provisional frame; [corrected source proof #40448878581](https://github.com/gamesbyian/wallgen/actions/runs/40448878581) independently confirmed that settled/provisional requests have equal serialized recipe values but different object references, and both delivered in order at 342/885 and 233/714 ms respectively. These are tiny samples on CI Chromium, not Pixel hardware. The temporary PR-only installation workflow was removed after evidence capture.
- `tests/render-coordinator.test.js`: latest-only queue behaviour, stale
  ImageBitmap release, cached-revision invalidation, worker failures,
  short-lived export and negative feature detection.
- `tests/browser-smoke.mjs`: native Chromium OffscreenCanvas/Canvas2D
  visual parity for paths, textured radial wedges and inset regions, plus
  encoded worker PNG inspection and ordinary phone UI acceptance.
- `npm run render -- --backend worker ...`: real production worker output
  through the headless Chromium CLI with restorable recipe metadata.
- `.github/workflows/headless-render.yml`: both backends exercise
  representative radial/inset fixtures.

Do not replace the existing renderer with a WebGL or WebGPU copy until a
narrow GPU operation shows visual parity and representative performance gains.
Texture tiling, repeated decorative fields and large-area material compositing
are reasonable candidates for a later isolated WebGL2 proof-of-concept.
No external mobile benchmark commitment is required: automated CI and normal
user experience guide refinements.
