// Anchors operate in authored world coordinates, never camera or CSS pixels.
// A captured position makes switching anchors non-destructive; the next
// spacing adjustment translates the whole family to keep that point fixed.
export const STRIPE_ANCHORS=Object.freeze(['centre','red','green','violet']);
export const GROUP_ANCHORS=Object.freeze(['centre','first','last']);
const stripeSlot=(anchor,reverse)=> {
  const index={red:0,green:3,violet:6}[anchor];
  return index===undefined?null:reverse?6-index:index;
};
export function stripeAnchorCoordinate(positions,anchor='centre',reverse=false){
  if(!positions?.length)return 0;
  const index=stripeSlot(anchor,reverse);
  return index===null?(positions[0]+positions.at(-1))/2:positions[index];
}
export function groupAnchorCoordinate(offsets,anchor='centre'){
  if(!offsets?.length)return 0;
  return anchor==='first'?offsets[0]:
    anchor==='last'?offsets.at(-1):(offsets[0]+offsets.at(-1))/2;
}
export function pinStripePositions(positions,{anchor='centre',position,centre=0,reverse=false}={}){
  if(!positions?.length||anchor==='centre'&&!Number.isFinite(position))return positions;
  const target=Number.isFinite(position)?position:0;
  const shift=target-centre-stripeAnchorCoordinate(positions,anchor,reverse);
  return positions.map(value=>value+shift);
}
export function pinGroupOffsets(offsets,{anchor='centre',position}={}){
  if(!offsets?.length||anchor==='centre'&&!Number.isFinite(position))return offsets;
  const target=Number.isFinite(position)?position:0;
  const shift=target-groupAnchorCoordinate(offsets,anchor);
  return offsets.map(value=>value+shift);
}
