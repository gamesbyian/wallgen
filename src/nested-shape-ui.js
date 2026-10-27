// One compact existing-Design-editor surface for nested imported silhouettes.
// It modifies only the current canonical recipe; no separate SVG/raster editor.
import {DEFAULT_NESTED_CONTOURS,nestedContourDistances,fitNestedShapeContours} from './nested-shape-contours.js';
import {frameImportedSilhouette,frameUnpositionedNestedSilhouette} from './nested-shape-framing.js';

const add=(parent,tag,text)=>{
  const node=document.createElement(tag);
  if(text!==undefined)node.textContent=text;
  parent.append(node);
  return node;
};
export function installNestedShapeControls({form,getRecipe,getScene,onApply,onNotice}){
  const shape=form.querySelector('[name="scatteredShapeKind"]')?.closest('label');
  if(!shape)return {sync(){}};
  const root=document.createElement('div');
  root.className='nested-shape-studio';
  root.setAttribute('aria-label','Nested imported silhouette controls');
  shape.after(root);
  const button=add(root,'button','Nest shape · 7 colours');
  button.type='button';
  button.className='button button-outline';
  button.setAttribute('aria-pressed','false');
  const help=add(root,'p','Import a silhouette, then create seven true contour outlines.');
  help.className='nested-shape-help';
  const controls=add(root,'details');
  controls.className='nested-shape-fields';
  add(controls,'summary','Fine-tune count, spacing and thickness');
  controls.hidden=true;
  const fields={};
  const numeric=(key,title,min,max,step)=>{
    const label=add(controls,'label');
    label.className='field';
    const text=add(label,'span',title);
    const input=add(label,'input');
    input.type='number';input.min=String(min);input.max=String(max);
    input.step=String(step);input.inputMode='decimal';
    input.setAttribute('aria-label',key==='count'?title:title+' (design pixels)');
    fields[key]=input;
    input.addEventListener('change',event=>{
      event.stopPropagation();
      const raw=Number(input.value);
      const value=Number.isFinite(raw)?Math.max(min,Math.min(max,raw)):min;
      const r=getRecipe();
      if(!r.nestedShapeContours?.enabled)return;
      onApply({...r,nestedShapeContours:{...r.nestedShapeContours,
        [key]:key==='count'?Math.round(value):value}});
    });
    return {label,text,input};
  };
  numeric('count','Number of rainbow outlines',1,7,1);
  numeric('strokeWidth','Line thickness',.5,12,.5);
  numeric('gap','Clear spacing between lines',.5,30,.5);
  numeric('firstInset','Outer margin',0,50,.5);
  const reverseLabel=add(controls,'label');
  reverseLabel.className='field';
  add(reverseLabel,'span','Colour order');
  const reverse=add(reverseLabel,'select');
  reverse.setAttribute('aria-label','Nested outline colour order');
  for(const [value,text] of [['forward','Red outside → Violet inside'],
    ['reverse','Violet outside → Red inside']]){
    const option=add(reverse,'option',text);option.value=value;
  }
  reverse.addEventListener('change',event=>{
    event.stopPropagation();
    const r=getRecipe();
    if(r.nestedShapeContours?.enabled)
      onApply({...r,nestedShapeContours:{...r.nestedShapeContours,
        colourOrder:reverse.value}});
  });
  const autoFit=add(controls,'button','Auto-fit outlines to shape');
  autoFit.type='button';
  autoFit.className='nested-shape-auto-fit';
  autoFit.setAttribute('aria-label','Auto-fit nested outline spacing to this silhouette');
  const frameButton=add(controls,'button','Fit shape within wallpaper');
  frameButton.type='button';
  frameButton.className='nested-shape-frame';
  frameButton.setAttribute('aria-label','Fit imported silhouette within design canvas');
  const warning=add(controls,'small',
    'Constant-distance contours follow the original outline. Sharp tips, holes and narrow necks may naturally split or lose inner lines; the source shape is never distorted.');
  warning.className='nested-shape-warning';
  // Prevent form-level randomize/setting listeners from treating these
  // independently transactional controls as unrecognized recipe inputs.
  root.addEventListener('input',event=>event.stopPropagation());
  root.addEventListener('change',event=>event.stopPropagation());
  const available=r=>{
    const locks=r.lockedSettings||[];
    return !!r.scatteredShape?.geometry&&
      (!locks.includes('structure')||r.structure==='regions')&&
      (!locks.includes('regionMode')||r.regionMode==='scattered')&&
      (!locks.includes('scatteredShapeKind')||r.scatteredShapeKind==='imported')&&
      (!locks.includes('scatteredCount')||r.scatteredCount===1);
  };
  const sync=()=>{
    const r=getRecipe();
    const enabled=!!r.nestedShapeContours?.enabled;
    const ready=available(r);
    button.disabled=!ready;
    button.textContent=enabled?'Turn off nested outlines':'Nest shape · 7 colours';
    button.setAttribute('aria-pressed',String(enabled));
    const settings=r.nestedShapeContours||DEFAULT_NESTED_CONTOURS;
    help.textContent=!r.scatteredShape?
      'Import a silhouette first using Import image or My shapes & paths.':
      !ready?'Unlock its layout and shape count before nesting.':
      enabled?settings.count+' colour outline'+(settings.count===1?'':'s')+
        ' follow the original boundary at measured distances.':
        'Create seven truly offset rainbow outlines, not scaled copies.';
    controls.hidden=!enabled;
    frameButton.disabled=!enabled||!ready;
    for(const [key,input] of Object.entries(fields))
      if(document.activeElement!==input)input.value=String(settings[key]);
    if(document.activeElement!==reverse)reverse.value=settings.colourOrder;
    if(enabled){
      const object=getScene()?.objects?.find(o=>o.id===settings.objectId&&o.rings?.length);
      const p=object?.rings?.flat()||[];
      if(p.length){
        const xs=p.map(v=>v.x),ys=p.map(v=>v.y);
        const clearance=Math.min(Math.max(...xs)-Math.min(...xs),
          Math.max(...ys)-Math.min(...ys))/2;
        const atMost=nestedContourDistances(settings).filter(d=>d<clearance).length;
        warning.textContent=atMost<settings.count?
          'At most '+atMost+' of '+settings.count+
          ' inset lines fit the entire shape width at this spacing. Reduce thickness or gap. Sharp corners and necks can reduce it further.':
          'Exact inward distances from the original boundary. Tight tips and necks can split contours naturally; no invisible geometry is invented.';
      }
    }
  };
  button.addEventListener('click',()=>{
    const r=getRecipe();
    if(!available(r)){onNotice('Import a shape or unlock the shape layout first.');return;}
    if(r.nestedShapeContours?.enabled){
      onApply({...r,nestedShapeContours:{...r.nestedShapeContours,enabled:false}});
    }else{
      onApply({...r,structure:'regions',regionMode:'scattered',
        scatteredShapeKind:'imported',scatteredCount:1,scatteredEdgeCrop:0,
        scatteredVariation:0,scatteredMinSize:80,scatteredMaxSize:100,
        scatteredSpacing:0,dividerColor:'none',dividerWidth:0,
        // Do not undo the creator's intentional position. Only a silhouette
        // still using procedural placement receives source-derived framing.
        scatteredOverrides:frameUnpositionedNestedSilhouette(
          r,r.scatteredShape.geometry),
        nestedShapeContours:{...DEFAULT_NESTED_CONTOURS,...r.nestedShapeContours,
          enabled:true,objectId:'region-0'}});
      onNotice('Seven real rainbow contour offsets. Edit width and spacing below; Undo restores your previous artwork.');
    }
  });
  frameButton.addEventListener('click',()=>{
    const r=getRecipe();
    if(!r.nestedShapeContours?.enabled||!available(r)){
      onNotice('Enable nested imported outlines before framing the silhouette.');
      return;
    }
    const placed=frameImportedSilhouette(r.scatteredShape?.geometry);
    if(!placed){
      onNotice('This silhouette cannot be framed safely with the current geometry.');
      return;
    }
    const others=(r.scatteredOverrides||[]).filter(item=>item.index!==0);
    const previous=(r.scatteredOverrides||[]).find(item=>item.index===0);
    if(previous&&JSON.stringify(previous)===JSON.stringify(placed)){
      onNotice('The silhouette already fits the design canvas.');
      return;
    }
    onApply({...r,scatteredOverrides:[...others,placed]});
    onNotice('Fitted the imported shape within the design canvas, preserving its aspect ratio and cutouts. Undo restores its previous placement.');
  });
  autoFit.addEventListener('click',()=>{
    const r=getRecipe(),settings=r.nestedShapeContours;
    const object=getScene()?.objects?.find(o=>o.id===settings?.objectId&&o.rings?.length);
    if(!settings?.enabled||!object){
      onNotice('Choose an imported silhouette before fitting outlines.');return;
    }
    const result=fitNestedShapeContours(object.rings,settings);
    if(!result.fitted){
      warning.textContent=result.reason;
      onNotice(result.reason);
      return;
    }
    if(!result.changed){
      onNotice('All '+settings.count+' geometric contour levels already fit.');
      return;
    }
    onApply({...r,nestedShapeContours:result.settings});
    onNotice(result.balancedInnerColours?
      'All seven outlines fit. Tightened their spacing slightly so the inner colours form more substantial contours. Undo restores your previous gap.':
      'Fitted '+settings.count+' outline levels using actual shape geometry. Narrow tips or necks may still split; Undo restores your spacing.');
  });
  document.addEventListener('roygbiv-controls-synced',sync);
  sync();
  return {sync};
}
