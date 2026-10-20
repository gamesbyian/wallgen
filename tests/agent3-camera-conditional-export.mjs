#!/usr/bin/env node
/**
 * Agent 3: exhaustive active Structure/Mode browser controls and REAL native
 * 3024x6552 Download PNGs, partitioned into three independently auditable
 * four-case shards. Every case performs zoom out/in/Fit in the application,
 * verifies complete camera-only recipe mutations, and decodes the downloaded
 * PNG's authored recipe and stable coloured foreground parity against the
 * main-thread Canvas2D renderer. No synthetic export stand-ins.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe,resolveScene,
  STRUCTURES,RADIAL_MODES,REGION_MODES,
  OUTPUT_WIDTH,OUTPUT_HEIGHT} from '../src/model.js';
import {viewCamera} from '../src/view-camera.js';
import {extractPngRecipe} from '../src/png-metadata.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const shard=Number(process.env.AGENT3_CONDITIONAL_SHARD??0);
assert.ok(Number.isInteger(shard)&&shard>=0&&shard<3,'Expected native shard 0, 1 or 2');
assert.deepEqual(STRUCTURES,['paths','radial','regions']);
assert.deepEqual(RADIAL_MODES,['sunburst','starburst','pinwheel','spokes','concentric']);
assert.deepEqual(REGION_MODES,['voronoi','organic','facets','blocks','nested']);
const out=resolve(process.env.AGENT3_CONDITIONAL_OUT||
  'artifacts/agent3-camera-conditional-native/shard-'+shard);
await mkdir(out,{recursive:true});

const all=[
  {id:'paths-wave-repeat',mode:'wave',
    source:{structure:'paths',geometry:'wave',shapeFrequency:24,shapeDepth:54,
      composition:'repeat',repeatCount:2,repeatSpacing:24,
      construction:'woven',motif:'dots',motifFrequency:55}},
  {id:'paths-drawn-offframe',mode:'drawn',
    source:{structure:'paths',geometry:'drawn',extendDrawnPath:true,
      customPath:[[-.28,.15],[.14,.29],[.45,.50],[.77,.69],[1.25,.89]],
      drawnAnchors:[2],drawnCorners:[2],crossingMode:'weave',
      construction:'ribbon',motif:'solid'}},
  ...RADIAL_MODES.map(mode=>({
    id:'radial-'+mode,mode,source:{structure:'radial',radialMode:mode,
      rayCount:19,rayCoverage:92,rayTwist:39,rayCore:22,
      rayRotation:16,fieldCenterX:47,fieldCenterY:54,
      composition:'single',motif:'solid'}
  })),
  ...REGION_MODES.map(mode=>({
    id:'regions-'+mode,mode,source:{structure:'regions',regionMode:mode,
      regionCount:18,regionJitter:55,regionSides:7,
      fieldCenterX:52,fieldCenterY:48,dividerMode:'none',
      motif:'solid'}
  }))
];
assert.equal(all.length,12,'Must cover all five Radial, five Regions and two Paths conditions');
const cases=all.slice(shard*4,(shard+1)*4);
assert.equal(cases.length,4);
const browser=await chromium.launch({headless:true,
  ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{})});
const evidence=[],errors=[];
const current=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const sourceFieldsStable=(before,actual,expectedCamera,label)=>{
  assert.deepEqual(actual,normalizeRecipe({...before,...expectedCamera}),
    label+': camera buttons changed generation, styling, locks or hidden source fields');
};
const sameWorld=(zoom,panX,panY,label)=>{
  const small=viewCamera(600,1300,zoom,{panX,panY});
  const native=viewCamera(OUTPUT_WIDTH,OUTPUT_HEIGHT,zoom,{panX,panY});
  for(const side of ['left','right','top','bottom'])
    assert.ok(Math.abs(small.viewBounds[side]-native.viewBounds[side])<1e-8,
      label+': PNG and preview sample different world '+side);
};
try{
  const context=await browser.newContext({viewport:{width:412,height:892},
    acceptDownloads:true,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(14000);
  for(const scene of cases){
    const recipe=normalizeRecipe({
      seed:'a3-conditional-'+scene.id,...scene.source,
      material:'none',background:'black',palette:'electric',
      viewZoom:.8,viewPanX:10,viewPanY:-5,
      positionX:4,positionY:-3
    });
    const record={id:scene.id,structure:recipe.structure,mode:scene.mode};
    try{
      console.log('AGENT3_CONDITIONAL_STEP',scene.id,'open');
      await page.goto(origin+'/?r='+encodeRecipe(recipe),{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.body.classList.contains('mobile-preview-tools-ready'));
      assert.deepEqual(current(page),recipe,'URL source changed on first paint');
      const master=resolveScene(recipe);
      await page.locator('.mobile-preview-rail [data-zoom="out"]').click();
      let after=current(page);
      sourceFieldsStable(recipe,after,{viewZoom:.7},scene.id+'/zoom-out');
      sameWorld(after.viewZoom,after.viewPanX,after.viewPanY,scene.id+'/zoom-out');
      await page.locator('.mobile-preview-rail [data-zoom="in"]').click();
      after=current(page);
      sourceFieldsStable(recipe,after,{viewZoom:.8},scene.id+'/zoom-in');
      await page.locator('.mobile-preview-rail [data-zoom="fit"]').click();
      after=current(page);
      sourceFieldsStable(recipe,after,{viewZoom:1,viewPanX:0,viewPanY:0},
        scene.id+'/fit');
      assert.equal(await page.locator('.mobile-zoom-level').textContent(),'100%');
      assert.equal(await page.locator('.mobile-preview-rail [data-zoom="fit"]').isDisabled(),true);
      assert.deepEqual(resolveScene(after).stripes,master.stripes,
        scene.id+': source geometry regenerated during only camera operations');
      sameWorld(1,0,0,scene.id+'/fit');
      await page.screenshot({path:join(out,scene.id+'-fit.png'),
        animations:'disabled'});
      record.camera={start:[.8,10,-5],steps:['out to .7','in to .8','fit to 1 and pan 0'],
        sourceGeometryStable:true,composition:[after.positionX,after.positionY]};
      console.log('AGENT3_CONDITIONAL_STEP',scene.id,'camera passed; download');

      const awaited=page.waitForEvent('download',{timeout:120000});
      await page.locator('#mobileDownload').click();
      const download=await awaited;
      const bytes=await readFile(await download.path());
      assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
      assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],
        [OUTPUT_WIDTH,OUTPUT_HEIGHT],scene.id+' native IHDR');
      assert.ok(download.suggestedFilename().includes(
        after.seed+'-'+OUTPUT_WIDTH+'x'+OUTPUT_HEIGHT));
      assert.deepEqual(extractPngRecipe(bytes),after,
        scene.id+' native Download lost exact normalized recipe');
      const parity=await page.evaluate(async({base64,recipe})=>{
        const {drawWallpaper}=await import('/src/renderer.js');
        const img=new Image();
        await new Promise((ok,fail)=>{
          img.onload=ok;img.onerror=()=>fail(Error('native PNG decode error'));
          img.src='data:image/png;base64,'+base64;
        });
        const w=300,h=650,scaled=document.createElement('canvas');
        scaled.width=w;scaled.height=h;
        const ctx=scaled.getContext('2d',{willReadFrequently:true});
        ctx.drawImage(img,0,0,w,h);
        const b=ctx.getImageData(0,0,w,h).data;
        const direct=document.createElement('canvas');
        direct.width=w;direct.height=h;
        drawWallpaper(direct,recipe);
        const a=direct.getContext('2d',{willReadFrequently:true})
          .getImageData(0,0,w,h).data;
        const ch=(arr,x,y)=>{
          const k=(y*w+x)*4;return [arr[k],arr[k+1],arr[k+2]];
        };
        const difference=(p,q)=>Math.max(...p.map((n,i)=>Math.abs(n-q[i])));
        let stable=0,coloured=0,mismatch=0,colouredMismatch=0;
        const buckets=new Set();
        for(let y=10;y<h-10;y+=9)for(let x=10;x<w-10;x+=9){
          const a0=ch(a,x,y),b0=ch(b,x,y);
          buckets.add(b0.map(n=>Math.round(n/24)).join(':'));
          if([[2,0],[-2,0],[0,2],[0,-2],[2,2],[-2,-2]]
            .some(([dx,dy])=>difference(a0,ch(a,x+dx,y+dy))>8))continue;
          stable++;
          const ink=Math.max(...a0)>75&&Math.max(...a0)-Math.min(...a0)>36;
          if(ink)coloured++;
          if(difference(a0,b0)>28){
            mismatch++;if(ink)colouredMismatch++;
          }
        }
        // Complement strict *flat-ink* samples with a foreground-positive
        // metric for narrow spokes and high-frequency dots. A supersampled
        // 3024×6552 PNG can shift an edge by ~1 display pixel when decoded
        // to 300×650. Instead of declaring these modes empty, require that
        // each direct-rendered saturated foreground sample has a near-pixel
        // native colour match. Background-only images cannot pass.
        let fineForeground=0,fineUnmatched=0;
        for(let y=2;y<h-2;y+=2)for(let x=2;x<w-2;x+=2){
          const original=ch(a,x,y);
          if(Math.max(...original)<=75||
            Math.max(...original)-Math.min(...original)<=36)continue;
          fineForeground++;
          let best=Infinity;
          for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)
            best=Math.min(best,difference(original,ch(b,x+dx,y+dy)));
          if(best>58)fineUnmatched++;
        }
        return {decoded:[img.naturalWidth,img.naturalHeight],
          stable,coloured,mismatch,colouredMismatch,colorBuckets:buckets.size,
          mismatchRatio:stable?mismatch/stable:1,
          colouredMismatchRatio:coloured?colouredMismatch/coloured:null,
          fineForeground,fineUnmatched,
          fineUnmatchedRatio:fineForeground?fineUnmatched/fineForeground:1};
      },{base64:bytes.toString('base64'),recipe:after});
      assert.deepEqual(parity.decoded,[OUTPUT_WIDTH,OUTPUT_HEIGHT]);
      console.log('AGENT3_CONDITIONAL_METRICS',scene.id,JSON.stringify(parity));
      assert.ok(parity.colorBuckets>=10,'Downloaded mode lost meaningful colour variety');
      assert.ok(parity.stable>=150,scene.id+': insufficient stable source pixel checks');
      assert.ok(parity.fineForeground>=70,
        scene.id+': no meaningful directly-rendered foreground to verify');
      assert.ok(parity.fineUnmatchedRatio<=.12,
        scene.id+': edge-aware native foreground image disagrees with source: '+JSON.stringify(parity));
      assert.ok(parity.mismatchRatio<=.04,
        scene.id+': stable native pixels disagree with source renderer: '+JSON.stringify(parity));
      if(parity.coloured>=35)assert.ok(parity.colouredMismatchRatio<=.06,
        scene.id+': stable painted ink disagrees with renderer: '+JSON.stringify(parity));
      record.native={dimension:[OUTPUT_WIDTH,OUTPUT_HEIGHT],size:bytes.length,
        sha256:createHash('sha256').update(bytes).digest('hex'),
        sourceRecipePreserved:true,parity};
      evidence.push(record);
      console.log('AGENT3_CONDITIONAL_QUALIFIED',JSON.stringify(record));
    }catch(e){
      const failure={id:scene.id,message:String(e),stack:e.stack,record};
      errors.push(failure);
      console.error('AGENT3_CONDITIONAL_FAILURE',JSON.stringify(failure));
      await page.screenshot({path:join(out,scene.id+'-failure.png'),
        animations:'disabled',timeout:5000}).catch(()=>{});
    }
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:errors.length?'NOT VERIFIED':'four production conditional native exports verified',
    shard,cases:cases.map(x=>x.id),evidence,errors,
    exclusions:['Physical Android GPU and OS file picker',
      'All possible combinations of material, motif, custom overlay and construction',
      'Native zoomed/panned raster at each intermediate camera step (world bounds are tested)']
  },null,2));
  assert.deepEqual(errors,[],'Camera and actual conditional native export acceptance failed');
  console.log('AGENT3_CONDITIONAL_EXPORT_SHARD_SUCCESS',shard);
}finally{await browser.close();}
