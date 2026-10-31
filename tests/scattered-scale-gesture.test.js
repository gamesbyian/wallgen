import test from 'node:test';
import assert from 'node:assert/strict';
import {beginScatteredScale,advanceScatteredScale,
  anchoredScatteredCircle,beginScatteredAnchoredScale,
  advanceScatteredAnchoredScale} from '../src/scattered-scale-gesture.js';
import {scatteredSelectionBounds} from '../src/scattered-selection-bounds.js';
import {readFileSync} from 'node:fs';
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

test('sub-8 CSS px centre and edge scale finger jitter never commits geometry',()=>{
  const circle={cx:220,cy:650,r:120};
  const centre=beginScatteredScale({circle,centre:{x:180,y:350},
    point:{x:230,y:350}});
  const wobble=advanceScatteredScale(centre,{x:234,y:354});
  assert.equal(wobble.moved,false);
  const deliberate=advanceScatteredScale(centre,{x:250,y:350});
  assert.equal(deliberate.moved,true);
  const anchor={x:100,y:650};
  const edge=beginScatteredAnchoredScale({circle,anchor,point:{x:210,y:350},
    anchorX:100,gripX:260});
  const tiny=advanceScatteredAnchoredScale(edge,{x:214,y:352});
  assert.equal(tiny.moved,false);
  assert.equal(advanceScatteredAnchoredScale(edge,{x:240,y:350}).moved,true);
  assert.deepEqual(circle,{cx:220,cy:650,r:120});
});

test('anchored resize pins actual opposite circle extent while scaling radially',()=>{
  const circle={cx:240,cy:650,r:120},anchor={x:120,y:650};
  const state=beginScatteredAnchoredScale({circle,anchor,point:{x:300,y:400},
    gripX:360,anchorX:120});
  assert.ok(state);
  const start=advanceScatteredAnchoredScale(state,{x:300,y:400});
  assert.deepEqual(start.circle,circle);
  assert.equal(start.moved,false);
  const increased=advanceScatteredAnchoredScale(state,{x:540,y:400});
  assert.equal(increased.circle.r,240);
  assert.equal(increased.circle.cx,360);
  assert.equal(increased.circle.cx-increased.circle.r,anchor.x);
  assert.equal(increased.circle.cy,650);
  const reduced=advanceScatteredAnchoredScale(state,{x:180,y:400});
  assert.equal(reduced.circle.r,60);
  assert.equal(reduced.circle.cx-reduced.circle.r,anchor.x);
  assert.equal(state.circle.r,120,'gesture is immutable and non-accumulating');
});

test('edge anchor preserves imported disconnected and holed ring bounds',()=>{
  const placement={cx:300,cy:650,r:100};
  const object={kind:'region',editCircle:placement,rings:[
    [{x:260,y:610},{x:420,y:610},{x:420,y:700},{x:260,y:700}],
    [{x:300,y:635},{x:340,y:635},{x:340,y:655},{x:300,y:655}],
    [{x:245,y:630},{x:252,y:630},{x:252,y:645},{x:245,y:645}]
  ]};
  const source=scatteredSelectionBounds(object);
  assert.equal(source.isCompound,true);
  const pivot={x:source.minX,y:(source.minY+source.maxY)/2};
  const scaled=anchoredScatteredCircle(placement,pivot,150);
  const after=scatteredSelectionBounds(object,scaled);
  assert.ok(Math.abs(after.minX-source.minX)<1e-9,
    'pin real imported bounding edge, not editCircle radius envelope');
  assert.ok(Math.abs((after.minY+after.maxY)/2-pivot.y)<1e-9,
    'actual vertical bounds midpoint remains fixed');
  assert.equal((after.maxX-after.minX)/(source.maxX-source.minX),1.5);
  assert.equal(object.rings.length,3,'cutout and island count unchanged');
  const existing={scatteredOverrides:[]};
  const override=scatteredMoveOverride(existing,0,scaled,
    {x:scaled.cx,y:scaled.cy});
  assert.equal(override.length,1);
  assert.ok(Math.abs(override[0].x-scaled.cx/600)<1e-6);
  assert.ok(Math.abs(override[0].y-scaled.cy/1300)<1e-6);
  assert.equal(override[0].radius,.25);
});

test('left-side grip pins opposite right edge and radius clamp preserves pivot',()=>{
  const circle={cx:300,cy:650,r:100},pivot={x:400,y:650};
  const state=beginScatteredAnchoredScale({circle,anchor:pivot,
    point:{x:100,y:400},gripX:80,anchorX:400});
  const enlarged=advanceScatteredAnchoredScale(state,{x:-220,y:400});
  assert.equal(enlarged.circle.r,200);
  assert.equal(enlarged.circle.cx+enlarged.circle.r,400);
  const clipped=advanceScatteredAnchoredScale(state,{x:-3000,y:400});
  assert.equal(clipped.circle.r,720);
  assert.equal(clipped.circle.cx+clipped.circle.r,400);
  assert.equal(anchoredScatteredCircle(circle,pivot,-100).r,6);
  assert.equal(anchoredScatteredCircle(circle,pivot,Infinity),null);
});

test('unreachable anchor cannot start; invalid pointer does not overwrite it',()=>{
  const circle={cx:200,cy:500,r:90},anchor={x:100,y:500};
  assert.equal(beginScatteredAnchoredScale({circle,anchor,point:{x:180,y:400},
    gripX:140,anchorX:128}),null);
  assert.equal(beginScatteredAnchoredScale({circle,anchor,point:{x:NaN,y:400},
    gripX:200,anchorX:100}),null);
  const state=beginScatteredAnchoredScale({circle,anchor,point:{x:180,y:400},
    gripX:200,anchorX:100});
  assert.equal(advanceScatteredAnchoredScale(state,{x:Infinity,y:400}),state);
  assert.equal(anchoredScatteredCircle(circle,{x:Infinity,y:2},200),null);
});

test('production UI freezes edge pivot on pointerdown and commits centre and size',()=>{
  const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../scattered-shapes.css',import.meta.url),'utf8');
  assert.match(source,/scatteredPivotButton\.setAttribute\('aria-pressed'/);
  assert.match(source,/scatteredScaleDrag=\{pointerId:event\.pointerId,index,circle:/);
  assert.match(source,/edge:!!anchored/);
  assert.match(source,/advanceScatteredAnchoredScale\(drag\.gesture,point\)/);
  assert.match(source,/scatteredScaleGrip\.style\.left=\(event\.clientX-surface\.left/);
  assert.match(source,/scatteredScaleGrip\.style\.top=\(event\.clientY-surface\.top/);
  assert.match(source,/drag\.current,\{x:drag\.current\.cx,y:drag\.current\.cy\}/);
  assert.match(css,/#scatteredDirectPivot\{[^}]*min-height:44px/);
});
