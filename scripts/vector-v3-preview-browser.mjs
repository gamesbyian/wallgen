#!/usr/bin/env node
// One-shot actual Chromium proof of pre-release v3 vector preview.
// This does not claim full authoring UI, physical Pixel or TalkBack proof.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts/vector-v3-preview');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.png':'image/png',
  '.json':'application/json'};
const server=createServer(async(req,res)=>{
  try{
    const abs=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(abs!==root&&!abs.startsWith(root+'/')){res.writeHead(403).end();return;}
    const file=abs===root?join(root,'index.html'):abs;
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(file));
  }catch{res.writeHead(404).end('Not Found');}
});
const source={
  space:'normalized-design',closed:false,start:{id:'begin',point:[.08,.14]},
  segments:[
    {kind:'cubic',to:{id:'bend',point:[.55,.65]},
      controlOut:[.32,.05],controlIn:[.23,.81]},
    {kind:'cubic',to:{id:'finish',point:[.91,.89]},
      controlOut:[.87,.63],controlIn:[.72,.92]}
  ],nodeModes:{bend:'independent'}
};
const recipe=normalizeRecipe({seed:'v3-real-pixels-20261030',structure:'paths',
  geometry:'drawn',vectorPath:source,construction:'ribbon',
  stripeWidth:45,spread:36,material:'none',outline:'none'});
const current=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const report=[],pageErrors=[];let browser;
try{
  await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
  browser=await chromium.launch({headless:true});
  for(const [width,height] of [[320,700],[412,892]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:true,
      hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:1});
    page.setDefaultTimeout(16000);
    page.on('pageerror',e=>pageErrors.push(String(e)));
    try{
      await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(recipe),
        {waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
        null,{timeout:85000});
      assert.deepEqual(current(page),recipe,'URL import must keep all genuine cubic nodes');
      const summary=await page.locator('#preview').evaluate(canvas=>{
        const ctx=canvas.getContext('2d'),data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        let colored=0,hash=2166136261;
        for(let y=4;y<canvas.height;y+=12){
          for(let x=4;x<canvas.width;x+=12){
            const i=(y*canvas.width+x)*4;
            if(Math.max(data[i],data[i+1],data[i+2])>45)colored++;
            for(let c=0;c<3;c++){hash^=data[i+c];hash=Math.imul(hash,16777619);}
          }
        }
        return {colored,hash:hash>>>0,w:canvas.width,h:canvas.height};
      });
      assert.ok(summary.colored>60,'real rendered v3 artwork should contain rainbow ink');
      assert.ok(summary.hash!==0);
      await page.screenshot({path:join(out,width+'x'+height+'.png'),animations:'disabled'});
      const before=current(page);
      // A real source form change must preserve the authored v3 curve.
      await page.evaluate(()=>{
        const el=document.querySelector('input[name="spread"]');
        el.value='44';el.dispatchEvent(new Event('change',{bubbles:true}));
      });
      await page.waitForFunction(()=>new URL(location.href).searchParams.has('r'));
      const updated=current(page);
      assert.equal(updated.version,3);
      assert.deepEqual(updated.vectorPath,before.vectorPath);
      assert.equal(updated.spread,44);
      // The historical sampled Draw editor must refuse this source rather
      // than saving a lossy polyline and claiming it is the same Bézier.
      const beforeBlock=current(page);
      await page.locator('#drawPathToggle').click();
      assert.equal(await page.locator('#drawOverlay').isHidden(),true);
      assert.deepEqual(current(page),beforeBlock);
      report.push({viewport:[width,height],inkSamples:summary.colored,
        pixelHash:summary.hash,v3Preserved:true,oldDrawRefused:true});
    }finally{await page.close();}
  }
  assert.deepEqual(pageErrors,[]);
  await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));
  console.log('VECTOR_V3_BROWSER_PASS '+JSON.stringify(report));
}finally{
  await browser?.close();
  await new Promise(ok=>server.close(ok));
}
