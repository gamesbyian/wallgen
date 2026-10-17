import {EDITOR_CATEGORIES, TOOL_LIST, SETTING_TOOL} from './editor-schema.js';

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
  const styleHeading=create('strong',null,'Starting style');
  style.append(styleHeading,oldFamily);
  const controls=create('div','editor-explore-actions');
  const scopeMode=create('select','editor-variation-mode');
  scopeMode.id='editorVariationMode';scopeMode.setAttribute('aria-label','Randomization style');
  for(const [value,name] of [['reroll','Reroll'],['vary','Vary nearby']]){
    const opt=create('option',null,name);opt.value=value;scopeMode.append(opt);
  }
  const strength=create('select','editor-variation-strength');
  strength.id='editorVariationStrength';strength.setAttribute('aria-label','Variation strength');
  for(const [value,name] of [['gentle','Gentle'],['moderate','Moderate'],['wild','Wild']]){
    const opt=create('option',null,name);opt.value=value;strength.append(opt);
  }
  const randomCategory=create('button','editor-scope-button','✳ Category');
  randomCategory.type='button';randomCategory.dataset.randomCategory='layout';
  randomCategory.title='Change only unlocked settings in this category';
  const search=create('button','editor-search-toggle','⌕');
  search.type='button';search.title='Find a setting';search.setAttribute('aria-label','Find a setting');
  const searchInput=create('input','editor-search-input');
  searchInput.type='search';searchInput.placeholder='Find a setting…';
  searchInput.setAttribute('aria-label','Search wallpaper settings');searchInput.hidden=true;
  controls.append(scopeMode,strength,randomCategory,search);
  explore.append(style,controls,searchInput);
  nav.before(explore);
  nav.replaceChildren();

  const chooser=create('nav','editor-tool-chooser');
  chooser.setAttribute('aria-label','Tools in selected category');
  nav.after(chooser);
  for(const category of EDITOR_CATEGORIES){
    const button=create('button','settings-tab');
    button.type='button';button.id='tab-'+category.id;button.dataset.tab=category.id;
    button.setAttribute('role','tab');button.setAttribute('aria-controls','panel-'+category.id);
    button.setAttribute('aria-selected',String(category.id==='layout'));
    button.tabIndex=category.id==='layout'?0:-1;
    button.innerHTML='<span aria-hidden="true">'+category.icon+'</span> '+category.label;
    nav.append(button);
    const panel=create('section','settings-panel editor-category-panel');
    panel.id='panel-'+category.id;panel.dataset.category=category.id;
    panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);
    panel.tabIndex=0;panel.hidden=category.id!=='layout';
    form.append(panel);
    for(const tool of category.tools){
      const chip=create('button','editor-tool-tab',tool.name);
      chip.type='button';chip.dataset.editorTool=tool.id;
      chip.dataset.category=category.id;
      chip.setAttribute('aria-pressed',String(tool.id===category.tools[0].id));
      chooser.append(chip);
      const card=create('div','editor-tool-card');
      card.dataset.editorTool=tool.id;card.dataset.category=category.id;
      card.setAttribute('role','group');
      card.setAttribute('aria-label',tool.name+' controls');
      card.hidden=tool.id!==category.tools[0].id;
      const heading=create('header','editor-tool-header');
      heading.append(create('strong',null,tool.name));
      const roll=create('button','editor-scope-button','✳ Tool');
      roll.type='button';roll.dataset.randomTool=tool.id;
      roll.title='Change only unlocked '+tool.name.toLowerCase()+' settings';
      heading.append(roll);card.append(heading);
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
    appendUnique(card,fieldNode(key));
  }
  // Every property gets its own miniature, scope-safe die. The active
  // variation mode decides whether it rerolls or explores a nearby value.
  for(const t of TOOL_LIST)for(const key of t.settings){
    if(key==='textureLayer2Enabled'||key==='textureLayer3Enabled')continue;
    const root=fieldNode(key);
    if(root.querySelector?.('[data-random-setting="'+key+'"]'))continue;
    const die=create('button','editor-setting-die','✳');
    die.type='button';die.dataset.randomSetting=key;
    die.setAttribute('aria-label','Randomize only '+key);
    die.title='Reroll or vary this setting only';
    root.append(die);
  }
  for(const old of originals){old.hidden=true;old.setAttribute('aria-hidden','true');}
  chooser.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>selectEditorTool(button.dataset.category,button.dataset.editorTool)));
  function currentCategoryFromTabs(){
    return nav.querySelector('[aria-selected=true]')?.dataset.tab||activeCategory;
  }
  nav.addEventListener('click',event=>{
    const button=event.target.closest('[data-tab]');
    if(!button)return;
    selectEditorTool(button.dataset.tab,EDITOR_CATEGORIES.find(c=>c.id===button.dataset.tab).tools[0].id);
  });
  document.addEventListener('editor-category-change',event=>{
    const cat=event.detail;
    if(cat!==activeCategory)selectEditorTool(cat,EDITOR_CATEGORIES.find(c=>c.id===cat).tools[0].id);
  });
  randomCategory.addEventListener('click',()=>{randomCategory.dataset.randomCategory=currentCategoryFromTabs();});
  search.addEventListener('click',()=>{
    searchInput.hidden=!searchInput.hidden;
    if(!searchInput.hidden)searchInput.focus();
    else searchInput.value='';
  });
  searchInput.addEventListener('input',()=>{
    const q=searchInput.value.toLowerCase().trim();
    if(!q)return;
    const match=TOOL_LIST.find(t=>t.name.toLowerCase().includes(q)||
      t.settings.some(key=>(form.elements.namedItem(key)?.closest('label')?.textContent||key).toLowerCase().includes(q)));
    if(match)selectEditorTool(match.category,match.id);
  });
  selectEditorTool('layout','arrange');
  return {getCurrent:()=>({category:activeCategory,tool:activeTool}),tools,chooser,searchInput};
}
export function selectEditorTool(category,tool){
  const selected=tools.get(tool);
  if(!selected||selected.category!==category)return;
  activeCategory=category;activeTool=tool;
  const chooser=document.querySelector('.editor-tool-chooser');
  for(const [id,entry] of tools){
    entry.card.hidden=id!==tool;
    entry.chip.hidden=entry.category!==category;
    entry.chip.setAttribute('aria-pressed',String(id===tool));
  }
  for(const panel of document.querySelectorAll('.editor-category-panel'))
    panel.hidden=panel.dataset.category!==category;
  for(const button of document.querySelectorAll('.settings-tab')){
    const isActive=button.dataset.tab===category;
    button.setAttribute('aria-selected',String(isActive));
    button.tabIndex=isActive?0:-1;
  }
  const reroll=document.querySelector('[data-random-category]');
  if(reroll)reroll.dataset.randomCategory=category;
  document.dispatchEvent(new CustomEvent('editor-tool-changed',{detail:{category,tool}}));
}
export function editorToolForSetting(key){return SETTING_TOOL[key]||null;}
