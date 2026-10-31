# ROYGBIV hosted MCP on Cloudflare

## 31 October 2026: actual public renderer is pinned and byte-verified

[#906](https://github.com/gamesbyian/wallgen/pull/906) merged (77184c13), separating the rolling main Pages app from a reviewed renderer snapshot under /wallgen/trusted-renderer/. It freezes public source and font assets at canonical Git commit 53a80fb81efe1ec2f4e2e6870513ed1c34145dbf, with its own full-SHA manifest. The archive proof [#41235481249](https://github.com/gamesbyian/wallgen/actions/runs/41235481249), final quick [#41235508975](https://github.com/gamesbyian/wallgen/actions/runs/41235508975), Pages publish [#41235730240](https://github.com/gamesbyian/wallgen/actions/runs/41235730240) and the critical **external HTTPS served-bytes verification [#41236303812](https://github.com/gamesbyian/wallgen/actions/runs/41236303812)** all passed. That HTTP check saw app SHA 77184c13 and trusted renderer SHA 53a80fb8 and matched the served renderer.js, model.js, typography-fonts.js, font manifest and render-host SHA-256 against Git. The verification-only PR #908 was closed unmerged with no permanent workflow.

The check also exposed two double-escaped curl command continuations and two double-escaped URL continuations in the new manual Worker release step; [#909](https://github.com/gamesbyian/wallgen/pull/909) fixed them and added permanent test coverage, final [quick #41236291050](https://github.com/gamesbyian/wallgen/actions/runs/41236291050) PASS. The independent [trusted renderer promotion contract](TRUSTED-HOSTED-RENDERER-RELEASE.md) now documents source integrity, rollback and explicit activation.

**Critical remaining gate:** source/Pages publishing succeeded, but the deployed Cloudflare Worker remains on its older rolling-root URL and stale renderer SHA until a separately **owner-approved** release. This session did not deploy, enable a new billed service or complete an authenticated image/png result. Test the actual updated Worker and private preview result, bounded usage, cleanup, scope isolation and ChatGPT display before closing #839. The early preflight from #904 is currently merged source only.

## 31 October 2026 · source-integrated early revision preflight (not deployed)

[PR #904](https://github.com/gamesbyian/wallgen/pull/904) merged at `53a80fb8` and mandatory [quick CI #41234675819](https://github.com/gamesbyian/wallgen/actions/runs/41234675819) passed. Before the fix, an already stale Pages full-SHA marker was checked only *inside* the paid browser, after a preview lease, launch pacing and D1 daily allowance consumption. The Worker code now performs an inexpensive cache-bypassing GET of the **same trusted public manifest** immediately after owner-authorised recipe lookup but **before** the lease, D1 allowance and Browser Run. An absent, malformed or mismatched marker causes an explicit refusal without attempting a paid browser launch. Shared source/expected-SHA validation and the independent Chromium-side check remain mandatory, so a Pages update between preflight and render still fails closed. No old source, guessed SHA or unauthenticated client-supplied URL may bypass either guard.

**Deployment truth:** this is **merged source only** until the owner-approved Worker release has been packaged, audited, and deployed. The presently running Worker was not changed by this PR and can still consume an allowance on revision mismatch. Existing manual `deploy-preview` approval and all D1/browser quota ceilings remain intact. First production acceptance should confirm the actual published Pages SHA, live Worker version, early refusal path (with unchanged allowance on stale SHA), then a genuine owner-scoped PNG image response once release versions agree. Do not treat Node tests, a dry-run bundle or authenticated `inspect` as actual PNG display acceptance.

## 31 October 2026 · actual deployed state and verified preview refusal

The earlier 27–28 October descriptions below are historical checkpoints. **Live read-only Cloudflare settings inspection now confirms** both `roygbiv-auth` and `roygbiv-mcp` deployed. The MCP Worker **has** a Browser binding, `HOSTED_PREVIEW_ENABLED=true`, `RENDER_SOURCE_URL=https://gamesbyian.github.io/wallgen/`, and the exact pinned `RENDER_EXPECTED_SHA=86831ae4189fde164c3454792a561c1a18c896dd`. This is an opt-in active *staging configuration*, not proof that its rendered PNG is currently usable.

The connected ROYGBIV MCP advertises `roygbiv_preview`. An authenticated owner-scoped inspection of a previously saved private design succeeded. A single real 180px preview invocation instead returned the fail-closed error **`Trusted renderer revision mismatch; preview disabled until verified`**. The GitHub Pages publisher stamps the full main-commit hash in `roygbiv-render-version.json` on each successful deployment. Main has advanced past the Worker pin, and [Pages run #41234016506](https://github.com/gamesbyian/wallgen/actions/runs/41234016506) already published a newer main revision. **The preview PNG/image-content return path remains unaccepted.** No private recipe or returned image was made public, and no new Cloudflare changes were made.

### Release policy and practical next action

1. Retain the exact-SHA trust barrier. **Do not** silently disable it to keep previews alive after app changes. It prevents private recipes being rendered by an unverified different renderer.
2. Only after an intended main commit has completed GitHub Pages publication, the repository owner may explicitly select `deploy-preview` in [the manual release workflow](../.github/workflows/manual-roygbiv-hosted-release.yml) with its existing mandatory approval string. That workflow checks the actually served Pages marker equals the committing release source, verifies the Worker, and preserves billing/privacy controls. **Do not replace this owner gate with implicit continuous billed deployments.** Any subsequent Pages push can invalidate a pin, so frequent app development makes this a *temporary* staging remedy.
3. Architectural follow-up: publish a **stable, immutable renderer snapshot** decoupled from everyday editor/README merges, and pin the Worker to that known source. Require matching byte/version evidence, asset accessibility/CSP audit, explicit promotion and rollback, and identical source/worker rendering checks. Do not use an unversioned URL, guess a revision or weaken private access to paper over rapid Pages changes.
4. After a deliberately pinned release, use one low-width private preview to verify the MCP really returns an `image/png` part, bounded time/bytes and cleanup, owner isolation, D1 daily ceiling and ChatGPT's display. A direct `roygbiv_inspect` success only proves authenticated metadata access.

**Live staging checkpoint: 27 October 2026, 18:48 MDT (00:48 UTC on 28 October)**

The two Cloudflare Workers have been **deployed to the owner's Cloudflare account**, and public OAuth discovery, unauthenticated MCP challenges, DCR registration, consent denial, CSRF rejection, and pre-login GitHub redirect have passed **real network acceptance**. The service is **not yet declared fully operational**: no owner completed a real GitHub login and no authorized end-to-end `tools/call` or live user-specific R2/D1 write has been demonstrated. Hosted PNG preview and native export are explicitly unavailable.

## New connected ChatGPT read-path acceptance (27 October 2026 MDT)

A real ChatGPT conversation invoked the connected `ROYGBIV2` hosted MCP
`roygbiv_inspect` tool for **five pre-existing privately saved designs**.
Every call successfully returned an actual canonical recipe, seed and
structural scene summary, including the original and four persisted
variations. This is genuine **owner-authenticated remote MCP read** and
owner-scoped D1/R2 retrieval evidence, replacing the earlier historical
"no authenticated call observed" status. The user's prior design-creation
exchange is evidence of host-visible creation, but this verification
directly rechecked reads only. The private recipes and their design IDs
are intentionally not copied into this public repository.

Still **not demonstrated**: hosted Browser Run pixels, ChatGPT displaying
an image-content response, a real full-resolution export, independent
second-tenant isolation, authenticated refresh/revocation and renderer
parity. Keep the new preview flag disabled until those relevant gates
are exercised, and preserve the owner's private designs.

## Isolated static renderer host (28 October 2026)

Hosted browser jobs now navigate to `render-host.html` at the verified
ROYGBIV Pages root instead of the full interactive editor. This document
contains **no script imports, app UI, service worker registration, analytics,
or external assets**; its restrictive CSP defaults to denying everything
except same-origin scripts/connection requests and same-origin or data-backed
fonts/images needed by the canonical renderer. The Worker itself still
validates the Pages revision manifest before importing `src/renderer.js`.
Cloudflare Browser Run's hostname guardrail and Playwright route filter
remain in place. All hosted art is still produced by `drawWallpaper`, not
an alternate implementation.

The static document is public and carries **no user-specific designs**.
An authenticated MCP call supplies private recipe data only inside its
ephemeral guarded Cloudflare Chromium session. A public render-host URL
alone does not render or expose a private design. This change should lower
browser startup overhead and reduce untrusted execution compared with
loading the entire studio. Actual performance gains have **not yet been
measured**; verify real hosted Browser Run compatibility and typography
before enabling the preview tool.

## Hosted source-revision and first real Browser Run art proof (27 October 2026)

Cloudflare Browser Run's actual Quick Actions API successfully loaded the
deployed `https://gamesbyian.github.io/wallgen/` homepage and imported its
real production `src/renderer.js` and `src/typography-fonts.js` modules.
A 240×520 **synthetic canonical** wallpaper screenshot was rendered (real
Chromium pixels). A second real browser run executed the actual stored
private **original psychedelic recipe** as 180×390 Canvas output: 69,254
out of 70,200 pixels had an RGB sum greater than 90, with 75 coarse RGB
bins and a nonempty PNG. Subsequent 180×390 browser-JPEG screenshots
succeeded for the original and the first two saved variations. The
actual images were inspected and showed distinctive saturated rainbow
organic regions with dark borders. These **are real external Cloudflare
browser executions**, but were driven through the operator's REST
Quick Actions, not the deployed MCP preview tool. A later rapid request
received HTTP 429 Browser Run rate limit; do not claim an unrestricted
render budget. Private recipe bytes were passed transiently to the
Cloudflare browser request and never committed to GitHub or exposed via
public image URLs.

**Revision gate:** A Pages deployment now stamps
`roygbiv-render-version.json` with the exact commit SHA **after** quick
tests and **before** upload. The Worker refuses to advertise
`roygbiv_preview` unless `RENDER_EXPECTED_SHA` is an exact
40-character lowercase hex commit. Before invoking the renderer, the
isolated Cloudflare browser fetches the manifest from the trusted
origin and compares it with the configured SHA; mismatches and absent
manifests fail closed. This is a source-publication consistency guard,
not a cryptographic per-module digest, and the existing staging
Worker has **not** been upgraded or activated by this change. The
first new Pages manifest will appear only after this PR merges and the
Pages deployment succeeds. Bind the SHA from that exact publication,
not a guessed historical checkpoint. Preventing new main publishes
from changing the renderer beneath an active Worker requires ongoing
deploy/version coordination.

## Corrected real Worker bundle retention (28 October 2026)

A [GitHub Actions inspection](https://github.com/gamesbyian/wallgen/actions/runs/40625790030)
established that `wrangler deploy --dry-run --config cloudflare/mcp/wrangler.release.generated.toml
--outdir artifacts/preview` writes the executable JavaScript to
`cloudflare/mcp/artifacts/preview/index.js`, **relative to its Wrangler
configuration**, not the repository-root `artifacts/preview`. Earlier
uploaded "bundles" contained only tiny `README.md` files, even though
Wrangler reported a successful ~4.17 MiB compilation.

[Independent real-bundle proof](https://github.com/gamesbyian/wallgen/actions/runs/40625927675)
emitted the actual 4,273,720-byte `index.js` module and a `SHA256SUMS`
file. The resulting GitHub Actions artifact was downloaded and independently
verified with `sha256sum -c SHA256SUMS`, which returned **index.js: OK**.

The permanent manual release workflow now fails closed unless the **real**
module is present and between 200 kB and 8 MB. It stores the module
and SHA256 digest, not an empty directory, with three-day retention.
This proves a reproducible reviewable package. It does **not** mean the
module was uploaded into the live Cloudflare Worker or that browser pixels
were delivered through MCP. There are no verified GitHub Actions Cloudflare
deployment secrets. Preserve the existing hosted connector until the
reviewed authenticated rollout can be deployed and independently accepted.

## Operator-gated, repeatable authenticated deployment

The `ROYGBIV Hosted MCP Release (Manual)` workflow at
`.github/workflows/manual-roygbiv-hosted-release.yml` is the supported
reproducible deployment path. There is **no automatic deployment on push**.
It accepts three explicit modes:

- `package` (default): check the exact deployed Pages `roygbiv-render-version.json`
  against the workflow's full `GITHUB_SHA`, generate a disposable Wrangler
  config, run the Cloudflare tests, build with Wrangler `--dry-run`, and upload
  a short-lived bundle artifact. **No Cloudflare token, live mutations or
  Browser Run charges** are needed.
- `deploy-disabled`: perform the same checks and deploy the Worker **with
  the Browser Run binding installed but preview tool still unavailable**.
  This supports anonymous OAuth challenge and health acceptance against the
  unchanged resource hostname without launching paid browsers.
- `deploy-preview`: explicitly opt in to the billed, owner-scoped
  `roygbiv_preview` tool. This mode additionally requires typing
  `ENABLE_AUTHENTICATED_BROWSER_PREVIEWS` into the workflow approval field.
  The global D1 lease, 6/day owner allowance, exact source SHA, and
  Cloudflare network guardrails remain mandatory. A successful deployment is
  **not** proof ChatGPT automatically displays MCP image parts.

Live deployment requires operator-supplied GitHub Actions encrypted secrets
`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` with narrowly scoped
Cloudflare Worker deployment permissions. They are **not in the repository**
and must never be entered in a prompt, committed or printed. The existing
Cloudflare connector permissions do **not** imply those GitHub secrets exist.
The workflow refuses live deployment if either is missing, or if the caller
is not `gamesbyian`. The resource Worker name, owner-only OAuth service
binding, protected R2 bucket, D1 database and cron are all preserved in the
base Wrangler file. Wrangler's existing encrypted secrets are preserved.
It does **not** upload or alter the separate auth Worker.

The two release modes were separately accepted through the actual
[GitHub Actions Wrangler packaging proof #40624602519](https://github.com/gamesbyian/wallgen/actions/runs/40624602519).
Cloudflare-specific tests, the disabled-mode generated configuration,
its Wrangler dry-run, the preview-mode generated configuration, and its
Wrangler dry-run **all passed**. This is package proof, not an actual
deployment or a verified authenticated client render. The one-shot proof
workflow was removed after successful execution.

The helper `scripts/prepare-hosted-preview-config.mjs` builds a disposable
`cloudflare/mcp/wrangler.release.generated.toml` next to the original config.
It **never edits the tracked default-off staging config**. The resulting file
is ignored by git, contains only public URLs and the expected commit, and
adds `[browser]` plus the explicit preview mode. When the Pages publication
has not caught up with the deployed source SHA, or the manifest is missing
or malformed, the release fails closed before any deployment.

Following `deploy-disabled`, independently verify the old authenticated
design tools, consent, refresh, and D1/R2 owner isolation before moving to
`deploy-preview`. Following `deploy-preview`, exercise actual MCP PNG
image content, a wrong-owner ID, quota exhaustion, session cleanup and
ChatGPT rendering. Record evidence in [#839](https://github.com/gamesbyian/wallgen/issues/839).
Cloudflare's actual billing tier and HTTP 429 limit should be reviewed
before this final opt-in. Keep preview disabled if no no-cost capacity is
available.

## Hosted PNG preview activation gate (27 October 2026)

A new **code-level gated** `roygbiv_preview` tool has been wired to the existing
`cloudflare/mcp/src/browser-render.js` and native `src/renderer.js` browser
canvas pathway. It is **not live in ChatGPT yet**. The shipped Wrangler default is
`HOSTED_PREVIEW_ENABLED = "false"`; without all of the opt-in flag, Browser Run
binding, D1 backing and exact trusted render-source URL, the tool is omitted
from MCP discovery. Existing design tools remain available.

When all gates are intentionally enabled, the tool takes an owner-scoped
`design-...` ID and a preview width from 180–600 (default 360), reads the
stored recipe only through the authenticated owner and D1/R2 index, charges an
**atomic 6 renders per account per UTC day** SQLite allowance, and launches
Cloudflare Playwright on a **trusted static ROYGBIV origin**. It returns a real
`image/png` MCP image content part plus concise metadata, not an invented
image or screenshot of the editor. The canonical PNG retains its recipe
metadata; image size is limited to 3 MiB. Browser sessions have an outer Cloudflare Browser Run `allowedDomains` guardrail\nrestricted to the exact trusted source hostname (requires\n`@cloudflare/playwright >=1.3.6`). Browser navigation rejects\nredirects, page-level requests are also limited to same-origin GETs without query\nparameters, service workers are disabled, and the paint is limited to a
45-second evaluation. A failed render also consumes a quota slot.

**Source and packaging proof:** [Cloudflare-specific pure tests and real
Wrangler dry-run #40617172299](https://github.com/gamesbyian/wallgen/actions/runs/40617172299)
passed on the PR branch after a lockfile-free npm install. This proves
package resolution and bundling, **not** a Browser Run launch or rendered PNG.

**Browser usage budget (28 October 2026):** Cloudflare's published
[Browser Run pricing](https://developers.cloudflare.com/browser-run/pricing/)
includes 10 minutes of Browser Run time per day on Workers Free, with
no billable overage, and an included monthly allowance with paid overage
on Workers Paid. The actual account billing tier and historical usage
have **not** been verified. The default owner-scoped preview allowance
is now **six launches per UTC day**, rather than sixteen, to avoid
normalizing a potentially expensive burst. This is a conservative
request-count bound, **not a certified financial limit**: sessions vary
in runtime; browser usage from other applications and Quick Actions
shares the account's plan. A 120-second global single-browser lease
and a strict render timeout further reduce, but cannot eliminate,
wasted usage. Before enabling this feature, independently check the
Cloudflare Dashboard's Compute > Browser Run usage and billing settings.
Do not claim a price or a free guarantee for a specific account.

**Global Browser Run lease:** one D1 row, created by
`migrations/0003_preview_leases.sql`, now serializes all hosted
preview renders across Workers isolates. It is acquired after owner-scoped
recipe retrieval but before the paid daily allowance charge. A second
overlapping request receives a retryable refusal **without consuming a
preview quota slot**. A 120-second lease expires on crash, and a stale
holder's token cannot release a successor's lease. The active holder
releases in `finally`; any release failure is logged without rendering
private data. **Migration 0003 applied to live D1 and probed**: a synthetic test acquired token `old`, overlapping `blocked` returned no row, a timestamp beyond TTL acquired `new`, and the stale old-token delete changed zero rows. The synthetic row was removed. This is a
cost and concurrency guard, not a full queue/fair-scheduling service.

**Activation requires independent acceptance**:
1. Confirm the public Pages static bundle at
   `https://gamesbyian.github.io/wallgen/` actually serves the **same renderer
   revision as the Worker**, with no analytics or third-party dependencies
   that would see private recipe data. This is an example origin, not a
   verified current deployment.
2. **Applied 27 October 2026:** migration `0002_preview_usage.sql`'s table
   and index now exist in the live owner-scoped D1 database. A synthetic
   owner/day demonstrated the exact atomic UPSERT `RETURNING` sequence
   `used=1`, `used=2`, then **no row returned** at limit 2; the
   synthetic row was removed. The real scheduled cleanup and UTC reset
   have not yet been observed through the deployed Worker.
3. In the operator's Cloudflare deployment, add `[browser] binding = "BROWSER"`,
   `RENDER_SOURCE_URL = "https://gamesbyian.github.io/wallgen/"` and\n   `RENDER_EXPECTED_SHA = "<exact published full commit SHA>"` under
   `[vars]`, then explicitly set `HOSTED_PREVIEW_ENABLED = "true"`.
   Preserve OAuth secrets, the auth service binding and R2's private state.
4. Exercise actual owner-authenticated `tools/list` and `roygbiv_preview`
   for several saved designs, verify visible pixels and parity against the
   local headless Chromium renderer at the same dimensions, test hostile
   IDs, missing auth, quota exhaustion, large PNGs and repeat calls.
5. Check current Cloudflare Browser Run quotas/billing before leaving it on.
   Release to ChatGPT only after successful host-level image display. A
   connector may need a refresh to discover the new tool.

No preview blobs are stored or made public by this initial path; each request
renders and returns its PNG directly through the authorized MCP response.
Full-resolution cloud export is still separate and unimplemented. Nothing in
source-only tests or a successful dry-run constitutes authentic Browser Run
pixel acceptance.

## Real staging endpoints and resources

- Authorization issuer: `https://roygbiv-auth.gamesbyian-roygbiv.workers.dev`
- OAuth redirect callback registered with GitHub: `https://roygbiv-auth.gamesbyian-roygbiv.workers.dev/callback`
- Remote MCP resource (enter this in a supported MCP-capable host): `https://roygbiv-mcp.gamesbyian-roygbiv.workers.dev/mcp`
- OAuth authorization metadata: `https://roygbiv-auth.gamesbyian-roygbiv.workers.dev/.well-known/oauth-authorization-server`
- MCP protected-resource metadata: `https://roygbiv-mcp.gamesbyian-roygbiv.workers.dev/.well-known/oauth-protected-resource/mcp`
- Auth Worker `roygbiv-auth` (module WorkerEntrypoint named export `AuthServer`): real OAuth provider code installed. Service-binding RPC `validateToken(resource,token)` available privately to the MCP Worker.
- Resource Worker `roygbiv-mcp`: remote Streamable HTTP via `OAuthResourceServer` and canonical `src/agent-api.js`, with discovery, compose, import, inspect, edit, vary and explore. Authenticated calls must carry resource-bound ROYGBIV access tokens. Never accept arbitrary upstream GitHub tokens as MCP bearer tokens.
- GitHub OAuth client ID `Ov23liZNOeOxpR5AeDc3` is a non-secret. The actual `GITHUB_CLIENT_SECRET` is stored in the auth Worker's **Cloudflare encrypted secret binding**; the separate `ALLOWED_GITHUB_IDS` secret admits only the owner's verified numeric GitHub account ID. Both bindings were re-verified **after** bundle replacement. No secret value was read, copied into GitHub, or returned to an agent.
- Cloudflare KV namespace `roygbiv-oauth` (binding `OAUTH_KV`): `c17832107d1d411bbf308a9f69d0ae66`. Holds OAuth state and encrypted grants/transactions per library contract.
- D1 `roygbiv-mcp` (binding `RECIPES`): `c08c128b-8ac3-419d-a1dc-aaae80ddbfbe`. `migrations/0001_init.sql` was applied through the live D1 API, and the `designs` table was verified.
- R2 `roygbiv-private-artifacts` (binding `PRIVATE_ARTIFACTS`): private bucket. Its managed `r2.dev` public domain is disabled; do not enable it.
- A daily 03:00 UTC Cron Trigger was installed on `roygbiv-mcp`. Source handler performs a bounded 30-day recipe-retention sweep (maximum 100 indexed records per invocation); real scheduled retention and failure-retry behavior have **not yet** been observed.
- Browser Run is deliberately **not bound** to the live Worker. Preview and 3024×6552 export tools are not registered in this staging rollout, and no paid Chromium jobs have been run.

## Live evidence

1. [One-shot live OAuth+MCP acceptance run #40611049584](https://github.com/gamesbyian/wallgen/actions/runs/40611049584): **PASS**. From an independent GitHub Actions runner, confirms OAuth issuer and token endpoint metadata; invalid OAuth client 400; MCP resource metadata; anonymous `tools/list` 401 with proper Bearer challenge; forged bearer 401 through the private auth service binding; DCR client registration; PKCE authorization request; real consent page with redirect hostname; deliberate consent denial, including issuer and state, without issuing a code; stolen/forged consent handle rejected without browser cookie; approved consent redirects to the correctly registered GitHub OAuth endpoint with PKCE. No actual GitHub login took place.
2. [Source and packaging proof #40606896435](https://github.com/gamesbyian/wallgen/actions/runs/40606896435): initial 6/6 mock security/owner-isolation tests and successful Wrangler dry-runs. The current, browser-free core Worker was separately bundled and deployed using the same source and Cloudflare API; no GitHub-hosted deployment token was required.
3. **Real Cloudflare API storage probes (27 Oct):** synthetic D1 `designs` row was inserted, queried with owner+id and deleted; synthetic private R2 object was uploaded, downloaded byte-for-byte and deleted. Both returned successful results and no personal/user data was written. These prove Cloudflare services and bindings exist; they were called directly through the management API, **not through an authenticated MCP Worker**. Do not claim end-to-end live user-tenant acceptance on this basis.
4. `npm run test:cloudflare`: six mock/pure tests for owner-scoped D1/R2 persistence, deterministic controls, oversized/invalid inputs, GitHub numeric-ID allowlist, dangerous consent HTML and fail-closed config. Mock tests do **not** substitute for independent live tenant-isolation testing.

The repeatable no-login smoke test is `python3 tests/cloudflare-live-oauth-denial.py`. It registers a short-lived test OAuth client through DCR, exercises consent and explicitly stops at GitHub's login boundary. It never follows the GitHub OAuth redirect, issues a user token or retrieves private data. The one-shot workflow that invoked it is removed before merging; the test remains available for explicit execution when necessary.

## Implementation contract and privacy

The standard local stdio MCP (`scripts/roygbiv-mcp.mjs`, [PR #829](https://github.com/gamesbyian/wallgen/pull/829)) remains available and is already accepted with real Chromium and native export.

The remote Worker uses the **same** canonical recipe API, model schema, editor taxonomy, lock semantics and scoped randomization. It does not build a parallel painter. Clients supply a brief and interact with ROYGBIV's actual controls. On the hosted path, D1 rows are keyed by `(owner,id)`; R2 object paths are generated from the verified OAuth account rather than model-supplied paths. The default service never provides unprotected object or download URLs. GitHub upstream access tokens are never persisted into the ROYGBIV grant or exposed to MCP clients.

`wallpaper:read` is the baseline required OAuth scope. Writes require `wallpaper:create` and can issue an OAuth insufficient-scope step-up challenge. The `wallpaper:export` scope is reserved for future render jobs. Users must explicitly consent per client, and the server enforces a strict verified GitHub ID allowlist. Cloudflare consent/upstream helper APIs bind handles and state to the browser, prevent framing, and enforce PKCE for public clients. Unknown identities and mismatched user paths are rejected.

The public Workers URLs are internet reachable for OAuth discovery and authorization; **that does not mean private designs are public**. Only an allowlisted GitHub login with resource-scoped tokens can access the tenant's MCP tools. Dynamic client registration itself is not an authenticated user account, so it grants no wallpaper data.

## Remaining gates before declaring a working hosted connector

1. **Owner's genuine authorization journey:** Connect `https://roygbiv-mcp.gamesbyian-roygbiv.workers.dev/mcp` in a compatible remote-MCP client, approve read/create permissions, finish GitHub login, return to the client, and verify `tools/list` and actual `roygbiv_compose`, `roygbiv_inspect`, `roygbiv_edit`, `roygbiv_explore` calls.
2. **Live privacy/integrity:** Validate real D1/R2 writes and reads, lock persistence, canonical recipe roundtrips, user A vs B account isolation with genuinely independent approved identities, token audience rejection, refresh/revocation and a write-scope upgrade. The invite-only allowlist is not a replacement for two-account acceptance.
3. **Rate limiting and cost controls:** Configure appropriate Cloudflare rate-limit rules, bounds on jobs/artifacts, error budgets and anti-abuse policies. Never publish an anonymous render endpoint.
4. **Real image preview:** Research `cloudflare/mcp/src/browser-render.js` as a separate cost-gated deployment; benchmark actual canonical pixels, text/font fidelity, recipe metadata and memory/time against the local Chromium reference before registration. Native Pixel 6 Pro export (3024×6552), signed private artifact download, cleanup and job/cancellation quotas remain subsequent work.
5. **Repeatable deployment:** The live Workers were uploaded using audited, Wrangler dry-run-built module bundles through the connected Cloudflare management API. OAuth secrets were inherited using explicit `inherit` bindings and verified. Future operator deployment via Wrangler:
   ```bash
   npm install
   npx wrangler deploy --config cloudflare/auth/wrangler.toml
   npx wrangler deploy --config cloudflare/mcp/wrangler.toml
   ```
   Each step must preserve existing Cloudflare Worker secrets, resource bindings and OAuth issuer URLs. Build a restricted service-token-based deployment workflow only after its permission scope, review gate and secret handling have been approved.

The current client is a **live, invite-only staging MCP endpoint**, not a public hosted wallpaper product and not a tested production-ready export service. Preserve this distinction in status reports, issue closure and user-facing instructions.

## References

- Cloudflare [OAuth Provider v1](https://github.com/cloudflare/workers-oauth-provider), [OAuth consent contract](https://github.com/cloudflare/workers-oauth-provider/blob/main/docs/consent-page.md), [split resource servers](https://github.com/cloudflare/workers-oauth-provider/blob/main/docs/resource-servers.md).
- [Hosted Browser Run](https://developers.cloudflare.com/browser-run/), [MCP 2026 authentication](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization).

## GitHub callback incident: 28 October 2026, 01:06 UTC

A real Claude connector authorization reached GitHub, but the user observed Cloudflare Worker HTTP 1101 after approving the GitHub OAuth application (Ray ID `a5160928ae3358f2`). This establishes that **actual completed sign-in has not yet passed**. Historical Cloudflare observability events could not be retrieved through the account API; the exact exception stage/root cause was not verified. PR #835 adds a guarded `/callback` error boundary with a stage-only HTTP 502 response and restricted log marker `roygbiv-oauth-callback-failed`, without disclosing GitHub codes, tokens, cookie state or a JavaScript stack to the client. The replacement bundled Worker was deployed through the connected Cloudflare account and both encrypted secret bindings and OAuth KV were rechecked. **This change improves error diagnosis; it does not establish that a full OAuth roundtrip is fixed.** The next actual sign-in attempt should be observed and any stage named by the response used for a precise fix. Do not treat previous pre-login acceptance as evidence of sign-in success.

## October 28 callback cause and correction

The owner repeated Claude authorization and received `ROYGBIV OAuth callback failed at complete-authorization`. Root cause: the callback supplied `userId:'github:'+user.id` to OAuth Provider v1.2 `completeAuthorization()`, but [the provider explicitly rejects user IDs containing `:`](https://github.com/cloudflare/workers-oauth-provider/blob/main/CHANGELOG.md) because `:` separates token/grant key components. The GitHub numeric ID was already verified against the Cloudflare allowlist, so the callback now passes `userId:String(user.id)` while preserving `props.userId='github:'+user.id` for ROYGBIV's owner-key namespace. A fresh bundle was dry-run-built, tested and uploaded to the existing live `roygbiv-auth` Worker using explicit encrypted-secret inheritance. Cloudflare confirmed both OAuth secret bindings survived. This fixes the demonstrated validation error, but **a real successful repeat Claude authorization and MCP tool call have not yet been observed**.

## ChatGPT reconnection scope failure (27 October, 19:26 MDT)

After successful Claude OAuth, the owner linked ROYGBIV in ChatGPT but invoking a write tool displayed `Reconnect ROYGBIV` followed by `Requested scopes are not allowed for connector`. The resource Worker formerly advertised only `wallpaper:read` as the required initial OAuth scope, and returned a later `insufficient_scope` challenge for `wallpaper:create`. ChatGPT can preserve the original connector scope set during reconnection, preventing the additional scope from being granted. The live resource Worker now requires **both** `wallpaper:read` and `wallpaper:create` at initial authorization, while preserving server-side scope validation for every tool. The compiled source was uploaded to Cloudflare and the auth service, D1 and private R2 bindings verified after upload. An existing ChatGPT link may retain old scope metadata: remove the ROYGBIV connection and create it again to refresh the allowed scopes. **A successful ChatGPT reconnect/tool call remains unverified.**

## Browser Run HTTP 429 investigation (28 October 2026 UTC)

The live ROYGBIV tool returned `Unable to create new browser: code: 429: message: Rate limit exceeded`. Cloudflare's [current limits](https://developers.cloudflare.com/browser-run/limits/) restrict **Workers Free browser sessions to one new launch every 20 seconds**, at most three concurrent sessions, and 10 minutes total browser duration per day. This generic 429 is distinct from the documented `Browser time limit exceeded for today` error. The operator's real D1 `preview_usage` database showed **four charged attempts out of ROYGBIV's six permitted UTC-day attempts** on 2026-10-28; Browser Run API session list showed **no active browser sessions** when checked. These observations rule out ROYGBIV's own six-per-day quota and a persistent active-session backlog, but cannot conclusively distinguish launch cadence from account-wide browser-duration exhaustion or an undocumented platform throttle. Billing/plan usage endpoint was inaccessible with the connected Cloudflare OAuth permissions, and no exact browser launch timestamps were available.

The source fix adds a D1-atomic `preview_launch_pacing` reservation across isolates, **21 seconds between launches** (before charging ROYGBIV's daily allowance), and distinguishes Cloudflare's launch-rate 429 from its daily browser-time 429 in operator-facing errors. The `0004_preview_launch_pacing.sql` table was successfully applied to the real D1 database.

**Deployment blocker:** The 4.3 MB browser-enabled Wrangler Worker bundle was built and tested, but the connected Cloudflare management transport returned an HTTP/2 body/connection error while uploading. Cloudflare's Worker list confirms `roygbiv-mcp` was **not updated** (modified timestamp remained 2026-10-28T04:45:49Z). Therefore the 21-second pacing and improved 429 messages are **source-complete but NOT LIVE** until a successful authenticated Wrangler deployment. Do not tell users the running connector contains this fix; the currently deployed preview endpoint may still return the original generic 429. No paid plan or unbounded retry was enabled. Temporary GitHub Actions packaging assets were removed. For normal deployment, use `npx wrangler deploy --config cloudflare/mcp/wrangler.toml` from this code revision, preserving live `BROWSER`, `RENDER_SOURCE_URL`, `RENDER_EXPECTED_SHA`, and `HOSTED_PREVIEW_ENABLED` values; the staging Wrangler file has its conservative preview default disabled and therefore requires explicit production variable preservation before deployment.

