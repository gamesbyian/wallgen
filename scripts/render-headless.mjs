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
  [--metadata metadata.json] [--browser path] [--help]

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
    if(!['--recipe','--seed','--set','--width','--height','--out','--metadata','--browser'].includes(key))
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
      const data=await readFile(file===root?join(root,'index.html'):file);
      res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream',
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
    const base64=await page.evaluate(async({recipe,width,height})=>{
      const {drawWallpaper}=await import('/src/renderer.js');
      const canvas=document.createElement('canvas');
      canvas.width=width;canvas.height=height;
      drawWallpaper(canvas,recipe);
      return canvas.toDataURL('image/png').split(',')[1];
    },{recipe,width,height});
    const png=embedPngMetadata(Buffer.from(base64,'base64'),metadata,{recipe});
    if(JSON.stringify(extractPngRecipe(png))!==JSON.stringify(recipe))
      throw Error('PNG recipe round-trip failed');
    await mkdir(dirname(out),{recursive:true});
    await writeFile(out,png);
    process.stdout.write(JSON.stringify({file:out,width,height,seed:recipe.seed,bytes:png.length})+'\n');
  }finally{
    await browser?.close();
    if(server.listening)await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{process.stderr.write('ROYGBIV headless: '+error.message+'\n');process.exitCode=1;});
