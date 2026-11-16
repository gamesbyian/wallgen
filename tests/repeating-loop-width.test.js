import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveScene} from '../src/model.js';
import {samplePath,pathPosition} from '../src/path-geometry.js';
import {stripeFillPath,visibleLoopCrossingRange} from '../src/renderer.js';
import {findPathCrossings} from '../src/crossing-order.js';
import {viewCamera} from '../src/view-camera.js';

const TAU=2*Math.PI;
// Extract the real union-of-cross-sections silhouette without requiring a
// browser canvas. This is the same polygon path used by production fills.
class PolygonPath {
  constructor(){this.polygons=[];this.points=[];}
  moveTo(x,y){this.points=[{x,y}];}
  lineTo(x,y){this.points.push({x,y});}
  closePath(){this.polygons.push(this.points);}
}
function contains(poly,{x,y}){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    if((a.y>y)!==(b.y>y) &&
      x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}
function crossingAngle(stripe){
  // For x=t-A*sin(t*2pi/P), a centred lobe self-intersects where
  // theta = (2pi*A/P)*sin(theta). The nonzero root closes the loop.
  const k=TAU*stripe.loopXAmplitude/stripe.loopPeriod;
  assert.ok(k>1.3,'loop centreline must genuinely reverse');
  let lo=.00001,hi=Math.PI;
  for(let i=0;i<48;i++){
    const theta=(lo+hi)/2;
    if(k*Math.sin(theta)>theta)lo=theta;else hi=theta;
  }
  return (lo+hi)/2;
}
function assertVisibleHole(scene,stripe){
  const pitch=stripe.loopPeriod;
  const theta=crossingAngle(stripe);
  const centreStation=-(stripe.sharedPhase??0)*pitch/TAU;
  const sample=angle=>samplePath(stripe,centreStation+angle*pitch/TAU,
    scene.extent);
  const loop=Array.from({length:121},(_,i)=>sample(-theta+2*theta*i/120));
  // This is inside the actual centreline enclosure, not the background
  // outside the neighbouring loop or an outline-tracing artifact.
  const insidePoint={x:centreStation,
    y:stripe.center+stripe.loopAmplitude*(1+Math.cos(theta))/2};
  assert.ok(contains(loop,insidePoint),
    'probe must lie inside the mathematically closed centreline loop');
  const interval={...stripe,segmentStart:centreStation-pitch*1.5,
    segmentEnd:centreStation+pitch*1.5};
  const polygons=stripeFillPath(interval,scene.extent,scene,PolygonPath).polygons;
  assert.ok(polygons.length>60);
  assert.ok(!polygons.some(poly=>contains(poly,insidePoint)),
    'the actual thick ribbon union must leave negative space inside its loop');
}

test('the reported design retains visibly open loops at all aspect values and stripe widths',()=>{
  // Exact layout/geometry control values from the uploaded failing design.
  const base={seed:'12su8dt-e72gl1',family:'studio',structure:'paths',
    geometry:'loops',orientation:'horizontal',construction:'ribbon',
    spread:65,shapeFrequency:34,shapeDepth:32,chaos:10,individuality:53,
    stripeWidth:53,geometrySafety:true,material:'none',textureDisplacement:0,
    motif:'solid'};
  for(const loopAspect of [0,50,100]){
    for(const stripeWidth of [0,53,100]){
      const scene=resolveScene({...base,loopAspect,stripeWidth});
      const widest=Math.max(...scene.stripes.map(s=>s.width));
      for(const stripe of scene.stripes){
        assert.equal(stripe.loopPeriod,scene.stripes[0].loopPeriod,
          'all colours must share a physical loop pitch');
        assert.equal(stripe.loopXAmplitude,scene.stripes[0].loopXAmplitude);
        assert.ok(stripe.loopAmplitude>widest*.5,
          'the inner clearance must account for the widest stripe');
      }
      assertVisibleHole(scene,scene.stripes[3]);
      const stripe=scene.stripes[3],pitch=stripe.loopPeriod;
      const hits=findPathCrossings({...stripe,
        segmentStart:-pitch*1.6,segmentEnd:pitch*1.6},
        scene.extent,samplePath,{step:Math.min(4,pitch/18),maxCrossings:12});
      assert.ok(hits.length>=2,
        'the filled loops require real source-traversal crossings');
    }
  }
});
test('shape depth stays effective and aspect changes the actual loop proportion',()=>{
  const input={seed:'repeating-shape-controls',geometry:'loops',
    geometrySafety:true,shapeFrequency:34,spread:65,stripeWidth:53};
  const heights=[0,50,100].map(shapeDepth=>
    resolveScene({...input,shapeDepth}).stripes[3].loopAmplitude);
  assert.ok(heights[0]<heights[1]&&heights[1]<heights[2],
    'Shape Depth may not silently saturate behind the safe clearance');
  const ratios=[0,50,100].map(loopAspect=>{
    const st=resolveScene({...input,loopAspect}).stripes[3];
    return st.loopXAmplitude/st.loopAmplitude;
  });
  assert.ok(ratios[0]<ratios[1]&&ratios[1]<ratios[2]);
});
test('unrestricted repeating-loop geometry retains the old wave/overlap freedom',()=>{
  const input={seed:'free-loops-unchanged',geometry:'loops',
    geometrySafety:false,loopAspect:0,shapeDepth:32,shapeFrequency:34};
  const stripe=resolveScene(input).stripes[3];
  assert.equal(stripe.loopXAmplitude,undefined);
  assert.equal(stripe.loopPeriod,200*Math.pow(8/200,34/100));
  const x=37,theta=x/stripe.loopPeriod*TAU+(stripe.sharedPhase??0);
  const originalX=x-(stripe.loopAmplitude*2.1*Math.pow(2,(0-50)/35))*
    Math.sin(theta);
  assert.equal(pathPosition(stripe,x,2000).x,originalX);
});
test('loop crossing search follows camera pan, zoom, rotation, and mirroring',()=>{
  for(const [orientation,viewZoom,viewPanX,viewPanY,mirrorHorizontal] of [
    ['horizontal',1,0,0,false],['vertical',.6,20,-30,false],
    ['diagonal',1.6,-35,25,true]]){
    const scene=resolveScene({seed:'visible-loop-crossings',
      geometry:'loops',structure:'paths',geometrySafety:true,
      shapeFrequency:70,shapeDepth:55,stripeWidth:45,
      orientation,viewZoom,viewPanX,viewPanY,mirrorHorizontal});
    const bounds=viewCamera(600,1300,viewZoom,
      {panX:viewPanX,panY:viewPanY}).viewBounds;
    scene.renderBounds=bounds;
    const stripe=scene.stripes[3];
    const visible=visibleLoopCrossingRange(scene,stripe);
    assert.ok(visible.start<visible.end);
    assert.ok(visible.step<=9);
    const hits=findPathCrossings(stripe,scene.extent,samplePath,visible);
    const co=Math.cos(scene.angle),si=Math.sin(scene.angle);
    // A crossing near the wallpaper centre is included in every orientation,
    // while the old first-32-from-offscreen scan can skip it.
    const centreStation=(bounds.left+bounds.right)/2;
    const nominal=orientation==='horizontal'?
      centreStation-scene.centerX:0;
    assert.ok(hits.some(h=>Math.abs(h.x-nominal)<stripe.loopPeriod*3),
      'visible crossings must not be exhausted by offscreen repairs');
    assert.ok(Number.isFinite(co+si));
  }
});
