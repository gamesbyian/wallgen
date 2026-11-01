# CI standard implementation and audit, 31 October 2026

**Scope:** ROYGBIV / `gamesbyian/wallgen`. Engineering standard: [CI-ENGINEERING-STANDARD.md](CI-ENGINEERING-STANDARD.md). Live baseline was `main` at `964670e559321cab523199a8d2b9c327c502e498`. This is an evidence snapshot, not a permanent CI status claim.

## Observed baseline

GitHub Actions first 100 runs queried at the above baseline, **2026-10-31 22:53 through 2026-11-01 00:05 UTC** (a high-activity 72-minute window, not a statistically representative month):

| Workflow/event | Runs | Outcome distribution | Observed elapsed time |
| --- | ---: | --- | --- |
| Validate Wallgen, PR | 44 | 30 success, 13 cancelled, 1 failure | median 78s, mean 70s |
| Publish Wallgen, main push | 12 | 9 success, 3 cancelled | median 91s, mean 84s |
| Legacy `pages build and deployment`, dynamic | 12 | 10 success, 2 cancelled | median 44s, mean 50s |
| All recorded events | 100 | 63 success, 19 cancelled, 18 failure | Not comparable: includes isolated optical experiments |

These are **event creation-to-last-update durations**, not job runtime, billed minutes, queue time or critical-path CPU time. Many optical failures were intentionally iterative one-shot experimental runs, not standing PR regressions. No warm/cold cache claim or throughput speedup is inferred. [Recent example of duplicate Pages events](https://github.com/gamesbyian/wallgen/actions/runs/41255221631) and [legacy dynamic event for the same commit](https://github.com/gamesbyian/wallgen/actions/runs/41255221275).

At baseline the active workflow directory held **22** YAML definitions. The source policy test `tests/ci-workflow-policy.test.mjs` expected only the 13-workflow menu described by the historical October 22 policy and was not itself on the default PR gate. Thus historical additions to workflow dispatchers could evade the test. The PR quick command contains many purpose-specific Node cases and browser/optical suites are intentionally opt-in. Treat its existing broad source gate as an established correctness boundary until a selector can prove narrower equivalence.

## Event-to-evidence map after this change

| Event / suite | Required evidence | Trigger policy / trust |
| --- | --- | --- |
| All PRs: `Validate Wallgen / test` | CI policy + selector self-tests on **every** PR; docs-only changes finish there; code/config/CI/assets/mixed/unknown run `check:quick` | No workflow-level path filters. Stable job/context. Forks have only read token. Missing SHA/diff is **quick**, not a skipped gate |
| Manual `Validate Wallgen` | Same policy test + opt-in `check` when depth is full | No automatic browser or full-suite fanout |
| Every main push: `Publish Wallgen` | Quick sanity before publication; exact live commit marker, separately pinned immutable renderer bundle, Pages artifact/deployment | Publish deliberately remains independent of a preceding PR result because direct pushes are possible and published code has privacy/trusted-source duties |
| Narrow raster sources: `Build logo raster assets` | Generate deterministic PNGs and push only if bytes change | Scope to the small logo paths; write permission remains necessary; follow-up checkout/ref race hardening is a separate review |
| Narrow promotion script PR: `Promote independently inspected source screenshots` | Pinned review artifact and exact SHA/source provenance check | Write-enabled, same-repository-head guarded. Review before expanding triggers |
| Explicit manual hosted release | Build, source-revision gates, owner confirmation and separate credential/preview controls | No new implicit paid Cloudflare deployment |
| Remaining specialized manual workflows | Real Chromium/optical/geometry/reconstruction/atlas, full-size render and art-asset evidence | No automatic PR activation. Dispatch individually against relevant exact refs |

The previously automatic **one-shot preview discovery** deployment workflow is now preserved unchanged in `docs/ci-archive/workflows/` rather than remaining an executable, credentialed `push` hook. The owner-gated hosted release workflow remains available. The active menu is **21** workflows, including **17** specialist manual-only suites and four operational workflows; no browser or full-resolution art workflow is added to routine PRs.

## Implemented safety and efficiency

1. **Fail-closed risk selection.** `scripts/ci-select.mjs` parses NUL-delimited Git diff name/status between the actual PR base and checkout, evaluates both sides of renames, and accepts only explicitly narrow Markdown paths as documentation-only. `AGENTS.md`, the CI standard, YAML, scripts, source, tests, dependency manifests, assets, mixed diffs and unknown statuses retain `check:quick`. An unavailable or malformed diff also retains `check:quick`. Manual full remains full.
2. **Self-tested dispatcher.** Offline tests cover added/modified docs, cross-boundary renames, mixed changes, changes to CI/dependencies/build code, malformed diffs, missing base, exceptions, manual full and merge-group/non-PR fallback. The CI workflow policy test is now mandatory on every PR and checks the actual active menu and critical event/permission rules.
3. **Actionable diagnostics.** `scripts/ci-evidence.mjs` runs the existing commands with their original exit status, emits compact GitHub summaries, and on failure writes a versioned JSON digest with exact SHA, job/run link, bounded redacted log excerpt, first relevant error, command, timing and evidence classification. Failed PRs upload only small diagnostic JSON; normal success uploads no artifact. A setup failure before checkout may only be diagnosable in GitHub's job log, and is not presented as a tested assertion.
4. **Least-privilege and independent evidence.** Manual headless, native gallery and seven-vibes suites now declare read-only contents permissions. Explicit UI-atlas and visual-agent manual runs are never canceled by another request on the same ref, and logo-raster branch writes are serialized rather than raced or canceled. No new write-enabled runner or secret-bearing untrusted PR path is introduced.

## Residual and measured follow-up

- **Legacy Pages duplication is outside workflow source control.** The repeated dynamic `pages build and deployment` run is generated by repository Pages settings. Set **Settings → Pages → Build and deployment → Source = GitHub Actions** and ensure no legacy build remains; verify the next main push generates only the intended `Publish Wallgen` flow. Do not delete the bespoke workflow: it deliberately stamps and publishes the separately trusted renderer.
- **No verified speedup yet.** Compare a docs-only PR to an ordinary code PR after this branch's CI runs, using first attempt success, job duration and runner minutes. Expected: docs-only bypasses the broad quick Node command, but this is **predicted, not yet measured**.
- **Broad quick suite remains broad by design.** Further sub-system slicing requires evidence that omitted negative, export, state and security coverage is independent; introduce precise module dependencies and benchmark guarded test groups before altering it. The many separate Node `--test` processes may be optimizable, but batching changes isolation and concurrency; test rather than assume.
- **Unoptimized optional heavy suites** repeat some full static checks and browser provisioning. They're manual, so any compression needs actual run timings, fixtures and failure-yield comparisons. Prefer retiring completed one-shot optical triggers, as agents have been doing, over turning their recipes into recurring CI.
- **Runner-level reports.** CI diagnostics cannot recover steps that fail before checkout; fully qualified JUnit/SARIF and historical flake/duration telemetry remain future improvements. Avoid fabricated failure-line numbers or assertion classifications.
- **Required-context protection/rulesets.** The repo's intended consistently present context is `Validate Wallgen / test`; check the repository's actual branch rules after merge to ensure no obsolete specialized check is required. Path filtering the entire required workflow would be unsafe.
- **Rollback:** revert the PR to restore ordinary always-quick PR checks; leave hosted source pins and renderer release checks untouched.

Do not conflate a passing Node suite with actual device touch, headless PNG art judgement, authenticated preview access, or source-preserving export proof.

## Second implementation slice: exact main-push verification selection

The initial PR gate has now passed [the real code/CI change run #41256856336](https://github.com/gamesbyian/wallgen/actions/runs/41256856336) and the post-merge documentation-only [run #41257029757](https://github.com/gamesbyian/wallgen/actions/runs/41257029757). Their respective completed job elapsed times were **80s and 6s** (full quick step **71s** on the former; docs-tier policy-only job on the latter). These are two different change types, not a controlled same-workload benchmark. The docs-only route genuinely executed policy tests and skipped the source suite, while retaining a green stable required context.

A second focused CI change reuses the same fail-closed classifier for the main Pages publisher. It compares the exact GitHub push `before` SHA to the checked-out commit, only on `refs/heads/main` with an explicit publishing-workflow opt-in. All-zero, absent, unreachable or ambiguous ancestors and any non-Markdown, mixed, CI/dependency, manual or other branch event retain `check:quick`. The dedicated selector/policy tests run before deciding.

A Markdown-only Pages push **still publishes**: the exact main source stamp, immutable trusted-renderer archive, and Pages upload/deployment steps remain unconditional. This removes only redundant Node app tests for content which cannot affect the runtime. The separate legacy dynamic Pages workflow remains a repository-settings issue [#940](https://github.com/gamesbyian/wallgen/issues/940). The new main-push fast route must not be described as production-verified until a genuine docs-only main push runs.

## Pages source configuration follow-up

The repository owner reports changing **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The setting itself is external to this repository. Verify that a new main push launches only the intended `Publish Wallgen` workflow and that the actual Pages deployment succeeds before claiming the duplicate dynamic workflow is retired. Track the external verification in issue #940.


## Generated-logo source authority and dispatch consolidation (PR #945, #946)

Merged [#945](https://github.com/gamesbyian/wallgen/pull/945) guards the former logo-publishing bot against concurrent source revisions; its required exact-head quick CI [#41261755682](https://github.com/gamesbyian/wallgen/actions/runs/41261755682) passed. A deeper audit then found the standalone JavaScript rasterizer had its **own divergent hand-transcribed stripe endpoints** rather than reading the actual two SVG logo files. Merely preventing a stale branch push did not fix source-to-output correctness.

[#946](https://github.com/gamesbyian/wallgen/pull/946) replaces those duplicate paths with SVG-authoritative source parsing and deterministic RGBA rendering; a source path/color edit changes the output, and unsupported SVG primitives fail visibly. The source-drift/PNG tests join the quick gate. The former write-enabled raster-bot workflow is archived and removed from active Actions; the existing Pages publisher now renders PNG PWA fallbacks from the same source SVGs before uploading its artifact. This also eliminates an extra branch write and redundant triggered workflow. Local static-server users are instructed to run the raster generation command when checking out new icon SVG revisions.

**Status at authoring:** PR #946 pending exact-head CI, integration and a published Pages artifact check. No runner-minute savings, live Pages icon acceptance, or resolution of arbitrary future SVG syntax has yet been claimed. Existing checked-in PNG companions remain historical snapshots; deployed Pages PNGs are generated afresh. Review an actual Pages deployment after merge and compare one generated icon to the current SVG before marking this phase production-verified.
