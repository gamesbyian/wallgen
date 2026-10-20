#!/usr/bin/env node
/**
 * Independent diagnostic for the eight unwired SVG proposals.
 * The fixture renders exact registered drawings at all mandated sizes/states.
 * Optical aesthetic approval and live-app wiring are explicitly out of scope.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';

const out=resolve('artifacts/independent-svg-qa');
await mkdir(out,{recursive:true});
const base=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const source=JSON.parse(await readFile('assets/icons/roygbiv/manifest.json','utf8'));
const candidates=source.icons.filter(x=>x.status==='candidate; not wired into UI');
assert.equal(candidates.length,8,'Unexpected SVG candidate count: review scope changed');
const browser=await chromium.launch({headless:true});
const rows=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:850},reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(base+'/assets/icons/roygbiv/state-matrix.html',{waitUntil:'domcontentloaded'});
 const visible=await page.locator('#count').innerText();
 assert.match(visible,/68 of 68/,'Complete source registry not loaded');
 for(const icon of candidates){
  try{
   const raw=await readFile('assets/icons/roygbiv/'+icon.name+'.svg','utf8');
   assert.match(raw,/<svg\b/i,icon.name+' missing SVG root');
   assert.match(raw,/viewBox="0 0 32 32"/,icon.name+' wrong UI glyph coordinates');
   assert.match(raw,/<title\b[^>]*>[^<]+<\/title>/,icon.name+' missing standalone title');
   assert.doesNotMatch(raw,/<(?:script|foreignObject|linearGradient|radialGradient|image)\b/i,
     icon.name+' contains unexpected executable/gradient/raster elements');
   await page.locator('#filter').fill('='+icon.name);
   assert.equal(await page.locator('.card').count(),1,icon.name+' missing fixture');
   const metrics=await page.locator('.card').evaluate(card=>{
     const samples=[...card.querySelectorAll('.sample')],sizes=[20,24,28];
     return {name:card.querySelector('code')?.textContent,
      status:card.querySelector('.flag')?.textContent,
      total:samples.length,
      pairs:samples.map(sample=>{
       const svg=sample.querySelector('svg');
       const p=sample.getBoundingClientRect(),s=svg.getBoundingClientRect();
       const shape=svg.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon').length;
       return {title:sample.title,width:s.width,height:s.height,
        shape,inside:s.left>=p.left-0.5&&s.right<=p.right+0.5&&
          s.top>=p.top-0.5&&s.bottom<=p.bottom+0.5,
        hidden:svg.getAttribute('aria-hidden'),
        filled:shape>0,expectedSize:sizes.includes(s.width)};
      })};
   });
   assert.equal(metrics.name,icon.name);
   assert.equal(metrics.status,'candidate; not wired into UI');
   assert.equal(metrics.total,24,'Expected 2 themes × 4 states × 3 sizes');
   for(const sample of metrics.pairs){
    assert.equal(sample.inside,true,'SVG viewport escaped sample cell '+sample.title);
    assert.equal(sample.filled,true,'Blank SVG '+sample.title);
    assert.equal(sample.hidden,'true','Purely decorative icon must not become a duplicate accessible name');
    assert.equal(sample.expectedSize,true,'Unexpected SVG sample size '+sample.title);
    assert.match(sample.title,/20px|24px|28px/);
   }
   await page.locator('.card').screenshot({path:join(out,icon.name+'.png'),animations:'disabled'});
   rows.push({name:icon.name,source:'manifest and existing source-exact fixture',
     samples:metrics.total,themes:['cream','dark'],
     states:['normal','selected','disabled','focus'],sizes:[20,24,28],
     geometricCellBounds:true,nonemptyVector:true});
   console.log('SVG_CANDIDATE_DIAGNOSTIC',JSON.stringify(rows.at(-1)));
  }catch(e){errors.push(icon.name+': '+String(e));}
 }
 await writeFile(join(out,'evidence.json'),JSON.stringify({rows,errors,
  classification:errors.length?'NOT VERIFIED':'browser rendering diagnostics only',
  limits:['No human aesthetic approval','No semantic recognizability study',
    'Candidate icons remain unwired','Not actual production screen reader or device',
    'Geometric cell containment does not prove optical centering or legibility']},null,2));
 assert.deepEqual(errors,[],'SVG candidate review diagnostics failed');
 console.log('INDEPENDENT_SVG_QA_SUCCESS');
}finally{await browser.close();}
