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
