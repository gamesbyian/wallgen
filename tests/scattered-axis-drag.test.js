import test from 'node:test';
import assert from 'node:assert/strict';
import {beginAxisDrag,axisConstrainedPoint} from '../src/axis-constrained-drag.js';
import {scatteredWorldToPixel,scatteredPixelToWorld,scatteredMoveOverride}
  from '../src/scattered-drag.js';

const recipe={viewZoom:1.4,viewPanX:8,viewPanY:-12,positionX:0,positionY:0,
  scatteredOverrides:[]};

test('one-thumb shape movement selects a CSS direction but saves only vector geometry',()=>{
  const origin=[215,740],start=[110,230];
  const gesture=beginAxisDrag(start,origin,true);
  const initial=axisConstrainedPoint(gesture,[114,233],[233,761]);
  assert.deepEqual(initial.point,origin);
  assert.equal(initial.state.axis,null);
  const locked=axisConstrainedPoint(initial.state,[160,240],[268,786]);
  assert.equal(locked.state.axis,'x');
  assert.deepEqual(locked.point,[268,740]);
  const turn=axisConstrainedPoint(locked.state,[165,390],[273,930]);
  assert.deepEqual(turn.point,[273,740],
    'changing finger direction cannot switch the locked axis');
  const adjusted=scatteredMoveOverride(recipe,3,{r:90},
    {x:turn.point[0],y:turn.point[1]});
  assert.deepEqual(adjusted,[{index:3,x:.455,y:.569231,radius:.15}]);
  assert.deepEqual(recipe.scatteredOverrides,[]);
});

test('vertical lock freezes X; free moves and canceled drags do not affect the recipe',()=>{
  const start=[65,80],origin=[300,650];
  const gesture=beginAxisDrag(start,origin,true);
  const locked=axisConstrainedPoint(gesture,[75,150],[350,700]);
  assert.deepEqual(locked.point,[300,700]);
  assert.equal(locked.state.axis,'y');
  const free=beginAxisDrag(start,origin,false);
  assert.deepEqual(axisConstrainedPoint(free,[75,150],[350,700]).point,[350,700]);
  assert.equal(recipe.scatteredOverrides.length,0);
});

test('camera zoom and pan round-trip hit mapping without authored pixels',()=>{
  const width=3024,height=6552,origin={x:260,y:700};
  const p=scatteredWorldToPixel(recipe,width,height,origin.x,origin.y);
  const found=scatteredPixelToWorld(recipe,width,height,p.x,p.y);
  assert.ok(Math.abs(found.x-origin.x)<1e-9);
  assert.ok(Math.abs(found.y-origin.y)<1e-9);
});
