#!/usr/bin/env node
/**
 * One-off real Chromium source A/B for E4 true short-tatami cap contacts.
 * The original source is immutable main a3bdc4b5 (before this PR); shared
 * vector clip/lighting/painter dependencies are identical. Only the old and
 * new embroidery module differs. No fabricated source image or raster shadow.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,extname} from 'node:path';
import {chromium} from 'playwright';

const root=process.cwd();
const old=await readFile(join(root,'comparator-baseline/src/embroidery.js'),'utf8');
const current=await readFile(join(root,'src/embroidery.js'),'utf8');
assert.notEqual(old,current,'Original vs candidate source must differ');
assert(current.includes('paintTatamiCapContact')&&
  current.includes('traceThreadContactCapsule(ctx,low,lowEnd,width)'),
  'This source A/B must exercise two original round yarn capsule clips');
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/'){
      res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>True original tatami contact A/B</title>');
      return;
    }
    const match=/^\/(base|candidate)\/(.+)$/.exec(pathname);
    if(!match){res.writeHead(404).end();return;}
    const path=resolve(root,'./'+match[2]);
    if(!path.startsWith(root+'/')){res.writeHead(403).end();return;}
    const bytes=match[2]==='src/embroidery.js'?
      (match[1]==='base'?old:current):await readFile(path);
    res.writeHead(200,{'content-type':extname(path)==='.js'?'text/javascript':'application/octet-stream','cache-control':'no-store'}).end(bytes);
  }catch(error){
    console.error('TATAMI_CONTACT_HTTP',req.url,error.message);
    if(!res.headersSent)res.writeHead(404).end(String(error));
  }
});
const ring=(l,t,r,b)=>[
  {x:l,y:t},{x:r,y:t},{x:r,y:b},{x:l,y:b}
];
let cases=[
  {label:'unlit-pitch8-legacy-exact',style:'tatami',pitch:8,direction:0,lit:false,
    rings:[ring(50,570,550,730)],width:600,height:1300,effect:false},
  {label:'lit-pitch5-no-real-contact',style:'tatami',pitch:5,direction:0,lit:true,
    rings:[ring(50,570,550,730)],width:600,height:1300,effect:false},
  {label:'lit-pitch8-real-cap',style:'tatami',pitch:8,direction:0,lit:true,
    rings:[ring(50,570,550,730)],width:600,height:1300,effect:true},
  {label:'lit-pitch8-phone-320',style:'tatami',pitch:8,direction:0,lit:true,
    rings:[ring(50,570,550,730)],width:320,height:700,effect:true},
  {label:'lit-pitch8-phone-412',style:'tatami',pitch:8,direction:0,lit:true,
    rings:[ring(50,570,550,730)],width:412,height:892,effect:true},
  {label:'lit-pitch16-real-cap',style:'tatami',pitch:16,direction:0,lit:true,
    rings:[ring(50,570,550,730)],width:600,height:1300,effect:true},
  {label:'lit-pitch8-rotated',style:'tatami',pitch:8,direction:38,lit:true,
    rings:[ring(50,570,550,730)],width:600,height:1300,effect:true},
  {label:'lit-pitch8-reverse-lamp',style:'tatami',pitch:8,direction:38,lit:true,
    lightDirection:'bottom-right',rings:[ring(50,570,550,730)],width:600,height:1300,effect:true},
  {label:'lit-pitch8-hole-and-island',style:'tatami',pitch:8,direction:17,lit:true,
    rings:[ring(50,450,550,850),ring(100,500,500,800),ring(275,615,325,685)],
    width:600,height:1300,effect:true},
  {label:'lit-fibre-pitch8-not-modelled',style:'tatami-fibre',pitch:8,direction:0,lit:true,
    rings:[ring(50,570,550,730)],width:600,height:1300,effect:false},
  {label:'lit-running-pitch8-not-modelled',style:'running',pitch:8,direction:0,lit:true,
    rings:[ring(50,570,550,730)],width:600,height:1300,effect:false},
  {label:'native-3024-lit-compound',style:'tatami',pitch:8,direction:17,lit:true,
    rings:[ring(50,450,550,850),ring(100,500,500,800),ring(275,615,325,685)],
    width:3024,height:6552,effect:true},
];
const visualOnly=process.argv.includes('--visual-only');
if(visualOnly)cases=cases.filter(c=>c.label==='lit-pitch8-real-cap');
const mobileOnly=process.argv.includes('--mobile-only');
if(mobileOnly)cases=cases.filter(c=>c.label.startsWith('lit-pitch8-phone-'));
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const rows=await page.evaluate(async ({cases,visualOnly})=>{
    const [base,candidate,lightModule]=await Promise.all([
      import('/base/src/embroidery.js'),
      import('/candidate/src/embroidery.js'),
      import('/candidate/src/sand-lighting.js'),
    ]);
    const hex=async bytes=>{
      const hash=await crypto.subtle.digest('SHA-256',bytes);
      return [...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('');
    };
    const path=(ctx,entry)=>{
      ctx.beginPath();
      for(const ring of entry.rings){
        ctx.moveTo(ring[0].x,ring[0].y);
        for(let k=1;k<ring.length;k++)ctx.lineTo(ring[k].x,ring[k].y);
        ctx.closePath();
      }
    };
    async function paint(module,entry){
      const surface=new OffscreenCanvas(entry.width,entry.height);
      const ctx=surface.getContext('2d',{willReadFrequently:true});
      ctx.fillStyle='#101b2c';ctx.fillRect(0,0,entry.width,entry.height);
      ctx.setTransform(entry.width/600,0,0,entry.height/1300,0,0);
      ctx.save();path(ctx,entry);
      ctx.fillStyle='#cc477b';ctx.fill('evenodd');ctx.clip('evenodd');
      const treatment=module.normalizeSurfaceTreatments([{
        id:'e4-original-cap-contact',enabled:true,style:entry.style,
        pitch:entry.pitch,direction:entry.direction,relief:88,
        target:{scope:'all',role:'fill',colorSlots:[],ids:[]}
      }])[0];
      const lighting=entry.lit?lightModule.sandLighting({
        lightingMood:'daylight',lightDirection:entry.lightDirection||'top-left',
        lightStrength:90,shadowStrength:82
      }):null;
      const t0=performance.now();
      const count=module.drawRegionEmbroidery(ctx,{rings:entry.rings},treatment,lighting);
      const paintMs=performance.now()-t0;
      ctx.restore();ctx.setTransform(1,0,0,1,0,0);
      const data=ctx.getImageData(0,0,entry.width,entry.height).data;
      let png=null;
      if(entry.width>=3024){
        const bytes=await (await surface.convertToBlob({type:'image/png'})).arrayBuffer();
        png={bytes:bytes.byteLength,sha256:await hex(bytes)};
      }
      const out={pixels:data,stitches:count,paintMs,png,sha256:await hex(data)};
      surface.width=0;surface.height=0;
      return out;
    }
    async function sourceMask(entry){
      const surface=new OffscreenCanvas(entry.width,entry.height);
      const ctx=surface.getContext('2d',{willReadFrequently:true});
      ctx.setTransform(entry.width/600,0,0,entry.height/1300,0,0);
      path(ctx,entry);ctx.fillStyle='white';ctx.fill('evenodd');
      ctx.setTransform(1,0,0,1,0,0);
      const alpha=ctx.getImageData(0,0,entry.width,entry.height).data;
      const mask=new Uint8Array(entry.width*entry.height);
      for(let i=0;i<mask.length;i++)mask[i]=alpha[i*4+3];
      surface.width=0;surface.height=0;
      return mask;
    }
    const records=[];
    for(const entry of cases){
      const samples=[],samplesPerScene=entry.width>=3024?1:3;
      const mask=await sourceMask(entry);
      for(let i=0;i<samplesPerScene;i++){
        const pair={};
        for(const [name,mod] of (i%2?
          [['candidate',candidate],['base',base]]:
          [['base',base],['candidate',candidate]])){
          pair[name]=await paint(mod,entry);
        }
        if(pair.base.stitches!==pair.candidate.stitches)
          throw Error('Original source stitches changed in '+entry.label);
        let different=0,outsideMask=0,maxDelta=0;
        let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
        let nearest=-1,nearestDistance=Infinity;
        const width=entry.width;
        for(let j=0;j<mask.length;j++){
          let changed=false;
          for(let c=0;c<4;c++){
            const diff=Math.abs(pair.base.pixels[j*4+c]-pair.candidate.pixels[j*4+c]);
            if(diff){changed=true;maxDelta=Math.max(maxDelta,diff);}
          }
          if(changed){
            different++;
            if(!mask[j])outsideMask++;
            const px=j%width,py=Math.floor(j/width);
            left=Math.min(left,px);right=Math.max(right,px);
            top=Math.min(top,py);bottom=Math.max(bottom,py);
            const distance=(px-width*.5)**2+(py-entry.height*.5)**2;
            if(distance<nearestDistance){nearestDistance=distance;nearest=j;}
          }
        }
        if(outsideMask)throw Error('Contact ink leaked original even-odd region clip: '+entry.label+' pixels='+outsideMask);
        if(entry.effect&&different===0)
          throw Error('Expected real source-endcap optical difference missing in '+entry.label);
        if(!entry.effect&&different!==0)
          throw Error('Unlit/parallel/unsupported source must retain exact old pixels: '+entry.label+' differing='+different);
        if(entry.effect&&entry.width>=3024&&pair.base.png?.sha256===pair.candidate.png?.sha256)
          throw Error('Native true-contact PNG did not change as expected');
        let visualPngBase64=null;
        if(visualOnly&&nearest>=0){
          const cropSize=64,zoom=3;
          const cx=nearest%width,cy=Math.floor(nearest/width);
          const cropX=Math.max(0,Math.min(width-cropSize,cx-32));
          const cropY=Math.max(0,Math.min(entry.height-cropSize,cy-32));
          const pane=new OffscreenCanvas(cropSize*zoom*3,cropSize*zoom);
          const out=pane.getContext('2d');
          out.imageSmoothingEnabled=false;
          for(const [panel,bytes] of [['base',pair.base.pixels],
            ['candidate',pair.candidate.pixels]]){
            const source=new OffscreenCanvas(width,entry.height);
            const ctx=source.getContext('2d',{willReadFrequently:true});
            ctx.putImageData(new ImageData(bytes,width,entry.height),0,0);
            const segment=new OffscreenCanvas(cropSize,cropSize);
            const ctx2=segment.getContext('2d');
            ctx2.drawImage(source,cropX,cropY,cropSize,cropSize,0,0,cropSize,cropSize);
            out.drawImage(segment,(panel==='base'?0:1)*cropSize*zoom,0,
              cropSize*zoom,cropSize*zoom);
            source.width=source.height=0;
          }
          const heat=new ImageData(cropSize,cropSize);
          for(let y=0;y<cropSize;y++)for(let x=0;x<cropSize;x++){
            const pos=(cropY+y)*width+(cropX+x),dst=(y*cropSize+x)*4;
            let d=0;
            for(let c=0;c<4;c++)d=Math.max(d,
              Math.abs(pair.base.pixels[pos*4+c]-pair.candidate.pixels[pos*4+c]));
            heat.data[dst]=d?255:18;
            heat.data[dst+1]=d?Math.min(255,d*9):18;
            heat.data[dst+2]=d?0:18;
            heat.data[dst+3]=255;
          }
          const delta=new OffscreenCanvas(cropSize,cropSize);
          delta.getContext('2d').putImageData(heat,0,0);
          out.drawImage(delta,cropSize*zoom*2,0,cropSize*zoom,cropSize*zoom);
          const pngBytes=new Uint8Array(await (await pane.convertToBlob({
            type:'image/png'})).arrayBuffer());
          visualPngBase64=btoa(Array.from(pngBytes,byte=>String.fromCharCode(byte)).join(''));
          delta.width=delta.height=0;pane.width=pane.height=0;
        }
        samples.push({visualPngBase64,originalStitches:pair.base.stitches,
          baseMs:pair.base.paintMs,candidateMs:pair.candidate.paintMs,
          originalSha:pair.base.sha256,candidateSha:pair.candidate.sha256,
          different,maximumChannelDelta:maxDelta,outsideMask,
          changedBBox:different?[left,top,right,bottom]:null,
          basePng:pair.base.png,candidatePng:pair.candidate.png});
      }
      records.push({label:entry.label,width:entry.width,height:entry.height,
        lighting:entry.lit,sourceStyle:entry.style,pitch:entry.pitch,
        direction:entry.direction,expectedContact:entry.effect,samples});
    }
    return records;
  },{cases,visualOnly});
  assert.deepEqual(errors,[],'No real browser JS error can be ignored');
  const median=values=>values.slice().sort((a,b)=>a-b)[Math.floor(values.length/2)];
  const summary=rows.map(row=>({
    case:row.label,sourceStyle:row.sourceStyle,pitch:row.pitch,
    stitches:row.samples[0].originalStitches,
    changedPixels:row.samples[0].different,
    maximumChannelDelta:row.samples[0].maximumChannelDelta,
    outsideRegionPixelChanges:row.samples[0].outsideMask,
    oldMedianMs:Math.round(median(row.samples.map(x=>x.baseMs))),
    candidateMedianMs:Math.round(median(row.samples.map(x=>x.candidateMs))),
    nativeBaseline:row.samples[0].basePng,
    nativeCandidate:row.samples[0].candidatePng
  }));
  await mkdir(join(root,'artifacts','embroidery-tatami-real-cap'),{recursive:true});
  await writeFile(join(root,'artifacts','embroidery-tatami-real-cap','receipt.json'),
    JSON.stringify({environment:'Real original-source and candidate canvas under identical vector clips and world lighting; no physical Pixel',baseline:'a3bdc4b520cb48db00499ba84c9fdb4616e16659',summary,rows},null,2)+'\n');
  if(visualOnly&&rows[0]?.samples[0]?.visualPngBase64)
    console.log('ROYGBIV_TATAMI_CAP_CONTACT_CROP_BASE64 '+rows[0].samples[0].visualPngBase64);
  console.log('ROYGBIV_TRUE_TATAMI_CAP_CONTACT_AB',JSON.stringify(summary));
}finally{
  await browser?.close();
  await new Promise(ok=>server.close(ok));
}
