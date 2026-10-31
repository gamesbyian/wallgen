import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {sandLighting,rotateSandLighting,sandMaterialLighting,sandRibbonLighting,sandCapDiffuse} from '../src/sand-lighting.js';
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

test('hemisphere normals turn with the same physical lamp as ribbon and material transforms',()=>{
  const light=sandLighting(scene({lightDirection:'top-left'}));
  const opposite=sandLighting(scene({lightDirection:'bottom-right'}));
  const nx=light.x*.8,ny=light.y*.8;
  assert.ok(sandCapDiffuse(light,nx,ny)>sandCapDiffuse(light,-nx,-ny));
  assert.ok(near(sandCapDiffuse(light,nx,ny),
    sandCapDiffuse(opposite,-nx,-ny)));
  assert.ok(near(sandCapDiffuse(light,0,0),.68));
  assert.equal(sandCapDiffuse(null,nx,ny),0);
  assert.equal(sandCapDiffuse(light,NaN,ny),0);
  assert.ok(sandCapDiffuse(light,-2,-2)<=1);
  const rotated=rotateSandLighting(light,Math.PI/2);
  assert.ok(near(sandCapDiffuse(light,nx,ny),
    sandCapDiffuse(rotated,ny,-nx)));
});
test('beads use one analytic rounded cap plus directional, bounded contact footprint',()=>{
  const draw=direction=>{
    const c=mock();
    c.ellipse=(...args)=>c.ops.push(['ellipse',...args]);
    c.createRadialGradient=(...coords)=>{
      const stops=[];c.ops.push(['gradient',...coords,stops]);
      return {addColorStop:(offset,colour)=>stops.push([offset,colour])};
    };
    const styles=sandBeadStyles(scene({lightDirection:direction}));
    paintSandRegionBeads(c,{circle:{cx:50,cy:50,r:30}},styles);
    return c.ops;
  };
  const nw=draw('top-left'),se=draw('bottom-right');
  const gradients=nw.filter(x=>x[0]==='gradient');
  assert.ok(gradients.length>=8);
  assert.ok(gradients.every(x=>x.at(-1).length===4));
  assert.ok(gradients.every(x=>x.at(-1)[0][1].includes('255,255,242')));
  assert.ok(gradients.every(x=>x.at(-1)[3][1].includes('22,28,48')));
  const shadows=nw.filter(x=>x[0]==='ellipse');
  assert.equal(shadows.length,gradients.length);
  assert.ok(shadows[0][1]>se.find(x=>x[0]==='ellipse')[1]);
  assert.ok(shadows[0][2]>se.find(x=>x[0]==='ellipse')[2]);
  const cap=nw.find(x=>x[0]==='arc');
  assert.ok(cap&&cap[3]>0);
  assert.equal(nw.filter(x=>x[0]==='arc').length,gradients.length);
});
test('lit grain microfacets keep the exact same seeded coordinates across crops',()=>{
  const layer={material:'sand-mandala',heightSeed:247,scale:35};
  const lamp=sandLighting(scene({lightDirection:'top-right'}));
  const paint=bounds=>{
    const c=mock();paintSandGrains(c,layer,bounds,lamp);
    return c.ops.filter(o=>o[0]==='rect'&&o[1]>=20&&o[1]<=27&&
      o[2]>=20&&o[2]<=27).map(o=>o.slice(1));
  };
  const wide=paint({left:0,top:0,right:80,bottom:80});
  const narrow=paint({left:12,top:12,right:42,bottom:42});
  assert.ok(wide.length>0);
  assert.deepEqual(wide,narrow);
});
