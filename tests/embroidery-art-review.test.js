import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {normalizeSurfaceTreatments} from '../src/embroidery.js';
const source=readFileSync(new URL('../scripts/review-embroidery.mjs',import.meta.url),'utf8');
test('production embroidery art review deliberately has seven independently labelled cases',()=>{
  const names=[...source.matchAll(/id:'(\d\d-[a-z-]+)'/g)].map(hit=>hit[1]);
  assert.deepEqual(names,['00-ribbon-plain','01-ribbon-satin','02-ribbon-running',
    '03-regions-plain','04-regions-tatami','05-regions-running','06-one-region']);
  assert.match(source,/normalizeRecipe\(\{\.\.\.base,/);
  assert.match(source,/\['--recipe',join\(out,recipeFile\)/);
  assert.match(source,/JSON\.stringify\(recipe,null,2\)/);
  assert.match(source,/produced-awaiting-actual-visual-review/);
  assert.match(source,/Review output exists/);
});
test('scattered review target is a real source-authored region; treatment remains isolated',()=>{
  const scene=resolveScene(normalizeRecipe({seed:'stitch-art-review-001',structure:'regions',
    regionMode:'scattered',scatteredCount:14,scatteredShapeKind:'circle'}));
  assert.ok(scene.objects.some(item=>item.id==='region-3'));
  const [item]=normalizeSurfaceTreatments([{id:'review',enabled:true,style:'running',
    target:{scope:'object',role:'fill',ids:['region-3']}}]);
  assert.deepEqual(item.target.ids,['region-3']);
  assert.equal(item.style,'running');
});
test('embroidery review help needs no browser or network',()=>{
  const result=spawnSync(process.execPath,
    [new URL('../scripts/review-embroidery.mjs',import.meta.url).pathname,'--help'],
    {encoding:'utf8',timeout:10000});
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/review-embroidery\.mjs/);
});
