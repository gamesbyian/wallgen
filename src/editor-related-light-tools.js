/**
 * Source-grounded cross-category links for controls commonly adjusted together.
 * These are navigation only: no duplicate input, recipe setting or new tab.
 */
export const RELATED_LIGHT_TOOLS=Object.freeze([
  {from:['effects','lighting'],to:['details','shadows'],label:'Stripe shadows',destination:'Details'},
  {from:['effects','lighting'],to:['details','glow'],label:'Glow',destination:'Details'},
  {from:['details','shadows'],to:['effects','lighting'],label:'Overall lighting',destination:'Light'},
  {from:['details','shadows'],to:['details','glow'],label:'Glow',destination:'Details'},
  {from:['details','glow'],to:['effects','lighting'],label:'Overall lighting',destination:'Light'},
  {from:['details','glow'],to:['details','shadows'],label:'Stripe shadows',destination:'Details'}
].map(link=>Object.freeze({...link,
  from:Object.freeze(link.from),to:Object.freeze(link.to)})));

export function relatedLightTools(category,tool){
  return RELATED_LIGHT_TOOLS.filter(link=>link.from[0]===category&&link.from[1]===tool);
}
export function installRelatedLightTools({chooser,select}){
  if(!chooser||typeof select!=='function')throw new TypeError('Editor tool chooser and navigator required');
  const links=RELATED_LIGHT_TOOLS.map(link=>{
    const button=document.createElement('button');
    button.type='button';button.className='editor-related-tool';
    button.textContent='↗ '+link.label;
    button.title='Go to '+link.destination+' → '+link.label;
    button.setAttribute('aria-label','Related control: '+link.label+' in '+link.destination);
    button.hidden=true;
    button.addEventListener('click',()=>select(link.to[0],link.to[1]));
    chooser.append(button);
    return {link,button};
  });
  return {
    sync(category,tool){
      const shown=[];
      for(const entry of links){
        const visible=entry.link.from[0]===category&&entry.link.from[1]===tool;
        entry.button.hidden=!visible;
        if(visible)shown.push(entry.button);
      }
      const anchor=chooser.querySelector('[data-random-tool="'+tool+'"]')||
        chooser.querySelector('.editor-tool-tab[data-editor-tool="'+tool+'"]');
      // Place these connections beside the currently selected tool, not at
      // the unreachable far end of a long horizontal mobile tool strip.
      if(anchor&&shown.length)anchor.after(...shown);
    }
  };
}
