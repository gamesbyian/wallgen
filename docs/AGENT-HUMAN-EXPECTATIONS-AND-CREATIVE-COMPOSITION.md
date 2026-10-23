# Human expectations, creativity and procedural composition: agent field guide

**ROYGBIV | 2026-10-22 | Research-to-practice reference, not UI approval.**

This is an operational reading syllabus and evaluation protocol for AI agents proposing UI/UX or creative-control changes. Consult the [exhaustive control and navigation atlas](HUMAN-CENTRED-NAVIGATION-MAP-2026-10-22.md) before applying it. Source verification and live-renderer inspection are obligatory for claims about the current app.

## Current practice: prediction versus real creative-use observation (#537)

[Issue #537](https://github.com/gamesbyian/wallgen/issues/537) is the **single running observation and disposition record**. Its three pre-registered journeys cover (A) randomize → lock → vary → compare → save, (B) find and apply a digital-camera look, and (C) target embroidery to one shape, then recover with Undo/restore. These are low-confidence **agent predictions**, not tested user behaviour. The research [evidence map](https://github.com/gamesbyian/general-purpose/blob/main/docs/research/llm-agent-app-development-evidence-map-2026-10-22.md) is descriptive and privately held; it is not a universal method or compulsory new framework. This public guide and issue are sufficient to act.

**For a small number of voluntary, actual creative sessions:**

1. **Predict before observing:** Capture the goal in the person's own outcome-oriented language; the known starting recipe/editor state; likely first control, anticipated next control, likely misunderstanding and explicit uncertainty. Preserve the original prediction when results arrive.
2. **Observe without coaching toward the prediction:** Record what the person actually chose first, route changes/backtracks, any tap/focus/keyboard trouble, whether the result met their artistic intent, and how Undo, locks and Save/Restore behaved. Record the environment (build, viewport, physical device/browser, input method and accessibility settings) if known. A brief firsthand note is valid qualitative evidence; screenshots or recordings are optional.
3. **Distinguish evidence:** Label each observation or claim **agent prediction**, **source inspection**, **deterministic test**, **browser emulation**, **viewed exported PNG**, **physical handset**, or **human observation**. Mixed claims require separate provenance. Neither synthetic personas nor a structural route model, automated clicks or Playwright screenshots count as a person's comprehension, preference or creative satisfaction.
4. **Act proportionately:** A demonstrated problem can justify one focused UI or accessibility improvement with an observable before/after result. Cross-reference [#365](https://github.com/gamesbyian/wallgen/issues/365) for touch/focus and [#444](https://github.com/gamesbyian/wallgen/issues/444) for tool discovery before opening duplicate work. Record non-findings as well as findings. Small usability defects can also be fixed from direct source/reproduction evidence without demanding owner participation.

**Minimal issue-comment record:** `Task / initial state / agent prediction + uncertainty / observed actions + evidence type / outcome or confusion / proposed change or no-change / retest evidence or still unverified`. Track whether the change actually improved that task and any review burden, alongside merged functionality. Do not invent metrics from one session.

**Scope and priority:** This is opportunistic learning during active feature development, **not a release gate, permission to redesign all seven categories, request for mandatory owner testing, synthetic-user campaign, new CI matrix or preservation mandate**. In early development, improve the current canonical recipe and shared architecture; older generated image/recipe pixel compatibility is optional. Keep original imported file bytes safe. Maintain ordinary `npm run check:quick` and target additional verification to the actual change.

## 1. What an agent must learn

A parameter belongs to at least four overlapping systems:

1. **Human intention:** what visible outcome the person seeks, in their own words ("make the rays open up", "make it feel printed").
2. **Artistic grammar:** form, repetition, distribution, scale, direction, contrast, rhythm, colour relationships, surface, local/global light, negative space.
3. **Software causality:** the real recipe key(s), effective renderer behavior, conditional applicability, interactions, output versus viewport state, random scope and locks.
4. **Navigation:** how the person anticipates discovering, identifying, operating and evaluating the control, and moving to its next likely companion.

Do not infer (1) from (3). A tidy renderer API is not proof of a tidy human navigation hierarchy. Do not infer (4) from folder paths. Art vocabulary is a *generative toolkit*, not a universal ordering or an objective aesthetic preference.

## 2. Evidence-backed UX methods to use

| Method | What it tells us | ROYGBIV-specific use | Limitation and concrete source |
|---|---|---|---|
| **Human-centred lifecycle / context of use** | Who is doing which activity, with which capabilities and constraints | Focus on a single owner's phone-sized, exploratory wallpaper workflow; separate leisurely discovery from deliberate targeted editing | ISO 9241-210:2019 [ISO](https://committee.iso.org/standard/77520.html?browse=tc), reviewed/confirmed 2025. Framework, not one universal menu layout |
| **Hierarchical Task Analysis (HTA)** | Intent → subgoals → actions → alternative plans | "Rework shape without disturbing palette"; "use a saved silhouette in new composition" | [NN/g Task Analysis](https://www.nngroup.com/articles/task-analysis/). Analyst model must be checked against actual work |
| **Open card sorting / affinity grouping** | Which controls people think belong together; user-generated category names | Sort 40 tool cards and representative setting labels by artistic outcome, not stable keys | [NN/g distinction between card sorting and tree testing](https://www.nngroup.com/articles/tree-testing/). Generates hypotheses, does not validate final tree |
| **Tree testing and first-click** | Whether users can find a target control from natural-language task | A/B the current seven-category tree and proposed contextual five-workspace tree using exactly the same task prompts, with no UI visual bias | [NN/g Tree Testing](https://www.nngroup.com/articles/tree-testing/), [interpretation](https://www.nngroup.com/articles/interpreting-tree-test-results/). Requires real participants for human success rates |
| **Information scent / information-foraging** | Whether labels and context predict the promised destination | Ask whether "Light" would be expected to contain Glow and Shadows; whether "Path" suggests region origin | [NN/g Information Scent](https://www.nngroup.com/articles/information-scent/). Agent label predictions are not observed user choices |
| **Cognitive walkthrough** | Goal, notice, association, feedback failures at each step | At every tool transition: will user seek this action, notice it, associate label with effect, and recognize outcome? | [NN/g four questions](https://www.nngroup.com/articles/cognitive-walkthroughs/); evaluate actual affordances not just menu text |
| **Nielsen heuristic inspection** | Feedback, control, consistency, familiarity, recall burden, error recovery | Tool applicability, dormant controls, scoped variation, irreversible actions, preserved locks and Undo | [NN/g ten heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/). General prompts, not automatic pass/fail compliance |
| **GOMS / KLM task-cost modelling** | Estimated operation sequences for sufficiently specified expert tasks | Compare how many menu switches a trained editor needs to change two or three related parameters | [Usability BOK GOMS](https://www.usabilitybok.org/goms/). Does not predict discovery, creative satisfaction or aesthetic value |
| **QOC: Questions, Options, Criteria** | Explicitly compare alternatives, preserving trade-offs instead of defending one fashionable design | Current 7 categories vs 5 intent groups vs hybrid 7+cross-links; criteria: findability, breadth, preservation, compact phone UX | [MacLean et al. Design Space Analysis](https://doi.org/10.1080/07370024.1991.9667168), [practical usage](https://www.sciencedirect.com/science/article/pii/0142694X94900264) |
| **Accessibility / predictable interaction** | Consistent identification, navigability, focus and adaptation | Moving controls must preserve original control identity, target size, keyboard focus, no hidden active state, and disclosure of prerequisites | [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WAI principles](https://www.w3.org/WAI/fundamentals/accessibility-principles/) |
| **Creativity Support Index (CSI)** | Whether creative software supports exploration, expressiveness, immersion, enjoyment, results worth effort, collaboration | A small voluntary qualitative check of whether the prototype helps explore while preserving intentional authorship | [Cherry & Latulipe 2014](https://doi.org/10.1145/2617588); [accessible paper](https://mkremins.github.io/refs/CSI.pdf). Do not claim valid CSI statistics from a single agent or invent a new score by dropping collaboration |
| **Parallel prototypes** | Whether comparing alternatives reduces fixation on the first design | Keep 7-category and 5-intent shells as no-pixel-change prototypes, and compare alongside hybrid cross-links | [Hartmann et al. UIST 2008](https://hci.stanford.edu/publications/paper.php?id=16), [Dow et al. TOCHI](https://doi.org/10.1145/1879831.1879836). Performance evidence from other designs does not prove superiority here |

### Why this is different from an ordinary UI audit

An exhaustive list of names answers **what controls exist**. Task analysis answers **why a human starts looking**. Cognitive walkthrough answers **what they expect next**. Tree tests discover **where a real person searches**. Performance measures show **how costly the route is once known**. Creative-support and composition studies ask **whether the process enables interesting artistic discovery**. These are separate questions, so never silently combine them into one unvalidated percentage.

For a personal hobby application, one carefully observed session with its actual owner may be far more valuable than an elaborate synthetic survey. A couple of short **qualitative** tests can reveal a wrong label; statistical generalization requires substantially more participants. [NN/g qualitative vs quantitative samples](https://www.nngroup.com/articles/5-test-users-qual-quant/). Do not fabricate personas, simulated response distributions, task-success rates or eyetracking from an LLM's intuitions.

## 3. Formal art and perception: teach agents how creators reason about images

| Resource | Concept to extract | Practical implication for ROYGBIV |
|---|---|---|
| **J. Paul Getty, formal analysis and visual vocabulary** [course](https://www.getty.edu/education/teachers/classroom_resources/formal_analysis.html), [terms](https://www.getty.edu/education/k-12-learning/describe-listen-draw/vocabulary-for-describing-an-artwork/) | Balance, emphasis, rhythm, contrast, repetition, proportion, unity, movement | Classify *effects on the composition*, independent of source modules. A larger stripe changes weight, gap and sometimes focal emphasis |
| **University of Oklahoma open textbook** [Navigating the Arts](https://open.umn.edu/opentextbooks/textbooks/navigating-the-arts) | Elements (line, shape, texture, colour, space, light) and principles (unity, variety, balance, emphasis, repetition, rhythm, proportion) | Two-dimensional grammar for annotating controls: physical element affected × artistic principle modified. Do not confuse taxonomy with a mandatory creative workflow |
| **Josef Albers, Interaction of Color** [Albers Foundation](https://www.albersfoundation.org/alberses/teaching/interaction-of-color), [Yale edition](https://yalebooks.yale.edu/book/9780300179354/interaction-of-color/) | Relational rather than isolated colour judgments; colour appearance shifts with neighbours, boundaries and ground | Palette must be considered with background, tonal contrast, outlines, texture blending; compare actual rendered combinations |
| **George Stiny / James Gips, Shape Grammars** [MIT OCW 2018](https://ocw.mit.edu/courses/4-540-introduction-to-shape-grammars-i-fall-2018/pages/lecture-slides-and-supplemental-readings/) | Shapes and transformation rules produce visual design families | Structure → primitive → repeated transformation → composition. Relevant to reusable path assets, region partitioning and scattered shapes |
| **Sol LeWitt, rule-based drawings** [MASS MoCA 51](https://massmoca.org/event/walldrawing51/), [237](https://massmoca.org/event/walldrawing237/) | A precise set of instructions produces site-dependent compositions; creator chooses constraints before execution | Treat canvas-relative rules, clipping and shape placement as primary design intentions. Reproducible procedures are first-class creative artifacts |
| **Casey Reas, Process** [artist text](https://reas.com/process), [Process Compendium](https://github.com/REAS/studio/blob/master/ProcessCompendium.md) | Form + behavior → element; interacting elements under an environment produce families of images | Surface *form*, *distribution*, *behavior*, *ink* and *surface* independently; distinguish creative rules from random seed |
| **Processing Foundation** [tutorials](https://processing.org/tutorials/), [overview](https://www.processing.org/tutorials/overview/) | Interactive feedback, low-friction creative coding, curves/transforms/noise/geometry | One-variable experiments, direct manipulation, immediate preview and fast reversibility; teach agents to inspect effects, not names |
| **Open University, Algorithmic Design** [free course](https://www.open.edu/openlearn/science-maths-technology/design-innovation/algorithmic-design) | Modularity, repetition, serendipity and iterative tweaking | Support both a generative leap (Random / Explore) and tightly scoped modification (Vary + Lock), as two deliberately distinct exploration regimes |
| **MIT / Resnick, low floors, high ceilings, wide walls** [MIT Media Lab](https://www.media.mit.edu/articles/lifelong-kindergarten-how-to-learn-like-a-kid-by-the-co-creator-of-scratch/) | Fast start, expert depth, diverse creative trajectories | Presets and one-tap play; expert tools discoverable on demand; no forced wizard that blocks experimentation |
| **Shneiderman, Creativity Support Tools** [CACM 2007](https://doi.org/10.1145/1323688.1323689) | Design software should support exploration and discovery, not merely one right linear task | Keep history, undo, saved variants and low-cost comparative exploration visible in creative workflows |
| **Itti–Koch–Niebur, visual saliency** [1998 paper](https://hasler.ece.gatech.edu/Courses/MachineLearning/FoundationalPapers/Itti_Koch_Neiber1998.pdf) | Model bottom-up attention from multiscale contrast, colour and orientation | Optional diagnostic visualization for visual weight/attention; **never** treat it as a universal measure of artistic quality or expected gaze |
| **Computational balance / symmetry studies** [HCI study](https://www.sciencedirect.com/science/article/pii/S1071581906000048) | Balance and grouping are sometimes quantifiable and related to judgments for tested stimuli | Could derive candidate descriptors for spatial arrangements, *only* after qualitative artistic comparison; no automatic "optimal composition" score |

### Mechanical methods used by artists without software

An agent can run these as visual experiments on paper, then translate the rule to a procedural generator:

1. **Construct with primitives:** select dots, straight/wavy lines, circles, polygons and regions; compose through translation, rotation, reflection, repetition and clipping. The shape grammar explains a family, not a single rendering.
2. **Allocate space:** mark a frame, decide positive/negative space, proportions, symmetry or asymmetry, concentrated or distributed attention, distance from edges, intentional off-canvas bleed.
3. **Establish a rhythm:** repeat seven colour slots, vary number/spacing/scale, introduce syncopation (controlled departures from repetition), inspect what becomes the focal point.
4. **Choose contrast relationships:** hue family, black/white ground, edge contrast, hard/soft boundary and neighbouring colour effects. Test adjacent colours, not swatches in isolation.
5. **Choose a material story:** smooth ink, grain, fibre, print wear, illuminated/shadowed surface. Texture, lighting and contours interact; their sliders need joint exploration.
6. **Explore in a controlled series:** hold most variables constant, change one semantic dimension across several versions, compare, preserve a promising one, then expand or combine it.
7. **Critique by intention, not universal score:** "Does the circle cluster feel precarious?", "Does the path fill the wallpaper without crowding it?", "Are there visible procedural repeats?" Aesthetic judgment is situated and subjective.

These are **creative exercises**, not a claim that all people always compose in this order. Particularly suspicious universal promises: "rule of thirds always works", "golden ratio is optimal", "saliency predicts beauty", "fewer clicks always means better creative software", or "one perfect AI-designed menu fits everyone." They are not supported by this research.

## 4. A ROYGBIV-specific cognitive task map

For every proposed movement of a menu item, record this tuple:

`{ human_goal, visual_effect, current_key, active_modes, prerequisites, scale, expected_search_words, adjacent_actions, current_route, proposed_route, expected_feedback, reversibility, provenance }`.

Do not move a setting if `active_modes` or `prerequisites` are based on guesses. Read `src/editor-tool-applicability.js`, `src/model.js`, `src/renderer.js` and the owning UI code. For example, "Pattern" is a geometric decoration along stripes; "Texture" applies material marks to surfaces; distortion depends on a texture that actually affects stripes. Their relationship is meaningful but they are not interchangeable.

**Five concrete tasks to rehearse at every design iteration:**

- "Make the existing diagonal rainbow more turbulent but retain the colours and pattern" → Geometry/Bends + Chaos + Individuality, inspect locks and Vary.
- "Make a burst off-centre, with a hole in its middle and fewer wide spokes" → Radial kind + Count + Coverage + Centre gap + Origin.
- "Give this crisp design a convincing textile finish without visible tiled patches" → Material + Coverage + Layer strength/scale/blend and comparison; separate output inspection from menu success.
- "Save a hand-drawn silhouette and reuse it in an unrelated wallpaper" → draw/import + asset library + reapply; do not conflate with saved wallpaper gallery.
- "Add one wavering white line inside only the blue and indigo shapes" → interior element creation/selection + type/shape/wave + ink + target slots; the selection must remain visible across adjustments.

For each step of a cognitive walkthrough, explicitly answer the four questions from [NN/g](https://www.nngroup.com/articles/cognitive-walkthroughs/):

1. Will this person seek the effect of the next action?
2. Can they see/find it in the current state?
3. Does its name and context predict the intended result?
4. After changing it, is the intended visual feedback noticeable and unambiguous?

Mark `Yes / No / Unknown`, attach a link or screenshot to the *actual* control when possible, and state confidence. "Unknown" is not failure. If uncertain, test or ask instead of conjuring a human population.

## 5. An evaluation protocol that does not manufacture human evidence

**Preparation:** derive both trees from the same current editor schema; one primary home per key, preserve recipes and inactive values. Distinguish live screens, proposals, future branch features. Define a natural-language task before naming the tool, so the task doesn't leak the answer.

**Mechanical preflight (automatable, cheap):**

- Every current setting mapped once; every proposed route resolves uniquely; no category leaves missing tools.
- Compute menu travel distance *only* as a declared, unweighted structural proxy. Do not label it click count, time, human performance or task success.
- Flag high-interaction setting pairs split across categories; include conditional inactive modes.
- Count route transitions for task sequences; keep task ordering fixed across A/B. Avoid declaring one option proven better merely because the analyst chose its desired groupings.

**Heuristic/cognitive evaluation (human-informed agent judgment):**

- Evaluate the four cognitive-walkthrough questions in both tree designs for each task.
- Inspect search words, discoverability, familiar labelling, disabled hints, perceived control, undo/restore, visible local preview effects.
- Compare structural simplification against cost of expert reach, overly broad labels and mobile fit.

**Human evaluation (genuinely observed):**

- Use blind goal descriptions without naming the target button. Ask first click/destination, final tool, number of backtracks, explanation of expectations and subjective confidence.
- Test the same tasks in each tree, counterbalance order where possible, note prior familiarity. A label-only tree test can be done before a polished prototype exists.
- For creative outcomes, offer paired designs with equal seed and equivalent final render; rate exploration, expressiveness and effort separately from route findability.
- Store personal testing notes locally unless there is explicit consent to publish them. User-specific feedback should take precedence over hypothetical population averages in this single-user project.

**QOC decision note for each disputed structure:**

`Question → candidate options → criteria → evidence → unknowns → reversible recommendation`.

Suggested criteria: first-time findability, repeat editing cost, relationship locality, discoverability, active-mode truthfulness, visual preview continuity, accessible navigation and implementation safety. Weights are declared judgment calls, not scientific constants.

## 6. AI-specific competence and limitations

Microsoft Research's [HAX Toolkit](https://www.microsoft.com/en-us/haxtoolkit/) gives 18 guidelines and a workbook for *interfaces involving AI behavior*, including failure/recovery and user expectations. This can help when an **AI agent** proposes or alters UI and explains why, or if ROYGBIV ever adds interactive AI suggestions. It should **not** be misapplied to claim that the current deterministic wallpaper engine is an AI assistant.

Agent preflight before PR approval:

- State which claims are source-measured, which are published research, which are extrapolations, and which are personal design judgment.
- Cite the actual repository implementation, not just a generated screenshot or variable name.
- Never assume one typical novice/expert or fabricate user research.
- Require the creative task to be recoverable (locks/Undo/Saved) and inspect the generated picture, not just navigation.
- Prefer a small focused design comparison and a couple of source-level checks; no huge screenshot/CI matrix for a documentation or IA experiment.
- Document trade-offs, unresolved ambiguity, reversible next step and what would falsify the recommendation.

## 7. Immediate application to the current navigation proposal

**Existing seven-category schema versus five intent-led workspaces** is one hypothesis. Research indicates *how to test it*, not that the five must win.

- High-confidence candidate to prototype: **Texture / Layer + Finish** combined into coherent per-material cards, because its parameters describe one manipulable object.
- High-confidence candidate: **Details / Glow and Shadows + Light / Lighting** adjacent under one Light instrument, retaining different global/local meanings.
- High-confidence candidate: **Details / Interior, Style, Wave, Placement and Ink** as selected-element inspector rather than independent tool peers.
- Important counterexample: **Palette + Background** already sit in Colour, and **Diagonal rotation + mirrors** in Layout/Direction. Keep successful local structure intact.
- Potential downside: "Form" may hold too much in Paths and "Finish" may hide interior decoration. Prototype hybrid contextual rail rather than immediately deleting current destinations.

See [IA comparison utility](../scripts/ia-structure-evaluate.mjs) for a deterministic *hypothesis check* of how far related tool locations lie apart. It makes no empirical user-success claims and must not become CI policy for artistic decisions.
