import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewCoordinator,createThumbnailQueue,exportWallpaperInWorker,closeFrame} from '../src/render-coordinator.js';

class FakeWorker{
  constructor(){this.messages=[];this.terminated=false;}
  postMessage(msg){this.messages.push(msg);}
  emit(data){this.onmessage?.({data});}
  terminate(){this.terminated=true;}
}
function bitmap(){
  return {closed:false,close(){this.closed=true;}};
}
const ready={type:'ready',protocol:1};

test('latest-only preview discards queued intermediate changes and closes stale image resources',()=>{
  const worker=new FakeWorker(),delivered=[];
  const scheduler=createPreviewCoordinator({
    workerFactory:()=>worker,canUseWorker:true,
    onFrame:msg=>delivered.push(msg.key),
  });
  scheduler.request({seed:'first'},'a',200,400);
  scheduler.request({seed:'second'},'b',200,400);
  scheduler.request({seed:'third'},'c',200,400);
  assert.equal(worker.messages.length,0,'do not dispatch before worker is ready');
  worker.emit(ready);
  assert.deepEqual(worker.messages.map(x=>x.key),['c']);
  const active=worker.messages[0].id;
  scheduler.request({seed:'fourth'},'d',200,400);
  scheduler.request({seed:'fifth'},'e',200,400);
  const stale={type:'frame',id:active,key:'c',background:bitmap(),ink:bitmap()};
  worker.emit(stale);
  assert.ok(stale.background.closed&&stale.ink.closed);
  assert.deepEqual(worker.messages.map(x=>x.key),['c','e']);
  const finalId=worker.messages[1].id;
  worker.emit({type:'frame',id:finalId,key:'e',background:bitmap(),ink:bitmap()});
  assert.deepEqual(delivered,['e']);
  assert.equal(scheduler.status.staleCount,1);
  scheduler.dispose();
  assert.ok(worker.terminated);
});

test('reusing an existing cached composition invalidates in-flight worker frames',()=>{
  const worker=new FakeWorker(),delivered=[];
  const scheduler=createPreviewCoordinator({
    workerFactory:()=>worker,canUseWorker:true,onFrame:x=>delivered.push(x.key)
  });
  worker.emit(ready);
  scheduler.request({},'scene-a',200,400);
  const active=worker.messages[0].id;
  scheduler.invalidate();
  const old={type:'frame',id:active,key:'scene-a',background:bitmap(),ink:bitmap()};
  worker.emit(old);
  assert.ok(old.ink.closed&&old.background.closed);
  assert.deepEqual(delivered,[]);
  scheduler.dispose();
});

test('worker startup and rendering errors invoke fallback once and terminate',()=>{
  const worker=new FakeWorker(),errors=[];
  const scheduler=createPreviewCoordinator({
    workerFactory:()=>worker,canUseWorker:true,onFailure:x=>errors.push(x)
  });
  worker.emit(ready);scheduler.request({},'bad',3,4);
  worker.emit({type:'error',id:worker.messages[0].id,error:'device context lost'});
  assert.deepEqual(errors,['device context lost']);
  assert.ok(worker.terminated);
  assert.equal(scheduler.enabled,false);
  assert.equal(scheduler.request({},'again',3,4),false);
  scheduler.dispose();
});

test('unsupported workers and missing APIs do not attempt to dispatch',()=>{
  const offline=createPreviewCoordinator({canUseWorker:false});
  assert.equal(offline.enabled,false);
  assert.equal(offline.request({},'no',2,2),false);
  offline.dispose();
  const worker=new FakeWorker(),failures=[];
  createPreviewCoordinator({workerFactory:()=>worker,canUseWorker:true,
    onFailure:m=>failures.push(m)});
  worker.emit({type:'unsupported',error:'no Path2D'});
  assert.deepEqual(failures,['no Path2D']);
});

test('worker export isolates request and cleans up after successful PNG',async()=>{
  const worker=new FakeWorker();
  const result=exportWallpaperInWorker({
    recipe:{seed:'snapshot'},width:3024,height:6552,
    canUseWorker:true,workerFactory:()=>worker
  });
  worker.emit(ready);
  assert.deepEqual(worker.messages[0],{
    type:'export',id:1,recipe:{seed:'snapshot'},width:3024,height:6552
  });
  const bytes=new Blob(['png'],{type:'image/png'});
  worker.emit({type:'exported',id:1,blob:bytes});
  assert.equal(await result,bytes);
  assert.ok(worker.terminated);
});

test('export surfaces clear crash and unsupported fallback errors',async()=>{
  const worker=new FakeWorker();
  const pending=exportWallpaperInWorker({recipe:{},width:10,height:20,
    canUseWorker:true,workerFactory:()=>worker});
  worker.emit(ready);worker.emit({type:'error',id:1,error:'out of memory'});
  await assert.rejects(pending,/out of memory/);
  assert.ok(worker.terminated);
  await assert.rejects(exportWallpaperInWorker({recipe:{},width:1,height:2,
    canUseWorker:false}),/unavailable/);
});

test('frame cleanup ignores absent, untransferable and already closed resources',()=>{
  const actual={frame:bitmap(),ink:bitmap(),background:bitmap()};
  closeFrame(actual);
  assert.ok(actual.frame.closed&&actual.ink.closed&&actual.background.closed);
  assert.doesNotThrow(()=>closeFrame({ink:{close(){throw Error('already released');}}}));
});

test('thumbnail worker preserves FIFO recipe identity and bitmap ownership',async()=>{
  const worker=new FakeWorker();
  const queue=createThumbnailQueue({canUseWorker:true,workerFactory:()=>worker});
  const first=queue.request({seed:'a'},120,260);
  const second=queue.request({seed:'b'},120,260);
  assert.equal(worker.messages.length,0);
  worker.emit(ready);
  assert.equal(worker.messages[0].recipe.seed,'a');
  const firstBitmap=bitmap();
  worker.emit({type:'thumbnail',id:worker.messages[0].id,frame:firstBitmap});
  assert.equal(await first,firstBitmap);
  assert.equal(worker.messages[1].recipe.seed,'b');
  const secondBitmap=bitmap();
  worker.emit({type:'thumbnail',id:worker.messages[1].id,frame:secondBitmap});
  assert.equal(await second,secondBitmap);
  assert.equal(queue.pending,0);
  queue.dispose();
  assert.ok(worker.terminated);
});

test('thumbnail worker failures reject current and queued snapshots without swapping their identities',async()=>{
  const worker=new FakeWorker();
  const queue=createThumbnailQueue({canUseWorker:true,workerFactory:()=>worker});
  const first=queue.request({seed:'one'},80,170);
  const second=queue.request({seed:'two'},80,170);
  worker.emit(ready);
  worker.emit({type:'error',id:worker.messages[0].id,error:'thumbnail context lost'});
  await assert.rejects(first,/thumbnail context lost/);
  await assert.rejects(second,/thumbnail context lost/);
  assert.equal(queue.enabled,false);
  queue.dispose();
});

test('unknown frame during an active preview never frees the worker slot',()=>{
  const worker=new FakeWorker(),delivered=[];
  const scheduler=createPreviewCoordinator({canUseWorker:true,
    workerFactory:()=>worker,onFrame:message=>delivered.push(message.key)});
  worker.emit(ready);
  scheduler.request({},'active',180,390);
  scheduler.request({},'latest',180,390);
  const stray={type:'frame',id:987654,key:'stray',frame:bitmap()};
  worker.emit(stray);
  assert.equal(stray.frame.closed,true,'orphaned bitmap must be freed');
  assert.equal(worker.messages.length,1,'stray frame cannot start parallel work');
  assert.equal(scheduler.status.active,true);
  assert.equal(scheduler.status.pending,true);
  worker.emit({type:'frame',id:worker.messages[0].id,key:'active',frame:bitmap()});
  assert.equal(worker.messages.length,2,'real active completion starts newest job');
  worker.emit({type:'frame',id:worker.messages[1].id,key:'latest',frame:bitmap()});
  assert.deepEqual(delivered,['latest']);
  assert.equal(scheduler.status.staleCount,2);
  scheduler.dispose();
});

test('interactive preview is visible while the same-recipe settled frame waits',()=>{
  const worker=new FakeWorker(),delivered=[];
  const scheduler=createPreviewCoordinator({canUseWorker:true,
    workerFactory:()=>worker,onFrame:message=>delivered.push(message)});
  worker.emit(ready);
  const recipe={seed:'new'};
  scheduler.request(recipe,'new',180,390,{quality:'interactive'});
  const interactive=worker.messages[0];
  assert.equal(interactive.quality,'interactive');
  // Simulates the 170 ms timer firing *before* the provisional paint returns.
  scheduler.request(recipe,'new',290,629,{quality:'settled'});
  const provisional={type:'frame',id:interactive.id,key:'new',
    quality:'interactive',frame:bitmap()};
  worker.emit(provisional);
  assert.deepEqual(delivered,[provisional],
    'useful provisional frame must not be discarded just for a queued upgrade');
  assert.equal(worker.messages[1].quality,'settled');
  assert.equal(worker.messages[1].width,290);
  assert.equal(worker.messages[1].height,629);
  const final={type:'frame',id:worker.messages[1].id,key:'new',
    quality:'settled',ink:bitmap(),background:bitmap()};
  worker.emit(final);
  assert.deepEqual(delivered,[provisional,final]);
  assert.equal(scheduler.status.staleCount,0);
  scheduler.dispose();
});

test('interactive frame from a replaced design cannot flash even with a matching art key',()=>{
  const worker=new FakeWorker(),delivered=[];
  const scheduler=createPreviewCoordinator({canUseWorker:true,
    workerFactory:()=>worker,onFrame:message=>delivered.push(message)});
  worker.emit(ready);
  scheduler.request({seed:'a'},'same-art',180,390,{quality:'interactive'});
  const id=worker.messages[0].id;
  // A new canonical recipe object can represent a camera/compositor edit with
  // the same art key. This cannot revive the old provisional frame.
  scheduler.request({seed:'a',viewPanX:2},'same-art',290,629,{quality:'settled'});
  const stale={type:'frame',id,key:'same-art',quality:'interactive',frame:bitmap()};
  worker.emit(stale);
  assert.equal(stale.frame.closed,true);
  assert.deepEqual(delivered,[]);
  worker.emit({type:'frame',id:worker.messages[1].id,key:'same-art',
    quality:'settled',ink:bitmap(),background:bitmap()});
  assert.equal(delivered.length,1);
  scheduler.dispose();
});

test('equivalent re-normalized recipe still presents its provisional frame before settlement',()=>{
  const worker=new FakeWorker(),seen=[];
  const scheduler=createPreviewCoordinator({canUseWorker:true,
    workerFactory:()=>worker,onFrame:message=>seen.push(message.quality)});
  worker.emit(ready);
  const source={seed:'normalized-twice',positionX:0,
    textOverlays:[{id:'a',text:'ROYGBIV'}]};
  scheduler.request(source,'same-render',180,390,{quality:'interactive'});
  const interactiveId=worker.messages[0].id;
  // The UI may replace its canonical recipe with a deep-equal object between
  // the first pass and the 170 ms exact upgrade. This must remain visible.
  const equivalent=JSON.parse(JSON.stringify(source));
  assert.notEqual(source,equivalent);
  scheduler.request(equivalent,'same-render',290,629,{quality:'settled'});
  worker.emit({type:'frame',id:interactiveId,key:'same-render',
    quality:'interactive',frame:bitmap()});
  assert.deepEqual(seen,['interactive']);
  worker.emit({type:'frame',id:worker.messages[1].id,key:'same-render',
    quality:'settled',ink:bitmap(),background:bitmap()});
  assert.deepEqual(seen,['interactive','settled']);
  scheduler.dispose();
});
