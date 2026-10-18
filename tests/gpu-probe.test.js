import test from 'node:test';
import assert from 'node:assert/strict';
import {alphaOver,probeWebGL2,GPU_PROBE_VERTEX,GPU_PROBE_FRAGMENT} from '../src/gpu-probe.js';
test('reference alpha-over does not alter opaque background',()=>{
  const a=alphaOver([.2,.3,.4,1],[1,0,0,0]);
  assert.deepEqual(a,[.2,.3,.4,1]);
});
test('reference alpha-over combines translucent materials',()=>{
  const output=alphaOver([0,0,1,1],[1,0,0,.5]);
  assert.deepEqual(output,[.5,0,.5,1]);
});
test('research probe does not require GPU or DOM',()=>{
  assert.deepEqual(probeWebGL2({canvasFactory:()=>({getContext:()=>null})}),
    {available:false,reason:'WebGL2 context unavailable'});
});
test('probe uses explicit shader formats and blending formula',()=>{
  assert.match(GPU_PROBE_VERTEX,/#version 300 es/);
  assert.match(GPU_PROBE_FRAGMENT,/underColour/);
  assert.match(GPU_PROBE_FRAGMENT,/overColour/);
});
