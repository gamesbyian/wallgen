#!/usr/bin/env node
/**
 * One-off opt-in original-vs-candidate region embroidery proof.
 * Both call real drawRegionEmbroidery in Chromium OffscreenCanvas2D under
 * the same original even-odd silhouette clip; includes 3024x6552 PNG.
 * Baseline files come from immutable pre-change commit 924e2ab2.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,extname} from 'node:path';
import {chromium} from 'playwright';

const root=process.cwd();
const old=await readFile(join(root,'comparator-baseline/src/embroidery.js'),'utf8');
const current=await readFile(join(root,'src/embroidery.js'),'utf8');
assert.notEqual(old,current,'Need different real old/new embroidery modules');
assert(current.includes('halfX+threadHalo')&&current.includes('halfY+threadHalo'),
  'Candidate must use original conservative source-world bounds');
const server=createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(path==='/'){res.writeHead(200,{'content-type':'text/html'}).end('<!doctype html><title>Region thread pixel proof</title>');return;}
    const match=/^\/(base|candidate)\/(.+)$/.exec(path);
    if(!match){res.writeHead(404).end();return;}
    const file=resolve(root,'./'+match[2]);
    if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
    const bytes=match[2]==='src/embroidery.js'?
      (match[1]==='base'?old:current):await readFile(file);
    res.writeHead(200,{'content-type':extname(file)==='.js'?'text/javascript':'application/octet-stream',
      'cache-control':'no-store'}).end(bytes);
  }catch(error){console.error('HTTP_REGION_SOURCE_ERROR',req.url,error.message);
    if(!res.headersSent)res.writeHead(404).end(String(error));}
});
const polygon=(left,top,right,bottom)=>[
  {x:left,y:top},{x:right,y:top},{x:right,y:bottom},{x:left,y:bottom}];
const cases=[
  {label:'thin-horizontal-tatami-unlit',style:'tatami',pitch:5,direction:0,
    rings:[polygon(50,640,550,660)],width:600,height:1300,lit:false},
  {label:'thin-horizontal-tatami-lit',style:'tatami',pitch:5,direction:0,
    rings:[polygon(50,640,550,660)],width:600,height:1300,lit:true},
  {label:'thin-rotated-tatami-fibre',style:'tatami-fibre',pitch:5,direction:38,
    rings:[polygon(50,640,550,660)],width:600,height:1300,lit:true},
  {label:'tall-running-reverse-lamp',style:'running',pitch:7,direction:38,
    rings:[polygon(280,150,320,1150)],width:600,height:1300,lit:true,
    lightDirection:'bottom-right'},
  {label:'ordinary-medium-tatami-lit',style:'tatami',pitch:8,direction:38,
    rings:[polygon(120,580,320,660)],width:600,height:1300,lit:true},
  {label:'tatami-circle-lit',style:'tatami-fibre',pitch:9,direction:73,
    circle:{cx:300,cy:650,r:140},width:600,height:1300,lit:true},
  {label:'compound-hole-island',style:'tatami',pitch:5,direction:17,
    rings:[polygon(50,450,550,850),polygon(100,500,500,800),
      polygon(275,615,325,685)],width:600,height:1300,lit:true},
  {label:'compound-native-3024',style:'tatami-fibre',pitch:5,direction:17,
    rings:[polygon(50,450,550,850),polygon(100,500,500,800),
      polygon(275,615,325,685)],width:3024,height:6552,lit:true},
];
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox'],
    ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})});
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',err=>errors.push(String(err)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(async cases=>{
    const [base,candidate,sourceLight]=await Promise.all([
      import('/base/src/embroidery.js'),import('/candidate/src/embroidery.js'),
      import('/candidate/src/sand-lighting.js'),
    ]);
    async function sha(bytes){
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
    }
    async function paint(mod,entry){
      const surf=new OffscreenCanvas(entry.width,entry.height);
      const ctx=surf.getContext('2d',{willReadFrequently:true});
      if(!ctx)throw Error('Real Canvas2D unavailable');
      ctx.fillStyle='#101b2c';ctx.fillRect(0,0,entry.width,entry.height);
      ctx.setTransform(entry.width/600,0,0,entry.height/1300,0,0);
      ctx.save();ctx.beginPath();
      const object=entry.circle?{circle:entry.circle}:{rings:entry.rings};
      if(entry.circle){
        ctx.arc(entry.circle.cx,entry.circle.cy,entry.circle.r,0,Math.PI*2);
      }else for(const ring of entry.rings){
        ctx.moveTo(ring[0].x,ring[0].y);
        for(let k=1;k<ring.length;k++)ctx.lineTo(ring[k].x,ring[k].y);
        ctx.closePath();
      }
      ctx.fillStyle='#cc477b';
      ctx.fill(entry.rings?'evenodd':'nonzero');
      ctx.clip(entry.rings?'evenodd':'nonzero');
      const treatment=mod.normalizeSurfaceTreatments([{
        id:'source-regression',enabled:true,style:entry.style,pitch:entry.pitch,
        relief:88,direction:entry.direction,
        target:{scope:'all',role:'fill',colorSlots:[],ids:[]}
      }])[0];
      const lighting=entry.lit?sourceLight.sandLighting({
        lightingMood:'daylight',
        lightDirection:entry.lightDirection||'top-left',
        lightStrength:90,shadowStrength:82
      }):null;
      const began=performance.now();
      const stitches=mod.drawRegionEmbroidery(ctx,object,treatment,lighting);
      const paintMs=performance.now()-began;
      ctx.restore();ctx.setTransform(1,0,0,1,0,0);
      const rgba=ctx.getImageData(0,0,entry.width,entry.height);
      const digest=await sha(rgba.data);
      let png=null;
      if(entry.width===3024){
        const blob=await surf.convertToBlob({type:'image/png'});
        const bytes=await blob.arrayBuffer();
        png={sha256:await sha(bytes),bytes:bytes.byteLength};
      }
      surf.width=0;surf.height=0;
      return {paintMs,stitches,sha256:digest,png};
    }
    const rows=[];
    for(const entry of cases){
      const samples=[],pairs=entry.width>=3024?1:3;
      for(let i=0;i<pairs;i++){
        const pair={};
        for(const [label,mod] of (i%2?
          [['candidate',candidate],['base',base]]:
          [['base',base],['candidate',candidate]])){
          pair[label]=await paint(mod,entry);
        }
        if(pair.base.sha256!==pair.candidate.sha256)
          throw Error('Original clip+image RGBA differs: '+entry.label+
            ' old='+pair.base.sha256+' new='+pair.candidate.sha256);
        if(JSON.stringify(pair.base.png)!==JSON.stringify(pair.candidate.png))
          throw Error('Native PNG changed: '+entry.label);
        if(!(pair.candidate.stitches<=pair.base.stitches))
          throw Error('Culling cannot add source strokes '+entry.label);
        samples.push(pair);
      }
      rows.push({label:entry.label,dimensions:[entry.width,entry.height],
        style:entry.style,direction:entry.direction,samples});
    }
    return rows;
  },cases);
  assert.deepEqual(errors,[]);
  const median=xs=>xs.slice().sort((a,b)=>a-b)[Math.floor(xs.length/2)];
  const summary=result.map(row=>({
    label:row.label,dimensions:row.dimensions,
    originalStitches:row.samples[0].base.stitches,
    candidateStitches:row.samples[0].candidate.stitches,
    skippedPercent:Math.round(1000*(1-row.samples[0].candidate.stitches/
      row.samples[0].base.stitches))/10,
    oldMedianMs:Math.round(median(row.samples.map(s=>s.base.paintMs))),
    newMedianMs:Math.round(median(row.samples.map(s=>s.candidate.paintMs))),
    pixelHash:row.samples[0].base.sha256,
    nativePng:row.samples[0].base.png,
  }));
  await mkdir(join(root,'artifacts','embroidery-region-bounds'),{recursive:true});
  await writeFile(join(root,'artifacts','embroidery-region-bounds','receipt.json'),
    JSON.stringify({environment:'Real Chromium Canvas2D source region clip, full raw pixel and native PNG; not physical Pixel',
      baselineSource:'924e2ab2e005cb65bc77788b56b725399fb64e11',
      experimentalSource:'current PR',
      summary,cases:result},null,2)+'\n');
  console.log('ROYGBIV_EMBROIDERY_REGION_BOUNDS',JSON.stringify(summary));
}finally{
  await browser?.close();
  await new Promise(done=>server.close(done));
}
