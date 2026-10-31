import test from 'node:test';
import assert from 'node:assert/strict';
import {scatteredSelectionBounds} from '../src/scattered-selection-bounds.js';
import {scatteredWorldToPixel} from '../src/scattered-drag.js';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {GEOMETRY_SNAPSHOT_SCHEMA} from '../src/geometry-asset.js';

const ring=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
const shape={schema:GEOMETRY_SNAPSHOT_SCHEMA,version:1,
  geometry:{type:'compound-region',space:'asset-local',viewBox:[0,0,100,100],
    fillRule:'evenodd',components:[
      {outer:ring(15,30,85,45),holes:[ring(30,34,40,39)]},
      {outer:ring(25,65,35,85),holes:[]}
    ]}};
const base=normalizeRecipe({seed:'compound-guide',structure:'regions',
  regionMode:'scattered',scatteredShapeKind:'imported',scatteredCount:1,
  scatteredShape:shape,scatteredOverrides:[{index:0,x:.5,y:.5,radius:.15}],
  scatteredOverlap:'overlap'});
const scene=resolveScene(base);
const object=scene.objects[0];
test('compound guide follows actual rings/islands, not enclosing radius',()=>{
  assert.ok(object?.editCircle&&object.rings?.length===3);
  const circle=object.editCircle;
  const bounds=scatteredSelectionBounds(object);
  assert.equal(bounds.isCompound,true);
  const all=object.rings.flat();
  assert.equal(bounds.minX,Math.min(...all.map(p=>p.x)));
  assert.equal(bounds.maxX,Math.max(...all.map(p=>p.x)));
  assert.equal(bounds.minY,Math.min(...all.map(p=>p.y)));
  assert.equal(bounds.maxY,Math.max(...all.map(p=>p.y)));
  assert.ok(bounds.maxY-bounds.minY<circle.r*2,
    'a tall frame must not be fabricated for a flatter silhouette');
  assert.deepEqual(decodeRecipe(encodeRecipe(base)),base);
});
test('provisional move and proportional scale transform every authored ring extent',()=>{
  const start=object.editCircle,next={cx:start.cx+31,cy:start.cy-24,r:start.r*1.5};
  const original=scatteredSelectionBounds(object);
  const modified=scatteredSelectionBounds(object,next);
  for(const prop of ['minX','maxX']){
    const expected=next.cx+(original[prop]-start.cx)*1.5;
    assert.ok(Math.abs(modified[prop]-expected)<1e-9);
  }
  for(const prop of ['minY','maxY']){
    const expected=next.cy+(original[prop]-start.cy)*1.5;
    assert.ok(Math.abs(modified[prop]-expected)<1e-9);
  }
  const projected=scatteredWorldToPixel(base,300,650,modified.minX,modified.minY);
  assert.ok(Number.isFinite(projected.x)&&Number.isFinite(projected.y));
  assert.deepEqual(scatteredSelectionBounds(object),original,
    'transient outline must never mutate source rings');
});
test('analytic circles keep exact familiar bound and invalid ring guides fail safely',()=>{
  const circle={cx:275,cy:730,r:44};
  assert.deepEqual(scatteredSelectionBounds({circle}),
    {minX:231,minY:686,maxX:319,maxY:774,isCompound:false});
  assert.equal(scatteredSelectionBounds(null),null);
  assert.equal(scatteredSelectionBounds({circle:{cx:0,cy:0,r:NaN}}),null);
  const corrupt={editCircle:circle,rings:[[{x:NaN,y:3}]]};
  assert.deepEqual(scatteredSelectionBounds(corrupt),
    {minX:231,minY:686,maxX:319,maxY:774,isCompound:false});
});
