# Hosted ROYGBIV MCP: Cloudflare deployment engineering (27 Oct 2026)

## Status: PRE-DEPLOYMENT FOUNDATION ONLY

The code under `cloudflare/` provides a Cloudflare Workers **split authorization/resource server scaffold**, GitHub OAuth sign-in code with fail-closed configuration, a Streamable HTTP MCP tool catalog for canonical non-rendering design operations, and D1+R2 owner-scoped private recipe persistence. It is NOT an operational live OAuth acceptance, deployed public endpoint, working preview/export service or connected Claude/ChatGPT integration. **Do not deploy the templates as an end-user service or claim an authenticated end-to-end journey.**

The local stdio MCP in `scripts/roygbiv-mcp.mjs` remains the actually accepted, production-Chromium reference (PR #829). The hosted code reuses `src/agent-api.js`, `src/model.js`, and `src/scoped-random.js`, never another painter.

## Architecture and current acceptance boundaries

1. `cloudflare/auth/src/index.js`: `OAuthAuthorizationServer` (Cloudflare Workers OAuth Provider v1 split-role library) for discovery, token issuance infrastructure and internal resource-token validation. The GitHub upstream OAuth code, verified numeric user-ID allowlist, per-client consent page, PKCE, browser-bound state and callback are **implemented but not live-tested**. All OAuth endpoints respond HTTP 503 until the provider URLs, approved numeric IDs, GitHub application ID and encrypted client secret are configured.
2. `cloudflare/mcp/src/index.js`: `OAuthResourceServer` validates resource-scoped tokens through the auth service binding, publishes protected-resource discovery and mounts `createMcpHandler` Streamable HTTP. Each request instantiates its own canonical tools and uses the authorized `ctx.props.userId` and scopes. No anonymous or global mutable candidate pool.
3. `cloudflare/mcp/src/storage.js`: D1 owner+candidate composite primary key and R2 user-prefixed private objects. Candidate IDs alone are insufficient to retrieve a recipe. The server never accepts storage keys, paths or R2 URLs from the model. Only current canonical v2 recipes are accepted; bounded inputs, strict imports and lock-aware edits.
4. `cloudflare/mcp/migrations/0001_init.sql`: metadata index, no plaintext OAuth credentials or prompts. `cloudflare/*/wrangler.toml`: config templates with deliberately invalid placeholder IDs and domains, and `workers_dev=false`.
5. Hosted preview and native export are intentionally **not registered** until the real Cloudflare Browser Run renderer has passed a 240×520 preview and 3024×6552 final PNG recipe roundtrip test with resource caps. A screenshot of the PWA UI is not a substitute. If Browser Run cannot satisfy dimensions/memory/serialization, use an isolated Chromium container behind a Cloudflare Queue.

## Security and privacy contract

- OAuth client identity, user identity and scopes must be verified on every request; `ctx.props.userId` is only trusted after the v1 provider has validated the token and sign-in consent stored trusted props.
- `wallpaper:read` for inspect/discovery, `wallpaper:create` for compose/import/edit/vary/explore, `wallpaper:export` reserved for future export jobs.
- Sign-in is invite/allowlist-only at first. Each client must receive explicit consent naming scopes and destination origin, with secure session cookies, anti-CSRF measures, PKCE and resource binding. Never treat a caller-supplied email, arbitrary header or MCP parameter as verified identity.
- R2 bucket is private. Never attach a public `r2.dev` endpoint. Download URLs require expiring, user-scoped signatures or authenticated proxy. Automatic artifact retention/purge must be proven before rendering starts.
- Render cost limits, account quotas, cancellation, input limits, abuse monitoring and artifact expiry are mandatory before public release.
- No public anonymous account, blanket Google Drive permissions, private font upload, model-powered training, or third-party analytics by default.

## Deployment prerequisites (human Cloudflare access required)

1. Provision one Cloudflare account and, eventually, hostnames `auth.<domain>` and `mcp.<domain>` over TLS. A single authorized Workers domain can be used for initial integration, with verified exact origins.
2. Create `OAUTH_KV`, a D1 database named `roygbiv-mcp`, and a **private** R2 bucket named `roygbiv-private-artifacts`. Place actual binding IDs into the two Wrangler configurations, never into user-visible messages or sample commits.
3. Create a **GitHub OAuth application**. Set its callback URL to `https://<auth-host>/callback`. Configure `GITHUB_CLIENT_ID` in the Auth Worker Wrangler vars; store `GITHUB_CLIENT_SECRET` via `wrangler secret put`. Store `ALLOWED_GITHUB_IDS` as a comma-separated list of verified **numeric GitHub user IDs** in a secret (never a login display string). `/authorize` uses the Cloudflare provider consent and upstream-state APIs and refuses unknown accounts, but this must be exercised with real GitHub and Cloudflare identities before publishing.
4. Replace both `REPLACE-AUTH-HOST` and `REPLACE-MCP-HOST` with the verified canonical hosts. Auth resource audiences and MCP metadata must agree exactly.
5. Apply `0001_init.sql` to D1 and configure the auth Worker service binding name `roygbiv-auth`. Start with **staging**, not public production. Deploy only after the sign-in and private-resource test gates are green.
6. Smoke-test unauthenticated 401 challenge, authorization discovery, PKCE flow, allowlist enforcement, consent deny/revoke, token expiry, audience rejection, step-up scope behavior, cross-user D1/R2 access denial, and actual Claude/ChatGPT MCP client discovery.
7. Implement and benchmark the render job backend, automatic cleanup, quotas and signed private handoff. Then activate render tool registration. Avoid passing full-resolution PNGs through the agent transcript.

Wrangler commands after the operator provisions the resources and replaces template placeholders:

```bash
npx wrangler d1 migrations apply roygbiv-mcp --config cloudflare/mcp/wrangler.toml --remote
npx wrangler deploy --config cloudflare/auth/wrangler.toml
npx wrangler deploy --config cloudflare/mcp/wrangler.toml
```

**These commands are not safe to run on the current scaffold** because the sign-in gate is intentionally disabled and the domains/IDs are placeholders. No deployment workflow is enabled; do not add a push-to-production action holding unrestricted tokens until the user explicitly authorizes account use and the security acceptance suite passes.

## Verification and milestones

Pure owner-scoped storage tests: `node --test tests/cloudflare-storage.test.js`. This uses a deterministic fake Cloudflare D1/R2 interface; it establishes application tenancy logic, not actual Cloudflare service security. A future Cloudflare Miniflare/workerd integration suite must exercise `OAuthResourceServer` with two independently authorized accounts.

**Delivered in this branch:** auth/resource boundaries, canonical MCP tool skeleton, private D1/R2 storage and privacy-safety spec. **Not delivered:** live-tested OAuth consent with real credentials, deployed service, actual hosted Chromium rendering, signed downloads, user quotas, browser client acceptance and automatic resource expiration.

Current provider references: [Workers OAuth Provider v1](https://developers.cloudflare.com/changelog/post/2026-10-01-workers-oauth-provider-1x/), [OAuth consent/security](https://developers.cloudflare.com/agents/model-context-protocol/guides/securing-mcp-server/), [MCP HTTP handler](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/serving/http.md), [Cloudflare Browser Run](https://developers.cloudflare.com/browser-run/get-started/).

**Retention implementation:** `cloudflare/mcp/src/storage.js` implements a bounded `purgeExpiredRecipes` sweep, invoked daily at 03:00 UTC via the MCP Worker's scheduled handler. It scans at most 100 expired metadata records per invocation, matches the exact owner-scoped R2 key and conditionally deletes D1 rows before removing the matching R2 object. This is designed to expire **recipes after 30 days**, not yet preview images/export artifacts (which are not implemented). A production retention audit must still demonstrate actual D1/R2 scheduled delivery and failure/retry semantics before release.

### OAuth configuration in the current branch

The GitHub authorization handler is now implemented using Cloudflare provider v1's `parseAuthRequest`, `describeConsent`, `beginConsent`, `approveConsent`, `beginUpstream`, `finishUpstream` and `completeAuthorization` APIs. It displays the client, scopes and validated redirect hostname with HTML escaping, binds upstream state to the browser, verifies the upstream GitHub profile and checks its immutable numeric ID against `ALLOWED_GITHUB_IDS`. The GitHub access token is **not saved in ROYGBIV props or shown to an agent**. Access tokens issued by ROYGBIV are resource scoped and carry only a verified `github:<id>` user identity. GitHub OAuth application credentials and actual Cloudflare hostnames have not been supplied or tested; the service must not be advertised as usable until end-to-end OAuth tests pass.

Configure secrets only in Cloudflare, e.g. `npx wrangler secret put GITHUB_CLIENT_SECRET --config cloudflare/auth/wrangler.toml` and `npx wrangler secret put ALLOWED_GITHUB_IDS --config cloudflare/auth/wrangler.toml`. The `AUTH_SERVER_URL` and `MCP_SERVER_URL` Wrangler vars must exactly match the live HTTPS hostnames and resource. Run `npm run test:cloudflare` for mock storage and pure auth safety tests. These tests do **not** assert genuine OAuth token issuance or Cloudflare Worker compatibility.
