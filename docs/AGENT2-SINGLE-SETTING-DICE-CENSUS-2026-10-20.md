# Agent 2 real Chromium single-setting randomizer census, 2026-10-20

**Scope:** standalone, original per-setting miniature dice in the ordinary editor; unlike direct field edits in merged #289, category/tool scope dice in pending #315, or the optional Focus inspector.

## Verifiable acceptance contract

The 40 canonical editor tools own 87 distinct source setting names. Four are **not** eligible miniature action witnesses: two optional material Enabled flags have no user-facing die and are controlled atomically by their material selectors; the legacy Tonal source field is unselectable; Geometry Safety is a deliberate editorial guardrail and the model never randomizes it. The remaining **83 source dice** are tested under **Reroll** and **Vary**, plus **8 original lock/unlock negative journeys**, for **174 real pointer-driven Chromium cases**.

Each fixture loads a source-normalized URL recipe with an applicable structure/geometry/construction and optional material layers, navigates to Edit → original category → named tool, asserts the die is visible, enabled and center-hittable, and clicks it. A full normalized recipe diff must contain only that setting, except the expressly atomic optional layer Enabled flag for material selectors. Seed, locks, position and camera fields must be untouched. The persistent global status must accurately report the action or an honest no-op, and the URL must change exactly when the source recipe does. Eight additional cases actually lock a source setting, require that both original field and die become disabled, then unlock and require exact whole-recipe restoration.

The test deliberately derives eligibility from `EDITOR_CATEGORIES` via `TOOL_LIST`, rather than maintaining a second renamed source-control list. Its conditional scene fixtures match the prior field action census, which successfully qualified 86 original source edits. This is the **third independently useful source-action level** after direct fields and Tool/Category actions.

**Status: COMMITTED, NOT YET VERIFIED.** Source artifact `tests/agent2-single-setting-die-matrix.mjs` is staged on its own controls-only branch. Do not claim the 174 journeys passed until all four independent Chromium shards pass at the exact head. No application or CSS changes are authorized by this test alone. Finish pending #315 integration first to avoid competing browser CI floods and source-control races.

**Limits:** Native Android physical taps, screen-reader speech and human visual approval remain separate. The inactive/dormant states are already tested independently and will not be credited as positive active-die actions.
