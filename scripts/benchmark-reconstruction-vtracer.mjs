#!/usr/bin/env node
/**
 * Explicitly opt-in GHA/local VTracer comparison, issue #557.
 * Consumes genuine, already-generated metadata-free R0 or independently
 * authored external PNG fixtures. NEVER reads R0 truth sidecars for tracing.
 * VTracer is an offline vectorization oracle, not a second ROYGBIV renderer
 * or a production app dependency.
 *
 * node scripts/benchmark-reconstruction-vtracer.mjs \
 *   --dir artifacts/reconstruction-r0 --out-dir artifacts/vtracer-evidence \
 *   --only 05-hairpin,06-loop,16-offset-jagged
 * Requires pinned vtracer 1.0.0-alpha.4 executable and opt-in Playwright.
 */
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,writeFile,access,mkdir} from 'node:fs/promises';
import {resolve,join,dirname,extname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {classifyReconstructionManifest} from './evaluate-reconstruction-r0.mjs';

const exec=promisify(execFile);
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const VERSION='1.0.0-alpha.4';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

export function readVectorBenchmarkArgs(argv){
  const options={dir:'artifacts/reconstruction-r0',
    outDir:'artifacts/reconstruction-vtracer',vtracer:'vtracer'};
  for(let i=0;i<argv.length;i++){
    const key=argv[i];
    if(key==='--help'||key==='-h'){options.help=true;continue;}
    if(!['--dir','--out-dir','--vtracer','--only'].includes(key)||
      !argv[i+1]||argv[i+1].startsWith('--'))
      throw Error('Unknown or incomplete vector benchmark argument: '+key);
    options[key.slice(2).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=argv[++i];
  }
  return options;
}

function staticServer(){
  return createServer(async(req,res)=>{
    try{
      const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
      if(!path.startsWith(root+'/')){res.writeHead(403).end();return;}
      const bytes=await readFile(path);
      res.writeHead(200,{'Content-Type':extname(path)==='.js'?
        'text/javascript':'application/octet-stream',
        'X-Content-Type-Options':'nosniff'}).end(bytes);
    }catch{res.writeHead(404).end();}
  });
}

/** A reconstructed SVG is independently rasterized in Chromium.
 * Compare its observed pixels with the original pixels using the SAME
 * production R0 pixel metric, without calling drawWallpaper or revealing truth.
 */
async function beginRasterComparison(){
  const {chromium}=await import('playwright').catch(()=>{
    throw Error('Playwright required for optional VTracer experiment');
  });
  const server=staticServer();
  let browser;
  try{
    await new Promise((yes,no)=>{
      server.once('error',no);server.listen(0,'127.0.0.1',yes);
    });
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:420,height:900}});
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{
      waitUntil:'domcontentloaded'});
    return {score:async(sourceBytes,svgBytes)=>{
      return page.evaluate(async ({original,vector})=>{
        const {compareReconstructionPixels}=await import('/src/image-reconstruction.js');
        const bytes=b64=>Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
        const imageFrom=async(data,type)=>{
          const url=URL.createObjectURL(new Blob([bytes(data)],{type}));
          try{
            const image=new Image();image.src=url;await image.decode();
            return image;
          }finally{URL.revokeObjectURL(url);}
        };
        const source=await imageFrom(original,'image/png');
        const traced=await imageFrom(vector,'image/svg+xml');
        const paint=(image,w,h)=>{
          const canvas=document.createElement('canvas');
          canvas.width=w;canvas.height=h;
          canvas.getContext('2d').drawImage(image,0,0,w,h);
          return canvas;
        };
        const sw=96,sh=208;
        const a=paint(source,sw,sh).getContext('2d',{willReadFrequently:true})
          .getImageData(0,0,sw,sh);
        const b=paint(traced,sw,sh).getContext('2d',{willReadFrequently:true})
          .getImageData(0,0,sw,sh);
        // Reviewer image uses original source dimensions; does not modify it.
        const optical=paint(traced,source.naturalWidth,source.naturalHeight)
          .toDataURL('image/png').split(',')[1];
        return {rgbInkError:compareReconstructionPixels(a,b),optical};
      },{original:sourceBytes.toString('base64'),
        vector:svgBytes.toString('base64')});
    },close:async()=>{
      await browser.close();
      await new Promise(done=>server.close(done));
    }};
  }catch(error){
    await browser?.close();
    if(server.listening)await new Promise(done=>server.close(done));
    throw error;
  }
}

export async function runVectorBenchmark(options,{
  run=async(bin,args)=>exec(bin,args,{timeout:120000,maxBuffer:1024*1024}),
  rasterize=beginRasterComparison
}={}){
  const base=resolve(options.dir),out=resolve(options.outDir);
  // Never destroy prior evidence or accidentally use the input corpus directory.
  if(out===base)
    throw Error('Output directory must differ from input corpus');
  const manifest=JSON.parse(await readFile(join(base,'manifest.json'),'utf8'));
  const {external,items}=classifyReconstructionManifest(manifest);
  const selected=options.only?
    new Set(options.only.split(',').map(x=>x.trim()).filter(Boolean)):null;
  if(selected?.size===0)throw Error('Empty --only selection');
  const cases=selected?items.filter(item=>selected.has(item.id)):items;
  if(!cases.length||(selected&&cases.length!==selected.size))
    throw Error('Unknown/empty case selection');
  // Reject reuse before any binary invocation or source access.
  try{await access(join(out,'report.json'));throw Error('Existing VTracer report: '+out);}
  catch(error){if(error.code!=='ENOENT')throw error;}
  const version=String((await run(options.vtracer,['--version'])).stdout).trim();
  if(!version.includes(VERSION))
    throw Error('Expected pinned VTracer '+VERSION+', got '+version);
  await mkdir(out,{recursive:true});
  const optical=await rasterize();
  const results=[];
  try{
    for(const item of cases){
      const original=await readFile(join(base,item.metadataFree));
      if(original.length>12*1024*1024||original.length<8||
        original.toString('hex',0,8)!=='89504e470d0a1a0a')
        throw Error('Invalid/oversized PNG source: '+item.id);
      const file=item.id+'.vtracer.svg';
      const input=join(base,item.metadataFree),output=join(out,file);
      try{await access(output);throw Error('Existing vector source: '+output);}
      catch(error){if(error.code!=='ENOENT')throw error;}
      const start=process.hrtime.bigint();
      // 1.0-alpha.4 cutout is the gapless shared-boundary tracing mode.
      await run(options.vtracer,[input,output,'--hierarchical','cutout',
        '--mode','spline','--simplify','1']);
      const milliseconds=Number(process.hrtime.bigint()-start)/1e6;
      const svg=await readFile(output);
      if(svg.length>8*1024*1024||!/<svg(?:\s|>)/.test(svg.toString('utf8')))
        throw Error('VTracer did not produce a bounded SVG: '+item.id);
      const scored=await optical.score(original,svg);
      const image=item.id+'.vtracer.png';
      await writeFile(join(out,image),Buffer.from(scored.optical,'base64'));
      const after=await readFile(input);
      if(sha(original)!==sha(after))throw Error('Immutable source PNG changed: '+item.id);
      results.push({id:item.id,source:item.metadataFree,sourceSha256:sha(original),
        svg:file,preview:image,svgBytes:svg.length,
        pathCount:(svg.toString('utf8').match(/<path(?:\s|>)/g)||[]).length,
        tracerMilliseconds:Math.round(milliseconds),
        rgbInkError:scored.rgbInkError,
        // R0 truth remains isolated and never loaded into this benchmark.
        provenance:external?'independent-external-no-truth':'native-R0-blind-inference'});
    }
  }finally{await optical.close();}
  const report={schema:'roygbiv-vtracer-oracle/v1',
    status:'measured-pixels-not-human-reviewed',vtracerVersion:version,
    originalSourceManifest:'manifest.json',external,results};
  await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  await writeFile(join(out,'index.html'),[
    '<!doctype html><meta charset="utf-8"><title>ROYGBIV VTracer oracle</title>',
    '<style>body{font:14px system-ui;background:#191919;color:white}',
    'figure{display:inline-block;width:290px;vertical-align:top}',
    'figure img{width:48%;height:auto}</style>',
    '<h1>Independent offline vectorization vs real source</h1>',
    '<p>Source at left, VTracer at right. No canonical recipe claimed;',
    'lower RGB/ink error is better, but all work still needs optical review.</p>',
    ...results.map(x=>'<figure><h2>'+esc(x.id)+'</h2>'+
      '<a href="'+esc(x.svg)+'">SVG</a><div><img src="'+
      esc(relative(out,join(base,x.source)).replaceAll('\\','/'))+
      '"><img src="'+esc(x.preview)+'"></div>'+
      '<p>RGB/ink error '+x.rgbInkError.toFixed(6)+
      '; paths '+x.pathCount+'; '+x.tracerMilliseconds+' ms</p></figure>')
  ].join(''));
  return report;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const options=readVectorBenchmarkArgs(process.argv.slice(2));
  if(options.help)console.log('node scripts/benchmark-reconstruction-vtracer.mjs --dir DIR --out-dir DIR --only CASE[,CASE] --vtracer BIN');
  else runVectorBenchmark(options).then(result=>
    console.log('VTRACER_ORACLE '+JSON.stringify({cases:result.results.length,
      status:result.status}))).catch(error=>{
      console.error('VTracer benchmark: '+error.message);process.exitCode=1;
    });
}
