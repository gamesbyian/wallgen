// Canonical, bounded wallpaper typography. Editable words are never inferred
// from pixels, and font names are stable presets rather than arbitrary CSS.
export const TEXT_FONTS=Object.freeze({
  bold:"Impact, 'Arial Narrow', sans-serif",
  rounded:"'Trebuchet MS', Arial, sans-serif",
  modern:"Arial, Helvetica, sans-serif",
  editorial:"Georgia, 'Times New Roman', serif",
  typewriter:"'Courier New', monospace",
  playful:"'Comic Sans MS', cursive",
});
import {isLocalFontId} from './local-fonts.js';
import {isBundledFontId} from './bundled-fonts.js';
import {fallbackTextGraphemes,hasVisibleTextInk} from './text-rainbow-shaping.js';
export const TEXT_COLOURS=Object.freeze([
  'black','white','rainbow-letter','rainbow-word','rainbow-gradient'
]);
export const TEXT_OUTLINES=Object.freeze(['none','black','white','black-white','white-black']);
// The renderer paints an outer ring 2.5x the authored inner stroke width.
// Canvas strokes expand halfway to either side of glyph ink. Keep the
// editor's historical generous single-ring selection margin, but ensure
// two-ring selection/handle bounds reach the actual outer visible paint.
export const DUAL_TEXT_OUTLINE_STROKE_MULTIPLIER=2.5;
export function textInkSelectionReach(item){
  if(!item||item.outline==='none')return 0;
  const inner=Math.max(0,(Number(item.size)||0)*(Number(item.outlineWidth)||0)/100);
  return item.outline==='black-white'||item.outline==='white-black'?
    Math.max(inner,inner*DUAL_TEXT_OUTLINE_STROKE_MULTIPLIER/2):inner;
}
export const TEXT_PATHS=Object.freeze(['none','wave','arc','circle','hairpin','loop','drawn']);
export const TEXT_SHADOWS=Object.freeze(['none','black','white']);
export const MAX_TEXT_OVERLAYS=8;
// Paint and font readiness share this visibility contract. Invisible objects
// remain saved and selectable in the Text panel, including their private font
// identities for optional portable packaging, but contribute no canvas ink.
export const textOverlayPaintsInk=item=>
  item?.enabled!==false&&item?.opacity!==0&&hasVisibleTextInk(item?.text);
const num=(value,fallback,min,max)=>{
  const n=Number(value);
  const valid=Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
  return Object.is(valid,-0)?0:valid;
};
// Keep the raw-input guard bounded without slicing through a UTF-16
// surrogate or a multi-codepoint grapheme before cleaning/removing controls.
// Two UTF-16 code units of lookahead suffice to inspect the first codepoint
// after the cutoff and decide whether it continues the preceding cluster.
// Never segment arbitrary unbounded user input; the sample is <=4098 units.
function boundedRawTextPrefix(value){
  if(value.length<=4096)return value;
  const sample=value.slice(0,4098);
  const clusters=typeof Intl!=='undefined'&&typeof Intl.Segmenter==='function'?
    new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(sample):
    fallbackTextGraphemes(sample);
  let end=0;
  for(const unit of clusters){
    const length=(typeof unit==='string'?unit:unit.segment).length;
    if(end+length>4096)break;
    end+=length;
  }
  return sample.slice(0,end);
}
// A canonical 160-codepoint budget must never save half a combining cluster
// or the head of a joined emoji. Iterate the grapheme segmentation lazily,
// stopping at the budget rather than materializing arbitrary-length input.
export function boundTextContent(value){
  if(typeof value!=='string')return '';
  const cleaned=boundedRawTextPrefix(value)
    // Pasted Unicode line/paragraph separators, legacy Mac CR and NEL are
    // genuine logical line boundaries. Canonical rendering and the four-line
    // quota both use LF, so normalize before counting or storing a recipe.
    .replace(/\r\n?|[\u0085\u2028\u2029]/gu,'\n')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'')
    .replace(/\t/g,' ');
  let remaining=160,lines=1,result='';
  const segmentation=typeof Intl!=='undefined'&&typeof Intl.Segmenter==='function'?
    new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(cleaned):
    fallbackTextGraphemes(cleaned);
  for(const unit of segmentation){
    const cluster=typeof unit==='string'?unit:unit.segment;
    const cost=Array.from(cluster).length;
    if(cost>remaining)break;
    const newLines=(cluster.match(/\n/g)||[]).length;
    if(lines+newLines>4)break;
    result+=cluster;
    remaining-=cost;lines+=newLines;
    if(!remaining)break;
  }
  return result;
}
export function normalizeTextOverlays(input){
  if(!Array.isArray(input))return [];
  const used=new Set();
  return input.slice(0,MAX_TEXT_OVERLAYS).map((value,index)=>{
    const v=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    // Bound text before recipe URL, IndexedDB, transport and export.
    const text=boundTextContent(v.text);
    let id=typeof v.id==='string'&&/^[A-Za-z0-9_-]{1,48}$/.test(v.id)?
      v.id:'text-'+(index+1);
    if(used.has(id))id='text-'+(index+1);
    while(used.has(id))id+='-copy';
    used.add(id);
    return {
      id,text,enabled:v.enabled!==false,
      x:num(v.x,50,0,100),y:num(v.y,50,0,100),
      size:num(v.size,64,12,180),rotation:num(v.rotation,0,-180,180),
      opacity:num(v.opacity,1,0,1),
      font:isLocalFontId(v.font)||isBundledFontId(v.font)?v.font:
        Object.hasOwn(TEXT_FONTS,v.font)?v.font:'bold',
      colour:TEXT_COLOURS.includes(v.colour)?v.colour:'rainbow-letter',
      outline:TEXT_OUTLINES.includes(v.outline)?v.outline:'black',
      outlineWidth:num(v.outlineWidth,5,0,20),
      // Expressive treatment is opt-in; absent keys retain exact legacy ink.
      ...(v.letterSpacing!==undefined?{letterSpacing:num(v.letterSpacing,0,-3,18)}:{}),
      ...(v.lineSpacing!==undefined?{lineSpacing:num(v.lineSpacing,0,-20,100)}:{}),
      ...(v.rainbowOffset!==undefined?{rainbowOffset:Math.round(num(v.rainbowOffset,0,0,6))}:{}),
      ...(v.rainbowReverse===true?{rainbowReverse:true}:{}),
      ...(TEXT_SHADOWS.includes(v.shadow)&&v.shadow!=='none'?{
        shadow:v.shadow,shadowBlur:num(v.shadowBlur,6,0,16),
        shadowDistance:num(v.shadowDistance,7,0,16),
        ...(v.shadowAngle!==undefined?{shadowAngle:Math.round(num(v.shadowAngle,45,0,359))}:{})
      }:{}),
      // Curved baselines are strictly opt-in. Old lettering is unchanged.
      ...(TEXT_PATHS.includes(v.path)&&v.path!=='none'?{
        path:v.path,pathHeight:num(v.pathHeight,90,20,240)
      }:{}),
      locked:v.locked===true,
    };
  }).filter(item=>item.text.length>0);
}
export function newTextOverlay(id='text-1'){
  return normalizeTextOverlays([{id,text:'RAINBOW'}])[0];
}
