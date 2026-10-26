#!/usr/bin/env node
/**
 * Four independently drawn, metadata-free pigment graphics for image-to-recipe
 * acceptance. These source pixels are authored with Canvas2D, NOT with the
 * ROYGBIV renderer or an alleged secret original recipe.
 * Use only via deliberate browser-research workflows.
 */
import {mkdir,writeFile,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {extractPngRecipe} from '../src/png-metadata.js';

const WIDTH=480,HEIGHT=1040;
export const EXTERNAL_PIGMENT_CASES=Object.freeze([
  {id:'polygon-seven',goal:'Seven independently designed noncircular polygon pigments'},
  {id:'concave-seven',goal:'Seven individually concave six-point pigment stars with 62% radial notches'},
  {id:'round-seven-control',goal:'Seven native-circle-like, clearly separated pigments'},
  {id:'occluded-mixed-seven',goal:'Seven layered polygons, some pigments almost fully occluded'}
]);

export const LOW_CHROMA_EXTERNAL_CASES=Object.freeze([
  {id:'dim-seven-polygons',goal:'Seven dark but hue-distinct polygon pigments on near-black'},
  {id:'soft-seven-stars',goal:'Seven low-chroma colourful concave star pigments'},
  {id:'neutral-seven-control',goal:'Seven grey neutral polygons, not rainbow source pixels'},
  {id:'partial-two-hues',goal:'Only red and blue polygons; no invented five missing pigments'}
]);
export const SPARSE_HUE_EXTERNAL_CASES=Object.freeze([
  {id:'one-red-polygon',goal:'One actually visible red polygon and no other pigment slots'},
  {id:'contiguous-red-orange',goal:'Separate red and orange source polygons, the first two slots'},
  {id:'isolated-blue-polygon',goal:'One observed blue source pigment without preceding hues'},
  {id:'noncontiguous-red-blue',goal:'Red and blue source polygons with absent orange/yellow/green'}
]);
export function parseExternalPigmentArgs(argv){
  const opts={outDir:'artifacts/external-pigment-r0'};
  for(let i=0;i<argv.length;i++){
    if(argv[i]==='--out-dir'&&argv[i+1]&&!argv[i+1].startsWith('--')){
      opts.outDir=argv[++i];continue;
    }
    if(argv[i]==='--collection'&&argv[i+1]&&
      ['original','low-chroma','sparse-hue'].includes(argv[i+1])){
      opts.collection=argv[++i];continue;
    }
    if(argv[i]==='--help'||argv[i]==='-h'){opts.help=true;continue;}
    throw Error('Unknown/incomplete external pigment option: '+argv[i]);
  }
  return opts;
}
export function externalPigmentManifest(collection='original'){
  if(!['original','low-chroma','sparse-hue'].includes(collection))throw Error('Unsupported external fixture collection');
  const cases=collection==='low-chroma'?LOW_CHROMA_EXTERNAL_CASES:
    collection==='sparse-hue'?SPARSE_HUE_EXTERNAL_CASES:EXTERNAL_PIGMENT_CASES;
  return {schema:'roygbiv-reconstruction-external/v1',
    status:'independently-authored-pixels-not-artist-approved',
    source:'standalone-Canvas2D-polygons-not-ROYGBIV-recipes',
    width:WIDTH,height:HEIGHT,
    sourceProvenance:'No historical painter, seed, palette, layer order or hidden original recipe exists.',
    items:cases.map(c=>({
      id:c.id,metadataFree:c.id+'.png'
    }))};
}
async function generate(opts){
  const out=resolve(opts.outDir);
  const cases=opts.collection==='low-chroma'?LOW_CHROMA_EXTERNAL_CASES:
    opts.collection==='sparse-hue'?SPARSE_HUE_EXTERNAL_CASES:EXTERNAL_PIGMENT_CASES;
  await mkdir(out,{recursive:true});
  for(const name of ['manifest.json',...cases.map(c=>c.id+'.png')]){
    try{await access(join(out,name));throw Error('Evidence already exists: '+name);}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  const {chromium}=await import('playwright').catch(()=>{
    throw Error('Playwright is required only for the explicit offline optical research job');
  });
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage();
    for(const testCase of cases){
      const dataUri=await page.evaluate(({id,width,height})=>{
        // Design is defined here, without any ROYGBIV model or image import.
        const canvas=document.createElement('canvas');
        canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext('2d',{alpha:false});
        ctx.fillStyle='#050508';ctx.fillRect(0,0,width,height);
        const hues=['#f22d2f','#f59c20','#f6d32b','#36bb57',
          '#3385d9','#6749c6','#a653d9'];
        const centres=Array.from({length:7},(_,index)=>({
          x:132+(index%2)*216,y:130+Math.floor(index/2)*247
        }));
        const polygon=(x,y,outer,sides,angle,inner=null)=>{
          ctx.beginPath();
          const count=inner?2*sides:sides;
          for(let p=0;p<count;p++){
            const radius=inner&&p%2?outer*inner:outer;
            const t=angle+p*Math.PI*2/count;
            const px=x+Math.cos(t)*radius,py=y+Math.sin(t)*radius;
            if(p===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
          }
          ctx.closePath();ctx.fill();
        };
        const circle=(x,y,r)=>{
          ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
        };
        if(['one-red-polygon','contiguous-red-orange','isolated-blue-polygon',
            'noncontiguous-red-blue'].includes(id)){
          const indices=id==='one-red-polygon'?[0]:
            id==='contiguous-red-orange'?[0,1]:
            id==='isolated-blue-polygon'?[4]:[0,4];
          for(let i=0;i<indices.length;i++){
            ctx.fillStyle=hues[indices[i]];
            const {x,y}=centres[i];
            polygon(x,y,74,4+i*2,-Math.PI/2+i*.2);
          }
        }else if(['dim-seven-polygons','soft-seven-stars','neutral-seven-control',
            'partial-two-hues'].includes(id)){
          const sourceHues=[0,29,52,136,212,244,278];
          for(let i=0;i<7;i++){
            if(id==='partial-two-hues'&&i!==0&&i!==4)continue;
            const {x,y}=centres[i];
            ctx.fillStyle=id==='dim-seven-polygons'?
              'hsl('+sourceHues[i]+' 88% 13%)':
              id==='soft-seven-stars'?
                'hsl('+sourceHues[i]+' 23% 70%)':
              id==='neutral-seven-control'?'hsl(0 0% 70%)':
                'hsl('+sourceHues[i]+' 85% 59%)';
            polygon(x,y,68,id==='soft-seven-stars'?6:4+(i%3),
              -Math.PI/2+i*.13,id==='soft-seven-stars'?.63:null);
          }
        }else if(id==='occluded-mixed-seven'){
          // Displacement and overlap exercise visible contour clipping only.
          // Source painter precedence here is intentionally not a native
          // scatteredLayerOrder or a ROYGBIV scene contract.
          for(let i=0;i<7;i++){
            const y=170+i*108,x=220+Math.sin(i*1.25)*61;
            ctx.fillStyle=hues[i];
            polygon(x,y,88,5+(i%3),-Math.PI/2+i*.16,i%2?.64:null);
          }
        }else{
          for(let i=0;i<7;i++){
            const {x,y}=centres[i];
            ctx.fillStyle=hues[i];
            if(id==='round-seven-control')circle(x,y,67);
            else if(id==='concave-seven')
              polygon(x,y,74,6,-Math.PI/2+i*.17,.62);
            else polygon(x,y,72,3+(i%4),-Math.PI/2+i*.20);
          }
        }
        return canvas.toDataURL('image/png');
      },{id:testCase.id,width:WIDTH,height:HEIGHT});
      if(!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(dataUri))
        throw Error('Unexpected external graphic encoding: '+testCase.id);
      const png=Uint8Array.from(Buffer.from(dataUri.split(',')[1],'base64'));
      if(extractPngRecipe(png)!==null)
        throw Error('Independent artwork unexpectedly contains ROYGBIV recipe');
      await writeFile(join(out,testCase.id+'.png'),png);
      console.log('EXTERNAL_PIGMENT_SOURCE '+JSON.stringify({
        id:testCase.id,sizeBytes:png.length,authoredIn:'Canvas2D no ROYGBIV renderer',
        sourceRecipe:false}));
    }
    await writeFile(join(out,'manifest.json'),
      JSON.stringify(externalPigmentManifest(opts.collection),null,2)+'\n');
  }finally{await browser.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const opts=parseExternalPigmentArgs(process.argv.slice(2));
  if(opts.help)console.log('node scripts/review-reconstruction-external-pigments.mjs [--out-dir DIRECTORY] [--collection original|low-chroma|sparse-hue]');
  else generate(opts).catch(e=>{console.error(e);process.exitCode=1;});
}
