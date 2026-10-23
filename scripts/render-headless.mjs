#!/usr/bin/env node
/**
 * Render ROYGBIV in Chromium without opening the studio UI.
 * Requires Playwright and its Chromium browser (see README).
 * Uses the production renderer, model and PNG metadata writer unchanged.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, join, extname, relative, isAbsolute, dirname } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { normalizeRecipe, OUTPUT_WIDTH, OUTPUT_HEIGHT } from '../src/model.js';
import { embedPngMetadata, extractPngRecipe } from '../src/png-metadata.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const types = {'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml'};
const usage = `Usage: node scripts/render-headless.mjs [--recipe design.json] [--seed text]
  [--set key=value ...] [--width pixels] [--height pixels] [--out image.png]
  [--metadata metadata.json] [--browser path] [--backend reference|worker]
  [--verify-photo-stream] [--help]

Examples:
  npm run render -- --seed rainbow-001 --out wallpaper.png
  npm run render -- --recipe favourite.json --width 600 --height 1300 --out proof.png
  npm run render -- --seed stars --set motif=stars --set geometry=wave

The exact same browser renderer and normalized recipe are used as in the studio.
All output PNGs contain restorable ROYGBIV Recipe metadata, including previews.
`;
function parseArgs(args) {
  const values = {sets:[]};
  for (let i=0;i<args.length;i++) {
    const key=args[i];
    if(key==='--help'||key==='-h'){values.help=true;continue;}
    if(key==='--verify-photo-stream'){values.verifyPhotoStream=true;continue;}
    if(!['--recipe','--seed','--set','--width','--height','--out','--metadata','--browser','--backend'].includes(key))
      throw Error('Unknown option: '+key);
    if(i+1===args.length||args[i+1].startsWith('--'))throw Error('Missing value for '+key);
    const value=args[++i];
    if(key==='--set')values.sets.push(value);
    else values[key.slice(2)]=value;
  }
  return values;
}
function integer(value,fallback,name){
  if(value===undefined)return fallback;
  const n=Number(value);
  if(!Number.isSafeInteger(n)||n<1||n>12000)throw Error(name+' must be an integer between 1 and 12000');
  return n;
}
function staticServer(){
  const server=createServer(async(req,res)=>{
    try{
      const url=new URL(req.url,'http://localhost');
      const pathname=decodeURIComponent(url.pathname);
      const file=resolve(root,'.'+pathname);
      if(!file.startsWith(root+'/')&&file!==root){res.writeHead(403).end();return;}
      const target=file===root?join(root,'index.html'):file;
      const data=await readFile(target);
      res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream',
        'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      res.end(data);
    }catch{res.writeHead(404).end('Not found');}
  });
  return server;
}
async function main(){
  const args=parseArgs(process.argv.slice(2));
  if(args.help){process.stdout.write(usage);return;}
  let input={};
  if(args.recipe){
    const parsed=JSON.parse(await readFile(args.recipe,'utf8'));
    input=parsed.recipe??parsed;
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Recipe must be a JSON object');
  }
  if(args.seed!==undefined)input.seed=args.seed;
  for(const assignment of args.sets){
    const equals=assignment.indexOf('=');
    if(equals<1)throw Error('--set expects key=value');
    const key=assignment.slice(0,equals),raw=assignment.slice(equals+1);
    if(!Object.hasOwn(normalizeRecipe({}),key))throw Error('Unknown recipe setting: '+key);
    input[key]=raw==='true'?true:raw==='false'?false:/^-?\d+(?:\.\d+)?$/.test(raw)?Number(raw):raw;
  }
  if(args.backend!==undefined&&!['worker','reference'].includes(args.backend))
    throw Error('--backend must be reference or worker');
  const recipe=normalizeRecipe(input);
  const width=integer(args.width,OUTPUT_WIDTH,'width');
  const height=integer(args.height,OUTPUT_HEIGHT,'height');
  const out=resolve(args.out||'roygbiv-'+recipe.seed.replace(/[^a-z0-9_-]+/gi,'-')+'.png');
  const metadata=args.metadata?JSON.parse(await readFile(args.metadata,'utf8')):{};
  let chromium;
  try{({chromium}=await import('playwright'));}
  catch{throw Error('Playwright is required. Run: npm install --no-save playwright && npx playwright install chromium');}
  const server=staticServer();
  let browser;
  try{
    await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
    const {port}=server.address();
    browser=await chromium.launch({headless:true,...(args.browser?{executablePath:args.browser}:{})});
    const page=await browser.newPage({viewport:{width:800,height:900},deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
    // One opt-in production-art parity check. It paints real ROYGBIV source
    // pixels through the ordinary renderer, then compares the old direct
    // Photo processor with the new bounded Canvas2D readback path and the
    // independent normal drawWallpaper Photo output. No second rasterizer.
    const photoStreamProof=args.verifyPhotoStream?
      await page.evaluate(async({recipe,width,height})=>{
        const {drawWallpaper}=await import('/src/renderer.js');
        const {normalizeRecipe}=await import('/src/model.js');
        const {processPhotoPixels,applyPhotoFinish}=await import('/src/photo-look.js');
        const look=recipe.photoLook;
        if(!look?.enabled||!Number(look.amount))throw Error('Photo stream proof requires an active Photo look');
        const canvas=()=>{const el=document.createElement('canvas');el.width=width;el.height=height;return el;};
        const original=canvas(),rendered=canvas(),streamed=canvas();
        drawWallpaper(original,normalizeRecipe({...recipe,photoLook:{...look,enabled:false}}));
        drawWallpaper(rendered,recipe);
        const source=original.getContext('2d').getImageData(0,0,width,height);
        const direct=new ImageData(new Uint8ClampedArray(source.data),width,height);
        const streamCtx=streamed.getContext('2d');
        streamCtx.putImageData(source,0,0);
        processPhotoPixels(direct.data,width,height,look,recipe.seed);
        if(!applyPhotoFinish(streamCtx,width,height,look,recipe.seed))
          throw Error('Photo stream proof unexpectedly skipped finishing');
        const streamedPixels=streamCtx.getImageData(0,0,width,height).data;
        const renderedPixels=rendered.getContext('2d').getImageData(0,0,width,height).data;
        let sourceToStream=-1,sourceToProduction=-1,changedRgb=0;
        for(let i=0;i<direct.data.length;i++){
          if(sourceToStream<0&&direct.data[i]!==streamedPixels[i])sourceToStream=i;
          if(sourceToProduction<0&&direct.data[i]!==renderedPixels[i])sourceToProduction=i;
          if(i%4!==3&&source.data[i]!==direct.data[i])changedRgb++;
        }
        if(sourceToStream>=0||sourceToProduction>=0)
          throw Error('Actual Photo PNG stream mismatch: '+recipe.photoLook.presetId+
            ', first strip '+sourceToStream+', first production '+sourceToProduction);
        return {presetId:look.presetId,width,height,source:'actual production drawWallpaper',
          comparedBytes:direct.data.length,changedRgbChannels:changedRgb,
          exactStripParity:true,exactProductionParity:true};
      },{recipe,width,height}):null;
    const base64=await page.evaluate(async({recipe,width,height,backend})=>{
      if(backend==='worker'){
        const {exportWallpaperInWorker}=await import('/src/render-coordinator.js');
        const blob=await exportWallpaperInWorker({recipe,width,height});
        return await new Promise((resolve,reject)=>{
          const reader=new FileReader();
          reader.onload=()=>resolve(String(reader.result).split(',')[1]);
          reader.onerror=()=>reject(reader.error||Error('Worker PNG could not be read'));
          reader.readAsDataURL(blob);
        });
      }
      const {drawWallpaper}=await import('/src/renderer.js');
      const canvas=document.createElement('canvas');
      canvas.width=width;canvas.height=height;
      drawWallpaper(canvas,recipe);
      return canvas.toDataURL('image/png').split(',')[1];
    },{recipe,width,height,backend:args.backend||'reference'});
    const png=embedPngMetadata(Buffer.from(base64,'base64'),metadata,{recipe});
    if(JSON.stringify(extractPngRecipe(png))!==JSON.stringify(recipe))
      throw Error('PNG recipe round-trip failed');
    await mkdir(dirname(out),{recursive:true});
    await writeFile(out,png);
    process.stdout.write(JSON.stringify({file:out,width,height,seed:recipe.seed,bytes:png.length,
      ...(photoStreamProof?{photoStreamProof}:{})})+'\n');
  }finally{
    await browser?.close();
    if(server.listening)await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{process.stderr.write('ROYGBIV headless: '+error.message+'\n');process.exitCode=1;});
