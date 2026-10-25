# R0 source-component walking: allocation-free neighbour checks

**Issue:** [#557](https://github.com/gamesbyian/wallgen/issues/557) • **PR:** [#720](https://github.com/gamesbyian/wallgen/pull/720). This is a narrow improvement to the existing source hue / silhouette connected-component traversal, not a new vision subsystem or production classifier.

## Source-backed hot path

Before #720 the single shared `components()` in `src/image-path.js` allocated a JavaScript four-element array for every visited foreground pixel:

```js
for (const n of [x>0?p-1:-1, x<w-1?p+1:-1, y>0?p-w:-1, y<h-1?p+w:-1])
  if (n>=0&&mask[n]&&!seen[n]) { seen[n]=1; stack.push(n); }
```

The change checks the same four neighbours **in the same left/right/up/down order**, using explicit pixel index bounds. It never creates the temporary array. The same binary masks, flood-fill stack, member visitation sequence, canonical top-N 8/17 retention and downstream geometry are used. The full image importer still enforces existing size/candidate budget limits. The old and new walk were independently implemented in a local test harness before applying the patch.

## Independently verified real-image-derived numerical parity

From the [actual current production-renderer 22-case R0 source archive](https://github.com/gamesbyian/wallgen/actions/runs/40228539978), the 22 **metadata-free** 480×1040 PNGs were decoded and reduced to 277×600 using Pillow bicubic, then converted to masks with the canonical HUES and matching hue/contrast constraints. These are genuine source artworks, but **Pillow resampling is a proxy for the actual Chromium canvas downsample**. There were **154 masks**, **1,539,337 foreground pixels** and **303 retained significant connected components** (using the same 16-plus-overflow cap as source-visible analysis). The independently coded old and new walkers returned **exactly identical arrays of all visited member indices in stack order, every component bound/area and every top-N selection, on all 154 masks**. Synthetic quick regression also covers diagonal-touch 4-connectivity, border contact and unchanged source bytes.

## Local Node V8 stage-only speed comparison

The same source-derived masks for four difficult renderer-authored cases were processed using the old versus new walker. Every case: 5 warm-up interleavings and 45 alternating-order paired timed iterations, one invocation on all 7 hue masks; each iteration records only the component walking stage.

| Source | Old median, ms | No-array median, ms | Approx. relative reduction |
| --- | ---: | ---: | ---: |
| Hairpin #05 | 3.65 | 3.13 | 14.2% |
| Loop #06 | 4.13 | 3.53 | 14.5% |
| Displaced Jagged #16 | 3.95 | 3.50 | 11.4% |
| Jewel #19 | 3.73 | 3.28 | 12.1% |

These values are **informal local Node process observations**. No performance guarantee, production browser/import latency, Pixel 6 Pro heap/GC/battery, actual rendering speed or total six+ten ranking throughput follows from them. This optimization never changes the number of painted candidates or image pixels. Full source/fit numerical parity is guaranteed by identical masks and traversal output in the proxy harness, not a new executed 22-case Chromium visual comparison. Retain existing [all-147 exact output artifact parity](RECONSTRUCTION-BOUNDED-COMPONENT-ACCEPTANCE-2026-10-25.md) for the prior #717 component-retention change, without misattributing that earlier experiment to #720.

## Scope

No new dependency, classifier, creative control, renderer, scene dialect, worker export, source byte mutation, provenance, lock or Undo path. Keep #557 open for source-backed Loop/Hairpin contour and actual external pigmented graphics, native Pixel acceptance and any consequential mixed occlusion weaknesses. Draft #719 separately tests contour simplification variants and must not be conflated with these CPU observations.
