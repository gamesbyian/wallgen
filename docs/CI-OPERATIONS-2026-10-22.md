# Pragmatic CI for a personal wallpaper app

This policy supersedes the earlier release-style CI rules. ROYGBIV is a personal creative tool. A slight control-spacing regression is an annoyance to fix, not a safety-critical incident. The purpose of CI is to catch basic breakage cheaply, not to prove every pixel and interaction unchanged after every edit.

## What runs automatically

- **Pull requests:** only `Validate Wallgen` runs. It checks syntax of the core app modules and a small Node suite for recipes, scene composition, editor schema and PNG metadata, via `npm run check:quick`. No browser installation. No screenshots.
- **Main pushes:** the existing Pages publishing workflow runs one quick sanity check before deploying. It does not rerun all Node tests. The logo raster generator still runs for its narrowly scoped asset changes.
- **One specialized PR-only operation:** `promote-source-visual-plates.yml` retains its original, narrowly scoped, write-enabled source-evidence workflow. It only triggers when its own promotion script/workflow changes. It is not a general visual QA gate.

Ordinary PR changes no longer start browser smoke, dozens of rendered wallpaper variants, 17-suite mobile matrices, UI atlases or pixel-comparison campaigns. The regular PR path triggers **one job**.

## Deep tests, when they actually help

For major changes, use **Actions → Validate Wallgen → Run workflow → depth: full** to run `npm run check` (all Node tests, still no screenshots). The dedicated `mobile-browser.yml`, `headless-render.yml`, `agent3-mobile-acceptance.yml`, `visual-agent1.yml` and `ui-screenshot-atlas.yml` workflows remain available manually on the relevant branch. The two wallpaper-production and reference-asset workflows remain manually dispatchable.

Reasonable decisions:
- A text label, colour token, minor CSS spacing or isolated touch target change usually needs **only the quick check and a glance at the app**.
- A new rendering algorithm or geometry feature deserves the relevant local/Node tests and perhaps one targeted headless sample. A 30-image comparison matrix is optional.
- Import/export format, saved recipes or persistence migrations merit more attention, since losing user-created designs is costlier than a misaligned button.
- Use a detailed screenshot/touch matrix only when investigating a specific bug, making a sweeping editor redesign or deliberately reviewing visual fidelity.
- It is acceptable to merge a focused change with a known cosmetic limitation. Record material remaining defects without blocking unrelated work.
- A queued optional workflow is neither green nor red. Do not hold routine changes hostage to irrelevant jobs.

## Workflow archive

The repository accumulated 66 Actions definitions, many created to verify one-off ergonomic issues. This change keeps only 12 operational workflows under `.github/workflows`; the other 54 are moved **without content changes** to `docs/ci-archive/workflows/`. Their original scripts and tests remain in the repository. Archived YAML does not run, but can be restored deliberately if an old investigative technique becomes useful again.

Avoid adding a new automatic workflow for every bug. Extend a relevant test, run it locally or dispatch one of the existing specialized suites when warranted. Update `tests/ci-workflow-policy.test.mjs` if the workflow menu legitimately changes.

## Practical limits

- Don't claim a full visual or device regression review from a green quick check. Its limited scope is intentional.
- Never discard saved wallpaper recipes, library backups, or source evidence merely to make a test green.
- Branch protection must not require skipped, manual or path-filtered checks. If configured, use only the consistently present `Validate Wallgen` context.
- GitHub Pages may also be configured for a redundant legacy `pages build and deployment` flow. Set **Settings → Pages → Build and deployment → Source** to **GitHub Actions** if the repo's `pages.yml` is the intended publisher.
- Full historical test coverage is available via `npm run check`; it is diagnostic infrastructure, not an obligation on every PR.

The only enduring acceptance criterion for this personal project is that it stays fun and workable, and that valuable user-created artwork remains recoverable.
