/**
 * Finite UI-state journeys complement the scalar editor schema.
 * The screenshot is evidence of controls and overlays, never a visual
 * regression baseline for wallpaper rendering.
 */
export async function captureSpecialStates({page,ctx,capture,navigate,change,settle,clickIfVisible,errors}){
  const attempt=async(id,operation)=>{
    try{await operation();}
    catch(error){errors.push({profile:ctx.surface.id,zoom:ctx.zoom,case:'special:'+id,error:String(error)});}
  };
  const snap=(id,extra={})=>capture(page,ctx,'special-'+id,{kind:'stateful-journey',...extra});
  const choose=async(tool,label,value)=>{
    const card=page.locator('.editor-tool-card[data-editor-tool="'+tool+'"]');
    await card.locator('label').filter({hasText:label}).first().locator('select').selectOption(value);
    await settle(page);
  };
  const forceClick=async(selector)=>{
    const button=page.locator(selector).first();
    if(!await button.count())throw Error('Missing '+selector);
    await button.evaluate(el=>el.click());
    await settle(page);
  };
  await attempt('theme',async()=>{
    await page.locator('#studioTheme').evaluate(el=>{el.value='dark';el.dispatchEvent(new Event('change',{bubbles:true}));});
    await snap('dark-theme');
    await page.locator('#studioTheme').evaluate(el=>{el.value='cream';el.dispatchEvent(new Event('change',{bubbles:true}));});
  });
  await attempt('variation-mode',async()=>{
    await navigate(page,'layout','arrange');
    await page.locator('#editorVariationMode').selectOption('vary');
    await page.locator('#editorVariationStrength').selectOption('wild');
    await snap('vary-wild');
    await page.locator('#editorVariationMode').selectOption('reroll');
    await page.locator('#editorVariationStrength').selectOption('moderate');
  });
  await attempt('search',async()=>{
    await navigate(page,'layout','arrange');
    if(await clickIfVisible(page,'.editor-search-toggle')){
      await snap('search-expanded-empty');
      await page.locator('.editor-search-input').fill('shadow');
      await settle(page);
      await snap('search-matching-setting');
      await page.locator('.editor-search-input').fill('');
      await clickIfVisible(page,'.editor-search-toggle');
    }
  });
  await attempt('lock',async()=>{
    await change(page,'structure','paths');
    await navigate(page,'layout','arrange');
    const lock=page.locator('.editor-tool-card[data-editor-tool=arrange] .setting-lock:not(:disabled)').first();
    if(!await lock.count())throw Error('No enabled lock in Arrangement');
    await lock.click();
    await snap('setting-locked');
    await lock.click();
    await snap('setting-unlocked');
  });
  await attempt('interior-empty',async()=>{
    await navigate(page,'details','interior');
    await snap('interior-empty');
  });
  await attempt('interior-add',async()=>{
    await navigate(page,'details','interior');
    await page.locator('.editor-tool-card[data-editor-tool=interior] .interior-toolbar button').first().click();
    await snap('interior-one-element');
    for(const tool of ['interior-style','interior-motion','interior-placement','interior-targets']){
      await navigate(page,'details',tool);
      await snap('interior-'+tool+'-populated',{tool});
    }
  });
  await attempt('interior-band',async()=>{
    await navigate(page,'details','interior-style');
    await choose('interior-style','Element','band');
    await snap('interior-band-style');
    await navigate(page,'details','interior-placement');
    await snap('interior-band-width');
    await choose('interior-placement','Placement','contour');
    await snap('interior-contour-placement');
    await navigate(page,'details','interior-motion');
    await snap('interior-contour-cycles');
  });
  await attempt('interior-straight',async()=>{
    await navigate(page,'details','interior-style');
    await choose('interior-style','Geometry','straight');
    await navigate(page,'details','interior-motion');
    await snap('interior-straight-disabled-motion');
  });
  await attempt('interior-target',async()=>{
    await navigate(page,'details','interior-targets');
    await choose('interior-targets','Ink','custom');
    await snap('interior-custom-colour-enabled');
    await page.locator('.editor-tool-card[data-editor-tool=interior-targets] .interior-targets input[type=checkbox]').first().uncheck();
    await snap('interior-selected-colour-targets');
  });
  await attempt('interior-stack',async()=>{
    await navigate(page,'details','interior');
    await page.locator('.editor-tool-card[data-editor-tool=interior] .interior-toolbar button').first().click();
    await snap('interior-two-elements');
    await page.locator('.editor-tool-card[data-editor-tool=interior] .interior-toolbar select').selectOption('1');
    await snap('interior-second-selected');
    await page.locator('.editor-tool-card[data-editor-tool=interior] button').filter({hasText:'Lock all elements'}).click();
    await snap('interior-stack-locked');
    await navigate(page,'details','interior-style');
    await snap('interior-style-read-only');
    await navigate(page,'details','interior');
    await page.locator('.editor-tool-card[data-editor-tool=interior] button').filter({hasText:'Unlock all elements'}).click();
    await snap('interior-stack-unlocked');
  });
  await attempt('gallery-empty',async()=>{
    await forceClick('#showFavorites');
    if(ctx.surface.mobile)await clickIfVisible(page,'#mobileExplore');
    await snap('gallery-empty-favourites');
    if(ctx.surface.mobile)await clickIfVisible(page,'#mobileExplore');
  });
  await attempt('gallery-one',async()=>{
    await forceClick('#favorite');
    await forceClick('#showFavorites');
    if(ctx.surface.mobile)await clickIfVisible(page,'#mobileExplore');
    await snap('gallery-with-favourite');
    if(ctx.surface.mobile)await clickIfVisible(page,'#mobileExplore');
    await forceClick('#favorite');
  });
  await attempt('metadata-open',async()=>{
    if(ctx.surface.mobile)await clickIfVisible(page,'#mobileMore');
    if(await clickIfVisible(page,'#metadataToggle')){
      await snap('metadata-expanded');
      await page.locator('#metadataRemember').check();
      await snap('metadata-remember-checked');
      await page.locator('#metadataRemember').uncheck();
      await clickIfVisible(page,'#metadataToggle');
    }else throw Error('Metadata control not reachable');
    if(ctx.surface.mobile)await clickIfVisible(page,'#mobileMore');
  });
  await attempt('mobile-rails',async()=>{
    if(!ctx.surface.mobile)return;
    await clickIfVisible(page,'#mobileEdit');
    await snap('mobile-edit-rail');
    if(await clickIfVisible(page,'#mobileBleed'))await snap('mobile-bleed-guide-enabled');
    await clickIfVisible(page,'#mobileBleed');
    if(await clickIfVisible(page,'[data-zoom=in].mobile-zoom-button'))await snap('mobile-preview-zoom-readout');
  });
  await attempt('draw-empty',async()=>{
    // The drawing launch lives in the editor toolbar on desktop and in the
    // preview rail or original toolbar on mobile.
    if(ctx.surface.mobile)await clickIfVisible(page,'#mobileEdit');
    await clickIfVisible(page,'#drawPathToggle');
    const panel=page.locator('#drawPathPanel');
    if(!await panel.isVisible())throw Error('Drawing panel did not open');
    await snap('draw-empty-panel');
  });
  await attempt('draw-stroke',async()=>{
    const canvas=page.locator('#drawOverlay');
    const b=await canvas.boundingBox();
    if(!b||b.width<30||b.height<30)throw Error('Drawing overlay unavailable');
    const pts=[[.24,.23],[.30,.32],[.43,.40],[.53,.55],[.62,.62],[.72,.75]];
    await page.mouse.move(b.x+b.width*pts[0][0],b.y+b.height*pts[0][1]);
    await page.mouse.down();
    for(const p of pts.slice(1))await page.mouse.move(b.x+b.width*p[0],b.y+b.height*p[1],{steps:4});
    await page.mouse.up();
    await settle(page);
    if(!await page.locator('#drawApply').isEnabled())throw Error('Drawn path was not accepted');
    await snap('draw-ready-path');
    if(await clickIfVisible(page,'#drawGeometric'))await snap('draw-geometric-smoothing');
    await page.locator('#drawSmoothingStrength').fill('8');
    await snap('draw-smoothing-strength');
    await page.locator('#drawExtendPath').check();
    await snap('draw-extend-path');
    if(await clickIfVisible(page,'#drawEditPoints')){
      await snap('draw-edit-point-anchors');
      if(await clickIfVisible(page,'#drawAddPoint'))await snap('draw-add-anchor-mode');
      await clickIfVisible(page,'#drawAddPoint');
      await clickIfVisible(page,'#drawEditPoints');
    }
    await clickIfVisible(page,'#drawCancel');
  });
  await attempt('import-image',async()=>{
    const fixture='<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500" viewBox="0 0 300 500"><rect width="300" height="500" fill="white"/><path d="M 15 450 L 270 45" stroke="black" stroke-width="9" fill="none"/></svg>';
    await page.locator('#imagePathFile').setInputFiles({name:'ui-atlas-line.svg',mimeType:'image/svg+xml',buffer:Buffer.from(fixture)});
    await page.locator('#imagePathDialog[open]').waitFor({timeout:5000});
    await settle(page);
    await snap('image-import-candidate-or-error');
    const option=page.locator('#imagePathCandidate option');
    if(await option.count()>1){
      await page.locator('#imagePathCandidate').selectOption('1');
      await snap('image-import-alternate-candidate');
    }
    if(await page.locator('#imagePathApply').isEnabled()){
      await clickIfVisible(page,'#imagePathApply');
      await snap('image-imported-path-provisional');
      await clickIfVisible(page,'#drawCancel');
    }else await clickIfVisible(page,'#imagePathCancel');
  });
}
