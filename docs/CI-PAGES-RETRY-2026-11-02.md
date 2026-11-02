# Pages publication: one artifact per run, independently retryable deployment

**Observed on 2 November 2026.** This document records a specific external GitHub Pages failure and the narrow structural mitigation, not an art-renderer regression or a general claim of deployment reliability.

## Failure that prompted the change

The [main commit `9ce3442d` publisher (run 41537314015)](https://github.com/gamesbyian/wallgen/actions/runs/41537314015) passed its source sanity, generated logo raster files, stamped the exact main revision, assembled the separately pinned trusted renderer and uploaded the `github-pages` artifact (ID `13185141982`). The subsequent `actions/deploy-pages@v4` step failed **HTTP 400** while creating the deployment: `Unable to find artifact mathching the id`. Its artifact exists in the Actions artifacts API; the error occurred between successful upload/metadata lookup and Pages deployment creation.

A **whole-job retry** of that old monolithic publisher correctly rebuilt the same SHA but uploaded a second `github-pages` artifact (ID `13186845958`) into the **same workflow run**. Deployment then failed deterministically with `Multiple artifacts named "github-pages" were unexpectedly found for this workflow run. Artifact count is 2.` This is not evidence of bad renderer pixels or a failing Node suite, and rerunning this old job yet again would compound the duplicated-artifact ambiguity.

Similar intermittent artifact/deployment service errors have been [reported upstream in `actions/deploy-pages` issue #418](https://github.com/actions/deploy-pages/issues/418); this log does **not** establish which GitHub backend component caused this particular first HTTP 400.

## Verified recovery and acceptance

[PR #1025](https://github.com/gamesbyian/wallgen/pull/1025) merged at `da87df2bf4863fc354424031b36a2f976c42e789` after [required CI success #41540515777](https://github.com/gamesbyian/wallgen/actions/runs/41540515777). The *new* independent [main publish #41540788647](https://github.com/gamesbyian/wallgen/actions/runs/41540788647) completed successfully with **both `build` and `deploy` green**. Its `Verify public deployed artifacts` step fetched and compared actual public bytes, reporting:

`Published Pages source, renderer pin and source/editor/worker bytes and SVG-derived PNGs verified: da87df2bf4863fc354424031b36a2f976c42e789 at https://gamesbyian.github.io/wallgen/`

This proves the replacement workflow's actual Pages result at that SHA, including the separately immutable trusted renderer, but does not prove that a *future failed deploy-only retry* has yet occurred, nor Cloudflare/ChatGPT hosted preview, physical Pixel rendering or human approval. The old failed run remains valuable negative evidence, not an unresolved current publishing outage.

## Corrected workflow lifecycle

The existing single `Publish Wallgen` workflow (`.github/workflows/pages.yml`) now contains **two serial jobs**, not another workflow:

1. `build` checks out exact main, performs the existing conservative risk selection and application sanity, builds logos, stamps the live commit, materializes the immutable trusted renderer, and uploads exactly **one** `github-pages` artifact. Its failure digest remains independently available.
2. `deploy` has `needs: build`, targets the protected `github-pages` environment with the existing `pages:write` and `id-token:write` permissions, and calls `actions/deploy-pages@v4` against that completed artifact. It checks out the same exact workflow SHA and regenerates the deterministic SVG-derived logo PNGs solely for the **existing** strict post-deployment public byte/revision comparison. It performs **no Pages artifact upload**, so retrying just this failed job cannot create a second artifact.

All ordinary main pushes and manual dispatches still perform full successful publication, including the trusted renderer pin and public `src/app.js`, model, renderer, worker and generated PNG byte checks. A passing build is never presented as a successful public deployment. No Cloudflare credential, paid rendering service, private design, application painter, recipe, schema, editor interaction or deployment source setting is changed.

The required PR policy tests assert the two-job dependency, one Pages upload, no upload in the retryable deploy job, the original public byte/revision checker and separate build/deploy failure digests.

## Incident handling

When `Publish Wallgen / deploy` fails transiently, inspect its actual logs and artifact inventory. If the sole `github-pages` artifact is present and the build passed, **rerun only the failed deploy job**, never the entire workflow. A later new main push creates a distinct run with its own single artifact. If a deployment reports success but the public checker finds a stale or missing SHA or asset, leave the run red and investigate CDN/live bytes instead of weakening the verifier.

Track successful **end-to-end** current-main publication separately from required PR CI. Real Pixel PWA performance and Cloudflare preview are different gates. Do not assert this mitigation cured the external GitHub failure until a new real `Publish Wallgen` run actually deploys and independently verifies its public bytes.
