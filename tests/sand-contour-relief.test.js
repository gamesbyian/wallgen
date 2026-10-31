import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {sandRimStyles,supportsSandRibbonRim,paintSandContourRim,
  paintSandStrokeGlint,sandStrokeGlintFootprint} from '../src/sand-contour-relief.js';
import {readFileSync} from 'node:fs';

const scene=(extra={})=>resolveScene(normalizeRecipe({
  seed:'sand-deposition-s2',family:'studio',material:'sand-mandala',
  textureCoverage:'stripes',textureScale:35,textureStrength:77,...extra}));
test('sand rim is opt-in, foreground-only, and deterministic through recipe transport',()=>{
  const s=scene();assert.deepEqual(sandRimStyles(s),sandRimStyles(s));
  assert.equal(sandRimStyles(s).length,1);
  assert.equal(sandRimStyles(scene({textureCoverage:'background'})).length,0);
  assert.equal(sandRimStyles(scene({material:'none'})).length,0);
  assert.equal(sandRimStyles(scene({textureStrength:0})).length,0);
  const r=normalizeRecipe({material:'sand-mandala',textureCoverage:'stripes',
    textureStrength:77,textureLayer2Enabled:true,material2:'sand-mandala',
    textureCoverage2:'background',textureLayer3Enabled:true,
    material3:'sand-mandala',textureCoverage3:'both'});
  assert.deepEqual(decodeRecipe(encodeRecipe(r)),r);
  assert.equal(sandRimStyles(resolveScene(r)).length,2);
  assert.ok(sandRimStyles(scene({textureStrength:100}))[0].darkAlpha>
    sandRimStyles(scene({textureStrength:15}))[0].darkAlpha);
});
test('deposition stays off for incomplete motif geometry and woven gaps',()=>{
  const s={construction:'ribbon'};
  assert.equal(supportsSandRibbonRim(s,{lineStyle:'continuous',motif:'solid'}),true);
  for(const motif of ['stars','dots','hatch','checker'])
    assert.equal(supportsSandRibbonRim(s,{lineStyle:'continuous',motif}),false);
  assert.equal(supportsSandRibbonRim(s,{lineStyle:'dotted',motif:'solid'}),false);
  assert.equal(supportsSandRibbonRim({construction:'woven'},{
    lineStyle:'continuous',motif:'solid'}),false);
  assert.equal(supportsSandRibbonRim({construction:'stroke'},{
    lineStyle:'continuous',motif:'checker'}),true);
});
test('rim reuses clipped paths, never fills or expands colour geometry',()=>{
  const operations=[],ctx={
    save(){operations.push('save')},restore(){operations.push('restore')},
    stroke(path){operations.push(['stroke',path??'current',this.strokeStyle,this.lineWidth])},
  };
  const paths=['left-rail','right-rail'];
  const styles=sandRimStyles(scene());
  assert.equal(paintSandContourRim(ctx,paths,styles),4);
  assert.equal(operations.filter(x=>Array.isArray(x)).length,4);
  assert.deepEqual(operations.filter(x=>Array.isArray(x)).map(x=>x[1]),
    ['left-rail','right-rail','left-rail','right-rail']);
  assert.equal(operations[0],'save');
  assert.equal(operations.at(-1),'restore');
  operations.length=0;
  assert.equal(paintSandContourRim(ctx,null,styles),2);
  assert.equal(operations.filter(x=>Array.isArray(x)).every(x=>x[1]==='current'),true);
  assert.equal(paintSandContourRim(ctx,paths,[]),0);
  assert.equal(paintSandStrokeGlint(ctx,2,styles),true);
  assert.ok(ctx.lineWidth<=2);
});
test('actual renderer wires compound even-odd clipping, source rails, crossing replay and nested contour linework',()=>{
  const src=readFileSync(new URL('../src/renderer.js',import.meta.url),'utf8');
  assert.match(src,/ctx\.clip\(object\.rings\?'evenodd':'nonzero'\)/);
  assert.match(src,/paintSandContourRim\(ctx,sandRims\.some\(s=>s\.lighting\)\?\[sandRegionPath\(object\)\]:null,sandRims\)/);
  assert.match(src,/paintSandContourRim\(g,\[traceEdge\(stripe/);
  assert.match(src,/paintSandContourRim\(g,\[traceEdge\(branch/);
  assert.match(src,/paintSandStrokeGlint\(ctx,nesting\.strokeWidth,sandRims,litGlintPath\)/);
});

test('lit glints and tiny contact shades remain inside every source stroke width',()=>{
  for(const sourceWidth of [.12,.4,.75,1,2,3,7,18]){
    const profile=sandStrokeGlintFootprint(sourceWidth);
    assert.ok(profile.width>0&&profile.width<sourceWidth);
    assert.ok(profile.offset>0);
    // Minkowski width bound: offset by source normal cannot escape the
    // original stroked path even when its tangent changes at a sharp tip.
    assert.ok(profile.offset+profile.width/2<=sourceWidth/2+1e-12);
  }
  assert.equal(sandStrokeGlintFootprint(0),null);
  assert.equal(sandStrokeGlintFootprint(Infinity),null);
  assert.equal(sandStrokeGlintFootprint(NaN),null);
  const mk=()=>{const ops=[];return {ops,
    save(){ops.push(['save'])},restore(){ops.push(['restore'])},
    translate(x,y){ops.push(['translate',x,y])},
    stroke(p){ops.push(['stroke',p??'current',this.strokeStyle,this.lineWidth])}
  }};
  const nw=sandRimStyles(scene({lightingMood:'golden',
    lightDirection:'top-left',lightStrength:80,shadowStrength:65}));
  const se=sandRimStyles(scene({lightingMood:'golden',
    lightDirection:'bottom-right',lightStrength:80,shadowStrength:65}));
  const a=mk(),b=mk();
  assert.equal(paintSandStrokeGlint(a,2,nw,'canonical-path'),true);
  assert.equal(paintSandStrokeGlint(b,2,se,'canonical-path'),true);
  const strokes=a.ops.filter(x=>x[0]==='stroke');
  assert.equal(strokes.length,2);
  assert.ok(strokes.every(x=>x[1]==='canonical-path'));
  assert.ok(strokes[0][2].includes(nw[0].lighting.shade));
  assert.ok(strokes[1][2].includes(nw[0].lighting.high));
  assert.ok(a.ops.filter(x=>x[0]==='translate')[0][1]>0);
  assert.ok(b.ops.filter(x=>x[0]==='translate')[0][1]<0);
  assert.equal(paintSandStrokeGlint(mk(),2,[],null),false);
  const legacy=mk();
  assert.equal(paintSandStrokeGlint(legacy,2,
    sandRimStyles(scene()),null),true);
  assert.deepEqual(legacy.ops.filter(x=>x[0]==='stroke').map(x=>x[1]),
    ['current']);
});
