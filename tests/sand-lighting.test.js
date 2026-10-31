import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {sandLighting,rotateSandLighting,sandMaterialLighting,sandRibbonLighting} from '../src/sand-lighting.js';
import {paintSandGrains,sandGrainAt} from '../src/sand-material.js';
import {sandRimStyles,paintSandContourRim} from '../src/sand-contour-relief.js';
import {sandBeadStyles,paintSandRegionBeads} from '../src/sand-beads.js';
import {sandEchoStyles,paintSandRegionEchoes} from '../src/sand-contour-echo.js';

const recipe=(extra={})=>normalizeRecipe({
  seed:'lighting-sand-source',material:'sand-beaded',
  textureCoverage:'stripes',textureStrength:90,
  lightingMood:'daylight',lightStrength:75,shadowStrength:65,
  ...extra
});
const scene=x=>resolveScene(recipe(x));
const near=(a,b)=>Math.abs(a-b)<1e-8;
const mock=()=>{
  const ops=[];
  return {ops,save(){ops.push(['save'])},restore(){ops.push(['restore'])},
    translate(x,y){ops.push(['translate',x,y])},
    beginPath(){ops.push(['begin'])},moveTo(x,y){ops.push(['move',x,y])},
    lineTo(x,y){ops.push(['line',x,y])},closePath(){ops.push(['close'])},
    arc(x,y,r){ops.push(['arc',x,y,r,this.fillStyle])},
    stroke(path){ops.push(['stroke',path??'current',this.lineWidth,this.strokeStyle])},
    fill(){ops.push(['fill'])},
    fillRect(x,y,w,h){ops.push(['rect',x,y,w,h,this.fillStyle])}
  };
};
const ring=[
  {x:0,y:0},{x:75,y:0},{x:75,y:75},{x:0,y:75}
];

test('all existing lighting moods and diagonal screen directions control one source vector',()=>{
  assert.equal(sandLighting(scene({lightingMood:'off'})),null);
  assert.equal(sandLighting(scene({lightStrength:0,shadowStrength:0})),null);
  const nw=sandLighting(scene({lightDirection:'top-left'}));
  const se=sandLighting(scene({lightDirection:'bottom-right'}));
  assert.ok(nw.x<0&&nw.y<0&&se.x>0&&se.y>0);
  assert.ok(near(nw.x,-se.x)&&near(nw.y,-se.y));
  assert.ok(near(Math.hypot(nw.x,nw.y),1));
  assert.ok(sandLighting(scene({lightingMood:'golden'})).high.includes('212'));
  assert.ok(sandLighting(scene({lightingMood:'moonlight'})).high.includes('207'));
  const r=recipe({material:'sand-filigree'});
  assert.deepEqual(decodeRecipe(encodeRecipe(r)),r);
});
test('light rotates into each material surface and reversed ribbon transform',()=>{
  const l=sandLighting(scene());
  assert.deepEqual(rotateSandLighting(null,0),null);
  const quarter=rotateSandLighting(l,Math.PI/2);
  assert.ok(near(quarter.x,l.y)&&near(quarter.y,-l.x));
  const s=scene({textureRotation:90});
  assert.ok(near(sandMaterialLighting(s,s.textureLayers[0]).x,l.y));
  const mir=scene({orientation:'diagonal',mirrorHorizontal:true,mirrorVertical:false});
  const transformed=sandRibbonLighting(mir),a=mir.angle;
  const expect=rotateSandLighting(sandLighting(mir),a,-1,1);
  assert.ok(near(transformed.x,expect.x)&&near(transformed.y,expect.y));
});
test('unlit grains preserve original draw output; lit flecks turn with light',()=>{
  const l={material:'sand-mandala',heightSeed:33,scale:45},bounds={
    left:0,top:0,right:35,bottom:40
  };
  const a=mock(),b=mock();
  paintSandGrains(a,l,bounds);
  paintSandGrains(b,l,bounds,null);
  assert.deepEqual(a.ops,b.ops);
  const nw=mock(),se=mock();
  paintSandGrains(nw,l,bounds,sandLighting(scene({lightDirection:'top-left'})));
  paintSandGrains(se,l,bounds,sandLighting(scene({lightDirection:'bottom-right'})));
  assert.notDeepEqual(nw.ops,se.ops);
  assert.deepEqual(sandGrainAt(l,-4,5),sandGrainAt(l,-4,5));
  assert.ok(nw.ops.some(o=>o[0]==='rect'&&o[5].includes('255,255,242')));
});
test('bead shadow and highlights face opposite halves without moving source ring',()=>{
  const nw=sandBeadStyles(scene({lightDirection:'top-left'}));
  const se=sandBeadStyles(scene({lightDirection:'bottom-right'}));
  const draw=styles=>{const c=mock();paintSandRegionBeads(c,{circle:{cx:55,cy:55,r:20}},styles);return c.ops;};
  const n=draw(nw),s=draw(se);
  assert.notDeepEqual(n,s);
  const arcs=n.filter(o=>o[0]==='arc');
  assert.ok(arcs.length>4);
  assert.ok(arcs.some(o=>o[4].includes('22,28,48')));
  assert.ok(arcs.some(o=>o[4].includes('255,255,242')));
  assert.equal(nw[0].lighting.x,-se[0].lighting.x);
  assert.equal(sandBeadStyles(scene({lightingMood:'off'}))[0].lighting,null);
});
test('lit contour rims translate shadow into light and highlights away, only on Path2D',()=>{
  const nw=sandRimStyles(scene({material:'sand-filigree'}));
  const se=sandRimStyles(scene({material:'sand-filigree',lightDirection:'bottom-right'}));
  const c=mock(),c2=mock();
  paintSandContourRim(c,['source-ring'],nw);
  paintSandContourRim(c2,['source-ring'],se);
  const shifts=c.ops.filter(x=>x[0]==='translate');
  const reverse=c2.ops.filter(x=>x[0]==='translate');
  assert.equal(shifts.length,2);
  assert.ok(shifts[0][1]<0&&shifts[0][2]<0);
  assert.ok(shifts[1][1]>0&&shifts[1][2]>0);
  assert.ok(near(shifts[0][1],-reverse[0][1]));
  assert.equal(paintSandContourRim(mock(),null,[]),0);
});
test('echo shading uses same palette and preserves physical inset distances',()=>{
  const lit=sandEchoStyles(scene({material:'sand-filigree'}));
  const dim=sandEchoStyles(scene({material:'sand-filigree',lightStrength:0,shadowStrength:10}));
  assert.ok(lit[0].lighting.light>dim[0].lighting.light);
  assert.deepEqual(lit[0].insets,dim[0].insets);
  const c=mock();
  assert.ok(paintSandRegionEchoes(c,{circle:{cx:50,cy:50,r:35}},lit)>0);
  assert.ok(c.ops.some(o=>o[0]==='stroke'&&o[3].includes('255,255,242')));
  const zero=sandEchoStyles(scene({material:'sand-filigree',lightingMood:'off'}));
  assert.equal(zero[0].lighting,null);
});
test('renderer reuses scene lighting for grains, rotated paths and exact compound holes',()=>{
  const src=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
  assert.match(src,/paintMaterial\(t,layer,\{left,right,top,bottom\},sandMaterialLighting\(scene,layer\)\)/);
  assert.match(src,/const ribbonLight=sandRibbonLighting\(scene\)/);
  assert.match(src,/ctx\.clip\(object\.rings\?'evenodd':'nonzero'\)/);
  assert.match(src,/sandRims\.some\(s=>s\.lighting\)\?\[sandRegionPath\(object\)\]:null/);
});
