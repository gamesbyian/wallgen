import test from 'node:test';
import assert from 'node:assert/strict';
import { drawWallpaper } from '../src/renderer.js';
import { MATERIALS, MOTIFS, GEOMETRIES, OUTLINES } from '../src/model.js';

// Node's lightweight Canvas API spy catches geometry/material code path errors
// without requiring a native browser, raster library, or platform build step.
const calls=[];
class FakePath2D {
  moveTo(){} lineTo(){} closePath(){}
}
class FakeContext {
  constructor() {this.fillStyle='#000';this.strokeStyle='#000';this.globalAlpha=1;this.globalCompositeOperation='source-over';}
  save(){} restore(){} scale(){} translate(){} rotate(){} setTransform(){}
  clearRect(){} beginPath(){} moveTo(){} lineTo(){} closePath(){}
  arc(){} quadraticCurveTo(){} clip(){} stroke(){} setLineDash(){}
  fill(){} fillRect(...args){calls.push(['fillRect',this.fillStyle,...args]);}
  drawImage(){calls.push(['drawImage']);}
  createPattern(){return '#pattern';}
  createRadialGradient(){return {addColorStop(){}};}
}
const oldPath=globalThis.Path2D;
const oldDocument=globalThis.document;
globalThis.Path2D=FakePath2D;
globalThis.document={createElement(tag){if(tag!=='canvas')throw new Error(tag);return {width:0,height:0,getContext:()=>new FakeContext()};}};

function render(recipe) {
  calls.length=0;
  const canvas={width:600,height:1300,getContext:()=>new FakeContext()};
  const scene=drawWallpaper(canvas,recipe);
  assert.equal(scene.stripes.length,7);
  assert.ok(calls.some(c=>c[0]==='fillRect' && c[1]==='#000'));
  assert.ok(calls.some(c=>c[0]==='drawImage'));
}
test('paper and textiles render without exceptions',()=>{
  for(const material of MATERIALS)render({seed:`textile-${material}`,material,motif:'solid'});
});
test('all stripe motifs render without exceptions',()=>{
  for(const motif of MOTIFS)render({seed:`motif-${motif}`,motif,material:'grain'});
});
test('all geometries and outlines render without exceptions',()=>{
  for(const geometry of GEOMETRIES)render({seed:`path-${geometry}`,geometry});
  for(const outline of OUTLINES)render({seed:`edge-${outline}`,outline,gap:100});
});
test('render works at full native 210% export resolution',()=>{
  calls.length=0;
  const canvas={width:3024,height:6552,getContext:()=>new FakeContext()};
  assert.doesNotThrow(()=>drawWallpaper(canvas,{seed:'full-res',material:'canvas',glow:80,motif:'stars'}));
});
