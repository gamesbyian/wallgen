import test from 'node:test';
import assert from 'node:assert/strict';
import {beginScatteredScale,advanceScatteredScale} from '../src/scattered-scale-gesture.js';
import {scatteredMoveOverride} from '../src/scattered-drag.js';
import {normalizeScatteredOverrides} from '../src/scattered-object-edits.js';
test('scale grip has no initial jump and scales proportional to screen-space distance',()=>{
 const circle={cx:300,cy:600,r:90},centre={x:130,y:320};
 const state=beginScatteredScale({circle,centre,point:{x:175,y:320}});
 assert.equal(state.radius,90);
 assert.equal(advanceScatteredScale(state,{x:175,y:320}).moved,false);
 const double=advanceScatteredScale(state,{x:220,y:320});
 assert.equal(double.radius,180);
 assert.equal(double.moved,true);
 assert.equal(state.radius,90,'a provisional sample must not mutate the start');
 assert.deepEqual(circle,{cx:300,cy:600,r:90});
});
test('scale is camera-independent, clamped and rejects unsafe starts',()=>{
 const circle={r:60},centre={x:45,y:115};
 const start=beginScatteredScale({circle,centre,point:{x:45,y:145}});
 assert.equal(advanceScatteredScale(start,{x:45,y:115}).radius,6);
 assert.equal(advanceScatteredScale(start,{x:45,y:1115}).radius,720);
 assert.equal(advanceScatteredScale(start,{x:NaN,y:0}),start);
 assert.equal(beginScatteredScale({circle,centre,point:centre}),null);
 assert.equal(beginScatteredScale({circle:{r:NaN},centre,point:{x:45,y:145}}),null);
});
test('circle and imported silhouette use the same canonical radius override',()=>{
 const first=[{index:1,x:.2,y:.3,radius:.1}];
 const recipe={scatteredOverrides:first};
 const circle={cx:240,cy:700,r:120};
 const resized=scatteredMoveOverride(recipe,2,{...circle,r:240},
   {x:circle.cx,y:circle.cy});
 assert.deepEqual(resized,normalizeScatteredOverrides([...first,
   {index:2,x:.4,y:700/1300,radius:.4}]));
 assert.equal(recipe.scatteredOverrides,first);
});
