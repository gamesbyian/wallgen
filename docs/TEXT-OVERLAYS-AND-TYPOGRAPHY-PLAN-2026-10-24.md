# Text overlays and typography: product specification and implementation queue
**Decision:** Owner-requested 24 October 2026. [Issue #653](https://github.com/gamesbyian/wallgen/issues/653). New, distinct creative feature: previous 23 October claims of completed editor/renderer work remain valid for their previous scope.

## Creator outcome
Place and edit one or more phrases directly on a finished ROYGBIV wallpaper without switching apps. Type once, change appearance rapidly, export with correct fonts and outlines. Written words are always protected against ordinary randomization. No eighth top-level category: **Details → Text** owns the object list and controls.

## Committed semantics
- Typography is authored first-class **canonical recipe data** (bounded `textOverlays` array), normalized by `src/model.js`, previewed by `src/renderer.js`, exported through the existing worker/headless/reference paths and encoded by the existing PNG metadata/JSON/share machinery. No DOM-only paint on top of a preview, no separate art model.
- Initial stack order: each text object above completed composited rainbow, material, lighting and Photo; no ambiguity with stripe shadow, camera nudge cache or metadata. The text position uses percentages of the **final wallpaper frame**; type size uses 600×1300 canonical design units. Rotation occurs about each text anchor. Nudge moves the rainbow beneath anchored lettering. The existing view camera reframes base artwork, not the lettering. This is intentional and should be exposed to users.
- Styles: black/white fill, sequential ROYGBIV colour per grapheme or per word (spaces don't increment the colour), and continuous horizontal seven-stop rainbow gradient. Use the active canonical palette/stripe hue ordering; reversal is reflected. All colour modes permit none/black/white exterior stroke with adjustable thickness. Wrap text only at authored line breaks; shrink overlong lines conservatively to fit the frame; cap objects, lines and code points.
- Editing operations use existing `changeRecipe`/Undo path; restore via saved recipes, PNG metadata and clipboard. Removal is explicit. Accessible HTML textarea/select/range controls inside a seven-category card; no forced IME dismissal, no live focus jump per keystroke.
- Preset typefaces must be robust to worker rendering and export. First foundation uses common system fallbacks, with honest device variability. Named new/bundled licensed fonts need visual proof of actual final glyph availability rather than CSS family strings alone.
- Randomize never changes `text` content. Scoped typography randomization may change visual style, position, outline and transforms of **unlocked** text objects; per-object lock protects that object. Global randomize must preserve all authored text objects by default, including their style until an explicit text reroll is chosen.
- Typography must remain opt-in, default recipes show no text. No text is uploaded. Existing voluntary creative telemetry policy remains unchanged.

## Technical build & acceptance stages

### T1: Foundational editable overlays (current PR scope)
- [x] `src/text-overlays.js`: bounded schema, safe textual normalization, deterministic IDs, fixed preset font registry.
- [x] `src/text-overlay-renderer.js`: shared drawing used after Photo in direct/worker and re-applied once in cached nudge composer.
- [x] New Text tool in Details, add/select/edit/remove with ordinary history and control synchronization.
- [x] Text retained through control-based edits and global randomization; styles include black/white, rainbow letter/word/gradient, black/white strokes, size, rotation, x/y, opacity, visibility.
- [x] Focused Node tests authored and appended to lean quick gate.
- [ ] Confirm CI green, test actual browser art and mobile control reach (not inferred from code).
- [ ] Compare direct and worker PNG bytes for text with palette reversal, Photo enabled, full-resolution camera nudge, multiline Unicode and complicated background; inspect actual output.
- [ ] Fix and measure any correctness, memory, mobile/IME/keyboard, focus or export gaps.
- [ ] Update `#653` with evidence and merge when checks pass; don't mark external Pixel acceptance without handset evidence.

### T2: Real font library and user TTF/OTF (required for owner feature completion)
- [ ] Curate 25–40 visually differentiated, OFL or equivalently redistribution-cleared typefaces with compact categories (poster, playful, editorial, futuristic, script, retro, geometry, stencil, etc.). Check actual files, licence notices and font coverage, not merely names. Optimize subset/variable WOFF2 for built-ins as permitted.
- [ ] TTF/OTF import picker; reject oversized/malformed/unsupported files with useful explanation, no network upload; validate file signatures and types before `FontFace` loading. Consider privacy/safety and malformed font handling. Store validated local bytes under IndexedDB with local font IDs (not an arbitrary remote URL).
- [ ] Font resolver loads matching data in **both** DOM and worker before a final paint, including the short-lived export worker. Preserve exact font face for thumbnails, gallery and headless when the file is supplied. If unavailable, show a conspicuous missing-font state, never silently claim pixel-identical replay. No unconditional font upload or multi-megabyte PNG metadata inflation.
- [ ] Import/export font manifest with checksums and user-supplied licensed files as an explicit optional portable package. A PNG recipe may contain a font ID plus checksum, never force-pack private TTF/OTF bytes. Clarify that rights remain with the file's owner.
- [ ] Test multiple font files (TTF/OTF, variable fonts, missing/invalid), Android font support, persistence/restart and deterministic full-size worker/fallback parity.

### T3: Expressive typography (subsequent)
- [ ] Text drag handles, touch-safe pick/rotate/scale gestures, direct text editing without interfering with striped-object canvas drag; Undo a whole gesture once.
- [ ] Text-on-path anchored to canonical curves, circular/wave/hairpin placement; optional weaving/over-under with stripes and per-object stacking.
- [ ] Character spacing, line spacing, alignment, dual outlines, shadows, custom rainbow offsets/reverse/reset-per-line, outline-only knockout, independent text-only shuffle in a compact interaction.
- [ ] Glyph shaping and accessibility tests for combining marks, emoji, RTL, ligatures and non-Latin fonts, with honest graceful degradation when unsupported.

## Evidence boundary and ownership
This feature does **not** reopen delivered #365/#444/#542 or #445/#514 work. Agent 1 retains #557 reconstruction; renderer work must avoid touching its reconstruction mathematics. Agent 2 owns currently demonstrated material/renderer defects. This typography branch owns its new schema/compositing/UI and must rebase/reconcile with any concurrent main commits before merge. No new always-on screenshot factory: first run `npm run check:quick`, then one bounded current-source real-PNG comparison when needed. Native Pixel/TalkBack and actual creator acceptance remain separate external gates.
