import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecipe } from '../src/model.js';
import { ownerKey,safeId,saveRecipe,loadRecipe,editStored,varyStored,exploreStored } from '../cloudflare/mcp/src/storage.js';

function mockCloudflare(){
  const objects=new Map(),rows=new Map();
  const env={
    PRIVATE_ARTIFACTS:{
      async put(key,text){objects.set(key,text)},
      async get(key){return objects.has(key)?{json:async()=>JSON.parse(objects.get(key))}:null}
    },
    RECIPES:{prepare(sql){
      let values=[];
      return {bind(...v){values=v;return this},async run(){
        const [owner,id,key]=values;rows.set(owner+'|'+id,{object_key:key});return {success:true}
      },async first(){
        const [owner,id]=values;return rows.get(owner+'|'+id)||null
      }};
    }}
  };
  return {env,objects,rows};
}
test('owner keys and candidate IDs reject ambiguous/path inputs',()=>{
  assert.notEqual(ownerKey('alice'),ownerKey('bob'));
  assert.match(ownerKey('user:with/unicode🌈'),/^[a-f0-9]+$/);
  assert.throws(()=>ownerKey(''),/identity/);
  assert.throws(()=>safeId('../private'),/Invalid/);
  assert.throws(()=>safeId('design-0000000000000000/../x'),/Invalid/);
});
test('D1/R2 isolation, canonical recipe preservation and deterministic revisions',async()=>{
  const {env,objects}=mockCloudflare();
  const source=normalizeRecipe({seed:'cloudflare-private-test',geometry:'wave',palette:'jewel',
    lockedSettings:['palette'],stripeWidth:65});
  const saved=await saveRecipe(env,'alice',source);
  assert.match(saved.id,/^design-[a-f0-9]{16}$/);
  const again=await saveRecipe(env,'alice',source);
  assert.equal(again.id,saved.id);
  assert.deepEqual(await loadRecipe(env,'alice',saved.id),source);
  await assert.rejects(()=>loadRecipe(env,'bob',saved.id),/not found/);
  await assert.rejects(()=>editStored(env,'alice',saved.id,{settings:{palette:'pastel'}}),/locked/);
  const edit=await editStored(env,'alice',saved.id,{settings:{stripeWidth:70}});
  assert.equal((await loadRecipe(env,'alice',edit.id)).stripeWidth,70);
  assert.equal((await loadRecipe(env,'alice',saved.id)).stripeWidth,65);
  const a=await varyStored(env,'alice',saved.id,{category:'path',seed:'cloud-batch'});
  const b=await varyStored(env,'alice',saved.id,{category:'path',seed:'cloud-batch'});
  assert.equal(a.id,b.id);
  const variants=await exploreStored(env,'alice',saved.id,{count:3,seed:'batch',categories:['path','stripes']});
  assert.equal(variants.length,3);
  assert.ok(objects.size>=3);
  for(const candidate of variants){
    assert.equal((await loadRecipe(env,'alice',candidate.id)).palette,'jewel');
    await assert.rejects(()=>loadRecipe(env,'bob',candidate.id),/not found/);
  }
});
test('imports do not silently transform incorrect or oversized recipes',async()=>{
  const {env}=mockCloudflare();
  await assert.rejects(()=>saveRecipe(env,'alice',{version:9,seed:'wrong',lockedSettings:[]}),/version/);
  await assert.rejects(()=>saveRecipe(env,'alice',{version:2,seed:'test',lockedSettings:[],customPath:Array.from({length:50000},()=>[0,1])}),/128 KiB/);
});
