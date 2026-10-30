#!/usr/bin/env node
// Opt-in real Chromium arithmetic-entry acceptance. Checks app source recipe,
// untouched artwork on invalid input, focus and mobile inspector accessibility.
// Not physical Android IME/TalkBack acceptance.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=join(root,'artifacts/angle-expressions-mobile');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.json':'application/json'};
const server=createServer(async(req,res)=>{
  try{
    const abs=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
    if(abs!==root&&!abs.startsWith(root+'/')){res.writeHead(403).end();return;}
    const file=abs===root?join(root,'index.html'):abs;
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(file));
  }catch{res.writeHead(404).end('Not Found');}
});
const source=normalizeRecipe({seed:'angle-expression-qa',structure:'paths',geometry:'wave',
  material:'linen',textureRotation:350});
const result=[],browserErrors=[];
let browser;
const current=page=>decodeRecipe(new URL(page.url()).searchParams.get('r'));
try{
  await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
  browser=await chromium.launch({headless:true});
  for(const [width,height] of [[320,700],[412,892]]){
    const page=await browser.newPage({viewport:{width,height},isMobile:true,
      hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:1});
    page.setDefaultTimeout(16000);
    page.on('pageerror',e=>browserErrors.push(String(e)));
    try{
      await page.goto('http://127.0.0.1:'+server.address().port+'/?r='+encodeRecipe(source),
        {waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelector('#preview')?.dataset.renderPending==='false',
        null,{timeout:80000});
      assert.equal(current(page).textureRotation,350);
      await page.locator('#mobileEdit').click();
      await page.locator('#tab-material').click();
      await page.locator('.editor-tool-chooser [data-editor-tool="layer1"]').click();
      const card=page.locator('.editor-tool-card[data-editor-tool="layer1"]');
      await card.locator('.material-inspector-tab',{hasText:'Finish'}).click();
      const trigger=card.locator('[data-rotation-precision="textureRotation"]');
      assert.equal(await trigger.isVisible(),true);
      const grip=await trigger.evaluate(el=>{
        const r=el.getBoundingClientRect();return [r.width,r.height];
      });
      assert.ok(grip[0]>=44&&grip[1]>=44);
      await trigger.click();
      const entry=page.locator('.rotation-scrub-entry');
      assert.equal(await entry.getAttribute('type'),'text');
      assert.equal(await entry.inputValue(),'350');
      const run=async(expr,expected)=>{
        await entry.fill(expr);
        assert.equal(current(page).textureRotation,expected==='invalid'?current(page).textureRotation:before,
          'Typing before change must not commit an incomplete expression');
        await entry.press('Tab');
        if(expected==='invalid'){
          assert.equal(await entry.getAttribute('aria-invalid'),'true');
          assert.equal(current(page).textureRotation,before);
        }else{
          await page.waitForFunction(n=>{
            try{
              const r=JSON.parse(decodeURIComponent(new URL(location.href).searchParams.get('r')));
              return r.textureRotation===n;
            }catch{return false;}
          },expected,{timeout:12000});
          assert.equal(current(page).textureRotation,expected);
          assert.equal(await entry.inputValue(),String(expected));
          assert.equal(await entry.getAttribute('aria-invalid'),null);
        }
      };
      let before=current(page).textureRotation;
      await run('+=15',5);
      before=5;await run('-90',270);
      before=270;await run('45+15°',60);
      before=60;await run('1/0','invalid');
      before=60;await run('*=2',120);
      await page.screenshot({path:join(out,width+'x'+height+'.png'),animations:'disabled'});
      await page.locator('.rotation-scrub-close').click();
      assert.equal(await trigger.evaluate(el=>document.activeElement===el),true,
        'exact input dialog must return keyboard focus to its source control');
      result.push({viewport:[width,height],final:current(page).textureRotation,
        expressions:['+=15','-90','45+15°','1/0 (rejected)','*=2'],status:'pass'});
    }finally{await page.close();}
  }
  assert.deepEqual(browserErrors,[]);
  await writeFile(join(out,'report.json'),JSON.stringify(result,null,2));
  console.log('ANGLE_EXPRESSIONS_BROWSER_PASS '+JSON.stringify(result));
}finally{
  await browser?.close();
  await new Promise(ok=>server.close(ok));
}
