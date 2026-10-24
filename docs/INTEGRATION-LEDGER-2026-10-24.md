# Agent 3 verified merged-main integration ledger · 24 October 2026

**Code baseline verified:** GitHub `gamesbyian/wallgen` `main` at `c8c3644b09da71124953f98eed13bdb4ab41a999` (squash-merged #667 over squash-merged #668). This is a verified merge SHA rather than a forecast. Subsequent documentation commits may change the tip without changing this code baseline. Issue [#664](https://github.com/gamesbyian/wallgen/issues/664) remains open strictly for owner-dependent hardware and human evidence, not a fictional remaining browser release task.

## Actually integrated and inspected

| Landed PR and SHA | What shipped and what was verified |
| --- | --- |
| [#668](https://github.com/gamesbyian/wallgen/pull/668) `a376ef05424e0154a9288dd008cd0fe6f6d2a41d` | Opt-in canonical wave/arch/circle lettering, existing font resolver/worker/export compositor, tested canonical normalization. Independently downloaded and **viewed** real Chromium source PNGs from [run #40139995831](https://github.com/gamesbyian/wallgen/actions/runs/40139995831); four samples' main/worker raster differences = 0. Author retired its one-shot job, last head quick CI green before guarded squash merge. |
| [#667](https://github.com/gamesbyian/wallgen/pull/667) `c8c3644b09da71124953f98eed13bdb4ab41a999` | Fixed two reproduced accessibility regressions: the `More` destination's computed name overwritten by display-only colour vision preview, and keyboard/touch 44px rotate/scale buttons removed from accessibility tree by an `aria-hidden` parent. Rescued/reworked one useful old browser test; landed genuine Chromium journey test. [Run #40140699944](https://github.com/gamesbyian/wallgen/actions/runs/40140699944) passed **both** 320×700 and 412×892, including all five destinations, seven category tabs, 10 metadata labels, seeded private TTF import/IndexedDB reload, text colour/outline, keyboard scale/rotate and visible Edit Undo, tapped visible Studio PNG download, embedded canonical recipe equality, JSON download and PNG re-import. Actual 5,763,268-byte full-resolution PNG at both sizes; no unexpected remote traffic or page exceptions. Existing full creation/export and consent-gated recorder passed the same run. Real portrait screenshots from this job were downloaded and **visually inspected**. After proof, temporary heavyweight CI was removed (identical `.github/workflows/check.yml` blob SHA to preexisting lean main), and final head PR quick CI passed [run #40140978295](https://github.com/gamesbyian/wallgen/actions/runs/40140978295) before guarded merge. |

## Twelve original no-PR branches, all dispositioned

**Five already ancestors of 24 October main (ahead=0; no code to rescue):**
- `agent1/557-jagged-source-gap-evidence`
- `agent4-large-share-url-fallback-20261020`
- `qa/500x700-draw-panel-position-probe-20261021`
- `redesign/agent1-short-phone-evidence-handoff-20261019`
- `redesign/runtime-tool-reachability-20261018`

**Six divergent historical implementations/docs superseded by verified later main equivalents; do not replay wholesale:**
- `agent/embroidery-workspace-rebased-20261022` — current embroidery test expanded (old 1,315 vs current 5,246 bytes) and feature incorporated.
- `agent/reconstruction-refinement-lock-parity-20261023` — current `src/image-reconstruction.js` contains canonical `respectSettingLocks` refinement, and more later reconstruction changes; Agent 1 owns further algorithms.
- `agent3/final-integration-reconciliation-20261023` — earlier handoff prose superseded by merged #665 and this ledger.
- `redesign/five-destination-opt-in-20261018` — actual five-destination navigation is the main production default and has later tests.
- `redesign/grouped-more-source-surfaces-20261018` — richer current Grouped More CSS and UI source/test coverage; don't restore a stale 2026-10-18 layout.
- `redesign/interior-stack-identity-main-20261019` — exact `tests/interior-scope-identity.test.js` blob SHA matches current main `346ccdbc42c1bb322a8ad73d48d0f7aab9dee7c2`.

**Seventh divergent branch selectively rescued:** `redesign/assistive-accessible-names-20261019` had one absent standalone browser name check. Its current-app-compatible concepts were adapted in `tests/agent3-current-accessible-names-browser.mjs` on merged #667. Its stale workflow/retired DOM assumptions were deliberately *not* replayed. Original refs were preserved for provenance, not silently deleted.

## Remaining engineering, deliberately not declared complete

- [#666](https://github.com/gamesbyian/wallgen/pull/666), Agent 1 #557 displaced Jagged inverse fitting: **draft/unmerged** at this checkpoint. Earlier [real-render comparison #40139881879](https://github.com/gamesbyian/wallgen/actions/runs/40139881879) showed four zero-delta samples; later [#40140825969](https://github.com/gamesbyian/wallgen/actions/runs/40140825969) now shows #16 modest improvement 0.22214612 → **0.20873044** (absolute 0.01341568), with controls #04/#05/#06 unchanged. This is a measured gain, not closure of conspicuous source-versus-fit shape and location gaps; independent PNGs reviewed for the initial negative trial. Re-evaluate current head and discard temporary workflow before any merge. Further mixed occlusion/topology and larger displaced exemplars remain issue #557 work.
- [#669](https://github.com/gamesbyian/wallgen/pull/669), Agent 2 authored Draw/Hairpin/Loop text geometry: **draft/unmerged**, originally stacked against pre-squash #668 branch. Independently downloaded/viewed seven genuine image cases from [#40140665914](https://github.com/gamesbyian/wallgen/actions/runs/40140665914), including Draw letters following a trough, Hairpin U-turn, upside-down/turning Loop, plus native straight Arabic fallback; reported **seven 0-difference worker raster pairs** and full-size 3024×6552 PNG. Await current-main reconciliation, removal of temporary one-shot and green final-head focused CI. Keep issue #653 open for specialist shaping/coverage and mobile proof.
- Open issues: [#557](https://github.com/gamesbyian/wallgen/issues/557), [#653](https://github.com/gamesbyian/wallgen/issues/653), [#664](https://github.com/gamesbyian/wallgen/issues/664). No unaccounted original branch work, but **do not** close feature issues based on their partial progress.

## Strict evidence boundary

**NOT TESTED (not accepted as a proxy):** real Pixel 6 Pro Chrome/PWA touch ergonomics, Android IME/composition/autocorrect, TalkBack, native screen-reader rotor/focus, physical device font rendering and heap/thermal/export reliability, real human long-use judgement, owner personal copyrighted-font redistribution permissions, and authenticated opted-in GitHub GET/PUT/retry backup. Actual Chromium browser touch emulation and local IndexedDB privacy checks have passed, but cannot certify these native/owner-dependent areas.

Default CI policy remains lean; screenshot/artifact workflows were opt-in/temporary and deleted before merges. The independent screenshot/archive artifacts are linked to exact GitHub Actions runs, not copied into source assets. Future integrators must verify **live** main, PR statuses and current latest optical/art evidence before using this dated receipt.
