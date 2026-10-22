// Image-decoded SVG import: deliberately conservative supported subset.
// Browser SVG-as-image disables scripts, but it is still better to reject
// source markup that could reference external documents, fonts or styles.
// No XML is inserted into the app DOM, library or wallpaper recipe.
const UNSAFE_TAG=/<\s*\/?\s*(?:script|foreignObject|image|use|a|iframe|object|embed|style|text|textPath|filter|animate|animateTransform|animateMotion|set|feImage)\b/i;
const ACTIVE_ATTR=/\b(?:on[a-z]{2,}|(?:xlink:)?href|src|style|externalResourcesRequired)\s*=/i;
const EXTERNAL_CSS=/(?:url\s*\(|@import\b|javascript\s*:|data\s*:|expression\s*\()/i;
const DECLARATION=/<\s*!(?:DOCTYPE|ENTITY)\b|<\?/i;
export const MAX_SAFE_SVG_BYTES=2*1024*1024;
export function verifyLocalSilhouetteSvg(text){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_SAFE_SVG_BYTES)
    throw new Error('SVG is too large. Convert it to a PNG or a simpler SVG.');
  if(!/<\s*svg\b/i.test(text))
    throw new Error('The selected SVG has no SVG root element.');
  if(UNSAFE_TAG.test(text)||ACTIVE_ATTR.test(text)||
    EXTERNAL_CSS.test(text)||DECLARATION.test(text))
    throw new Error('This SVG contains unsupported active or external content. Export plain paths or a transparent PNG.');
  return true;
}
