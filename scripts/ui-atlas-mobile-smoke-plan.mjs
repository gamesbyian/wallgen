/** Quick, bounded Pixel 6 Pro screenshot acceptance.
 * Separate from the desktop 204-state smoke and complete eight-matrix atlas.
 * Every editor category contributes a canonical, source-backed tool.
 */
export const MOBILE_ATLAS_SMOKE_TOOLS=Object.freeze([
  ['layout','arrange'],['path','geometry'],['stripes','structure'],
  ['details','interior-targets'],['colour','rainbow'],
  ['material','finish1'],['effects','lighting']
].map(([category,tool])=>Object.freeze({category,tool})));
export const MOBILE_ATLAS_SMOKE_STATES=Object.freeze([
  'studio-default','editor-open','special-mobile-edit-rail',
  ...MOBILE_ATLAS_SMOKE_TOOLS.map(({category,tool})=>'tool-paths-'+category+'-'+tool),
  'special-focus-stripe-width','special-focus-no-range','conditional-diagonal',
  'conditional-material-layers','special-dark-theme',
  'shell-mobile-more','shell-mobile-explore'
]);
