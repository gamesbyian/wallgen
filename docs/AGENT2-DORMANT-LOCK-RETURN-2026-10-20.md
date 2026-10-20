# Agent 2 negative dormant-lock browser journeys (2026-10-20)

Follow-on to the merged #268 conditional-source state matrix and merged #279 canonical screen hitability gate. This test targets **acceptance #8**, without claiming closure of broad #1 or #4.

The existing tests prove 29 static conditional fixtures and their displayed disabled/zero state; they did not independently prove that a user can **lock an active value, make that value dormant through a different real UI setting, return to the original mode, and recover exactly the locked source**. This addition deliberately exercises that more demanding path, including the original source values in the URL and on-screen inputs.

`tests/agent2-conditional-lock-return.mjs` performs ten such journeys at **412×892 portrait** and **700×412 landscape** in real Chromium. Cases: zigzag→straight→zigzag frequency; diagonal→horizontal→diagonal rotation; repeated→single→repeated spacing; daylight→off→daylight light direction; stripe shadow nonzero→zero→nonzero softness; Layer 2 nonzero→zero→nonzero scale; Regions divider active→none→active width; individuality nonzero→zero→nonzero override; radial pinwheel→concentric→pinwheel twist; nested→Voronoi→nested polygon sides.

Each case uses original source category/tool chips, a real lock button, a native driver field and its original numeric stepper or select. It asserts: active source is lockable, its stored recipe value survives dormancy, the inactive value displays **0**, the dormant lock is disabled, recovery respects the stored lock and original value, unlock makes the original source field active, and the entire normalized recipe returns to its exact baseline. A failure emits a screenshot and case-specific JSON.

Run with the static server at port 4173 after installing Playwright Chromium: `node tests/agent2-conditional-lock-return.mjs`. See `.github/workflows/agent2-conditional-lock-return.yml` for reproducible browser CI.

**Evidence status:** unverified until all 20 live journeys and validation pass at the PR head. Keep acceptance checkboxes untouched. Native Android/stylus, actual assistive-technology output, full source-combination exhaustiveness and human visual approval remain separate gates.
