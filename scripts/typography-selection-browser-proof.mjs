#!/usr/bin/env node
// Manual source-browser typography witness for #653. This is not a physical
// Android, human aesthetic, or pixel-exact glyph-outline acceptance test.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'output','text-selection');
await mkdir(output,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.ttf':'font/ttf','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(request,response)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
    if(!path.startsWith(root+'/')&&path!==root){
      response.writeHead(403).end();return;
    }
    const file=path===root?join(root,'index.html'):path;
    response.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(file));
  }catch{response.writeHead(404).end('Not found');}
});
let browser;
try{
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok);});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:412,height:892}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  const report=await page.evaluate(async()=>{
    const {normalizeRecipe}=await import('/src/model.js');
    const {drawWallpaper}=await import('/src/renderer.js');
    const {prepareTypefaces,typefaceCssFamily}=await import('/src/typography-fonts.js');
    const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
    const {layoutTextOnPath,hitTextAtLayout,canCurveText}=await import('/src/text-path-geometry.js');
    const {measureCanvasText,measuredTextBounds}=await import('/src/text-direct-geometry.js');
    const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
    const countDiff=(a,b)=>{
      const A=a.getContext('2d',{willReadFrequently:true}).getImageData(0,0,a.width,a.height).data;
      const B=b.getContext('2d',{willReadFrequently:true}).getImageData(0,0,b.width,b.height).data;
      let n=0;for(let i=0;i<A.length;i++)if(A[i]!==B[i])n++;
      return n;
    };
    const examples=[
      {name:'tracked-wave',text:'iiiiiiiiiiii',size:52,path:'wave',
        pathHeight:20,letterSpacing:18,font:'modern',colour:'rainbow-letter'},
      {name:'tracked-draw',text:'CURVED TRACKING',size:58,path:'drawn',
        pathHeight:90,letterSpacing:10,font:'modern',colour:'rainbow-gradient',
        customPath:[[.06,.40],[.26,.36],[.50,.45],[.75,.56],[.95,.44]]},
      {name:'native-arabic',text:'السَّلَامُ عَلَيْكُمْ',size:58,
        path:'wave',letterSpacing:2,font:'modern',colour:'rainbow-word'},
      {name:'native-indic',text:'नमस्ते दुनिया',size:58,
        path:'loop',font:'modern',colour:'rainbow-gradient'},
      {name:'native-emoji-zwj',text:'e\u0301 👩‍🚀 🌈',size:65,
        path:'arc',font:'modern',colour:'rainbow-letter'},
      {name:'curved-combining',text:'cafe\u0301 🌈',size:65,
        path:'circle',pathHeight:150,font:'modern',colour:'rainbow-letter'},
      {name:'native-rtl-presentation',text:'ﺍﻟﺴﻼﻡ',size:65,
        path:'wave',pathHeight:90,font:'modern',colour:'white'},
      {name:'native-adlam',text:'𞤀𞤭𞤀𞤭𞤀𞤭',size:65,
        path:'arc',pathHeight:90,font:'modern',colour:'white'},
      {name:'native-brahmi',text:'𑀦𑀫𑀦𑀫',size:65,
        path:'circle',pathHeight:90,font:'modern',colour:'white'},
    ];
    const results=[],artwork=[];
    const contact=make(examples.length*180,390),contactCtx=contact.getContext('2d');
    const probe=make(1,1).getContext('2d');
    if(!('letterSpacing' in probe))throw Error('This Chromium build lacks Canvas native letterSpacing');
    for(let i=0;i<examples.length;i++){
      const spec=examples[i];
      const recipe=normalizeRecipe({seed:'tracked-selection-'+spec.name,
        geometry:'straight',orientation:'vertical',
        ...(spec.customPath?{customPath:spec.customPath}:{}),
        textOverlays:[{id:'ink',x:50,y:52,enabled:true,outline:'black',
          ...spec}]});
      await prepareTypefaces(recipe);
      const reference=make(480,1040),blank=make(480,1040),worker=make(480,1040);
      drawWallpaper(reference,recipe);
      drawWallpaper(blank,{...recipe,textOverlays:[]});
      const inkChannels=countDiff(reference,blank);
      if(inkChannels<1000)throw Error('Invisible artwork '+spec.name);
      let nativeFallbackPixelDifferences=null;
      if(spec.name.startsWith('native-')&&
          ['native-rtl-presentation','native-adlam','native-brahmi'].includes(spec.name)){
        if(canCurveText(spec.text))throw Error('Unsafe script was split '+spec.name);
        const straight=make(480,1040);
        const native=normalizeRecipe({...recipe,
          textOverlays:recipe.textOverlays.map(item=>({...item,path:'none'}))});
        drawWallpaper(straight,native);
        nativeFallbackPixelDifferences=countDiff(reference,straight);
        if(nativeFallbackPixelDifferences!==0)
          throw Error('Native shaping was altered by curve '+spec.name);
        straight.width=0;
      }
      const blob=await exportWallpaperInWorker({recipe,width:480,height:1040,timeoutMs:120000});
      const bmp=await createImageBitmap(blob);
      worker.getContext('2d').drawImage(bmp,0,0);bmp.close();
      const mismatch=countDiff(reference,worker);
      if(mismatch!==0)throw Error('Reference/worker mismatch '+spec.name+': '+mismatch);
      const thumbnail=make(180,390);
      thumbnail.getContext('2d').drawImage(reference,0,0,180,390);
      contactCtx.drawImage(thumbnail,i*180,0);
      artwork.push(reference.toDataURL('image/png'));
      results.push({name:spec.name,inkChannels,workerPixelChannelDifferences:mismatch,
        workerPngBytes:blob.size,nativeFallbackPixelDifferences});
      reference.width=0;worker.width=0;blank.width=0;
    }
    const tracked=normalizeRecipe({textOverlays:[{
      id:'tracked',text:'iiiiiiiiiiii',enabled:true,x:50,y:50,
      size:52,path:'wave',pathHeight:20,letterSpacing:18,
      font:'modern',outline:'none'
    }]}).textOverlays[0];
    const font='bold '+tracked.size+'px '+typefaceCssFamily(tracked.font);
    const normal=(item,value)=>measureCanvasText(probe,font,item,value);
    const shaped=(item,value)=>measureCanvasText(probe,font,item,value,{tracking:true});
    const layout=layoutTextOnPath(tracked,tracked.text,unit=>shaped(tracked,unit));
    if(!layout.supported)throw Error('Expected tracked Wave layout');
    const last=layout.glyphs.at(-1);
    const sample={x:300+last.x,y:650+last.y};
    const newPick=hitTextAtLayout([tracked],sample,shaped);
    const oldPick=hitTextAtLayout([tracked],sample,normal);
    if(newPick?.id!=='tracked')throw Error('Painted glyph cannot be picked');
    if(oldPick)throw Error('Old untracked metric unexpectedly picks outer glyph');
    const guide=measuredTextBounds(tracked,value=>normal(tracked,value));
    const natural=normal(tracked,tracked.text),trackedWidth=shaped(tracked,tracked.text);
    if(Math.abs(guide.width-trackedWidth)>.00001)
      throw Error('Guide does not match native tracked run width');
    const high=normalizeRecipe({seed:'tracked-full-resolution',
      textOverlays:[{text:'CURVES AND COLOUR',font:'modern',
        path:'wave',pathHeight:85,letterSpacing:6,size:64,
        shadow:'black',shadowDistance:8,outline:'white-black',
        colour:'rainbow-word'}]});
    await prepareTypefaces(high);
    const big=await exportWallpaperInWorker({recipe:high,width:3024,height:6552,
      timeoutMs:180000});
    const decoded=await createImageBitmap(big);
    const fullResolution={width:decoded.width,height:decoded.height,bytes:big.size};
    decoded.close();
    if(fullResolution.width!==3024||fullResolution.height!==6552)
      throw Error('Full-resolution PNG wrong dimensions');
    window.__textSelectionArtwork=artwork;
    window.__textSelectionContact=contact.toDataURL('image/png');
    return {results,fullResolution,trackedHit:{
      naturalWidth:natural,trackedWidth,guideWidth:guide.width,
      lastGlyphDistance:last.distance,oldPick:oldPick?.id||null,newPick:newPick?.id,
    }};
  });
  for(let i=0;i<report.results.length;i++){
    const source=await page.evaluate(i=>window.__textSelectionArtwork[i],i);
    await writeFile(join(output,report.results[i].name+'.png'),
      Buffer.from(source.split(',')[1],'base64'));
  }
  const contact=await page.evaluate(()=>window.__textSelectionContact);
  await writeFile(join(output,'contact-sheet.png'),Buffer.from(contact.split(',')[1],'base64'));
  assert.deepEqual(errors,[]);
  const result={status:'PASS',viewport:'Linux Chromium 412x892, NOT physical Android',
    errors,...report};
  await writeFile(join(output,'report.json'),JSON.stringify(result,null,2)+'\n');
  console.log('TEXT_SELECTION_SOURCE_PROOF '+JSON.stringify(result));
}finally{await browser?.close();server.close();}
