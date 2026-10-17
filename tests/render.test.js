import test from 'node:test';
import assert from 'node:assert/strict';
import { drawWallpaper, motifFits } from '../src/renderer.js';
import { MATERIALS, MOTIFS, GEOMETRIES, OUTLINES, resolveScene } from '../src/model.js';

// Node's lightweight Canvas API spy catches geometry/material code path errors
// without requiring a native browser, raster library, or platform build step.
const calls=[];
class FakePath2D {
  moveTo(){} lineTo(){} closePath(){}
}
class FakeContext {
  constructor(tag='layer') {this.tag=tag;this.fillStyle='#000';this.strokeStyle='#000';this.globalAlpha=1;this.globalCompositeOperation='source-over';}
  save(){} restore(){} scale(){} translate(){} rotate(){} setTransform(){}
  clearRect(){} beginPath(){} moveTo(){} lineTo(){} closePath(){}
  arc(){} quadraticCurveTo(){} clip(){calls.push(['clip',this.tag]);} stroke(){} setLineDash(){}
  fill(){} fillRect(...args){calls.push(['fillRect',this.fillStyle,...args,this.tag]);}
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

test('paper and textiles cover the chosen background as well as stripes',()=>{
  for(const background of ['black','white'])for(const material of ['linen','construction','felt']){
    for(const textureCoverage of ['both','background','stripes']){
      calls.length=0;
      const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
      const scene=drawWallpaper(canvas,{seed:'surface-test',background,material,textureCoverage,motif:'dots'});
      assert.equal(scene.background,background);
      assert.ok(calls.some(x=>x[0]==='fillRect' && x[1]===(background==='black'?'#000':'#fff') && x.at(-1)==='main'));
      assert.equal(calls.some(x=>x[0]==='fillRect' && x[1]==='#pattern' && x.at(-1)==='main'),textureCoverage!=='stripes');
    }
  }
});
test('motif shapes must fit completely, no boundary clipping',()=>{
  for(const motif of MOTIFS){
    calls.length=0;
    drawWallpaper({width:600,height:1300,getContext:()=>new FakeContext('main')},{seed:'whole-motifs',motif,individuality:100,chaos:100});
    assert.ok(!calls.some(x=>x[0]==='clip'),motif+' was clipped');
  }
  const scene=resolveScene({seed:'fit-boundary',family:'studio',motif:'stars'});
  const stripe=scene.stripes[3];
  assert.equal(motifFits(stripe,scene,scene.extent,stripe.center,2,2),false);
  assert.equal(motifFits(stripe,scene,0,stripe.center+10000,2,2),false);
});
