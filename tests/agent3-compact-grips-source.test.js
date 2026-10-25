import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compactTextGripLayout} from '../src/text-grip-layout.js';

const examples=[
  {canvasWidth:165,canvasHeight:350,centreX:82.5,centreY:175,frameWidth:10,frameHeight:18,rotation:0},
  {canvasWidth:275,canvasHeight:594,centreX:137.5,centreY:297,frameWidth:12,frameHeight:24,rotation:0},
  {canvasWidth:275,canvasHeight:594,centreX:247.5,centreY:534.6,frameWidth:12,frameHeight:24,rotation:0},
  {canvasWidth:275,canvasHeight:594,centreX:137.5,centreY:23.76,frameWidth:12,frameHeight:24,rotation:0},
  {canvasWidth:275,canvasHeight:594,centreX:137.5,centreY:297,frameWidth:12,frameHeight:24,rotation:45}
];

test('44px compact rotate/scale centres do not collide or spill into genuine portrait canvas',()=>{
  for(const sample of examples){
    const pair=compactTextGripLayout(sample);
    assert.equal(pair.reachable,true,'the two transform buttons must fit '+JSON.stringify(sample));
    assert.ok(pair.separation>=48,'44px controls overlap '+JSON.stringify(sample));
    const rotation=sample.rotation*Math.PI/180;
    const project=xy=>{
      const dx=xy.left+22-sample.frameWidth/2,
        dy=xy.top+22-sample.frameHeight/2;
      return {x:sample.centreX+dx*Math.cos(rotation)-dy*Math.sin(rotation),
        y:sample.centreY+dx*Math.sin(rotation)+dy*Math.cos(rotation)};
    };
    const A=project(pair.rotate),B=project(pair.scale);
    for(const p of [A,B]){
      assert.ok(p.x>=22&&p.x<=sample.canvasWidth-22,
        '44px horizontal clip '+JSON.stringify({sample,p}));
      assert.ok(p.y>=22&&p.y<=sample.canvasHeight-22,
        '44px vertical clip '+JSON.stringify({sample,p}));
    }
    assert.ok(Math.hypot(A.x-B.x,A.y-B.y)>=48);
  }
});

test('the same real accessible 44px DOM buttons remain ink-clear and keyboard-operable',()=>{
 const ui=readFileSync(new URL('../src/text-direct-ui.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../text-overlays.css',import.meta.url),'utf8');
 assert.match(ui,/const compact=physicalWidth<80&&physicalHeight<100/,
   'one-letter titles must trigger the compact layout');
 assert.match(ui,/compactTextGripLayout\(\{/);
 assert.match(ui,/outline\.dataset\.gripReachable=String\(grip\.reachable\)/);
 assert.match(css,/\.text-direct-handle\{[^}]*width:44px;height:44px/,
   'must preserve actual 44px screen targets');
 assert.match(css,/\.text-direct-outline\.text-direct-compact \.text-direct-handle\{/,
   'compact controls need deterministic inline positions');
 assert.match(ui,/element\.setAttribute\('aria-label',label\)/,
   'keyboard/screen reader descriptions must remain');
 assert.match(ui,/event\.preventDefault\(\);event\.stopImmediatePropagation\(\)/,
   'existing pointer capture/Undo path must remain');
});
