import {DESIGN_WIDTH,DESIGN_HEIGHT} from './model.js';

// Text overlay coordinates refer to the finished wallpaper, independent of
// stripe/world coordinates and the editor's camera/nudge controls.
export function designPointFromPointer(event,canvas){
  const rect=canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return null;
  return {
    x:(event.clientX-rect.left)/rect.width*DESIGN_WIDTH,
    y:(event.clientY-rect.top)/rect.height*DESIGN_HEIGHT,
  };
}
// The finished-frame text anchor can move far from the centre. Reduce line
// width progressively near an edge so dragging never drops an entire word
// outside the final PNG (except deliberate exact-edge centering).
export function availableTextWidth(item){
  const percent=Number.isFinite(item?.x)?item.x:50;
  const x=Math.max(0,Math.min(DESIGN_WIDTH,DESIGN_WIDTH*percent/100));
  const room=2*Math.min(x,DESIGN_WIDTH-x)-12;
  return Math.max(12,Math.min(DESIGN_WIDTH*.94,room));
}
export function measuredTextBounds(item,measure){
  const lines=String(item.text||'').split('\n');
  const actualWidth=Math.max(0,...lines.map(line=>measure(line)));
  return {
    width:Math.min(availableTextWidth(item),actualWidth),
    height:Math.max(1,lines.length)*item.size*1.17,
  };
}
export function hitTextOverlay(items,point,measureFor,{tolerance=0}={}){
  if(!point)return null;
  // Reverse canonical array order: later text is rendered on top.
  for(let i=(items?.length||0)-1;i>=0;i--){
    const item=items[i];
    if(!item?.enabled||!item.text)continue;
    const dx=point.x-DESIGN_WIDTH*item.x/100;
    const dy=point.y-DESIGN_HEIGHT*item.y/100;
    const theta=item.rotation*Math.PI/180;
    const localX=dx*Math.cos(theta)+dy*Math.sin(theta);
    const localY=-dx*Math.sin(theta)+dy*Math.cos(theta);
    const {width,height}=measuredTextBounds(item,value=>measureFor(item,value));
    const stroke=item.outline==='none'?0:item.size*item.outlineWidth/100;
    if(Math.abs(localX)<=width/2+stroke+tolerance&&
       Math.abs(localY)<=height/2+stroke+tolerance)return item;
  }
  return null;
}
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function dragTextOverlay(recipe,id,delta){
  if(!id||!delta||!Number.isFinite(delta.x)||!Number.isFinite(delta.y))return recipe;
  let changed=false;
  const items=(recipe.textOverlays||[]).map(item=>{
    if(item.id!==id||item.locked)return item;
    const x=Math.round(clamp(item.x+delta.x/DESIGN_WIDTH*100,0,100)*10)/10;
    const y=Math.round(clamp(item.y+delta.y/DESIGN_HEIGHT*100,0,100)*10)/10;
    if(x===item.x&&y===item.y)return item;
    changed=true;
    return {...item,x,y};
  });
  return changed?{...recipe,textOverlays:items}:recipe;
}

export function transformTextOverlay(recipe,id,{size,rotation}={}){
  if(!id)return recipe;
  let changed=false;
  const items=(recipe.textOverlays||[]).map(item=>{
    if(item.id!==id||item.locked)return item;
    const updated={...item};
    if(Number.isFinite(size))updated.size=Math.round(clamp(size,12,180)*10)/10;
    if(Number.isFinite(rotation)){
      const wrapped=((rotation+180)%360+360)%360-180;
      updated.rotation=Math.round(wrapped*10)/10;
    }
    if(updated.size===item.size&&updated.rotation===item.rotation)return item;
    changed=true;
    return updated;
  });
  return changed?{...recipe,textOverlays:items}:recipe;
}
export function dragTextTransform(recipe,id,mode,start,current){
  if(!['rotate','scale'].includes(mode)||!start||!current||
      ![start.x,start.y,current.x,current.y].every(Number.isFinite))
    return recipe;
  const item=(recipe.textOverlays||[]).find(x=>x.id===id);
  if(!item||item.locked)return recipe;
  const origin={x:DESIGN_WIDTH*item.x/100,y:DESIGN_HEIGHT*item.y/100};
  const a={x:start.x-origin.x,y:start.y-origin.y};
  const b={x:current.x-origin.x,y:current.y-origin.y};
  const initial=Math.hypot(a.x,a.y);
  if(initial<10)return recipe;
  if(mode==='scale'){
    const ratio=Math.hypot(b.x,b.y)/initial;
    return transformTextOverlay(recipe,id,{size:item.size*ratio});
  }
  const from=Math.atan2(a.y,a.x),to=Math.atan2(b.y,b.x);
  // atan2 deltas preserve signed direction when a finger crosses ±180°.
  const difference=((to-from+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
  return transformTextOverlay(recipe,id,{rotation:item.rotation+difference*180/Math.PI});
}
