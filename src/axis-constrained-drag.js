// Touch constraints live in CSS-screen space; authored points remain in
// the existing normalized vector design coordinates. Never save this state.
// One gesture freezes the enabled mode at pointerdown, so toggling an
// inspector mid-drag cannot jump or silently change the committed result.
const finitePoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
export const AXIS_LOCK_THRESHOLD_CSS_PX=8;
export function beginAxisDrag(pointer,origin,enabled=false){
  if(!finitePoint(pointer)||!finitePoint(origin))
    throw new TypeError('Axis drag needs finite screen and design points');
  return {start:pointer.slice(),origin:origin.slice(),enabled:!!enabled,axis:null};
}
export function axisConstrainedPoint(state,pointer,proposal){
  if(!state||!finitePoint(pointer)||!finitePoint(proposal))
    throw new TypeError('Axis drag needs finite input');
  if(!state.enabled)return {state,point:proposal.slice()};
  let axis=state.axis;
  if(axis===null){
    const dx=pointer[0]-state.start[0],dy=pointer[1]-state.start[1];
    if(Math.hypot(dx,dy)<AXIS_LOCK_THRESHOLD_CSS_PX)
      return {state,point:state.origin.slice()};
    axis=Math.abs(dx)>=Math.abs(dy)?'x':'y';
  }
  return {state:axis===state.axis?state:{...state,axis},
    point:axis==='x'?[proposal[0],state.origin[1]]:
      [state.origin[0],proposal[1]]};
}
