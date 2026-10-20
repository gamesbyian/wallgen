# Independent mutating Focus vs All keyboard A/B (20 October 2026)

## Question

The merged inventory #311 established that Focus represents 178 runtime source-range states correctly, but its 182 tool visits did **not actively mutate** each sampled range. A falsifiable remaining risk is that Focus's delegated input/change events produce a different serialized recipe than native keyboard editing of the original source input, or that a reverse edit fails to restore the same settings.

## Protocol

`tests/independent-focus-mutating-ab.mjs` opens two actual Chromium sessions at the same source recipe and screen dimensions: one All inspector, one optional Focus. It covers five scene environments spanning Paths, Radial and Regions and both themes / portrait and constrained landscape.

The test visits enabled named tools in canonical categories and selects one interior-valued enabled source range per tool, capped at two tested tools per category in each scene. It actually focuses the original range and presses **ArrowRight** on the All session, then the Focus proxy and **ArrowRight** on the second session. It compares **full normalized decoded recipes**, not only the displayed numeric control; both sessions press **ArrowLeft** and must restore the identical initial recipe. It then exits Focus and verifies unmodified All state. No direct DOM input dispatch is used. Every inapplicable field is excluded from positive counts and recorded as a skip. Test screenshots and structured failing step/source key are uploaded.

This is a limited but functional A/B, not a user preference study. Native Android, physical keyboard and spoken screen-reader behaviour remain unverified. Entries #2, #11 and #15 remain unchecked. **No results are credited until exact-head CI passes.**
