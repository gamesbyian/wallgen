# ROYGBIV for LLM agents: local headless integration

**Status (27 October 2026):** local stdio MCP integration implemented on the feature branch. Hosted multi-user MCP, a ROYGBIV-in-app connector screen, automatic visual scoring, external model inference, and cross-session candidate storage are **not** implemented. Preserve this separation when describing the feature.

## Product outcome

A ChatGPT/Claude/Codex-like tool-capable agent receives a human art direction, discovers the actual editing vocabulary, creates canonical ROYGBIV recipes, explores bounded alternatives, receives **real renderer pixels** for visual assessment, adjusts chosen settings without violating locks, and exports an authentic full-resolution wallpaper with complete editable JSON recipe. ROYGBIV itself does not call or bill an LLM. The human supplies their chosen agent.

### Architecture and ownership

```
Human brief -> model/agent (maps language to supported settings)
                   |
                   v
      local MCP stdio tool calls (scripts/roygbiv-mcp.mjs)
                   |
                   v
  src/agent-api.js: recipe validation, composition, scoped variations
                   |
                   v
  src/model.js + src/editor-schema.js + src/scoped-random.js
                   |
                   v
  scripts/render-headless.mjs -> canonical Chromium painter
                   |
                   v
   preview PNG image-content / native PNG + JSON on local disk
```

There is **one** recipe/scene/renderer. Agent integration is a thin orchestration facade around current owners, never a new rasterizer, new composition dialect, hidden edit/history stack, or replacement for the mobile PWA. All variation candidates are complete, independent recipes that the existing editor can import. The MCP process does not mutate a running browser studio.

## Installation and launch

Requirements: **Node.js 20+**, npm, and Playwright Chromium. From the repo:

```bash
npm install
npx playwright install chromium
npm run mcp
```

The last command starts a process using stdio (not an HTTP server). It stays silent on stdout until an MCP host connects. Configure an MCP-capable desktop agent to spawn Node with an **absolute path** to `scripts/roygbiv-mcp.mjs` in this repository. For example, an MCP client configuration may use:

```json
{
  "mcpServers": {
    "roygbiv": {
      "command": "node",
      "args": ["/absolute/path/to/wallgen/scripts/roygbiv-mcp.mjs"]
    }
  }
}
```

Configuration formats differ by agent host. Do not paste this as a public remote connector URL. A browser-only ChatGPT conversation cannot invoke a local stdio service without a compatible tool bridge. Cloud ChatGPT and Claude web app connections require a **separately hosted and authenticated** remote service, which is future work.

Local agent integration does not create an account, listen on a public port, or transmit designs to ROYGBIV-operated servers. The chosen LLM host may receive prompts and any tool results according to that host's own privacy terms. Review those terms before putting personal art or fonts in a prompt.

## Tools available to the connected agent

| Tool | Result / role |
| --- | --- |
| `roygbiv_describe` | Authoritative editor categories, tools, known setting names, numeric bounds, enums, lockable IDs, resolution |
| `roygbiv_compose` | New normalized and portable recipe from an explicit style, seed, settings, and locks |
| `roygbiv_edit` | Precise one-recipe edit, with explicit lock/unlock; refuses protected changes |
| `roygbiv_vary` | Scoped single setting/tool/category reroll or nearby variation |
| `roygbiv_explore` | 1–12 deterministic children from selected categories; same base preserved |
| `roygbiv_inspect` | Full canonical recipe and structural scene summary |
| `roygbiv_preview` | Production-rendered PNG as **actual MCP image content**, width 180–600, correct design aspect ratio |
| `roygbiv_export` | Production PNG at **3024×6552** with embedded canonical recipe plus JSON sidecar; returns local filesystem paths |

Each tool returns structured JSON in a text content block (and image content for previews). Candidates are identified by a digest of canonical recipe bytes and retained in a bounded in-memory pool (at most 64 candidates per MCP process). A client disconnect/restart loses the candidate list, so export a selected recipe to preserve it. No silent remote backup.

**Scope:** agent-side textual art interpretation, visual preference judgement, aesthetic selection and image critique must come from the connected LLM, which can call these tools. ROYGBIV's own `inspect` report currently contains *structural* observations, not verified visible pixel counts, subjective beauty judgements or missing-colour detection. A future pixel-analysis tool must examine actual encoded render output before asserting seven-colour presence, edge passage, contrast, text legibility, etc.

**Validation:** unsupported setting names, invalid enums, unsupported numeric inputs and locked edits are reported as tool errors rather than quietly converting to defaults. Compound/array recipe fields still pass through the application's canonical normalizers and must be visually verified where their semantics matter. `roygbiv_describe` exposes broad canonical setting keys; an agent should inspect prerequisites, test small previews, and not assume that every dormant setting visibly affects every structure.

## A recommended agent journey

1. Read `roygbiv_describe`. Translate the user's natural-language preferences into actual `style` and supported settings. Do not invent settings.
2. Call `roygbiv_compose` with a stable explicit seed, preferences and locks. Use locks for requirements the user insists on.
3. Call `roygbiv_explore` for a handful of variants, no more than twelve in a call. Inspect promising candidate recipes when necessary.
4. Call `roygbiv_preview` for actual images; visually compare their composition to the brief, not just their metadata.
5. Use `roygbiv_edit` or `roygbiv_vary` for targeted improvements. Preserve already approved choices and never silently unlock constraints.
6. Call `roygbiv_export` only for the chosen design(s); share paths or transfer artifacts using capabilities of the agent host, not invented public URLs.

### Example brief

> Eight bold rainbow designs, black background, continuous wave-like lines, crisp rather than grainy; vary curve depth and spacing, but never change palette or background. Preview the best four, then export the winner.

The agent can compose with `geometry: "wave"`, `motif: "solid"`, `background: "black"`, `palette: "electric"`, and locks `["palette","background"]`; explore using Path and Stripes, preview, compare, refine and export. It should not claim to have generated previews until `roygbiv_preview` actually returned PNGs.

## Resource and privacy boundaries

- The MCP server **only uses stdio**. No network endpoint is opened by the MCP layer. The existing renderer starts an ephemeral **127.0.0.1** static server while Chromium renders.
- Preview width is restricted to 180–600 pixels. Output is genuine canonical 600:1300 aspect. Native resolution is only requested by the explicit export operation (19.8 megapixels).
- Exploration batch is capped at 12 candidates; 64 candidate slots per local session; setting payloads at 128 KiB. Rendering is one child process at a time per tool call, with a 180-second timeout. Host/client concurrency is not globally serialized; a production hosted server will need explicit job quotas.
- Preview inputs and files are kept under a private temporary directory and removed at process exit on a best-effort basis. Exports persist at `~/.roygbiv-agent/exports` (or `ROYGBIV_AGENT_OUTPUT_DIR` if set), are local and are **not** automatically deleted or uploaded.
- The tool does not open unrestricted filesystem paths from the agent. It accepts candidate IDs and canonical setting values, then generates filenames itself.
- No automatic activity recorder, model requests, telemetry, third-party fonts or source uploads. As in the studio, explicit user intent is required for unrelated backup/sharing operations.

## Verification

```bash
npm run test:agent
ROYGBIV_AGENT_RENDER_SMOKE=1 npm run test:agent
ROYGBIV_AGENT_RENDER_SMOKE=1 ROYGBIV_AGENT_NATIVE_SMOKE=1 npm run test:agent
```

The first run exercises deterministic Node operations and a real stdio MCP handshake/tool journey. The second additionally launches actual Chromium, checks the returned image payload, exact preview dimensions, and PNG embedded recipe round-trip. The third explicitly runs a **native 3024×6552** export and re-reads both artifacts. Chromium install is required for the latter two. In PowerShell, set environment variables via `$env:ROYGBIV_AGENT_RENDER_SMOKE='1'` before running the script.

The ordinary repo's `npm run check:quick` runs pure agent tests; heavyweight browser proof remains explicit/opt-in per the lean CI policy.

## Next bounded engineering increments

1. Validate the implemented local MCP interface with an actual Claude/Codex tool session and a real visual brief; verify image perception and user-facing output handoff, not just protocol parsing.
2. Improve agent-editable complex objects through typed schemas and explicit raw-source guards (text overlays, imported geometry, nested contours).
3. Add measured PNG diagnostics for useful mechanically provable claims (visible hue ink, crop, frame contacts, rendered text bounds). Never convert semantic intent into a fake image-quality score.
4. Offer an opt-in 'agent-ready recipe' export/import and concise 'Connect an agent' guidance inside the PWA, if a browser journey demonstrates demand.
5. Design a remote Streamable HTTP MCP service only with explicit per-user authorization, isolation, quotas, consent, private artifact expiration, and deploy costs. It must reuse the same tool implementations and renderer; no anonymous render farm.
6. Maintain user-directed persistent briefs/preferences through explicit saved documents, not a covert behavioural model.

**Exit boundary:** local tool capability and truthful image/export roundtrips can be software-complete independently of hosted OAuth, Android device acceptance, and subjective user approval. These are separately verifiable milestones.
