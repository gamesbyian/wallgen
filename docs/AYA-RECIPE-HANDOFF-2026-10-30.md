# AYA structured recipe handoff in ROYGBIV

**Implementation status (30 October 2026):** initial browser/PWA integration implemented on branch `feature/aya-recipe-handoff-20261030`. This is a one-way, user-reviewed share-file workflow, **not** an in-app LLM, Android AAR integration, MCP connection, assistant response listener, or tested live ChatGPT/Claude attachment ingestion.

## Product contract

From **More → Files & sharing → Ask Your Agent · create JSON recipe**, open a compact modal composer. The person describes a design in ≤1,600 characters and may explicitly opt into including the **current full canonical design**. By default, the current design is **not** transmitted. Three actions:

1. **Share guide:** user-agent handoff via `navigator.share({files:[File]})` when the browser reports support. The share target chooses whether it accepts the text file or opens an AI conversation. No claim that opening a share sheet guarantees recipient ingestion.
2. **Copy guide:** full content to clipboard if available. User pastes it into the preferred assistant.
3. **Save guide:** download the entire UTF-8 text attachment for manual attachment.

The agent should produce one valid **ROYGBIV v2 JSON recipe file**, preserving untouched properties if revising an existing recipe. The user independently saves its result, returns to **Import design** and previews/edits normally. **AYA and ROYGBIV do not observe, poll, rate, import, callback, analyze or monitor the assistant's reply.**

## Correct architecture

```
Current PWA editor + optional current recipe + user's prompt
  -> src/aya-recipe-reference.js (source-derived reference; one text attachment)
  -> src/aya-recipe-handoff.js (explicit Share / Copy / Save)
  -> selected external assistant (outside our control)
  -> user saves .json and manually opens existing Import design picker
  -> src/model.js normalizeRecipe / normal app transaction / renderer
```

- Canonical schema and defaults: `src/model.js`; no duplicate recipe model.
- Field vocabulary, precise numeric limits, enums, UI categories: `describeAgentCapabilities()` in `src/agent-api.js`.
- Tool visibility by structure: `toolAppliesToScene()` in `src/editor-tool-applicability.js`.
- Descriptive, explicitly **uncalibrated** interactions: `AYA_SEMANTIC_RULES`. These are hypotheses / source-informed design advice, not empirical 0–100 perceptual transfer functions.
- Existing JSON import is permissive and normalizes malformed/missing values. Reference warns about this and asks the assistant to stay inside known bounds. Do not claim validation of a generated file before manual import.
- Advanced object models (drawn path, regional geometry, text and embroidery) are deliberately preservation-first until their nested schemas can be exported and tested without invented subkeys.

## Responsive UX acceptance contract

- Use the **existing** Files & sharing source group. Do not add a dock destination or increase the height of More, preview, editor or wallpaper.
- AYA composer is a separate native `dialog`, not an inner scrolling panel. `max-height: calc(100dvh - safe-area - 1rem)`, grid content and short-screen typography keep full header, prompt, opt-in and three actions available. The multiline prompt has a bounded height and no user resize.
- Required test sizes: **320×700** and **412×892** portrait, plus 500–790 widths and short viewport/IME; check there is **no vertical scroll inside the dialog** and no clipped last action.
- Buttons and checkbox rows have at least 44px target height. Focus moves into modal, Close returns to invoking More control through native dialog focus; keyboard Escape must not collapse underlying More while modal is active. Confirm on-device TalkBack and keyboard.
- Reuse the original AYA `assets/ask-your-agent-icon.svg` geometry, with restrained violet-plum background and ivory ink as `assets/aya-roygbiv.svg`; preserve all vector paths. No raster icon and no font substitution.
- Do not auto-toggle consent or persist/share unfinished prompts.

## Structured reference requirements

The attachment contains:
1. Task, privacy boundaries, user prompt and unambiguous JSON-only artifact/output contract.
2. Canonical v2 defaults, exact source-derived field types, enums, bounds and editor tool applicability.
3. Explicit preconditions and inter-control interaction rules; preserve mode specificity, disabled settings and quantization.
4. A **full current recipe only when the user deliberately checks the opt-in box**.
5. Limits: static guidance cannot prove the resulting composition; actual pixel-level feedback requires a separate opted-in MCP tool and its own verified connection.

The reference is generated at handoff time from the running editor's code. Every new schema or enum appears in the exported capability catalog without a hand-authored schema list. The descriptive semantic rules still require a source audit and UI test when their owning effects change.

## Work plan and dependency gates

**P0: initial end-to-end infrastructure (in this branch).**
- Ship modal composer under More, share/copy/save fallbacks, logo, current-recipe opt-in.
- Source-derive canonical field reference and scene-visible tool matrix, with source-derived unit tests.
- Test unchanged native import workflow and locks/Undo; keep AYA wholly separate from import/renderer.

**P1: finish actual mobile/recipient acceptance (unverified).**
- Run Chromium viewport screenshots at 320×700 and 412×892, keyboard visible and hidden, verify all controls and action button bounding boxes stay within viewport with scrollHeight <= clientHeight.
- Test real Android Chrome `canShare({files})` into ChatGPT, Claude and other share targets; capture which consume `EXTRA_STREAM` attachments and which only receive the text. Provide Copy and Save when not supported.
- Test generated JSON from independent assistants against the actual current importer and visual preview; compare expected constraint satisfaction without reading end-user conversations in production.

**P2: develop empirical semantics rather than claiming them now.**
- Construct small deterministic design fixture families by structure, geometry, seed and baseline material; isolate one setting or one known interaction pair at a time.
- Reuse the actual Chromium renderer to measure visible coverage, contours, hue presence and overlap; do not use source scene descriptions as pixel-ground-truth.
- Record only observed monotonic ranges, quantization, nonlinearity, thresholds and conditional effects, with fixture commit/revision and uncertainty. Prefer effect-specific response bands to fake absolute scales.
- Update `AYA_SEMANTIC_RULES` and author tests for interactions found through calibration, not exhaustive O(n²) brute force. Include complex object schema metadata only after accurate schemas and examples are verified.

**P3: optional enhancements, not initial dependencies.**
- Recipe JSON strict-validation preview before the existing import transaction; preserve user-friendly legacy imports and do not silently rewrite unknown input.
- Add visible agent recipes gallery/iteration only if users ask for it. Never add response tracking, inference hosting or automated return as a condition for AYA.

## Accepted real Chromium proof · 30 October 2026

[GitHub Actions run 41019185386](https://github.com/gamesbyian/wallgen/actions/runs/41019185386) executed the **real browser editor** and `scripts/aya-recipe-mobile-acceptance.mjs`, passing every assertion at 320×700, 412×892, 500×790 and 790×700. The AYA dialog's measured height was approximately 374, 374, 367 and 347 CSS pixels respectively. Every control was inside both its dialog and the viewport; `scrollHeight === clientHeight` in each case; Share, Copy, Save and Close each measured at least 44px high. The wallpaper preview height was unchanged in all four journeys (287, 404.1, 341.9, 287 CSS pixels respectively). No browser page errors were recorded. [Four captured screenshots](https://github.com/gamesbyian/wallgen/actions/runs/41019185386/artifacts/12961335374) were retained by Actions with short-lived evidence retention.

This is genuine Chromium acceptance. It does not simulate a real soft keyboard, Android native Sharesheet recipients, TalkBack, physical Pixel 6 Pro feel or the quality of an independently generated JSON recipe. Those remain explicitly open device/recipient and content-quality gates.

## Testing and release truth

`node --test tests/aya-recipe-handoff.test.js` checks source-derived guide content, opt-in privacy, and More wiring at source level. `npm test` includes this file. Source checks **do not prove** runtime viewport geometry, platform shares, end-user attachment reception or generated JSON artistic quality. Real Chromium and Android testing are separate evidence gates.
