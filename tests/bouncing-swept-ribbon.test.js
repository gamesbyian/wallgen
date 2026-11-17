import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {samplePath,ribbonEdge,bouncingPitch,widthAt} from '../src/path-geometry.js';
import {stripeFillPath} from '../src/renderer.js';

// Test the actual multi-subpath fill geometry without a browser dependency.
// Both polygons and circles are recorded as positively wound union members.
class RecordingPath {
  constructor(){this.shapes=[];this.current=[];}
  moveTo(x,y){this.current=[{x,y}];}
  lineTo(x,y){this.current.push({x,y});}
  arc(x,y,r){this.shapes.push({circle:{x,y,r}});}
  closePath(){
    if(this.current.length>=3)this.shapes.push({points:this.current});
    this.current=[];
  }
  contains(p){
    return this.shapes.some(({points,circle})=>{
      if(circle)return Math.hypot(p.x-circle.x,p.y-circle.y)<=circle.r+1e-6;
      let inside=false;
      for(let i=0,j=points.length-1;i<points.length;j=i++){
        const a=points[i],b=points[j];
        if((a.y>p.y)!==(b.y>p.y)&&
          p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
      }
      return inside;
    });
  }
}
function make(overrides={}){
  return resolveScene(normalizeRecipe({
    seed:'bouncing-sweep-regression',structure:'paths',geometry:'scalloped',
    orientation:'vertical',construction:'ribbon',individuality:0,
    chaos:0,shapeFrequency:42,shapeDepth:79,startTaper:0,endTaper:0,
    stripeEdgeStyle:'straight',material:'none',...overrides
  }));
}

test('narrow arch joins have a curvature radius far below normal stripe width',()=>{
  const frequency=42,height=79;
  const pitch=bouncingPitch(frequency);
  const stripe=make({shapeFrequency:frequency,shapeDepth:height}).stripes[3];
  const h=.02;
  const a=samplePath(stripe,-h,600),b=samplePath(stripe,0,600),
    c=samplePath(stripe,h,600);
  const dy=(c.y-a.y)/(2*h),ddy=(c.y-2*b.y+a.y)/(h*h);
  const radius=Math.pow(1+dy*dy,1.5)/Math.abs(ddy);
  assert.ok(radius>0&&radius<1,
    'a smooth centerline can still have a sub-unit curvature radius');
  assert.ok(pitch>180&&pitch<260,'frequency 42 remains the existing arc pitch');
});

test('thick, thin and medium swept arches have no gaps at sharp contacts',()=>{
  for(const frequency of [10,42,75,95])
    for(const height of [30,79,100])
      for(const width of [2,16,64]){
        const scene=make({shapeFrequency:frequency,shapeDepth:height});
        const pitch=bouncingPitch(frequency);
        const stripe={...scene.stripes[3],width,
          segmentStart:-pitch,segmentEnd:pitch};
        const path=stripeFillPath(stripe,scene.extent,scene,RecordingPath);
        assert.ok(path.shapes.length>100);
        for(const t of [-1,-.01,-.003,0,.003,.01,1]){
          const x=t*pitch,p=samplePath(stripe,x,scene.extent);
          const half=widthAt(stripe,x,scene.extent)/2;
          for(const ratio of [-.72,-.4,0,.4,.72]){
            const probe={x:p.x+p.nx*half*ratio,
              y:p.y+p.ny*half*ratio};
            assert.ok(path.contains(probe),
              `missing swept stripe interior at f=${frequency} h=${height} w=${width} x=${x} ratio=${ratio}`);
          }
        }
        for(const shape of path.shapes){
          if(!shape.points)continue;
          const signed=shape.points.reduce((sum,p,i)=>{
            const q=shape.points[(i+1)%shape.points.length];
            return sum+p.x*q.y-q.x*p.y;
          },0);
          assert.ok(signed>0,'all cross-section hulls must share winding');
        }
      }
});

test('taper and asymmetrically decorated ribbon edges retain local offsets',()=>{
  for(const edgeStyle of ['straight','wavy','scalloped','pinked','stepped']){
    const scene=make({stripeEdgeStyle:edgeStyle,stripeScallopForm:'edge-only',
      stripeEdgeDepth:70,stripeEdgeSize:42,stripeEdgePhase:0,
      stripeEdgePhaseB:50,startTaper:60,endTaper:85});
    const stripe={...scene.stripes[3],width:36,
      segmentStart:-200,segmentEnd:200};
    const path=stripeFillPath(stripe,scene.extent,scene,RecordingPath);
    assert.ok(path.shapes.length>80);
    for(const station of [-180,-100,-25,0,35,115,180]){
      const negative=ribbonEdge(stripe,station,scene.extent,-1);
      const positive=ribbonEdge(stripe,station,scene.extent,1);
      const center={x:(negative.x+positive.x)/2,y:(negative.y+positive.y)/2};
      assert.ok(path.contains(center),
        `missing physical cross-section at ${station} for ${edgeStyle}`);
    }
  }
});

test('swept renderer never mutates the arched centerline or its phase',()=>{
  const scene=make({stripeEdgeAlignment:'staggered',individuality:70});
  for(const stripe of scene.stripes){
    const before=[-100,-20,0,20,100].map(x=>samplePath(stripe,x,scene.extent));
    stripeFillPath({...stripe,segmentStart:-250,segmentEnd:250},
      scene.extent,scene,RecordingPath);
    const after=[-100,-20,0,20,100].map(x=>samplePath(stripe,x,scene.extent));
    assert.deepEqual(after,before);
  }
});
