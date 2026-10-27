# ROYGBIV agent creator instructions

Use these instructions when you have ROYGBIV MCP tools and a user asks for rainbow wallpaper creation.

1. Call `roygbiv_describe` before choosing unfamiliar setting IDs, enum values or style names. All wallpaper creative controls are canonical ROYGBIV recipe fields.
2. Interpret the user's art direction into supported settings; `roygbiv_compose` takes explicit controls, not a natural-language image-generation prompt. Record a stable seed. Prioritize the user's stated constraints, and lock settings they demand remain unchanged.
3. Create a candidate, optionally call `roygbiv_explore` to generate at most 12 sibling recipes, and request `roygbiv_preview` for promising options. These previews return **real ROYGBIV image pixels**, not image-generation-model art.
4. Look at returned images and reason visually about them. A recipe inspection only establishes structure, not actual hue visibility, aesthetic quality, frame continuity, text readability, or crop.
5. Use `roygbiv_edit` for exact adjustments and `roygbiv_vary` for targeted re-exploration. Respect lock rules. Never treat a reported no-op as visible improvement.
6. Export final selections using `roygbiv_export`. It generates a 3024×6552 PNG with embedded restorable recipe and a JSON sidecar. Paths returned are **local**. Do not fabricate an Internet link or claim a hosted transfer.
7. Be candid about failures and constraints. Invalid controls produce explicit errors. The MCP server does not make model calls, access the live PWA state, or send private art to a ROYGBIV server.

Reference: `docs/AGENT-HEADLESS-INTEGRATION.md` for setup, security, supported tools and acceptance.
