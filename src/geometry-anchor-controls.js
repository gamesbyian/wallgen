// Compact, source-adjacent controls: the fixed-height mobile tool card
// must never hide the colour anchors below its clipped viewport.
import {STRIPE_ANCHORS,GROUP_ANCHORS,WIDTH_ANCHORS,LENGTH_ANCHORS,groupAnchorCoordinate} from './geometry-anchors.js';
import {balanceStripeEnds} from './renderer.js?v=20261116-insetstation1';
import {resolveScene} from './model.js';

const options={
  spreadAnchor:[['centre','Centre'],['red','Red'],['green','Green'],['violet','Violet']],
  repeatAnchor:[['centre','Centre'],['first','First group'],['last','Last group']],
  widthAnchor:[['centre','Centre'],['red-edge','Red edge'],['violet-edge','Violet edge']],
  pathLengthAnchor:[['centre','Centre'],['start','Start'],['end','End']]
};

export function installGeometryAnchorControls({form,getRecipe,getScene,onApply}){
  const controls=[];
  const stripeStrip=document.createElement('div');
  stripeStrip.className='geometry-anchor-strip';
  stripeStrip.setAttribute('role','group');
  stripeStrip.setAttribute('aria-label','Stationary stripe references');

  for(const [key,source,reference] of [
    ['spreadAnchor','spread','spreadAnchorPosition'],
    ['repeatAnchor','repeatSpacing','repeatAnchorPosition'],
    ['widthAnchor','stripeWidth','widthAnchorBasis'],
    ['pathLengthAnchor','pathLength','pathLengthAnchorPoints']
  ]){
    const field=form.elements.namedItem(source);
    const sourceRow=field?.closest('.lockable-setting')||
      field?.closest('.texture-rotation-field')||field?.closest('label');
    if(!sourceRow)throw new Error('Anchor control missing source field: '+source);
    const isStripeAnchor=key==='spreadAnchor'||key==='widthAnchor';
    const row=isStripeAnchor?stripeStrip:document.createElement('label');
    if(!isStripeAnchor)row.className='geometry-anchor-setting';
    const wrapper=isStripeAnchor?document.createElement('label'):row;
    if(isStripeAnchor)wrapper.className='geometry-anchor-inline';
    const title=document.createElement('span');
    title.textContent=key==='spreadAnchor'?'Spacing lock':
      key==='repeatAnchor'?'Hold group stationary':
      key==='widthAnchor'?'Width edge':'Hold stripe endpoint';
    const selector=document.createElement('select');
    selector.name=key;
    selector.setAttribute('aria-label',key==='spreadAnchor'?'Keep this stripe fixed during spacing changes':
      key==='widthAnchor'?'Keep this ribbon edge fixed during thickness changes':
      title.textContent);
    for(const [value,label] of options[key]){
      const item=document.createElement('option');
      item.value=value;item.textContent=label;selector.append(item);
    }
    wrapper.append(title,selector);
    if(isStripeAnchor){
      stripeStrip.append(wrapper);
      if(key==='spreadAnchor')sourceRow.after(stripeStrip);
    }else{
      if(key==='pathLengthAnchor'){
        const hint=document.createElement('small');
        hint.textContent='Independent inset stripes only. Canvas limits take priority.';
        row.append(hint);
      }
      sourceRow.after(row);
    }
    selector.addEventListener('change',event=>{
      // Capture the reference and change the selection atomically. The
      // form's ordinary scalar-change listener must not process this choice.
      event.stopPropagation();
      const recipe=getRecipe();
      const anchor=selector.value;
      if(key==='spreadAnchor'&&!STRIPE_ANCHORS.includes(anchor)||
         key==='repeatAnchor'&&!GROUP_ANCHORS.includes(anchor)||
         key==='widthAnchor'&&!WIDTH_ANCHORS.includes(anchor)||
         key==='pathLengthAnchor'&&!LENGTH_ANCHORS.includes(anchor))return;
      // The active canvas may still be rendering through the worker. Read
      // authoritative recipe geometry, not a stale presented frame.
      const scene=key==='pathLengthAnchor'?
        (getScene()||resolveScene(recipe)):resolveScene(recipe);
      const stripes=scene?.stripes||[];
      const bareStripes=recipe.widthAnchor&&
        ['spreadAnchor','widthAnchor'].includes(key)?
        resolveScene({...recipe,widthAnchor:undefined,widthAnchorBasis:undefined,
          widthAnchorOffset:undefined}).stripes:stripes;
      if(key==='widthAnchor'){
        const offset=stripes[0]?.center-bareStripes[0]?.center;
        if(!Number.isFinite(offset))return;
        onApply({...recipe,widthAnchor:anchor,widthAnchorBasis:recipe.stripeWidth,
          widthAnchorOffset:offset});
        return;
      }
      if(key==='pathLengthAnchor'){
        if(scene?.composition!=='floating'||scene.geometry==='drawn'||
           scene.insetAlignment!=='independent')return;
        const points=stripes.map(original=>{
          const stripe={...original};
          balanceStripeEnds(scene,stripe,false);
          if(stripe.hidden||!Number.isFinite(stripe.segmentStart)||
             !Number.isFinite(stripe.segmentEnd))return null;
          return anchor==='start'?stripe.segmentStart:
            anchor==='end'?stripe.segmentEnd:
            (stripe.segmentStart+stripe.segmentEnd)/2;
        });
        if(points.every(value=>value===null))return;
        onApply({...recipe,[key]:anchor,[reference]:points});
        return;
      }
      const value=key==='spreadAnchor'?
        (anchor==='centre'?
          (bareStripes[0]?.center+bareStripes.at(-1)?.center)/2:
          bareStripes.find(stripe=>stripe.name===
            anchor[0].toUpperCase()+anchor.slice(1))?.center):
        groupAnchorCoordinate(scene?.bundleOffsets,anchor);
      if(!Number.isFinite(value))return;
      onApply({...recipe,[key]:anchor,[reference]:value});
    });
    controls.push({key,row,selector});
  }

  const sync=()=>{
    const recipe=getRecipe();
    for(const {key,row,selector} of controls){
      if(document.activeElement!==selector)
        selector.value=recipe[key]||'centre';
      row.hidden=recipe.structure!=='paths'||
        (key==='repeatAnchor'&&recipe.composition!=='repeat')||
        (key==='pathLengthAnchor'&&(recipe.composition!=='floating'||
          recipe.insetAlignment!=='independent'||
          getScene()?.geometry==='drawn'));
    }
  };
  document.addEventListener('roygbiv-controls-synced',sync);
  sync();
  return {sync};
}
