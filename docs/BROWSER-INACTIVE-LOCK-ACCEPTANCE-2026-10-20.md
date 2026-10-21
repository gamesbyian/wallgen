# Runtime inactive-value and lock acceptance

Date: 20 October 2026. Status: **finite source-control behavioural acceptance verified**. This does not certify every possible combination, physical Android, human comprehension or native screen-reader speech.

## What has actually been shown

The source UI must be honest when a setting is inapplicable. A mode-specific control is disabled, its **displayed effective value is zero or unchecked** without destroying its stored nonzero recipe, its original lock cannot be operated while dormant, and activating its parent again restores the exact authored value and previous lock. Every still-active original field remains editable and named; per-setting randomize buttons don't mislead users into rerolling a locked/inapplicable field. The master gate is about truthful original behaviour, not a promise of exhaustive testing of all combinations or a human linguistic study.

### Source-bound browser evidence

- [#284](https://github.com/gamesbyian/wallgen/pull/284) and [Chromium 39397023694](https://github.com/gamesbyian/wallgen/actions/runs/39397023694): original 20 source journeys cross active, locked, inactive and restored settings, exact stored and displayed zero-state separation.
- [#299](https://github.com/gamesbyian/wallgen/pull/299), [Chromium 39403426414](https://github.com/gamesbyian/wallgen/actions/runs/39403426414): 32/32 genuinely altered conditional parent fields with reversed changes, including Radial, Regions, Material strength zero, lighting, geometry, shadows and editor-only dependencies.
- [#315](https://github.com/gamesbyian/wallgen/pull/315), [Chromium 39479919993](https://github.com/gamesbyian/wallgen/actions/runs/39479919993): corrected originally enabled per-setting dice on imported *already dormant/locked* recipes, and tested early disabled state / unlock / restored enablement.
- [#289](https://github.com/gamesbyian/wallgen/pull/289): 86/86 currently enabled original `data-setting` input actions in the actual browser; one legacy Tonal field is correctly HTML-disabled and not counted. [#327](https://github.com/gamesbyian/wallgen/pull/327): 174/174 dynamically chosen individual dice actions with saved lock semantics.
- **New [#352](https://github.com/gamesbyian/wallgen/pull/352), [exact source CI 39537371189](https://github.com/gamesbyian/wallgen/actions/runs/39537371189): 50/50 browser journeys.** Ten different parent/child inapplicability mechanisms × five source viewport/theme profiles: 320 cream, 412 cream, 499 cream, 500 dark, and historical 700 dark. For each, a real user locks an applicable original setting, manipulates the *actual* parent driver into a dormant mode, observes a visibly `setting-inactive` source-labelled disabled control whose presented value is zero (or unchecked), verifies the dormant lock is disabled, restores the parent and exact preexisting locked source value, unlocks it, and compares the *entire* normalized recipe with the original. Screenshots on failures and complete evidence rows are retained. The browser script hard-fails on unlabeled dormant fields, forgotten locks, disabled-but-active values or unexpected mutation.

### Explicit boundaries

Human judgement of whether the language is immediately understandable has **not** occurred. Native Android actual touch, OS accessibility speech, every possible mode combination, all adaptive device font scalings, subjective visual styling and independent release usability approval remain separate. A comprehensible named disabled control to the browser is a *semantic/accessibility affordance*, not direct proof of human comprehension.

This closes the finite **truthful inactive/lock source-functionality** item only. Existing independent visual/adversarial/conditional plate signoffs are not upgraded by analogy. Production generation model and values have not been changed by this reconciliation.
