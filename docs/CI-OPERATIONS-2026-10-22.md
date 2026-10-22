# CI operations and dispatch policy (2026-10-22)

## Why the policy changed

ROYGBIV retained dozens of individually valuable browser, touch-target, camera, visual, screenshot, metadata and PNG acceptance workflows. A change to a shared source file caused overlapping suites to launch in parallel, frequently reinstalling Playwright and Chromium. The geometry-library PR #434 triggered over thirty workflows; multiple later workflow runs were still queued when this policy was prepared. Queued or cancelled work is not a product-test failure or a pass.

Source precedents: Pathfinder-Game uses a central PR CI gate, per-PR cancellation of superseded revisions, separate main-push safety net, and scoped deep checks. Uniracers keeps ordinary builds small and explicitly dispatches heavyweight release production. ROYGBIV adopts the common trigger-budget principle without importing their unrelated build stacks.

## Automatic CI, deliberately small

| Workflow file | Trigger | Contract |
| --- | --- | --- |
| `check.yml` | Every PR, every main push, manual | Always run `npm run check`; PR superseded-run cancellation, never cancel main safety-net run |
| `mobile-browser.yml` | Relevant UI/logic PR paths, manual | Real mobile-browser smoke for UI changes |
| `headless-render.yml` | Renderer/source, CLI, and related PR paths, manual | Production headless render and export assertions |
| `agent3-mobile-acceptance.yml` | Broad editor/mobile/functional PR paths, manual | Consolidated independent mobile acceptance |
| `pages.yml` | Main push or manual | Publish production site; latest main publish supersedes stale deploy |
| `logo-raster.yml` | Logo-specific push paths or manual | Original raster assets workflow, unchanged |

The remaining **60 specialized workflows** are retained in `.github/workflows/` with their complete test jobs, scripts, artifact capture, and manual Actions `workflow_dispatch` entry. Their automatic PR/legacy feature-branch push triggers are intentionally retired; no test or artifact producer has been deleted. Their underlying test scripts continue to run under Node/Chromium on demand.

## Reviewer evidence matrix: run the right deep suite

- Renderer, masks, texture displacement, camera or recipe/export changes: automatic Headless render smoke plus applicable `agent3-world-pixels.yml`, `agent3-camera-conditional-export.yml`, `agent4-native-reimport.yml`, and full native export tests as needed.
- Mobile layout, touch geometry, dark/cream themes, draw/import, and accessibility: automatic Mobile browser and consolidated mobile acceptance, plus the owning `mobile-*.yml`, `visual-agent1.yml`, `independent-focus-a11y.yml` or `ui-screenshot-atlas.yml` where the change carries a relevant risk.
- Geometry library, imported shapes or persistent browser state: run branch-provided geometry-library browser workflow when available, confirm IndexedDB revision conflicts and safe restore, and retain human device approval as a separate gate.
- Release or nontrivial redesign: run selected visual atlas, native PNG and accessibility suites against the exact PR head. For production release, record which suites ran, their conclusion and exact SHA in the PR; do not mark an unexecuted optional suite green.
- Documentation-only PRs need the automatic `Validate Wallgen` gate; forcing dozens of browser suites for prose edits provides no relevant assurance.

To run a specialist suite: open GitHub **Actions**, select the named workflow, choose **Run workflow**, and select the PR branch. Confirm the resulting `head_sha` matches the revision being approved. If a manually invoked workflow is not defined on the default branch yet, use its branch PR/test instructions and avoid claiming it ran. Manual workflow dispatch on a branch can be queued behind runner-capacity constraints like any other run.

## Safety and failure handling

1. Distinguish queued/pending from completed failed. Inspect job logs for real failures; rerun only after classifying code failure, flaky test, infrastructure incident or stale commit.
2. Do not clear branch protection, fabricate green checks, remove evidence or merge drafts merely because the queue is long. Only the always-present `Validate Wallgen` check is suitable as a universally required status context; path-filtered workflows may legitimately be absent for unrelated PRs.
3. Do not add new independent automatic browser workflows without an evidence-based impact and runner-minute budget. Extend consolidated acceptance where practical; if a new automatic workflow is justified, update `tests/ci-workflow-policy.test.mjs` and this document together.
4. Automatic workflows use distinct name-and-PR/ref concurrency groups, cancelling earlier revisions of the same PR only. Main validation runs to completion; production Pages retains its existing deployment-specific group. Manual suites remain runnable.
5. Before release, compare the exact PR head against `main` and test compatibility of saved recipes, PNG metadata and persistent data. Integration confidence depends on executed checks and source-bound evidence, not on a green badge inherited from an outdated revision.
6. Old queued workflows created before this change will not be retroactively cancelled by a new YAML policy. Identify genuinely obsolete old runs in the Actions UI before selectively cancelling them; preserve publication and archival evidence. Do not bulk-cancel potentially active release or evidence-producing runs.
7. There are two deployment event families visible in the Actions feed: `Publish Wallgen` and GitHub's `pages build and deployment`. Check **Settings → Pages → Build and deployment → Source** and use **GitHub Actions** when `pages.yml` owns deployment, to avoid redundant branch-based Pages builds. This is a repository setting and is not changed by this PR.

## Audit / status

Baseline 2026-10-22: 66 workflow files. Four automatic PR entrypoints, three main-push entrypoints (Validate, Pages, logo-specific). Sixty manual-only specialized suites. Future workflow files default to manual-only unless they explicitly justify an expanded budget. `npm run check` includes the policy regression test.

The Actions queue is a scheduling state, not proof the source is healthy or broken. This PR does not assert that previously queued jobs completed, that every deep suite passed, or that runner capacity recovered.
