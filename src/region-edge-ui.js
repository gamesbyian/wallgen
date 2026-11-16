// Independent per-object edge assignments live beside the global Region edges
// controls. Keeping selection in the UI (not the recipe) avoids cosmetic Undo
// entries and preserves stable object IDs across zoom, rendering and exports.
import {NAMES} from './model.js';
import {EDGE_STYLES,EDGE_DIRECTIONS} from './edge-profiles.js';

export function installRegionEdgeControls({card,getRecipe,getScene,onApply}){
  if(!card)throw new Error('Region edges card missing');
  const section=document.createElement('section');
  section.className='region-edge-object-editor';
  const title=document.createElement('strong');
  title.textContent='Individual region edges';
  section.append(title);
  const hint=document.createElement('p');
  hint.textContent='Choose a region to override its edge shape. Mixed neighbouring styles reveal a narrow background cut rather than hiding each other.';
  section.append(hint);
  const targetLabel=document.createElement('label');
  targetLabel.textContent='Edit region';
  const target=document.createElement('select');
  target.setAttribute('aria-label','Region whose edges to edit');
  targetLabel.append(target);
  section.append(targetLabel);
  const controls=new Map();
  function choice(name,caption,values){
    const label=document.createElement('label');label.textContent=caption;
    const field=document.createElement('select');
    field.setAttribute('aria-label',caption+' of selected region');
    for(const [value,text] of values){
      const option=document.createElement('option');
      option.value=value;option.textContent=text;field.append(option);
    }
    label.append(field);section.append(label);controls.set(name,field);
    return field;
  }
  choice('style','Edge style',[
    ['straight','Straight'],['scalloped','Scalloped'],['pinked','Pinked'],
    ['wavy','Wavy'],['stepped','Stepped']
  ].filter(([value])=>EDGE_STYLES.includes(value)));
  choice('direction','Direction',[
    ['outward','Outward'],['inward','Inward'],['alternating','Alternating']
  ].filter(([value])=>EDGE_DIRECTIONS.includes(value)));
  for(const [name,labelText] of [['size','Size'],['depth','Depth'],['phase','Phase']]){
    const label=document.createElement('label');label.textContent=labelText;
    const row=document.createElement('span');row.className='region-edge-value-row';
    const field=document.createElement('input');
    field.type='range';field.min='0';field.max='100';field.step='1';
    field.setAttribute('aria-label',labelText+' of selected region');
    const value=document.createElement('output');
    value.textContent='50%';
    field.addEventListener('input',()=>{value.textContent=field.value+'%';});
    row.append(field,value);label.append(row);section.append(label);
    controls.set(name,field);
  }
  const clear=document.createElement('button');
  clear.type='button';clear.className='button button-outline';
  clear.textContent='Restore global edges';
  clear.title='Remove the selected region override, retaining other regions';
  section.append(clear);
  const status=document.createElement('small');
  status.className='region-edge-override-status';
  status.setAttribute('role','status');
  section.append(status);
  card.append(section);
  let selected='';
  const values=()=>Object.fromEntries([...controls].map(([key,field])=>
    [key,field.type==='range'?Number(field.value):field.value]));
  const read=()=>{
    const recipe=getRecipe();
    const defaults={style:recipe.regionEdgeStyle,size:recipe.regionEdgeSize,
      depth:recipe.regionEdgeDepth,phase:recipe.regionEdgePhase,
      direction:recipe.regionEdgeDirection};
    return {recipe,override:(recipe.regionEdgeOverrides||[]).find(v=>v.id===selected),
      defaults};
  };
  const sync=()=>{
    const recipe=getRecipe();
    const regions=getScene().objects.filter(object=>
      object.kind==='region'&&object.vertices?.length>=3);
    const active=regions.some(object=>object.id===selected);
    if(!active)selected=regions[0]?.id||'';
    const signature=regions.map(object=>object.id).join('|');
    if(target.dataset.signature!==signature){
      target.replaceChildren();
      for(const [index,object] of regions.entries()){
        const option=document.createElement('option');
        option.value=object.id;
        const colour=NAMES[object.colorIndex]||'colour';
        option.textContent=(index+1)+'. '+colour+' · '+object.id;
        target.append(option);
      }
      target.dataset.signature=signature;
    }
    target.value=selected;
    const {override,defaults}=read();
    const actual={...defaults,...override};
    for(const [name,field] of controls){
      field.value=String(actual[name]);
      field.disabled=!selected||recipe.lockedSettings.includes('regionEdgeOverrides');
      if(field.type==='range'){
        const output=field.parentElement.querySelector('output');
        if(output)output.textContent=field.value+'%';
      }
    }
    const disabled=!selected||recipe.lockedSettings.includes('regionEdgeOverrides');
    target.disabled=!regions.length;
    clear.disabled=disabled||!override;
    status.textContent=recipe.lockedSettings.includes('regionEdgeOverrides')?
      'Individual edge assignments are locked':
      override?'Custom edges for '+selected:
        selected?'Using the global region edge settings':'No regions available';
    section.hidden=recipe.structure!=='regions';
  };
  target.addEventListener('change',()=>{selected=target.value;sync();});
  const commit=()=>{
    const {recipe}=read();
    if(!selected||recipe.lockedSettings.includes('regionEdgeOverrides'))return;
    const remaining=(recipe.regionEdgeOverrides||[]).filter(v=>v.id!==selected);
    onApply({...recipe,regionEdgeOverrides:[...remaining,{id:selected,...values()}]});
  };
  for(const field of controls.values())field.addEventListener('change',commit);
  clear.addEventListener('click',()=>{
    const recipe=getRecipe();
    if(!selected||recipe.lockedSettings.includes('regionEdgeOverrides'))return;
    onApply({...recipe,regionEdgeOverrides:(recipe.regionEdgeOverrides||[])
      .filter(v=>v.id!==selected)});
  });
  sync();
  return {sync};
}
