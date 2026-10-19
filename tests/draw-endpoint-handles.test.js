import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPointEditor,pointHandles,movePointHandle,editablePointHandleSides,
  savedPointAnchors,savedPointCorners} from '../src/path-point-editor.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const source=Array.from({length:96},(_,i)=>{
  const t=i/95*Math.PI*2;
  return [.5+.30*Math.sin(t),.5+.18*Math.sin(2*t)];
});
const pixel=(a,b)=>Math.hypot(600*(a[0]-b[0]),1300*(a[1]-b[1]));
const coords=e=>e.points.map(p=>p.slice());

test('open endpoints expose one real tangent each; internal anchors expose both',()=>{
  const e=createPointEditor(source),last=e.points.length-1;
  assert.deepEqual(editablePointHandleSides(e,0),['out']);
  assert.deepEqual(editablePointHandleSides(e,last),['in']);
  const inside=e.anchors.find(i=>i>0&&i<last);
  assert.ok(Number.isInteger(inside));
  assert.deepEqual(editablePointHandleSides(e,inside),['in','out']);
  assert.deepEqual(editablePointHandleSides(e,-1),[]);
  assert.deepEqual(editablePointHandleSides(e,inside+1000),[]);
});

test('moving ghost incoming first or ghost outgoing last tangent is truly inert',()=>{
  for(const [index,side] of [[0,'in'],[95,'out']]){
    const e=createPointEditor(source);
    const points=coords(e),pins=savedPointAnchors(e),corners=savedPointCorners(e);
    const handles=pointHandles(e,index);
    const target=[handles[side][0]+.08,handles[side][1]-.07];
    const result=movePointHandle(e,index,side,target);
    assert.equal(result,e.points);
    assert.deepEqual(e.points,points);
    assert.deepEqual(savedPointAnchors(e),pins);
    assert.deepEqual(savedPointCorners(e),corners);
    assert.equal(e.selected,-1);
    assert.equal(e.changed.size,0);
  }
});

test('valid single-sided endpoint handle moves only the adjacent source span',()=>{
  for(const [index,side] of [[0,'out'],[95,'in']]){
    const e=createPointEditor(source),prior=coords(e);
    const handles=pointHandles(e,index),h=handles[side];
    movePointHandle(e,index,side,[h[0]+.035,h[1]-.028]);
    assert.ok(e.points.some((p,i)=>pixel(p,prior[i])>.5),
      'valid endpoint tangent must deform its adjacent span');
    assert.deepEqual(e.points[0],prior[0]);
    assert.deepEqual(e.points.at(-1),prior.at(-1));
    for(const at of e.anchors)
      assert.deepEqual(e.points[at],prior[at],at+' should be a fixed anchor');
    assert.ok(savedPointAnchors(e).includes(index));
    assert.equal(e.selected,index);
    assert.ok(e.changed.has(index));
    const recipe=normalizeRecipe({structure:'paths',geometry:'drawn',
      customPath:e.points,drawnAnchors:savedPointAnchors(e),
      drawnCorners:savedPointCorners(e),viewZoom:.5,viewPanY:17,
      positionX:12});
    assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),recipe);
  }
});

test('the actual Draw hit-test and ink renderer never advertise ghost endpoint handles',()=>{
  const code=readFileSync(new URL('../src/draw-path-ui.js',import.meta.url),'utf8');
  const references=code.match(/editablePointHandleSides\(editor,editor\.selected\)/g)||[];
  assert.equal(references.length,2,'both actual ink and pointer hit-tests must use validity');
  assert.match(code,/cornerButton\.disabled=!available\|\|editor\.selected===0\|\|\s*editor\.selected===editor\.points\.length-1/);
  assert.match(code,/if\(distance\(mouse,project\(m,handles\[side\]\)\)<=radius\)/);
});
