#!/usr/bin/env node
/**
 * Twelve live canonical-screen plate probes. Each source candidate is
 * inspected in a REAL running Chromium page after navigating to the
 * corresponding screen and relevant conditional mode. A source match is NOT
 * automatically a successful/operable/visually approved control.
 */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe} from '../src/model.js';
const contract=JSON.parse(await readFile(new URL(
  '../docs/ui-reference/agent2-runtime-plate-traceability.json',import.meta.url),'utf8'));
const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const out=resolve(process.env.ROYGBIV_PLATE_OUT||'artifacts/agent2-live-plates');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[],errors=[];
const base={seed:'agent2-real-plate-source',structure:'paths',geometry:'zigzag',
  orientation:'diagonal',diagonalRotation:19,mirrorHorizontal:true,
  shapeFrequency:42,shapeDepth:61,outline:'white',composition:'repeat',
  repeatCount:3,material:'linen',textureStrength:65,textureLayer2Enabled:true,
  material2:'foil',textureStrength2:62,textureLayer3Enabled:true,material3:'grain',
  textureStrength3:43,viewZoom:.85};
async function exercise(plate,page){
  if(plate==='studio')return;
  if(plate==='draw'){
    await page.locator('#drawPathToggle').click();
    await page.locator('#drawPathPanel').waitFor({state:'visible'});
    return;
  }
  if(plate==='explore'){
    await page.locator('#mobileExplore').click();
    await page.locator('#batch').click();
    await page.waitForFunction(()=>document.querySelectorAll('#gallery .thumb').length===12,
      null,{timeout:25000});
    return;
  }
  if(plate==='more'){
    await page.locator('#mobileMore').click();
    await page.locator('#metadataToggle').click();
    await page.locator('#metadataPanel').waitFor({state:'visible'});
    return;
  }
  if(plate==='history')await page.locator('#randomizeAll').click();
  await page.locator('#mobileEdit').click();
  const categories={
    geometry:'path',material:'material',colour:'colour',
    diagonal:'layout',compact:'details',focus:'path',
    history:'path',search:'path'
  };
  await page.locator('#tab-'+categories[plate]).click();
  const tools={
    geometry:'geometry',material:'layer2',colour:'rainbow',
    diagonal:'direction',compact:'glow',focus:'geometry',
    history:'geometry',search:'geometry'
  };
  if(plate==='history'){
    // Randomize-all deliberately changes the composition structure; the
    // initial Paths-only Geometry chip may now be source-inapplicable.
    await page.locator('.editor-tool-chooser [data-editor-tool]:visible').first().click();
  }else{
    await page.locator('.editor-tool-chooser [data-editor-tool="'+tools[plate]+'"]').click();
  }
  if(plate==='focus'){
    const sourceColours=()=>page.locator(
      '.editor-tool-card[data-editor-tool="geometry"] [data-setting][type="range"]')
      .evaluateAll(fields=>fields.map(el=>({
        key:el.name,colour:el.style.getPropertyValue('--roygbiv-slider-color')
      })));
    const before=await sourceColours();
    assert.equal(before.length,2,'Focus Geometry source range inventory changed');
    assert.ok(before.every(x=>x.colour.trim()),
      'Focus original ranges lack their assigned ROYGBIV colours');
    assert.equal(new Set(before.map(x=>x.colour)).size,2,
      'Focus original fields reuse a colour unexpectedly');
    await page.locator('.editor-focus-toggle').click();
    const other=page.locator('.editor-focus-chip[data-focus-key="shapeDepth"]');
    await other.click();
    assert.deepEqual(await sourceColours(),before,
      'Focus parameter switching reassigned original range colours');
  }
  if(plate==='history')await page.locator('#editorHistoryToggle').click();
  if(plate==='search'){
    await page.locator('button[aria-label="Find a setting"]').click();
    await page.locator('.editor-search-input').fill('geometry');
  }
}
const pages=['studio','geometry','draw','explore','more','material',
  'colour','diagonal','compact','focus','history','search'];
try{
  for(const plate of pages){
    const page=await browser.newPage({viewport:{width:412,height:892},
      isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    page.setDefaultTimeout(15000);
    const scriptErrors=[];
    page.on('pageerror',e=>scriptErrors.push(String(e)));
    try{
      const recipe=normalizeRecipe(base);
      await page.goto(origin+'/?r='+encodeRecipe(recipe),{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.body.classList.contains('mobile-five-nav'));
      await exercise(plate,page);
      // Objective forbidden-plate canaries: unlike the remaining subjective
      // aesthetic claims, these omissions can be decisively falsified in
      // actual Chromium. Do not confuse them with approval of all 27.
      const negativeCanaries=[];
      if(plate==='studio'){
        assert.equal(await page.locator(
          '.studio-stage h1,.studio-stage h2,.studio-stage h3').count(),0,
          'Forbidden decorative stage heading displaced the wallpaper');
        assert.equal(await page.locator('.masthead [data-zoom="fit"]').count(),0,
          'Forbidden top Fit button appeared in the masthead');
        assert.equal(await page.locator(
          '.mobile-preview-rail-right [data-zoom="fit"]').count(),1,
          'The actual source Fit button disappeared from the canvas rail');
        negativeCanaries.push('no-stage-heading','Fit-remains-on-canvas-rail');
      }
      if(plate==='geometry'){
        assert.equal(await page.locator(
          '.editor-tool-card[data-editor-tool="geometry"] h2,'+
          '.editor-tool-card[data-editor-tool="geometry"] h3').count(),0,
          'Forbidden duplicate tool heading consumes editor card height');
        negativeCanaries.push('no-duplicate-tool-heading');
      }
      if(plate==='colour'){
        assert.equal(await page.locator('#controls [name="saturation"]').count(),0,
          'Unimplemented extra saturation control was introduced');
        negativeCanaries.push('no-fictitious-saturation-setting');
      }
      if(plate==='compact'){
        const controls=await page.locator(
          '.editor-tool-card[data-editor-tool="glow"] [data-setting]')
          .evaluateAll(nodes=>nodes.map(node=>node.name));
        assert.deepEqual(controls,['glow'],
          'Sparse Glow acquired unimplemented source settings');
        negativeCanaries.push('compact-glow-has-only-original-source-field');
      }
      if(plate==='diagonal'){
        for(const key of ['mirrorHorizontal','mirrorVertical']){
          const wrapped=await page.locator('[data-setting][name="'+key+'"]')
            .evaluate(el=>el.closest('label')?.contains(el));
          assert.equal(wrapped,true,
            key+': mirror checkbox separated from its original label');
        }
        negativeCanaries.push('mirrors-remain-native-labelled-checkboxes');
      }
      if(plate==='search'){
        assert.ok(await page.locator('.editor-search-close').isVisible(),
          'Search input opened without its separately reachable close action');
        negativeCanaries.push('search-close-action-preserved');
      }
      const source=contract.entries.filter(row=>row.plate===plate);
      const probed=await page.evaluate(entries=>entries.map(row=>{
        if(!row.sourceCandidate)return {id:row.id,kind:row.kind,
          state:'forbidden-unmapped',candidates:0};
        try{
          const nodes=[...document.querySelectorAll(row.sourceCandidate)];
          const exposed=nodes.map(el=>{
            const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
            const viewport=rect.width>0&&rect.height>0&&
              rect.bottom>0&&rect.top<innerHeight&&rect.right>0&&rect.left<innerWidth;
            const visible=viewport&&style.display!=='none'&&
              style.visibility!=='hidden'&&!el.closest('[hidden],[inert]');
            const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
            const top=x>=0&&x<innerWidth&&y>=0&&y<innerHeight?
              document.elementFromPoint(x,y):null;
            return {visible,enabled:!el.disabled,hit:visible&&
              (el===top||el.contains(top)),tag:el.tagName,
              label:el.getAttribute('aria-label')||
                el.labels?.[0]?.textContent?.trim()?.slice(0,70)||
                el.innerText?.trim()?.slice(0,70)||'',
              rect:[Math.round(rect.x),Math.round(rect.y),
                Math.round(rect.width),Math.round(rect.height)]};
          });
          return {id:row.id,kind:row.kind,selector:row.sourceCandidate,
            candidates:nodes.length,visible:exposed.filter(el=>el.visible).length,
            enabledVisible:exposed.filter(el=>el.visible&&el.enabled).length,
            physicallyHittable:exposed.filter(el=>el.hit&&el.enabled).length,
            examples:exposed.slice(0,3),
            state:nodes.length?'source-present':'no-source-in-this-state'};
        }catch(error){return {id:row.id,kind:row.kind,selector:row.sourceCandidate,
          state:'invalid-selector',error:String(error)}}
      }),source);
      await page.screenshot({path:join(out,plate+'.png'),animations:'disabled'});
      assert.ok(probed.some(x=>x.visible>0),
        plate+': no canonical mapped controls exposed to this actual plate');
      // Source presence alone is insufficient: at least one canonical action
      // must be enabled AND own its centre hit target in the live viewport.
      // A CSS-visible screen covered by an inert overlay cannot pass.
      const hittable=probed.filter(x=>x.physicallyHittable>0);
      assert.ok(hittable.length>0,
        plate+': no enabled canonical action owns a viewport centre hit target; '+
        JSON.stringify(probed.filter(x=>x.visible>0)));
      // Canonical REQUIRED claims are stronger than optional or conditional
      // illustrations: every mapped selector must exist in its real plate.
      // Source presence is recorded separately from user operability, so
      // hidden/disabled but legitimately retained source nodes cannot be
      // falsely counted as clicked or visible.
      const absentRequired=probed.filter(x=>x.kind==='required'&&
        x.state!=='source-present');
      assert.deepEqual(absentRequired,[],
        plate+': unmapped required canonical capability in live source');
      assert.ok(probed.some(x=>x.kind==='required'&&x.physicallyHittable>0),
        plate+': no REQUIRED canonical action owns an enabled centre hit target');
      assert.deepEqual(probed.filter(x=>x.state==='invalid-selector'),[],
        plate+': invalid canonical source selectors');
      assert.deepEqual(scriptErrors,[],'Runtime error on '+plate);
      const sample={plate,viewport:[412,892],mode:await page.locator('body')
        .getAttribute('class'),sourceClaims:source.length,
        observedSelectors:probed.filter(x=>x.candidates>0).length,
        actuallyVisible:probed.filter(x=>x.visible>0).length,
        physicallyHittableClaims:probed.filter(x=>x.physicallyHittable>0).length,
        requiredClaims:probed.filter(x=>x.kind==='required').length,
        requiredSourceMapped:probed.filter(x=>x.kind==='required'&&
          x.state==='source-present').length,
        requiredActuallyVisible:probed.filter(x=>x.kind==='required'&&x.visible>0).length,
        requiredPhysicallyHittable:probed.filter(x=>x.kind==='required'&&
          x.physicallyHittable>0).length,
        sourceOnly:probed.filter(x=>x.candidates>0&&!x.visible).map(x=>x.id),
        unmatched:probed.filter(x=>x.state==='no-source-in-this-state').map(x=>x.id),
        invalidSelectors:probed.filter(x=>x.state==='invalid-selector').map(x=>x.id),
        claimResults:probed,negativeCanaries,scriptErrors};
      results.push(sample);
      console.log('AGENT2_LIVE_PLATE',JSON.stringify({
        plate,sourceClaims:sample.sourceClaims,
        sourceCandidates:sample.observedSelectors,
        visibleClaims:sample.actuallyVisible,
        hittableClaims:sample.physicallyHittableClaims,
        requiredClaims:sample.requiredClaims,
        requiredSourceMapped:sample.requiredSourceMapped,
        requiredHit:sample.requiredPhysicallyHittable,
        negativeCanaries:sample.negativeCanaries.length,
        unmatched:sample.unmatched.length,sourceOnly:sample.sourceOnly.length
      }));
    }catch(error){
      errors.push({plate,message:String(error),stack:error.stack});
      await page.screenshot({path:join(out,'failure-'+plate+'.png'),
        animations:'disabled'}).catch(()=>{});
      console.error('AGENT2_LIVE_PLATE_FAILURE',plate,String(error));
    }finally{await page.close()}
  }
  await writeFile(join(out,'evidence.json'),JSON.stringify({
    classification:errors.length?'PARTIAL / failing screen':
      'real browser full required-source inventory plus mandatory per-plate hitability',
    sourceCommit:'PR #268 (see CI run SHA)',canonicalClaims:177,
    limitations:['CSS source matches do not prove actual operability',
      'Focused screen is a representative real state, not every condition',
      'Forbidden entries need explicit adversarial negative tests',
      'Schematic artwork has not received human fidelity approval',
      'No Android physical-device or assistive-reader signoff'],results,errors
  },null,2));
  assert.deepEqual(errors,[],'One or more live canonical plates could not be reached');
  console.log('AGENT2_LIVE_PLATES_SUCCESS');
}finally{await browser.close();}
