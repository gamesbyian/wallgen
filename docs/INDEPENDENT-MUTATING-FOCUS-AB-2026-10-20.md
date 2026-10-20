# Independent mutating Focus vs All keyboard A/B (20 October 2026)

## Question

The merged inventory #311 established that Focus represents 178 runtime source-range states correctly, but its 182 tool visits did **not actively mutate** each sampled range. A falsifiable remaining risk is that Focus's delegated input/change events produce a different serialized recipe than native keyboard editing of the original source input, or that a reverse edit fails to restore the same settings.

## Protocol

`tests/independent-focus-mutating-ab.mjs` opens two actual Chromium sessions at the same source recipe and screen dimensions: one All inspector, one optional Focus. It covers five scene environments spanning Paths, Radial and Regions and both themes / portrait and constrained landscape.

The test visits enabled named tools in canonical categories and selects one interior-valued enabled source range per tool, capped at two tested tools per category in each scene. It actually focuses the original range and presses **ArrowRight** on the All session, then the Focus proxy and **ArrowRight** on the second session. It compares **full normalized decoded recipes**, not only the displayed numeric control; both sessions press **ArrowLeft** and must restore the identical initial recipe. It then exits Focus and verifies unmodified All state. No direct DOM input dispatch is used. Every inapplicable field is excluded from positive counts and recorded as a skip. Test screenshots and structured failing step/source key are uploaded.

This is a limited but functional A/B, not a user preference study. Native Android, physical keyboard and spoken screen-reader behaviour remain unverified. Entries #2, #11 and #15 remain unchecked. **No results are credited until exact-head CI passes.**

## Final head-specific qualification

**Merged:** [PR #324](https://github.com/gamesbyian/wallgen/pull/324), squash
`443b73e01007c59fd1b544f68d0ffe6af238e0e3`.

At `7992bf879073edfe28d61142a548e627036238af`,
[CI 39481425339](https://github.com/gamesbyian/wallgen/actions/runs/39481425339)
passed syntax, npm tests and **23/23 native-key edit/reverse comparisons**
across **five paired real-Chromium scenes** (Paths 6+5, Radial 4,
Regions 4+4). All changed the entire normalized recipe identically
through original source and Focus proxy, and restored identical initial
recipes after real ArrowLeft and All exit. No browser page errors.

The [original red run 39480357407](https://github.com/gamesbyian/wallgen/actions/runs/39480357407)
established that the test had demanded five samples per structure when
Radial/Regions exposed only four applicable range-bearing tools. The
corrected gate retains at least four each and at least 20 overall.
This was a **test applicability quota error**, not an observed product
parity failure, and no test exceptions or production changes were used.

This still does **not** establish human preference for Focus versus All,
physical Android Chrome or screen-reader spoken output.
