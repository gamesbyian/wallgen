import test from 'node:test';
import assert from 'node:assert/strict';
import {createPointEditor,pointAnchorWouldMove,movePointAnchor,
  savedPointAnchors,savedPointCorners} from '../src/path-point-editor.js';

const trace=[[-2,.25],[-1.2,.34],[.2,.5],[1.7,.65],[3,.85]];
const state=e=>({
  points:e.points.map(p=>p.slice()),pinned:[...e.pinned],
  corners:[...e.corners],changed:[...e.changed],selected:e.selected,
  anchors:[...e.anchors]
});
test('outward endpoint nudges at the normalized coordinate bounds are inert',()=>{
  const e=createPointEditor(trace);
  assert.ok(e,'off-frame custom path still has a valid centreline');
  const before=state(e),ident=e.points;
  assert.equal(pointAnchorWouldMove(e,0,[-2.00001,.25]),false);
  assert.equal(pointAnchorWouldMove(e,0,[-100,.25]),false);
  assert.equal(pointAnchorWouldMove(e,e.points.length-1,[3.0001,.85]),false);
  assert.equal(pointAnchorWouldMove(e,e.points.length-1,[100,.85]),false);
  assert.equal(movePointAnchor(e,0,[-50,.25]),ident);
  assert.equal(movePointAnchor(e,e.points.length-1,[20,.85]),ident);
  assert.deepEqual(state(e),before,'no pin, point selection or smoothing state can be minted');
  assert.deepEqual(savedPointAnchors(e),[]);
  assert.deepEqual(savedPointCorners(e),[]);
});
test('sub-five-decimal pointer noise is inert but a true one-pixel nudge changes geometry',()=>{
  const e=createPointEditor(trace),initial=e.points.map(p=>p.slice());
  assert.equal(pointAnchorWouldMove(e,0,[-2,.25000000005]),false);
  assert.equal(pointAnchorWouldMove(e,0,[-2,.250003]),false);
  assert.equal(pointAnchorWouldMove(e,0,[-1.99998,.25]),true);
  movePointAnchor(e,0,[-1.99998,.25]);
  assert.notDeepEqual(e.points,initial);
  assert.ok(savedPointAnchors(e).includes(0));
  assert.ok(e.changed.has(0));
  assert.equal(e.selected,0);
  assert.equal(pointAnchorWouldMove(e,0,[-1.99998,.25]),false);
  assert.equal(pointAnchorWouldMove(e,-1,[0,0]),false);
  assert.equal(pointAnchorWouldMove(e,1,[NaN,0]),false);
  assert.equal(pointAnchorWouldMove(e,99,[0,0]),false);
});
