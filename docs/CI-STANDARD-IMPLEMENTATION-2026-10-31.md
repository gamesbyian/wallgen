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
4. **Least-privilege declarations.** Manual headless, native gallery and seven-vibes suites now declare read-only contents permissions. No new write-enabled runner or secret-bearing untrusted PR path is introduced.

## Residual and measured follow-up

- **Legacy Pages duplication is outside workflow source control.** The repeated dynamic `pages build and deployment` run is generated by repository Pages settings. Set **Settings → Pages → Build and deployment → Source = GitHub Actions** and ensure no legacy build remains; verify the next main push generates only the intended `Publish Wallgen` flow. Do not delete the bespoke workflow: it deliberately stamps and publishes the separately trusted renderer.
- **No verified speedup yet.** Compare a docs-only PR to an ordinary code PR after this branch's CI runs, using first attempt success, job duration and runner minutes. Expected: docs-only bypasses the broad quick Node command, but this is **predicted, not yet measured**.
- **Broad quick suite remains broad by design.** Further sub-system slicing requires evidence that omitted negative, export, state and security coverage is independent; introduce precise module dependencies and benchmark guarded test groups before altering it. The many separate Node `--test` processes may be optimizable, but batching changes isolation and concurrency; test rather than assume.
- **Unoptimized optional heavy suites** repeat some full static checks and browser provisioning. They're manual, so any compression needs actual run timings, fixtures and failure-yield comparisons. Prefer retiring completed one-shot optical triggers, as agents have been doing, over turning their recipes into recurring CI.
- **Runner-level reports.** CI diagnostics cannot recover steps that fail before checkout; fully qualified JUnit/SARIF and historical flake/duration telemetry remain future improvements. Avoid fabricated failure-line numbers or assertion classifications.
- **Required-context protection/rulesets.** The repo's intended consistently present context is `Validate Wallgen / test`; check the repository's actual branch rules after merge to ensure no obsolete specialized check is required. Path filtering the entire required workflow would be unsafe.
- **Rollback:** revert the PR to restore ordinary always-quick PR checks; leave hosted source pins and renderer release checks untouched.

Do not conflate a passing Node suite with actual device touch, headless PNG art judgement, authenticated preview access, or source-preserving export proof.
