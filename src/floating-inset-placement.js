// Source-station placement for inset stripes. Spread is a transverse
// dimension and must not silently become a longitudinal translation.
// The preferred world station survives changes to safe intervals until
// the actual canvas bounds make that position impossible.
export function placeFloatingInterval(safeStart,safeEnd,lengthFraction,preferredCentre=0){
  if(![safeStart,safeEnd,lengthFraction,preferredCentre].every(Number.isFinite)||
    safeEnd<=safeStart)
    return {start:safeStart,end:safeStart,clamped:true};
  const available=safeEnd-safeStart;
  const length=Math.max(0,Math.min(available,available*lengthFraction));
  const minCentre=safeStart+length/2,maxCentre=safeEnd-length/2;
  const centre=Math.max(minCentre,Math.min(maxCentre,preferredCentre));
  return {start:centre-length/2,end:centre+length/2,
    clamped:Math.abs(centre-preferredCentre)>1e-7};
}
