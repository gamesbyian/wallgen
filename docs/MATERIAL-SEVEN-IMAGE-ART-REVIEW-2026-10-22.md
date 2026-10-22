# Seven-image material review (opt-in)

This is an *artistic judgement* task, not a new CI gate. The existing
source in `src/material-surface.js` uses a seeded, world-space, aperiodic
height field shared by contour distortion and visible texture marks. That
mechanism has already been inspected. What remains uncertain is **how real
the materials feel**, not whether the displacement control is connected.

Run from the repository root after installing the Playwright browser dependency
described in the README:

```sh
node scripts/review-materials.mjs --out-dir artifacts/material-review
# If necessary: --browser /usr/bin/chromium
```

The script calls the existing production `render-headless.mjs`, producing
exactly **seven** 480×1040 metadata-bearing PNGs, seven matching source `.recipe.json` files, an `index.html` contact
gallery and a reproducible `manifest.json`. It compares watercolour,
linen and concrete at two seed values each, with a no-texture control.
Everything else is held constant. It refuses to replace earlier PNGs in the
destination; use a new folder for later reviews.

Judge a handful of concrete questions, not an arbitrary pixel-score:
Does linen's weave read as fabric? Does concrete look artificially evenly
speckled? Are identical-direction ridges too regular? Does watercolour
read as pigment/absorption rather than random circles? Do different seeds
feel different but recognizably the same material? Are there any visible
repeat boundaries, source/preview/export discrepancies, or displacement
that seems unconnected to its active texture?

If a failure is actually visible, fix that one material without changing
other materials or previously saved recipe semantics unnecessarily.
Do not add this review to per-PR workflows, make seven into seventy, or
claim that production appearance has been personally inspected until
the images are actually viewed. Related issue: #445.

**Integrity correction (2026-10-22):** each case is now written as a complete normalized `.recipe.json` file and passed to `render-headless.mjs --recipe` directly. The painter, stored manifest and source recipe therefore cannot disagree about the material (or any future setting). This replaced hand-built `--set` arguments that had accidentally omitted the material setting. No false-positive material-quality conclusions were drawn before that fix.
