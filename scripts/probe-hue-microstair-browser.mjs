#!/usr/bin/env node
// Research-only test of pixel-grid micro-staircase smoothing in the existing
// canonical imported per-hue vector shapes, using the real painter/score.
// Nothing here affects normal inverse fitting, 6+10, Undo or private source.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dir=resolve(process.argv[2]||'artifacts/r0-microstair');
const extensions={'.js':'text/javascript','.json':'application/json',
  '.png':'image/png','.html':'text/html'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(path!==root&&!path.startsWith(root+'/')){res.writeHead(403).end();return;}
    const file=path===root?join(root,'index.html'):path;
    res.writeHead(200,{'Content-Type':extensions[extname(file)]||
      'application/octet-stream','Cache-Control':'no-store'})
      .end(await readFile(file));
  }catch{res.writeHead(404).end('Not found');}
});
let browser;
try{
  const {chromium}=await import('playwright');
  await mkdir(dir,{recursive:true});
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok);});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892}});
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const names=['01-vertical-straight','03-wave','04-jagged','05-hairpin',
    '06-loop','11-scattered-circles','16-offset-jagged'];
  const factors=[0,.12,.24,.36,.5];
  const data=await page.evaluate(async({names,factors,subdir})=>{
    const {drawWallpaper}=await import('/src/renderer.js');
    const {normalizeRecipe}=await import('/src/model.js');
    const {compareReconstructionPixels}=await import('/src/image-reconstruction.js');
    const {compareRainbowInkGeometry}=await import('/src/reconstruction-ink-geometry.js');
    const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
    const pixels=c=>c.getContext('2d',{willReadFrequently:true})
      .getImageData(0,0,c.width,c.height);
    const source=async id=>{
      const bmp=await createImageBitmap(await(await fetch(
        '/'+subdir+'/'+id+'.r0-source-preview.png')).blob());
      const c=canvas(96,208);c.getContext('2d').drawImage(bmp,0,0);bmp.close();
      return pixels(c);
    };
    // Characterize source-analysis pixel staircases, not true macro corners.
    // Micro-staircase vertices have a <=1.5px incident edge and a second
    // incident edge <=12px. Long polygon corners/holes/crops stay intact.
    // Preserve canonical bounding radius by proportional compensation.
    const microSmooth=(shape,edit,amount)=>{
      const next=structuredClone(shape),g=next.geometry;
      const [,,vw,vh]=g.viewBox;
      const cx=vw/2,cy=vh/2;
      const radius=obj=>Math.max(1e-6,...obj.components.flatMap(c=>
        [c.outer,...c.holes].flatMap(r=>r.map(([x,y])=>
          Math.hypot(x-cx,y-cy)))));
      const orig=radius(g),sourceW=277,sourceH=600;
      const minX=edit.x*sourceW-vw/2,minY=edit.y*sourceH-vh/2;
      const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
      const smooth=ring=>ring.map((p,i)=>{
        if(amount===0)return p;
        const a=ring[(i+ring.length-1)%ring.length];
        const b=ring[(i+1)%ring.length];
        const prev=Math.hypot(p[0]-a[0],p[1]-a[1]);
        const next=Math.hypot(b[0]-p[0],b[1]-p[1]);
        if(!(Math.min(prev,next)<1.5&&Math.max(prev,next)<12))
          return p;
        const x=minX+p[0],y=minY+p[1];
        if(x<=.04||x>=sourceW-.04||y<=.04||y>=sourceH-.04)
          return p;
        // Local midpoint is a bounded edge anti-staircase hypothesis, not
        // a full-shape shrink (rejected by genuine optical #803 evidence).
        const dx=clamp(((a[0]+b[0])/2-p[0])*amount,-.65,.65);
        const dy=clamp(((a[1]+b[1])/2-p[1])*amount,-.65,.65);
        return [clamp(p[0]+dx,0,vw),clamp(p[1]+dy,0,vh)];
      });
      g.components=g.components.map(c=>({...c,
        outer:smooth(c.outer),holes:c.holes.map(smooth)}));
      return {shape:next,radiusFactor:radius(g)/orig};
    };
    const records=[];
    for(const id of names){
      const recipe=normalizeRecipe(await(await fetch(
        '/'+subdir+'/'+id+'.r0-best-inferred.recipe.json')).json());
      const truth=await source(id);
      const base=recipe.scatteredOverrides||[];
      const valid=recipe.structure==='regions'&&
        recipe.regionMode==='scattered'&&
        recipe.scatteredShapeKind==='imported'&&base.length===7;
      const variants=[];
      if(!valid){records.push({id,eligible:false});continue;}
      for(const factor of factors){
        const shapes=[],edits=[];
        for(const item of recipe.scatteredShapeOverrides){
          const edit=base.find(x=>x.index===item.index);
          const adjusted=microSmooth(item.shape,edit,factor);
          shapes.push({...item,shape:adjusted.shape});
          edits.push({...edit,radius:edit.radius*adjusted.radiusFactor});
        }
        const probe=normalizeRecipe({...recipe,
          scatteredShapeOverrides:shapes,scatteredOverrides:edits});
        if(probe.scatteredShapeOverrides?.length!==7){
          variants.push({factor,error:Infinity,invalid:true});continue;
        }
        const surface=canvas(96,208);drawWallpaper(surface,probe);
        const paint=pixels(surface);
        const error=compareReconstructionPixels(truth,paint);
        const geometry=compareRainbowInkGeometry(truth,paint,{withSkeleton:false});
        variants.push({factor,error,meanIoU:geometry.meanIoU,
          meanEdgeChamfer:geometry.meanEdgeChamfer,
          changedPixels:paint.data.reduce((n,v,i)=>n+(v!==truth.data[i]),0),
          png:surface.toDataURL('image/png'),
          recipe:factor===.5&&['05-hairpin','06-loop'].includes(id)?probe:null});
      }
      const baseline=variants.find(x=>x.factor===0);
      variants.sort((a,b)=>a.error-b.error);
      const best=variants[0];
      records.push({id,eligible:true,baseline:{
        factor:0,error:baseline.error,meanIoU:baseline.meanIoU,
        meanEdgeChamfer:baseline.meanEdgeChamfer},
        winningFactor:best.factor,bestError:best.error,
        delta:best.error-baseline.error,variants,
        originalRecipe:recipe});
    }
    return records;
  },{names,factors,subdir:dir.slice(root.length+1).replaceAll('\\','/')});
  for(const record of data){
    if(!record.eligible){
      console.log('MICROSTAIR_INELIGIBLE '+record.id);continue;
    }
    assert.equal(record.variants.length,factors.length);
    console.log('MICROSTAIR_R0 '+JSON.stringify({
      id:record.id,baseline:record.baseline,winningFactor:record.winningFactor,
      bestError:record.bestError,delta:record.delta,
      variants:record.variants.map(({png,recipe,...other})=>other)}));
    for(const variant of record.variants){
      if(!variant.png)continue;
      const bytes=Buffer.from(variant.png.split(',')[1],'base64');
      await writeFile(join(dir,record.id+'.microstair-'+
        String(variant.factor).replace('.','p')+'.png'),bytes);
    }
    for(const variant of record.variants){
      if(variant.recipe)
        await writeFile(join(dir,record.id+'.microstair-'+
          String(variant.factor).replace('.','p')+'.recipe.json'),
          JSON.stringify(variant.recipe,null,2)+'\n');
    }
    delete record.originalRecipe;
    record.variants=record.variants.map(({png,recipe,...other})=>other);
  }
  await writeFile(join(dir,'microstair-probe.json'),JSON.stringify({
    schema:'roygbiv-visible-hue-local-microstair-probe/v1',
    disclaimer:'Research-only real renderer, no production painter-budget changes',
    controls:data},null,2)+'\n');
}finally{await browser?.close();server.close();}
