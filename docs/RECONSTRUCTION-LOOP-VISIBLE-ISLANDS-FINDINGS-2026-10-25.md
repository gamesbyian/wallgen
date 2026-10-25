# #557: visible Loop connected-piece recovery above the old eight-island cap

**PR:** [#711](https://github.com/gamesbyian/wallgen/pull/711) • **Real source+current-painter 22-R0 run:** [#40220797778](https://github.com/gamesbyian/wallgen/actions/runs/40220797778) • **Artifact:** `genuine-r0-source-visible-hue-recipes` ID `12608769431`.

## Real source observation and failure mechanism

The existing source importer `components(mask,w,h,minArea)` deliberately retained only the largest **eight** connected islands per hue, appropriate for the established general-purpose path/shape pickers. Source-visible independent-pigment reconstruction (merged #710), however, inherits this truncation when the same hue forms multiple disconnected pigment fragments around loops and crossings.

Independent pixel analysis of the **real metadata-free current-renderer Loop #06 source** at the ~277×600 importer analysis resolution showed at least **13 red, 11 orange and 9 yellow** source components above the ordinary small-component area floor, with green 7, blue 5, indigo 3, violet 1. The old source→canonical compound recipe silently dropped several small but *genuine visible* regions for the first three hues; the source was not truly represented in those areas. These islands are image-observed regions only, **not** proof of separate authored stroke objects or invisible layer order.

## Small and bounded implementation

- Change `components` to accept an optional maximum-result count, **defaulting to the historical eight** for every other importer, fitting or shape tool.
- Only `extractVisibleHueCompound` requests a maximum of **17** for *one overflow sentinel*: accept at most **16 visible meaningful components**, or decline entirely when a seventeenth substantial island exists. The existing per-hue 1200-point and 192KiB total canonical snapshot caps and `normalizeCompoundRegion` self-crossing/hole validator remain authoritative.
- Existing hue segmentation, colour classification, mobile editor, renderer, worker/export, provenance, source/crop uncertainty, source bytes, locks, Undo and six+ten painter budget remain exactly unchanged.
- Focused tests exercise **16** independent significant islands surviving as 16 validated portable compound components, and **17** refusing instead of quietly erasing one.

## Actual R0 source/fit evidence

[GHA genuine all-22 R0 result #40220797778](https://github.com/gamesbyian/wallgen/actions/runs/40220797778) **passed ten targeted Node tests**, normal quick CI and all 22 real source/canonical painter checks. All cases except #06 preserved their selected kind and exact best errors. The new Loop entry recovered real disconnected components:

| Hue | Previously visible components retained | Newly retained meaningful observed components |
| --- | ---: | ---: |
| Red | 8 (truncated) | **13** |
| Orange | 8 (truncated) | **11** |
| Yellow | 8 (truncated) | **9** |
| Green | 7 | 7 |
| Blue | 5 | 5 |
| Indigo | 3 | 3 |
| Violet | 1 | 1 |

**Loop #06** true painter RGB+brightness error improved from **.037835831448 → .037259517188**, an additional **1.52% reduction**. Its earlier pre-source-shapes procedural error was .049773166478. No extra normal painter calls.

Downloaded new and old GHA artifact ZIPs, extracted their actual source/previous/new Loop PNGs and opened a matched-scale three-panel image to inspect the result directly. The extra source-backed fragments recover small isolated colour details at ring intersections, with **no visible new spurious large pigment islands, missing interior holes or unexpected shape displacement**. Remaining tiny cuts and source/fit palette differences still exist; these are present observational limitations, not a claim to have reconstructed original Loop winding parameters.

The full 3024×6552 output for source-inferred Loop remained possible and its embedded recipe survived normal renderer receipt transport. Physical Android/Pixel image-editing, thermals, TalkBack and human creative acceptance were not tested.

## Disposition

Keep the **16-plus-overflow** cap only for appearance-first visible source geometry; never silently promote an incomplete per-hue geometry. Maintain the default eight for all historical helper consumers, retain a separate manual-only Chromium evidence workflow, and leave #557 open for local source-visible colour grouping, truly mixed opaque occlusion, compact procedural curve identification, and independently confirmed phone/user acceptance.

[Broader 22-R0 canonical shape findings](RECONSTRUCTION-HUE-VISIBLE-SOURCE-R0-FINDINGS-2026-10-25.md) • [Authoritative queue](CURRENT-WORK-QUEUE-2026-10-24.md)
