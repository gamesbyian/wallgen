import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeVectorPath} from '../src/vector-path-commands.js';
import {vectorNodeTargets} from '../src/vector-node-hit.js';
import {vectorKeyboardCommand} from '../src/vector-keyboard-precision.js';
import {snapVectorNode} from '../src/vector-node-snap.js';
import {createVectorEditSession,selectVectorEditNode,beginVectorEdit,
  previewVectorEdit,commitVectorEdit,undoVectorEdit,cancelVectorEdit} from '../src/vector-path-edit-session.js';

const source=normalizeVectorPath({space:'normalized-design',closed:false,
  start:{id:'a',point:[.1,.2]},segments:[
    {kind:'cubic',to:{id:'b',point:[.4,.4]},controlOut:[.2,.25],controlIn:[.36,.36]},
    {kind:'cubic',to:{id:'c',point:[.7,.7]},controlOut:[.5,.45],controlIn:[.64,.65]}],
  nodeModes:{}});

test('grip/snap, keyboard handle control and deletion share one authoritative Undo graph',()=>{
  let state=createVectorEditSession(source);
  for(const id of ['a','b']){
    const next=vectorKeyboardCommand(state.path,state.selectedId,{key:']'});
    assert.deepEqual(next,{kind:'select',id});
    state=selectVectorEditNode(state,next.id);
  }
  const handle=vectorKeyboardCommand(state.path,'b',{key:'ArrowRight',altKey:true});
  assert.equal(handle.kind,'handle');
  assert.equal(handle.side,'out');
  state=commitVectorEdit(previewVectorEdit(beginVectorEdit(state,handle),{
    point:handle.point}));
  assert.equal(state.undo.length,1);
  assert.notDeepEqual(state.path.segments[1].controlOut,source.segments[1].controlOut);

  const other=vectorNodeTargets(state.path).nodes.filter(n=>n.id!=='b');
  // Screen-space acquisition maps back to the exact original design X.
  const guided=snapVectorNode([.696,.4],other,{enabled:true,axis:'x',
    project:p=>[p[0]*400,p[1]*700]});
  assert.equal(guided.locks.x.id,'c');
  assert.deepEqual(guided.point,[.7,.4]);
  state=commitVectorEdit(previewVectorEdit(beginVectorEdit(state,{kind:'node',id:'b'}),{
    point:guided.point}));
  assert.equal(state.undo.length,2);
  assert.equal(state.path.segments[0].to.point[0],.7);

  state=commitVectorEdit(previewVectorEdit(beginVectorEdit(state,{kind:'delete',id:'b'})));
  assert.equal(state.undo.length,3);
  assert.deepEqual([state.path.start.id,...state.path.segments.map(s=>s.to.id)],['a','c']);
  assert.equal(state.selectedId,'c');
  const afterDeletion=state.path;
  state=undoVectorEdit(state);
  assert.equal(state.selectedId,'b');
  assert.equal(state.path.segments.length,2);
  state=undoVectorEdit(undoVectorEdit(state));
  assert.deepEqual(state.path,source);
  assert.notDeepEqual(afterDeletion,source);
  assert.deepEqual(source.segments[1].controlOut,[.5,.45]);
});

test('a canceled deletion and invalid keyboard nudge cannot corrupt source or history',()=>{
  let state=selectVectorEditNode(createVectorEditSession(source),'b');
  const unchanged=vectorKeyboardCommand(state.path,'b',{key:'ArrowLeft',ctrlKey:true});
  assert.equal(unchanged,null);
  const before=state.path;
  state=beginVectorEdit(state,{kind:'delete',id:'b'});
  assert.equal(state.path,before);
  state=previewVectorEdit(state);
  assert.equal(state.undo.length,0);
  assert.deepEqual(state.path,before);
  state=cancelVectorEdit(state);
  assert.equal(state.tx,null);
  assert.deepEqual(state.path,before);
  assert.equal(state.undo.length,0);
});
