import test from 'node:test';
import assert from 'node:assert/strict';
import {placeOffsetGrip,OFFSET_GRIP_RADIUS_CSS,OFFSET_GRIP_REACH_CSS}
  from '../src/path-offset-grip.js';
const distance=(a,b)=>Math.hypot(a[0]-b.x,a[1]-b.y);
test('offset grip remains off the anchor with a 44 CSS-unit hit circle',()=>{
  const anchor=[155,310];
  const g=placeOffsetGrip({anchor,width:320,height:700});
  assert.ok(g);
  assert.equal(g.radius,OFFSET_GRIP_RADIUS_CSS);
  assert.ok(Math.abs(distance(anchor,g)-OFFSET_GRIP_REACH_CSS)<1e-8);
});
test('scaled canvas backing coordinates do not change the CSS interaction size',()=>{
  const small=placeOffsetGrip({anchor:[155,310],width:320,height:700,scale:1});
  const large=placeOffsetGrip({anchor:[310,620],width:640,height:1400,scale:2});
  assert.ok(small&&large);
  assert.deepEqual([large.x,large.y,large.radius],[small.x*2,small.y*2,small.radius*2]);
});
test('dense neighbors and tangent handles cannot be stolen by the grip',()=>{
  const anchor=[155,310],obstacles=[[196,269],[114,269],[196,351],[114,351],[213,310],[97,310]];
  const g=placeOffsetGrip({anchor,width:320,height:700,obstacles});
  if(g)for(const p of obstacles)assert.ok(distance(p,g)>=OFFSET_GRIP_RADIUS_CSS+17+2);
});
test('control panels and viewport edges keep 44 CSS-unit grip accessible',()=>{
  const bounds={x:0,y:450,width:320,height:250};
  for(const anchor of [[12,12],[308,12],[12,688],[308,688],[160,600]]){
    const g=placeOffsetGrip({anchor,width:320,height:700,blockedRects:[bounds]});
    if(!g)continue;
    assert.ok(g.x>=24&&g.x<=296&&g.y>=24&&g.y<=676);
    assert.ok(g.y<450-24||g.x<0-24||g.x>320+24);
  }
});
test('fails closed when a point is offscreen or no target can fit',()=>{
  assert.equal(placeOffsetGrip({anchor:[-5,10],width:320,height:700}),null);
  assert.equal(placeOffsetGrip({anchor:[15,15],width:40,height:40}),null);
  assert.equal(placeOffsetGrip({anchor:[50,50],width:100,height:100,
    blockedRects:[{x:0,y:0,width:100,height:100}]}),null);
});
