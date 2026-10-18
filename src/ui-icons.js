// Site-relative, immutable, vetted ROYGBIV icon assets. Icons are decorative;
// native buttons and labels retain their existing accessible action names.
const ICON_NAMES=new Set(["app-icon","home","create","explore","favourite","download","more","randomize","bleed","primes-only","undo","draw-path","arrow-left","arrow-up","arrow-down","arrow-right","recenter","zoom-in","zoom-out","history","edit","layout","path","stripes","colour","material","effects","tool","outlines","lighting","shadows","glow","lock","unlock","minus","plus","chevron-down","chevron-up","chevron-left","chevron-right","search","close","settings","rotate","copy","info","save","reroll","favourite-filled","check","reset","stripe-border","interior-elements","wave","zigzag","dotted-line"]);
export function iconSrc(name){
  if(!ICON_NAMES.has(name))throw new RangeError('Unknown ROYGBIV icon: '+name);
  return 'assets/icons/roygbiv/'+name+'.svg';
}
export function iconMarkup(name){
  return '<img class="ui-icon" src="'+iconSrc(name)+'" alt="" aria-hidden="true" draggable="false">';
}
export function setIconSource(container,name){
  const image=container?.querySelector('.ui-icon');
  if(image){const src=iconSrc(name);if(image.getAttribute('src')!==src)image.setAttribute('src',src);}
}
