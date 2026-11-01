#!/usr/bin/env node
// Source-matched real Chromium embroidery optical proof. Run this script on
// baseline and candidate with identical recipes/browser, then compare hashes.
// No screenshot placeholders, shader mock or application recipe changes.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {normalizeRecipe} from '../src/model.js';
import {compoundStitchRecipe} from './compound-stitch-fixture.mjs';

const root=resolve('.'),out=resolve('artifacts/embroidery-world-light');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const path=resolve(root,'.'+(name==='/'?'/index.html':name));
    if(!path.startsWith(root+'/')){res.writeHead(403).end();return;}
    res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream'})
      .end(await readFile(path));
  }catch{res.writeHead(404).end('not found');}
});
const listen=()=>new Promise((resolve,reject)=>{
  server.once('error',reject);server.listen(0,'127.0.0.1',resolve);
});
const treatment=(style)=>({
  id:'light-study',enabled:true,materialFamily:'embroidery',style,
  target:{scope:'all',role:'fill',ids:[],colorSlots:[]},pitch:5,relief:85,direction:38
});
const ribbon=(style)=>normalizeRecipe({
  seed:'thread-world-lamp-optics',family:'studio',palette:'classic',
  background:'black',material:'none',textureDisplacement:0,
  structure:'paths',composition:'single',construction:'ribbon',
  geometry:'loop',orientation:'diagonal',motif:'solid',outline:'none',
  stripeWidth:72,spread:54,chaos:0,individuality:0,
  stripeShadowStrength:0,glow:0,
  surfaceTreatments:[treatment(style)]
});
const region=(style)=>normalizeRecipe({
  ...compoundStitchRecipe('thread-world-lamp-compound'),
  surfaceTreatments:[treatment(style)]
});
const styles=[
  ['ribbon-satin',ribbon('satin')],
  ['ribbon-chain',ribbon('chain')],
  ['ribbon-fibre',ribbon('satin-fibre')],
  ['region-tatami',region('tatami')],
  ['region-fibre',region('tatami-fibre')]
];
const conditions=[
  ['off',{lightingMood:'off',lightStrength:85,shadowStrength:80}],
  ['northwest',{lightingMood:'daylight',lightDirection:'top-left',
    lightStrength:85,shadowStrength:80}],
  ['southeast',{lightingMood:'daylight',lightDirection:'bottom-right',
    lightStrength:85,shadowStrength:80}]
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
  for(const [name,base] of styles)for(const [kind,lighting] of conditions){
    const recipe=normalizeRecipe({...base,...lighting});
    const data=await page.evaluate(async recipe=>{
      const {drawWallpaper}=await import('/src/renderer.js');
      const {resolveScene}=await import('/src/model.js');
      const canvas=document.createElement('canvas');
      canvas.width=600;canvas.height=1300;
      const began=performance.now();
      drawWallpaper(canvas,recipe);
      const renderMs=performance.now()-began;
      const ctx=canvas.getContext('2d');
      let hole=null,island=null;
      if(recipe.structure==='regions'){
        const object=resolveScene(recipe).objects[0];
        if(object.rings?.length!==3)throw Error('Original hole/island source rings lost');
        const centre=ring=>({
          x:Math.round((Math.min(...ring.map(p=>p.x))+Math.max(...ring.map(p=>p.x)))/2),
          y:Math.round((Math.min(...ring.map(p=>p.y))+Math.max(...ring.map(p=>p.y)))/2)
        });
        const h=centre(object.rings[1]),is=centre(object.rings[2]);
        hole=[...ctx.getImageData(h.x,h.y,1,1).data];
        island=[...ctx.getImageData(is.x,is.y,1,1).data];
      }
      return {png:canvas.toDataURL('image/png'),renderMs,hole,island};
    },recipe);
    const bytes=Buffer.from(data.png.split(',')[1],'base64');
    assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16),600);
    assert.equal(bytes.readUInt32BE(20),1300);
    const id=name+'-'+kind;
    await writeFile(join(out,id+'.png'),bytes);
    const sha256=createHash('sha256').update(bytes).digest('hex');
    if(data.hole){
      assert.equal(data.hole[3],255,'source hole must remain opaque background');
      assert.ok(data.hole[0]<180&&data.hole[1]<180,
        'true source cutout must never acquire dyed thread');
      assert.ok(data.island[3]===255&&data.island[0]+data.island[1]+data.island[2]>35,
        'original detached island must remain visible');
    }
    records.push({id,sha256,bytes:bytes.length,renderMs:data.renderMs,
      hole:data.hole,island:data.island});
  }
  assert.deepEqual(errors,[]);
  for(const [name] of styles){
    assert.notEqual(records.find(r=>r.id===name+'-northwest').sha256,
      records.find(r=>r.id===name+'-southeast').sha256,
      'rendered light direction must affect genuine pixels: '+name);
  }
  const report={environment:'same Linux headless Chromium when paired; not Pixel 6 Pro',
    source:process.env.GITHUB_SHA||'local',records};
  await writeFile(join(out,'manifest.json'),JSON.stringify(report,null,2)+'\n');
  console.log('EMBROIDERY_WORLD_LIGHT_CHROMIUM',JSON.stringify(report));
}finally{
  await browser?.close();await new Promise(done=>server.close(done));
}
