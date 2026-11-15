// Anchors operate in authored world coordinates, never camera or CSS pixels.
// A captured position makes switching anchors non-destructive; the next
// spacing adjustment translates the whole family to keep that point fixed.
export const STRIPE_ANCHORS=Object.freeze(['centre','red','green','violet']);
export const GROUP_ANCHORS=Object.freeze(['centre','first','last']);
export const WIDTH_ANCHORS=Object.freeze(['centre','red-edge','violet-edge']);
export const LENGTH_ANCHORS=Object.freeze(['centre','start','end']);
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

// The ribbon-width anchor refers to a physical coloured OUTER edge.
// Reversing hue order swaps which normal-side is Red's outer edge.
export function bandAnchorCoordinate(stripes,anchor='centre'){
  if(!stripes?.length)return 0;
  const red=stripes.find(s=>s.name==='Red');
  const violet=stripes.find(s=>s.name==='Violet');
  const outerEdge=stripe=>{
    if(!stripe)return 0;
    const position=stripes.indexOf(stripe);
    const facing=position<(stripes.length-1)/2?-1:1;
    return stripe.center+facing*stripe.width/2;
  };
  const redEdge=outerEdge(red),violetEdge=outerEdge(violet);
  if(anchor==='red-edge')return redEdge;
  if(anchor==='violet-edge')return violetEdge;
  return (redEdge+violetEdge)/2;
}
export function pinBandEdges(stripes,{anchor='centre',position}={}){
  if(!stripes?.length||anchor==='centre'&&!Number.isFinite(position))return stripes;
  const target=Number.isFinite(position)?position:0;
  const shift=target-bandAnchorCoordinate(stripes,anchor);
  return stripes.map(stripe=>({...stripe,center:stripe.center+shift}));
}
