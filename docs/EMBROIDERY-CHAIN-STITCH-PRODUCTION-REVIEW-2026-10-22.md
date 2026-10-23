# Embroidery linked-chain stitch: real art study

This optional E3/E4 style uses the mechanics of actual linked-loop hand embroidery, in which each loop is caught by the next; the oval can follow curves and adjacent rows fill regions. Primary precedent: [Chain stitch mechanics and working steps](https://flossfield.com/embroidery/stitches/chain-stitch/) and [how to keep links small through curves](https://simplysewingmag.com/embroidery/stitch-library-how-to-chain-stitch-and-split-stitch).

A `chain` style uses actual two-sided cubic loops rather than straight Tatami hatching. It is saved under the existing normalized `surfaceTreatments[].style` field, selected in the existing Texture → Surface picker, and requires **no new recipe fields or app destinations**. The same underlying ribbon tangent/normal field positions three parallel chain lanes. Each stitch's start/end is anchored to a global station lattice, so repainting over self-crossings reuses exactly the same loops. Regions use staggered courses of cubic loops through the existing even-odd clip for islands and holes. Work is explicitly bounded to 950×3 ribbon links or ~5,200 region links, rather than quadratic operations on large artwork. The hard limits must not be interpreted as a calibrated machine-sewing simulation or true fabric tension.

For a controlled first artwork run, use:

```sh
node scripts/review-embroidery.mjs --focus-chain --out-dir artifacts/linked-chain-comparison
```

This produces only **four real 600×1300 source-rendered PNGs**, two per matching scene (untreated versus Chain loop, both loop ribbon and scattered circles), with exact recipe sidecars, manifest and local gallery. The resulting pictures must be **actually viewed** before aesthetic approval, checking: discernibly interlinked ovals, loops turning through curves rather than unphysical beads, hue preservation, stitch crossings, clipped region edges, normal runtime and black background. No new permanent CI job. Legacy Satin, Soft Satin, Tatami and Running render the same old painter branches when selected, including the user's saved recipes.
