// Immutable transaction layer for real authored vector commands.
// Pointer/keyboard inputs must already be expressed in design coordinates.
// No screen pixels, renderer state, or serializer side effects.
import {normalizeVectorPath,moveVectorNode,moveVectorHandle,
  setVectorNodeMode,splitVectorSegment} from './vector-path-commands.js';
const available=(path,id)=>id===path.start.id||path.segments.some(s=>s.to.id===id);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const entry=(path,selectedId)=>({path,selectedId});

export function createVectorEditSession(input,{maxUndo=40,locked=false}={}){
  const path=normalizeVectorPath(input);
  if(!path||!Number.isInteger(maxUndo)||maxUndo<1||maxUndo>100)return null;
  return {path,draft:path,selectedId:null,undo:[],redo:[],tx:null,
    maxUndo,locked:!!locked};
}
export function selectVectorEditNode(state,id){
  if(!state||state.tx||!(id===null||available(state.path,id)))return state;
  return {...state,selectedId:id};
}
export function setVectorEditLocked(state,locked){
  if(!state)return state;
  const next=locked&&state.tx?cancelVectorEdit(state):state;
  return {...next,locked:!!locked};
}
export function beginVectorEdit(state,{kind,id,side,segmentIndex,newId}={}){
  if(!state||state.locked||state.tx||
     !['node','handle','mode','insert'].includes(kind))return state;
  if(kind==='insert'){
    if(!Number.isInteger(segmentIndex)||segmentIndex<0||
       segmentIndex>=state.path.segments.length+(state.path.closed?1:0)||!newId||
       available(state.path,newId))return state;
  }else if(!available(state.path,id))return state;
  if(kind==='handle'&&!['in','out'].includes(side))return state;
  return {...state,tx:{kind,id,side,segmentIndex,newId,
    before:entry(state.path,state.selectedId)},draft:state.path};
}
export function previewVectorEdit(state,{point,mode,t}={}){
  if(!state?.tx||state.locked)return state;
  const {kind,id,side,segmentIndex,newId,before}=state.tx;
  const base=before.path;
  // Each pointermove starts from the same committed snapshot. This avoids
  // cumulative drift, and reversing a gesture can return exactly to source.
  const proposed=kind==='node'?moveVectorNode(base,id,point):
    kind==='handle'?moveVectorHandle(base,id,side,point):
    kind==='mode'?setVectorNodeMode(base,id,mode):
    splitVectorSegment(base,segmentIndex,t,newId);
  if(!proposed)return state;
  return {...state,draft:proposed,selectedId:kind==='insert'?newId:id};
}
export function cancelVectorEdit(state){
  if(!state?.tx)return state;
  return {...state,path:state.tx.before.path,draft:state.tx.before.path,
    selectedId:state.tx.before.selectedId,tx:null};
}
export function commitVectorEdit(state){
  if(!state?.tx)return state;
  if(same(state.tx.before.path,state.draft))
    return {...state,path:state.tx.before.path,draft:state.tx.before.path,tx:null};
  const undo=[...state.undo,state.tx.before].slice(-state.maxUndo);
  return {...state,path:state.draft,undo,redo:[],tx:null};
}
export function undoVectorEdit(state){
  if(!state||state.tx||!state.undo.length)return state;
  const before=state.undo.at(-1),
    redo=[...state.redo,entry(state.path,state.selectedId)].slice(-state.maxUndo);
  return {...state,path:before.path,draft:before.path,selectedId:before.selectedId,
    undo:state.undo.slice(0,-1),redo};
}
export function redoVectorEdit(state){
  if(!state||state.tx||!state.redo.length)return state;
  const next=state.redo.at(-1),
    undo=[...state.undo,entry(state.path,state.selectedId)].slice(-state.maxUndo);
  return {...state,path:next.path,draft:next.path,selectedId:next.selectedId,
    redo:state.redo.slice(0,-1),undo};
}
