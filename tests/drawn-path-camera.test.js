import test from 'node:test';
import assert from 'node:assert/strict';
import {drawnPathViewportOffset} from '../src/draw-path-ui.js';
import {viewCamera} from '../src/view-camera.js';
import {DESIGN_WIDTH,DESIGN_HEIGHT} from '../src/model.js';

// The overlay point must coincide with the renderer's actual world-to-pixel
// transform. Composition nudging is post-camera, while view Pan is pre-scale.
test('saved drawn anchor shares renderer viewport Pan, zoom and composition position',()=>{
  const size=[600,1300];
  for(const recipe of [
    {viewZoom:1,viewPanX:0,viewPanY:0,positionX:0,positionY:0},
    {viewZoom:1.2,viewPanX:15,viewPanY:-10,positionX:5,positionY:-4},
    {viewZoom:2.5,viewPanX:-50,viewPanY:50,positionX:-30,positionY:30},
    {viewZoom:.5,viewPanX:38,viewPanY:-20,positionX:12,positionY:6}
  ]){
    const camera=viewCamera(...size,recipe.viewZoom,{
      panX:recipe.viewPanX,panY:recipe.viewPanY});
    const [px,py]=drawnPathViewportOffset(recipe,true);
    for(const point of [[.5,.5],[.22,.77],[1.2,-.17]]){
      const projectedX=size[0]*(.5+(point[0]-.5)*recipe.viewZoom+px);
      const projectedY=size[1]*(.5+(point[1]-.5)*recipe.viewZoom+py);
      const rendererX=point[0]*DESIGN_WIDTH*camera.scaleX+
        camera.offsetX+size[0]*recipe.positionX/100;
      const rendererY=point[1]*DESIGN_HEIGHT*camera.scaleY+
        camera.offsetY+size[1]*recipe.positionY/100;
      assert.ok(Math.abs(projectedX-rendererX)<1e-7,
        'X anchor follows renderer at '+JSON.stringify(recipe));
      assert.ok(Math.abs(projectedY-rendererY)<1e-7,
        'Y anchor follows renderer at '+JSON.stringify(recipe));
      // The event->point inverse uses the same pan offset.
      assert.ok(Math.abs(.5+(projectedX/size[0]-.5-px)/recipe.viewZoom-point[0])<1e-7);
      assert.ok(Math.abs(.5+(projectedY/size[1]-.5-py)/recipe.viewZoom-point[1])<1e-7);
    }
  }
});

test('new strokes follow view Pan but not the generated wallpaper composition nudge',()=>{
  const recipe={viewZoom:1.5,viewPanX:20,viewPanY:-8,
    positionX:25,positionY:-22};
  const saved=drawnPathViewportOffset(recipe,true);
  const fresh=drawnPathViewportOffset(recipe,false);
  assert.deepEqual(fresh,[-.3,.12]);
  assert.ok(Math.abs(saved[0]+.05)<1e-10);
  assert.ok(Math.abs(saved[1]+.1)<1e-10);
});

test('centered camera retains original drawn-path overlay mapping',()=>{
  assert.deepEqual(drawnPathViewportOffset({
    viewZoom:1,viewPanX:0,viewPanY:0,positionX:6,positionY:-3},true),
    [.06,-.03]);
  assert.deepEqual(drawnPathViewportOffset({
    viewZoom:1,viewPanX:0,viewPanY:0,positionX:6,positionY:-3},false),
    [0,0]);
});
