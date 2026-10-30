// Keyboard precision commands are vector design-space edits, not keydown
// handlers. DOM focus and OS shortcuts are handled by the editor UI.
import {vectorNodeTargets} from './vector-node-hit.js';
import {VECTOR_PATH_MIN,VECTOR_PATH_MAX,
  VECTOR_PATH_WIDTH,VECTOR_PATH_HEIGHT} from './vector-path-commands.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function vectorKeyboardCommand(path,selectedId,{
  key,altKey=false,shiftKey=false,ctrlKey=false,metaKey=false
}={}){
  if(typeof key!=='string'||ctrlKey||metaKey)return null;
  const targets=vectorNodeTargets(path);
  if(!targets)return null;
  const nodes=targets.nodes;
  if(key==='['||key===']'){
    if(altKey)return null;
    const i=nodes.findIndex(n=>n.id===selectedId);
    const direction=key===']'?1:-1;
    const index=(i<0?(direction===1?-1:0):i);
    return {kind:'select',id:nodes[(index+direction+nodes.length)%nodes.length].id};
  }
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key))return null;
  const node=nodes.find(n=>n.id===selectedId);
  if(!node)return null;
  const side=altKey?(shiftKey?'in':'out'):null;
  const original=side?
    targets.handles.find(h=>h.id===selectedId&&h.side===side)?.point:node.point;
  if(!original)return null;
  const step=!altKey&&shiftKey?10:1;
  const x=key==='ArrowLeft'?-step/VECTOR_PATH_WIDTH:
    key==='ArrowRight'?step/VECTOR_PATH_WIDTH:0;
  const y=key==='ArrowUp'?-step/VECTOR_PATH_HEIGHT:
    key==='ArrowDown'?step/VECTOR_PATH_HEIGHT:0;
  const point=[clamp(original[0]+x,VECTOR_PATH_MIN,VECTOR_PATH_MAX),
    clamp(original[1]+y,VECTOR_PATH_MIN,VECTOR_PATH_MAX)];
  if(point[0]===original[0]&&point[1]===original[1])return null;
  return {kind:altKey?'handle':'node',id:node.id,
    ...(side?{side}:{}),point};
}
