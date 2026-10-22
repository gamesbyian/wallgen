# ROYGBIV: modern digital camera and photographic rendering looks

**D3 working implementation increment (2026-10-22):** In the existing Photo look selector, **Low-res webcam capture** now introduces a bounded miniature sensor grid, four-source-point filtering per sample, shared 2×2 chroma, and luma/chroma quantization before the existing tone/grain finish. This is an honest **signal-loss simulation**, distinct from the older, still unchanged Webcam colours (preview). The sensor is at most 200×520 for extreme ratios, approximately 200×433 for the studio portrait. Alpha and authored recipe remain stable; source and export use the shared `src/photo-look.js` pipeline without another full-size image allocation. It is **not** actual JPEG/MJPEG codec emulation, camera sensor RAW, measured 480p output or a performance-certified Pixel 6 Pro feature. D3 more realistic codec ringing/quantization and D4/D5 visual/device judgement remain queued. Focused Node tests, no new CI workflow.


> **CURRENT IMPLEMENTATION QUEUE · 2026-10-22:** This is a research/specification merged via [#469](https://github.com/gamesbyian/wallgen/pull/469), **not shipping source code**. [Camera issue #471](https://github.com/gamesbyian/wallgen/issues/471) owns D0–D5. [Film #468](https://github.com/gamesbyian/wallgen/issues/468) owns F0–F5; they share one versioned neutral photoLook and **Light → Photo (Camera/Film)**. [Embroidery #467](https://github.com/gamesbyian/wallgen/issues/467) is an independent surface stage. See [current roadmap](ACTIVE-PRODUCT-ROADMAP-2026-10-22.md). Use only targeted samples and regular lightweight PR CI; planning ≠ completion.
## Companion specification to film emulation, camera-style image processing and UX integration

**Created:** 2026-10-22. **Status:** research and plan, not implemented. **Authoritative related plans:** [photographic finishing and film](PHOTO-FILM-LOOKS-AND-FILTERS-PLAN-2026-10-22.md) and [embroidered materials](GEOMETRY-AWARE-EMBROIDERY-AND-SURFACE-TREATMENTS-PLAN-2026-10-22.md). **Source snapshot:** main at 7e970906222ebf1d085b12527f2a6aa9106d9209; check new main before implementation.

## Execution checkpoint: first shared Photo renderer (PR #473, 2026-10-22)

[#473](https://github.com/gamesbyian/wallgen/pull/473) now implements **D1** normalized versioned `photoLook` and part of **D2** deterministic generic digital tone treatment inside the common final compositor; it also introduces preliminary Camera/FIlm choice via a preset selector inside **Light → Lighting → Photo**. The included Natural and Smartphone HDR presets emulate colour and global tonal cues only; the webcam preset is explicitly an early *colour* treatment. Do not claim actual sensor modelling, local detail, bilaterals, depth/RAW properties, capture downsampling, chroma subsampling, compression or optical calibration. These remain **D2 refinement and D3/D4/D5**. Source/preview/export routing is wired, but full-size Pixel performance and perceptual review have not occurred. This checkpoint is an implementation increment, not entire feature completion. No external dependencies added.

## Artistic intent and honest limitations

Make *generated flat geometric artwork* look as though it passed through recognizable modern and historical digital photographic capture and processing pipelines: modern iPhone-style computational photography, Pixel/HDR+ smartphone processing, DSLR/mirrorless RAW development, point-and-shoot compact digital, inexpensive USB webcam, video-call processing, and early consumer digicam. No claim to perfectly clone proprietary firmware, physical lens blur, real depth reconstruction, camera sensor measurement, or a particular phone generation; digital *camera-inspired rendering* is the goal.

Distinct results from the same artwork:
- **Modern smartphone:** clean shadows, aggressive local dynamic range, polished colour, spatially adaptive sharpness, selective highlight preservation, restrained noise and mobile HDR impression.
- **Pixel-like computational HDR:** protected bright colours, strong clean shadow lift, locally compressed tone and crisp-but-not-haloed details, reminiscent of multi-frame fusion.
- **DSLR/mirrorless RAW developed:** natural shadow-to-highlight rolloff, controllable white balance, edge-masked sharpening, modest grain/noise, relatively restrained local contrast and lens softness (depending on "lens" preset).
- **Bright flash compact:** harsh highlight response and steep colour/contrast, slightly crunchy outlines, clipped whites, falloff/flash-like illumination if artistically enabled. Since these artworks lack photographed 3D depths, simulated flash is a global/two-dimensional appearance effect only, not true depth-aware flash.
- **Consumer webcam / compressed video:** lower processing resolution, slight optical softness, quantization, macroblocking/ringing from lossy compression, reduced chroma resolution, per-channel gain/white balance shifts, luma/chroma noise, sharpening halos and auto-exposure look. Don't inadvertently apply motion artifacts to a still image without a clear stationary equivalent.
- **Early digicam/phone-camera:** small-sensor chroma noise, clipped highlights, 8-bit posterization, saturated punch, chromatic fringes, JPEG-derived block artifacts, optional date-camera motif only if added as an actual graphic element with explicit consent.

These are combinations of effects, not one giant pile of gimmicks. The quality of modern digital cameras often comes from *avoiding* distortion: responsive local tone mapping, competent colour correction, denoising and detail reconstruction.

## Source-grounded research and practical references

1. **Google HDR+ burst photography:** https://research.google/pubs/burst-photography-for-high-dynamic-range-and-low-light-imaging-on-mobile-cameras/ . Published SIGGRAPH Asia 2016 pipeline merges aligned RAW bursts to reduce noise/increase dynamic range then tone-maps; we have one *already rendered* digital wallpaper, so borrow the target appearance, not a fictional multi-frame merge. HDR+ dataset: https://hdrplusdata.org/ .
2. **Apple iPhone Photonic Engine / Deep Fusion / Smart HDR / Photographic Styles:** https://www.apple.com/iphone-17/specs/ and Apple's description of HDR gain maps: https://developer.apple.com/documentation/appkit/applying-apple-hdr-effect-to-your-photos . Model the outcome with local tone, colour balance, clean detail and optional contrast; *not* an assertion of access to Apple's proprietary exact pipeline. Gain-map HDR is not the same as making an SDR PNG slightly brighter. Future true HDR exports need separate display/output standards and a verified compatible toolchain.
3. **libcamera official ISP model:** https://docs.libcamera.org/master/public-api/camera-model.html , https://docs.libcamera.org/master/guides/pipeline-handler.html . Documents black-level, lens shading, spatial filtering, white balance, demosaic, colour correction, gamma, transforms, cropping and resizing. Use this as a *semantic processing map*, not a demand to invent synthetic Bayer raw samples for RGB generated art.
4. **Adobe Camera Raw detail processing:** https://helpx.adobe.com/camera-raw/desktop/using/sharpening-noise-reduction-camera-raw.html . Important separation between sharpening amount, radius, detail, edge masking, luminance vs chroma noise-reduction and contrast. A creative "Digital Camera" inspector should expose accessible results rather than all low-level raw controls by default.
5. **Raw development process versioning:** https://helpx.adobe.com/au/camera-raw/desktop/get-started/overview-and-setup/process-versions.html . Finishing algorithms evolve and change output: store the **pipeline version and expanded parameters** per recipe.
6. **Open source implementations to inspect:** [libcamera](https://git.libcamera.org/libcamera/libcamera.git/) processing algorithm modules and Raspberry Pi camera tuning projects; [RawTherapee](https://github.com/Beep6581/RawTherapee) for demosaic, colour and local-tone methods; [darktable](https://github.com/darktable-org/darktable) for tone/detail/color workflows; [glfx.js](https://github.com/evanw/glfx.js) for MIT-licensed browser convolution, blur, colour and vignette operations; [libjpeg-turbo](https://github.com/libjpeg-turbo/libjpeg-turbo) for the actual JPEG behaviour reference and encoding, if needed. Audit individual licences (especially GPL) and chosen snippets/revisions before direct code reuse. Do not import large RAW-processing frameworks into ROYGBIV for photo effects on vector-generated art.
7. **Webcam/video format model:** inspect UVC/V4L2 descriptions and actual H.264/MJPEG/YUV 4:2:0 subsampling concepts; separate *sample-rate loss*, chroma blur, quantization, codec ringing and sensor noise. Canvas JPEG roundtrip may differ by browser; to be deterministic either implement a documented encoder/decoder or a seeded approximating block/chroma pipeline, not an uncontrolled toDataURL roundtrip.

**Source check reminder:** Brand examples are discoverability metaphors for an aesthetic, not proof the emulation is Apple-, Canon-, Sony- or Google-calibrated. Prefer "Smartphone HDR", "RAW DSLR", "Webcam 480p", "Early Digicam" descriptive canonical preset names; optionally use search aliases like "iPhone-like", "Pixel-style", "mirrorless", "webcam".

## Model the imaging pipeline, not unrelated Photoshop filters

The existing **final-image postprocessor** planned in PHOTO-FILM-LOOKS-AND-FILTERS-PLAN receives composition/embroidery/background/lighting pixels. Broaden its *style families*:
- analogue film: colour-negative/slide/print response, film grain, halation, bloom, age/damage;
- modern digital camera: tone-mapping, edge-aware clarity/detail, colour balance, chroma/luma noise, synthetic sharpening, local contrast, lens signatures;
- low-end digital/video: resampling, chroma subsampling, matrix/gamma, quantization/block/ringing, clipped exposure, auto-balance appearance.

**One finishing look per artwork by default**, with shared Effect On/Off and overall Amount; the user may later combine a camera style and a film print effect intentionally as a simple two-stage "Capture / Finish" processing graph. Do not silently apply one look on top of another when selecting a new preset, because that makes styles unpredictable. Future optional stacking is not a prerequisite.

Proposed versioned `photoLook` normalized object for new implementations, with family `film|digital`, profile ID, expanded numeric parameters, look revision, overall intensity, deterministic seed, and per-domain groups:
- `tone`: exposure EV, contrast toe/shoulder, local detail radius/amount, shadow lift, highlight compression, optional local-adaptation guard;
- `color`: WB warmth/tint, saturation, vibrance, channel matrix, neutral-protection/hue preservation and B&W mode;
- `detail`: acutance (sharpen radius/amount), edge threshold, microcontrast, optical blur/softness;
- `signal`: luma/chroma noise, noise-reduction, posterization/quantization, chroma bandwidth, resolution emulation and block/ringing;
- `optics`: vignette, lateral chromatic aberration, glow/bloom, film halation where applicable, lens diffusion;
- `decor`: optional exposure artifacts/dust/date motif only for presets that explicitly support them.

**Naming/migration:** The earlier film document proposes `filmLook`. Before coding settle **one canonical object** (recommend `photoLook` with version and family), support `filmLook` as import alias if it was ever actually shipped, and avoid creating two parallel engines with contradictory grading stages. Neither key is currently implemented; no migration is required yet. Pinned expanded parameters ensure presets can evolve without altering favourites/history/PNG roundtrip. Avoid storing proprietary lookup tables without rights; numeric home-authored looks are sufficient.

### Processing stages and ordering

1. Source: exact final scene composition, including material and embroidery shading, object shadow and canvas Light.
2. Decode sRGB; bounded exposure and white balance. Synthetic sensor-level variations may operate in linear-light, but **never** claim the RGB bitmap represents Bayer RAW photons.
3. Global response and, where enabled, edge-aware **local** tone mapping. Avoid halos around ROYGBIV's extremely high-contrast pure black/bright stripe boundaries; use a guided/edge-aware filter or a base/detail decomposition with conservative defaults, radii defined in authored-world units and halo suppression.
4. Camera-inspired colour transform, constrained gamut, channel response and optional vibrance.
5. Signal-processing emulation: per-channel noise and denoise, sharpening/clarity/optical softness with appropriate masking, selective highlight colour integrity.
6. Video/webcam chain where applicable: resolution-limited capture -> colour subsampling (Y'CbCr conversion clearly specified) -> quantization/compression simulation -> upscale to final wallpaper. Make pixelation and subsampling relative to an intentionally chosen *capture resolution*, not to the preview viewport; export must reproduce that structure.
7. Final optional lens effects, print response/halation for film profiles, grain and vignette; controlled stage order with algorithm version.
8. Encode sRGB for preview/export. SDR PNG is baseline; don't promise HDR as JPEG/PNG file metadata hacks.

**Critical renderer note:** Existing render-worker.js workers and presentNudgedArtwork fast nudge share background+ink and applyCanvasAtmosphere; photo finishing must happen **after final composition** in *both* direct render and cache-present paths. Film and digital cannot simply be CSS filters over #preview because export/gallery/headless would differ. Camera-like sharpening needs access to final edges; no one-shot material shader can replace this.

**Preserve framing and determinism:** noise, codec blocks, pixel grid, chromatic fringes, vignette and local-tone domains anchored in exported image/authored-frame coordinates; pan/zoom changes viewer state rather than altering which pixels are "captured." Provide one explicit "camera frame" transform if a future user wants optical imperfections attached to a simulated image sensor rather than fixed wallpaper.

## Creative-direction presets (initial reference, not shipping calibrated settings)

| Preset | Expected image signature | Default omissions |
| --- | --- | --- |
| Smartphone HDR | Bright shadow detail, locally balanced contrast, warm/neutral colour, clean smooth noise | Dust, heavy lens dirt, impossible depth bokeh |
| Crisp Phone | Punchy local clarity, high colour, tight edge acutance, light lens correction feel | Aggressive chromatic aberration and blown blacks |
| DSLR Natural | Natural tonal slope, gentle shoulder, true-black preservation, subtle high-frequency detail | Phone-like aggressive HDR and local tone halos |
| DSLR Studio | High apparent resolution, studio-neutral colour, controlled contrast, very slight sharpen | Random noise, compression blocks |
| Mirrorless Night | Smooth highlights, low-light chroma suppression, lightly lifted shadows | Fictitious recoveries from clipped source data |
| Vintage CCD Digicam | Small-sensor chroma noise, clipped highlight, saturated colour, crunchy sharpening | Film halation by default |
| Webcam 480p | Soft/chroma-subsampled edges, gain drift, JPEG/H.264-like blocks, tonal crunch | RAW-like huge dynamic range |
| Video Call | Mild denoise/smearing, auto-white-balance cast, conservative compression | Invented face segmentation or bokeh on geometry |
| Security/Low-light CCTV | Monochrome/green-tinted near-IR-inspired style, banding, noisy dark signal, strong compression | Authentic infrared/physical scene claims |
| Clean Digital | Subtle grade and restrained edge refinement only | All deliberate artifacts |

Preset visual evaluations must use actual black backgrounds and seven strong rainbow colours. Define a **True Black** control and **Protect Seven Hues** control, with opt-outs for creative freedom. "Smartphone HDR" should not always alter flat art dramatically; difference from original may be subtle by design. White balance and chromatic artifacts remain visible on neutral white/gray test fields even if a rainbow-only composition hides them.

## UI/UX revision, not a new tab explosion

**Navigation proposal:** keep seven categories and five mobile destinations. The prior plan's Light > Film tool should become **Light > Photo** or **Light > Camera & Film**. Which label tests best is unresolved; preferred "Photo" for its brevity and inclusive scope. Light category still has Lighting. Search aliases route "film", "iphone", "pixel camera", "webcam", "DSLR", "digital camera", "digicam", "HDR photo", "compression", "grain" to the *one* Photo tool; do not create a Film tab plus duplicate Camera tab with separate controls. A compact in-card mode selector is **Camera / Film** followed by a swipeable preset-family selection. Optical settings can show only those relevant to that family.

**Suggested 44px touch control hierarchy:** top band On/Off + chosen profile + Amount + momentary Before; second line Camera/Film family; third swipable **Looks / Tone / Detail / Character** views. For Film the Character view holds Grain/Halation/Aging; for Digital it holds Noise/Compression/Lens. Advanced controls are accessible through the relevant view, with inactive states reading effective zero and preserving stored numbers. These are **mutually exclusive cards** within a fixed-height edit tray, not vertically scrolling multi-page panels.

**Goal-first controls and responses:**
- "Make it iPhone-like" -> Light > Photo -> Camera -> Smartphone HDR, amount ~moderate by preset.
- "More DSLR" -> Camera -> DSLR Natural; stay in same tool; changing preset is Undoable.
- "Poor webcam" -> Camera -> Webcam 480p; Detail offers low capture resolution, Character offers compression/chroma noise; fixed capture resolution is clearly labelled.
- "Try slide film" -> Film -> Slide. Changes active look, does not secretly append film behind the selected digital look.
- "Keep saturation but no noise" -> preserve Color look but set Character/Noise 0; scoped reroll respects locked attributes.
- "Show me what changed" -> accessible Before via toggle and press-and-hold; original comparison after opt-in; no dependence on continuous touch.

**Important constraints from live app:** Current Texture has Layer 1/2/3 with two mini-inspector views and Surface (40 tools total). Do not regress that; "grain" ambiguity must be explained as Texture surface grain vs Photo sensor/film noise. Colour Vision Preview is inspection-only and displays the **photo-finished** image without exporting the simulation. Save/Favourite in side tray must not collapse the active editor. Use semantic role mapping/single canonical DOM controls instead of cloning sliders to multiple tabs. Randomize-first mode should keep Camera effects disabled until user explicitly opts into photo processing, unless a separately configured "randomize photo styles" permission is introduced.

**Cognitive walkthrough / artistic criteria:** choose look based on visual outcome, not jargon; observe immediate effect; know where to adjust its most salient characteristic; remove/revert without changing original design. Explicitly test switching Camera↔Film with locked settings, Undo/Redo and preset-specific dormant fields. Do not claim user study from architecture or proxy tests.

## Specific implementation queue (append to overall Photo F0-F5)

**D0 - Research/reference atlas:** build a tiny reproducible same-image contact set for original, Smartphone HDR, DSLR, webcam and early digital from an existing unmodified headless art sample. Use docs-only reference comparisons, identify which cues survive saturated 7-colour geometry. Confirm named-source licences and actual code dependencies.

**D1 - Unified recipe contract:** before implementing F1 change from provisional `filmLook` to canonical `photoLook`, with family-aware processing and expanded presets. Normalize strict numeric bounds, source self-contained, versioned algorithms, baseline Off=exact legacy output. Add a bounded set of target camera capture resolutions and no random nondeterministic streams.

**D2 - Reusable processing primitives:** implement accurate linear/gamma conversion, stable tone curves, controlled local tone/bilateral or guided filter, edge-aware sharpness, bounded noise/denoise and chroma bandwidth. Prefer readable, reusable in-repo JS modules unless licensed snippets or small WASM demonstrate better output/cost.

**D3 - Webcam/digicam signature:** virtual capture pixel grid, downsample/upsample, Y'CbCr 4:2:0 emulation, quantization and DCT/macroblock-inspired loss, sharpening halos, WB/exposure quirks. Test capture-resolution independence from export/preview resolution and ensure crisp vector edges are degraded *intentionally and deterministically*.

**D4 - UX and presets:** unify Camera/Film family in one Light > Photo tool, with named presets, compact Looks/Tone/Detail/Character views, one Amount, Before, scope locks. Update editor-schema.js, editor-tool-search.js, src/app.js and the human-intent semantic atlas. No new top-level category.

**D5 - QA / visual adjustment:** 6 carefully selected source compositions x core Camera families; phone Chrome and one full-size export to check stability, excessive edge halos, ghost colour on black, recipe parity and performance; leave future high-fidelity device-specific tuning optional. No additional routine screenshot CI.

**Dependencies:** D1 precedes F1 if neither has begun; D2 can share F2; D3 independent of embroidery, but both share final compositor/camera anchoring established in F3; D4 shares F4. Do **not** create a second renderer or a competing set of film effect inputs. On next execution update implementation state per phase, source revision and PR, not merely tick entire proposal as complete.

## Explicit open decisions

- Canonical label: **Photo** recommended, "Camera & Film" possible but longer; defer to source-based cognitive walkthrough and actual mobile fit.
- A camera-style image derived from a rendered abstract wallpaper cannot be faithful RAW sensor reprocessing. Output artistic cues, no false device labels or EXIF camera claims.
- Per-effect optional camera stacking with film should not be a first-release UI requirement.
- Blur depth-of-field/bokeh cannot infer true 3D depth from a flat wallpaper; optionally permit an artist-drawn focus mask someday, not hallucinated geometry.
- Optical distortion/vignette/sensor grid should be tied to the *framed image*, never viewport zoom. Keep exactly preserved PNG recipe metadata and deterministic exports.
- Compression export remains PNG, even when *simulating* JPEG/Webcam artifacts internally, so image data isn't unpredictably lossy twice.

**Next action after docs merge:** execute D0 alongside film F0; use D1 as the unified prerequisite of F1. Build features only when explicitly requested; no runtime implementation in this documentation PR.
