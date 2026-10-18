import test from 'node:test';
import assert from 'node:assert/strict';
import {contourBoundaryFrame,decorateInsetContour} from '../src/contour-decoration.js';
import {polygonInsetContours,pointInPolygon} from '../src/polygon-inset.js';

const rectangle=[
  {x:0,y:0},{x:160,y:0},{x:160,y:120},{x:0,y:120}
];
const close=(a,b,epsilon=1e-9)=>Math.abs(a-b)<=epsilon;
const element=(shape,overrides={})=>({
  shape,amplitude:.3,frequency:7,phase:29,stroke:'solid',
  ...overrides
});
const pointKey=p=>Math.round(p.x*10000)+','+Math.round(p.y*10000);
const contourAt=(inset=12,bounds)=>{
  const loops=polygonInsetContours(rectangle,inset,{resolution:.7,bounds});
  assert.equal(loops.length,1);
  return loops[0];
};
test('source boundary frame ignores polygon winding and starting vertex',()=>{
  const expected=contourBoundaryFrame(rectangle);
  for(const ring of [
    [...rectangle].reverse(),
    [...rectangle.slice(2),...rectangle.slice(0,2)],
    [...rectangle.slice(1),...rectangle.slice(0,1)].reverse(),
  ])assert.deepEqual(contourBoundaryFrame(ring),expected);
});

test('wave, zigzag and loop styles actually displace true inset geometry',()=>{
  const inset=12,frame=contourBoundaryFrame(rectangle),contour=contourAt(inset);
  const base=decorateInsetContour(contour,element('straight'),inset,frame);
  assert.deepEqual(base.points,contour.points);
  const wave=decorateInsetContour(contour,element('wave'),inset,frame);
  const zig=decorateInsetContour(contour,element('zigzag'),inset,frame);
  const loop=decorateInsetContour(contour,element('loop'),inset,frame);
  for(const styled of [wave,zig,loop]){
    assert.ok(styled.closed);
    const displacement=styled.points.map((p,i)=>
      Math.hypot(p.x-contour.points[i].x,p.y-contour.points[i].y));
    assert.ok(Math.max(...displacement)>1,'selected style must visibly move ink');
    assert.ok(styled.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
    assert.ok(styled.points.every(p=>pointInPolygon(p.x,p.y,rectangle)),
      'decorative stroke centreline must stay inside its owner polygon');
  }
  assert.notDeepEqual(wave.points,zig.points);
  assert.notDeepEqual(wave.points,loop.points);
  const muted=decorateInsetContour(contour,element('wave',{amplitude:0}),inset,frame);
  assert.deepEqual(muted.points,contour.points);
});

test('winding reversal does not change wave or loop placement',()=>{
  const contour=contourAt(),ringReverse=[...rectangle].reverse();
  for(const shape of ['wave','zigzag','loop']){
    const left=decorateInsetContour(contour,element(shape),12,contourBoundaryFrame(rectangle));
    const right=decorateInsetContour(contour,element(shape),12,contourBoundaryFrame(ringReverse));
    assert.deepEqual(left,right,shape);
  }
});

test('overlapping inset samples retain world phase when camera crops change',()=>{
  const whole=contourAt(12,{left:0,top:0,right:160,bottom:120});
  const part=contourAt(12,{left:-5,top:20,right:36,bottom:105});
  const frame=contourBoundaryFrame(rectangle);
  const styledWhole=decorateInsetContour(whole,element('wave'),12,frame);
  const styledPart=decorateInsetContour(part,element('wave'),12,frame);
  const lookup=new Map(whole.points.map((p,i)=>[pointKey(p),styledWhole.points[i]]));
  let checked=0;
  for(let i=0;i<part.points.length;i++){
    const p=part.points[i];
    if(p.x<3||p.x>35||p.y<29||p.y>96)continue;
    const match=lookup.get(pointKey(p));
    if(!match)continue;
    checked++;
    assert.ok(close(match.x,styledPart.points[i].x));
    assert.ok(close(match.y,styledPart.points[i].y));
  }
  assert.ok(checked>10,'compare overlapping camera-visible inset geometry');
});

test('zero interior clearance disables dangerous outward waves',()=>{
  const contour=contourAt(2);
  const style=decorateInsetContour(contour,element('loop',{amplitude:.45}),2,
    contourBoundaryFrame(rectangle),5);
  assert.deepEqual(style.points,contour.points);
});

test('multiple rings and malformed contour inputs stay finite',()=>{
  const inner=[
    {x:45,y:40},{x:75,y:40},{x:75,y:80},{x:45,y:80}
  ];
  const frame=contourBoundaryFrame([rectangle,inner]);
  assert.equal(frame.length,2);
  assert.equal(contourBoundaryFrame([]).length,0);
  const empty=decorateInsetContour({points:[],closed:false},element('wave'),8,frame);
  assert.deepEqual(empty.points,[]);
});
