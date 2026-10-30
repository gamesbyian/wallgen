import test from 'node:test';
import assert from 'node:assert/strict';
import {vectorPathFromPolyline,normalizeVectorPath,deleteVectorNode,flattenVectorPath}
  from '../src/vector-path-commands.js';
import {createVectorEditSession,selectVectorEditNode,beginVectorEdit,
  previewVectorEdit,commitVectorEdit,undoVectorEdit,redoVectorEdit,cancelVectorEdit}
  from '../src/vector-path-edit-session.js';
const points=[[.1,.2],[.4,.5],[.7,.5],[.9,.8]];
test('remove an interior node with stable neighboring authored IDs and finite line result',()=>{
  const original=vectorPathFromPolyline(points);
  const next=deleteVectorNode(original,'n1');
  assert.ok(next);
  assert.deepEqual([next.start.id,...next.segments.map(s=>s.to.id)],['n0','n2','n3']);
  assert.deepEqual(next.segments[0],{kind:'line',to:{id:'n2',point:points[2]}});
  assert.equal(next.closed,false);
  assert.deepEqual(original.segments[0].to.point,points[1]);
});
test('open endpoint deletions preserve order, explicit open topology and remaining IDs',()=>{
  const original=vectorPathFromPolyline(points);
  const first=deleteVectorNode(original,'n0');
  const last=deleteVectorNode(original,'n3');
  assert.deepEqual([first.start.id,...first.segments.map(s=>s.to.id)],['n1','n2','n3']);
  assert.deepEqual([last.start.id,...last.segments.map(s=>s.to.id)],['n0','n1','n2']);
  assert.equal(first.closed,false);
  assert.equal(last.closed,false);
});
test('closed path can delete first and last nodes while maintaining a real seam',()=>{
  const original=vectorPathFromPolyline(points,{closed:true});
  const first=deleteVectorNode(original,'n0');
  const last=deleteVectorNode(original,'n3');
  assert.deepEqual([first.start.id,...first.segments.map(s=>s.to.id)],['n1','n2','n3']);
  assert.deepEqual([last.start.id,...last.segments.map(s=>s.to.id)],['n0','n1','n2']);
  assert.equal(first.closed,true);
  assert.equal(last.closed,true);
  assert.equal(first.closing.kind,'line');
  assert.equal(last.closing.kind,'line');
  assert.ok(flattenVectorPath(first).points.length>=3);
  assert.ok(flattenVectorPath(last).points.length>=3);
});
test('mixed cubic and line joins remain finite and preserve intentional topology',()=>{
  const p=normalizeVectorPath({space:'normalized-design',closed:false,
    start:{id:'a',point:[.2,.3]},
    segments:[
      {kind:'cubic',to:{id:'b',point:[.5,.6]},
        controlOut:[.3,.34],controlIn:[.45,.6]},
      {kind:'line',to:{id:'c',point:[.8,.8]}],
      {kind:'cubic',to:{id:'d',point:[.9,.9]},
        controlOut:[.82,.9],controlIn:[.88,.92]}],
    nodeModes:{}});
  const merged=deleteVectorNode(p,'b');
  assert.ok(merged);assert.equal(merged.segments.length,2);
  assert.equal(merged.segments[0].kind,'cubic');
  assert.deepEqual(merged.segments[0].controlOut,[.3,.34]);
  assert.equal(merged.segments[0].to.id,'c');
  assert.deepEqual(merged.segments[1],p.segments[2]);
  const flat=flattenVectorPath(merged);
  assert.ok(flat&&flat.points.every(x=>x.every(Number.isFinite)));
});
test('refuses deleting unknown nodes or leaving fewer than two authored nodes',()=>{
  const source=vectorPathFromPolyline([[.2,.2],[.8,.8]]);
  assert.equal(deleteVectorNode(source,'n0'),null);
  assert.equal(deleteVectorNode(source,'n1'),null);
  assert.equal(deleteVectorNode(source,'missing'),null);
  assert.equal(deleteVectorNode(null,'n0'),null);
});
test('delete through transaction is atomic with selection, Undo, redo and cancel',()=>{
  const source=vectorPathFromPolyline(points,{closed:true});
  const selected=selectVectorEditNode(createVectorEditSession(source),'n1');
  const begun=beginVectorEdit(selected,{kind:'delete',id:'n1'});
  const provisional=previewVectorEdit(begun);
  assert.deepEqual(provisional.path,source);
  assert.equal(provisional.selectedId,'n2');
  assert.equal(provisional.draft.segments.length,2);
  assert.equal(cancelVectorEdit(provisional).undo.length,0);
  const committed=commitVectorEdit(provisional);
  assert.equal(committed.undo.length,1);
  assert.equal(committed.path.segments.length,2);
  const undone=undoVectorEdit(committed);
  assert.deepEqual(undone.path,source);
  assert.equal(undone.selectedId,'n1');
  assert.deepEqual(redoVectorEdit(undone).path,committed.path);
});
