# Pinned hosted renderer release contract

## Purpose

ROYGBIV's Pages editor is intentionally updated frequently. A hosted Worker
cannot safely point to this moving source while requiring one trusted full SHA.
The public preview must instead use an intentionally promoted renderer snapshot
with exactly the same validated Canvas painter and bundled fonts. This document
explains the source separation; the [hosted runbook](HOSTED-MCP-CLOUDFLARE-DEPLOYMENT.md)
and [owner queue](CURRENT-WORK-QUEUE-2026-10-24.md) still govern runtime releases.

## Source of truth

The reviewed file `cloudflare/mcp/trusted-renderer-release.json` pins one full
40-character historical commit. Pages always publishes the ordinary editor
under `/wallgen/`, with `roygbiv-render-version.json` describing its latest
main SHA. On every Pages publish, the workflow fetches the pinned commit and
archives **its own** `src/`, `assets/`, and `render-host.html` (not copies of
current main) under `/wallgen/trusted-renderer/`. It writes that fixed release
SHA into `trusted-renderer/roygbiv-render-version.json`. The resulting tree is
immutable in content until a reviewed pin change, even though the surrounding
GitHub Pages deployment is replaced whenever editor code merges.

This tree contains public renderer modules and assets only. It must never
include private recipe rows, OAuth tokens, user-imported files, stored designs
or session logs. Existing font byte-integrity rules remain in force. No second
renderer algorithm is introduced: the snapshot uses the historical ROYGBIV
renderer and its own matched dependencies.

## Separate promotion procedure

1. Identify the exact commit containing an independently tested renderer and
   its required assets. Run the current painter's normal Node, PNG/worker
   parity and representative visual tests at that same source revision. Do
   not choose a commit purely because it is newest.
2. Change only the explicit full-SHA pin after source review, checking that
   the pinned Git tree contains `src/renderer.js`, `src/typography-fonts.js`,
   `assets/fonts/manifest.json`, and `render-host.html`. Pull-request CI
   must exercise the Git archive and byte checks without adding permanent
   deployment triggers or expensive standing suites.
3. After merging the reviewed pin, wait for Pages to finish publishing. Read
   both publicly served version manifests. The root must match current main;
   `/trusted-renderer/` must match the reviewed fixed SHA. Confirm that
   public code/font assets and the static render host are reachable.
4. Only the explicit owner-authorized manual hosted release may package and
   deploy a Worker. Its `deploy-preview` mode continues to require the
   existing affirmative billing/privacy approval; `package` performs no
   deployment. The generated Worker config uses only the verified pinned
   renderer URL and full SHA. Do not opportunistically turn off auth, the
   daily D1 ceiling, launch pacing or either independent revision check.
5. Real acceptance requires an authenticated private MCP `roygbiv_preview`
   returning an `image/png` part at bounded size/time and confirmed owner
   isolation, quota/cleanup, and visual parity. A source or CI success alone
   is not a production PNG proof. Verify stale-revision preflight refuses
   before a Browser Run/preview quota charge, and record real browser timings.
6. On a regression, select a previously audited pin via an ordinary PR and
   repeat Pages verification before any manual Worker rollback. Never redirect
   existing Workers to an unverified moving `main` URL.

## Guardrails and limits

The moving app can evolve its pre-release recipe schema; a deliberately pinned
renderer may lag that evolution. If a new canonical saved recipe is not
renderable by the pinned release, require an explicit compatible renderer
promotion before enabling hosted preview rather than silently emitting wrong
pixels. The same preview continues to perform a full-SHA preflight before any
paid browser or D1 allowance consumption and a second in-browser check in
case Pages changes between those requests.

Actual Pixel 6 Pro, Android IME, TalkBack and high-resolution native exports
remain distinct from this browser thumbnail infrastructure.
