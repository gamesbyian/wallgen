# ROYGBIV bundled typefaces

This directory contains 27 unmodified Google Fonts family binaries, each from
`google/fonts` at the exact commit
`e7db6ca603fd4862010383ff17ffd6cc4ffac1c0`. All are sourced from the
upstream `ofl/<family>/` directories and carry **SIL Open Font License 1.1**.

Each `licenses/<slug>-OFL.txt` file is copied from the corresponding upstream
family directory, including its individual copyright statement. These fonts
retain their **own** licences independent of the ROYGBIV application licence.
Do not remove those files when redistributing the font binaries.

`manifest.json` records the exact upstream path, source commit, SHA-256,
byte count and licence file for every face. The browser and export worker
verify each binary's SHA-256 against the checked-in manifest before handing it
to native `FontFace`. The 27 fonts are loaded lazily, so everyday designs
with no text or other typefaces do not pay the full font-asset download cost.
No runtime connection to Google Fonts is necessary for this bundled pack.

Use `node scripts/fetch-curated-typefaces.mjs` to regenerate the *identical*
licensed files from the pinned commit. The source pin must not be changed
merely to upgrade a font without a separate review of licence, font coverage,
visual parity and saved recipe behavior.

Private TTF/OTF user imports are stored in the browser's IndexedDB, not here.
Never commit a user's imported font to this directory automatically.
