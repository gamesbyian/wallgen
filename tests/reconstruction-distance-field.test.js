import test from 'node:test';
import assert from 'node:assert/strict';
import {
  distanceToSeedsSquared,inkDistanceField,inkEdgeMask,maskTopology,compareMaskGeometry
} from '../src/reconstruction-distance-field.js';

const raster=(w,h,testPixel)=>Uint8Array.from({length:w*h},(_,i)=>
  testPixel(i%w,Math.floor(i/w))?1:0);
const at=(a,x,y,w)=>a[y*w+x];

test('Euclidean distance transform agrees with brute force on sparse deterministic masks',()=>{
  for(const [w,h] of [[1,1],[3,5],[9,6],[25,23]]){
    for(let variant=0;variant<9;variant++){
      const mask=raster(w,h,(x,y)=>
        (x*17+y*29+variant*13)%11===0);
      const field=distanceToSeedsSquared(mask,w,h);
      const seeds=[];
      for(let y=0;y<h;y++)for(let x=0;x<w;x++)
        if(at(mask,x,y,w))seeds.push([x,y]);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const expected=seeds.length?
          Math.min(...seeds.map(([sx,sy])=>(x-sx)**2+(y-sy)**2)):Infinity;
        assert.equal(at(field,x,y,w),expected,
          'exact squared distance for '+w+'x'+h+' variant '+variant+' at '+x+','+y);
      }
    }
  }
});

test('Ink interior width is finite at cropped frame boundaries',()=>{
  const square=raster(7,7,(x,y)=>x>=2&&x<=4&&y>=2&&y<=4);
  const d=inkDistanceField(square,7,7);
  assert.equal(at(d,3,3,7),2);
  assert.equal(at(d,2,2,7),1);
  assert.equal(at(d,1,1,7),0);
  const filled=inkDistanceField(new Uint8Array(25).fill(1),5,5);
  assert.equal(at(filled,2,2,5),3);
  assert.equal(at(filled,0,0,5),1);
});

test('Topology distinguishes disconnected pigment, enclosed holes and diagonal exterior',()=>{
  const ring=raster(9,9,(x,y)=>x>=1&&x<=7&&y>=1&&y<=7&&
    !(x>=3&&x<=5&&y>=3&&y<=5));
  assert.deepEqual(maskTopology(ring,9,9),
    {components:1,holes:1,ink:40,euler:0});
  const islands=raster(10,5,(x,y)=>
    x>=1&&x<=2&&y>=1&&y<=2||x>=7&&x<=8&&y>=2&&y<=3);
  assert.deepEqual(maskTopology(islands,10,5),
    {components:2,holes:0,ink:8,euler:2});
  // Diagonal background escape should not be a closed hole.
  const escaped=raster(5,5,(x,y)=>
    !(x===0&&y===0)&&!(x===1&&y===1));
  assert.equal(maskTopology(escaped,5,5).holes,0);
});

test('Diagnostic IoU/Dice/edge distance keep empty cases and displaced outlines honest',()=>{
  const a=raster(12,12,(x,y)=>x>=2&&x<=5&&y>=3&&y<=6);
  const same=compareMaskGeometry(a,a,12,12);
  assert.equal(same.iou,1);assert.equal(same.dice,1);
  assert.equal(same.edgeChamfer,0);assert.equal(same.topologyMismatch,0);
  const shifted=raster(12,12,(x,y)=>x>=3&&x<=6&&y>=3&&y<=6);
  const unequal=compareMaskGeometry(a,shifted,12,12);
  assert.ok(unequal.iou>0&&unequal.iou<1);
  assert.ok(unequal.edgeChamfer>0&&unequal.edgeChamfer<1);
  assert.equal(unequal.topologyMismatch,0);
  const empty=new Uint8Array(144);
  const both=compareMaskGeometry(empty,empty,12,12);
  assert.equal(both.edgeChamfer,0);assert.equal(both.iou,1);
  const one=compareMaskGeometry(empty,a,12,12);
  assert.equal(one.edgeChamfer,1);assert.equal(one.iou,0);
  assert.ok(inkEdgeMask(a,12,12).some(Boolean));
});

test('Large and malformed masks fail before expensive memory allocations',()=>{
  assert.throws(()=>distanceToSeedsSquared(new Uint8Array(10),4,4),RangeError);
  assert.throws(()=>inkDistanceField(new Uint8Array(650001),1,650001),RangeError);
  assert.throws(()=>maskTopology([],2,2),RangeError);
});
