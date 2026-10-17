import test from 'node:test';
import assert from 'node:assert/strict';
import { drawWallpaper, motifFits, balanceStripeEnds, stripeFrameContacts } from '../src/renderer.js';
import { MATERIALS, MOTIFS, GEOMETRIES, OUTLINES, resolveScene } from '../src/model.js';

// Node's lightweight Canvas API spy catches geometry/material code path errors
// without requiring a native browser, raster library, or platform build step.
const calls=[];
class FakePath2D {
  moveTo(){} lineTo(){} closePath(){}
}
class FakeContext {
  constructor(tag='layer') {this.tag=tag;this.fillStyle='#000';this.strokeStyle='#000';this.globalAlpha=1;this.globalCompositeOperation='source-over';}
  save(){} restore(){} scale(){} translate(){} rotate(a){calls.push(['rotate',a]);} setTransform(){}
  clearRect(){} beginPath(){} moveTo(){} lineTo(){} closePath(){}
  arc(){} quadraticCurveTo(){} clip(){calls.push(['clip',this.tag]);} stroke(){} setLineDash(){}
  fill(){} fillRect(...args){calls.push(['fillRect',this.fillStyle,...args,this.tag]);}
  drawImage(){calls.push(['drawImage',this.globalCompositeOperation,this.tag]);}
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
      assert.equal(calls.filter(x=>x[0]==='drawImage' && x[2]==='main').length>1,textureCoverage!=='stripes');
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

test('frame contacts are bilateral or fully inset for a variety of seeded geometries',()=>{
  let inset=0,through=0;
  for(const orientation of ['vertical','horizontal','diagonal'])
    for(let i=0;i<24;i++){
      const scene=resolveScene({
        seed:'frame-balance:'+orientation+':'+i,orientation,
        individuality:85,chaos:85,spread:66,stripeWidth:65,
        positionX:((i%5)-2)*7,positionY:((i%7)-3)*5,
      });
      for(const stripe of scene.stripes){
        const result=balanceStripeEnds(scene,stripe);
        if(stripe.hidden)continue;
        const edges=stripeFrameContacts(scene,stripe);
        assert.equal(edges.left,edges.right,orientation+':'+i+':'+stripe.index+' left/right');
        assert.equal(edges.top,edges.bottom,orientation+':'+i+':'+stripe.index+' top/bottom');
        if(result.balanced)through++;
        else{
          inset++;
          assert.ok(stripe.segmentEnd>stripe.segmentStart);
          assert.equal(motifFits(stripe,scene,stripe.segmentStart,stripe.center,3,3),false);
        }
      }
    }
  assert.ok(through>0,'Some stripes should still cross paired opposite edges');
  assert.ok(inset>0,'Unbalanced edge contact should trigger paired end insets');
});

test('three composited materials apply rotated masks, background and blend modes',()=>{
  calls.length=0;
  const canvas={width:600,height:1300,getContext:()=>new FakeContext()};
  const scene=drawWallpaper(canvas,{
    seed:'composite-test',material:'wood-grain',textureCoverage:'both',
    textureRotation:45,textureBlend:'overlay',
    textureLayer2Enabled:true,material2:'adobe',textureCoverage2:'background',
    textureRotation2:90,textureBlend2:'multiply',
    textureLayer3Enabled:true,material3:'corduroy',textureCoverage3:'stripes',
    textureRotation3:13.5,textureBlend3:'screen',
  });
  assert.equal(scene.textureLayers.length,3);
  assert.ok(calls.some(c=>c[0]==='rotate' && Math.abs(c[1]-Math.PI/2)<1e-7));
  assert.ok(calls.some(c=>c[0]==='rotate' && Math.abs(c[1]-13.5*Math.PI/180)<1e-7));
  for(const composite of ['overlay','multiply','screen','destination-in']){
    assert.ok(calls.some(c=>c[0]==='drawImage' && c[1]===composite),composite);
  }
});
