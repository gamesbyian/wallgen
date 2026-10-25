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
export const TEXT_COLOURS=Object.freeze([
  'black','white','rainbow-letter','rainbow-word','rainbow-gradient'
]);
export const TEXT_OUTLINES=Object.freeze(['none','black','white','black-white','white-black']);
export const TEXT_PATHS=Object.freeze(['none','wave','arc','circle','hairpin','loop','drawn']);
export const TEXT_SHADOWS=Object.freeze(['none','black','white']);
export const MAX_TEXT_OVERLAYS=8;
const num=(value,fallback,min,max)=>{
  const n=Number(value);
  const valid=Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
  return Object.is(valid,-0)?0:valid;
};
// A canonical 160-codepoint budget must never save half a combining cluster
// or the head of a joined emoji. Iterate the grapheme segmentation lazily,
// stopping at the budget rather than materializing arbitrary-length input.
export function boundTextContent(value){
  if(typeof value!=='string')return '';
  const cleaned=value.slice(0,4096)
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'')
    .replace(/\t/g,' ');
  let remaining=160,lines=1,result='';
  const segmentation=typeof Intl!=='undefined'&&typeof Intl.Segmenter==='function'?
    new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(cleaned):cleaned;
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
        shadowDistance:num(v.shadowDistance,7,0,16)
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
