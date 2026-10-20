# Agent 2 independent real-browser variation-scope acceptance, 2026-10-20

**Lane:** ordinary original Tool/Category variation controls, locks and source-recipe fidelity. **Independent from** the 86/86 direct-field action census (#289), 32/32 conditional-driver reversals (#299), Focus comparison and gallery/export review.

## Exact reproducible scope

`tests/agent2-scoped-randomization-browser-matrix.mjs` constructs **95 adversarial Chromium fixtures**:

- **39** source-accessible Tool cards × both **Reroll** and **Vary** modes (**78** journeys). The Tonal legacy tool is excluded because it is not currently selectable in the shipped construction menu, rather than claiming user reachability for a hidden mode.
- **7** ordinary editor categories × two variation modes (**14** journeys).
- **3** all-locked Tool no-op controls (**Background, Finish 2, Geometry**).

For every fixture, real Chromium loads a fully normalized recipe at **412×892**, navigates from Studio into Edit, selects the actual category and named Tool, sets the ordinary variation mode/strength, checks the original scoped action's physical center hit, and clicks the source button. The suite compares **every normalized recipe property**, requires each mutation to belong only to its selected tool/category (including material's atomic hidden layer enable flags and Details' dynamic interiors), and verifies locks, seed, nudge and camera variables are unchanged. It also verifies the global status message reports a genuine change or accurately reports a no-op, and that a no-op does not silently alter the URL.

The baseline deliberately locks **Palette**, **Path Shape Depth**, and **Material Layer 2 Strength** while other same-tool settings remain editable. The all-locked fixtures check that a scope with nothing editable is not falsely announced as changed. Each fixture uses the real UI rather than invoking `randomizeScope` directly. Reference contracts are the canonical `EDITOR_CATEGORIES` and original model, independent from the event handlers under test.

**Verification state: PENDING final exact-head CI after a confirmed mobile control-layout blocker.** Initial real-browser 95-case run failed repeatedly on Tool dice whose centers remained unhit after an actual horizontal scroll. The independently sticky Focus control occupied the exact same left offset (`left:0`) at a higher stacking level, as seen in production `editor-focus.css` and `editor-redesign.css`. The narrow **Agent 2 operability fix** reserves two distinct sticky zones: Focus is the first child in flex order and Tool sits immediately to its right at `left:69px`. This does not change desktop positioning, the source action, recipe logic or the Focus experiment's default. An additional center-hit witness now reports the topmost source target, Focus rectangle and scroll displacement on failure. Recheck all 95 journeys before declaring the fix verified. Failed run: [39408556117](https://github.com/gamesbyian/wallgen/actions/runs/39408556117).

**Remaining untested:** independent hardware touch and screen-reader speech, all possible configuration combinations, a guaranteed mutation of every eligible setting on random draws, visual/aesthetic approval, dynamic Draw geometry and Saved/export (owned separately).
