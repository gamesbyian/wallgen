// Small, contextual anchor selectors belong beside the dimensions they govern.
// They are recipe-owned, Undoable, accessible and independent of viewport zoom.
import {STRIPE_ANCHORS,GROUP_ANCHORS,WIDTH_ANCHORS,groupAnchorCoordinate,
  bandAnchorCoordinate} from './geometry-anchors.js';

const options={
  spreadAnchor:[['centre','Centre of rainbow'],['red','Red stripe'],['green','Green stripe'],['violet','Violet stripe']],
  repeatAnchor:[['centre','Centre of groups'],['first','First group'],['last','Last group']],
  widthAnchor:[['centre','Centre of rainbow'],['red-edge','Red outer edge'],['violet-edge','Violet outer edge']]
};
export function installGeometryAnchorControls({form,getRecipe,getScene,onApply}){
  const controls=[];
  for(const [key,source,reference] of [
    ['spreadAnchor','spread','spreadAnchorPosition'],
    ['repeatAnchor','repeatSpacing','repeatAnchorPosition'],
    ['widthAnchor','stripeWidth','widthAnchorPosition']
  ]){
    const field=form.elements.namedItem(source);
    const sourceRow=field?.closest('label');
    if(!sourceRow)throw new Error('Anchor control missing source field: '+source);
    const row=document.createElement('label');
    row.className='geometry-anchor-setting';
    const title=document.createElement('span');
    title.textContent=key==='spreadAnchor'?'Hold stripe stationary':
      key==='repeatAnchor'?'Hold group stationary':'Hold ribbon edge stationary';
    const selector=document.createElement('select');
    selector.name=key;
    selector.setAttribute('aria-label',title.textContent);
    selector.setAttribute('aria-describedby',sourceRow.querySelector('small[id]')?.id||'');
    for(const [value,label] of options[key]){
      const item=document.createElement('option');
      item.value=value;item.textContent=label;selector.append(item);
    }
    row.append(title,selector);
    sourceRow.after(row);
    selector.addEventListener('change',event=>{
      // Do not pass these selects through the ordinary source-field change
      // handler: the anchor reference must be captured in the same transaction.
      event.stopPropagation();
      const recipe=getRecipe(),scene=getScene();
      const anchor=selector.value;
      if(key==='spreadAnchor'&&!STRIPE_ANCHORS.includes(anchor)||
         key==='repeatAnchor'&&!GROUP_ANCHORS.includes(anchor)||
         key==='widthAnchor'&&!WIDTH_ANCHORS.includes(anchor))return;
      const stripes=scene?.stripes||[];
      const value=key==='spreadAnchor'?
        (anchor==='centre'?
          (stripes[0]?.center+stripes.at(-1)?.center)/2:
          stripes.find(stripe=>stripe.name===anchor[0].toUpperCase()+anchor.slice(1))?.center):
        key==='widthAnchor'?bandAnchorCoordinate(stripes,anchor):
        groupAnchorCoordinate(scene?.bundleOffsets,anchor);
      if(!Number.isFinite(value))return;
      onApply({...recipe,[key]:anchor,[reference]:value});
    });
    controls.push({key,row,selector});
  }
  const sync=()=>{
    const r=getRecipe();
    for(const {key,row,selector} of controls){
      const value=r[key]||'centre';
      if(document.activeElement!==selector)selector.value=value;
      row.hidden=r.structure!=='paths'||(key==='repeatAnchor'&&r.composition!=='repeat');
    }
  };
  document.addEventListener('roygbiv-controls-synced',sync);
  sync();
  return {sync};
}
