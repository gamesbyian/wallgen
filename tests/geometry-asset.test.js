import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeOpenPathGeometry,normalizeCompoundRegion,normalizeGeometry,
  normalizeGeometryAsset,cloneGeometrySnapshot,assetToDrawPath,drawPathToGeometry,
  geometryBounds,geometryContentHash,geometryHashPayload,MAX_RING_POINTS
} from '../src/geometry-asset.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const wave={type:'open-path',space:'wallpaper-600x1300',
  points:[[.12,.14],[.36,.24],[.52,.43],[.88,.9]],anchors:[1,2],corners:[2]};
const leaf={type:'compound-region',space:'asset-local',viewBox:[0,0,100,100],
  fillRule:'evenodd',components:[{
    outer:[[10,10],[90,10],[90,90],[10,90]],
    holes:[[[35,35],[35,65],[65,65],[65,35]]]
  }]};

test('Draw recipe becomes a normalized independent open path that preserves authored stations',()=>{
  const original=normalizeRecipe({seed:'persistent-path',structure:'paths',
    geometry:'drawn',customPath:wave.points,drawnAnchors:[1,2],drawnCorners:[2]});
  const geometry=drawPathToGeometry(original);
  assert.deepEqual(geometry,normalizeOpenPathGeometry(wave));
  const stored=normalizeGeometryAsset({id:'curve-one',name:' Wave ',geometry,
    source:{kind:'drawn'}},{now:()=> '2026-10-22T00:00:00Z'});
  assert.equal(stored.kind,'path');
  assert.equal(stored.name,'Wave');
  assert.deepEqual(assetToDrawPath(stored),{points:original.customPath,
    anchors:original.drawnAnchors,corners:original.drawnCorners});
  const cloned=cloneGeometrySnapshot(stored.geometry);
  assert.notStrictEqual(cloned.geometry,stored.geometry);
  cloned.geometry.points[0][0]=.99;
  assert.equal(stored.geometry.points[0][0],.12,'recipe copy must not alias library');
  assert.deepEqual(decodeRecipe(encodeRecipe(original)),original,
    'existing PNG/URL recipe normalization remains unchanged');
});

test('Path source indices follow station normalization, including duplicate input points',()=>{
  const source={...wave,points:[[0,.2],[.5,.2],[.5,.2],[1,.2]],anchors:[2],corners:[2]};
  const normal=normalizeOpenPathGeometry(source);
  assert.equal(normal.points.length,3);
  assert.deepEqual(normal.anchors,[1]);
  assert.deepEqual(normal.corners,[1]);
  assert.deepEqual(assetToDrawPath(normal).anchors,[1]);
});

test('Compound shape preserves disconnected components and explicitly subtractive holes',()=>{
  const disconnected={...leaf,components:[...leaf.components,{
    outer:[[1,1],[8,1],[8,8],[1,8]],holes:[]
  }]};
  const shape=normalizeCompoundRegion(disconnected);
  assert.equal(shape.components.length,2);
  assert.equal(shape.components[0].holes.length,1);
  assert.equal(shape.components[1].holes.length,0);
  assert.deepEqual(geometryBounds(shape),{minX:1,minY:1,maxX:90,maxY:90,width:89,height:89});
  assert.deepEqual(normalizeCompoundRegion(JSON.parse(JSON.stringify(shape))),shape);
  assert.equal(normalizeGeometryAsset({id:'maple-1',kind:'shape',geometry:shape}).kind,'shape');
});

test('Ring closure, orientation and -0 have one stable canonical representation',()=>{
  const normalized=normalizeCompoundRegion(leaf);
  const alternate={...leaf,components:[{
    outer:[[10,90],[90,90],[90,10],[10,10],[10,90]],
    holes:[[[65,35],[65,65],[35,65],[35,35],[65,35]]]
  }]};
  const b=normalizeCompoundRegion(alternate);
  const twice=normalizeCompoundRegion(normalized);
  assert.deepEqual(twice,normalized);
  assert.equal(JSON.stringify(normalized),JSON.stringify(b),
    'opposite winding and explicit closure have same canonical stored rings');
  assert.ok(normalized.components[0].outer.every(p=>!p.some(x=>Object.is(x,-0))));
});

test('SHA-256 hash depends only on geometry, not names, IDs or access date',async()=>{
  const a=normalizeGeometryAsset({id:'alpha',name:'First',geometry:leaf});
  const b=normalizeGeometryAsset({id:'beta',name:'Second',geometry:leaf});
  assert.equal(geometryHashPayload(a.geometry),geometryHashPayload(b.geometry));
  const ha=await geometryContentHash(a.geometry),hb=await geometryContentHash(b.geometry);
  assert.equal(ha,hb);
  assert.match(ha,/^sha256:[a-f0-9]{64}$/);
  assert.notEqual(ha,await geometryContentHash({...leaf,viewBox:[0,0,200,100]}));
});

test('Structured fields and timestamps are validated and sanitized by selection',()=>{
  const asset=normalizeGeometryAsset({id:'one',version:1,geometry:wave,
    source:{kind:'imported',rawHtml:'<script>bad</script>'},
    name:' Wave ',tags:[' blue ','blue','curve'],extra:'never copied',
    createdAt:'2026-10-21T14:00:00-06:00',modifiedAt:'2026-10-21T22:00:00Z'});
  assert.equal(asset.createdAt,'2026-10-21T20:00:00.000Z');
  assert.deepEqual(asset.tags,['blue','curve']);
  assert.deepEqual(asset.source,{kind:'imported'});
  assert.equal(asset.extra,undefined);
  assert.throws(()=>normalizeGeometryAsset({...asset,kind:'shape'}),/kind/);
  assert.throws(()=>normalizeGeometryAsset({...asset,revision:-1}),/revision/);
  assert.throws(()=>normalizeGeometryAsset({...asset,id:'../bad'}),/id/);
  assert.throws(()=>normalizeGeometryAsset({...asset,modifiedAt:'1999-01-01'}),/precedes/);
});

test('Fail closed for hostile points, rings, zero area, out-of-box geometry and crossing boundaries',()=>{
  for(const input of [
    {...wave,points:[[0,0],[Infinity,1]]},
    {...wave,points:[[0,0],[0,.0001]]},
    {...wave,points:Array.from({length:1201},(_,i)=>[i/1200,.5])},
    {...wave,points:[[0,0],[2,5]]},
    {...wave,anchors:[500]},
    {...wave,space:'asset-local'},
    {...leaf,viewBox:[0,0,-5,3]},
    {...leaf,components:[{outer:[[0,0],[10,10],[0,10],[10,0]],holes:[]}]},
    {...leaf,components:[{outer:[[0,0],[100,0],[100,100],[0,100]],
      holes:[[[200,200],[210,200],[200,210]]]}]},
    {...leaf,components:[{outer:[[0,0],[100,0],[100,100],[0,100]],
      holes:[[[20,20],[120,20],[120,40],[20,40]]]}]},
    {...leaf,components:[{outer:[[0,0],[100,0],[100,100],[0,100]],
      holes:[[[20,20],[80,20],[80,80],[20,80]],
        [[30,30],[60,30],[60,60],[30,60]]]}]},
    {...leaf,components:[{outer:Array.from({length:MAX_RING_POINTS+1},
      (_,i)=>[50+40*Math.cos(i*2*Math.PI/(MAX_RING_POINTS+1)),
        50+40*Math.sin(i*2*Math.PI/(MAX_RING_POINTS+1))]),holes:[]}]}
  ])assert.throws(()=>normalizeGeometry(input),/Invalid geometry/);
});

test('Open path metadata is independent of the closed silhouette format',()=>{
  assert.throws(()=>assetToDrawPath(leaf),/open-path/);
  assert.throws(()=>normalizeOpenPathGeometry({...wave,points:[]}),/authoring limits/);
  assert.deepEqual(normalizeOpenPathGeometry(wave),normalizeGeometry(wave));
});
