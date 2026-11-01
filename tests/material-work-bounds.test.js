import test from 'node:test';
import assert from 'node:assert/strict';
import {assertMaterialWorkBounds,MATERIAL_CHARACTER,materialHeight,paintMaterial} from '../src/material-surface.js';

const crop=(left,top,right,bottom)=>({left,top,right,bottom});
test('ordinary and heavily reframed camera material bounds remain valid',()=>{
  for(const bounds of [
    crop(0,0,600,1300),
    crop(-900,-1950,900,1950),
    crop(-2100,-2100,2100,2100),
    crop(-50.25,-100.4,612.5,1500.7),
  ])assert.doesNotThrow(()=>assertMaterialWorkBounds(bounds));
});

test('all procedural materials refuse unsafe world-index windows before any painting',()=>{
  const unsafe=[
    crop(-10000,-10000,10000,10000),
    crop(1e20,0,1e20+1e9,30),
    crop(-Number.MAX_VALUE,-20,Number.MAX_VALUE,20),
    crop(5,10,4,11),
    crop(0,0,50,Infinity),
    crop(0,NaN,50,100),
  ];
  const events=[];
  const ctx={save(){events.push('save');},restore(){events.push('restore');}};
  for(const material of Object.keys(MATERIAL_CHARACTER)){
    for(const bounds of unsafe){
      assert.throws(()=>paintMaterial(ctx,{material,scale:50,heightSeed:7},bounds),
        /Material crop/,material);
    }
  }
  assert.deepEqual(events,[],'reject before any canvas state is altered');
});

test('unknown material remains a no-op and ordinary sand paint is unchanged',()=>{
  assert.doesNotThrow(()=>paintMaterial({save(){throw Error('no paint');}},
    {material:'unknown'},crop(-1e20,0,1e20,10)));
  const calls=[],ctx={
    save(){calls.push('save');},restore(){calls.push('restore');},
    fillRect(x,y,w,h){calls.push(['fill',x,y,w,h,this.fillStyle]);}
  };
  const layer={material:'sand-mandala',scale:50,heightSeed:11,strength:70};
  paintMaterial(ctx,layer,crop(-10,-10,10,10));
  const first=JSON.stringify(calls);
  assert.ok(calls.some(x=>Array.isArray(x)&&x[0]==='fill'));
  calls.length=0;
  paintMaterial(ctx,layer,crop(-10,-10,10,10));
  assert.equal(JSON.stringify(calls),first,'source seed and crop retain deterministic paint');
});


test('prototype property names are never interpreted as valid material types',()=>{
  const context={save(){throw new Error('unregistered material must never paint');}};
  const base={material:'grain',scale:40,heightSeed:19,strength:80};
  const expected=materialHeight(base,31,47);
  for(const material of ['constructor','toString','__proto__']){
    assert.equal(Object.hasOwn(MATERIAL_CHARACTER,material),false);
    assert.doesNotThrow(()=>paintMaterial(context,{...base,material},crop(0,0,20,20)));
    assert.equal(materialHeight({...base,material},31,47),expected,
      'unknown material retains original fallback relief');
  }
});
