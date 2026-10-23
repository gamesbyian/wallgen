import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,encodeRecipe,decodeRecipe,resolveScene} from '../src/model.js';
import {normalizeSurfaceTreatments,matchingEmbroidery,drawRibbonEmbroidery,drawRegionEmbroidery} from '../src/embroidery.js';

const select=(opts={})=>normalizeSurfaceTreatments([{
  id:'thread-1',enabled:true,target:{scope:'palette',role:'fill',colorSlots:[1],ids:[]},
  pitch:5,relief:65,...opts
}])[0];

test('legacy artwork stays free of embroidery state, and treatment survives recipe transport',()=>{
  const old=normalizeRecipe({seed:'legacy',material:'linen'});
  assert.equal(Object.hasOwn(old,'surfaceTreatments'),false);
  assert.equal(Object.hasOwn(resolveScene(old),'surfaceTreatments'),false);
  const recipe=normalizeRecipe({...old,surfaceTreatments:[select()]});
  assert.equal(recipe.surfaceTreatments.length,1);
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.deepEqual(normalizeRecipe(recipe),recipe);
});
test('targeting distinguishes authored object ID, palette slot and inactive roles',()=>{
  const red=select({target:{scope:'palette',role:'fill',colorSlots:[0],ids:[]}});
  const violet=select({id:'violet',target:{scope:'palette',role:'fill',colorSlots:[6],ids:[]}});
  const chosen=select({id:'exact',target:{scope:'object',role:'fill',colorSlots:[],ids:['region-3']}});
  const all=select({id:'all',target:{scope:'all',role:'fill',colorSlots:[],ids:[]}});
  assert.strictEqual(matchingEmbroidery([red,violet],{id:'region-0',colorSlot:0}),red);
  assert.strictEqual(matchingEmbroidery([red,violet],{id:'region-6',colorSlot:6}),violet);
  assert.equal(matchingEmbroidery([red,violet],{id:'region-3',colorSlot:2}),null);
  assert.strictEqual(matchingEmbroidery([chosen],{id:'region-3',colorSlot:5}),chosen);
  assert.equal(matchingEmbroidery([chosen],{id:'region-4',colorSlot:5}),null);
  assert.equal(matchingEmbroidery([all],{id:'region-3',colorSlot:0,role:'outline'}),null);
  assert.strictEqual(matchingEmbroidery([all],{id:'region-3',colorSlot:0}),all);
  assert.equal(matchingEmbroidery([{...all,enabled:false}],{id:'region-3',colorSlot:0}),null);
});
test('hostile records are bounded, deduplicated and cannot inject wildcard object IDs',()=>{
  const incoming=[{id:'valid',enabled:true,pitch:-100,relief:800,
    target:{scope:'object',ids:['region-2','invalid id','region-2'],colorSlots:[0,9,-1],role:'outline'}},
    {id:'valid',enabled:true},{id:'<script>',enabled:true}];
  const values=normalizeSurfaceTreatments(incoming);
  assert.equal(values.length,1);
  assert.deepEqual(values[0].target.ids,['region-2']);
  assert.deepEqual(values[0].target.colorSlots,[0]);
  assert.equal(values[0].target.role,'fill');
  assert.equal(values[0].pitch,2);
  assert.equal(values[0].relief,100);
});
const fakeContext=()=>{
  const counters={strokes:0,segments:0,rotates:0,saves:0,restores:0};
  return {counters,save(){counters.saves++},restore(){counters.restores++},
    beginPath(){},moveTo(){counters.segments++},lineTo(){},stroke(){counters.strokes++},
    translate(){},rotate(){counters.rotates++}};
};
test('a straight path uses its actual width/tangent to emit bounded transverse rows',()=>{
  const scene=resolveScene({seed:'embroidered-path',geometry:'straight',motif:'solid'});
  const stripe=scene.stripes[0], ctx=fakeContext();
  const count=drawRibbonEmbroidery(ctx,stripe,scene.extent,select());
  assert.ok(count>100);
  assert.equal(ctx.counters.strokes,count*2);
  assert.equal(ctx.counters.saves,ctx.counters.restores);
  assert.equal(drawRibbonEmbroidery(ctx,stripe,scene.extent,null),0);
});
test('closed circle and compound silhouette produce deterministic thread rows',()=>{
  const ctx=fakeContext(),style=select();
  const circle={circle:{cx:200,cy:230,r:28}};
  const paths={rings:[[{x:20,y:10},{x:110,y:10},{x:110,y:100},{x:20,y:100}]],
    vertices:[{x:20,y:10},{x:110,y:10},{x:110,y:100},{x:20,y:100}]};
  const a=drawRegionEmbroidery(ctx,circle,style);
  const b=drawRegionEmbroidery(ctx,paths,style);
  assert.ok(a>0&&b>0);
  assert.equal(ctx.counters.rotates,2);
  assert.equal(ctx.counters.saves,ctx.counters.restores);
  assert.equal(drawRegionEmbroidery(ctx,circle,null),0);
});

test('specific target outranks palette and all treatments regardless of array order',()=>{
  const global=select({id:'global',target:{scope:'all',role:'fill',colorSlots:[],ids:[]}});
  const palette=select({id:'palette',target:{scope:'palette',role:'fill',colorSlots:[2],ids:[]}});
  const object=select({id:'object',target:{scope:'object',role:'fill',colorSlots:[],ids:['region-4']}});
  for(const treatments of [[global,palette,object],[object,global,palette],[palette,object,global]]){
    assert.strictEqual(matchingEmbroidery(treatments,{id:'region-4',colorSlot:2}),object);
    assert.strictEqual(matchingEmbroidery(treatments,{id:'region-5',colorSlot:2}),palette);
    assert.strictEqual(matchingEmbroidery(treatments,{id:'region-5',colorSlot:3}),global);
    assert.strictEqual(matchingEmbroidery(treatments,{id:'region-4',colorSlot:2,role:'outline'}),null);
  }
  assert.strictEqual(matchingEmbroidery([global,global],{id:'anything',colorSlot:4}),global);
});
test('tatami on a clipped region draws staggered short rows; satin remains long ribs',()=>{
  const rectangle={rings:[[{x:0,y:0},{x:200,y:0},{x:200,y:80},{x:0,y:80}]],
    vertices:[{x:0,y:0},{x:200,y:0},{x:200,y:80},{x:0,y:80}]};
  const segments=()=>{const strokes=[];let first=null;
    return {strokes,save(){},restore(){},translate(){},rotate(){},beginPath(){},
      moveTo(x,y){first=[x,y]},lineTo(x,y){strokes.push([first,[x,y]])},stroke(){}};
  };
  const satin=segments(),tatami=segments();
  const long=drawRegionEmbroidery(satin,rectangle,select({style:'satin',pitch:8}));
  const short=drawRegionEmbroidery(tatami,rectangle,select({style:'tatami',pitch:8}));
  assert.ok(long>0&&short>long);
  assert.equal(satin.strokes.length,long*2);
  assert.equal(tatami.strokes.length,short*2);
  assert.ok(tatami.strokes.every(([[a],[b]])=>b-a<80),'tatami threads must be short');
  const repeat=segments();
  drawRegionEmbroidery(repeat,rectangle,select({style:'tatami',pitch:8}));
  assert.deepEqual(tatami.strokes,repeat.strokes,'same authored grid, no RNG');
});
