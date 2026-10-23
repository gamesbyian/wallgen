# ROYGBIV creative behaviour recorder and recipe journey evidence

### Subsequent source-backed delivery and outbox fault handling (23 October)

[#593](https://github.com/gamesbyian/wallgen/pull/593) prevents an unsendable (>850 KB) local event from blocking **other independent sessions**, while never skipping it or subsequent events **within its own session**; these unacknowledged records remain on-device and cannot be assumed uploaded. [#594](https://github.com/gamesbyian/wallgen/pull/594) makes Activity's consent checkbox independent of successful IndexedDB reads, reports a failed read and unavailable backup counts explicitly, clears stale activity headings and ignores older async refreshes. [#591](https://github.com/gamesbyian/wallgen/pull/591) and [#595](https://github.com/gamesbyian/wallgen/pull/595) share the canonical settled-edit path at Seed Apply, Saved restoration and Photo comparison, protecting the actual recorded recipe journey from delayed input updates. All four PRs passed lean quick CI; **no real owner/Pixel session or authenticated GitHub write/readback** was exercised.

### Additional merged session-boundary and interaction correctness (23 October)

[#582](https://github.com/gamesbyian/wallgen/pull/582) makes local erase a genuine **new session**, rather than reusing the identity of archived events with reset sequence numbers. [#583](https://github.com/gamesbyian/wallgen/pull/583) isolates occasional geometry-rich journal events above the normal compact-batch target while keeping the complete private file under 1 MiB for byte-exact GitHub Contents readback; truly oversized events remain local, unacknowledged and untruncated. [#585](https://github.com/gamesbyian/wallgen/pull/585) synchronously commits two-stage slider debounce/frame updates before user-triggered PNG/JSON/copy/favourite/Undo/randomize transitions; this protects both output pixels and the final unexported supersession snapshot. [#587](https://github.com/gamesbyian/wallgen/pull/587) prevents asynchronous PNG success/failure from crossing a recording opt-out, erasure and renewed opt-in; a later PNG in the same session following Randomize All stays attributed to its original episode. All four passed the existing quick gate. Static source proof and deterministic mocks are **not** physical Pixel test evidence.

The preexisting **private repository and `data/roygbiv-usage` branch exist** (repository branch-list check); no fine-grained PAT was installed in the app or used for a live backup. Repository-wide Contents permissions, stored-token tradeoffs, Git history persistence and actual opt-in acceptance remain explicit. No new backend, second creative-state engine, screenshot CI, automatic recording or silent data export.

**Status:** local recording, private GitHub sync code, contextual surveys and evidence analysis implemented; unattended real-account use not yet verified. **Owner request:** capture real usage, recipe evolution, exports and superseded/unfinished work with minimal direct human involvement; selectively ask simple contextual questions. **Tracker:** [#542](https://github.com/gamesbyian/wallgen/issues/542), learning context [#537](https://github.com/gamesbyian/wallgen/issues/537). **Date:** 2026-10-22 (Calgary).

## Implementation checkpoint (23 October 2026)

**Implemented on `main`, not merely proposed:** [#548](https://github.com/gamesbyian/wallgen/pull/548) added the disabled-by-default local Activity log with IndexedDB event journaling, canonical recipe changes and local JSON export/delete. [#549](https://github.com/gamesbyian/wallgen/pull/549) added a per-device opt-in GitHub batch uploader to `general-purpose:data/roygbiv-usage` with retry and collision verification, not an additional backend. [#550](https://github.com/gamesbyian/wallgen/pull/550) added optional one-tap export and supersession surveys, gesture coalescing and correct attribution of delayed exports. The local analysis tool `node scripts/summarize-creative-usage.mjs [--json] <activity.json|batch-directory>...` reads exported JSON or private branch batches and produces source-evidence summaries. **No live uploaded events, consented owner sessions, real Pixel UI approval or configured GitHub credential have been verified.**

**Remaining:** One genuine physical-device session to exercise local log and optional surveys; owner decides whether to provide a repo-scoped GitHub token *in the app*; actual API upload/readback/expired-token/offline retry proof; optional Git-history purge, automatic retention, playback UI and additional multi-tab/lifecycle evidence. Without a token the app remains fully usable and the recorder remains off until explicitly enabled. A successful download initiation is **not** proof a wallpaper was installed or even retained on device; superseded/unclosed work is not labelled voluntary abandonment. Historical artwork backwards compatibility is not a development gate.

**Progress:** T0/T1 delivered with explicit opt-in and an IndexedDB journal; T2 export/Randomize All core outcomes delivered with best-effort hidden checkpoints; T3 compact contextual surveys delivered; T4 private GitHub uploader implemented, **live service authorization/upload unverified**; T5 local report tooling delivered, **no genuine human data analyzed**. This checkpoint supersedes original unchecked/planned-stage prose further below without erasing its design context.

### Further merged reliability and retention work (23 October 2026)

**Merged and lean-CI validated:** [#552](https://github.com/gamesbyian/wallgen/pull/552) reconciles the prior session's last-known recipe on an opted-in next launch, with `session_interrupted` explicitly uncertain. [#554](https://github.com/gamesbyian/wallgen/pull/554) requires **authenticated byte-exact GitHub readback** after a successful write or idempotent collision, retains unconfirmed outbox batches, and cancels in-flight uploads on opt-out/disconnect/delete/pagehide. The same opt-in connection retries on connectivity return/visibility; disabling local logging still requires no remote service. [#555](https://github.com/gamesbyian/wallgen/pull/555) adds checksums and verified patch/checkpoint continuity to the **existing canonical** recipe journal, marking missing/reordered/corrupt data incomplete rather than implying successful replay. [#558](https://github.com/gamesbyian/wallgen/pull/558) provides a compact recent-event inspector and explicit **manual deletion of complete local sessions older than 90 days only when every event has confirmed remote backup**. No automatic retention expiry: default is keep until user deletes or browser evicts it. [#560](https://github.com/gamesbyian/wallgen/pull/560) aligns newly created immutable batch paths to the already documented per-session destination folder and keeps pre-existing reserved outbox paths retryable.

**Additional merged current-main follow-through (23 October):** [#566](https://github.com/gamesbyian/wallgen/pull/566) sorts analytic recipe replay by authoritative per-session sequence and marks missing/duplicate event numbers as incomplete even when a plausible image remains; [#568](https://github.com/gamesbyian/wallgen/pull/568) adds a durable private-outbox summary of unsent, reserved and previously acknowledged local events, with consent-safe asynchronous UI status; [#570](https://github.com/gamesbyian/wallgen/pull/570) writes new bounded private batches in per-session causal order regardless of backwards phone-clock changes; [#572](https://github.com/gamesbyian/wallgen/pull/572) dismisses pending surveys on opt-out/local deletion and improves accessible announcement/focus return; [#574](https://github.com/gamesbyian/wallgen/pull/574) separates no-op sync from verified remote readback and discloses that deleting while recording remains on immediately starts a new episode; [#575](https://github.com/gamesbyian/wallgen/pull/575) derives actual source-event cause, navigation-route, render-failure and explicit supersession stats in the existing local report, without guessing confusion or happiness. All six passed the existing lean quick test. **No genuine human sessions, private account uploads or Pixel/TalkBack observations were produced by these deterministic tests.**

**User-facing controls:** More → Activity log; local recording is disabled by default. The user can review recent event headings, export full JSON, delete all local records, optionally prune completely synchronized old sessions, adjust survey frequency, and separately enable/disconnect the private GitHub backup. Locally deleting/pruning events or revoking a token does **not** purge immutable Git history. Authored geometry can appear in consented recipe snapshots; no imported source photographs or rendered artwork are uploaded by the activity recorder.

**Remaining acceptance, not passed:** No authenticated owner token, actual GitHub PUT/GET receipt, live offline/expired-credential recovery, user-generated event corpus, physical Pixel Chrome/PWA keyboard/TalkBack/thumb observation or actual survey response has been verified here. A new first-party handset session is required before claiming those results. Multi-tab/restart reconciliation and OS eviction remain best-effort; checksums detect many accidental corruptions, not adversarial tampering. Server-side delete/purge of Git history, any automatic age-based retention, and an interactive visual replay UI are **optional future features**, not blockers for the working local-first recorder. #537's agent predictions are not human evidence.

## Single-owner hosting amendment: use existing GitHub/Google infrastructure first

**Owner clarification (22 October 2026):** ROYGBIV currently has **one human user**. Optimize for that fact: do not require a tenant/account database, production-grade SaaS onboarding, distributed analytics warehouse, subscription, hosted dashboard, or custom backend before getting useful usage evidence. The recorder must remain transport-agnostic and work entirely locally when no remote destination is configured. The previous Cloudflare Worker + D1 suggestion below is an optional future path, **not the preferred prerequisite**.

**Confirmed owner destination (22 October):** Use the existing private [`gamesbyian/general-purpose`](https://github.com/gamesbyian/general-purpose) repo as the first off-device ROYGBIV archive, **not** a new dedicated repository. The data-only branch `data/roygbiv-usage` and [`telemetry/roygbiv/README.md`](https://github.com/gamesbyian/general-purpose/blob/data/roygbiv-usage/telemetry/roygbiv/README.md) have been created. Keep regular `main` and the existing `audit/` agent-activation ledger separate. Record batches at `telemetry/roygbiv/YYYY/MM/DD/<session-id>/<batch-id>.json` on that branch. Write immutable, bounded event batches via the GitHub Contents API; local IndexedDB remains the offline outbox. Never trigger expensive workflows per batch. Other research datasets can later use their own namespaced directories in this already-general-purpose repo.

**Security boundary:** A fine-grained PAT granted Contents write on `general-purpose` can act against *all* repository content; restricting writes to a branch/path in our app is a convention, **not a token permission restriction**. This repo includes other private projects and tooling. The owner should explicitly accept that increased credential scope before enabling autonomous upload; the token must never be checked into source or URLs, must be revocable/rotatable, and should be stored only on the personal device. Branch protection can reduce accidental writes to `main` but does not create a directory-scoped token. A separately isolated data repo or Drive OAuth remains optional if token isolation becomes the overriding concern. No token exists or has been configured as part of this documentation work.

### Prioritized storage targets (no backend required for direct GitHub/Drive)

| Candidate | Setup and unattended behaviour | Trade-off and decision |
| --- | --- | --- |
| **Existing private `general-purpose` telemetry branch** + static Pages client | **Preferred existing destination.** Append bounded immutable batches under `data/roygbiv-usage:telemetry/roygbiv/YYYY/MM/DD/<session-id>/<batch-id>.json` with GitHub's Contents API. The owner enters a fine-grained PAT limited to `general-purpose` with Contents read/write permission, never committed or placed in a link. Acknowledged remote writes clear the matching IndexedDB outbox item. The branch already exists, with its own [destination contract](https://github.com/gamesbyian/general-purpose/blob/data/roygbiv-usage/telemetry/roygbiv/README.md). | **No new repo, backend or CI required.** Caveat: PAT access covers the entire private multipurpose repository, **not** only the branch or folder. Choose this when the owner accepts the greater credential exposure; rotate/revoke as necessary and keep telemetry away from `main`. Batch by session/time, not individual edits. Git stores permanent history unless deliberately purged. |
| **Direct Google Drive API** + Google Identity Services in the Pages client | Owner opts in via a `Connect Google Drive` click and browser OAuth; use `drive.file` scope to create archival JSON files in a selected app-owned folder and keep an authenticated, response-acknowledged local outbox. Data directly visible in Drive and retrievable by connected research tools. | **Best credential-free static-client option** but browser access tokens are short-lived, so reauthorization from a user gesture is needed after expiry or on later visits. Not reliably unattended forever. `drive.appdata` hides files from normal Drive UI and is therefore less suitable for owner inspection. |
| **Google Apps Script web app** `doPost` + private Drive/Sheet | Deploy a small script acting as owner: accept low-frequency event batches, write bounded JSON files into a private Drive folder and append a small per-episode index/survey row to Sheets. It can accept cross-site simple/form posts from Pages without requiring Google OAuth at each launch. | **Best minimal Google filing cabinet if a targeted browser proof works.** In practice Apps Script ContentService and redirects can be awkward for ordinary cross-origin `fetch`: a `no-cors` POST yields opaque responses with **no trustworthy server acknowledgement**. A public `Anyone` execution endpoint needs input validation and abuse mitigation; a token embedded in deployed public JS provides no secret. Save credentials only in a private local setting. Do not silently treat sent-as-saved. |
| **IndexedDB + local JSONL export** | Works immediately and offline without any login/service setup. | Great T0/T1 baseline, but long-term unattended off-device retrieval and recovery are absent. |

**Recommended first spike:** use the already-planned T0/T1 local journal, then implement a thin **direct GitHub adapter for `gamesbyian/general-purpose` branch `data/roygbiv-usage`**: one file per queued batch, client-generated UUID path, deterministic payload digest, authenticated write response, idempotent reuse of exact path and digest after uncertain failures, explicit sync status, rate limiting and safe deletion/retention. Request only repository `Contents: read/write`; do not request Actions/Workflows or access to the `wallgen` source repository. This is an operational storage split inside a single private repository, not a permissions split. Treat the token as a password. If storing such a token on the handset is undesirable, choose **Drive direct OAuth** next. Test Google Apps Script separately with one controlled POST and server-visible row, including cross-origin response handling and replay/duplicate behaviour, *before* selecting it for reliable automated backup.

**Scope/operational security for the personal installation:**
- No collection until the owner explicitly enables it. Offer Local only / GitHub private backup / Drive backup and optional survey prompts. Backend endpoint is never required to render art.
- No token printed into logs or embedded in `index.html`, compiled JS, repo config, GitHub Pages site, location URL, share link or PNG metadata. Avoid recording personal metadata, uploaded source images or arbitrary search text. A malicious injected script or compromised browser session can access any usable in-browser credential; browser-side encryption does not neutralize that threat.
- Ack/retain until confirmed remote storage; never drop unsent batches on timeouts, browser close, offline operation or script-side failure. Periodic uploads plus flush after export/supersession, not a network request for every slider gesture. No GitHub workflow on each upload.
- Read receipts: private repo folders, Drive files, or Sheet index are directly inspectable through already-used connected tools. Use a local analyzer over JSONL, not a dashboard dependency.
- Verify an actual single-session end-to-end upload, restore, duplicate-write retry, offline queue, revoked/expired credentials and telemetry deletion in a limited spike. Do not launch a broad testing suite.

Official references: [GitHub CORS](https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests), [GitHub repository contents API](https://docs.github.com/en/rest/repos/contents), [GitHub fine-grained tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens), [Google browser token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [Google Drive scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), [Apps Script web apps](https://developers.google.com/apps-script/guides/web) and [Web App execution permissions](https://developers.google.com/apps-script/manifest/web-app-api-executable).

## 1. Outcomes and truthful evidence

The tool should let an authorized investigator reconstruct a real, consented creative **episode**: which initial wallpaper recipe was visible, which interface routes and controls were used, which parameter changes were attempted and committed, how locks, scoped randomization, Undo and restoration affected the artwork, the last recipe visible before changing direction or leaving, and which exact versions were exported or favourited.

Capture **behaviour** automatically after a one-time informed setting choice. Capture **motivation** only from an explicit, optional question or separately identified owner annotation; never infer satisfaction, confusion or rejection merely from a Randomize All, Undo or lack of export. A participant's change-of-direction can be ordinary playful discovery.

Evidence vocabulary:
- `observed-app-event`: source-generated interaction or recipe transition with event ID, editor version and known limitations.
- `observed-human-answer`: voluntary response associated with an actual episode; answer may be missing.
- `derived-metric`: computed from complete or explicitly incomplete event history, documented denominator and uncertainty.
- `agent-hypothesis`: predictive interpretation, always kept separate.
- `interrupted-unconfirmed`: preserved last-known recipe, not proof of a deliberate abandonment, user dissatisfaction or true wall-clock session end.

## 2. Verified insertion points, based on current `main`

- `src/app.js` central `render(recipe)` performs lock-respecting normalization and `checkpoint()` before assigning `current`; `changeRecipe()` wraps render and synchronizes controls. Source-level recipe commits should be captured here, once per changed normalized state, **not** from each worker preview, animation frame, label update or unrelated `render(current)`.
- `src/model.js` `normalizeRecipe()`, `randomizeAllRecipe()` and shared domain types are canonical. The telemetry layer may call them and compare two snapshots but must never acquire authority to modify them. Avoid a second recipe serialization/normalizer.
- `src/app.js` `randomizeAll` click is a known **episode boundary**: take prior snapshot and classify, *then* run existing randomization; never record the new recipe as the old one's ending. `randomize` (seed-only), scoped dice, gallery selection, favourites, `undo()`, importer, drawing and `installExplorationHistory()` provide more specific semantic causes or branches.
- `downloadPNG()` already captures `const snapshot=normalizeRecipe(current)` at request time before worker rendering and embeds that snapshot in PNG metadata. Reuse exactly this object in the `export_requested / render_succeeded / download_initiated / render_failed` events; do not take a later mutable `current`. Browser `downloadBlob()` initiation does **not** confirm a local file was retained, opened or installed as wallpaper.
- Existing `editor-category-change`, `editor-tool-changed`, `roygbiv-mobile-navigation-changed` and `roygbiv-gallery-mode-changed` document real navigation, separate from recipe changes. Instrument Before/After, favourite, save JSON and Share at explicit handlers. Do not clone underlying inputs to observe them.
- `src/geometry-library-store.js` provides a functioning IndexedDB pattern (transaction completion is authoritative) and session-memory fallback. Create a separate versioned study store; do not modify the shape-library database schema or share a new ad hoc storage framework when a small reusable adapter suffices. `src/exploration-history.js` is only an in-memory 10-item creative UI history; it is **not** durable research telemetry.

The app is static-hosted (GitHub Pages) and has no native collection server. Current `localStorage` covers favourites/preferences and IndexedDB covers geometry, not uploaded behavioural research.

## 3. Core data model and replay contract

Hierarchical IDs use random UUIDs, *never* user-entered names: `installationId` (rotatable pseudonym, optional for longitudinal linkage), `sessionId` (page lifecycle), `episodeId` (single creative attempt), `eventId` (idempotency), `exportId`. Each event records `seq`, elapsed monotonic offset, coarse wall-clock time, app/build/recipe schema, privacy mode, event family, action cause, intent-capture provenance, prior/current hash and bounded payload. Cross-tab sessions are separate; interleaved writes cannot overwrite each other.

Use a stable **canonical normalized recipe** plus deterministic digest for comparisons and checkpoints. Prefer top-level field diffs for scalars, typed patches for collections only when genuinely trustworthy, and full replacement for path/shape/object collections until a safe shared diff exists. Record `initial_full_recipe`, every N (initially ~10) committed changes, exact snapshots at export/favourite/supersession and last persisted state on hidden/idle. A replay verifier must obtain the same canonical final recipe and digest; a failure is marked `incomplete` rather than silently pretending events survived. Version telemetry envelopes independently from recipe schemas.

Example, illustrative (never label as collected):
```json
{
  "schema": 1, "eventId": "event-uuid", "sessionId": "session-uuid",
  "episodeId": "episode-uuid", "seq": 17, "elapsedMs": 28200,
  "type": "recipe_commit", "cause": "slider_settled",
  "context": {"category": "Paths", "tool": "geometry"},
  "changes": [{"key": "stripeWidth", "before": 18, "after": 27}],
  "beforeDigest": "hash-a", "afterDigest": "hash-b"
}
```

Event families:
- **state**: episode begin, normalized recipe commit, full checkpoint, intended lock/unlock, Undo, restore/branch, input ignored because disabled/locked where cheaply observable.
- **exploration**: Randomize All (boundary), seed reroll, scoped variation and primes-only, batch generation and chosen gallery variant, Compare toggles.
- **navigation**: studio/edit/more/saved/explore, category/tool selection, meaningful search query *classification* (known matched term or result category, not arbitrary typed search strings), dismiss/cancel.
- **outcome**: export request, render success/failure, download initiated, recipe JSON save, favourite add/remove, explicit share command, user survey response.
- **session**: visible, hidden, idle start/end, autosave persisted, continuation/recovery, explicit collection opt-out.

No raw typing, keystrokes, pointer traces, sensor readings, uploaded source images, complete browser URLs/query strings, clipboard, contact IDs or PNG text metadata. Imported paths/custom geometry may themselves be authored content: never upload without a clear, separate recipe-content disclosure. Avoid IP address or user-agent fingerprint as an identifier. Preserve useful interaction granularity without building invasive session replay.

Coalesce a continuous slider/drawing gesture as a bounded episode of intent: start value, final value, duration, changes of direction/optional extrema, and at most a low-frequency sample for genuine exploratory analysis, all governed by the same transaction hooks. **Final committed normalized state cannot be downsampled away.** Distinguish user edits from source-driven preset resets (one command may change many keys). Capture rejected control attempts separately when directly available; a lock preventing a change should not fabricate a recipe mutation.

## 4. Episode boundaries and abandonment semantics

A **session** is one foreground/background/resume browser lifecycle, with timeout handling for meaningful periods of idleness. An **episode** is one attempted wallpaper or branch, and a session can contain many episodes. Generate separate IDs when the user changes projects (Randomize All, explicit restore/new gallery selection where appropriate). A seed reroll may be an in-episode experiment; preserve the branch rather than assume project abandonment.

- At *every committed recipe change*, journal change plus most recent complete recipe, so a sudden Android process kill loses at most a pending browser transaction. Persist in IndexedDB asynchronously without blocking preview; write small events and checkpoint in one transaction; surface storage failures and cap the queue.
- At **Randomize All**, persist the prior episode's terminal full snapshot, active/edit time, last successful exported snapshot/revision, number of manual edits since export, `superseded_by_randomize_all`; open the new episode with its own initial snapshot. Multiple exports are retained, and edits after an export remain separately visible.
- At **export**, record the exact snapshot from `downloadPNG()`, separately track unsuccessful render or browser download initiation and optional feedback. Never infer 'applied as wallpaper'.
- At **document hidden** (`visibilitychange`), persist the current recipe and foreground interval, mark `hidden_unconfirmed` without concluding the human quit. On return continue the episode. `pagehide` may help as best-effort secondary, but not a guaranteed final event.
- At **idle threshold** (initial candidate: 10 min with no meaningful user interaction), checkpoint and mark `idle_unconfirmed`. A later action resumes or opens a new session depending on explicit policy. Active time is accumulated only in visible + recently engaged intervals, so elapsed browser-open time does not become 'editing time'.
- On **next startup**, reconcile previous incomplete last-known snapshot and pending outbox, classify a genuinely interrupted previous session `interrupted_unconfirmed` while preserving its exact last-known recipe. Never invent an event after the last durable checkpoint. Avoid double-closing from repeated hidden/pagehide signals.

Mobile browsers can suppress or skip unload events. Periodic/transactional persistence is the reliability mechanism; `navigator.sendBeacon` or `fetch(...,{keepalive:true})` for small batches is a *supplementary* upload attempt, not proof of receipt or permission to rely on unload. Keep small batches below 64 KiB for Beacon. [MDN Beacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon), [Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), [browser storage durability](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).

## 5. Survey UX

A small non-blocking card in/adjacent to the existing Studio/More flow; no full-screen dialog, focus trap, preview occlusion or unsaved-state mutation. Surveys are optional and linked to the *old* episode ID when superseding. They must never prevent Export or Randomize All.

**Export (eligible on every successful initiation; participant chooses Ask always / occasionally / never):**
- `How close was this to what you wanted?` → `Exactly / Close / Exploring / Not really / Skip`.
- Optional single second tap: `What mattered most?` → `Composition / Colour / Material / Effect / Other`.
- Optional free-text note only with separate explicit research-text disclosure. No forced response.

**Randomize All after substantial unsaved work:**
- Trigger candidate: ≥3 meaningful **manual** committed edits and ≥45 seconds **engaged** since last relevant export, and the superseded revision was not exported. Exclude automated/preset-only changes. Thresholds are *initial hypotheses*, tuned by actual nuisance and feedback rates.
- Show the **previous** artwork via a small recipe-derived thumbnail if inexpensive; never mislabel newly randomized wallpaper. `What happened to that design?` → `Just exploring / Wanted a different direction / Couldn't get the result / Accidentally changed it / Saved it another way / Skip`.
- On repeated Randomize All avoid piling cards; always make them dismissible, expire opportunistically, never queue repeated nag prompts. Provide `Ask every time / Occasionally / Never` independent of data recording.

These answers constrain interpretation but still have self-report limitations. Response absence is missing data, not 'unhappy'. No score called 'likability' should be inferred from raw export counts alone.

## 6. Storage, retrieval and security options

**Stage 1 (no backend):** Local, separately versioned IndexedDB event and episode stores with transactional `events`, `snapshots`, `outbox`, `consent`; export a bounded chronological JSON/NDJSON bundle plus optional aggregated CSV, with an integrity manifest. Display a compact `My activity data` panel under More → Files & sharing or a discreet Study setting: recording status, local storage usage, last durable checkpoint, Review/Download/Delete controls. Storage can be denied or evicted; remote syncing is optional and is what enables unattended researcher collection. Only after explicit one-time activation should recorder store behavioural data.

**Stage 2 (automatic remote retrieval, superseded default):** An optional first-party HTTPS collector (historically suggested: Cloudflare Worker + D1 relational events/snapshots, perhaps R2 only for large opt-in assets). **For the confirmed one-user plan, prefer the existing private `general-purpose` GitHub data branch above instead of deploying this backend.** Private authenticated reviewer access provides per-session timeline and JSONL/CSV export; no public GitHub issues/commits or embedded page secrets. Server must validate schema/version, cap request size/event rate/retention and payload types, and deduplicate by event ID. Browser origin checks/CORS alone are not authorization. For a limited personal study use an invitation/participant token with server quotas; rate-limit and revoke compromised clients. Bind sensitive admin read/delete endpoints to server-side secret, not static client code. Backend and platform credentials must be provisioned separately. Cloudflare D1 free limits are [documented](https://developers.cloudflare.com/d1/platform/pricing/) but are not a guaranteed lifetime cost assumption.

**Transport:** queue locally; periodically send bounded batches while visible and online, resume on next launch; acknowledge stored event IDs before deletion from outbox. A successful `sendBeacon()` return means *queued*, not accepted by the server, so retries require idempotency. Detect consent withdrawal, immediately stop new collection/uploads, clear pending queue when requested, and provide server-side deletion by an authorized participant receipt or study owner. Avoid attaching external secrets to recipe URLs; never send full link fragments/query containing recipes.

**Modes:** `Off` (default), `Keep activity on this device` (no upload), `Share usage research` (separate informed opt-in, can start without ongoing prompts). The app should remain completely usable with every mode disabled. Clear language should say recipe snapshots and navigation can reveal personal creative choices. Allow inspection before upload, revoke, local export, local delete and remote deletion request. If other people use the app, disclose purpose, categories, destination, retention and parties; do not silently switch them on. Relevant Canadian [meaningful-consent guidance](https://www.priv.gc.ca/en/privacy-topics/privacy-for-businesses/appropriate-handling-of-personal-information/collecting-personal-information-and-consent/consent/gl_omc_201805/). Anonymous random IDs are only **pseudonymous**, especially if retained between sessions.

## 7. Research reports actually worth building

Start with a plain local parser / private dashboard. Each statement links to a real sampled episode and raw evidence, with gaps marked.

- Opening recipe, saved/final/last-known recipe and exact export checkpoint(s); diff heatmap by canonical setting/category and exported/unexported suffix.
- Frequency and sequence of direct manual control changes versus random draws, lock use, branch resets, Undo and backtracking, search and category route detours.
- Real active time to first intentional edit, to first export, to supersession; distinguish cumulative active work from a 3-hour background tab.
- Controls visited but never changed, locked-setting attempts where captured, editing reversals/oscillation and multi-attempt exploration, with caveat that they do not automatically mean confusion.
- Which aspects of a recipe persist across exploratory branches and which correlate with *observed* exports or survey responses, not assumed aesthetic appeal.
- Navigation/recipe version compatibility and missing/replayed record counts.
- Optional researcher-produced image plates from full recipe snapshots using the **existing** renderer rather than uploading bitmap screenshots by default. Rendered previews are reconstructed art and must be labeled as such, including renderer-version caveats.
- For #537: compare *pre-existing* predictions with actual first control and route, without changing the earlier prediction; report observation source and confidence.

## 8. Delivery sequence and acceptance

**T0:** Lightweight telemetry data contract and mode controls; no captured events until opt-in; test policy/PII exclusion and data-schema compatibility.

**T1:** Journal around canonical recipe commits, navigation and key commands; IndexedDB snapshots/checkpoints, no preview mutation, unique parallel-tab IDs. Node tests prove one logical drag transaction, full-change record, no-op exclusion, Undo and restore integrity; verify changing recording mode does not alter normalized recipe/PNG bytes.

**T2:** Exact export/Randomize All and interrupted-session semantics; simulate process crash between edits, duplicate hidden events, offline/full storage, and failure mid-PNG; targeted tests only.

**T3:** Compact surveys and explicit stored preferences, portrait keyboard/focus/touch + one real owner use review *when available*. No synthetic-user preference percentages.

**T4:** Local-download recovery first, remote upload adapter when a controlled endpoint is provisioned; store acknowledgement and retry queues; test duplicate/out-of-order data. Owner can see data privately without giving visitors upload credentials.

**T5:** Analysis script, per-episode chronology and export table. Keep raw evidence accessible, do not create parallel app-state/history engines.

Use `npm run check:quick` as normal, plus focused telemetry tests. A single targeted real Pixel inspection may be worthwhile for new micro-survey UI, but no permanent screenshot or large regression test system. Current best recipe, reusable code, useful creative features and original imported file safety outrank historical pixel compatibility; backward migration of old artwork is **nice-to-have, not a condition** of study development.

### Principal risks to validate
1. UI and renderer responsiveness when editing rapidly; use transaction batching and async storage, never await database writes on the paint critical path.
2. Misattributing passive renderer updates or preset cascades to intentional parameter edits.
3. Inferring disinterest from absent Export; 'unexported' is a fact, 'rejected' requires other evidence.
4. Missing last moments on Android sudden process kill; journal before reliance on lifecycle.
5. Collecting author name/metadata/source-image contents through overbroad serialization or logging full URLs.
6. Pretending a page-hosted static JavaScript secret can provide a secure upload API.
7. Accidentally shipping research observation controls or telemetry as a mandatory workflow, slowing down the app's actual creative purpose.
