#!/usr/bin/env node
// Real Chromium production painter acceptance for sand contour relief.
// Source-authored geometry, actual Canvas2D output and verified negative space.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {extname,resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {compoundStitchRecipe} from './compound-stitch-fixture.mjs';
import {normalizeRecipe} from '../src/model.js';

const root=resolve('.'),out=resolve('artifacts/sand-contour-browser');
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+'/')&&file!==root){res.writeHead(403).end();return;}
  const target=file===root?join(root,'index.html'):file;
  try{const content=await readFile(target);
    res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream'});
    res.end(content);}catch{res.writeHead(404).end('not found');}
});
const listen=()=>new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok)});
await listen();
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:640,height:1380},deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const shape=normalizeRecipe({...compoundStitchRecipe('sand-compound-s2'),
    material:'sand-mandala',textureCoverage:'stripes',textureStrength:90,
    textureScale:37});
  const nested=normalizeRecipe({...shape,
    nestedShapeContours:{enabled:true,objectId:'region-0',count:7,
      strokeWidth:2,gap:2.5,firstInset:1}});
  const scenes=[
    ['01-sand-wave',normalizeRecipe({seed:'sand-wave-s2',family:'studio',
      geometry:'wave',motif:'solid',construction:'ribbon',
      material:'sand-mandala',textureCoverage:'stripes',textureStrength:90,
      textureScale:37,stripeWidth:71,spread:48,outline:'none'})],
    ['02-sand-loop',normalizeRecipe({seed:'sand-loop-s2',family:'studio',
      geometry:'loop',loopSweep:290,loopRadius:72,construction:'ribbon',
      crossingMode:'under',motif:'solid',material:'sand-mandala',
      textureCoverage:'stripes',textureStrength:83,outline:'none'})],
    ['03-sand-compound',shape],
    ['04-sand-nested',nested]
  ];
  // Same source artwork, same vector geometry, only the material variant
  // differs. This makes before/after optical comparison unambiguous.
  scenes.push(...scenes.slice(0,4).map(([name,recipe],i)=>[
    ['05-beaded-wave','06-beaded-loop','07-beaded-compound','08-beaded-nested'][i],
    normalizeRecipe({...recipe,material:'sand-beaded'})
  ]));
  scenes.push(...scenes.slice(0,4).map(([,recipe],i)=>[
    ['11-filigree-wave','12-filigree-loop','13-filigree-compound','14-filigree-nested'][i],
    normalizeRecipe({...recipe,material:'sand-filigree'})
  ]));
  const results=[];
  for(const [name,recipe] of scenes){
    const data=await page.evaluate(async recipe=>{
      const {drawWallpaper}=await import('/src/renderer.js');
      const {resolveScene}=await import('/src/model.js');
      const canvas=document.createElement('canvas');
      canvas.width=600;canvas.height=1300;
      drawWallpaper(canvas,recipe);
      const ctx=canvas.getContext('2d');
      const source=resolveScene(recipe).objects?.[0];
      let hole=null,island=null;
      if(recipe.scatteredShapeKind==='imported'&&source?.rings?.length>=3){
        const centre=ring=>{
          const xs=ring.map(p=>p.x),ys=ring.map(p=>p.y);
          return [Math.round((Math.min(...xs)+Math.max(...xs))/2),
            Math.round((Math.min(...ys)+Math.max(...ys))/2)];
        };
        const [hx,hy]=centre(source.rings[1]);
        const [ix,iy]=centre(source.rings[2]);
        hole={point:[hx,hy],rgba:[...ctx.getImageData(hx,hy,1,1).data]};
        island={point:[ix,iy],rgba:[...ctx.getImageData(ix,iy,1,1).data]};
      }
      return {png:canvas.toDataURL('image/png'),hole,island};
    },recipe);
    const png=Buffer.from(data.png.split(',')[1],'base64');
    assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16),600);
    assert.equal(png.readUInt32BE(20),1300);
    await writeFile(join(out,name+'.png'),png);
    if(name==='03-sand-compound'||name==='07-beaded-compound'){
      assert.deepEqual(data.hole.rgba,[0,0,0,255],
        'a true compound silhouette hole must remain unpainted');
      assert.ok(data.island.rgba[0]+data.island.rgba[1]+data.island.rgba[2]>35,
        'detached island must remain real coloured geometry');
    }
    results.push({name,bytes:png.length,hole:data.hole,island:data.island});
  }
  console.log('SAND_CONTOUR_CHROMIUM_PASS',JSON.stringify(results));
  await page.close();
}finally{await browser.close();await new Promise(r=>server.close(r));}
