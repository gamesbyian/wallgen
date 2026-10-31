import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene,encodeRecipe,decodeRecipe} from '../src/model.js';
import {sandRimStyles,supportsSandRibbonRim,paintSandContourRim,
  paintSandStrokeGlint} from '../src/sand-contour-relief.js';
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
  assert.match(src,/paintSandContourRim\(ctx,null,sandRims\)/);
  assert.match(src,/paintSandContourRim\(g,\[traceEdge\(stripe/);
  assert.match(src,/paintSandContourRim\(g,\[traceEdge\(branch/);
  assert.match(src,/paintSandStrokeGlint\(ctx,nesting\.strokeWidth,sandRims\)/);
});
