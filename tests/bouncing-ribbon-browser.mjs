#!/usr/bin/env node
// Production Canvas2D/worker PNG evidence for a real bouncing centerline.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {normalizeRecipe} from '../src/model.js';
import {embedPngMetadata,extractPngRecipe} from '../src/png-metadata.js';

const out='artifacts/bouncing-ribbon-browser';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:412,height:892}});
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(process.env.ROYGBIV_URL||'http://127.0.0.1:4173/',
    {waitUntil:'domcontentloaded'});
  const result=await page.evaluate(async()=>{
    const ensure=(value,message)=>{if(!value)throw Error(message);};
    const {drawWallpaper}=await import('/src/renderer.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const base={
      seed:'bounce-production-proof',structure:'paths',geometry:'scalloped',
      motif:'solid',lineStyle:'continuous',individuality:0,
      background:'white',material:'none',lightingMood:'off',
      lightStrength:0,shadowStrength:0,stripeShadowStrength:0,
      outline:'none',glow:0,textureDisplacement:0
    };
    const width=600,height=1300;
    const paint=(extra,w=width,h=height)=>{
      const canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      drawWallpaper(canvas,{...base,...extra});
      return {canvas,image:canvas.toDataURL('image/png'),
        data:canvas.getContext('2d',{willReadFrequently:true})
          .getImageData(0,0,w,h).data};
    };
    const low={orientation:'horizontal',construction:'ribbon',stripeWidth:75,
      shapeFrequency:12,shapeDepth:95,startTaper:0,endTaper:0};
    const high={orientation:'diagonal',diagonalRotation:26,
      construction:'stroke',stripeWidth:35,shapeFrequency:88,
      shapeDepth:100,startTaper:35,endTaper:75,viewZoom:.8};
    const lowPaint=paint(low);
    const highPaint=paint(high);
    const zeroPaint=paint({...high,shapeDepth:0});
    // Exact user-reported settings, with an explicit black background and
    // seven rainbow pigments. Export and preview must share the same fill.
    const owner={orientation:'vertical',construction:'ribbon',
      shapeFrequency:42,shapeDepth:79,stripeWidth:65,
      background:'black',startTaper:0,endTaper:0};
    const ownerPaint=paint(owner);
    const {resolveScene}=await import('/src/model.js');
    const {samplePath,widthAt,bouncingPitch}=await import('/src/path-geometry.js');
    const {stripeFillPath}=await import('/src/renderer.js');
    const {viewCamera}=await import('/src/view-camera.js');
    const ownerScene=resolveScene({...base,...owner});
    const ownerCamera=viewCamera(width,height,ownerScene.viewZoom);
    let ownerProbes=0;
    for(const stripe of ownerScene.stripes){
      const p=bouncingPitch(owner.shapeFrequency);
      for(const station of [-p,-p*.01,0,p*.01,p]){
        const point=samplePath(stripe,station,ownerScene.extent);
        const half=widthAt(stripe,station,ownerScene.extent)/2;
        for(const ratio of [-.5,0,.5]){
          const px=point.x+point.nx*half*ratio;
          const py=point.y+point.ny*half*ratio;
          const cos=Math.cos(ownerScene.angle),sin=Math.sin(ownerScene.angle);
          const wx=ownerScene.centerX+px*cos-py*sin;
          const wy=ownerScene.centerY+px*sin+py*cos;
          const ix=Math.round(wx*ownerCamera.scaleX+ownerCamera.offsetX);
          const iy=Math.round(wy*ownerCamera.scaleY+ownerCamera.offsetY);
          if(ix<2||iy<2||ix>=width-2||iy>=height-2)continue;
          const index=(iy*width+ix)*4;
          ensure(Math.max(...ownerPaint.data.subarray(index,index+3))>45,
            'production preview has a background hole inside the owned stripe');
          ownerProbes++;
        }
      }
    }
    ensure(ownerProbes>25,'check enough actual ribbon join pixels');
    // Independently rasterize the production fill path in multiple sizes and
    // orientations. Check both normal interior points and full circular
    // neighborhoods at contacts (where the old winding rule left diamonds).
    const cases=[
      {frequency:42,height:79,physicalWidth:3,orientation:'vertical'},
      {frequency:42,height:79,physicalWidth:28,orientation:'vertical'},
      {frequency:42,height:79,physicalWidth:85,orientation:'vertical'},
      {frequency:90,height:100,physicalWidth:85,orientation:'horizontal'},
      {frequency:15,height:35,physicalWidth:68,orientation:'diagonal'},
      {frequency:65,height:95,physicalWidth:42,orientation:'diagonal',
        startTaper:65,endTaper:80,stripeEdgeStyle:'wavy',
        stripeEdgeDepth:55,stripeEdgePhaseB:50}
    ];
    let sweptProbes=0;
    for(const spec of cases){
      const scene=resolveScene({...base,orientation:spec.orientation,
        shapeFrequency:spec.frequency,shapeDepth:spec.height,
        stripeEdgeStyle:spec.stripeEdgeStyle??'straight',
        stripeEdgeDepth:spec.stripeEdgeDepth??0,
        stripeEdgePhaseB:spec.stripeEdgePhaseB??0,
        startTaper:spec.startTaper??0,endTaper:spec.endTaper??0});
      const stripe={...scene.stripes[3],width:spec.physicalWidth,
        segmentStart:-300,segmentEnd:300};
      const c=document.createElement('canvas');c.width=1000;c.height=1000;
      const g=c.getContext('2d',{willReadFrequently:true});
      g.fillStyle='#000';g.fillRect(0,0,1000,1000);
      g.save();g.translate(500,500);g.rotate(scene.angle);
      g.translate(0,-stripe.center);
      g.fillStyle='#f0f';g.fill(stripeFillPath(stripe,scene.extent,scene));
      g.restore();
      const pixels=g.getImageData(0,0,1000,1000).data;
      const cos=Math.cos(scene.angle),sin=Math.sin(scene.angle);
      const probe=(x,y)=>{
        const localY=y-stripe.center;
        const ix=Math.round(500+x*cos-localY*sin);
        const iy=Math.round(500+x*sin+localY*cos);
        if(ix<3||iy<3||ix>=997||iy>=997)return;
        ensure(pixels[(iy*1000+ix)*4]>90,
          'background pixel inside swept stripe, '+JSON.stringify(spec)+
          ' at '+x+','+y);
        sweptProbes++;
      };
      const pitch=bouncingPitch(spec.frequency);
      for(const contact of [-pitch,0,pitch]){
        if(Math.abs(contact)>295)continue;
        for(const delta of [-3,-1,-.25,0,.25,1,3]){
          const station=contact+delta;
          const p=samplePath(stripe,station,scene.extent);
          const half=widthAt(stripe,station,scene.extent)/2;
          for(const ratio of [-.6,0,.6])
            probe(p.x+p.nx*half*ratio,p.y+p.ny*half*ratio);
        }
        const p=samplePath(stripe,contact,scene.extent);
        const radius=widthAt(stripe,contact,scene.extent)*.24;
        for(let i=0;i<16;i++){
          const a=i*Math.PI/8;
          probe(p.x+Math.cos(a)*radius,p.y+Math.sin(a)*radius);
        }
      }
    }
    ensure(sweptProbes>250,'rasterized sufficient varied join interiors');
    let changed=0,coloured=0;
    for(let i=0;i<highPaint.data.length;i+=4){
      if(Math.max(...highPaint.data.subarray(i,i+3))-
        Math.min(...highPaint.data.subarray(i,i+3))>40)coloured++;
      if(Math.max(...[0,1,2].map(k=>Math.abs(
        highPaint.data[i+k]-zeroPaint.data[i+k])))>15)changed++;
    }
    // Reference renderer and production PNG worker must agree on the same
    // centered trajectory, rather than having separate bounce paths.
    const workerBlob=await exportWallpaperInWorker({
      recipe:{...base,...high},width:320,height:700});
    const workerBitmap=await createImageBitmap(workerBlob);
    const workerCanvas=document.createElement('canvas');
    workerCanvas.width=320;workerCanvas.height=700;
    workerCanvas.getContext('2d').drawImage(workerBitmap,0,0);
    const workerPixels=workerCanvas.getContext('2d',
      {willReadFrequently:true}).getImageData(0,0,320,700).data;
    const reference=paint(high,320,700);
    let mismatches=0;
    for(let i=0;i<workerPixels.length;i+=4)
      if(Math.max(...[0,1,2].map(k=>Math.abs(
        workerPixels[i+k]-reference.data[i+k])))>3)mismatches++;
    return {
      selection:document.querySelector('select[name="geometry"] option[value="scalloped"]')?.textContent?.trim(),
      width,height,coloured,changed,
      workerBytes:workerBlob.size,workerPixelMismatches:mismatches,
      workerPixelCount:320*700,
      ownerProbes,sweptProbes,
      images:{
        low:lowPaint.image,high:highPaint.image,
        owner:ownerPaint.image,worker:workerCanvas.toDataURL('image/png')
      },
      highRecipe:{...base,...high}
    };
  });
  for(const [name,data] of Object.entries(result.images))
    await writeFile(out+'/'+name+'.png',Buffer.from(data.split(',')[1],'base64'));
  const png=embedPngMetadata(Buffer.from(result.images.high.split(',')[1],'base64'),
    {},{recipe:normalizeRecipe(result.highRecipe)});
  await writeFile(out+'/high-with-recipe.png',png);
  assert.deepEqual(extractPngRecipe(png),normalizeRecipe(result.highRecipe),
    'PNG export must preserve bounce parameters for reimport');
  delete result.images;delete result.highRecipe;
  assert.equal(result.selection,'Bouncing ribbon');
  assert.ok(result.coloured>500,'real rendered preview must contain coloured stripes');
  assert.ok(result.changed>1200,'pronounced bounce must change actual raster pixels');
  assert.ok(result.workerBytes>2500,'worker export must emit nonempty PNG bytes');
  assert.ok(result.ownerProbes>25,'original reported scene has clean joins');
  assert.ok(result.sweptProbes>250,'all swept raster scenarios cover their joins');
  assert.ok(result.workerPixelMismatches/result.workerPixelCount<.01,
    'reference and worker paint must agree on actual bouncing silhouette');
  assert.deepEqual(errors,[],'no browser page exceptions');
  await writeFile(out+'/results.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
}finally{
  await browser.close();
}
