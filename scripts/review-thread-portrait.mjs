#!/usr/bin/env node
/**
 * Two actual browser viewports of expanded Texture -> Surface -> Thread.
 * Not a general UI atlas, automatic accessibility certificate, or routine CI.
 * Requires local static app server + installed Playwright Chromium.
 *
 * node scripts/review-thread-portrait.mjs --out-dir artifacts/thread-portrait
 */
import {chromium} from 'playwright';
import {mkdir,access,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';

const params={outDir:'artifacts/thread-portrait',url:'http://127.0.0.1:4173'};
for(let i=2;i<process.argv.length;i++){
  const arg=process.argv[i];
  if(arg==='--help'||arg==='-h'){
    console.log('node scripts/review-thread-portrait.mjs [--out-dir folder] [--url local-http-url]');
    process.exit(0);
  }
  if(!['--out-dir','--url'].includes(arg)||!process.argv[i+1])
    throw Error('Unexpected or incomplete argument '+arg);
  params[arg==='--out-dir'?'outDir':'url']=process.argv[++i];
}
const out=resolve(params.outDir);
await mkdir(out,{recursive:true});
for(const path of ['report.json','412x892.png','320x700.png']){
  try{await access(join(out,path));throw Error('Output exists: '+path);}
  catch(err){if(err.code!=='ENOENT')throw err;}
}
const browser=await chromium.launch({headless:true});
const results=[];
try{
  for(const viewport of [{width:412,height:892},{width:320,height:700}]){
    const page=await browser.newPage({viewport,deviceScaleFactor:1,isMobile:true,
      hasTouch:true,reducedMotion:'reduce'});
    const warnings=[];
    page.on('pageerror',error=>warnings.push(String(error)));
    try{
      await page.goto(params.url,{waitUntil:'domcontentloaded',timeout:15000});
      await page.locator('#mobileEdit').click({timeout:8000});
      await page.locator('#tab-material').click({timeout:8000});
      await page.locator('.editor-tool-tab[data-editor-tool=surface]').click({timeout:8000});
      const details=page.locator('.editor-tool-card[data-editor-tool=surface] .embroidery-controls');
      await details.locator('summary').click({timeout:8000});
      await details.locator('[name=embroideryTarget]').selectOption('all');
      await details.locator('[name=embroideryStyle]').selectOption('chain');
      await page.waitForTimeout(180);
      const metrics=await page.evaluate(()=>{
        const card=document.querySelector('.editor-tool-card[data-editor-tool=surface]');
        const panel=card.querySelector('.embroidery-controls');
        const sidebar=document.querySelector('.sidebar');
        const finish=panel.querySelector('small');
        const fields=[...panel.querySelectorAll('summary,select,input,small')]
          .filter(el=>el.getBoundingClientRect().height>0);
        const rect=el=>{const r=el.getBoundingClientRect();return {
          top:Math.round(r.top*10)/10,bottom:Math.round(r.bottom*10)/10,
          left:Math.round(r.left*10)/10,right:Math.round(r.right*10)/10,
          width:Math.round(r.width*10)/10,height:Math.round(r.height*10)/10};};
        const cardRect=rect(card),sidebarRect=rect(sidebar);
        return {
          card:cardRect,sidebar:sidebarRect,thread:rect(panel),help:rect(finish),
          cardHeight:card.clientHeight,cardScrollHeight:card.scrollHeight,
          panelHeight:panel.clientHeight,panelScrollHeight:panel.scrollHeight,
          pageScrollHeight:document.documentElement.scrollHeight,
          pageClientHeight:document.documentElement.clientHeight,
          fields:fields.map(el=>({tag:el.tagName,name:el.name||el.textContent.slice(0,25),
            disabled:el.disabled===true,rect:rect(el)})),
          controlBottomClipped:rect(finish).bottom>Math.min(cardRect.bottom,sidebarRect.bottom)+2,
          anySub44:fields.filter(el=>['SELECT','INPUT'].includes(el.tagName))
            .some(el=>rect(el).height<44),
          previewHeight:document.querySelector('canvas')?.getBoundingClientRect().height,
          scrollTop:card.scrollTop
        };
      });
      const image=viewport.width+'x'+viewport.height+'.png';
      await page.screenshot({path:join(out,image),fullPage:false,animations:'disabled'});
      results.push({viewport,image,warnings,metrics});
      console.log(image+' footerClipped='+metrics.controlBottomClipped+
        ' sub44='+metrics.anySub44+' cardScroll='+metrics.cardScrollHeight+'/'+metrics.cardHeight);
    }finally{await page.close();}
  }
}finally{await browser.close();}
await writeFile(join(out,'report.json'),JSON.stringify({
  study:'roygbiv-thread-portrait/v1',status:'actual-browser-measurement',
  caveat:'Chromium touch emulation does not prove physical Pixel performance or virtual keyboard',
  results},null,2)+'\n');
