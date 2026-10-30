#!/usr/bin/env node
// Real Chromium viewport acceptance for AYA's More composer, no mocked DOM.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const root=resolve('.');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname.replace(/^\//,'/')));
    if(path!==root&&!path.startsWith(root+sep))throw Error('outside root');
    const actual=path===root?resolve(root,'index.html'):path;
    if(!(await stat(actual)).isFile())throw Error('not a file');
    res.writeHead(200,{'Content-Type':mime[extname(actual)]||'application/octet-stream'});
    res.end(await readFile(actual));
  }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const evidence=[];
try{
  for(const [width,height] of [[320,700],[412,892],[500,790],[790,700]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
    await page.locator('#mobileMore').click({timeout:30000});
    const previewBefore=await page.locator('.studio-stage').evaluate(el=>el.getBoundingClientRect().height);
    await page.locator('#ayaRecipeOpen').click({timeout:30000});
    await page.locator('#ayaRecipePrompt').fill('Seven smooth rainbow ribbons with linen texture and gentle shadows');
    const result=await page.evaluate(()=>{
      const box=document.getElementById('ayaRecipeDialog');
      const r=box.getBoundingClientRect();
      const ids=['ayaRecipeClose','ayaRecipePrompt','ayaRecipeIncludeCurrent','ayaRecipeShare','ayaRecipeCopy','ayaRecipeSave','ayaRecipeStatus'];
      const inside=Object.fromEntries(ids.map(id=>{
        const e=document.getElementById(id),b=e.getBoundingClientRect();
        return [id,{visible:b.width>0&&b.height>0,withinDialog:b.top>=r.top-1&&b.bottom<=r.bottom+1&&b.left>=r.left-1&&b.right<=r.right+1,withinScreen:b.top>=0&&b.bottom<=innerHeight+1&&b.left>=0&&b.right<=innerWidth+1,hitHeight:b.height}];
      }));
      return {open:box.open,dialogHeight:r.height,viewportHeight:innerHeight,
        clientHeight:box.clientHeight,scrollHeight:box.scrollHeight,inside};
    });
    const previewAfter=await page.locator('.studio-stage').evaluate(el=>el.getBoundingClientRect().height);
    assert.ok(result.open);
    assert.ok(result.scrollHeight<=result.clientHeight+2,JSON.stringify({width,height,result}));
    for(const [id,item] of Object.entries(result.inside))
      assert.ok(item.visible&&item.withinDialog&&item.withinScreen,JSON.stringify({width,height,id,item,result}));
    for(const id of ['ayaRecipeClose','ayaRecipeShare','ayaRecipeCopy','ayaRecipeSave'])
      assert.ok(result.inside[id].hitHeight>=43.5,id+' insufficient touch area');
    assert.equal(previewAfter,previewBefore,'Opening AYA must not resize wallpaper preview');
    assert.deepEqual(errors,[],'Unexpected app JS errors');
    evidence.push({width,height,previewBefore,previewAfter,...result});
    await page.screenshot({path:'aya-viewport-'+width+'x'+height+'.png'});
    await page.close();
  }
  console.log('AYA_REAL_CHROMIUM_ACCEPTANCE',JSON.stringify(evidence));
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
