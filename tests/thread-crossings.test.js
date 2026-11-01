import test from 'node:test';
import assert from 'node:assert/strict';
import {threadCrossingGraph,threadCrossingsInRange} from '../src/thread-crossings.js';
import {resolveScene} from '../src/model.js';
import {samplePath} from '../src/path-geometry.js';

const stitch=(id,ax,ay,bx,by,{owner='shape-1',course=id,sourceIndex=1,
  station=10,width=2}={})=>({
  id,owner,course,sourceIndex,station,width,
  start:{x:ax,y:ay},end:{x:bx,y:by}
});

test('only true transverse original stitch intersections produce source-ordered top/bottom',()=>{
  const back=stitch('under',0,0,10,10,{course:'red-thread',station:12});
  const front=stitch('over',0,10,10,0,{course:'blue-thread',station:30});
  const graph=threadCrossingGraph([back,front]);
  assert.deepEqual(graph,[{
    x:5,y:5,belowId:'under',aboveId:'over',belowIndex:0,aboveIndex:1,
    belowStation:12,aboveStation:30,belowWidth:2,aboveWidth:2,
    owner:'shape-1'
  }]);
  const reversed=threadCrossingGraph([front,back]);
  assert.equal(reversed[0].aboveId,'under');
  assert.equal(reversed[0].belowId,'over');
  assert.deepEqual([reversed[0].x,reversed[0].y],[5,5]);
});

test('thread topology refuses fabricated contact at near misses, parallel rows, endpoints or other shapes',()=>{
  const baseline=stitch('a',0,0,10,10);
  for(const next of [
    stitch('near',0,11,4,7),
    stitch('parallel',0,1,10,11),
    stitch('endpoint',10,10,20,0),
    stitch('foreign',0,10,10,0,{owner:'other-shape'})
  ])assert.deepEqual(threadCrossingGraph([baseline,next]),[],next.id);
  const adjacent=stitch('neighbor',0,10,10,0,{course:'a',sourceIndex:2});
  assert.deepEqual(threadCrossingGraph([baseline,adjacent]),[],
    'adjacent sections of one original yarn do not cast contact shadows');
  const nonadjacent={...adjacent,sourceIndex:5};
  assert.equal(threadCrossingGraph([baseline,nonadjacent]).length,1);
});

test('a cropped branch selects the SAME crossing graph from original world stations',()=>{
  const objects=[
    stitch('first',0,0,10,10,{station:-75}),
    stitch('second',0,10,10,0,{station:-12}),
    stitch('third',7,0,7,10,{station:24}),
    stitch('last',4,0,4,10,{station:76})
  ];
  const whole=threadCrossingGraph(objects);
  assert.ok(whole.length>2);
  const crop=threadCrossingsInRange(whole,{start:0,end:35});
  assert.deepEqual(crop,whole.filter(e=>e.aboveStation>=0&&e.aboveStation<=35));
  assert.ok(crop.length>0&&crop.length<whole.length);
  assert.deepEqual(threadCrossingsInRange(whole,{start:35,end:0}),[]);
  assert.deepEqual(threadCrossingsInRange(whole,null),whole);
});

test('authored figure-eight stations are compatible with the real production path sampler',()=>{
  const scene=resolveScene({seed:'real-thread-crossing-world',
    structure:'paths',geometry:'drawn',construction:'ribbon',motif:'solid',
    customPath:[[.2,.2],[.8,.8],[.2,.8],[.8,.2]]});
  const stripe=scene.stripes[3],extent=scene.extent;
  const count=120;
  const points=Array.from({length:count+1},(_,i)=>
    samplePath(stripe,-extent+2*extent*i/count,extent));
  const segments=[];
  for(let i=0;i<count;i++)segments.push(stitch('source-'+i,
    points[i].x,points[i].y,points[i+1].x,points[i+1].y,
    {course:'same-source-loop',sourceIndex:i,
      station:-extent+(i+.5)*2*extent/count,width:2}));
  const hits=threadCrossingGraph(segments);
  assert.ok(hits.length>0,'original user-drawn figure-eight ought to have genuine self-crossings');
  for(const hit of hits){
    assert.ok(hit.aboveIndex>hit.belowIndex);
    assert.equal(hit.owner,'shape-1');
    assert.ok(Math.abs(hit.aboveStation-hit.belowStation)>1);
  }
});

test('unbounded or unsafe geometry is refused instead of hanging or truncating crossings',()=>{
  const a=stitch('a',0,0,10,10);
  const broken=[
    {...a,width:0}, {...a,width:Infinity},
    {...a,start:{x:NaN,y:0}}, {...a,station:Infinity},
    {...a,sourceIndex:1.1}, {...a,start:{x:1e20,y:0},end:{x:1e20+1e8,y:10}}
  ];
  for(const item of broken)
    assert.throws(()=>threadCrossingGraph([item]),RangeError);
  assert.throws(()=>threadCrossingGraph(new Array(6001).fill(a)),RangeError);
  assert.throws(()=>threadCrossingGraph([a],{cellSize:0}),RangeError);
  const dense=Array.from({length:550},(_,i)=>stitch('stitch-'+i,
    -5,(i%2)*10-5,5,(i%2)*(-10)+5,
    {course:'cross-'+i,sourceIndex:i,station:i}));
  assert.throws(()=>threadCrossingGraph(dense),RangeError,
    'deliberately pathological all-to-all crossing count must be bounded');
});
