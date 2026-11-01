# Granular materials and sand-mandala surface plan

**Status:** fine sand S1 merged in [#912](https://github.com/gamesbyian/wallgen/pull/912) (`ea434590`); inward boundary relief S2 merged in [#916](https://github.com/gamesbyian/wallgen/pull/916) (`c560c874`); optional Beaded sand filigree S3 starter merged in [#918](https://github.com/gamesbyian/wallgen/pull/918) (`01f7d78b`); advanced metric inset echo finish merged in [#924](https://github.com/gamesbyian/wallgen/pull/924) (`4a11ec1f`). Final exact-head required [quick CI #41244651155](https://github.com/gamesbyian/wallgen/actions/runs/41244651155) PASS. Advanced ornaments, physical materials and device profiling remain open in [#913](https://github.com/gamesbyian/wallgen/issues/913). **Date:** 31 October 2026.

## User intention

Make every existing ROYGBIV ribbon, stripe segment, circle, compound imported silhouette, nested contour and coloured region look as though it has been carefully assembled from fine dyed mineral sand. Preserve exact authored vector geometry, holes, islands, strokes, colour slots, over/under painting, editable state, camera framing and exported recipes. At wallpaper scale, the colour bands must still read cleanly; when enlarged, tiny coloured grains, contact shadows and glints should be visible. No mandatory iconography or religious symbolism.

The term *sand mandala* here refers to material and deposition craftsmanship, not automatic generation of traditional religious compositions.

## Existing infrastructure and decision

- `src/model.js` normalizes the three independent material identities, coverage, blend, strength, scale, rotation, locks, seeds and recipe transport.
- `src/material-surface.js` is the shared world-coordinate material painter and sampled contour height; `src/renderer.js` already applies each layer once, masking the resulting pixels against the exact existing vector ink for both ribbon and region compositions.
- `src/nested-shape-contours.js`, `src/polygon-inset.js`, `src/contour-decoration.js`, `src/path-geometry.js` and the existing embroidery treatment machinery are the owners for future curve-aware bands and contours.
- Implement grains as a new opt-in **material**, not a new region format, stripe generator, shadow compositor or separate raster bitmap saved into the recipe. Keep the original 7 colours, canvas camera and exported recipe unchanged.

## Delivered first slice: fine coloured sand

`material`, `material2` and `material3` accept `sand-mandala`; each of the three existing Material selectors exposes **Fine coloured sand · mandala**. Coverage selection is unchanged: use **Stripes only** to leave gaps and substrate pristine. Existing Scale sets grain gauge and packing pitch in the authored 600×1300 world; Strength controls the contribution to the existing material compositor. Seeds are derived from the usual immutable per-layer recipe seeds. No CSS-pixel sizing, random state per draw, image imports, externally sourced shader code or new top-level navigation.

`src/sand-material.js` addresses each grain by its world-space staggered-cell indices. A bounded, jittered close-packing approximation deposits multiple seeded, stratified matte mineral microflecks per authored-world lattice cell, with subtle shaded facets and rare small glints. Grain coordinates and radii never depend on visible crop, frame number, camera zoom, output size or draw order. A sampled low-amplitude sand height field is allowed to influence opt-in existing ribbon displacement, but suppressed enough to avoid destroying sharp vector boundaries. Masks remain exact for compound holes and separated islands.

This is a **stylized 2.5D deposition surface**, with S2 edge relief and the first S3 decorative beads already integrated. It does **not** simulate granular collisions or contact mechanics, actual mineral reflection, object-relative pigment transport, or fully authored elaborate mandala fillings. Do not label it physically accurate or claim visual acceptance without actual rendered images and device evidence.

### Why not save individual particles?

A seven-colour vector shape remains one vector scene object. The granular field is deterministic rendering detail derived from the shape's shared material, so source paths can still move, bend, resize, weave, clip and survive normal Undo/export. No per-grain SVG objects or recipe arrays are created.

### Risks, constraints and exit gates

- **Performance:** each grain uses a small number of Canvas2D paths, so judge the active material under real Pixel 6 Pro interactive randomization as well as the standard 3024×6552 export. If material previews are too slow, use stable, coordinate-derived level-of-detail or batch primitives, rather than a new tile seam or changing grain identity when cropping. A deterministic cap on per-frame work matters more than arbitrary numeric complexity quotas.
- **Layering:** verify that legacy materials are pixel-identical when this option is off; a sand layer applied to background and stripes must preserve transparent stripe gaps, proper blend/strength/rotation order, and optional three-layer combinations.
- **Coverage:** test ribbons with loops/weaves and dots/dashes; regions, overlapping scattered shapes and imported compound silhouettes with holes; high displacement, crop overlap, panning and extreme zoom.
- **Optics:** check actual screenshots at 320×700 and 412×892, full-resolution export and close zoom. Distinguish film grain (noise), printed paper grain, and physically arranged sand; ensure coloured bands do not become speckled plastic or stars.
- **Tests:** pure deterministic grain location/seed/crop/count tests, canonical normalization/transport, material height bounds, all three select options. Full browser screenshot inspection and handset judgement remain explicitly unverified until exercised.

## Phase S2 implementation: opt-in inward contour relief (PR #916)

The existing sand material now has a geometry-aware, bounded design-unit edge treatment, owned by `src/sand-contour-relief.js` and the existing foreground painting stages in `src/renderer.js`. No new recipe property, visible control, output pixels stored in source, material renderer or object-shadow model is added.

- Only an active `sand-mandala` layer covering stripes/foreground adds relief. A background-only sand layer leaves coloured object outlines alone. Strength drives subtle dark contact and pale raised-edge tones; the inherited material scale drives the physical ridge width in authored-world units.
- Ribbon fills use the genuine original open edge rails (`traceEdge`) and the existing compound `stripeFillPath` clip. They never introduce transverse fake caps at the temporary boundaries of an over/under crossing. The crossing correction replays the same effect on its selected branch.
- Coloured circles and polygon/compound regions reuse the same filled source path, with the **original even-odd clip** for holes and detached islands. The rim is drawn *inward* on the filled side of every exposed ring; exterior gaps and interior cutouts are not colour-filled by the treatment.
- Seven thin imported nested contours instead receive a narrow centreline specular accent inside the original authored stroke footprint; levels that truly collapse remain absent. The system does not attempt to project a thick inward ridge onto a two-unit line.
- Woven/ornamental negative-space motifs do not acquire false filled-ribbon rims. Other existing materials are unchanged without an active sand layer.

**Limitations:** This is controlled 2.5D rim shading, not granular material transport/physics. It does not distribute grains by tangent or local curvature, calculate physical contact normals, or spill into neighbouring fills. Opt-in bead decoration later landed in S3; elaborate rows and measured physics remain future work. Source render cost/actual phone latency and high-DPI optical quality must be measured independently. Genuine [Chromium art and PNG acceptance #41243087745](https://github.com/gamesbyian/wallgen/actions/runs/41243087745) **PASS**: normal wave ribbon, loop, imported compound hole/island, seven nested contours and production 3024×6552 PNG. The black hole was checked as exact RGBA(0,0,0,255), and the detached island was verified as coloured ink. Source PNGs were inspected: modest interior shading is visible at regular colour edges, while rim details on two-unit nested lines remain deliberately slight. Physical Pixel timing, real optical grain packing, cross-browser quality and human artwork signoff are NOT proven.

## S3 first ornament: optional beaded sand filigree (merged PR #918)

The granular engine can now expose a **separate material identity**, `sand-beaded`, with the existing fine sand treatment plus sparse raised mineral beads following original path/region contours. This is intentionally separate from `sand-mandala`: selecting ordinary fine sand never auto-adds decorative dots.

- Both sand identities reuse the **same** grain sampler, height model and three-layer surface painter; `sand-beaded` only adds the opt-in decorative pass inside the existing vector ink clips. All user-visible Scale, Strength, Coverage, Blend and Rotation controls already exist.
- Source-ring beads use the existing `contourBoundaryFrame` canonical boundary ordering and true Euclidean arc-length stations, including compound holes and detached islands. Circle perimeter stations are anchored at zero angle; fully cropped regions cannot change the phase of a surviving source ring.
- Ribbon beads use integer stations measured from `stripe.coreExtent` (the original authored path's reference), with both original edge rails sampled through the existing shared path geometry. A short crossing replay selects the original global station indices, never restarts the bead pattern at its temporary clip.
- Thin imported nested contour lines get strictly smaller beads than their original stroke thickness, never a false expanded seven-line footprint. Open/cropped inset fragments remain undecorated instead of fabricating a seam or line of bead endcaps.
- Pure tests cover round-trip normalization, three-layer native selection, seed/curve station consistency, hole/island source-ring order, narrow stroke radius and source clip integrity. `scripts/sand-contour-browser-proof.mjs` produces identical fine/beaded input artwork at 600×1300 plus separate high-resolution and worker output from the original production renderer.

**Genuine acceptance, 31 October 2026:** the final optically adjusted bead renderer passed [Chromium #41244347062](https://github.com/gamesbyian/wallgen/actions/runs/41244347062), producing matched fine/beaded 600×1300 wave, self-crossing loop, compound cutout/island, nested outlines, full 3024×6552 beaded export and worker-region PNG. True negative-space RGBA was checked; the initial beads were too faint, and the subsequent dark setting read like punched holes. The final shading was examined and changed to brighter mineral flecks that remain visibly distinct at 600×1300. This qualifies **stylized decorative contours**, not real-world mineral optics or actual Pixel performance.\n\n**Boundaries:** decorative beads are stylized 2.5D shading; pigment is not physically simulated, grains do not collide or spill, curves use stable source stations rather than physical poured-powder trajectories, and attached colour remains authored ROYGBIV ink. Selection is currently whole-surface by layer coverage, not separately per ring/object. Further ornament types, user-directed contour grammar, close-packed real mineral rendering, hardware profiling and careful human/device optics are not yet delivered.

## Advanced S3 delivered: layered sand contour filigree (merged PR #924)

A third independent, opt-in material identity, `sand-filigree`, keeps the existing matte sand pigment and inward edge relief but attempts *two fine concentric deposited lines* inside the genuine source geometry. Choosing ordinary `sand-mandala` or `sand-beaded` does not change their original appearance. The existing Scale and Strength controls determine offset distances, line gauge and shade; no extra screen-sized values or saved geometry enter the recipe.

- **Polygons and imported compound silhouettes:** `polygonInsetContours` evaluates each offset independently against the original rings and exact even-odd interior. Holes expand, islands shrink, thin necks split or disappear; nothing is centroid-scaled to manufacture an outline. Reuse the same original vector clip for the deposited strokes. High-vertex sources retain fine grain and edge relief without triggering unbounded additional offset work.
- **Circles:** true analytic circular lines at `r - inset`, only if they physically fit.
- **Ribbons:** source-station samples interpolate original physical edge rails toward their matching centreline, then the existing stripe mask clips to the authored fill. Both sides have consistent inward distances; an extreme taper suppresses only the level that will not fit. Original unnudged lattice stations are used for replay at self-crossings, so a cropped overpass must not rephase the decoration.
- **Nested, already-thin imported seven-line contours:** no second hierarchy is invented inside an already 1–2-unit stroke. Original seven metric contours remain authoritative and unmodified.
- **Modes and safety:** `sand-filigree` is opt-in in all three material layer selectors, with exactly the same source PNG/worker/editor compositor. Finite source-world offsets and bounded additional contour work are used. Physical powder optics, beaded contours and raised ridge realism are separate, already-existing effects; this extra visual treatment remains stylized.

**Real Chromium source acceptance: PASS.** [Run #41248705508](https://github.com/gamesbyian/wallgen/actions/runs/41248705508) generated and automatically tested 12 source-matched fine/beaded/filigree scenes, a 3024×6552 filigree export, worker-region artwork and separate 320×700 and 412×892 portrait images. The source-compound hole retained exact opaque black RGBA, and full RGBA-channel pixel hashes distinguish the filigree wave, loop and compound geometry from their plain fine-sand controls. The full-size and two portrait artworks were viewed; inner rings follow source contours, with no newly observed painted cutout or displaced stripe. Earlier [matched Chromium #41248334742](https://github.com/gamesbyian/wallgen/actions/runs/41248334742) also PASS, with render timing JSON: on a GitHub headless Chromium runner, the 600×1300 fine vs filigree wave measured about 349 vs 364 ms, loop 465 vs 483 ms, and compound 252 vs 297 ms. These are preliminary CI-host measurements, **not** physical Pixel latency or a mobile acceptance claim. The one-time browser workflow was retired before merge. Final exact-head [quick CI #41249088632](https://github.com/gamesbyian/wallgen/actions/runs/41249088632) PASS. Actual Pixel 6 Pro timing and user aesthetic review are still needed.

## S4 delivered: coherent material-space lighting and contact shading (merged PR #928)

Material lighting uses only the *existing canonical* `lightingMood`, `lightDirection`, `lightStrength` and `shadowStrength` controls. No new material lamp, pixel-dependent design setting, image height-map, saved per-grain geometry, GPU shader branch, or second painter is needed. The original gradient atmosphere and independently adjustable silhouette shadows remain separate, but share the same directional vocabulary.

- `src/sand-lighting.js` resolves one light vector pointing towards the selected canvas corner and three existing mood palettes (daylight, golden, moonlight). The source vector is converted into the material's independently rotated coordinate system, and into the mirrored/rotated ribbon geometry coordinate system, so changing texture rotation does not spin the apparent world light.
- Fine powder microfacets shade **towards** or **away** from that vector using already-allocated per-cell deterministic grain locations and just 16 precomputed shade swatches per layer. No extra particle paths or particle count. With Lighting mood off (or both light and shadow strength zero), the prior unlit artwork remains unchanged.
- Contour beads receive small opposing contact shadows and coloured highlights, with their centres sourced from existing ring and rail stations; compound holes and crossing replays keep the original masks and station identity.
- Real vector-rim/contact relief and two true metric filigree echo lines receive sided shade/glint passes oriented by the same world light. They remain clipped to original source ink; narrow nested strokes keep their authored width, with no new extra outline hierarchy.
- The current pass is **illustrative 2.5D directional light**, not ray-traced self-occlusion or actual intergrain collision physics. Without measured contact geometry there is no physically honest long cast-shadow solution. Avoid describing this as photorealistic granular optics.

**Verified Chromium evidence:** [run #41250353579](https://github.com/gamesbyian/wallgen/actions/runs/41250353579) **PASS** for pure directional math, old unlit grain marking parity, source-matched 600×1300 daylight NW and SE comparisons of fine sand, raised beads and metric echoes, a golden lit compound ring including its source hole, native 3024×6552 beaded artwork, and 412×892 worker-region output. The actual PNGs were inspected at full portrait and zoomed crop: light direction modifies microfaceting and relief without deforming vectors or filling the hole. Timings from the CI-hosted Chromium run for wave materials were ~205–228 ms, overlapping the unlit ~229–243 ms samples, with ordinary measurement noise; this is **not** a physical Pixel 6 Pro benchmark. The essential preview cache refinement is implemented through `src/render-art-key.js`: unlike ordinary whole-canvas lighting, changes to the lighting controls with any active sand layer MUST invalidate and repaint source ink. This keeps preview and worker export consistent without penalizing the fast no-sand compositor path. A dedicated unit suite enforces all three material-layer cases. Final exact-head [quick CI #41250576416](https://github.com/gamesbyian/wallgen/actions/runs/41250576416) PASS after preserving concurrent main. The one-time Chromium workflow was deleted before merge. No real Android thermal/battery or direct touch testing is claimed.

## S4.1 normal-oriented microscopic facets and round bead caps (PR #935)

The first lighting pass used alternating dark/light flecks and a pair of offset
circles for each bead. That was computationally cheap but did not couple actual
microfacet orientation to light: an individual fleck could not change its
illumination according to its own stable orientation. This refinement shares
one analytic hemispherical normal-response kernel across both painters.

- **Fine sand:** each original seeded subgrain keeps its exact x/y/diameter,
  original six paint operations per lattice cell, original crop phase and source
  mask. Two additional hash salts choose a persistent, bounded local cap normal.
  A clamped normal-dot-direction response selects from 16 prebuilt mood-coloured
  diffuse swatches. The incoming light rotates into material coordinates exactly
  as before. When mood is disabled, the original even/odd highlights remain
  byte-for-byte identical; no migration or new material control is introduced.
- **Beads:** the true original source ring/rail station still decides the centre
  and maximum physical radius. A single radial-gradient cap adds a light-facing
  diffuse dome and opposite-facing perimeter shading inside that radius. A
  short bounded oval below the cap darkens contact on the side opposite the
  shared lamp; source geometry, hole clips and narrow-line width remain the
  final boundaries. Tiny subunit caps retain a cheaper highlight fallback.
- **Shadow limits:** no height collisions, ray visibility, true intergrain
  occlusion, cast shadows across separated objects or automatically inferred
  3D structure is claimed. The lamp elevation is fixed inside the optical
  approximation, with no new speculative light-elevation setting.

**Real optical comparison:** [Chromium #41254128826](https://github.com/gamesbyian/wallgen/actions/runs/41254128826)
PASS. It rendered source-matched unlit/NW/SE powder/bead/filigree artworks,
an imported compound ring with original cutout and detached island, and
checked real RGBA lighting differences. Against archived pre-change rendered
evidence [#41250353579](https://github.com/gamesbyian/wallgen/actions/runs/41250353579),
all 12 unlit PNG files were byte-identical. Lit 600×1300 bead NW imagery had
262,329 changed RGB pixels (mean absolute RGB change ~1.60 units), confirming
a deliberately subtle change rather than a replaced silhouette. The lit bead
wave rendered in ~200 ms on the new CI-host Chromium sample versus ~205 ms in
the old archived sample; these are noisy single samples, **not** a speedup claim.
The one-shot workflow is removed from the proposed merge, and an exact-head
quick-suite run is required after the final cleanup before integration. A direct Pixel 6 Pro performance
profile and human acceptance are still unavailable.

## S4.2 bounded lighting for seven nested vector outlines (PR #936)

The six-stripe/sand layer lighting introduced in S4 still left a
geometry-specific inconsistency: imported seven-line metric contours painted
a fixed white centreline, even under golden/moonlight moods and reversed light.
A thin contour cannot host the large contact ridge used for filled ribbons,
and translating a colour stroke itself would violate the exact source width.

The original metric contour is copied to a temporary Path2D *only when
lighting is active*, leaving its canonical source and original coloured
stroke untouched. A lamp-facing narrow mood-tinted highlight and a
counter-facing contact shade are then stroked at a strictly bounded shift.
For any source width `W>0`, both accent strands have
`w=min(.24W,.75)` and `offset=.34(W-w)`, so
`offset+w/2 <= W/2` for all positive W. Given round caps and joins,
the entire shifted accent is a geometric subset of the original source
stroke, including tips and high curvature. No outside pigment or apparent
widening may occupy intentional gaps between nested outlines. All dimensions
are authored-world geometry, not device CSS pixels. The old unlit centreline
paint path is left byte-for-byte intact.

**Acceptance for PR #936:** pure source-width/lighting-direction/palette
tests, original source-art browser proof extended to golden NW and SE nested
contours, and final required quick CI after removing the temporary proof
workflow. [Chromium run #41254599500](https://github.com/gamesbyian/wallgen/actions/runs/41254599500)
**PASS** for real Chromium, adding original-source golden NW/SE
nested PNGs and checking full RGBA directional change, while retaining exact
negative space and original source rings. All twelve archived unlit PNGs were
byte-identical to the previous accepted [S4.1 proof #41254128826](https://github.com/gamesbyian/wallgen/actions/runs/41254128826).
One-shot browser workflow retired before merge; final exact-head quick CI
is mandatory. Real Pixel 6 Pro optical and thermal performance remains unverified.

## S4.3 · shared bead/rim height projection (1 November 2026, PR #955)

A source-truth audit found an actual lighting contradiction: the deposited **contour rim** cast its dark contact accent *towards* incoming directional light, whereas bead caps and the narrow metric-stroke accent already shaded the opposite, physically consistent side. Rims and beads also each invented independent contact offsets unrelated to their implied height.

The opt-in lighting pass now derives both profiles from the existing authored-world sand gauge and Material Strength. A **shared fixed lamp elevation** (the original cap-diffuse elevation, 0.68) projects bounded inferred deposit heights into a screen-space contact offset. The rim's dark shadow is shifted *away from* the lamp and its highlight towards it, while the bead cap's existing centre/radius and phase remain immutable; its directional shadow and diffuse lobe respond to the same derived height/slope. The painter still owns everything inside existing true vector clips. No source recipe field, persisted particle topology, additional shadow pass, global light control, or extra renderer was added. This is an illustrative local 2.5D deposition profile, not ray-traced inter-object occlusion or actual mineral physics.

**Independent browser source comparison:** [Chromium run #41272740333](https://github.com/gamesbyian/wallgen/actions/runs/41272740333) completed **PASS** with actual `drawWallpaper` PNG files from the exact accepted main baseline `733b99f9658e50e631558044ab2aa5c108636681` and the proposed branch, both rendered under the *same installed Chromium*. Twelve unlit source paintings, spanning wave, loop, compound holes/islands, and nested silhouettes with all three sand finishes, were **byte-for-byte identical**. Seven illuminated source PNGs changed as intended (grain wave NW/SE, beads NW/SE, filigree NW/SE, golden compound). The two lit nested-line examples remained byte-identical and are explicitly outside the newly changed contact-rim effect; the independent metric-stroke lighting path stays separately qualified by S4.2. The source script itself checks original compound negative-space and true islands and verifies each generated PNG is actual 600×1300 art. The source-matched artifact accompanies the run and is temporary evidence, not the application release.

The browser proof used GitHub-hosted Linux Chromium, **not** the owner's Pixel 6 Pro, a performance/thermal test, a seven-width optical aesthetic signoff, or proof of true cast shadows across material holes and crossings. Remove its disposable pull-request workflow after proof and require a clean exact-head quick check before merging. The follow-up S4 topology/occlusion and device measurements below remain genuine open work.

## Multi-layer geometry reuse: measured same-run source-art parity (1 November 2026)

The ephemeral geometry optimizations [#956](https://github.com/gamesbyian/wallgen/pull/956) and [#957](https://github.com/gamesbyian/wallgen/pull/957) remove repeated original-source Euclidean inset solving for same-gauge filigree layers and repeated original perimeter framing for independent beaded layers. No new approximation or cache across artworks was introduced.

[Paired real Chromium #41274101988](https://github.com/gamesbyian/wallgen/actions/runs/41274101988) compared accepted S4.3 baseline `f64720cec0a5cb4fcafc17950903a0cb40dc696a` against the optimized source `ecb69b28dac7e6c208f9def50841960cd006bdc6` on **the same Linux runner and browser**. The reusable `scripts/sand-multilayer-performance.mjs` creates five genuine 600×1300 imported compound-ring scenes (original hole and detached island), with three same-gauge beads, three same-gauge filigree, three differently gauged filigree and two one-layer controls. Source-generated PNG SHA-256 was identical for **all five** cases; this is real rendered artwork, not source-only proxy parity.

| Scene | Geometry stage before→after (ms, median) | Whole render before→after (ms, median) |
| --- | ---: | ---: |
| Three beaded layers | 1.10 → 1.00 | 451.9 → 444.5 |
| Three filigree layers, **same gauge** | **44.64 → 17.86** | **513.5 → 481.8** |
| Three filigree layers, different gauges | 56.22 → 51.76 | 465.1 → 482.8 |
| One beaded layer | 0.38 → 0.40 | 154.8 → 147.5 |
| One filigree layer | 15.58 → 16.60 | 162.9 → 164.2 |

The intended repeated-same-inset case spent about **60% less time in geometry** and **6% less in its whole painting pass** in this paired sample, with zero pixel changes. Other scenarios exhibit noise and in one case a slightly slower whole render, so no general 6% acceleration claim is warranted. The timing samples are within one headless Chromium/GitHub runner (three whole-art, six isolated geometry measurements per case), **not** longitudinal statistics, a randomization user-action benchmark, or Pixel battery/thermal data. The temporary comparison Actions workflow is retired; the reusable script and actual-pixel acceptance contract remain in source. Later #959 source-station reuse is not included in this particular A/B, which compared only the first two geometry optimizations.

## Ribbon source-station reuse: measured pixel-identical Chromium (1 November 2026)

[PR #959](https://github.com/gamesbyian/wallgen/pull/959) shares each exact original ribbon station's width, centre and two side-edge geometry evaluations across all optional filigree material styles and inset depths **within one paint**. Original station identity, no-LOD crop/crossing replay, Path2D outlines, shading and source clip ownership stay unchanged; no cache survives a source change.

[Source-paired Chromium #41274414002](https://github.com/gamesbyian/wallgen/actions/runs/41274414002) **PASS**: fixed canonical wave and multi-loop designs with three independently configured filigree layers and corresponding one-layer controls, rendered at the real 600×1300 production painter size before (`25e0024986b66a1e54088ea4f20dc1fbc8f59729`) and after station reuse, using the **same Linux Chromium installation**. All **four final PNGs were byte-identical**, and the number of painted decorative paths was identical. The reusable `scripts/sand-ribbon-performance.mjs` measures complete `drawWallpaper` and separately invokes the actual filigree painter with production `samplePath`, `widthAt` and `ribbonEdge` callbacks.

| Scene | Isolated ribbon geometry before → after (ms, median) | Whole art before → after (ms, median) |
| --- | ---: | ---: |
| Three-layer wave | **11.10 → 4.63** | 852.3 → 827.1 |
| Three-layer multi-loop | **5.63 → 1.78** | 1203.6 → 1187.5 |
| One-layer wave | 3.90 → 1.78 | 358.4 → 339.2 |
| One-layer multi-loop | 2.10 → 1.23 | 573.7 → 557.5 |

The isolated geometry portion was **1.7–3.2× faster** across these cases and whole-art render differences were smaller (~1–5%) on the single runner. This is evidence for the **specific source-station reuse** rather than a claim of universal Random button speed or Pixel 6 Pro thermal/preview latency. No new visually substituted pixels, geometry dialect, renderer or recipe fields are introduced. Temporary Actions proof retired after evidence; baseline script is permanent.

## Next S4 research: occlusion from actual source topology, not decorative offsets

**Target result:** sand piles and beads should carry their own believable height, changing the cast-shadow length and illuminated-face width consistently as the global light moves. The merged S4 directional marks establish shared reference frames but do not yet establish measured height, ray visibility or pile contact.

1. **Canonical derived height profiles.** Express tiny mineral grains as bounded spherical/irregular caps, bead rows as smooth raised caps, and metric filigree lines as a cross-section around their true authored vector centreline. Heights are functions of existing material identity, Scale and Strength in logical units, never persisted per-pixel/per-grain geometry. Reuse the original ring/station sampling so crop, camera, mirrored transforms and worker/export agree. For complex compound holes and collapsing contours, the same original signed-distance ownership decides whether a height sample exists.
2. **Normal-based diffuse and directional highlights.** Evaluate a local surface normal from a cap profile or analytic height-field derivative, then a bounded `max(0, dot(n, light))` lobe with a separate low ambient floor. Existing Lighting Direction/Strength/Mood remains the single light source; existing Shadow Strength governs contact and occlusion. Respect material character: fine powder primarily diffuse, faceted minerals get sporadic directional glints, rounded beads display broader highlights. An editable light elevation is premature until two source-matched artworks show an actual use case.
3. **Correct overlap and occlusion.** Shadows depend on the raised element's *height above the supporting layer* and light direction/elevation. Start with short, bounded penumbras at bead/pile bases. Source ring holes are empty authored ink: never paint pigment inside merely to approximate shade. Real raised rims may eventually cast **shadow** into the substrate/hole, but that requires a separate explicitly composited shadow-underlay pass with a contract and tests, not changing the hole's fill mask. At ribbon crossings, the later on-top branch alone may occlude the underlying branch. Do not render twice, give hidden geometry a shadow, or let a clipped branch reset phase.
4. **Measured quality/performance gates.** Run source-matched Lighting Off, NW/SE and opposite-direction comparisons for ribbon, loop, seven-line metric contour, hole and detached island. Show separate **material-only** comparisons with the same atmospheric gradient so whole-canvas light cannot masquerade as an improved material normal. Test crop/pan/export invariance, native 320×700/412×892, 3024×6552, worker and deterministic seeds; compare visible normal/occlusion detail at phone and crop scale. Profile actual Pixel 6 Pro PWA latency/thermal before promising a real-time height-mapped engine. A prior local Chromium experiment batching hundreds of thousands of flecks into shade-grouped Path2D paths took 12–17 times longer than direct fillRects and changed overlapping alpha pixels, so do not adopt batching without new evidence.

**Implementation boundary:** reuse `src/sand-lighting.js`, original Euclidean/topology engines, existing material compositor and conditional ink cache key. Prefer pure analytic local shading plus a bounded original-shape underlay over dense GPU/CPU ray marching. Do not add another material schema or navigation tier to solve a problem that has not yet been demonstrated optically.

## Next phases (advanced S3 / S4 remain planned)

**Further Phase S3: decorative deposition.** Controlled contour echoes, concentric fillings, patterned rows and optional bounded controlled spill. Beaded outlines are now an opt-in first slice, pending exact optical acceptance. Parameterize width/gap/phase in authored-world units and reuse the accepted nesting/topology engine. Allow one material treatment per semantic object or palette target without writing redundant geometry per grain.

**Phase S4: artistic presets and profiling.** Fine powder, medium mineral sand, coarse crystalline sand and raised filigree as styles/controls of one engine. Tune actual art and phone performance before exposing additional sliders. For agent-driven design, expose normal canonical material values through the existing recipe schema rather than a second tool API. Only introduce shader acceleration after measured Canvas2D costs.

## Reuse and licence

The first slice contains new original code, borrowing only general public algorithms (integer hashing, staggered jitter and Canvas2D shading). No third-party implementation was copied. Existing ROYGBIV world-space material architecture is reused; external sand and point-sampling projects remain research references, subject to future licence review before adopting code.

## Acceptance ledger (as implemented)

- [x] Optional `sand-mandala` identity in three existing layer selectors and canonical recipe / lock / seed logic
- [x] Shaded granular detail draws through the existing preview, worker and native headless renderer call graph
- [x] Pure crop-stable, seed-stable sampled particle field with bounded logical pitch
- [x] Regression tests added to mandatory quick-test command
- [x] GitHub quick CI PASS on material implementation: [#41238544285](https://github.com/gamesbyian/wallgen/actions/runs/41238544285)
- [x] Actual Chromium PNG smoke PASS with source PNGs inspected at preview, full-res detail and region-worker sizes: [#41238544266](https://github.com/gamesbyian/wallgen/actions/runs/41238544266). The opaque glossy bead/polka-dot look was found and replaced by finer matte microflecks; optical acceptance is for this limited texture character only, not genuine physical sand realism.
- [ ] Physical Pixel 6 Pro randomization latency, visual fidelity and accessibility verification
- [x] Basic inward, vector-clipped contour shading S2 verified in production Chromium [#41243087745](https://github.com/gamesbyian/wallgen/actions/runs/41243087745)
- [ ] More physical sand deposition and true ornamental contour rows (S3)

### Genuine Chromium acceptance note, 31 October 2026

Production `render-headless.mjs` generated 600×1300 sand and plain controls, 3024×6552 full-resolution sand art, and a 600×1300 sand regional artwork via the actual worker backend. Automated PNG dimensions, embedded canonical recipe, and genuine changed pixels passed. Visual examination of the artifacts found an overly regular glossy-bead pattern in the early iteration; the final iteration replaces those visible bead circles with stratified microflecks. The full-sized crop reads more like speckled mineral/pigment than plastic beads; this S1 screenshot predates S2 inward relief and the later beaded finish. **No device performance, raised-edge realism, exact native phone, or complex source-hole acceptance is claimed.**
