/** Presentation-only status of real material layer source fields.
 * No derived layer state is serialized or substituted for recipe controls. */
export function materialLayerState({material='none',enabled=true,strength=100}={}){
  if(!enabled||material==='none')return 'off';
  if(Number(strength)<=0)return 'zero';
  if(material==='auto')return 'auto';
  return 'on';
}
const descriptions={off:'No texture',zero:'Strength 0%',auto:'Automatic texture',on:'Texture selected'};
export function installMaterialLayerIndicators({form,tools}){
  if(!form||!tools)throw new TypeError('Original material form and tool map required');
  const read=name=>form.elements.namedItem(name);
  const sources=[
    {id:'layer1',name:'material',strength:'textureStrength'},
    {id:'layer2',name:'material2',strength:'textureStrength2',enabled:'textureLayer2Enabled'},
    {id:'layer3',name:'material3',strength:'textureStrength3',enabled:'textureLayer3Enabled'}
  ];
  const finishHelp=sources.map((config,i)=>{
    const card=tools.get('finish'+(i+1))?.card;
    if(!card)throw new Error('Missing material finish tool '+(i+1));
    const note=document.createElement('p');
    note.className='material-finish-help';
    note.setAttribute('role','note');
    note.hidden=true;
    card.prepend(note);
    return note;
  });
  function update(){
    for(const [i,config] of sources.entries()){
      const chip=tools.get(config.id)?.chip;
      if(!chip)throw new Error('Missing material tool '+config.id);
      const state=materialLayerState({
        material:read(config.name)?.value,
        strength:read(config.strength)?.value,
        enabled:config.enabled?Boolean(read(config.enabled)?.checked):true
      });
      chip.dataset.materialState=state;
      const label='Layer '+(i+1)+': '+descriptions[state];
      chip.title=label;
      chip.setAttribute('aria-label',label);
      const note=finishHelp[i];
      note.hidden=state!=='off'&&state!=='zero';
      const message=state==='off'?
        'Finish '+(i+1)+' is inactive. Choose a texture in Layer '+(i+1)+'.':
        state==='zero'?
          'Finish '+(i+1)+' has 0% strength. Increase layer strength to enable its effects.':'';
      if(note.textContent!==message)note.textContent=message;
    }
  }
  // Imported recipes, Undo, randomization and locks all update source form
  // fields through toControls(), which emits the authoritative sync event.
  document.addEventListener('roygbiv-controls-synced',update);
  form.addEventListener('input',()=>queueMicrotask(update));
  form.addEventListener('change',()=>queueMicrotask(update));
  update();
}
