# ROYGBIV: source-aware open-source reuse audit (29 October 2026)

**Scope:** External code and architectural research mapped against current ROYGBIV source, product contract and active queue. **Research only:** this audit does not authorize a new dependency, change the release gates or claim optical improvements. Main examined at [`b8bca55b`](https://github.com/gamesbyian/wallgen/commit/b8bca55b286e14f8687293250314e6f344321522); live PR search returned no open PRs and issue search returned #557, #815, #839. Recheck before implementing. Verify license at the **pinned commit being copied**, not only a repository badge.

## Decision and next priority

The best candidate for a **bounded new comparison experiment** is [Open Vectorizer](https://github.com/vardirhq/open-vectorizer), specifically subpixel coverage fields, primitive recognition and simplicity-versus-accuracy selection for #557. A second promising **reference-first** candidate is [Color.js](https://github.com/color-js/color.js), for source pigment diagnostics and opt-in future palette work. For surfaces, [FastNoise Lite](https://github.com/Auburn/FastNoiseLite) offers new cellular and domain-warp algorithms without requiring a second material or render engine. All must show measured benefit on ROYGBIV's own artwork before inclusion in the PWA.

**Do not delay #839 on reuse research.** Its current remaining gate is operational deployment and acceptance of the existing default-off authenticated MCP preview, not rewriting the renderer or OAuth architecture. Keep the installed Cloudflare source SHA, D1 quota/lease, and owner-scoped R2 boundaries. Browser session reuse is an optional cost/latency experiment only **after** true MCP image delivery passes.

ROYGBIV already has correct current-user pipelines in `src/model.js`, `src/renderer.js`, `src/polygon-inset.js`, `src/nested-shape-contours.js`, `src/image-path.js`, `src/image-hue-reconstruction.js`, `src/material-surface.js`, `src/photo-look.js`, `src/embroidery.js`, `src/drawn-path.js`, `src/render-coordinator.js`, `src/agent-api.js` and the local/hosted MCP bridge. Avoid a second scene, painter, editor, object-history model, state store or exporter.

## Candidate matrix

| Candidate / source | License observed 29 Oct | Specific reusable value | Existing owner / genuine gap | Recommendation and stop condition |
| --- | --- | --- | --- | --- |
| [Open Vectorizer](https://github.com/vardirhq/open-vectorizer) | MIT | Subpixel alpha-coverage fields, 0.5 isolines, corner detection, ellipse/circle/rectangle hypotheses, simplest accurate geometry, independent source-rasterize scoring; CLI + optional WASM | `image-path.js`, `image-hue-reconstruction.js`; #557 shapes can be visibly close but non-compact/rough. | **P1, opt-in offline oracle** for flat colour source art. Benchmark against current hue masks **and already pinned VTracer**. Do not bundle if no new source-visible geometry improvement / canonical editability. Author acknowledges missing stroke recovery, gradients and slower-than-VTracer execution. |
| [VTracer / visioncortex](https://github.com/visioncortex/vtracer) | MIT / Apache-2.0 dual | Mature colour vector tracing, watershed, palette options; pinned alpha.4 reference and reproducible binary | **Already implemented** optional oracle `scripts/benchmark-reconstruction-vtracer.py` and `.mjs`. Prior actual Loop generated 107 SVG paths without semantic Loop identity. | **Keep as existing benchmark.** Reuse existing scripts rather than starting a second vectorizer evaluation pipeline. Incremental config sweep only with a reproduced visible failure. |
| [Color.js](https://github.com/color-js/color.js) | MIT | OKLab/OKLCH, colour conversions, multiple Delta E measures, gamut mapping | `src/image-path.js` source pigment classification, `model.js` palettes, colour vision previews and output | **P2, targeted diagnostic comparator.** Compare current hue decisions and source-painted residuals under OKLab/OKLCH distances. Accept only better true source assignments, equal negative controls and bounded CPU. Keep old palette pixel output unchanged. |
| [FastNoise Lite](https://github.com/Auburn/FastNoiseLite) | MIT | Cellular/Voronoi, OpenSimplex2, fractals and domain warping, JavaScript port | Existing world-space coherent `materialHeight()` in `src/material-surface.js`, `src/photo-look.js` hash/grain | **P2 conditional visual feature.** Opt-in new seeded material family or variation only if viewed PNG looks better and worker/headless/native output stable. No global replacement or unexpected per-pixel full export cost. |
| [Clipper2-WASM](https://github.com/ErikSom/Clipper2-WASM) | BSL-1.0 | Polygon Boolean difference/union/XOR, offset join rules (including sharp corner choices), compound holes/islands | `polygon-inset.js` Euclidean SDF offsets and `nested-shape-contours.js` already deliver seven levels | **P3 conditional only.** Isolate miter/bevel join or solid-band Boolean geometry under an explicitly requested product mode. Current round/Euclidean outline path remains authoritative. No immediate dependency. |
| [polygon-clipping](https://github.com/mfogel/polygon-clipping) | MIT | Lightweight pure JS Boolean clipping with multi-polygons | Region ink bands/holes, distinct from distance offsets | **Alternative only** if Boolean difference is justified but Clipper2 WASM bootstrap/size is disproportionate. Cannot substitute for Euclidean offsets. |
| [fit-curve](https://github.com/soswow/fit-curve) | MIT (verify pinned source) | Fitting multiple cubic Béziers to an input point series | `src/drawn-path.js` already has stroke reduction, regularization, resampling, smoothing and semantic index maps | **P3 opt-in curve quality experiment** for specific failing cloud/hairpin or drawn-path examples. Preserve authored corners, input anchor identity, offscreen extrapolation and Undo. Do not swap into current smoothing silently. |
| [perfect-freehand](https://github.com/steveruizok/perfect-freehand) | MIT | Pressure/velocity-sensitive variable-width stroke polygons, smoothing, taper, end caps | Existing seven-ribbon centreline/tangent renderer has a different semantic width model | **Design reference** for a future genuine pressure/brush object. Its output is a filled outline polygon, not a direct replacement for seven offset centrelines. |
| [PEmbroider](https://github.com/CreativeInquiry/PEmbroider) | GPLv3 / ACSL 1.4 dual | Concentric anti-alignment, stitch phase staggering, angled hatching, shape-aware satin/tatami, rendering visual examples | `src/embroidery.js` already implements Satin/Soft/Tatami/Running/Chain plus opt-in fibre styles | **Concept and optical oracle only.** Study stitch alignment and hatching diagnostics, independently reimplement algorithms if rights allow; **do not copy code** into unconditional Unlicense delivery. Current project explicitly disclaims machine-embroidery physics. |
| [Ink/Stitch](https://github.com/inkstitch/inkstitch) | GPLv3+ | Mature stitch-flow, underlay and embroidery routing conventions | Surface optical fidelity and negative-space clipping | **Reference only**, no direct code copying, no machine DST/PES export unless separately prioritized. |
| [pixelmatch](https://github.com/mapbox/pixelmatch) | **ISC** (not MIT) | Antialias-aware perceptual raw-pixel differences, diff maps | Already extensive targeted actual-image and pixel scoring tests | **Optional dev-only comparator** for inspected before/after PNGs. Not an inverse-graphics winner score and not necessary for production. Beware a metric that rewards blur/edge shifts instead of editable geometry. |
| [ssim.js / obartra](https://github.com/obartra/ssim) | MIT | Structural similarity scoring | Existing high-contrast shape/hue scoring | **Research comparator**, not automatic objective. Perceptual scores do not prove hole/hue topology. |
| [Paper.js](https://paperjs.org/) | MIT | Mature path Boolean/smoothing/transform/scene architecture | ROYGBIV has its own canonical scene/geometry and camera semantics | **Reference/extract narrow math only** if an actual missing path operation. Importing a scene graph duplicates source-of-truth and export logic. |
| [Harfbuzzjs](https://github.com/harfbuzz/harfbuzzjs) + HarfBuzz | MIT JS binding (verify all bundled components) | Shaped run glyph IDs, cluster advances and positions | #653 complete; complex joined scripts on arbitrary curved baselines currently fall back to native straight shaping | **Defer** unless owner explicitly requests a reproduced curved-script case; compare SVG textPath and library+outline reader in a capped opt-in test, not a full text renderer rebuild. |
| [OpenType.js](https://github.com/opentypejs/opentype.js) | MIT | Glyph outlines, font metadata/geometry | Existing private-font, browser-native shaping | **Only alongside future text-path shaping research**. OpenType parsing alone cannot replace complete Arabic/Indic shaping. |
| [postprocessing](https://github.com/pmndrs/postprocessing) / [glfx.js](https://github.com/evanw/glfx.js) | Zlib / MIT respectively | Image finishing concepts, passes, LUT/noise, separable blur/gamma | Existing deterministic opt-in `src/photo-look.js` uses Canvas pixels without full-size extra buffers | **Concept only.** A three.js/WebGL branch plus 19.8 MP GPU buffers would impose a second image pipeline and different export pixels. Study technique not framework adoption. |
| [resvg-js / @resvg/resvg-wasm](https://github.com/thx/resvg-js) | MPL-2.0 | SVG raster reference for external vector test outputs | Existing Chromium `drawWallpaper` is actual production pixel authority | **Optional isolated oracle** for SVG vectorization comparisons; do not replace final ROYGBIV painter. |
| [tldraw SDK](https://tldraw.dev/community/license) | **Non-permissive production licensing** | Sophisticated interaction ideas | ROYGBIV mobile editor already owns tools, focus, Undo | **Reject as dependency.** Production needs trial/commercial/hobby license; copied SDK inappropriate for public-domain-intended unrestricted project. |

Licenses can change; before actual copying inspect the exact version's LICENSE and subdependencies. MIT, ISC and BSL generally require preserving notices; the ROYGBIV Unlicense statement covers only the author's own rights. In particular the PEmbroider dual license offers **GPLv3 or ACSL**, **not** an MIT permission; Ink/Stitch is GPLv3+. An independently implemented design idea is different from copying covered code.

## Implementation-oriented experiment cards

### P0: Hosted authenticated MCP image delivery, #839

**Existing:** Canonical renderer module, isolated render-host, exact Pages SHA manifest, GitHub OAuth, private D1/R2, owner-scoped read, 6 previews/UTC day default limit, global lease, browser and request egress restrictions, manual artifact/deploy workflow. Source, actual Cloudflare Quick Actions PNG and metadata were already verified, but live MCP Worker deployment/client image part acceptance remains the gate. See `docs/HOSTED-MCP-CLOUDFLARE-DEPLOYMENT.md`.

**Reuse opportunity:** Cloudflare [Browser Run shared session reuse](https://developers.cloudflare.com/browser-run/features/reuse-sessions/) officially supports Playwright session reconnect and independent browser contexts. It can avoid a cold start, but could increase idle billed duration, state leakage risk or stale Pages SHA while private artwork is rendered. **No changes until** real authenticated MCP PNG passes with a single-request-per-session baseline. Then measure cold/warm browser-ms, error rate, cache version enforcement, billed minutes, total daily owner usage, tenant isolation, and cleanup with genuinely separate incognito contexts. Free Browser Run allowance is documented as **10 min/day** for Workers Free, shared across applications, and paid plans have different included/overage terms. Real account plan not verified. An always-open browser may be worse economically than occasional cold starts.

**Do not** introduce a custom rasterizer or image URL proxy to save Browser Run cost; such work either compromises verified pixel parity or privacy for an unproven operational benefit.

### P1: Semantic vector primitive experiment for #557

**Hypothesis:** a coverage-based vector primitive oracle can recover source-visible flat geometric regions as fewer, more faithful canonical pieces than a current hue-mask pixel contour, especially a circle/ellipse/Delta corner, while preserving exact hue slot and visible negative space.

**Execution:** Keep experiment isolated under existing `scripts/benchmark-reconstruction-*` family; never overwrite source PNG. Pin Open Vectorizer CLI commit/binary + checksum, run only manually/offline on exactly matched metadata-free source images. Include existing original current-renderer and external user-permissioned sources, R0 #05 Hairpin, #06 Loop, compound hole/island and deliberately absent-hue negative controls. Compare against (a) current canonical fit and (b) existing VTracer oracle. Probe Open Vectorizer primitive count, curve count, hue boundary displacement, hole topology and native raster. Source with gradients/translucency/strokes may be unsupported; report that rather than reinterpreting hue evidence.

**Acceptance:** Actual source/current/candidate 480x1040 and 3024x6552 PNG contact sheets viewed; edge distance and per-hue bright-ink overlap improved in **more than one** representative case without a control regression, no false hue slots, no topology collapse, no extra production paint beyond 6+10, no creator text corruption and original files unchanged. Candidate must still convert into `geometry-asset.js`/existing canonical scene, or remain a **nonproduct oracle**. VTracer’s earlier Loop 107-path result exemplifies why raw SVG accuracy is insufficient.

**Stop:** No independently visible improvement, irreducible object explosion, unsafe SVG/embedded asset handling, or runtime/heap cost incompatible with mobile.

### P2: Color.js source-colour diagnostic, optional future palette

**Hypothesis:** perceptual differences in OKLab/OKLCH can detect source hue/low-chroma pigment assignments more reliably than the current source classifier, particularly dark Jewel/Muted hues.

**Execution:** Make a dev-only comparison command consuming already obtained source masks and actual painted candidate scores, rather than performing source segmentation again. Keep sRGB/alpha premultiplication explicit, test null/near-grey/black/white, gradients and disabled slots. Quantify false-positive hue assignments and a labelled visual comparison. Do not replace existing canvas paint RGB or seed streams.

**Acceptance:** Cases with demonstrably wrong pigment choices improve while known source-blind controls and current full-frame scoring remain stable; CPU overhead bounded on imported 650k-pixel analysis cap; no new package in ordinary PWA unless real value shown.

### P2: Material noise research + stitch optical ideas

**FastNoise Lite:** evaluate discrete *new* material response modes via existing world-aligned `materialHeight`, not a generic new surface engine. A 2D cellular noise response might make realistic pores/crackle; domain warp might alter the existing stucco/stone/wood relief. Compare native 3024x6552 same-seed PNG cropped at 1:1 and reference/worker byte parity. Performance must be acceptable at 412x892 preview. Keep installed default materials unchanged.

**PEmbroider and Ink/Stitch:** inspect their authored artwork and machine-stitch physics for optical concepts such as alternating rows, stitch phase offset, underlay, corner crowding avoidance and curvature-aware Satin placement. Test one **opt-in** fibre treatment with actual reviewed current-renderer images, hole/island clipping, seven-hue saturation and relief. Their license and incompatible Java/Python engine argue for independent algorithm study only; do not pull in whole platforms or non-permissive source.

### P3: Solid nested colour bands / pointed joining, optional #815 product direction

Current `nested-shape-contours.js` already draws seven genuine source-boundary Euclidean contours with normal-distance gaps and meaningful Auto-fit. Only consider Clipper2-WASM if a genuinely distinct feature is requested: filled nested *regions* or user-selected miter/bevel sharp join control. Test a crescent, thin-neck cloud, very elongated ellipse, multi-hole Starfleet-like Delta and two islands. Compare existing Euclidean output, winding, hole ownership, winding independence, collapse, colour order, antialiased seams, transform, 1-step Undo, source/worker/headless parity. Measure wasm size/startup vs browser-only alternative. Refuse false seven-level continuation at real medial-axis pinches. Do not install for a theoretical benefit.

### P3: Pressure brush / cubic smoothing (creator optional)

`perfect-freehand` is a suitable reference for a **new brush object** with explicit time/pressure and variable width, whereas `fit-curve` is a prototype for path editing with fewer cubic nodes. Both require a precise product decision: whether generated geometry is editable as a centreline + width profile, or a frozen original imported shape. Avoid converting a seven-normal-offset stripe directly into a filled brush and hiding the difference. Preserve per-anchor pins, offscreen continuation, Undo and all current path shapes; verify a real portrait gesture/export journey first.

## Reuse tests that should be mandatory for accepted code

| Contract | Minimum acceptance |
| --- | --- |
| **Authority** | Existing `model.js` normalization / `resolveScene`, one canonical renderer; no forked scene or second Undo stack |
| **Semantics** | Current seven hue slots, locked values, per-setting randomization, inactive values, source provenance and absent-hue refusal |
| **Preservation** | Imported PNG and original vector bytes remain immutable; only explicitly accepted fitted recipe changes |
| **Transport** | Visible mobile download, complete PNG-embedded recipe, JSON restoration, local assets/privacy and worker/headless parity |
| **Mobile** | 320x700 and 412x892 real Chromium journey when UI touched, 44px targets, keyboard focus/IME and retained editor/camera |
| **Art** | Directly viewed PNG before/after, controlled negative source, no reliance on numerical metric alone |
| **Performance** | 19,813,248-pixel full output bounded memory; preview responsiveness measured independently of Node-only microbenchmarks |
| **Licensing and security** | Pin version, source/license notice audit, recursive dependencies, CDN-free offline operation, untrusted SVG protection, explicit permissions |
| **Process** | Small opt-in benchmark first; no permanent large CI matrix or new dated second live queue |

## Counterproductive work explicitly rejected

- Rebuilding the entire editor with Paper.js, tldraw or Excalidraw-style state management.
- Replacing the production Canvas painter with resvg, Skia, WebGL/Three or a Cloudflare-only rasterizer.
- Bundling VTracer just because its SVG looks close; its independent comparison work already exists.
- Replacing signed-distance silhouette nesting with scaled-in shapes or a separate Clipper-only geometry dialect.
- Converting source-image reconstruction to generic photographic tracing that loses ROYGBIV's meaningful editability or claims recovered hidden painter order.
- Reopening software-complete typography #653 merely to demonstrate HarfBuzz.
- Using GPT/LLM inference as a secret second image generator; agent MCP already uses canonical control discovery, recipes and renderer.
- Improving one score without a visually inspected source/fit image, or introducing nightly browser renders for unaccepted research.
- Assuming Cloudflare's 10 free Browser Run minutes are a guaranteed daily quota dedicated to ROYGBIV.

## Source inventory

**Current ROYGBIV authority:** [AGENTS.md](../AGENTS.md), [product contract](PRODUCT-CONTRACT-2026-10-26.md), [live queue](CURRENT-WORK-QUEUE-2026-10-24.md), [reuse and semantic ownership](ENGINEERING-REUSE-AND-SEMANTIC-OWNERSHIP.md), [finite R/T closeout](RECONSTRUCTION-TYPOGRAPHY-COMPLETION-2026-10-27.md), [VTracer pinned oracle](RECONSTRUCTION-VTRACER-ACTUAL-ORACLE-2026-10-25.md), [nested contours reuse research](NESTED-IMPORTED-SHAPE-GEOMETRY-AND-REUSE-2026-10-27.md), [hosted MCP deployment](HOSTED-MCP-CLOUDFLARE-DEPLOYMENT.md). Historical roadmaps contain earlier research and must not be read as active dispatch.

**External primary sources:** [Open Vectorizer source and architecture](https://github.com/vardirhq/open-vectorizer); [VTracer releases](https://github.com/visioncortex/vtracer/releases); [Color.js](https://github.com/color-js/color.js); [FastNoise Lite](https://github.com/Auburn/FastNoiseLite); [Clipper2-WASM](https://github.com/ErikSom/Clipper2-WASM); [polygon-clipping](https://github.com/mfogel/polygon-clipping); [fit-curve](https://github.com/soswow/fit-curve); [perfect-freehand](https://github.com/steveruizok/perfect-freehand); [PEmbroider readme/license](https://github.com/CreativeInquiry/PEmbroider/blob/master/README.md); [Ink/Stitch](https://github.com/inkstitch/inkstitch); [pixelmatch license](https://github.com/mapbox/pixelmatch/blob/main/LICENSE); [ssim](https://github.com/obartra/ssim); [Paper.js](https://paperjs.org/); [HarfBuzz WASM shaper responsibility](https://github.com/harfbuzz/harfbuzz/blob/main/docs/wasm-shaper.md); [postprocessing](https://github.com/pmndrs/postprocessing); [glfx.js](https://github.com/evanw/glfx.js); [resvg-js](https://github.com/thx/resvg-js); [tldraw license](https://tldraw.dev/community/license); [Cloudflare browser session reuse](https://developers.cloudflare.com/browser-run/features/reuse-sessions/), [Browser Run pricing](https://developers.cloudflare.com/browser-run/pricing/), [Browser Run FAQ](https://developers.cloudflare.com/browser-run/faq/).

**Disposition:** research map, not issue proliferation. Start one bounded image-to-recipe oracle trial under #557 only if a source-visible failure is reproducible. Existing #839 deployment acceptance stays ahead of new infrastructure research. Bring narrow successful results back into the product spec/owner issue after actual visual proof; never prematurely update implementation percentages.
