import test from 'node:test';
import assert from 'node:assert/strict';
import {vectorPathFromPolyline,normalizeVectorPath} from '../src/vector-path-commands.js';
import {createVectorEditSession,selectVectorEditNode,setVectorEditLocked,
  beginVectorEdit,previewVectorEdit,cancelVectorEdit,
  commitVectorEdit,undoVectorEdit,redoVectorEdit} from '../src/vector-path-edit-session.js';
const source=vectorPathFromPolyline([[.2,.2],[.5,.5],[.8,.8]]);
const step=(s,id,point)=>commitVectorEdit(previewVectorEdit(
  beginVectorEdit(s,{kind:'node',id}),{point}));

test('starting, tapping and returning to source are no-ops without history',()=>{
  const a=selectVectorEditNode(createVectorEditSession(source),'n1');
  const begun=beginVectorEdit(a,{kind:'node',id:'n1'});
  assert.equal(begun.path,a.path);
  assert.equal(commitVectorEdit(begun).undo.length,0);
  const moved=previewVectorEdit(begun,{point:[.55,.53]});
  const reversed=previewVectorEdit(moved,{point:[.5,.5]});
  const done=commitVectorEdit(reversed);
  assert.equal(done.undo.length,0);
  assert.deepEqual(done.path,a.path);
});

test('many preview events derive from same source, one Undo for a gesture',()=>{
  const s0=selectVectorEditNode(createVectorEditSession(source),'n1');
  const s1=beginVectorEdit(s0,{kind:'node',id:'n1'});
  const intermediate=previewVectorEdit(s1,{point:[.51,.52]});
  const final=previewVectorEdit(intermediate,{point:[.56,.58]});
  assert.deepEqual(intermediate.draft.segments[0].to.point,[.51,.52]);
  assert.deepEqual(final.draft.segments[0].to.point,[.56,.58]);
  assert.deepEqual(final.path,source);
  const committed=commitVectorEdit(final);
  assert.equal(committed.undo.length,1);
  assert.deepEqual(committed.path.segments[0].to.point,[.56,.58]);
  const undone=undoVectorEdit(committed);
  assert.deepEqual(undone.path,source);
  assert.equal(undone.selectedId,'n1');
  assert.deepEqual(redoVectorEdit(undone).path,committed.path);
});

test('cancellation or lock activation restores source and never saves a partial curve',()=>{
  const s=beginVectorEdit(createVectorEditSession(source),{kind:'node',id:'n1'});
  const d=previewVectorEdit(s,{point:[.6,.6]});
  assert.deepEqual(cancelVectorEdit(d).path,source);
  const locked=setVectorEditLocked(d,true);
  assert.equal(locked.locked,true);assert.equal(locked.tx,null);
  assert.deepEqual(locked.path,source);assert.equal(locked.undo.length,0);
  assert.equal(beginVectorEdit(locked,{kind:'node',id:'n1'}),locked);
});

test('exact node insertion preserves previous identities and is reversible',()=>{
  const begun=beginVectorEdit(createVectorEditSession(source),
    {kind:'insert',segmentIndex:0,newId:'inserted'});
  const changed=previewVectorEdit(begun,{t:.4});
  assert.equal(changed.selectedId,'inserted');
  assert.equal(changed.draft.segments.length,3);
  const committed=commitVectorEdit(changed);
  assert.equal(committed.undo.length,1);
  assert.equal(committed.path.segments[0].to.id,'inserted');
  const undone=undoVectorEdit(committed);
  assert.equal(undone.path.segments.length,2);
  assert.equal(undone.selectedId,null);
});

test('invalid locations and operations do not mutate geometry or create Undo entries',()=>{
  const s=createVectorEditSession(source);
  assert.equal(previewVectorEdit(s,{point:[.9,.9]}),s);
  assert.equal(beginVectorEdit(s,{kind:'node',id:'bad'}),s);
  assert.equal(beginVectorEdit(s,{kind:'insert',segmentIndex:0,newId:'n1'}),s);
  const begun=beginVectorEdit(s,{kind:'node',id:'n1'});
  assert.equal(previewVectorEdit(begun,{point:[Infinity,0]}),begun);
  assert.equal(commitVectorEdit(begun).undo.length,0);
});

test('real handle and node-continuity edits are separate atomic transactions',()=>{
  const curve=normalizeVectorPath({space:'normalized-design',closed:false,
    start:{id:'n0',point:[.2,.2]},segments:[
      {kind:'cubic',to:{id:'n1',point:[.5,.5]},controlOut:[.3,.2],controlIn:[.4,.5]},
      {kind:'cubic',to:{id:'n2',point:[.8,.8]},controlOut:[.6,.5],controlIn:[.7,.8]}]});
  const s=createVectorEditSession(curve);
  const mode=commitVectorEdit(previewVectorEdit(
    beginVectorEdit(s,{kind:'mode',id:'n1'}),{mode:'mirrored'}));
  assert.equal(mode.undo.length,1);
  assert.equal(mode.path.nodeModes.n1,'mirrored');
  const move=commitVectorEdit(previewVectorEdit(beginVectorEdit(mode,
    {kind:'handle',id:'n1',side:'out'}),{point:[.6,.54]}));
  assert.equal(move.undo.length,2);
  assert.deepEqual(undoVectorEdit(move).path,mode.path);
});

test('bounded Undo evicts oldest entries and new commits invalidate redo',()=>{
  let s=createVectorEditSession(source,{maxUndo:2});
  s=step(s,'n1',[.51,.51]);s=step(s,'n1',[.52,.52]);s=step(s,'n1',[.53,.53]);
  assert.equal(s.undo.length,2);
  s=undoVectorEdit(s);assert.equal(s.redo.length,1);
  s=step(s,'n1',[.54,.54]);assert.equal(s.redo.length,0);
});

test('insertion transaction at a closed cubic seam is one reversible action',()=>{
  const closed=normalizeVectorPath({
    space:'normalized-design',closed:true,start:{id:'origin',point:[.2,.2]},
    segments:[{kind:'cubic',to:{id:'last',point:[.7,.7]},
      controlOut:[.25,.4],controlIn:[.65,.6]}],
    closing:{kind:'cubic',controlOut:[.8,.5],controlIn:[.1,.6]}
  });
  const original=createVectorEditSession(closed);
  const begun=beginVectorEdit(original,{kind:'insert',segmentIndex:1,newId:'seam'});
  assert.ok(begun.tx);
  const preview=previewVectorEdit(begun,{t:.5});
  assert.equal(preview.path,original.path);
  assert.equal(preview.draft.segments.length,2);
  assert.equal(preview.selectedId,'seam');
  const committed=commitVectorEdit(preview);
  assert.equal(committed.undo.length,1);
  assert.equal(committed.path.closed,true);
  assert.equal(committed.path.segments[1].to.id,'seam');
  const back=undoVectorEdit(committed);
  assert.deepEqual(back.path,closed);
  assert.deepEqual(redoVectorEdit(back).path,committed.path);
  assert.deepEqual(cancelVectorEdit(preview).path,closed);
});
