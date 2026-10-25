# Source-backed opposite-edge cropped Jagged reconstruction (24 October 2026)

**Scope:** Agent 1 reconstruction [#557](https://github.com/gamesbyian/wallgen/issues/557). This is an explicitly scoped extension to merged [#679](https://github.com/gamesbyian/wallgen/pull/679) cropped hue-stamp recognition and merged [#682](https://github.com/gamesbyian/wallgen/pull/682) false-positive rejection.

## Actual current-renderer source

The **existing canonical Jagged R0 #16 truth sidecar** was used only by a separate forward-render source producer. An opt-in current recipe flip, `mirrorHorizontal:true,positionX:-18`, renders a genuine 480×1040, seven-hue wallpaper. Inversion sees **only those produced source pixels**, and no truth recipe. This is an additional current-generator-authored optical control, not licensed external art, a historical seed restoration or user creative approval.

The mirror creates four full-width coherent upper pigments and three progressively *right-side-clipped* lower pigments (visible colour bounds end at roughly 62%, 42%, 18% when mirrored farther left, and at ~74%, 54%, 31% for the evaluated `positionX:-18`). Current main's earlier recognition only supported the opposite clipping edge and therefore refused seven editable stamps even though the same canonical imported-stamp composition represents an approximation.

## Bounded symmetric inverse

Existing `repeatedHueStampShape` now accepts either of two **mutually exclusive same-edge crop progressions**, with four fully exposed congruent pigments, three progressively smaller same-edge-limited tails, minimum visible pigment area and the same strict source-only checks. Both directions must satisfy:

- First four translated hue-mask Jaccard ≥.82;
- all seven real pigment axes and thickness measured coherently by the shared importer, not guessed from crop rectangles;
- all three observed tail-column centreline rhythms consistent with the intact template after X/Y translation over at least 80% of visible columns;
- no missing hue, contradictory mixed contours, unobserved pigment or fake painter order.

The scene remains **seven ordinary editable portable imported-shape stamps**, with canonical object moves, locks, Undo, provenance, one ≤6 coarse real-render candidate set, and at most ten refinement paints. There is no new shader, mask dialect, scene type, fallback seed or extra output render. Heterogeneous objects and arbitrary occlusion remain outside this detector.

## Local current-renderer source vs fitted image

On the genuine mirrored source with `positionX:-18`, the current-raster baseline and proposed symmetric detector were both run against the same source bytes through the **existing JavaScript `drawWallpaper`** via Skia Canvas2D. The baseline selected procedural Jagged (error **.173594712324**); the symmetric candidate selected editable `shape-repeats` (**.058828242836**), a **66.11% lower** 96×208 pixel fit score. The full **480×1040 genuine source, previous fitted output, and new fitted output were opened and directly compared**. The new output restores the independent black channels and short blue/indigo/violet endpoints that the old fit overextends. Edge pixel texture and fine bends remain approximate, and source seed/history remain unknown.

Other mirror displacements (`positionX:-36,0,+18,+36`) remain **unsupported** by this specific four-full + three-tail geometry gate; the product must not hallucinate copied contours in those inputs. Their previous correct conservative fallback remains.

The authentic R0 #16 non-mirrored source continues to fit at **.058721503425** after merged #679 and #682; the synthetic mirrored normal source with seven meaningful pigments is recognized, whereas mirrored tails with a different high-frequency contour are refused. Deterministic tests cover the symmetric crop gate, exact normal recipe JSON transport, seven canonical objects and refusal of fake repeated appearance. These are local production-painter and synthetic Node tests, **not** physical Pixel, Android IME/TalkBack, external human-art or final owner acceptance. Normal quick CI is reported separately in the PR.

## Remaining

Issue #557 stays open for genuine pigment topology under arbitrary occlusion, source-invisible geometry, noncontiguous semantic colour slots, Hairpin narrow black channels, Loop crossings and Photo/material ambiguity. Do not broaden mirror recognition without an authentic producer source and independent image review.
