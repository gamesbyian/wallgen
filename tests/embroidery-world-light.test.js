import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {sandLighting,sandRibbonLighting} from '../src/sand-lighting.js';
import {threadLightProfile,rotateThreadLighting} from '../src/thread-lighting.js';
import {normalizeSurfaceTreatments,drawRibbonEmbroidery,drawRegionEmbroidery} from '../src/embroidery.js';
import {artKey,hasDirectionalEmbroidery} from '../src/render-art-key.js';

const thread=(style='satin-fibre',direction=0)=>normalizeSurfaceTreatments([{
  id:'test-embroidery',enabled:true,style,pitch:6,relief:80,direction,
  target:{scope:'all',role:'fill',colorSlots:[],ids:[]}
}])[0];
const recipe=(style='satin-fibre',extra={})=>normalizeRecipe({
  seed:'stitch-world-light',structure:'paths',geometry:'wave',
  motif:'solid',construction:'ribbon',material:'none',
  surfaceTreatments:[thread(style)],lightingMood:'daylight',
  lightDirection:'top-left',lightStrength:85,shadowStrength:70,...extra
});
function fake(){
  const strokes=[],paths=[];let vertices=[];
  return {strokes,paths,save(){},restore(){},translate(){},rotate(){},
    beginPath(){vertices=[]},moveTo(x,y){vertices.push(['M',x,y])},
    lineTo(x,y){vertices.push(['L',x,y])},
    bezierCurveTo(...pts){vertices.push(['C',...pts])},
    stroke(){strokes.push({path:vertices.map(p=>[...p]),ink:this.strokeStyle,
      width:this.lineWidth})}};
}
const render=(source,style='satin-fibre',scope='ribbon',range=null)=>{
  const scene=resolveScene(source),ctx=fake();
  let count;
  if(scope==='ribbon')
    count=drawRibbonEmbroidery(ctx,scene.stripes[3],scene.extent,thread(style),
      range,sandRibbonLighting(scene));
  else count=drawRegionEmbroidery(ctx,{circle:{cx:200,cy:325,r:80}},
    thread(style,37),sandLighting(scene));
  return {count,strokes:ctx.strokes};
};

test('all registered thread finishes remain deterministically inert when world light is off',()=>{
  for(const style of ['satin','satin-soft','running','chain','satin-fibre','tatami-fibre']){
    const unlit=recipe(style,{lightingMood:'off'});
    const scene=resolveScene(unlit),ctx=fake(),old=fake();
    const a=drawRibbonEmbroidery(ctx,scene.stripes[3],scene.extent,thread(style),
      null,sandRibbonLighting(scene));
    const b=drawRibbonEmbroidery(old,scene.stripes[3],scene.extent,thread(style));
    assert.equal(a,b,style);
    assert.deepEqual(ctx.strokes,old.strokes,
      style+' all original unlit strokes must remain byte-identical');
  }
});

test('world lamp projects raised thread contact shadow away and glint towards light',()=>{
  const nw=sandLighting(resolveScene(recipe('satin')));
  const se=sandLighting(resolveScene(recipe('satin',{
    lightDirection:'bottom-right'
  })));
  const a=threadLightProfile(nw,0,0,30,0,6,80);
  const b=threadLightProfile(se,0,0,30,0,6,80);
  assert.ok(a.height>0&&a.reach>0);
  assert.ok(a.shadowX>0&&a.shadowY>0,
    'NW light throws shadow toward southeast');
  assert.ok(a.highlightX<0&&a.highlightY<0);
  assert.ok(a.reach<=6*.44);
  assert.equal(a.shadowX,-b.shadowX);
  assert.equal(a.highlightY,-b.highlightY);
  assert.notEqual(a.facing,b.facing);
  const vert=threadLightProfile(nw,0,0,0,30,6,80);
  assert.notEqual(a.facing,vert.facing,
    'thread direction must control anisotropic response');
  assert.equal(threadLightProfile(nw,0,0,0,0,6,80),null);
  assert.equal(threadLightProfile(nw,0,0,30,0,0,80),null);
  assert.equal(threadLightProfile(null,0,0,30,0,6,80),null);
});

test('world lighting changes the actual stitch ink of every supported style',()=>{
  for(const style of ['satin','satin-soft','running','chain','satin-fibre','tatami-fibre']){
    const nw=render(recipe(style),style);
    const se=render(recipe(style,{lightDirection:'bottom-right'}),style);
    const unlit=render(recipe(style,{lightingMood:'off'}),style);
    assert.ok(nw.count>5&&nw.strokes.length>10,style);
    assert.equal(nw.count,se.count,style);
    assert.equal(nw.count,unlit.count,style);
    assert.notDeepEqual(nw.strokes,se.strokes,
      style+' must respond to the same world light');
    assert.ok(nw.strokes.some(x=>x.ink.includes('255,255,242')),
      style+' must use the active mood highlight');
    assert.ok(nw.strokes.some(x=>x.ink.includes('22,28,48')),
      style+' must use the active mood contact shade');
  }
});

test('world light is converted to local stitch coordinates under region rotation',()=>{
  const nw=recipe('tatami-fibre'),se=recipe('tatami-fibre',{
    lightDirection:'bottom-right'
  });
  const a=render(nw,'tatami-fibre','region');
  const b=render(se,'tatami-fibre','region');
  assert.ok(a.count>5&&a.strokes.length>10);
  assert.equal(a.count,b.count);
  assert.notDeepEqual(a.strokes,b.strokes);
  const lamp=sandLighting(resolveScene(nw));
  const turned=rotateThreadLighting(lamp,Math.PI/2);
  assert.ok(Math.abs(turned.x-lamp.y)<1e-9);
  assert.ok(Math.abs(turned.y+lamp.x)<1e-9);
});

test('preview key includes global lighting only for enabled authored embroidery',()=>{
  const source=recipe();
  assert.equal(hasDirectionalEmbroidery(source),true);
  assert.notEqual(artKey(source),artKey({...source,lightDirection:'bottom-right'}));
  assert.notEqual(artKey(source),artKey({...source,lightingMood:'off'}));
  assert.notEqual(artKey(source),artKey({...source,lightStrength:2}));
  const noTreat=normalizeRecipe({...source,surfaceTreatments:[]});
  assert.equal(hasDirectionalEmbroidery(noTreat),false);
  assert.equal(artKey(noTreat),artKey({...noTreat,lightDirection:'bottom-right'}));
  const disabled=normalizeRecipe({...source,surfaceTreatments:[
    {...source.surfaceTreatments[0],enabled:false}
  ]});
  assert.equal(hasDirectionalEmbroidery(disabled),false);
  assert.equal(artKey(disabled),artKey({...disabled,lightingMood:'off'}));
});

test('production paths retain exact clipping and crossing replay with one lamp',()=>{
  const code=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
  assert.match(code,/drawRegionEmbroidery\(ctx,object,stitch,sandLighting\(scene\)\)/);
  assert.match(code,/drawRibbonEmbroidery\(g,stripe,scene\.extent,stitch,null,ribbonLight,\s*\{contactShadows:scene\.crossingMode==='over'\}\)/);
  assert.match(code,/drawRibbonEmbroidery\(g,stripe,scene\.extent,stitch,\s*\{start,end\},ribbonLight,\{replayContacts\}\)/);
  assert.match(code,/ctx\.clip\(object\.rings\?'evenodd':'nonzero'\)/);
  assert.match(code,/g\.clip\(stripeFillPath\(branch,scene\.extent,scene\)\)/);
});
