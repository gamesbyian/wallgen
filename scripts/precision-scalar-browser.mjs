#!/usr/bin/env node
// Real browser + authoritative source test, not Android IME/tactile acceptance.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {decodeRecipe} from '../src/model.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'artifacts/precision-scalar');
await mkdir(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf',
  '.json':'application/json','.png':'image/png'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(path!==root&&!path.startsWith(root+'/')){res.writeHead(403).end();return;}
    const served=path===root?join(root,'index.html'):path;
    res.writeHead(200,{'Content-Type':mime[extname(served)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(served));
  }catch{res.writeHead(404).end('Not Found');}
});
let browser;
const report=[],errors=[];
const recipe=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
const edit=(page,value)=>page.evaluate(value=>{
  const number=document.querySelector('.slider-number[data-number-for="spread"]');
  number.value=value;number.dispatchEvent(new Event('input',{bubbles:true}));
  number.dispatchEvent(new Event('change',{bubbles:true}));
  return {invalid:number.getAttribute('aria-invalid'),value:number.value};
},value);
try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  browser=await chromium.launch({headless:true});
  for(const [width,height] of [[320,700],[412,892]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:true,
      hasTouch:true,reducedMotion:'reduce'});
    page.setDefaultTimeout(30000);
    page.on('pageerror',error=>errors.push(String(error)));
    try{
      await page.goto('http://127.0.0.1:'+server.address().port+'/',
        {waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
        null,{timeout:85000});
      const before=recipe(page);
      const field=page.locator('.slider-number[data-number-for="spread"]');
      assert.equal(await field.getAttribute('type'),'text');
      assert.equal(await field.getAttribute('inputmode'),'text');
      const starting=before.spread;
      await edit(page,'+=7');
      await page.waitForFunction(value=>
        Number(document.querySelector('input[name="spread"]').value)===value,
        Math.min(100,starting+7));
      let edited=recipe(page);
      assert.equal(edited.spread,Math.min(100,starting+7));
      await edit(page,'45px');
      assert.equal(await field.getAttribute('aria-invalid'),'true');
      assert.equal(await field.inputValue(),'45px');
      assert.equal(recipe(page).spread,edited.spread);
      await edit(page,'25%');
      edited=recipe(page);
      assert.equal(edited.spread,25);
      assert.equal(await field.getAttribute('aria-invalid'),null);
      assert.equal(await field.getAttribute('role'),'spinbutton');
      assert.equal(await field.getAttribute('aria-valuenow'),'25');
      await page.evaluate(()=>{
        const number=document.querySelector('.slider-number[data-number-for="spread"]');
        number.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));
      });
      edited=recipe(page);
      assert.equal(edited.spread,26);
      assert.equal(await field.getAttribute('aria-valuenow'),'26');
      await page.screenshot({path:join(output,width+'x'+height+'.png'),animations:'disabled'});
      const preview=await page.locator('#preview').evaluate(el=>
        ({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));
      assert.ok(preview.width>0&&preview.height>0);
      report.push({viewport:[width,height],before:starting,relative:Math.min(100,starting+7),
        invalidPreserved:true,percentAbsolute:25,keyboardUp:edited.spread,preview});
    }finally{await page.close();}
  }
  assert.deepEqual(errors,[]);
  await writeFile(join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('SCALAR_PRECISION_PASS '+JSON.stringify(report));
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
