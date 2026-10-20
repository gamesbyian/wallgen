# Independent Focus vs All Undo-history acceptance (20 October 2026)

The prior read-only Focus matrix (#311) and native-key edit/reverse comparison (#324) establish source value parity across numerous structures, but **do not demonstrate identical Undo history**. The Focus proxy forwards native range events through the canonical source input; a double checkpoint or stale proxy after Undo would violate the promised reversibility.

## Real-browser protocol

`tests/independent-focus-undo-history-ab.mjs` starts two independent real Chromium sessions from each of four identical deterministic recipes:

- Paths/Wave Geometry depth, cream 412×892.
- Paths/Linen Material strength, dark short landscape 700×412.
- Radial/Pinwheel ray count, dark 412×892.
- Regions/Voronoi jitter, cream 412×892.

With Edit and the exact named tool open, one session sends actual ArrowRight to its canonical All range. The other selects the same source key through Focus and sends actual ArrowRight to the Focus range. The resulting **entire normalized recipes** must match. Both then expose an enabled source Undo button reporting **exactly one history checkpoint**; one actual Undo click must restore the initial full recipe, empty the history stack, and leave Focus still active with source-backed value and output synchronized.

Screenshots, precise failing steps, browser errors and structured snapshots are uploaded by `.github/workflows/independent-focus-undo-history.yml`. Test remains diagnostic until exact-head CI is green. This is a bounded technical A/B, not human user preference, full WCAG, physical Android, or spoken screen-reader attestation. Acceptance entries #2, #11 and #15 remain unchecked.
