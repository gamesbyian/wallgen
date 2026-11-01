#!/usr/bin/env node
// Production Canvas2D optical comparison of genuine lower-yarn contact shadows.
// Two source revisions must use the identical source recipes and Chromium.
// The fixture never invents a raster mask or substitutes a fake stitch painter.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {normalizeRecipe} from '../src/model.js';

const root=resolve('.'),out=resolve('artifacts/thread-contact-optics');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    const path=resolve(root,'.'+(name==='/'?'/index.html':name));
    if(!path.startsWith(root+'/')){res.writeHead(403).end();return;}
    // Read the file before sending HTTP 200: the baseline intentionally lacks
    // the candidate-only contact module, and that expected 404 must never
    // crash the proof server with ERR_HTTP_HEADERS_SENT.
    const bytes=await readFile(path);
    res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream'})
      .end(bytes);
  }catch(error){
    if(!res.headersSent)res.writeHead(404).end('not found');
    else res.destroy(error);
  }
});
const listen=()=>new Promise((ok,fail)=>{
  server.once('error',fail);server.listen(0,'127.0.0.1',ok);
});
const style=(kind)=>({
  id:'source-thread-contacts',enabled:true,materialFamily:'embroidery',style:kind,
  pitch:7,relief:92,direction:38,
  target:{scope:'all',role:'fill',colorSlots:[],ids:[]}
});
const base=normalizeRecipe({
  seed:'true-source-satin-contact-figure-eight',family:'studio',
  palette:'classic',background:'black',material:'none',
  structure:'paths',composition:'single',construction:'ribbon',
  geometry:'drawn',customPath:[[.2,.2],[.8,.8],[.2,.8],[.8,.2]],
  stripeWidth:90,spread:45,geometrySafety:false,
  motif:'solid',lineStyle:'continuous',outline:'none',
  stripeShadowStrength:0,glow:0,
  surfaceTreatments:[style('satin')]
});
const scenes=[
  ['satin-over-off',{lightingMood:'off',crossingMode:'over'}],
  ['satin-over-nw',{lightingMood:'daylight',lightDirection:'top-left',
    lightStrength:90,shadowStrength:85,crossingMode:'over'}],
  ['satin-over-se',{lightingMood:'daylight',lightDirection:'bottom-right',
    lightStrength:90,shadowStrength:85,crossingMode:'over'}],
  ['satin-under-nw',{lightingMood:'daylight',lightDirection:'top-left',
    lightStrength:90,shadowStrength:85,crossingMode:'under'}],
  ['satin-weave-nw',{lightingMood:'daylight',lightDirection:'top-left',
    lightStrength:90,shadowStrength:85,crossingMode:'weave'}],
  ['soft-over-nw',{lightingMood:'daylight',lightDirection:'top-left',
    lightStrength:90,shadowStrength:85,crossingMode:'over',
    surfaceTreatments:[style('satin-soft')]}],
  ['running-over-nw',{lightingMood:'daylight',lightDirection:'top-left',
    lightStrength:90,shadowStrength:85,crossingMode:'over',
    surfaceTreatments:[style('running')]}]
];
await listen();
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:412,height:892},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',
    {waitUntil:'domcontentloaded'});
  await mkdir(out,{recursive:true});
  const records=[];
  for(const [name,change] of scenes){
    const recipe=normalizeRecipe({...base,...change});
    const sampled=await page.evaluate(async recipe=>{
      const {drawWallpaper}=await import('/src/renderer.js');
      const {resolveScene}=await import('/src/model.js');
      const scene=resolveScene(recipe);
      const canvas=document.createElement('canvas');
      canvas.width=600;canvas.height=1300;
      const begin=performance.now();
      drawWallpaper(canvas,recipe);
      const renderMs=performance.now()-begin;
      const png=canvas.toDataURL('image/png');
      let contacts=null;
      try{
        const {planSatinThreadContacts}=await import('/src/thread-contact-shadows.js');
        const {sandRibbonLighting}=await import('/src/sand-lighting.js');
        const original=scene.stripes[3];
        const lighting=sandRibbonLighting(scene);
        contacts=planSatinThreadContacts(original,scene.extent,
          recipe.surfaceTreatments[0],lighting)?.contacts??null;
      }catch(error){
        if(!String(error).includes('Failed to fetch dynamically imported module'))
          throw error;
      }
      return {png,renderMs,contacts};
    },recipe);
    const bytes=Buffer.from(sampled.png.split(',')[1],'base64');
    assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16),600);
    assert.equal(bytes.readUInt32BE(20),1300);
    await writeFile(join(out,name+'.png'),bytes);
    records.push({name,
      sha256:createHash('sha256').update(bytes).digest('hex'),
      bytes:bytes.length,renderMs:sampled.renderMs,
      contactsOnMidStripe:sampled.contacts});
  }
  assert.deepEqual(errors,[]);
  await writeFile(join(out,'report.json'),JSON.stringify({
    source:process.env.GITHUB_SHA||'local',
    environment:'Linux headless Chromium, production drawWallpaper; not Pixel hardware',
    records
  },null,2)+'\n');
  console.log('SOURCE_THREAD_CONTACT_RENDER',JSON.stringify(records));
}finally{
  await browser?.close();
  await new Promise(done=>server.close(done));
}
