# Branch continuity and non-PR work reconciliation
**Read-only snapshot:** 1 November 2026; baseline `main` `fdf09429e5cc2a708cc5d1f70cb9f1151d75d169`.

## Why this exists
An open-PR-only audit can miss agent work left on a branch without ever opening
a PR. A paginated REST scan of all 971 repository branches (10 pages) and all
946 PRs in every state (10 pages; compare by exact `head.ref`) found **26
names without a matching PR head: `main` and 25 other branches**. All 25
were compared to the baseline main using the canonical GitHub compare API.
**Eight** had zero additional commits; **17** were diverged. Ahead counts
alone never establish useful, safe, or truly absent source changes after later
independent implementations and squash merges. No branches were deleted.

This inventory is an *explicit disposition and source preservation ledger*,
not an instruction to merge these 17 stale histories. Re-run the comparison
against current main before opening any PR; today's ahead/behind values
will change. This supplements, not replaces,
[the single live priority queue](CURRENT-WORK-QUEUE-2026-10-24.md).

## Already ancestral to main (zero ahead; retain as history)
| Branch | Ahead / behind | Disposition |
| --- | ---: | --- |
| `agent1/557-jagged-source-gap-evidence` | 0 / 333 | Source absorbed, #557 historical study |
| `agent2/653-tracking-hit-measure-20261024` | 0 / 287 | Source absorbed, typography #653 closed |
| `agent4-large-share-url-fallback-20261020` | 0 / 828 | Ancestor; no missing branch-only commits |
| `docs/randomize-performance-integration-20261029` | 0 / 118 | Performance handoff already ancestral |
| `feature/precision-text-angles-20261029` | 0 / 126 | Angle authoring history ancestral |
| `qa/500x700-draw-panel-position-probe-20261021` | 0 / 719 | Historical QA probe |
| `redesign/agent1-short-phone-evidence-handoff-20261019` | 0 / 943 | Historical short-phone receipt |
| `redesign/runtime-tool-reachability-20261018` | 0 / 1074 | Historical tool reachability |

## Diverged heads requiring disposition, not blind transplantation
| Branch | Ahead / behind | Triage and owning current issue |
| --- | ---: | --- |
| `agent/embroidery-workspace-rebased-20261022` | 7 / 485 | Old editor/layout and embroidery-doc alternative. Current #963/#867 accepted implementations are substantially newer; reconcile **specific** missing control only after a fresh reproduction |
| `agent/reconstruction-refinement-lock-parity-20261023` | 2 / 369 | #557 old reconstruction/lock study; main now has a much larger reconstruction engine and lock handling. Retain source evidence, do not replace current fitter |
| `agent1/557-mirrored-cropped-hue-stamps-20261024` | 13 / 310 | #557 experimental cropped/mirrored hue work, including tests and findings. **Conditionally review** its specific adversarial fixtures if a current independently reproduced source failure remains |
| `agent3/final-integration-reconciliation-20261023` | 6 / 412 | Historical roadmap/photo/PNG schema documents; canonical live queue and current recipe registry supersede older dispatch |
| `agent3/675-independent-optical-validation-20261024` | 5 / 315 | #557 isolated optics, one-shot workflow and test deltas; retain historical QA evidence, never restore permanent heavy PR job |
| `agent3/682-independent-source-proof-20261024` | 8 / 309 | #557 cropped stamp evidence and one-shot source workflow; candidate only with current source matched positive/negative PNGs |
| `agent3/683-independent-mirror-optical-20261024` | 6 / 307 | #557 mirrored-cropped source evidence and one-shot optics; independently re-evaluate if still failing, not a standing integration |
| `cleanup/one-shot-roygbiv-preview-release-20261028` | 1 / 138 | A one-time release-discovery workflow. #839 remains **owner-gated**; do not revive workflow or launch billed Cloudflare preview |
| `feat/chain-stitch-source-curve-topology-20261101` | 3 / 7 | Original cubic-chain source model prototype; **superseded in architecture** by accepted #971/#972/#974 original-cubic topology and actual paired PNGs. The alternate unmerged `src/chain-stitch-topology.js` must not fork canonical `src/chain-thread-contacts.js` |
| `feat/vector-node-hit-model-20261030` | 3 / 100 | Main `src/vector-node-hit.js` has the **identical Git blob SHA** to this branch. No missing hit algorithm, despite divergent PR ancestry |
| `feature/precision-text-overlay-angles-20261029` | 8 / 125 | Old rotation-control experiment with one-shot workflow; current `src/rotation-scrubber.js` is newer and already supports text fields. #867 only if an actual missing control/keyboard failure is reproduced |
| `feature/randomize-preview-preemption-20261029` | 9 / 121 | **Deliberately rejected**, not abandoned. The owning [randomize latency report](RANDOMIZE-RENDER-LATENCY-2026-10-29.md) records deterministic [A/B #40981369721](https://github.com/gamesbyian/wallgen/actions/runs/40981369721) with no speedup and explicitly says *do not merge*. Independent review and [new variable-seed browser evidence #41361289368](https://github.com/gamesbyian/wallgen/actions/runs/41361289368) led to [recovery PR #978](https://github.com/gamesbyian/wallgen/pull/978) being closed **unmerged**, temporary workflow retired. Continue #913 on fixed-source measured renderer hotspots instead |
| `redesign/assistive-accessible-names-20261019` | 2 / 916 | Older accessibility optical script and one-shot workflow; #867 only for a demonstrated new failure, not automatic workflow revival |
| `redesign/five-destination-opt-in-20261018` | 14 / 1084 | Historical five-destination UI trial superseded by owner's present **seven-category mobile taxonomy**. Do not silently replace product navigation |
| `redesign/grouped-more-source-surfaces-20261018` | 29 / 1080 | Historical grouping/five-destination redesign; current app/IA differs. Retain as research, new UI only with real current accessibility reproduction |
| `redesign/interior-stack-identity-main-20261019` | 3 / 1067 | Current `tests/interior-scope-identity.test.js` is **blob-identical** to this branch. The old app/UI delta must not overwrite current source, no lost isolated test |
| `research/randomize-scene-costs-20261029` | 4 / 120 | Current main already contains the real-worker `scripts/randomize-scene-costs-browser.mjs` and owning latency report; old one-shot workflow is historical, not a missing scheduled check |

## Practical successor discipline
1. Protect retained branch commits; do **not** delete or bulk-merge them.
2. For each still-conditional #557/#867 source study, first demonstrate a
   current-main defect on actual imported art or a real browser interaction.
   Compare those original-source images/gestures and current tests; transplant
   *only* missing behaviour into current owning modules, with exact-head CI.
3. Keep Random preemption **rejected**. Synthetic worker tests did not show
   browser latency benefit. Prefer profiling stable heavy seeds
   `random-perf-fixed-30` and `random-perf-fixed-20` and optimize real
   renderer bottlenecks without changing source art.
4. Hosted preview release (#839), native Pixel/TalkBack/IME, and owner
   aesthetic acceptance are distinct external gates. No background worker
   can declare them satisfied via source inspection.
5. Existing manually inspectable PR branches are a separate category from
   these 25 no-PR heads. The six recently closed/unmerged PRs #858, #869,
   #881, #882, #908 and #911 have their own supersession/disposable receipts
   in the live queue. No open PR is silently assumed merged.
