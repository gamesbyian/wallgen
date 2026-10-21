# Actual implementation companion (source screenshots)

**All images are byte-exact screenshots of the actual app**, not approved-reference redraws. Independent AI optical inspection was conducted before promotion. The original twelve SVG wireframes remain unchanged. Source was [Chromium run 39527554784](https://github.com/gamesbyian/wallgen/actions/runs/39527554784), tested checkout sha 89b09ea54da1368335785038bfd05eeed717eb8f. No presentation files changed between source approval and this commit. See review-provenance.json for the 32 SHA-256 values.

## 12 source states in both themes at 412 x 892

| Source state | Cream | Dark | Original schematic |
| :--- | :---: | :---: | :--- |
| studio | ![studio cream](actual-implementation/implemented-plates/cream-studio.png) | ![studio dark](actual-implementation/implemented-plates/dark-studio.png) | [Original studio schematic](studio.svg) |
| geometry | ![geometry cream](actual-implementation/implemented-plates/cream-geometry.png) | ![geometry dark](actual-implementation/implemented-plates/dark-geometry.png) | [Original geometry schematic](geometry.svg) |
| draw | ![draw cream](actual-implementation/implemented-plates/cream-draw.png) | ![draw dark](actual-implementation/implemented-plates/dark-draw.png) | [Original draw schematic](draw.svg) |
| explore | ![explore cream](actual-implementation/implemented-plates/cream-explore.png) | ![explore dark](actual-implementation/implemented-plates/dark-explore.png) | [Original explore schematic](explore.svg) |
| more | ![more cream](actual-implementation/implemented-plates/cream-more.png) | ![more dark](actual-implementation/implemented-plates/dark-more.png) | [Original more schematic](more.svg) |
| material | ![material cream](actual-implementation/implemented-plates/cream-material.png) | ![material dark](actual-implementation/implemented-plates/dark-material.png) | [Original material schematic](material.svg) |
| colour | ![colour cream](actual-implementation/implemented-plates/cream-colour.png) | ![colour dark](actual-implementation/implemented-plates/dark-colour.png) | [Original colour schematic](colour.svg) |
| diagonal | ![diagonal cream](actual-implementation/implemented-plates/cream-diagonal.png) | ![diagonal dark](actual-implementation/implemented-plates/dark-diagonal.png) | [Original diagonal schematic](diagonal.svg) |
| compact | ![compact cream](actual-implementation/implemented-plates/cream-compact.png) | ![compact dark](actual-implementation/implemented-plates/dark-compact.png) | [Original compact schematic](compact.svg) |
| focus | ![focus cream](actual-implementation/implemented-plates/cream-focus.png) | ![focus dark](actual-implementation/implemented-plates/dark-focus.png) | [Original focus schematic](focus.svg) |
| history | ![history cream](actual-implementation/implemented-plates/cream-history.png) | ![history dark](actual-implementation/implemented-plates/dark-history.png) | [Original history schematic](history.svg) |
| search | ![search cream](actual-implementation/implemented-plates/cream-search.png) | ![search dark](actual-implementation/implemented-plates/dark-search.png) | [Original search schematic](search.svg) |

## Eight independent SVG candidate screenshots (still unwired)

### pan

![pan source candidate states](actual-implementation/icons/pan-states.png)

Label View frame Pan and never composition nudge.

### anchor-points

![anchor-points source candidate states](actual-implementation/icons/anchor-points-states.png)

Label Edit anchors; 20px node handles are small.

### smooth-path

![smooth-path source candidate states](actual-implementation/icons/smooth-path-states.png)

Label Interpret / Resmooth; never claim a drawing pencil.

### extend-path

![extend-path source candidate states](actual-implementation/icons/extend-path-states.png)

Dense at 20px; prefer 24px+ or adjacent text.

### weave

![weave source candidate states](actual-implementation/icons/weave-states.png)

Add text for crossings/over/under; colour alone is insufficient.

### focus-slider

![focus-slider source candidate states](actual-implementation/icons/focus-slider-states.png)

Explicit Focus label; do not replace the default All inspector.

### metadata

![metadata source candidate states](actual-implementation/icons/metadata-states.png)

Corrected page outlines on dark surfaces; label Metadata.

### restore-variation

![restore-variation source candidate states](actual-implementation/icons/restore-variation-states.png)

Label Restore; avoid conflating History and Undo.

## Boundaries

Optical evidence means these exact screenshots were inspected as real pixels. It does **not** claim human preferences, a physical Android test, or native assistive-technology speech. Candidate vectors remain unwired until individually mapped to their exact existing controls and their size/label restrictions are satisfied. Uncommon responsive/conditional states remain in the live CI artifact and source audit; do not confuse these 24 named 412px plates with exhaustive app certification.
