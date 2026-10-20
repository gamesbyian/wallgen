# Agent 2 canonical objective-forbidden canaries (2026-10-20)

This follow-on builds on merged #285, which browser-qualified all 121 required source candidates across the twelve canonical plates. The manifest also includes 27 forbidden claims, many about subjective visual composition and non-automatable interpretations. Do not count the word “forbidden” as proof of a testable absence.

The real Chromium canonical plate probe now actively falsifies six bounded, mechanically decidable forbidden behaviours:

1. Studio never grows an invented heading over the artwork or a top Fit button; the original Fit control remains on its canvas rail (two explicit source assertions plus positive relocation control).
2. Geometry's original editor card has no duplicate H2/H3 heading consuming space.
3. Colour does not fabricate a saturation form setting.
4. Compact Glow retains exactly the original `glow` source field instead of invented settings.
5. Diagonal mirror checkboxes remain nested inside their original native labels, not separated from the accessible label.
6. Search expansion retains the independently visible close action.

These tests use live 412×892 Chromium after clicking the original screen/tab/tool or opening search. Each checked negative has an error-on-counterexample, reports a `negativeCanaries` witness in the per-screen evidence and fails the shared Agent 2 browser workflow on regressions. Separate existing test suites handle Draw camera/source invariance, Material rotation clipping, Focus data locks, More status semantics, gallery restoration and exports. **The six checks do not qualify all 27 forbidden claims**: human evaluation of aesthetics, screenshot geometry and physical Android remain necessary. Do not check master acceptance entry #4 on this evidence alone.

Reproduce with `node tests/redesign-live-plate-coverage.mjs` against the actual app served on 4173. CI: `.github/workflows/agent2-controls-acceptance.yml`. Attach failing screenshots and the entire JSON evidence to the PR if a counterexample is found. No production code or CSS is modified.
