/**
 * One compact workspace per surface layer. The two in-card views move the
 * ORIGINAL source controls: recipe identity, lock buttons, scoped random dice,
 * Undo, and form listeners continue to own the same DOM nodes.
 */
export const MATERIAL_LAYER_VIEWS=Object.freeze([
  {tool:'layer1',group:'.texture-layer-group',
    material:['material','textureCoverage','textureBlend'],
    finish:['textureStrength','textureScale','textureRotation']},
  {tool:'layer2',group:'#textureLayer2Panel',
    material:['material2','textureCoverage2','textureBlend2'],
    finish:['textureStrength2','textureScale2','textureRotation2']},
  {tool:'layer3',group:'#textureLayer3Panel',
    material:['material3','textureCoverage3','textureBlend3'],
    finish:['textureStrength3','textureScale3','textureRotation3']}
].map(value=>Object.freeze({...value,
  material:Object.freeze(value.material),finish:Object.freeze(value.finish)})));

export function materialViewForSetting(key){
  for(const config of MATERIAL_LAYER_VIEWS){
    if(config.material.includes(key))return {tool:config.tool,view:'material'};
    if(config.finish.includes(key))return {tool:config.tool,view:'finish'};
  }
  return null;
}
export function installMaterialInspectors({tools,fieldNode}){
  const panels=new Map();
  for(const [index,config] of MATERIAL_LAYER_VIEWS.entries()){
    const card=tools.get(config.tool)?.card;
    const group=card?.querySelector(config.group);
    if(!group)throw new Error('Missing original texture group: '+config.tool);
    // Original nodes may contain nested controls/rotation shortcuts and lock
    // buttons. Never clone them, especially across Undo and form state sync.
    const materialNodes=config.material.map(fieldNode);
    const finishNodes=config.finish.map(fieldNode);
    const nav=document.createElement('div');
    nav.className='material-inspector-nav';
    nav.setAttribute('role','group');
    nav.setAttribute('aria-label','Layer '+(index+1)+' editing views');
    const views=new Map();
    for(const [view,label,nodes] of [
      ['material','Material',materialNodes],
      ['finish','Finish',finishNodes]
    ]){
      const button=document.createElement('button');
      button.type='button';button.className='material-inspector-tab';
      button.textContent=label;
      button.setAttribute('aria-pressed',String(view==='material'));
      button.setAttribute('aria-controls','material-'+(index+1)+'-'+view);
      const pane=document.createElement('div');
      pane.id='material-'+(index+1)+'-'+view;
      pane.className='material-inspector-pane';
      pane.dataset.materialView=view;
      pane.hidden=view!=='material';
      pane.append(...nodes);
      nav.append(button);
      views.set(view,{button,pane});
    }
    // All fields now belong to one layer. Preserve the original wrapper ID
    // for the application's texture layer visibility/sync contract.
    group.replaceChildren(nav,...[...views.values()].map(v=>v.pane));
    const show=view=>{
      if(!views.has(view))return false;
      for(const [key,{button,pane}] of views){
        const current=key===view;
        pane.hidden=!current;
        button.setAttribute('aria-pressed',String(current));
        button.tabIndex=current?0:-1;
      }
      return true;
    };
    for(const [view,{button}] of views){
      button.addEventListener('click',()=>show(view));
      button.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();
        const keys=['material','finish'];
        const next=event.key==='Home'?'material':event.key==='End'?'finish':
          keys[(keys.indexOf(view)+(event.key==='ArrowRight'?1:keys.length-1))%keys.length];
        show(next);
        views.get(next).button.focus({preventScroll:true});
      });
    }
    panels.set(config.tool,{show,views});
  }
  return {
    show:(tool,view)=>panels.get(tool)?.show(view)||false,
    showForSetting:key=>{
      const match=materialViewForSetting(key);
      return match ? panels.get(match.tool)?.show(match.view)||false : false;
    },
    panes:panels
  };
}
