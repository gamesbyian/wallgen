#!/usr/bin/env node
// Genuine portrait Chrom(e/ium) proof: unsupported glyph guidance stays
// immediately alongside the Typeface and Colour controls instead of
// hiding below the private-font picker. This is NOT physical Android.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,extname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'artifacts','agent3-664-glyph-near-font');
await mkdir(output,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css',
 '.json':'application/json','.svg':'image/svg+xml','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
 try{
  const full=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!full.startsWith(root+'/')&&full!==root){res.writeHead(403).end();return;}
  const file=full===root?join(root,'index.html'):full;
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream',
    'Cache-Control':'no-store'}).end(await readFile(file));
 }catch{res.writeHead(404).end('Not Found');}
});
let browser;
const rows=[];
try{
 await new Promise((okay,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',okay)});
 browser=await chromium.launch({headless:true});
 for(const [width,height] of [[320,700],[412,892]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,
    hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  page.setDefaultTimeout(30000);
  try{
   await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
   await page.locator('#mobileEdit').tap();
   await page.locator('.settings-tab[data-tab="details"]').tap();
   await page.locator('.editor-tool-tab[data-editor-tool="typography"]').tap();
   await page.locator('[data-text-add]').tap();
   await page.locator('[data-text-key="text"]').fill('HELLO 𠮷 مرحبا');
   await page.locator('[data-text-key="text"]').blur();
   await page.locator('[data-text-key="font"]').selectOption('pack-bangers');
   await page.waitForFunction(()=>document.querySelector('[data-text-glyph-status]')
     ?.textContent?.includes('does not contain'),null,{timeout:30000});
   const check=await page.evaluate(()=>{
     const read=selector=>{
       const el=document.querySelector(selector);
       const r=el.getBoundingClientRect();
       return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,
         width:r.width,height:r.height,scrollWidth:el.scrollWidth,
         clientWidth:el.clientWidth};
     };
     const status=document.querySelector('[data-text-glyph-status]');
     return {count:document.querySelectorAll('[data-text-glyph-status]').length,
       parentClass:status.parentElement.className,
       grid:read('.text-overlay-grid'),
       font:read('[data-text-key="font"]'),colour:read('[data-text-key="colour"]'),
       warning:read('[data-text-glyph-status]'),
       outline:read('[data-text-key="outline"]'),
       warningText:status.textContent};
   });
   assert.equal(check.count,1,'only one live warning source/status');
   assert.equal(check.parentClass,'text-overlay-grid',
     'warning must be adjacent to selected face rather than after Import');
   assert.ok(check.warning.top>=check.font.bottom-1 &&
     check.warning.top>=check.colour.bottom-1,
     'warning must be immediately after face and colour controls');
   assert.ok(check.warning.bottom<=check.outline.top+1,
     'warning must precede next row of sizing controls');
   assert.ok(Math.abs(check.warning.left-check.grid.left)<3 &&
     Math.abs(check.warning.width-check.grid.width)<3,
     'full-width warning should use both portrait grid columns');
   assert.ok(check.warning.scrollWidth<=check.warning.clientWidth+1,
     'warning overflows horizontally at '+width);
   assert.match(check.warningText,/U\+20BB7/);
   await page.locator('[data-text-key="font"]').scrollIntoViewIfNeeded();
   await page.screenshot({path:join(output,'visible-near-typeface-'+width+'x'+height+'.png'),
      animations:'disabled'});
   await page.locator('[data-text-glyph-status]').scrollIntoViewIfNeeded();
   const readable=await page.locator('[data-text-glyph-status]').boundingBox();
   const scrollState=await page.locator('[data-text-glyph-status]').evaluate(el=>{
     const rows=[];let p=el;while(p&&rows.length<9){
       const st=getComputedStyle(p);
       const rect=p.getBoundingClientRect();
       rows.push({node:p.tagName.toLowerCase(),id:p.id,cls:p.className,
         overflow:st.overflowY,height:rect.height,top:rect.top,bottom:rect.bottom,
         scrollTop:p.scrollTop,clientHeight:p.clientHeight,
         scrollHeight:p.scrollHeight});
       p=p.parentElement;
     }return rows;
   });
   console.log('AGENT3_GLYPH_SCROLL_DIAGNOSTIC '+
     JSON.stringify({width,height,readable,scrollState}));
   await page.screenshot({path:join(output,'complete-warning-'+width+'x'+height+'.png'),
      animations:'disabled'});
   assert.ok(readable&&readable.y>=-1 &&
     readable.y+readable.height<=height+1,
     'complete font warning must be revealable inside the real viewport');
   await page.locator('[data-text-key="text"]').fill('HELLO');
   await page.locator('[data-text-key="text"]').blur();
   await page.waitForFunction(()=>document.querySelector('[data-text-glyph-status]')
     ?.textContent==='',null,{timeout:30000});
   assert.equal(await page.locator('[data-text-glyph-status]').isVisible(),false,
     'supported glyphs must not consume screen space');
   assert.deepEqual(errors,[],'app exceptions during face recheck');
   const row={viewport:[width,height],adjacent:true,fullWidth:true,
     warnings:check.warningText,defaultHidden:true,pageErrors:errors.length,
     physicalPixel:'NOT TESTED',TalkBack:'NOT TESTED'};
   rows.push(row);
   console.log('AGENT3_GLYPH_NEAR_FONT_PASS '+JSON.stringify(row));
  }finally{await context.close();}
 }
 await writeFile(join(output,'report.json'),JSON.stringify(rows,null,2)+'\n');
}finally{await browser?.close();if(server.listening)await new Promise(r=>server.close(r))}
