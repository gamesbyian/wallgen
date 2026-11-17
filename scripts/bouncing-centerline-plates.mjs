// Deterministic before/after SVG evidence for Bouncing ribbon.
// Run: node scripts/bouncing-centerline-plates.mjs [output-directory]
// "Before" deliberately uses the obsolete global normal-offset polygon.
// "After" uses the very same swept fill path as Canvas preview and PNG.
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {ribbonEdge} from '../src/path-geometry.js';
import {stripeFillPath} from '../src/renderer.js';

const cases=[
  {file:'01-low-frequency-low-height',frequency:10,height:25,width:13},
  {file:'02-low-frequency-high-height',frequency:10,height:100,width:13},
  {file:'03-medium-frequency-medium-height',frequency:50,height:60,width:16},
  {file:'04-high-frequency-high-height',frequency:90,height:100,width:16},
  {file:'05-thin-stroke-high-bounces',frequency:65,height:95,width:3},
  {file:'06-thick-ribbon-high-bounces',frequency:65,height:95,width:36},
  {file:'07-owner-vertical-black-42-79',frequency:42,height:79,
    width:65,vertical:true,black:true}
];
const colours=['#ec2637','#f88b17','#e9c72e','#35a757','#328bd9','#483c9c','#9653bc'];
const destination=process.argv[2]??'artifacts/bouncing-centerline';
mkdirSync(destination,{recursive:true});
mkdirSync(join(destination,'before'),{recursive:true});
const fmt=n=>Number(n.toFixed(2));
const line=points=>points.map((p,i)=>
  `${i===0?'M':'L'}${fmt(p.x)},${fmt(p.y)}`).join(' ');
class SvgPath {
  constructor(){this.commands=[];}
  moveTo(x,y){this.commands.push(`M${fmt(x)},${fmt(y)}`);}
  lineTo(x,y){this.commands.push(`L${fmt(x)},${fmt(y)}`);}
  // The production swept path only uses full clockwise circles.
  arc(x,y,r,start,end){
    if(Math.abs(start)>1e-9||Math.abs(end-2*Math.PI)>1e-9)
      throw new Error('Unexpected partial arc in swept ribbon');
    this.commands.push(`A${fmt(r)},${fmt(r)} 0 1 1 ${fmt(x-r)},${fmt(y)}`);
    this.commands.push(`A${fmt(r)},${fmt(r)} 0 1 1 ${fmt(x+r)},${fmt(y)}`);
  }
  closePath(){this.commands.push('Z');}
  toString(){return this.commands.join(' ');}
}
const manifest=[];
for(const spec of cases){
  const scene=resolveScene(normalizeRecipe({
    seed:'bouncing-visual-contract',structure:'paths',geometry:'scalloped',
    orientation:spec.vertical?'vertical':'horizontal',
    composition:'full',individuality:0,chaos:0,
    shapeFrequency:spec.frequency,shapeDepth:spec.height,
    stripeEdgeStyle:'straight',startTaper:0,endTaper:0,
    motif:'solid',material:'none',glow:0,outline:'none'
  }));
  const template=scene.stripes[3],step=1.2;
  const before=[],after=[];
  for(let i=0;i<7;i++){
    const stripe={...template,center:(i-3)*54,width:spec.width,
      segmentStart:-480,segmentEnd:480};
    const minus=[],plus=[];
    for(let x=-480;x<=480+1e-8;x+=step){
      minus.push(ribbonEdge(stripe,x,scene.extent,-1));
      plus.push(ribbonEdge(stripe,x,scene.extent,1));
    }
    const contour=line(minus)+' '+line(plus.reverse()).replace(/^M/,'L')+' Z';
    before.push(`<path d="${contour}" fill="${colours[i]}"/>`);
    const path=stripeFillPath(stripe,scene.extent,scene,SvgPath);
    after.push(`<path d="${path}" fill="${colours[i]}" fill-rule="nonzero"/>`);
  }
  const title=`Bounce frequency ${spec.frequency} · height ${spec.height} · width ${spec.width}`;
  const background=spec.black?'#000':'#fff';
  const transform=spec.vertical?'rotate(90)':'';
  const svg=paths=>`<svg xmlns="http://www.w3.org/2000/svg" width="1200"
    height="900" viewBox="-500 -375 1000 750" role="img" aria-label="${title}">
    <title>${title}</title><rect x="-500" y="-375" width="1000"
    height="750" fill="${background}"/>
    <g transform="${transform}">${paths.join('')}</g></svg>\n`;
  writeFileSync(join(destination,'before',spec.file+'.svg'),svg(before));
  writeFileSync(join(destination,spec.file+'.svg'),svg(after));
  manifest.push({file:spec.file+'.svg',title});
}
writeFileSync(join(destination,'index.html'),`<!doctype html><html lang="en">
<meta charset="utf-8"><title>Bouncing ribbon swept-union visual acceptance</title>
<style>body{font:16px system-ui;background:#e8e8e8;color:#111;max-width:1500px;margin:auto}
figure{padding:10px;background:white;margin:20px 0}
.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
img{width:100%}</style>
<h1>Bouncing ribbon: normal-offset polygon versus swept union</h1>
<p>Left: old self-intersecting boundary polygon. Right: production swept
cross-section union. Both retain exactly the same centerline and thickness.
Use the Chromium/worker raster acceptance for final pixel-level validation.</p>
${manifest.map(e=>`<figure><figcaption>${e.title}</figcaption>
<div class="row"><div>Before<img src="before/${e.file}" alt="Original polygon"></div>
<div>After<img src="${e.file}" alt="Swept union"></div></div></figure>`).join('')}
</html>\n`);
console.log(JSON.stringify(manifest,null,2));
