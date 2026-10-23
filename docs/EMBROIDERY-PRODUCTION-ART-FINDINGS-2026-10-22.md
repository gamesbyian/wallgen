# Embroidery production art review: first actual seven pictures

**Observed on 22 October 2026** using temporary branch-gated [Actions run #39883744519](https://github.com/gamesbyian/wallgen/actions/runs/39883744519) and [the seven-image artifact](https://github.com/gamesbyian/wallgen/actions/runs/39883744519/artifacts/12471223165). Source head for this one-time run: `59bed8a25eceb0caffece38a094ced7ab9f2f035`, from PR #510. The permanent `.github/workflows/check.yml` was then restored byte-for-byte to `main` on the PR branch; none of this optional Chromium work becomes routine CI.

Seven actual **600×1300 production Chromium renderer PNGs** were downloaded and visually opened: three same-seed loop ribbon samples and four same-seed scattered-circle samples. Each image passed independent complete PNG per-chunk CRC validation; its embedded `ROYGBIV Recipe` JSON was parsed and compared to the adjacent normalized `.recipe.json` with **seven exact matches**. All seven contain exactly one embedded recipe, and share identical source controls within each scene group.

## What the actual pictures show

| Image | PNG bytes | Observed result versus matched untreated scene |
| --- | ---: | --- |
| `00-ribbon-plain` | 306,224 | Baseline diagonal rainbow entering a concentric loop, black substrate, visible faint regular linen weave across background |
| `01-ribbon-satin` | 897,424 | Continuous, strong transverse ribs with vivid raised-looking highlights; tightly curved centre becomes grey/brown/desaturated from dense black-and-white overlay, especially orange/red |
| `02-ribbon-running` | 503,336 | Three interrupted longitudinal seams per stripe following straight and circular path contours; distinctly different from satin and no obvious whole-branch missing stitches in this contact composition |
| `03-regions-plain` | 307,371 | Fourteen scattered circles, clean fill boundaries and the same faint underlying linen weave |
| `04-regions-tatami` | 886,035 | Clearly visible closely spaced diagonal thread segments in each circle; broad orientation repeats across shapes, as expected from fixed `direction` |
| `05-regions-running` | 894,894 | Another short staggered regional texture, qualitatively similar to tatami at contact size; individual stitch cadence is easier to compare at pixel-scale crop |
| `06-one-region` | 348,983 | Only the lower-middle orange circle takes on satin fill; all other circles retain the untreated appearance |

Independent per-pixel RGB differences (unsigned absolute channel differences against the paired unstitched PNG): Satin ribbon **8.535 mean** with 30.514% of pixels differing by more than 2 in at least one channel; Running ribbon **1.453 mean**, 6.422%; Region Tatami **4.855 mean**, 24.526%; Region Running **4.797 mean**, 24.472%; selected-region Satin **0.348 mean**, 1.752%. The last difference is spatially bounded to **x=191..355, y=785..950** (600×1300 coordinate plane); no unrelated circle or background area differed by more than 2 RGB levels. This is independent evidence for target isolation on this one scene, not an exhaustive role mask proof.

## Findings and deliberate next work

- **Working and visible:** all three available stitch styles and exact-object scoping make materially distinguishable wallpapers. Imported imagery and texture layers were not damaged by the opt-in choices in this sample. The simple loop's Running seams follow the bend without an obvious full-length phase reset.
- **Visual realism limitations:** existing Satin on tight red/orange turns heavily overpaints original colour with luminous/light-dark grooves; it can look metallic rather than thread. For small regions, Tatami and Running read as neatly diagonal hatching instead of twisted fibre. Those are observed stylistic limitations, not data or CI failures.
- **Existing baseline grid:** a faint rectangular graph/weave is visible on bare black in the untreated reference because the base deliberately uses `linen-soft` coverage on background and stripes; it is not evidence of thread leakage from the treatment. Assess with `material:none` only if a future composition needs to separate material from stitch ink.
- **Next economical action:** if stronger physical thread realism is desired, independently try a *new opt-in stitch appearance or shading strength*, compare one focused red/orange tight-loop sample, and avoid silently changing the old Satin look or saved recipes. Do not add ten new browser suites or regenerate this gallery on every PR.

**Boundaries:** production renderer and saved PNG identities were verified, and actual images viewed. Not verified: physical Pixel 6 Pro speed or colour rendering, tactile accessibility, 19.8MP full export, realistic sewing machine geometry, unseen complex imported holes, or human-preference approval. The reviewer is an agent observing actual images, not a fabricated usability panel.
