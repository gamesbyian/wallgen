/** Human-directed next action from the global design archetype selector.
 * A conscious navigation choice, never a side effect of changing the recipe.
 */
export function designTypeNextTool(structure='paths',regionMode='voronoi'){
  if(structure==='radial')return {category:'path',tool:'rays',label:'Edit radial rays'};
  if(structure==='regions'&&regionMode==='scattered')
    return {category:'path',tool:'scattered-size',label:'Edit scattered shapes'};
  if(structure==='regions')return {category:'path',tool:'regions',label:'Edit regions'};
  return {category:'path',tool:'geometry',label:'Edit paths'};
}
export function installDesignTypeNext({tools,form,select,getScene}){
  if(!tools?.get('structure-mode')||!form||typeof select!=='function')
    throw new TypeError('Canonical design type tool required');
  const card=tools.get('structure-mode').card;
  const button=document.createElement('button');
  button.type='button';button.className='editor-design-next';
  // A restored URL design may have already updated the canonical scene
  // before its native form selector visually catches up. Use the same
  // source-authoritative structure/region mode that controls tool visibility,
  // rather than a potentially stale default select value.
  const currentDestination=()=>{
    const scene=getScene?.();
    return designTypeNextTool(
      scene?.structure??form.elements.namedItem('structure')?.value,
      scene?.regionMode??form.elements.namedItem('regionMode')?.value);
  };
  const sync=()=>{
    const destination=currentDestination();
    button.textContent='Continue → '+destination.label;
    button.setAttribute('aria-label','Continue editing: '+destination.label);
    button.title='Open Geometry → '+destination.label;
  };
  button.addEventListener('click',()=>{
    const {category,tool}=currentDestination();
    select(category,tool);
    // This button disappears when the destination card takes over. Transfer
    // focus to the real selected tool chip instead of leaving keyboard or
    // screen-reader focus on hidden source chrome.
    const destination=[...tools.values()].find(entry=>
      !entry.chip.hidden&&entry.chip.getAttribute('aria-pressed')==='true')?.chip;
    destination?.focus({preventScroll:true});
  });
  card.append(button);
  document.addEventListener('roygbiv-controls-synced',sync);
  // syncEditorStructure announces the actual applicable scene by selecting
  // a source tool; refresh the guidance even when form restore ordering
  // precedes/omits the generic controls-synced event.
  document.addEventListener('editor-tool-changed',sync);
  sync();
  return {sync,button};
}
