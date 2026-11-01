# Archived historical GitHub Actions workflows

Most original workflow YAML files were moved here verbatim on 2026-10-22; the retired one-shot preview-discovery release was added unchanged on 2026-10-31. All are inactive while outside `.github/workflows/`.

They were useful during particular mobile ergonomics, accessibility, geometry, texture, screenshot, recipe export and agent acceptance investigations. Most duplicate coverage in broader active/manual suites or run expensive Chromium and artifact uploads for narrowly scoped issues.

The underlying `tests/` and `scripts/` remain available. To reactivate a specific investigation, copy its YAML back under `.github/workflows/`, review its trigger and current branch assumptions, then dispatch it manually. Avoid restoring automatic PR triggers without a genuine ongoing need.

See [the normative CI standard](../CI-ENGINEERING-STANDARD.md), [the implementation audit](../CI-STANDARD-IMPLEMENTATION-2026-10-31.md) and [the pragmatic operating policy](../CI-OPERATIONS-2026-10-22.md). The archive is provenance, not a promise that every historical test is compatible with current UI semantics.

Archived YAML is historical evidence, not a drop-in safe workflow. Before reactivating one, review its current event conditions, token permissions, runner/dependency versions, source-ref assumptions and artifact provenance against the live CI engineering standard.
