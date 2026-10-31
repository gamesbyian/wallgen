import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {MATERIAL_CHARACTER,materialContourHeight,paintMaterial} from '../src/material-surface.js';
import {sandPitch,sandGrainAt,forEachSandGrain} from '../src/sand-material.js';

const layer=(scale=50,seed=712)=>({material:'sand-mandala',scale,heightSeed:seed,strength:70});
const crop=(left,top,right,bottom)=>({left,top,right,bottom});
const sample=(l,b)=>{
  const result=new Map();
  forEachSandGrain(l,b,g=>result.set(g.ix+':'+g.iy,g));
  return result;
};

test('sand is a real independent material option in three canonical layers',()=>{
  assert.ok(MATERIAL_CHARACTER['sand-mandala']);
  const recipe=normalizeRecipe({seed:'deposited-sand',
    material:'sand-mandala',textureCoverage:'stripes',
    textureStrength:80,textureScale:38,
    textureLayer2Enabled:true,material2:'sand-mandala',
    textureCoverage2:'background',textureScale2:61,
    textureLayer3Enabled:true,material3:'sand-mandala',textureScale3:7});
  assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  assert.deepEqual(resolveScene(recipe).textureLayers.map(l=>l.material),
    ['sand-mandala','sand-mandala','sand-mandala']);
  assert.deepEqual(resolveScene(recipe).textureLayers.map(l=>l.coverage),
    ['stripes','background','both']);
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.equal((html.match(/<option value="sand-mandala">/g)||[]).length,3);
});

test('grain identities and physical radii remain fixed across overlapping crops',()=>{
  const l=layer(),whole=sample(l,crop(-50,-50,210,240));
  const cut=sample(l,crop(20,30,150,170));
  assert.ok(cut.size>100);
  for(const [id,g] of cut)assert.deepEqual(whole.get(id),g);
  assert.deepEqual(sandGrainAt(l,-3,-4),sandGrainAt(l,-3,-4));
  assert.notDeepEqual(sandGrainAt(layer(50,713),-3,-4),sandGrainAt(l,-3,-4));
  assert.ok(sandPitch(layer(0))>2.5);
  assert.ok(sandPitch(layer(100))>sandPitch(layer(0)));
});

test('grain count stays bounded for full authored canvas even at finest gauge',()=>{
  let count=0;
  forEachSandGrain(layer(0),crop(0,0,600,1300),()=>count++);
  assert.ok(count>60000);
  assert.ok(count<140000,'fine material cannot flood editor with particles');
});

test('sand paint uses Canvas2D grain relief without raster assets or random state',()=>{
  const marks=[],ctx={
    save(){marks.push('save');},restore(){marks.push('restore');},
    beginPath(){},ellipse(x,y,rx,ry){marks.push(['ellipse',x,y,rx,ry,this.fillStyle]);},
    arc(x,y,r){marks.push(['arc',x,y,r]);},fill(){marks.push('fill');}
  };
  const l=layer(50,42),b=crop(0,0,50,50);
  paintMaterial(ctx,l,b);
  const first=JSON.stringify(marks);
  assert.ok(first.includes('ellipse'));
  assert.ok(marks.some(m=>Array.isArray(m)&&m[0]==='ellipse'&&m[5].startsWith('rgba(255')));
  assert.ok(marks.some(m=>Array.isArray(m)&&m[0]==='ellipse'&&m[5].startsWith('rgba(0')));
  marks.length=0;paintMaterial(ctx,l,b);
  assert.equal(JSON.stringify(marks),first);
  assert.ok(Math.abs(materialContourHeight(l,23,17))<=.2);
});
