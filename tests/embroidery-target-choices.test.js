import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {embroideryObjectChoices,resolveEmbroideryObjectChoice,reconcileEmbroideryObjectOptions}
  from '../src/embroidery-target-choices.js';
import {matchingEmbroidery,normalizeSurfaceTreatments} from '../src/embroidery.js';
const js=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('object picker resolves exactly the stable renderer-authored stripe IDs',()=>{
  for(const mode of ['single','repeat']){
    const scene=resolveScene({seed:'target-choice',structure:'paths',
      composition:mode,repeatCount:3,geometry:'wave',motif:'solid'});
    const choices=embroideryObjectChoices(scene);
    const expected=scene.objects.flatMap(b=>
      b.stripes.map(s=>b.id+'/stripe-'+s.index));
    assert.deepEqual(choices.map(x=>x.id),expected);
    assert.ok(choices.every(x=>/Ribbon/.test(x.label)));
    assert.equal(new Set(choices.map(x=>x.id)).size,choices.length);
  }
});
test('region target IDs match visible generated objects, including scattered and radial scenes',()=>{
  for(const recipe of [
    {structure:'regions',regionMode:'nested'},
    {structure:'regions',regionMode:'scattered'},
    {structure:'radial',radialMode:'pinwheel'}
  ]){
    const scene=resolveScene({...recipe,seed:'target-region'});
    const choices=embroideryObjectChoices(scene);
    assert.deepEqual(choices.map(x=>x.id),
      scene.objects.filter(x=>x.kind==='region').map(x=>x.id));
    assert.ok(choices.every(x=>x.label&&x.id));
  }
});
test('missing saved target is never silently redirected to a different shape',()=>{
  const choices=[{id:'region-0',label:'Red · Shape 1'}];
  const missing=resolveEmbroideryObjectChoice(choices,'region-40');
  assert.equal(missing.selected,'region-40');
  assert.equal(missing.options.length,2);
  assert.equal(missing.options.at(-1).missing,true);
  assert.equal(resolveEmbroideryObjectChoice(choices,'').selected,'region-0');
  assert.equal(resolveEmbroideryObjectChoice([],'').selected,'');
});
test('same-colour objects may be targeted independently and survive URL/PNG recipe normalization',()=>{
  const scene=resolveScene({seed:'one-shape',structure:'regions',
    regionMode:'scattered',scatteredCount:14});
  const choices=embroideryObjectChoices(scene);
  assert.ok(choices.length>=8);
  const item=normalizeSurfaceTreatments([{
    id:'editor-stitches',enabled:true,materialFamily:'embroidery',
    target:{scope:'object',ids:[choices[7].id]},pitch:4,relief:70
  }])[0];
  assert.strictEqual(matchingEmbroidery([item],{id:choices[7].id,colorSlot:0}),item);
  assert.equal(matchingEmbroidery([item],{id:choices[0].id,colorSlot:0}),null);
  const roundtrip=normalizeRecipe({...scene,surfaceTreatments:[item]});
  assert.deepEqual(roundtrip.surfaceTreatments,[item]);
});
test('visible target selector uses original form fields and preserves missing targets',()=>{
  const html=js('index.html'),app=js('src/app.js'),css=js('editor-material-status.css');
  assert.equal((html.match(/name="embroideryObjectId"/g)||[]).length,1);
  assert.match(html,/<option value="object">One chosen ribbon or region/);
  assert.match(app,/const choices=embroideryObjectChoices\(currentScene\|\|resolveScene\(current\)\)/);
  assert.match(app,/resolveEmbroideryObjectChoice\(choices,requested\)/);
  assert.match(app,/ids:\[form\.elements\.namedItem\('embroideryObjectId'\)\.value\]/);
  assert.match(css,/\.embroidery-object-picker\[hidden\]/);
});

test('native object picker retains option identity and focus when recipe rerenders',()=>{
  const select={options:[],value:'',replacements:0,
    ownerDocument:{createElement:()=>({value:'',textContent:''})},
    replaceChildren(...nodes){this.options=nodes;this.replacements++;}
  };
  const choices=[{id:'region-0',label:'Red · Shape 1'},
    {id:'region-1',label:'Orange · Shape 2'}];
  assert.equal(reconcileEmbroideryObjectOptions(select,choices,'region-0'),true);
  const original=select.options[0];
  // Exactly the ordinary slider/Undo sync: same content, regenerated array.
  assert.equal(reconcileEmbroideryObjectOptions(select,choices.map(c=>({...c})),'region-0'),false);
  assert.equal(select.replacements,1,'no native picker teardown during editing');
  assert.strictEqual(select.options[0],original,'preserve focused native option element');
  assert.equal(reconcileEmbroideryObjectOptions(select,choices,'region-1'),false);
  assert.equal(select.value,'region-1');
  assert.equal(select.replacements,1,'selection changes do not rebuild the menu');
  const missing=resolveEmbroideryObjectChoice(choices,'deleted-region');
  assert.equal(reconcileEmbroideryObjectOptions(select,missing.options,missing.selected),true);
  assert.equal(select.options.at(-1).value,'deleted-region');
  assert.equal(select.value,'deleted-region','missing authored target remains explicit');
  assert.equal(reconcileEmbroideryObjectOptions(select,[],''),true);
  assert.equal(select.options[0].textContent,'No eligible objects');
  assert.match(js('src/app.js'),/reconcileEmbroideryObjectOptions\(objectSelect,objectChoices,objectId\)/);
});
