import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveScene} from '../src/model.js';
import {normalizeSurfaceTreatments,drawRibbonEmbroidery} from '../src/embroidery.js';

const ctx=()=>{
  const moves=[];
  return {
    moves,save(){},restore(){},beginPath(){},lineTo(){},stroke(){},
    moveTo(x,y){moves.push([x,y]);},
  };
};
const stitch=normalizeSurfaceTreatments([{id:'field',enabled:true,style:'satin',
  pitch:5,relief:70,target:{scope:'all'}}])[0];

test('bounded crossing stitches preserve the full ribbon station phase',()=>{
  for(const geometry of ['straight','wave','hairpin','loop','drawn']){
    const recipe={seed:'thread-crossing-stable',geometry,motif:'solid',
      ...(geometry==='drawn'?{customPath:[[.2,.2],[.4,.4],[.6,.8],[.8,.6]]}:{})};
    const scene=resolveScene(recipe);
    const stripe=scene.stripes[3],extent=scene.extent;
    const complete=ctx(),bounded=ctx(),again=ctx();
    const all=drawRibbonEmbroidery(complete,stripe,extent,stitch);
    const start=-extent*.12,end=extent*.19;
    const partial=drawRibbonEmbroidery(bounded,stripe,extent,stitch,{start,end});
    drawRibbonEmbroidery(again,stripe,extent,stitch,{start,end});
    assert.ok(all>partial && partial>0,geometry);
    assert.equal(complete.moves.length,all*2);
    assert.equal(bounded.moves.length,partial*2);
    assert.deepEqual(bounded.moves,again.moves,geometry);
    const index=complete.moves.findIndex((v,i)=>i%2===0 &&
      v[0]===bounded.moves[0][0] && v[1]===bounded.moves[0][1]);
    assert.ok(index>=0,geometry+' first bounded stitch should exist in the whole');
    assert.deepEqual(complete.moves.slice(index,index+bounded.moves.length),
      bounded.moves,geometry+' crossing stitch field must preserve phase');
  }
});

test('invalid or empty crossing segments paint nothing without exhausting full range',()=>{
  const scene=resolveScene({seed:'clip',geometry:'straight'});
  const stripe=scene.stripes[0],surface=ctx();
  assert.equal(drawRibbonEmbroidery(surface,stripe,scene.extent,stitch,
    {start:scene.extent+100,end:scene.extent+200}),0);
  assert.equal(drawRibbonEmbroidery(surface,stripe,scene.extent,stitch,
    {start:100,end:50}),0);
  assert.equal(drawRibbonEmbroidery(surface,stripe,0,stitch),0);
  assert.equal(surface.moves.length,0);
});

test('crossing compositing reuses the same stitch semantics only for eligible solid ribbon passes',()=>{
  const code=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
  const branch=code.slice(code.indexOf('const branch={...stripe'),code.indexOf('drawPathInteriors(g,branch'));
  assert.match(branch,/const stitch=matchingEmbroidery\(scene\.surfaceTreatments/);
  assert.match(branch,/scene\.construction==='ribbon'/);
  assert.match(branch,/scene\.motif==='solid'/);
  assert.match(branch,/g\.clip\(stripeFillPath\(branch,scene\.extent,scene\)\)/);
  assert.match(branch,/drawRibbonEmbroidery\(g,stripe,scene\.extent,stitch,\{start,end\}\)/);
});
