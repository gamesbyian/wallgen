// Experimental, renderer-independent shape measurements for #557.
// No palette mapping, canonical recipe inference, source storage or rasterizer.
// Zero new dependencies. Analyse existing binary hue masks at bounded resolution.
const MAX_PIXELS=650000;

function check(mask,width,height){
  if(!(mask instanceof Uint8Array)||!Number.isInteger(width)||
    !Number.isInteger(height)||width<1||height<1||
    width*height>MAX_PIXELS||mask.length!==width*height)
    throw new RangeError('Expected bounded binary mask and matching dimensions');
}

// Felzenszwalb-Huttenlocher lower envelope of parabolas, O(n).
// Values are finite sentinels even for a seedless row; no NaN intersections.
function transformLine(input,length,output,v,z){
  let k=0;
  v[0]=0;z[0]=-Infinity;z[1]=Infinity;
  for(let q=1;q<length;q++){
    let s;
    do{
      const p=v[k];
      s=((input[q]+q*q)-(input[p]+p*p))/(2*(q-p));
      if(s>z[k])break;
      k--;
    }while(k>=0);
    k++;v[k]=q;z[k]=s;z[k+1]=Infinity;
  }
  k=0;
  for(let q=0;q<length;q++){
    while(z[k+1]<q)k++;
    const d=q-v[k];
    output[q]=d*d+input[v[k]];
  }
}

/** Exact squared Euclidean distance to any nonzero seed pixel.
 * Seedless masks return +Infinity, not misleading finite sentinel values.
 * Padding is the caller's concern; do not infer invisible image exterior.
 */
export function distanceToSeedsSquared(seeds,width,height){
  check(seeds,width,height);
  const n=width*height,output=new Float32Array(n);
  if(!seeds.some(value=>value!==0)){
    output.fill(Infinity);return output;
  }
  const infinity=4*(width*width+height*height)+16;
  const horizontal=new Float64Array(n);
  const buffer=new Float64Array(Math.max(width,height));
  const result=new Float64Array(buffer.length);
  const v=new Int32Array(buffer.length);
  const z=new Float64Array(buffer.length+1);
  for(let y=0;y<height;y++){
    const offset=y*width;
    for(let x=0;x<width;x++)
      buffer[x]=seeds[offset+x]?0:infinity;
    transformLine(buffer,width,result,v,z);
    for(let x=0;x<width;x++)horizontal[offset+x]=result[x];
  }
  for(let x=0;x<width;x++){
    for(let y=0;y<height;y++)buffer[y]=horizontal[y*width+x];
    transformLine(buffer,height,result,v,z);
    for(let y=0;y<height;y++)
      output[y*width+x]=result[y]>=infinity?Infinity:result[y];
  }
  return output;
}

/** Local pigment half-width: Euclidean distance to background, with an
 * explicit one-pixel exterior around the image. Full-frame ink has a finite
 * distance; crop-contacting objects never imply unseen exterior geometry.
 */
export function inkDistanceField(mask,width,height){
  check(mask,width,height);
  const pw=width+2,ph=height+2;
  if(pw*ph>MAX_PIXELS+4096)throw new RangeError('Padded mask too large');
  const background=new Uint8Array(pw*ph).fill(1);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)
    background[(y+1)*pw+x+1]=mask[y*width+x]?0:1;
  const squared=distanceToSeedsSquared(background,pw,ph);
  const output=new Float32Array(mask.length);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=y*width+x;
    output[i]=mask[i]?Math.sqrt(squared[(y+1)*pw+x+1]):0;
  }
  return output;
}

export function inkEdgeMask(mask,width,height){
  check(mask,width,height);
  const edge=new Uint8Array(mask.length);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=y*width+x;
    if(!mask[i])continue;
    if(x===0||x===width-1||y===0||y===height-1||
      !mask[i-1]||!mask[i+1]||!mask[i-width]||!mask[i+width])
      edge[i]=1;
  }
  return edge;
}

/** Foreground 4-connectivity, background 8-connectivity: holes require
 * enclosed background and diagonally connected background stays exterior.
 */
export function maskTopology(mask,width,height){
  check(mask,width,height);
  const visited=new Uint8Array(mask.length);
  const stack=new Int32Array(mask.length);
  let components=0,holes=0,ink=0;
  for(const value of mask)if(value)ink++;
  const flood=(start,target,diagonal)=>{
    let end=1;let begin=0;stack[0]=start;visited[start]=1;
    let touchesBorder=false;
    while(begin<end){
      const p=stack[begin++],x=p%width,y=(p/width)|0;
      if(x===0||x===width-1||y===0||y===height-1)touchesBorder=true;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(dx===0&&dy===0||!diagonal&&dx!==0&&dy!==0)continue;
        const nx=x+dx,ny=y+dy;
        if(nx<0||nx>=width||ny<0||ny>=height)continue;
        const n=ny*width+nx;
        if(!visited[n]&&Boolean(mask[n])===target){
          visited[n]=1;stack[end++]=n;
        }
      }
    }
    return touchesBorder;
  };
  for(let p=0;p<mask.length;p++){
    if(mask[p]&&!visited[p]){components++;flood(p,true,false);}
  }
  visited.fill(0);
  for(let p=0;p<mask.length;p++){
    if(!mask[p]&&!visited[p]&&!flood(p,false,true))holes++;
  }
  return {components,holes,ink,euler:components-holes};
}

/** Diagnostic comparison only: never influences rankReconstructionCandidates.
 * Symmetric Chamfer compares the actual exposed boundaries, not hypothetical
 * contours of clipped or occluded pigments. Retains empty-mask distinction.
 */
export function compareMaskGeometry(source,rendered,width,height){
  check(source,width,height);check(rendered,width,height);
  let common=0,aInk=0,bInk=0;
  for(let i=0;i<source.length;i++){
    const a=Boolean(source[i]),b=Boolean(rendered[i]);
    if(a)aInk++;
    if(b)bInk++;
    if(a&&b)common++;
  }
  const a=maskTopology(source,width,height);
  const b=maskTopology(rendered,width,height);
  const edgeA=inkEdgeMask(source,width,height);
  const edgeB=inkEdgeMask(rendered,width,height);
  const sumEdges=edge=>edge.reduce((sum,v)=>sum+(v?1:0),0);
  const countA=sumEdges(edgeA),countB=sumEdges(edgeB);
  let chamfer;
  if(!countA&&!countB)chamfer=0;
  else if(!countA||!countB)chamfer=1;
  else{
    const da=distanceToSeedsSquared(edgeA,width,height);
    const db=distanceToSeedsSquared(edgeB,width,height);
    let aToB=0,bToA=0;
    for(let i=0;i<source.length;i++){
      if(edgeA[i])aToB+=Math.sqrt(db[i]);
      if(edgeB[i])bToA+=Math.sqrt(da[i]);
    }
    chamfer=(aToB/countA+bToA/countB)/(2*Math.hypot(width,height));
  }
  return {
    iou:(aInk+bInk-common)===0?1:common/(aInk+bInk-common),
    dice:(aInk+bInk)===0?1:2*common/(aInk+bInk),
    edgeChamfer:chamfer,
    topologyMismatch:Math.abs(a.components-b.components)+Math.abs(a.holes-b.holes),
    source:a,rendered:b
  };
}
