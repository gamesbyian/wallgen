import test from 'node:test';
import assert from 'node:assert/strict';
import { drawWallpaper, presentNudgedArtwork, motifFits, balanceStripeEnds, stripeFrameContacts, textureHeight, stripeShadowParameters } from '../src/renderer.js';
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
  drawImage(_src,...args){
    if(this.shadowBlur>0)calls.push(['lightingShadow',this.shadowBlur,this.shadowOffsetX,this.shadowOffsetY,this.shadowColor]);
    calls.push(['drawImage',this.globalCompositeOperation,this.tag,...args]);
  }
  createPattern(){return '#pattern';}
  createRadialGradient(...coords){calls.push(['ambientGlow',this.tag,...coords]);return {addColorStop(offset,color){calls.push(['ambientGlowStop',this.tag,offset,color]);}};}
  createLinearGradient(...coords){
    calls.push(['lightingGradient',...coords]);
    return {addColorStop(offset,color){calls.push(['lightingStop',offset,color]);}};
  }
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

test('material-informed height field is deterministic, bounded, and disabled by default',()=>{
  const base={seed:'edge-relief',orientation:'diagonal',stripeWidth:70,material:'adobe',textureCoverage:'stripes'};
  const none=resolveScene({...base});
  const scene=resolveScene({...base,textureDisplacement:85});
  const stripe=scene.stripes[3];
  assert.equal(textureHeight(none,none.stripes[3],153,1),0);
  // No active stripe material uses seeded neutral grain instead of a dead slider.
  const bare=resolveScene({...base,material:'none',textureDisplacement:85});
  const bgOnly=resolveScene({...base,textureCoverage:'background',textureDisplacement:85});
  assert.notEqual(textureHeight(bare,bare.stripes[3],153,1),0);
  assert.notEqual(textureHeight(bgOnly,bgOnly.stripes[3],153,1),0);
  const first=textureHeight(scene,stripe,153,1);
  assert.equal(first,textureHeight(scene,stripe,153,1));
  const max=Math.min(28,stripe.width*.34)*Math.pow(.85,.85);
  assert.ok(Math.abs(first)<=max+1e-10);
  const material=resolveScene({...base,material:'corduroy',textureDisplacement:85});
  assert.notEqual(first,textureHeight(material,material.stripes[3],153,1));
  const rotated=resolveScene({...base,textureDisplacement:85,textureRotation:90});
  assert.notEqual(first,textureHeight(rotated,rotated.stripes[3],153,1));
});
test('displaced edges preserve the opposite-edge framing rule',()=>{
  let rendered=0;
  for(const orientation of ['vertical','horizontal','diagonal'])for(let i=0;i<10;i++){
    const scene=resolveScene({seed:'relief-balance-'+orientation+'-'+i,orientation,
      material:'stucco',textureDisplacement:78,textureCoverage:'both',
      textureLayer2Enabled:true,material2:'wood-grain',textureCoverage2:'stripes',
      individuality:80,chaos:75,spread:60,stripeWidth:62});
    for(const stripe of scene.stripes){
      balanceStripeEnds(scene,stripe);
      if(stripe.hidden)continue;
      const edges=stripeFrameContacts(scene,stripe);
      assert.equal(edges.left,edges.right,orientation+' '+i+' stripe '+stripe.index+' LR');
      assert.equal(edges.top,edges.bottom,orientation+' '+i+' stripe '+stripe.index+' TB');
      rendered++;
    }
  }
  assert.ok(rendered>0);
});
test('rough material and fine motif rendering complete together without clipping',()=>{
  calls.length=0;
  const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
  assert.doesNotThrow(()=>drawWallpaper(canvas,{seed:'rough-stars',motif:'stars',
    textureDisplacement:85,material:'stone',textureCoverage:'stripes',
    textureLayer2Enabled:true,material2:'felt',textureCoverage2:'stripes'}));
  assert.ok(!calls.some(c=>c[0]==='clip'));
});

test('nudge repaints cached completed layers without redrawing any geometry',()=>{
  const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
  const cache={};
  const recipe={seed:'nudge-cache',material:'stucco',motif:'stars',textureDisplacement:100,
    individuality:100,chaos:100,outline:'double',glow:55};
  const base=drawWallpaper(canvas,{...recipe,positionX:0,positionY:0},{cache});
  assert.ok(cache.background && cache.ink);
  calls.length=0;
  presentNudgedArtwork(canvas,cache,{positionX:12,positionY:-8});
  assert.deepEqual(calls,[
    ['drawImage','source-over','main',0,0],
    ['drawImage','source-over','main',72,-104],
  ]);
  assert.equal(base.positionX,0);
  const moved=resolveScene({...recipe,positionX:12,positionY:-8});
  assert.equal(moved.centerX,base.centerX);
  assert.equal(moved.centerY,base.centerY);
  assert.deepEqual(moved.stripes,base.stripes.map(({segmentStart,segmentEnd,hidden,...stripe})=>stripe));
});
test('nudge at export dimensions is a scaled bitmap translation, not recapping stripes',()=>{
  calls.length=0;
  const canvas={width:3024,height:6552,getContext:()=>new FakeContext('main')};
  const scene=drawWallpaper(canvas,{seed:'export-pan',orientation:'diagonal',positionX:-10,positionY:7});
  const draws=calls.filter(x=>x[0]==='drawImage' && x[2]==='main');
  const last=draws.at(-1);
  assert.equal(last[3],-302.4);
  assert.ok(Math.abs(last[4]-458.64)<1e-7);
  const base=resolveScene({seed:'export-pan',orientation:'diagonal'});
  assert.equal(scene.centerX,base.centerX);
  assert.equal(scene.centerY,base.centerY);
});

test('lighting is an ambient wash across the whole canvas with no stripe cast shadows',()=>{
  for(const mood of ['off','daylight','golden','moonlight']){
    calls.length=0;
    const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
    drawWallpaper(canvas,{seed:'ambient:'+mood,material:'none',motif:'stars',lightingMood:mood,
      lightDirection:'top-left',lightStrength:60,shadowStrength:75});
    assert.equal(calls.some(c=>c[0]==='ambientGlow'&&c[1]==='main'),mood!=='off');
    assert.equal(calls.some(c=>c[0]==='lightingGradient'),mood!=='off');
    assert.ok(!calls.some(c=>c[0]==='lightingShadow'),'no cast shadows');
    assert.ok(!calls.some(c=>c[0]==='clip'));
    const picture=calls.findLastIndex(c=>c[0]==='drawImage'&&c[2]==='main');
    const shade=calls.findLastIndex(c=>c[0]==='fillRect'&&c.at(-1)==='main');
    if(mood!=='off')assert.ok(shade>picture,'ambient wash should be composited after the picture');
  }
});
test('whole-canvas ambient light direction and shade scale to full export without shadows',()=>{
  for(const [lightDirection,x,y] of [
    ['top-left',0,0],['top-right',3024,0],
    ['bottom-left',0,6552],['bottom-right',3024,6552],
  ]){
    calls.length=0;
    const canvas={width:3024,height:6552,getContext:()=>new FakeContext('main')};
    drawWallpaper(canvas,{seed:'ambient-'+lightDirection,lightingMood:'golden',
      lightDirection,lightStrength:77,shadowStrength:84});
    assert.ok(calls.some(c=>c[0]==='ambientGlow'&&c[1]==='main'&&c[2]===x&&c[3]===y));
    assert.ok(calls.some(c=>c[0]==='lightingGradient'&&c[1]===x&&c[2]===y));
    assert.ok(!calls.some(c=>c[0]==='lightingShadow'));
  }
});
test('nudge reuses immutable geometry while moving under stationary ambient light',()=>{
  const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
  const cache={};
  const recipe={seed:'ambient-nudge',lightingMood:'moonlight',lightDirection:'bottom-right',
    lightStrength:63,shadowStrength:57};
  drawWallpaper(canvas,recipe,{cache});
  assert.ok(cache.ink&&cache.background);
  calls.length=0;
  presentNudgedArtwork(canvas,cache,{...recipe,positionX:14,positionY:-6});
  assert.equal(calls.filter(c=>c[0]==='ambientGlow'&&c[1]==='main').length,1);
  assert.equal(calls.filter(c=>c[0]==='lightingGradient').length,1);
  assert.ok(!calls.some(c=>c[0]==='lightingShadow'));
  const draws=calls.filter(c=>c[0]==='drawImage'&&c[2]==='main');
  assert.deepEqual(draws.map(c=>c.slice(3)),[[0,0],[84,-78]]);
  assert.deepEqual(resolveScene({...recipe,positionX:14,positionY:-6}).stripes,
    resolveScene(recipe).stripes);
});
test('texture displacement yields visible bounded silhouette movement with and without texture',()=>{
  for(const material of ['none','stucco','stone','linen','wood-grain']){
    const opts={seed:'relief-visibility',material,orientation:'vertical',
      stripeWidth:55,textureCoverage:'stripes'};
    const zero=resolveScene({...opts,textureDisplacement:0});
    const high=resolveScene({...opts,textureDisplacement:100});
    const stripe=high.stripes[3];
    const samples=Array.from({length:250},(_,i)=>textureHeight(high,stripe,-750+i*6,1));
    const magnitude=Math.max(...samples.map(Math.abs));
    assert.ok(magnitude>Math.min(4,stripe.width*.17),material+' relief too subtle: '+magnitude);
    assert.ok(samples.every(v=>Math.abs(v)<=Math.min(28,stripe.width*.34)+1e-8));
    assert.equal(textureHeight(zero,zero.stripes[3],330,1),0);
    assert.equal(textureHeight(high,stripe,330,1),textureHeight(high,stripe,330,1));
    assert.deepEqual(high.stripes,zero.stripes);
  }
});

test('stripe shadow is separately opt-in with ambient lighting off',()=>{
  const recipe={seed:'cast-shadow-check',lightingMood:'off',stripeShadowEnabled:true,
    stripeShadowStrength:76,stripeShadowSoftness:65,stripeShadowDirection:'top-right'};
  calls.length=0;
  const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
  drawWallpaper(canvas,recipe);
  const shadows=calls.filter(c=>c[0]==='lightingShadow');
  assert.equal(shadows.length,1,'one silhouette shadow on the finished ink');
  assert.ok(shadows[0][2]<0&&shadows[0][3]>0);
  assert.equal(calls.some(c=>c[0]==='ambientGlow'&&c[1]==='main'),false);
  assert.equal(stripeShadowParameters({...recipe,stripeShadowStrength:0}),null);
  assert.equal(stripeShadowParameters({...recipe,stripeShadowEnabled:false}),null);
});
test('stripe shadow softness and export scale change blur, not the original scene',()=>{
  const base={seed:'shadow-geometry',stripeShadowEnabled:true,stripeShadowStrength:67,
    stripeShadowDirection:'bottom-left'};
  const a=stripeShadowParameters({...base,stripeShadowSoftness:10},1);
  const b=stripeShadowParameters({...base,stripeShadowSoftness:90},1);
  assert.ok(a.blur<b.blur);
  assert.equal(a.color,b.color);
  assert.ok(a.x>0&&a.y<0);
  const hires=stripeShadowParameters({...base,stripeShadowSoftness:90},3024/600);
  assert.ok(Math.abs(hires.blur/b.blur-3024/600)<1e-10);
  assert.ok(Math.abs(hires.x/b.x-3024/600)<1e-10);
  assert.deepEqual(resolveScene({...base,stripeShadowSoftness:10}).stripes,
    resolveScene({...base,stripeShadowSoftness:90}).stripes);
});
test('ambient and stripe shadows coexist, and nudge reuses the exact cached ink',()=>{
  const canvas={width:600,height:1300,getContext:()=>new FakeContext('main')};
  const recipe={seed:'both-lighting-modes',lightingMood:'moonlight',lightStrength:60,
    shadowStrength:75,stripeShadowEnabled:true,stripeShadowStrength:65,
    stripeShadowSoftness:40,stripeShadowDirection:'bottom-right'};
  const cache={};
  drawWallpaper(canvas,recipe,{cache});
  assert.ok(cache.background&&cache.ink);
  calls.length=0;
  presentNudgedArtwork(canvas,cache,{...recipe,positionX:6,positionY:-4});
  assert.equal(calls.filter(c=>c[0]==='lightingShadow').length,1);
  assert.equal(calls.filter(c=>c[0]==='ambientGlow'&&c[1]==='main').length,1);
  const draws=calls.filter(c=>c[0]==='drawImage'&&c[2]==='main');
  assert.deepEqual(draws.map(c=>c.slice(3)),[[0,0],[36,-52]]);
  const shadowIndex=calls.findIndex(c=>c[0]==='lightingShadow');
  const ambientIndex=calls.findIndex(c=>c[0]==='ambientGlow');
  assert.ok(shadowIndex<ambientIndex,'canvas-wide ambience is applied after stripe shadow');
  assert.deepEqual(resolveScene(recipe).stripes,
    resolveScene({...recipe,positionX:6,positionY:-4}).stripes);
});
