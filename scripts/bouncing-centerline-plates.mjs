// Deterministic production-sampler evidence for Bouncing ribbon.
// Run: node scripts/bouncing-centerline-plates.mjs [output-directory]
// SVG is generated from the SAME normal-offset sampler used by Canvas/PNG.
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {normalizeRecipe,resolveScene} from '../src/model.js';
import {ribbonEdge} from '../src/path-geometry.js';

const cases=[
  {file:'01-low-frequency-low-height',frequency:10,height:25,width:13},
  {file:'02-low-frequency-high-height',frequency:10,height:100,width:13},
  {file:'03-medium-frequency-medium-height',frequency:50,height:60,width:16},
  {file:'04-high-frequency-high-height',frequency:90,height:100,width:16},
  {file:'05-thin-stroke-high-bounces',frequency:65,height:95,width:3},
  {file:'06-thick-ribbon-high-bounces',frequency:65,height:95,width:36},
];
const colours=['#ec2637','#f88b17','#e9c72e','#35a757','#328bd9','#483c9c','#9653bc'];
const destination=process.argv[2]??'artifacts/bouncing-centerline';
mkdirSync(destination,{recursive:true});
const fmt=n=>Number(n.toFixed(3));
const line=(points)=>points.map((p,i)=>
  `${i===0?'M':'L'}${fmt(p.x)},${fmt(p.y)}`).join(' ');
const manifest=[];
for(const spec of cases){
  const scene=resolveScene(normalizeRecipe({
    seed:'bouncing-visual-contract',structure:'paths',geometry:'scalloped',
    orientation:'horizontal',composition:'full',individuality:0,chaos:0,
    shapeFrequency:spec.frequency,shapeDepth:spec.height,
    stripeEdgeStyle:'straight',startTaper:0,endTaper:0,
    motif:'solid',material:'none',glow:0,outline:'none'
  }));
  const template=scene.stripes[3],step=1.2;
  const paths=[];
  for(let i=0;i<7;i++){
    const stripe={...template,center:(i-3)*54,width:spec.width};
    const minus=[],plus=[];
    for(let x=-480;x<=480+1e-8;x+=step){
      minus.push(ribbonEdge(stripe,x,scene.extent,-1));
      plus.push(ribbonEdge(stripe,x,scene.extent,1));
    }
    const contour=line(minus)+' '+line(plus.reverse()).replace(/^M/,'L')+' Z';
    paths.push(`<path d="${contour}" fill="${colours[i]}"/>`);
  }
  const title=`Bounce frequency ${spec.frequency} · height ${spec.height} · physical width ${spec.width}`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700"
    viewBox="-500 -310 1000 620" role="img" aria-label="${title}">
    <title>${title}</title><rect x="-500" y="-310" width="1000"
    height="620" fill="#fff"/>${paths.join('')}
    </svg>\n`;
  writeFileSync(join(destination,spec.file+'.svg'),svg);
  manifest.push({file:spec.file+'.svg',title});
}
writeFileSync(join(destination,'index.html'),`<!doctype html><html lang="en">
<meta charset="utf-8"><title>Bouncing ribbon visual acceptance</title>
<style>body{font:16px system-ui;background:#e8e8e8;color:#111;max-width:1100px;margin:auto}
figure{background:white;padding:10px;margin:20px 0}img{width:100%}</style>
<h1>Bouncing ribbon: physical centerline evidence</h1>
<p>Each shape samples the production path geometry and normal-offset boundaries.
This plate generator does not substitute for a browser raster/PNG check.</p>
${manifest.map(e=>`<figure><figcaption>${e.title}</figcaption><img src="${e.file}" alt="${e.title}"></figure>`).join('')}
</html>\n`);
console.log(JSON.stringify(manifest,null,2));
