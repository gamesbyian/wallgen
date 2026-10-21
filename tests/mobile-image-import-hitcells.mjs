#!/usr/bin/env node
/** Real Chromium image-import source touch cells, not CSS-only assertions. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const dir=resolve('artifacts/mobile-image-import-hitcells');
await mkdir(dir,{recursive:true});
const source=normalizeRecipe({seed:'image-import-44px',structure:'paths',
  geometry:'zigzag',lockedSettings:[]});
const image='<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500">'+
 '<rect width="300" height="500" fill="white"/>'+
 '<path d="M15 450 L270 45" stroke="black" stroke-width="12"/></svg>';
const file={name:'native-hitbox-diagonal.svg',mimeType:'image/svg+xml',
  buffer:Buffer.from(image)};
const browser=await chromium.launch({headless:true}),observations=[];
try{
  for(const width of [320,412]){
    for(const theme of ['cream','dark']){
      const context=await browser.newContext({viewport:{width,height:892},
        hasTouch:true,isMobile:true,reducedMotion:'reduce'});
      const page=await context.newPage(),errors=[];
      page.setDefaultTimeout(16000);
      page.on('pageerror',e=>errors.push(String(e)));
      try{
        await page.goto(origin+'/?r='+encodeRecipe(source),{waitUntil:'domcontentloaded'});
        await page.evaluate(t=>localStorage.setItem('roygbiv:studio-theme:v1',t),theme);
        await page.reload({waitUntil:'domcontentloaded'});
        const before=decodeRecipe(new URL(page.url()).searchParams.get('r'));
        const frame=await page.locator('.wallpaper-frame').boundingBox();
        const measure=async (selector,probe=true)=>{
          const el=page.locator(selector);
          await el.scrollIntoViewIfNeeded();
          return el.evaluate((el,probe)=>{
            const r=el.getBoundingClientRect();
            const hits=[.18,.5,.82].flatMap(y=>[.18,.5,.82].map(x=>{
              const own=document.elementFromPoint(r.left+r.width*x,r.top+r.height*y);
              return own===el||el.contains(own);
            }));
            return {id:el.id,width:r.width,height:r.height,
              nineOwn:probe?hits.every(Boolean):null,disabled:el.disabled||false};
          },probe);
        };
        const launch=await measure('.mobile-preview-rail-left #importPathToggle');
        assert.ok(launch.width>=44&&launch.height>=44&&launch.nineOwn,
          'Preview import launcher native target unusable: '+JSON.stringify(launch));
        // In one portrait width, exercise the importer with browser fullscreen
        // active to verify its new Close target and preexisting fullscreen exit
        // remain independently touchable in the top-layer header.
        const fullscreen=width===412;
        if(fullscreen){
          await page.locator('#mobileFullscreenToggle').tap();
          await page.waitForFunction(()=>Boolean(document.fullscreenElement));
        }
        const [chooser]=await Promise.all([
          page.waitForEvent('filechooser'),page.locator('#importPathToggle').tap()
        ]);
        await chooser.setFiles(file);
        await page.locator('#imagePathDialog[open]').waitFor();
        await page.waitForFunction(()=>['ready','empty'].includes(
          document.getElementById('imagePathDialog')?.dataset.phase));
        const measurements=[];
        for(const id of ['imagePathCancel','imagePathAnother','imagePathAngle',
          'imagePathApply','imagePathCandidate']){
          const m=await measure('#'+id,!['imagePathAngle','imagePathApply'].includes(id));
          assert.ok(m.width>=44&&m.height>=44,
            id+' native touch region smaller than 44px: '+JSON.stringify(m));
          if(m.nineOwn!==null)assert.ok(m.nineOwn,
            id+' native action obstructed: '+JSON.stringify(m));
          measurements.push(m);
        }
        const close=await page.locator('#imagePathCancel').boundingBox();
        const fs=await page.locator('#mobileFullscreenToggle').boundingBox();
        assert.ok(fs&&close&&fs.x+fs.width<=close.x+1,
          'Importer Close and fullscreen exit touch areas overlap: '+
          JSON.stringify({close,fullscreen:fs}));
        const modal=await page.locator('#imagePathDialog').boundingBox();
        const preview=await page.locator('#imagePathCanvas').boundingBox();
        assert.ok(preview.height>=80&&modal.height<=892,
          '44px controls clipped image examination surface: '+
          JSON.stringify({modal,preview}));
        // Reopen source file chooser from the existing Another image control.
        if(await page.locator('#imagePathAnother').isEnabled()){
          const [again]=await Promise.all([
            page.waitForEvent('filechooser'),
            page.locator('#imagePathAnother').tap()
          ]);
          await again.setFiles(file);
          await page.waitForFunction(()=>['ready','empty'].includes(
            document.getElementById('imagePathDialog')?.dataset.phase));
        }
        await page.locator('#imagePathCancel').tap();
        await page.waitForFunction(()=>!document.getElementById('imagePathDialog').open);
        if(fullscreen){
          await page.locator('#mobileFullscreenToggle').tap();
          await page.waitForFunction(()=>!document.fullscreenElement);
        }
        const after=await page.locator('.wallpaper-frame').boundingBox();
        assert.ok(Math.abs(after.height-frame.height)<1,
          'Modal actions changed wallpaper preview height');
        assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),before,
          'Open, Another and Close mutated the normalized wallpaper recipe');
        assert.deepEqual(errors,[]);
        const result={width,theme,fullscreen,launch,measurements,
          canvasHeight:preview.height,recipeUnchanged:true};
        observations.push(result);
        await page.screenshot({path:join(dir,width+'-'+theme+'.png'),animations:'disabled'});
        console.log('IMAGE_IMPORT_44PX_PASS',JSON.stringify(result));
      }finally{await context.close()}
    }
  }
  await writeFile(join(dir,'evidence.json'),JSON.stringify({
    source:'actual Chromium touch and original image-file chooser',
    observations,notVerified:['Pixel 6 Pro physical fingers','Android OS picker',
      'TalkBack','human visual judgement']
  },null,2));
}finally{await browser.close()}
