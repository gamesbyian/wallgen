# Seeded exploratory Focus adversarial QA (20 October 2026)

## Scope

Independent negative testing under open entries #2, #11 and #15, following #280/#288/#305/#311/#324/#326/#333. Prior tests established static Focus/source parity and specific reversible workflows. This test probes **action ordering** with a reproducible pseudorandom sequence rather than pretending it is a human unscripted session.

## Reproducible actual-browser trials

`tests/independent-focus-seeded-exploration.mjs` uses Playwright Chromium to execute three complete, 55-action sessions (**165 interactions** planned) over a Paths/Wave cream phone, Radial/Pinwheel dark short landscape, and Regions/Voronoi dark phone. Seeds and initial recipes are fixed and logged.

All actions are actual UI clicks or native keyboard events: selecting enabled categories and named tools, opening/closing optional Focus, choosing active source parameter chips, native range-arrow and +/- edits, source lock/unlock, and returning to All. After **every action**, assert the exact Focus chip/source range inventory, one selected chip, actual value, disabled/inactive/locked treatment, accessible slider name, explanatory help and normalized URL recipe. Navigation-only actions must not change any field of the recipe. All browser exceptions and failed assertion step/action history are recorded. Screenshots capture multiple checkpoints.

The suite requires substantive action diversity rather than allowing a vacuous sequence. However, deterministic randomized browser exploration is **not** a human exploratory session, a comprehensive GUI model checker, optical/aesthetic candidate approval, physical Android or actual TalkBack spoken output. The master acceptance boxes remain unchecked.

No runtime product edit is justified until an independent exact-head CI result establishes a failing counterexample. The new dedicated workflow uploads JSON and screenshots; first run is pending.
