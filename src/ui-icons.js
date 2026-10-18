// True inline copies of the approved SVG artwork. currentColor must inherit
// from the LIVE theme; external <img> SVGs cannot receive that colour.
import {DRAWINGS_A} from './ui-icon-drawings-a.js';
import {DRAWINGS_B} from './ui-icon-drawings-b.js';
import {DRAWINGS_C} from './ui-icon-drawings-c.js';
import {DRAWINGS_D} from './ui-icon-drawings-d.js';

const DRAWINGS=Object.freeze({...DRAWINGS_A,...DRAWINGS_B,...DRAWINGS_C,...DRAWINGS_D});
const hasIcon=name=>Object.hasOwn(DRAWINGS,name);
export function iconSrc(name){
  if(!hasIcon(name))throw new RangeError('Unknown ROYGBIV icon: '+name);
  return 'assets/icons/roygbiv/'+name+'.svg';
}
export function iconMarkup(name){
  if(!hasIcon(name))throw new RangeError('Unknown ROYGBIV icon: '+name);
  const size=name==='app-icon'?'120 120':'32 32';
  return '<svg xmlns="http://www.w3.org/2000/svg" class="ui-icon" data-roygbiv-icon="'+name+'"'+
    ' viewBox="0 0 '+size+'" fill="none" stroke="currentColor" stroke-width="2.4"'+
    ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+
    DRAWINGS[name]+'</svg>';
}
export function setIconSource(container,name){
  const item=container?.querySelector('.ui-icon');
  if(item&&item.getAttribute('data-roygbiv-icon')!==name)
    item.outerHTML=iconMarkup(name);
}
// Static HTML includes external SVG fallbacks so it renders something even
// before JS runs. Upgrade only known approved icons, preserving their parent
// button nodes, focus, event listeners, text labels and dimensions.
export function hydrateStaticIcons(root=document){
  for(const image of root.querySelectorAll('img.ui-icon')){
    const src=image.getAttribute('src')||'';
    const match=src.match(/(?:^|\/)assets\/icons\/roygbiv\/([a-z0-9-]+)\.svg$/);
    if(match&&hasIcon(match[1]))image.outerHTML=iconMarkup(match[1]);
  }
}
