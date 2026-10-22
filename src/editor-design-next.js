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
export function installDesignTypeNext({tools,form,select}){
  if(!tools?.get('structure-mode')||!form||typeof select!=='function')
    throw new TypeError('Canonical design type tool required');
  const card=tools.get('structure-mode').card;
  const button=document.createElement('button');
  button.type='button';button.className='editor-design-next';
  const sync=()=>{
    const destination=designTypeNextTool(
      form.elements.namedItem('structure')?.value,
      form.elements.namedItem('regionMode')?.value);
    button.textContent='Continue → '+destination.label;
    button.setAttribute('aria-label','Continue editing: '+destination.label);
    button.title='Open Geometry → '+destination.label;
  };
  button.addEventListener('click',()=>{
    const {category,tool}=designTypeNextTool(
      form.elements.namedItem('structure')?.value,
      form.elements.namedItem('regionMode')?.value);
    select(category,tool);
  });
  card.append(button);
  document.addEventListener('roygbiv-controls-synced',sync);
  sync();
  return {sync,button};
}
