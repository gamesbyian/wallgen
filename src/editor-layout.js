import {EDITOR_CATEGORIES, TOOL_LIST, SETTING_TOOL} from './editor-schema.js?v=20261018-icons2';
import {iconMarkup} from './ui-icons.js';
import {annotateEditorSettingRow,sourceSettingLabel} from './editor-control-roles.js';
import {installFocusedAdjustments} from './editor-focus.js';
import {toolAppliesToScene} from './editor-tool-applicability.js';
import {findEditorToolMatch} from './editor-tool-search.js';
import {legacyToolAliases,legacyCategoryAliases,legacySettingAliases} from './editor-terminology.js';
import {installMaterialLayerIndicators} from './editor-material-indicators.js';

const byId=id=>document.getElementById(id);
const form=byId('controls');
function fieldNode(key){
  const field=form.elements.namedItem(key);
  if(!field)throw new Error('Editor schema references missing setting: '+key);
  return field.closest('.lockable-setting')||field.closest('.texture-rotation-field')||
    field.closest('label')||field;
}
const tools=new Map();
let activeCategory='layout',activeTool='arrange';
let activeStructure='paths',activeRegionMode='voronoi',activeConstruction='ribbon';
// Keep the editor populated only with tools that can modify the active scene.
// Hidden tools retain all values and locks; changing structure restores them.
function toolApplies(entry){
  return toolAppliesToScene({category:entry.category,id:entry.spec.id},{
    structure:activeStructure,regionMode:activeRegionMode,construction:activeConstruction
  });
}
function applicableTool(category){
  return [...tools.values()].find(entry=>entry.category===category&&toolApplies(entry))?.spec.id;
}
export function syncEditorStructure(structure,regionMode,construction='ribbon'){
  activeStructure=structure;
  activeRegionMode=regionMode;
  activeConstruction=construction;
  const pathTab=byId('tab-path');
  if(pathTab?.lastChild?.nodeType===3)
    pathTab.lastChild.textContent=structure==='paths'?' Path':' Geometry';
  const shapesTab=byId('tab-stripes');
  if(shapesTab?.lastChild?.nodeType===3)
    shapesTab.lastChild.textContent=' Stripes';
  if(shapesTab){
    shapesTab.disabled=structure!=='paths';
    shapesTab.setAttribute('aria-disabled',String(structure!=='paths'));
  }
  for(const select of form.querySelectorAll('[name=textureCoverage],[name=textureCoverage2],[name=textureCoverage3]')){
    const prefix=structure==='paths'?'stripes':'shapes';
    const both=select.querySelector('option[value=both]');
    const ink=select.querySelector('option[value=stripes]');
    if(both)both.textContent='Background and '+prefix;
    if(ink)ink.textContent=(structure==='paths'?'Stripes':'Shapes')+' only';
  }
  const selected=tools.get(activeTool);
  if(activeCategory==='stripes'&&structure!=='paths')
    selectEditorTool('details',applicableTool('details'));
  else if(!selected||!toolApplies(selected))
    selectEditorTool(activeCategory,applicableTool(activeCategory));
  else selectEditorTool(activeCategory,activeTool);
}
function appendUnique(host,node){
  if(node&&!host.contains(node))host.append(node);
}
function create(tag,className,textContent){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(textContent!==undefined)node.textContent=textContent;
  return node;
}
export function mountEditor(){
  const nav=form.querySelector('.settings-tabs');
  const originals=[...form.querySelectorAll('.settings-panel')];
  for(const panel of originals)panel.id='legacy-'+panel.id;
  const oldFamily=fieldNode('family');
  // Preserve the actual form nodes and event/lock behavior, never proxies.
  const explore=create('div','editor-explore');
  const style=create('div','editor-style');
  // The original field label is already Starting style. Avoid a duplicate.
  style.append(oldFamily);
  const controls=create('div','editor-explore-actions');
  const scopeMode=create('select','editor-variation-mode');
  scopeMode.id='editorVariationMode';scopeMode.setAttribute('aria-label','Randomization style');
  for(const [value,name] of [['reroll','Reroll'],['vary','Vary']]){
    const opt=create('option',null,name);opt.value=value;scopeMode.append(opt);
  }
  const strength=create('select','editor-variation-strength');
  strength.id='editorVariationStrength';strength.setAttribute('aria-label','Variation strength');
  for(const [value,name] of [['gentle','Gentle'],['moderate','Moderate'],['wild','Wild']]){
    const opt=create('option',null,name);opt.value=value;strength.append(opt);
  }
  const randomCategory=create('button','editor-scope-button');
  randomCategory.innerHTML=iconMarkup('randomize')+' Category';
  randomCategory.type='button';randomCategory.dataset.randomCategory='layout';
  randomCategory.title='Change only unlocked settings in this category';
  const search=create('button','editor-search-toggle');
  search.innerHTML=iconMarkup('search');
  search.type='button';search.title='Find a setting';search.setAttribute('aria-label','Find a setting');
  search.setAttribute('aria-expanded','false');
  const searchInput=create('input','editor-search-input');
  searchInput.type='search';searchInput.placeholder='Find a setting…';
  searchInput.setAttribute('aria-label','Search wallpaper settings');searchInput.hidden=true;
  const searchStatus=create('p','editor-search-status');
  searchStatus.id='editorSearchStatus';searchStatus.hidden=true;
  searchStatus.setAttribute('role','status');searchStatus.setAttribute('aria-live','polite');
  searchInput.setAttribute('aria-describedby',searchStatus.id);
  const searchClose=create('button','editor-search-close','×');
  searchClose.type='button';searchClose.hidden=true;
  searchClose.setAttribute('aria-label','Close setting search');
  searchClose.title='Close search';
  controls.append(scopeMode,strength,randomCategory,search);
  explore.append(style,controls,searchInput,searchClose,searchStatus);
  nav.before(explore);
  nav.replaceChildren();

  const chooser=create('nav','editor-tool-chooser');
  chooser.setAttribute('aria-label','Tools in selected category');
  nav.after(chooser);
  const updateChooserEdges=()=>{
    const max=chooser.scrollWidth-chooser.clientWidth;
    chooser.dataset.moreLeft=String(chooser.scrollLeft>3);
    chooser.dataset.moreRight=String(max>3&&chooser.scrollLeft<max-3);
  };
  chooser.addEventListener('scroll',updateChooserEdges,{passive:true});
  new ResizeObserver(updateChooserEdges).observe(chooser);
  document.addEventListener('editor-tool-changed',()=>requestAnimationFrame(updateChooserEdges));
  for(const category of EDITOR_CATEGORIES){
    const button=create('button','settings-tab');
    button.type='button';button.id='tab-'+category.id;button.dataset.tab=category.id;
    button.setAttribute('role','tab');button.setAttribute('aria-controls','panel-'+category.id);
    button.setAttribute('aria-selected',String(category.id==='layout'));
    button.tabIndex=category.id==='layout'?0:-1;
    button.innerHTML='<span aria-hidden="true">'+iconMarkup(category.icon)+'</span> '+category.label;
    nav.append(button);
    const panel=create('section','settings-panel editor-category-panel');
    panel.id='panel-'+category.id;panel.dataset.category=category.id;
    panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);
    // Every panel has reachable editor controls; the panel itself must not
    // become a zero-height Tab stop while the mobile editor is closed. Keep
    // programmatic focus available to assistive navigation when needed.
    panel.tabIndex=-1;panel.hidden=category.id!=='layout';
    form.append(panel);
    for(const tool of category.tools){
      const chip=create('button','editor-tool-tab',tool.name);
      const toolIcon=({outlines:'outlines',shadows:'shadows',glow:'glow',lighting:'lighting',interior:'interior-elements',geometry:'path',patterns:'stripes',ray:'path',surface:'material'})[tool.id];
      if(toolIcon)chip.innerHTML=iconMarkup(toolIcon)+'<span>'+tool.name+'</span>';
      chip.type='button';chip.dataset.editorTool=tool.id;
      chip.dataset.category=category.id;
      chip.setAttribute('aria-pressed',String(tool.id===category.tools[0].id));
      chooser.append(chip);
      const card=create('div','editor-tool-card');
      card.dataset.editorTool=tool.id;card.dataset.category=category.id;
      card.setAttribute('role','group');
      card.setAttribute('aria-label',tool.name+' controls');
      card.hidden=tool.id!==category.tools[0].id;
      // The active tool chip already identifies the card. Keep only the
      // scoped-random action in the card chrome, not a duplicate heading.
      const roll=create('button','editor-scope-button editor-tool-reroll');
      roll.innerHTML=iconMarkup('randomize')+' Tool';
      roll.type='button';roll.dataset.randomTool=tool.id;
      roll.title='Change only unlocked '+tool.name.toLowerCase()+' settings';
      roll.setAttribute('aria-label','Randomize '+tool.name+' tool');
      roll.hidden=tool.id!==category.tools[0].id;
      chooser.append(roll);
      panel.append(card);
      tools.set(tool.id,{spec:tool,card,chip,category:category.id});
    }
  }
  // Composite controls must travel together; the current form's built-in
  // visibility/lock logic continues to target these unchanged DOM identities.
  const special={
    direction:['diagonalSettings'],
    lighting:['lighting-subsection'],
    shadows:['stripe-shadow-section'],
    layer1:['texture-layer-group'],
    layer2:['textureLayer2Panel'],
    layer3:['textureLayer3Panel'],
  };
  for(const [toolId,selectors] of Object.entries(special)){
    const host=tools.get(toolId).card;
    for(const selector of selectors){
      const node=byId(selector)||document.querySelector('.'+selector);
      if(!node)throw new Error('Missing composite editor control '+selector);
      appendUnique(host,node);
    }
  }
  for(const {spec,card} of tools.values())for(const key of spec.settings){
    // The texture enabled flags are intentionally hidden inputs. Their real
    // add/remove controls remain inside the relocated texture layer groups.
    if(key==='textureLayer2Enabled'||key==='textureLayer3Enabled')continue;
    const root=fieldNode(key);
    annotateEditorSettingRow(root,form.elements.namedItem(key),key,
      {category:spec.category||card.dataset.category,tool:spec.id});
    appendUnique(card,root);
  }
  // Each source field has a stable semantic row identity, not a reconstructed
  // input. Retaining original DOM nodes preserves handlers, locks and recipes.
  // Rich dynamic interior controls have their own component system.
    // Keep the dynamic explanation beside the coherence and intersection
  // controls after the legacy controls are moved to their canonical home.
  appendUnique(tools.get('safety').card,byId('geometrySafetyStatus'));
  // Every property gets its own miniature, scope-safe die. The active
  // variation mode decides whether it rerolls or explores a nearby value.
  for(const t of TOOL_LIST)for(const key of t.settings){
    if(key==='textureLayer2Enabled'||key==='textureLayer3Enabled')continue;
    const root=fieldNode(key);
    if(root.querySelector?.('[data-random-setting="'+key+'"]'))continue;
    const die=create('button','editor-setting-die');
    die.innerHTML=iconMarkup('randomize');
    die.type='button';die.dataset.randomSetting=key;
    const name=sourceSettingLabel(form.elements.namedItem(key),key);
    die.setAttribute('aria-label','Randomize only '+name);
    die.title='Reroll or vary '+name+' only';
    root.append(die);
  }
  for(const old of originals){old.hidden=true;old.setAttribute('aria-hidden','true');}
  chooser.querySelectorAll('[data-editor-tool]').forEach(button=>
    button.addEventListener('click',()=>selectEditorTool(button.dataset.category,button.dataset.editorTool)));
  // Named tools form one horizontal selection group. Roving focus keeps Tab
  // traversal short while arrow/Home/End keys reveal otherwise offscreen tools.
  chooser.addEventListener('keydown',event=>{
    const origin=event.target.closest('[data-editor-tool]');
    if(!origin||!chooser.contains(origin))return;
    const visible=[...chooser.querySelectorAll('[data-editor-tool]')]
      .filter(chip=>!chip.hidden&&!chip.disabled);
    const index=visible.indexOf(origin);
    if(index<0||!visible.length)return;
    let next;
    if(event.key==='ArrowRight')next=visible[(index+1)%visible.length];
    else if(event.key==='ArrowLeft')next=visible[(index+visible.length-1)%visible.length];
    else if(event.key==='Home')next=visible[0];
    else if(event.key==='End')next=visible[visible.length-1];
    else return;
    event.preventDefault();
    selectEditorTool(next.dataset.category,next.dataset.editorTool,{source:'keyboard'});
    next.focus({preventScroll:true});
  });
  function currentCategoryFromTabs(){
    return nav.querySelector('[aria-selected=true]')?.dataset.tab||activeCategory;
  }
  nav.addEventListener('click',event=>{
    const button=event.target.closest('[data-tab]');
    if(!button)return;
    selectEditorTool(button.dataset.tab,EDITOR_CATEGORIES.find(c=>c.id===button.dataset.tab).tools[0].id);
  });
  // The selected tab is the only normal Tab stop; arrows/Home/End navigate
  // the whole category row, including tabs offscreen at phone widths.
  nav.addEventListener('keydown',event=>{
    const current=event.target.closest('[data-tab]');
    if(!current||!nav.contains(current))return;
    const available=[...nav.querySelectorAll('[data-tab]')].filter(tab=>!tab.disabled);
    const index=available.indexOf(current);
    if(index<0)return;
    let next;
    if(event.key==='ArrowRight')next=available[(index+1)%available.length];
    else if(event.key==='ArrowLeft')next=available[(index+available.length-1)%available.length];
    else if(event.key==='Home')next=available[0];
    else if(event.key==='End')next=available[available.length-1];
    else return;
    event.preventDefault();
    selectEditorTool(next.dataset.tab,applicableTool(next.dataset.tab),{source:'keyboard'});
    next.focus({preventScroll:true});
  });
  document.addEventListener('editor-category-change',event=>{
    const cat=event.detail;
    if(cat!==activeCategory)selectEditorTool(cat,EDITOR_CATEGORIES.find(c=>c.id===cat).tools[0].id);
  });
  randomCategory.addEventListener('click',()=>{randomCategory.dataset.randomCategory=currentCategoryFromTabs();});
  function closeSearch(){
    searchInput.hidden=true;searchClose.hidden=true;searchStatus.hidden=true;
    searchStatus.textContent='';
    explore.classList.remove('editor-search-open');
    search.setAttribute('aria-expanded','false');
    searchInput.value='';
    search.focus({preventScroll:true});
  }
  search.addEventListener('click',()=>{
    if(!searchInput.hidden){closeSearch();return;}
    searchInput.hidden=false;searchClose.hidden=false;
    explore.classList.add('editor-search-open');
    search.setAttribute('aria-expanded','true');
    searchInput.focus({preventScroll:true});
  });
  searchClose.addEventListener('click',closeSearch);
  searchInput.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closeSearch();}
  });
  searchInput.addEventListener('input',()=>{
    const query=searchInput.value.trim();
    searchStatus.hidden=true;
    searchStatus.textContent='';
    if(!query)return;
    const labelFor=key=>sourceSettingLabel(form.elements.namedItem(key),key);
    const options={labelFor,applies:tool=>toolApplies(tools.get(tool.id)),
      aliasesForTool:legacyToolAliases,aliasesForCategory:legacyCategoryAliases,
      aliasesForSetting:legacySettingAliases};
    const match=findEditorToolMatch(query,TOOL_LIST,options);
    if(match){
      selectEditorTool(match.category,match.id,{source:'search'});
      return;
    }
    const dormant=findEditorToolMatch(query,TOOL_LIST,{labelFor,
      aliasesForTool:legacyToolAliases,aliasesForCategory:legacyCategoryAliases,
      aliasesForSetting:legacySettingAliases});
    searchStatus.textContent=dormant
      ?'That setting is unavailable for the current canvas structure.'
      :'No matching settings.';
    searchStatus.hidden=false;
  });
  // The visible Tool / Category / setting dice are concise; their spoken
  // action must identify the actual scope and the currently selected mode.
  function syncScopeActionLabels(){
    const verb=scopeMode.value==='vary'?'Vary':'Reroll';
    const selectedCategory=EDITOR_CATEGORIES.find(c=>c.id===activeCategory);
    const catName=activeCategory==='path'&&activeStructure!=='paths'?'Geometry':
      selectedCategory?.label||activeCategory;
    randomCategory.setAttribute('aria-label',verb+' '+catName+' category');
    for(const entry of tools.values()){
      const button=chooser.querySelector('[data-random-tool="'+entry.spec.id+'"]');
      if(button)button.setAttribute('aria-label',verb+' '+entry.spec.name+' tool');
    }
    for(const die of form.querySelectorAll('[data-random-setting]')){
      const key=die.dataset.randomSetting;
      const full=sourceSettingLabel(form.elements.namedItem(key),key);
      if(key==='geometrySafety')continue; // source guard forbids randomization
      die.setAttribute('aria-label',verb+' only '+full);
    }
  }
  scopeMode.addEventListener('change',syncScopeActionLabels);
  document.addEventListener('editor-tool-changed',syncScopeActionLabels);
  syncScopeActionLabels();
  selectEditorTool('layout','arrange');
  const focused=installFocusedAdjustments({form,chooser});
  installMaterialLayerIndicators({form,tools});
  return {focused,getCurrent:()=>({category:activeCategory,tool:activeTool}),tools,chooser,searchInput};
}
export function selectEditorTool(category,tool,{source='manual'}={}){
  let selected=tools.get(tool);
  if(!selected||selected.category!==category||!toolApplies(selected)){
    tool=applicableTool(category);selected=tools.get(tool);
  }
  if(!selected)return;
  activeCategory=category;activeTool=tool;
  const chooser=document.querySelector('.editor-tool-chooser');
  for(const [id,entry] of tools){
    entry.card.hidden=id!==tool;
    entry.chip.hidden=entry.category!==category||!toolApplies(entry);
    const roll=document.querySelector('[data-random-tool="'+id+'"]');
    if(roll)roll.hidden=id!==tool;
    entry.chip.setAttribute('aria-pressed',String(id===tool));
    entry.chip.tabIndex=id===tool?0:-1;
  }
  for(const panel of document.querySelectorAll('.editor-category-panel'))
    panel.hidden=panel.dataset.category!==category;
  for(const button of document.querySelectorAll('.settings-tab')){
    const isActive=button.dataset.tab===category;
    button.setAttribute('aria-selected',String(isActive));
    button.tabIndex=isActive?0:-1;
  }
  // Preserve manual category swipes; reveal offscreen category tabs only for
  // search and keyboard selection, independently of the tool-chip scroll.
  if(source==='search'||source==='keyboard'){
    const tabRail=document.querySelector('.settings-tabs');
    const selectedTab=tabRail?.querySelector('.settings-tab[aria-selected="true"]');
    if(selectedTab){
      const bounds=tabRail.getBoundingClientRect();
      const tab=selectedTab.getBoundingClientRect();
      const left=bounds.left+4,right=bounds.right-4;
      if(tab.left<left)tabRail.scrollLeft+=tab.left-left;
      else if(tab.right>right)tabRail.scrollLeft+=tab.right-right;
    }
    const rail=chooser.getBoundingClientRect();
    const chip=selected.chip.getBoundingClientRect();
    // Both Focus and the Tool die are independently sticky on mobile.
    // Clearing Focus alone places keyboard/Home/Search-selected tool chips
    // physically underneath the Tool die. Use ACTUAL pinned rectangles so
    // the hit area stays unobscured at every responsive breakpoint.
    const pinned=[...chooser.querySelectorAll(
      '.editor-focus-toggle,.editor-tool-reroll:not([hidden])')]
      .filter(el=>getComputedStyle(el).position==='sticky'&&
        getComputedStyle(el).display!=='none');
    const pinnedRight=Math.max(rail.left,
      ...pinned.map(el=>el.getBoundingClientRect().right));
    const left=pinnedRight+10,right=rail.right-10;
    if(chip.left<left)chooser.scrollLeft+=chip.left-left;
    else if(chip.right>right)chooser.scrollLeft+=chip.right-right;
  }
  const reroll=document.querySelector('[data-random-category]');
  if(reroll)reroll.dataset.randomCategory=category;
  document.dispatchEvent(new CustomEvent('editor-tool-changed',{detail:{category,tool}}));
}
export function editorToolForSetting(key){return SETTING_TOOL[key]||null;}
