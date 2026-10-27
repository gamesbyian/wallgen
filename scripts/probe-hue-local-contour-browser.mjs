#!/usr/bin/env node
// Research-only actual renderer contour inset, not a production fitter.
// Not used by the product's ≤6+10 automatic inverse-paint budget.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dir=resolve(process.argv[2]||'artifacts/r0-contour-inset');
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
  const factors=[0,.2,.4,.6,.8,1.1,1.4];
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
    // Masks are contour-traced in source downsample pixel coordinates.
    // The shapes' existing render owner normalizes radius by their maximum
    // vertex distance, so update radius to cancel that hidden re-scaling.
    const contourInset=(shape,edit,amount)=>{
      const next=structuredClone(shape),geometry=next.geometry;
      const [,,vw,vh]=geometry.viewBox;
      const ox=vw/2,oy=vh/2;
      const sourceW=277,sourceH=600;
      const minX=edit.x*sourceW-vw/2,minY=edit.y*sourceH-vh/2;
      const maxRadius=g=>Math.max(1e-6,...g.components.flatMap(c=>
        [c.outer,...c.holes].flatMap(r=>r.map(([x,y])=>
          Math.hypot(x-ox,y-oy)))));
      const oldRadius=maxRadius(geometry);
      const normal=(a,b)=>{
        const x=b[0]-a[0],y=b[1]-a[1],length=Math.hypot(x,y);
        return length>1e-8?[-y/length,x/length]:[0,0];
      };
      const advance=ring=>ring.map((vertex,index)=>{
        if(!amount)return vertex;
        const previous=ring[(index+ring.length-1)%ring.length],
          following=ring[(index+1)%ring.length];
        const first=normal(previous,vertex),last=normal(vertex,following);
        const dot=first[0]*last[0]+first[1]*last[1];
        const factor=amount/Math.max(.25,1+dot);
        const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
        const dx=clamp(factor*(first[0]+last[0]),-amount*1.5,amount*1.5);
        const dy=clamp(factor*(first[1]+last[1]),-amount*1.5,amount*1.5);
        const globalX=minX+vertex[0],globalY=minY+vertex[1];
        const cropX=Math.abs(globalX)<.04||Math.abs(globalX-sourceW)<.04;
        const cropY=Math.abs(globalY)<.04||Math.abs(globalY-sourceH)<.04;
        return [clamp(vertex[0]+(cropX?0:dx),0,vw),
          clamp(vertex[1]+(cropY?0:dy),0,vh)];
      });
      geometry.components=geometry.components.map(component=>({
        ...component,outer:advance(component.outer),
        holes:component.holes.map(advance)
      }));
      return {shape:next,radiusFactor:maxRadius(geometry)/oldRadius};
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
        const nextShapes=[],nextEdits=[];
        for(const item of recipe.scatteredShapeOverrides){
          const edit=base.find(x=>x.index===item.index);
          const moved=contourInset(item.shape,edit,factor);
          nextShapes.push({...item,shape:moved.shape});
          nextEdits.push({...edit,radius:edit.radius*moved.radiusFactor});
        }
        const probe=normalizeRecipe({...recipe,
          scatteredShapeOverrides:nextShapes,scatteredOverrides:nextEdits});
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
          png:surface.toDataURL('image/png')});
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
      console.log('CONTOUR_INSET_INELIGIBLE '+record.id);continue;
    }
    assert.equal(record.variants.length,factors.length);
    console.log('CONTOUR_INSET_R0 '+JSON.stringify({
      id:record.id,baseline:record.baseline,winningFactor:record.winningFactor,
      bestError:record.bestError,delta:record.delta,
      variants:record.variants.map(({png,...other})=>other)}));
    for(const variant of record.variants){
      if(!variant.png)continue;
      const bytes=Buffer.from(variant.png.split(',')[1],'base64');
      await writeFile(join(dir,record.id+'.contour-'+
        String(variant.factor).replace('.','p')+'.png'),bytes);
    }
    delete record.originalRecipe;
    record.variants=record.variants.map(({png,...other})=>other);
  }
  await writeFile(join(dir,'contour-inset-probe.json'),JSON.stringify({
    schema:'roygbiv-visible-hue-local-contour-offset-probe/v1',
    disclaimer:'Research-only real renderer, no production painter-budget changes',
    controls:data},null,2)+'\n');
}finally{await browser?.close();server.close();}
