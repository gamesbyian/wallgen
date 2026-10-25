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
