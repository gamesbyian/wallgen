#!/usr/bin/env node
/**
 * Independent state-aware exploratory Chromium adversary. The next action is
 * chosen at runtime from actual visible user-operable controls, not a saved
 * click script. RNG seeds make counterexamples reproducible, not human testing.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve('artifacts/independent-exploratory');
await mkdir(out,{recursive:true});
const scenes=[
 {id:'path-narrow',width:320,height:700,theme:'cream',rng:0x79fa410,
  recipe:{seed:'adversarial-path',structure:'paths',geometry:'zigzag',material:'linen'}},
 {id:'radial-transition',width:499,height:892,theme:'dark',rng:0x91551b0,
  recipe:{seed:'adversarial-radial',structure:'radial',radialMode:'pinwheel',material:'grain'}},
 {id:'regions-new-breakpoint',width:500,height:892,theme:'cream',rng:0xc92a331,
  recipe:{seed:'adversarial-regions',structure:'regions',regionMode:'voronoi',material:'linen'}},
 {id:'nested-standard',width:412,height:892,theme:'dark',rng:0x1ae5053,
  recipe:{seed:'adversarial-nested',structure:'regions',regionMode:'nested',material:'foil'}}
];
function seeded(n){
 let x=n>>>0;
 return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};
}
const browser=await chromium.launch({headless:true});
const findings=[],failures=[];
try{
 for(const item of scenes){
  const context=await browser.newContext({viewport:{width:item.width,height:item.height},
    hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(14000);
  const initial=normalizeRecipe(item.recipe),next=seeded(item.rng),
    history=[],errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto(origin+'/?r='+encodeRecipe(initial),{waitUntil:'domcontentloaded'});
   await page.evaluate(theme=>localStorage.setItem('roygbiv:studio-theme:v1',theme),
     item.theme);
   await page.reload({waitUntil:'domcontentloaded'});
   assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),initial);
   let screenCounts={};
   for(let step=0;step<60;step++){
    const ui=await page.evaluate(()=>{
      const can=el=>{
        if(!el||el.disabled||el.closest('[hidden],[inert]'))return false;
        const rect=el.getBoundingClientRect(),css=getComputedStyle(el);
        if(css.visibility==='hidden'||css.display==='none'||
          rect.width<15||rect.height<15)return false;
        const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
        if(x<0||x>=innerWidth||y<0||y>=innerHeight)return false;
        const top=document.elementFromPoint(x,y);
        return top===el||el.contains(top);
      };
      const edit=document.body.classList.contains('mobile-edit-open');
      const visibleCategories=[...document.querySelectorAll('.settings-tab[data-tab]')]
        .filter(can).map(el=>el.dataset.tab);
      const visibleTools=[...document.querySelectorAll('.editor-tool-chooser .editor-tool-tab[data-editor-tool]')]
        .filter(can).map(el=>el.dataset.editorTool);
      const dock=['mobileStudio','mobileEdit','mobileExplore','mobileSaved','mobileMore']
        .filter(id=>can(document.getElementById(id)));
      const search=document.querySelector('.editor-search-input');
      return {edit,dock,visibleCategories,visibleTools,
        dismiss:can(document.getElementById('mobileDismissHandle')),
        find:can(document.querySelector('button[aria-label="Find a setting"]')),
        closeSearch:can(document.querySelector('.editor-search-close')),
        searchOpen:!!search&&can(search),
        focus:can(document.querySelector('.editor-focus-toggle')),
        all:can(document.querySelector('.editor-focus-all')),
        metadata:can(document.getElementById('metadataToggle')),
        current:document.querySelector('#mobileActionDock [aria-current="page"]')?.id||''};
    });
    let options=[];
    for(const id of ui.dock)options.push({kind:'dock',value:id});
    if(ui.dismiss)options.push({kind:'dismiss'});
    for(const id of ui.visibleCategories)options.push({kind:'category',value:id});
    for(const id of ui.visibleTools)options.push({kind:'tool',value:id});
    if(ui.find&&!ui.searchOpen)options.push({kind:'searchOpen'});
    if(ui.closeSearch)options.push({kind:'searchClose'});
    if(ui.searchOpen)options.push({kind:'searchText',value:next()<.5?'geometry':'lighting'});
    if(ui.focus)options.push({kind:'focusToggle'});
    if(ui.all)options.push({kind:'focusAll'});
    if(ui.metadata)options.push({kind:'metadataToggle'});
    if(ui.edit)options.push({kind:'escape'});
    if(!options.length)throw new Error('No browser-reachable action from '+JSON.stringify(ui));
    const action=options[Math.floor(next()*options.length)];
    const before=decodeRecipe(new URL(page.url()).searchParams.get('r'));
    try{
      if(action.kind==='dock')await page.locator('#'+action.value).click();
      else if(action.kind==='dismiss')await page.locator('#mobileDismissHandle').click();
      else if(action.kind==='category')await page.locator('#tab-'+action.value).click();
      else if(action.kind==='tool')await page.locator('.editor-tool-chooser .editor-tool-tab[data-editor-tool="'+action.value+'"]').click();
      else if(action.kind==='searchOpen')await page.getByRole('button',{name:'Find a setting',exact:true}).click();
      else if(action.kind==='searchClose')await page.locator('.editor-search-close').click();
      else if(action.kind==='searchText')await page.locator('.editor-search-input').fill(action.value);
      else if(action.kind==='focusToggle')await page.locator('.editor-focus-toggle').click();
      else if(action.kind==='focusAll')await page.locator('.editor-focus-all').click();
      else if(action.kind==='metadataToggle')await page.locator('#metadataToggle').click();
      else if(action.kind==='escape')await page.keyboard.press('Escape');
    }catch(e){throw new Error('Runtime-chosen action not truly reachable: '+
      JSON.stringify({step,action,ui})+' '+e);}
    const after=decodeRecipe(new URL(page.url()).searchParams.get('r'));
    assert.deepEqual(after,before,'Navigation-only action mutated recipe: '+JSON.stringify({step,action}));
    assert.deepEqual(errors,[],'JavaScript exception from runtime-chosen action');
    const snapshot={step,action,current:ui.current,choices:options.length};
    history.push(snapshot);
    screenCounts[action.kind]=(screenCounts[action.kind]||0)+1;
    if(step%15===0)await page.screenshot({path:join(out,item.id+'-'+String(step).padStart(2,'0')+'.png'),animations:'disabled'});
   }
   findings.push({scene:item.id,seed:item.rng,viewport:[item.width,item.height],
     theme:item.theme,actions:history.length,counts:screenCounts,history,
     originalRecipePreserved:true});
   console.log('INDEPENDENT_RUNTIME_EXPLORATION_PASS',JSON.stringify({
     scene:item.id,actions:history.length,counts:screenCounts}));
  }catch(e){
   failures.push({scene:item.id,step:history.length,error:String(e),stack:e.stack,
     tail:history.slice(-20),pageErrors:errors});
   await page.screenshot({path:join(out,'failure-'+item.id+'.png'),animations:'disabled'}).catch(()=>{});
  }finally{await context.close();}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({findings,failures,
   method:'runtime-chosen actions based on actual hittable DOM, fixed RNG seed for reproducing failures',
   limitations:['not a human unscripted user session or human icon recognition review',
    'navigation-only state graph, not every app action/conditional permutation',
    'no physical device or spoken screen reader']},null,2));
 assert.deepEqual(failures,[],'State-aware exploratory browser found an issue');
 assert.equal(findings.length,scenes.length);
 assert.equal(findings.reduce((a,b)=>a+b.actions,0),240);
 console.log('INDEPENDENT_RUNTIME_EXPLORATION_SUCCESS');
}finally{await browser.close();}
