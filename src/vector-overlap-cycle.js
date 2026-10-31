const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function vectorTapCycle(previous,ids,at,time){
 if(!ids?.length)return {selectedId:null,state:null};
 const stable=ids.slice().sort().join('|');
 const repeat=previous&&previous.stable===stable&&time>=previous.time&&time-previous.time<=1200&&distance(at,previous.at)<=24&&ids.includes(previous.selectedId);
 const order=repeat?previous.order:ids.slice();
 const index=repeat?order.indexOf(previous.selectedId):-1;
 const selectedId=order[(index+1)%order.length];
 return {selectedId,state:order.length>1?{stable,order,selectedId,at:at.slice(),time}:null};
}
