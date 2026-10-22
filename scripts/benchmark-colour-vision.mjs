// Benchmarks only; not a device performance guarantee.
// npm run bench:vision (run on representative mobile hardware separately).
import {performance} from 'node:perf_hooks';
import {simulateImageData} from '../src/colour-vision.js';

const width=600,height=1300;
const data=new Uint8ClampedArray(width*height*4);
let state=0x4c65e793;
for(let i=0;i<data.length;i+=4){
  state^=state<<13;state^=state>>>17;state^=state<<5;
  data[i]=(state>>>8)&255;
  data[i+1]=(state>>>16)&255;
  data[i+2]=state&255;
  data[i+3]=255;
}
const source={width,height,data};
const WARMUP=3,RUNS=12;
const rows=[];
const percentile=(sorted,p)=>sorted[Math.ceil(p*sorted.length)-1];
for(const mode of ['protan','deutan','tritan']){
  for(const severity of [.5,1]){
    const durations=[];
    let checksum=0;
    for(let n=0;n<WARMUP+RUNS;n++){
      const t=performance.now();
      const result=simulateImageData(source,mode,severity);
      const delta=performance.now()-t;
      if(n>=WARMUP)durations.push(delta);
      checksum=(checksum+result.data[(n*997)%result.data.length])%65536;
    }
    durations.sort((a,b)=>a-b);
    rows.push({
      model:mode,severity,dimensions:`${width}x${height}`,
      p50Ms:+percentile(durations,.5).toFixed(1),
      p95Ms:+percentile(durations,.95).toFixed(1),
      checksum
    });
  }
}
const memory=process.memoryUsage();
console.log(JSON.stringify({
  kind:'ROYGBIV-colour-vision-Node-CPU-benchmark',
  note:'Desktop/server Node timing. Does not establish Android Chrome latency.',
  node:process.version,platform:process.platform,arch:process.arch,
  pixels:width*height,previews:rows,
  finalMemory:{heapMiB:+(memory.heapUsed/1048576).toFixed(1),
    externalMiB:+(memory.external/1048576).toFixed(1),
    arrayBuffersMiB:+(memory.arrayBuffers/1048576).toFixed(1)}
},null,2));
