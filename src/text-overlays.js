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
export const TEXT_COLOURS=Object.freeze([
  'black','white','rainbow-letter','rainbow-word','rainbow-gradient'
]);
export const TEXT_OUTLINES=Object.freeze(['none','black','white']);
export const MAX_TEXT_OVERLAYS=8;
const num=(value,fallback,min,max)=>{
  const n=Number(value);
  const valid=Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
  return Object.is(valid,-0)?0:valid;
};
export function normalizeTextOverlays(input){
  if(!Array.isArray(input))return [];
  const used=new Set();
  return input.slice(0,MAX_TEXT_OVERLAYS).map((value,index)=>{
    const v=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    const raw=typeof v.text==='string'?v.text:'';
    // Bound text early, before recipe URL, IndexedDB and PNG serialization.
    const text=Array.from(raw.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').replace(/\t/g,' '))
      .slice(0,160).join('').split('\n').slice(0,4).join('\n');
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
      font:isLocalFontId(v.font)?v.font:Object.hasOwn(TEXT_FONTS,v.font)?v.font:'bold',
      colour:TEXT_COLOURS.includes(v.colour)?v.colour:'rainbow-letter',
      outline:TEXT_OUTLINES.includes(v.outline)?v.outline:'black',
      outlineWidth:num(v.outlineWidth,5,0,20),
      locked:v.locked===true,
    };
  }).filter(item=>item.text.length>0);
}
export function newTextOverlay(id='text-1'){
  return normalizeTextOverlays([{id,text:'RAINBOW'}])[0];
}
