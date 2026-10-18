import test from 'node:test';
import assert from 'node:assert/strict';
import {EDITOR_CATEGORIES,TOOL_LIST,SETTING_TOOL,WIZARD_STEPS,
  STYLE_PRESETS,validateEditorSchema} from '../src/editor-schema.js';
import {randomizeScope,scopedKeys} from '../src/scoped-random.js';
import {normalizeRecipe,resolveScene} from '../src/model.js';

const values={
  primesOnly:'boolean',family:'style',
  ...Object.fromEntries(TOOL_LIST.flatMap(t=>t.settings.map(k=>[k,true]))),
};
test('all canonical editing settings have one and only one named home',()=>{
  const fields=Object.keys(values).filter(k=>k!=='primesOnly'&&k!=='family');
  assert.deepEqual(validateEditorSchema(fields),{missing:[],duplicated:[],unknown:[]});
  assert.deepEqual(EDITOR_CATEGORIES.map(c=>c.id),WIZARD_STEPS);
  assert.equal(EDITOR_CATEGORIES.length,6);
  assert.equal(new Set(TOOL_LIST.map(t=>t.id)).size,TOOL_LIST.length);
  assert.ok(TOOL_LIST.length>=18);
  for(const tool of TOOL_LIST)for(const key of tool.settings){
    assert.equal(SETTING_TOOL[key].category,tool.category);
    assert.equal(SETTING_TOOL[key].tool,tool.id);
  }
});
test('self-crossing choices share Path Constraints with coherence, not a second tool',()=>{
  const path=EDITOR_CATEGORIES.find(category=>category.id==='path');
  const constraints=path.tools.find(tool=>tool.id==='safety');
  assert.deepEqual(constraints.settings,['geometrySafety','crossingMode']);
  assert.equal(SETTING_TOOL.crossingMode.category,'path');
  assert.equal(SETTING_TOOL.crossingMode.tool,'safety');
  assert.ok(!TOOL_LIST.some(tool=>tool.id==='crossings'));
  assert.deepEqual(scopedKeys('tool','safety'),['geometrySafety','crossingMode']);
  assert.deepEqual(scopedKeys('tool','crossings'),[]);
});
test('each randomization scope targets only its own canonical settings',()=>{
  const fields=new Set(TOOL_LIST.flatMap(t=>t.settings));
  for(const category of EDITOR_CATEGORIES){
    assert.deepEqual(new Set(scopedKeys('category',category.id)),
      new Set(category.tools.flatMap(t=>t.settings)));
    for(const tool of category.tools){
      assert.deepEqual(scopedKeys('tool',tool.id),tool.settings);
      for(const key of tool.settings)
        assert.deepEqual(scopedKeys('setting',key),[key]);
    }
  }
  assert.deepEqual(scopedKeys('tool','not-a-tool'),[]);
  assert.deepEqual(scopedKeys('category','not-a-category'),[]);
  assert.equal(fields.size,TOOL_LIST.reduce((sum,t)=>sum+t.settings.length,0));
});
test('rerolling a single setting never perturbs seed, palette, geometry or framing',()=>{
  const source=normalizeRecipe({seed:'stable-scene',viewZoom:.7,
    geometry:'wave',palette:'jewel',positionX:5,positionY:-3,stripeWidth:50});
  for(let i=0;i<20;i++){
    const {recipe,modified}=randomizeScope(source,{
      scope:'setting',name:'stripeWidth',seed:'roll-'+i
    });
    assert.deepEqual(modified,['stripeWidth']);
    for(const key of Object.keys(source).filter(k=>k!=='stripeWidth'))
      assert.deepEqual(recipe[key],source[key],key);
    assert.equal(resolveScene(recipe).geometry,'wave');
    assert.equal(resolveScene(recipe).palette,'jewel');
  }
});
test('tool and category rerolls preserve other settings, disabled controls and locks',()=>{
  const source=normalizeRecipe({seed:'locked-scene',palette:'earth',
    stripeWidth:68,composition:'single',textureLayer2Enabled:false,
    textureLayer3Enabled:false,lockedSettings:['stripeWidth','geometry']});
  const control=k=>({dataset:{inactive:k==='dotSize'?'true':'false'}});
  for(const [scope,name] of [['tool','structure'],['category','stripes']]){
    const {recipe,modified}=randomizeScope(source,{scope,name,
      seed:'tool-'+scope,control});
    const scoped=new Set(scopedKeys(scope,name));
    assert.ok(modified.length);
    assert.ok(modified.every(k=>scoped.has(k)));
    assert.ok(!modified.includes('dotSize'));
    assert.equal(recipe.stripeWidth,68);
    assert.equal(recipe.palette,'earth');
    assert.equal(recipe.seed,source.seed);
    assert.equal(recipe.textureLayer2Enabled,false);
    assert.equal(recipe.textureLayer3Enabled,false);
  }
});
test('vary nearby never regenerates unrelated fields or travels wildly',()=>{
  const source=normalizeRecipe({seed:'variant',geometry:'wave',stripeWidth:50,
    spread:50,construction:'ribbon',lockedSettings:['stripeWidth']});
  const control=key=>({min:'0',max:'100',step:'1',
    dataset:{inactive:'false'},
    tagName:'INPUT'});
  for(const strength of ['gentle','moderate','wild']){
    const {recipe,modified}=randomizeScope(source,{scope:'tool',name:'structure',
      mode:'vary',strength,seed:'variant-'+strength,control});
    assert.ok(modified.every(k=>['construction','spread'].includes(k)));
    assert.equal(recipe.stripeWidth,50);
    assert.equal(recipe.geometry,'wave');
    assert.equal(recipe.seed,source.seed);
    const bound={gentle:6,moderate:22,wild:50}[strength];
    assert.ok(Math.abs(recipe.spread-source.spread)<=bound+1);
  }
});
test('a hand-drawn geometry is preserved across scoped edits',()=>{
  const source=normalizeRecipe({seed:'drawn',geometry:'drawn',
    customPath:[[.2,.3],[.3,.4],[.7,.8],[.9,.7]]});
  for(const scope of ['setting','tool','category']){
    const name=scope==='setting'?'geometry':scope==='tool'?'geometry':'path';
    const r=randomizeScope(source,{scope,name,seed:'another'}).recipe;
    assert.equal(r.geometry,'drawn');
    assert.deepEqual(r.customPath,source.customPath);
  }
});
test('starting styles explicitly define editable width and primary aesthetics',()=>{
  for(const preset of Object.values(STYLE_PRESETS)){
    for(const key of ['geometry','motif','palette','outline','material','stripeWidth'])
      assert.ok(Object.hasOwn(preset,key),key);
    const r=normalizeRecipe({...preset});
    assert.equal(r.stripeWidth,preset.stripeWidth);
    assert.ok(resolveScene(r).stripes.length===7);
  }
});
