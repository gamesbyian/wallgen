// Read-only reconstruction geometry measurements (#557).
// Uses the single canonical seven-pigment segmentation owner, not another
// colour classifier. Diagnostic only; nothing here commits a recipe.
import {HUES} from './model.js';
import {extractImageColourRegions} from './image-path.js';
import {inkDistanceField,maskTopology,compareMaskGeometry}
  from './reconstruction-distance-field.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function percentile(values,fraction){
  if(!values.length)return null;
  const sorted=values.slice().sort((a,b)=>a-b);
  const x=(sorted.length-1)*fraction,lo=Math.floor(x),hi=Math.ceil(x);
  return sorted[lo]+(sorted[hi]-sorted[lo])*(x-lo);
}

/** Zhang-Suen 8-connected thinning with a strict diagnostic iteration cap.
 * Unlike fit contours, a visible clipped edge does not reveal the unobserved
 * centreline outside the bitmap. Callers must inspect touchesFrame.
 */
export function skeletonizePigment(mask,width,height,{maxIterations=48}={}){
  if(!(mask instanceof Uint8Array)||!Number.isInteger(width)||
    !Number.isInteger(height)||width<3||height<3||
    width*height>40000||mask.length!==width*height||
    !Number.isInteger(maxIterations)||maxIterations<1||maxIterations>128)
    throw new RangeError('Invalid bounded skeleton input');
  const pixels=Uint8Array.from(mask,x=>x?1:0);
  const erased=new Uint8Array(pixels.length);
  let iterations=0,changed=true;
  while(changed&&iterations<maxIterations){
    changed=false;iterations++;
    for(let pass=0;pass<2;pass++){
      erased.fill(0);
      for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
        const i=y*width+x;
        if(!pixels[i])continue;
        const n=[
          pixels[i-width],pixels[i-width+1],pixels[i+1],
          pixels[i+width+1],pixels[i+width],pixels[i+width-1],
          pixels[i-1],pixels[i-width-1]
        ];
        const sum=n.reduce((s,v)=>s+v,0);
        if(sum<2||sum>6)continue;
        let transitions=0;
        for(let j=0;j<8;j++)if(!n[j]&&n[(j+1)%8])transitions++;
        if(transitions!==1)continue;
        if(pass===0?(n[0]&&n[2]&&n[4]||n[2]&&n[4]&&n[6]):
          (n[0]&&n[2]&&n[6]||n[0]&&n[4]&&n[6]))continue;
        erased[i]=1;
      }
      for(let i=0;i<pixels.length;i++)if(erased[i]){
        pixels[i]=0;changed=true;
      }
    }
  }
  return {pixels,iterations,complete:!changed,
    count:pixels.reduce((n,v)=>n+(v?1:0),0)};
}

/** Detect *visible* black channels between seven parallel colour bands near
 * the upper frame, where Hairpin and Loop remain nearly straight. Reuses only
 * the shared importer pigment masks; crowded crossings and partial hues are
 * rejected instead of inventing a layer order or unseen strand geometry.
 * This is one local observation, not a global stripeWidth control.
 */
export function measureUpperHueGaps(masks,width,height){
  if(!Array.isArray(masks)||masks.length!==7||
    !Number.isInteger(width)||!Number.isInteger(height)||
    width<20||height<40||width*height>40000||
    masks.some(mask=>!(mask instanceof Uint8Array)||
      mask.length!==width*height))
    throw new RangeError('Invalid source hue mask geometry');
  const gaps=[],rows=[];
  for(let y=Math.floor(height*.05);y<Math.floor(height*.25);y++){
    const segments=[];
    let valid=true;
    for(let hue=0;hue<7;hue++){
      const mask=masks[hue],runs=[];let start=-1;
      for(let x=0;x<=width;x++){
        const marked=x<width&&mask[y*width+x]!==0;
        if(marked&&start<0)start=x;
        else if(!marked&&start>=0){runs.push([start,x-1]);start=-1;}
      }
      runs.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]));
      if(!runs.length||runs[0][1]-runs[0][0]<1||
        runs[1]&&runs[1][1]-runs[1][0]>=
          (runs[0][1]-runs[0][0])*.5){valid=false;break;}
      segments.push({hue,start:runs[0][0],end:runs[0][1]});
    }
    if(!valid)continue;
    segments.sort((a,b)=>a.start-b.start);
    const order=segments.map(x=>x.hue);
    if(![0,6].includes(order[0])||
      order.some((h,i)=>i&&Math.abs(h-order[i-1])!==1))continue;
    const local=[];
    for(let i=1;i<segments.length;i++){
      const gap=segments[i].start-segments[i-1].end-1;
      if(gap<0||gap>width*.2){valid=false;break;}
      local.push(gap);
    }
    if(!valid)continue;
    rows.push(y);gaps.push(...local);
  }
  if(!gaps.length)return null;
  return {usableRows:rows.length,observedPairs:gaps.length,
    medianGap:pxRound(percentile(gaps,.5)),
    meanGap:pxRound(gaps.reduce((s,x)=>s+x,0)/gaps.length),
    gapPositiveFraction:pxRound(gaps.filter(x=>x>=1).length/gaps.length),
    // Measurements refer to pixel grid spacing, not author stroke-width units.
    sourcePixelsOnly:true};
}
const pxRound=value=>Math.round(value*10000)/10000;

function describeMask(mask,width,height,{withSkeleton=true}={}){
  const topology=maskTopology(mask,width,height);
  let touchesFrame=false;
  for(let x=0;x<width;x++)if(mask[x]||mask[(height-1)*width+x])
    touchesFrame=true;
  for(let y=0;y<height;y++)if(mask[y*width]||mask[y*width+width-1])
    touchesFrame=true;
  if(!topology.ink)return {...topology,touchesFrame,
    skeletonLength:0,skeletonComplete:true,inkWidthMedian:null,
    inkWidthP10:null,inkWidthP90:null};
  if(!withSkeleton)return {...topology,touchesFrame};
  const skeleton=skeletonizePigment(mask,width,height);
  const distance=inkDistanceField(mask,width,height);
  const widths=[];
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
    const i=y*width+x;
    if(skeleton.pixels[i])widths.push(2*distance[i]);
  }
  return {...topology,touchesFrame,
    skeletonLength:skeleton.count,skeletonComplete:skeleton.complete,
    // Explicitly local, quantized ink width rather than original thickness.
    inkWidthMedian:percentile(widths,.5),
    inkWidthP10:percentile(widths,.1),
    inkWidthP90:percentile(widths,.9)};
}

/** Recomputes the canonical shared segmentation exactly once for this image.
 * Opt-in return masks never enter recipe serialization or main UI state.
 */
export function describeRainbowInkGeometry(image,{withSkeleton=true}={}){
  if(!image||image.width*image.height>650000||
    image.width<12||image.height<12)
    throw new RangeError('Invalid analysis image');
  if(withSkeleton&&image.width*image.height>40000)
    throw new RangeError('Skeleton diagnostics require downsampled analysis');
  const found=extractImageColourRegions(image,HUES,{includeMasks:true});
  const byHue=found.masks.map((mask,index)=>({
    index,...describeMask(mask,image.width,image.height,{withSkeleton})
  }));
  return {width:image.width,height:image.height,
    background:found.background,coverage:found.coverage,
    hueCount:byHue.filter(x=>x.ink>0).length,
    byHue};
}

/** Numeric optical descriptors only, never a ranking alternative. */
export function compareRainbowInkGeometry(source,rendered,{withSkeleton=true}={}){
  if(!source||!rendered||source.width!==rendered.width||
    source.height!==rendered.height)
    throw new RangeError('Mismatched geometry analysis images');
  const w=source.width,h=source.height;
  if(withSkeleton&&w*h>40000)
    throw new RangeError('Skeleton diagnostics require downsampled analysis');
  const a=extractImageColourRegions(source,HUES,{includeMasks:true});
  const b=extractImageColourRegions(rendered,HUES,{includeMasks:true});
  const upperSourceGaps=measureUpperHueGaps(a.masks,w,h);
  const upperRenderedGaps=measureUpperHueGaps(b.masks,w,h);
  const byHue=a.masks.map((mask,i)=>{
    const other=b.masks[i];
    const metric=compareMaskGeometry(mask,other,w,h);
    const sourceShape=describeMask(mask,w,h,{withSkeleton});
    const renderedShape=describeMask(other,w,h,{withSkeleton});
    const sourceWidth=sourceShape.inkWidthMedian;
    const renderedWidth=renderedShape.inkWidthMedian;
    return {index:i,...metric,source:sourceShape,rendered:renderedShape,
      widthRatio:sourceWidth!==null&&renderedWidth>0?
        clamp(sourceWidth/renderedWidth,0,20):null};
  });
  const active=byHue.filter(item=>item.source.ink&&item.rendered.ink);
  const average=(key,items=byHue)=>items.length?
    items.reduce((s,v)=>s+v[key],0)/items.length:null;
  return {width:w,height:h,
    upperSourceGaps,upperRenderedGaps,
    sourceHues:a.regions.length,renderedHues:b.regions.length,
    meanIoU:average('iou'),meanEdgeChamfer:average('edgeChamfer'),
    missingHues:byHue.filter(item=>Boolean(item.source.ink)!==
      Boolean(item.rendered.ink)).map(item=>item.index),
    meanWidthRatio:active.length?
      active.reduce((s,v)=>s+(v.widthRatio??1),0)/active.length:null,
    topologyMismatch:byHue.reduce((s,v)=>s+v.topologyMismatch,0),
    byHue};
}

// Deliberately conservative offline hypothesis, NOT a production tuning rule.
// Trust a global ink-width trial only when most visible hues independently
// show the same signed departure. Hairpin's real #05 mismatched hue widths
// should fail closed instead of blindly altering all bands.
export function proposeMedialWidthDeltas(geometry,stripeWidth){
  if(!geometry||!Array.isArray(geometry.byHue)||
    !Number.isFinite(stripeWidth)||stripeWidth<5||stripeWidth>100)
    return null;
  const ratios=geometry.byHue.filter(h=>
    h.source?.ink>=32&&h.rendered?.ink>=32&&
    h.source.skeletonComplete===true&&
    h.rendered.skeletonComplete===true&&
    Number.isFinite(h.widthRatio)&&h.widthRatio>.45&&h.widthRatio<1.8)
    .map(h=>h.widthRatio).sort((a,b)=>a-b);
  if(ratios.length<6)return null;
  const median=percentile(ratios,.5);
  const deviations=ratios.map(r=>Math.abs(r-median));
  const mad=percentile(deviations,.5);
  if(mad>.10||median>.96&&median<1.04||
    median<.65||median>1.45)return null;
  const centre=clamp(Math.round(stripeWidth*(median-1)),-22,22);
  if(Math.abs(centre)<3)return null;
  const values=[centre,Math.round(centre*.5),Math.round(centre*1.5)];
  return {medianRatio:median,medianAbsDeviation:mad,
    deltas:[...new Set(values.filter(d=>d!==0))]};
}

// Research-only evidence gate for *coupled* negative-space experiments.
// One source-local upper straight section does not prove the correct
// procedural controls over a bent/crossing scene; painter pixels still decide.
export function proposeUpperGapTrials(geometry,kind){
  if(!['hairpin','loop'].includes(kind))return null;
  const source=geometry?.upperSourceGaps,painted=geometry?.upperRenderedGaps;
  if(!source||!painted||source.usableRows<8||painted.usableRows<8||
    source.observedPairs<48||painted.observedPairs<48||
    source.meanGap<.4||
    source.gapPositiveFraction-painted.gapPositiveFraction<.25)
    return null;
  // Keep the proposed studies compact and bounded; these are not global
  // renderer adjustments, not part of 6+10, and not new editor defaults.
  const pairs=kind==='hairpin'?
    [[-8,4],[-12,6],[-16,8]]:
    [[-6,4],[-10,8],[-12,10]];
  return {source,painted,
    trials:pairs.map(([widthDelta,spreadDelta])=>({
      widthDelta,spreadDelta
    }))};
}
