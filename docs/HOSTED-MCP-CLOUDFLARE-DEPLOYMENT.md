# ROYGBIV hosted MCP on Cloudflare

**Live staging checkpoint: 27 October 2026, 18:48 MDT (00:48 UTC on 28 October)**

The two Cloudflare Workers have been **deployed to the owner's Cloudflare account**, and public OAuth discovery, unauthenticated MCP challenges, DCR registration, consent denial, CSRF rejection, and pre-login GitHub redirect have passed **real network acceptance**. The service is **not yet declared fully operational**: no owner completed a real GitHub login and no authorized end-to-end `tools/call` or live user-specific R2/D1 write has been demonstrated. Hosted PNG preview and native export are explicitly unavailable.

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
3. `npm run test:cloudflare`: six mock/pure tests for owner-scoped D1/R2 persistence, deterministic controls, oversized/invalid inputs, GitHub numeric-ID allowlist, dangerous consent HTML and fail-closed config. Mock tests do **not** substitute for independent live tenant-isolation testing.

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
