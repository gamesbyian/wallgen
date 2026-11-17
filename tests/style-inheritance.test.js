import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {STYLE_INHERITABLE_KEYS,isStyleInherited,effectiveStyleValue,
  storedStyleValue,withStyleChoice} from '../src/style-inheritance.js';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../style-inheritance.css',import.meta.url),'utf8');

test('all five style-derived selectors show concrete options; Surprise me stays separate',()=>{
  assert.deepEqual(STYLE_INHERITABLE_KEYS,
    ['geometry','motif','palette','outline','material']);
  assert.doesNotMatch(html,/>Follow style</i);
  for(const key of STYLE_INHERITABLE_KEYS){
    const selector=html.match(new RegExp('<select name="'+key+'"[^>]*>([^<]*(?:<option[^>]*>[^<]*<\\/option>)*).*?<\\/select>'))?.[0];
    assert.ok(selector,'missing '+key+' select');
    assert.doesNotMatch(selector,/<option value="auto">/);
  }
  assert.match(html,/name="family"[^>]*><option value="auto">Surprise me/);
  assert.match(html,/name="orientation"[^>]*><option value="auto">Surprise me/);
});

test('inherited values track starting style without changing saved auto',()=>{
  const recipe=normalizeRecipe({family:'currents'});
  const scene=resolveScene(recipe);
  for(const key of STYLE_INHERITABLE_KEYS){
    assert.equal(isStyleInherited(recipe,key),true);
    assert.equal(effectiveStyleValue(recipe,scene,key),scene[key]);
    assert.equal(storedStyleValue(key,recipe,scene[key]),'auto');
  }
  const changed=normalizeRecipe({...recipe,family:'fracture'});
  assert.equal(effectiveStyleValue(changed,resolveScene(changed),'geometry'),'jagged');
  assert.equal(effectiveStyleValue(changed,resolveScene(changed),'motif'),'solid');
  assert.equal(recipe.geometry,'auto');
});

test('a chosen concrete value remains pinned across style changes',()=>{
  const inherited=normalizeRecipe({family:'currents'});
  const selected=effectiveStyleValue(inherited,resolveScene(inherited),'geometry');
  const pinned=normalizeRecipe(withStyleChoice(inherited,'geometry',selected));
  assert.equal(selected,'wave');
  assert.equal(isStyleInherited(pinned,'geometry'),false);
  assert.equal(storedStyleValue('geometry',pinned,'wave'),'wave');
  const changed=normalizeRecipe({...pinned,family:'fracture'});
  assert.equal(resolveScene(changed).geometry,'wave');
  assert.equal(changed.motif,'auto');
  assert.equal(resolveScene(changed).palette,'electric');
});

test('returning to style inheritance is an undoable recipe value',()=>{
  const explicit=normalizeRecipe({family:'currents',motif:'checker'});
  const restored=normalizeRecipe(withStyleChoice(explicit,'motif','auto'));
  assert.equal(restored.motif,'auto');
  assert.equal(resolveScene(restored).motif,'solid');
  assert.equal(resolveScene({...restored,family:'tapestry'}).motif,'chevrons');
  assert.equal(explicit.motif,'checker');
  assert.throws(()=>withStyleChoice(restored,'family','studio'),RangeError);
});

test('the original form routes direct selections to overrides and unrelated edits preserve auto',()=>{
  assert.match(app,/data\[key\]=storedStyleValue\(key,current,value\)/);
  assert.match(app,/changeRecipe\(withStyleChoice\(fromControls\(\),\s*event\.target\.name,event\.target\.value\)\)/);
  assert.match(app,/if\(select\.dataset\.inactive!=='true'\)\s*select\.value=effectiveStyleValue\(current,scene,key\)/);
  assert.match(app,/action\.dataset\.styleInheritance=key/);
  assert.match(app,/isStyleInherited\(current,key\)\?\s*effectiveStyleValue\(current,currentScene\|\|resolveScene\(current\),key\):'auto'/);
  assert.match(app,/changeRecipe\(\{\.\.\.current,family,stripeWidth:defaults\.stripeWidth\}\)/);
  assert.match(css,/position:absolute/);
  assert.match(css,/calc\\(61% - 35px\\)/);
  assert.doesNotMatch(css,/grid-row:2/);
});
