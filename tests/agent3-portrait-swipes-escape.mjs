#!/usr/bin/env node
// One-off Chromium acceptance for #619/#620 only. Not Pixel or human evidence.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/model.js';

const origin=process.env.ROYGBIV_URL||'http://127.0.0.1:4173';
const output=resolve('artifacts/agent3-portrait-swipes-escape');
await mkdir(output,{recursive:true});
const recipe=normalizeRecipe({seed:'agent3-visible-swipes-escape',
  structure:'radial',radialMode:'rays',rayCount:9,lockedSettings:[]});
const browser=await chromium.launch({headless:true});
const observations=[];
try{
  for(const [width,height] of [[320,700],[412,892],[600,700],[600,900]]){
    const context=await browser.newContext({viewport:{width,height},
      // Primary Pixel 6 Pro physical-resolution class: 412×892 CSS x DPR 3.5.
      deviceScaleFactor:width===412?3.5:1,
      isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    page.setDefaultTimeout(30000);
    try{
      await page.goto(origin+'/?r='+encodeRecipe(recipe),
        {waitUntil:'domcontentloaded'});
      await page.locator('#mobileEdit').tap();
      // The 1440×3120 physical-display class has a roughly 412×892 CSS
      // viewport. Validate real hit rectangles, not 1440px CSS breakpoints.
      let compactExplore=null;
      if(width<=499){
        compactExplore=await page.evaluate(()=>{
          const selectors=['.editor-style select','#editorVariationToggle',
            '.editor-explore-actions>.editor-scope-button',
            '.editor-explore-actions>.editor-search-toggle[aria-label="Find a setting"]'];
          return selectors.map(selector=>{
            const node=document.querySelector(selector);
            if(!node)throw Error('Missing compact source action: '+selector);
            const r=node.getBoundingClientRect();
            const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
            return {selector,width:r.width,height:r.height,
              centerHit:node===hit||node.contains(hit),
              viewportVisible:r.left>=0&&r.right<=innerWidth};
          });
        });
        for(const t of compactExplore)
          assert.ok(t.width>=44&&t.height>=44&&t.centerHit&&t.viewportVisible,
            'Compact portrait action must be a real visible >=44px hit cell: '+JSON.stringify(t));
        const toggle=page.locator('#editorVariationToggle');
        assert.equal(await page.locator('#editorVariationOptions').isVisible(),false,
          'Detail selectors must be disclosed, not squeezed into 29px defaults');
        await toggle.tap();
        assert.equal(await toggle.getAttribute('aria-expanded'),'true',
          'Variation action must accurately announce expanded state');
        const actualOptions=await page.evaluate(()=>{
          const panel=document.getElementById('editorVariationOptions');
          const explorer=document.querySelector('.editor-explore').getBoundingClientRect();
          const tabs=document.querySelector('.settings-tabs').getBoundingClientRect();
          const selectors=[...panel.querySelectorAll('select')];
          return {selectors:selectors.map(node=>{
              const r=node.getBoundingClientRect();
              const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
              return {height:r.height,width:r.width,hit:node===hit||node.contains(hit)};
            }),
            sourceMatches:document.querySelectorAll('#editorVariationMode').length===1&&
              document.querySelectorAll('#editorVariationStrength').length===1,
            insideSheet:explorer.bottom<=tabs.top+1};
        });
        assert.ok(actualOptions.sourceMatches&&actualOptions.insideSheet,
          'Variation must reuse original select nodes and reserve space above tabs');
        for(const item of actualOptions.selectors)
          assert.ok(item.height>=44&&item.width>=44&&item.hit,
            'Disclosed original selectors must be physically tappable');
        await page.locator('#editorVariationMode').selectOption('vary');
        await page.locator('#editorVariationStrength').selectOption('wild');
        await page.locator('#editorVariationStrength').focus();
        await page.keyboard.press('Escape');
        assert.equal(await toggle.getAttribute('aria-expanded'),'false');
        assert.equal(await page.locator('#editorVariationOptions').isVisible(),false,
          'Escape must close only transient Variation controls');
        assert.equal(await toggle.evaluate(el=>document.activeElement===el),true,
          'Escape must return focus to the same visible Variation action');
        assert.equal(await page.locator('body').evaluate(el=>
          el.classList.contains('mobile-edit-open')),true,
          'Variation Escape must not dismiss the whole Edit sheet');
        assert.equal(await page.locator('#editorVariationMode').inputValue(),'vary',
          'Source variation mode remains stable after detail disclosure');
        assert.equal(await page.locator('#editorVariationStrength').inputValue(),'wild',
          'Source variation strength remains stable after detail disclosure');
        assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),recipe,
          'Variation disclosure and mode selection must leave authored recipe untouched');
      }else{
        assert.equal(await page.locator('#editorVariationToggle').isVisible(),false,
          'Wide mobile preserves the original two inline variation selectors');
        assert.equal(await page.locator('#editorVariationMode').isVisible(),true);
        assert.equal(await page.locator('#editorVariationStrength').isVisible(),true);
      }
      // Browser zoom can yield 500–790 CSS px even on an actual phone.
      // This width band used a 36px tool chip and 35×38px search/dice.
      // Confirm the real mounted DOM, plus hit-test ownership (no overlaps).
      let zoomedPhoneTargets=null;
      if(width>=500){
        zoomedPhoneTargets=await page.evaluate(()=>{
          const selectors=[
            '.editor-style select',
            '.editor-variation-mode',
            '.editor-variation-strength',
            '.editor-explore-actions>.editor-scope-button',
            '.editor-explore-actions>.editor-search-toggle',
            '.editor-tool-tab:not([hidden])',
            '.editor-tool-chooser>.editor-focus-toggle',
            '.editor-tool-chooser>.editor-tool-reroll:not([hidden])'
          ];
          return selectors.map(selector=>{
            const node=document.querySelector(selector);
            if(!node)throw Error('Expected original source control: '+selector);
            const r=node.getBoundingClientRect();
            const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
            return {selector,width:r.width,height:r.height,visible:r.width>0&&r.height>0,
              centeredHit:node===hit||node.contains(hit)};
          });
        });
        for(const t of zoomedPhoneTargets){
          assert.ok(t.visible&&t.width>=44&&t.height>=44,
            'Native 44px phone target must fit its original lane: '+JSON.stringify(t));
          assert.ok(t.centeredHit,
            'Actual center tap cannot be intercepted by another control: '+JSON.stringify(t));
        }
      }
      // Seven minimum-width tabs cannot physically fit at 320 CSS pixels.
      // Exercise native scroll, actual touch selection and keyboard Home.
      const categories=await page.evaluate(()=>{
        const rail=document.querySelector('.settings-tabs');
        const tabs=[...rail.querySelectorAll('[data-tab]')];
        return {count:tabs.length,clientWidth:rail.clientWidth,
          scrollWidth:rail.scrollWidth,
          overflowX:getComputedStyle(rail).overflowX,
          touchAction:getComputedStyle(rail).touchAction,
          minWidth:Math.min(...tabs.map(t=>t.getBoundingClientRect().width)),
          minHeight:Math.min(...tabs.map(t=>t.getBoundingClientRect().height)),
          first:tabs[0].dataset.tab,last:tabs.at(-1).dataset.tab};
      });
      assert.equal(categories.count,7,'All seven category tabs must exist');
      assert.ok(categories.minWidth>=46&&categories.minHeight>=44,
        'Every tab needs a genuine 47×44 CSS-pixel touch cell');
      if(width<=499){
        assert.equal(categories.overflowX,'auto',
          'Overflow must scroll natively instead of clipping at the editor');
        assert.equal(categories.touchAction,'pan-x',
          'Horizontal thumb gestures belong to the category rail');
      }else{
        // The 500–790px category row already fits its seven full-size cells.
        // Its original overflow:visible is harmless at zero scroll overflow.
        assert.ok(categories.scrollWidth<=categories.clientWidth+1,
          'Wide category tabs must not be clipped or need a second scroll owner');
      }
      if(width===320)assert.ok(categories.scrollWidth>categories.clientWidth+8,
        'At 320, the last category needs real horizontal scroll space');
      else assert.ok(categories.scrollWidth<=categories.clientWidth+1,
        'At 412, the seven category cells should fit without scroll');
      await page.locator('.settings-tabs [data-tab]').last().tap();
      const lastCategory=await page.evaluate(()=>{
        const rail=document.querySelector('.settings-tabs');
        const tab=rail.querySelector('[data-tab][aria-selected="true"]');
        const a=rail.getBoundingClientRect(),b=tab.getBoundingClientRect();
        return {selected:tab.dataset.tab,visible:b.left>=a.left-1&&b.right<=a.right+1,
          scrollLeft:rail.scrollLeft};
      });
      assert.equal(lastCategory.selected,categories.last,
        'Touch must reach the last category');
      assert.equal(lastCategory.visible,true,
        'The final selected tab must be physically visible');
      if(width===320)assert.ok(lastCategory.scrollLeft>1,
        'Last tab selection must pan the native 320px category rail');
      await page.keyboard.press('Home');
      assert.equal(await page.locator('.settings-tabs [aria-selected="true"]')
        .getAttribute('data-tab'),categories.first,
        'Keyboard Home must return from the last category to the first');
      await page.locator('#tab-path').tap();
      const read=()=>page.evaluate(()=>{
        const chooser=document.querySelector('.editor-tool-chooser');
        const chips=[...chooser.querySelectorAll('[data-editor-tool]')]
          .filter(el=>el.dataset.category==='path'&&!el.hidden&&!el.disabled);
        const selected=chips.find(el=>el.getAttribute('aria-pressed')==='true');
        const position=document.getElementById('mobileSettingPosition').textContent;
        const selectedRect=selected?.getBoundingClientRect();
        const rail=chooser.getBoundingClientRect();
        const pinned=[...chooser.querySelectorAll(
          '.editor-focus-toggle,.editor-tool-reroll:not([hidden])')]
          .filter(el=>getComputedStyle(el).position==='sticky'&&
            getComputedStyle(el).display!=='none');
        const pinnedRight=Math.max(rail.left,...pinned.map(el=>el.getBoundingClientRect().right));
        return {tools:chips.map(el=>({id:el.dataset.editorTool,name:el.textContent.trim()})),
          selected:selected?.dataset.editorTool||null,position,
          selectedVisible:!!selectedRect&&selectedRect.left>=pinnedRight-3&&
            selectedRect.right<=rail.right+3};
      });
      const before=await read();
      assert.ok(before.tools.length>=2,'Need multiple scene-applicable radial tools');
      assert.match(before.position,new RegExp(' / '+before.tools.length+' · '),
        'Counter must represent the actual applicable tool list');
      assert.equal(before.selected,before.tools[0].id,
        'First applicable tool selected after category tap');
      // Navigation rails intentionally scroll horizontally. A drag on the
      // rail's EMPTY surface must not bubble into the sheet-wide tool switch.
      for(const selector of ['.editor-tool-chooser','.settings-tabs']){
        await page.evaluate(selector=>{
          const target=document.querySelector(selector),rect=target.getBoundingClientRect();
          const touch=x=>new Touch({identifier:19,target,
            clientX:x,clientY:rect.top+rect.height/2,
            screenX:x,screenY:rect.top+rect.height/2});
          const start=touch(rect.right-15),end=touch(rect.left+15);
          target.dispatchEvent(new TouchEvent('touchstart',{
            touches:[start],targetTouches:[start],changedTouches:[start],
            bubbles:true,cancelable:true}));
          target.dispatchEvent(new TouchEvent('touchend',{
            touches:[],targetTouches:[],changedTouches:[end],
            bubbles:true,cancelable:true}));
        },selector);
        assert.equal((await read()).selected,before.selected,
          'Horizontal rail scroll must preserve selected tool: '+selector);
      }
      // Cancelled touches, including Android's scroll interception, cannot
      // leave a pending swipe for the next touchend to consume.
      await page.evaluate(()=>{
        const sheet=document.getElementById('mobileDesignSheet');
        const rect=sheet.getBoundingClientRect();
        const point=x=>new Touch({identifier:21,target:sheet,
          clientX:x,clientY:rect.top+rect.height/2,
          screenX:x,screenY:rect.top+rect.height/2});
        const start=point(rect.right-15),end=point(rect.left+15);
        sheet.dispatchEvent(new TouchEvent('touchstart',{
          touches:[start],targetTouches:[start],changedTouches:[start],
          bubbles:true,cancelable:true}));
        sheet.dispatchEvent(new TouchEvent('touchcancel',{
          touches:[],targetTouches:[],changedTouches:[start],
          bubbles:true,cancelable:true}));
        sheet.dispatchEvent(new TouchEvent('touchend',{
          touches:[],targetTouches:[],changedTouches:[end],
          bubbles:true,cancelable:true}));
      });
      assert.equal((await read()).selected,before.selected,
        'Cancelled touch never changes tools');
      // Dispatch browser-native TouchEvent objects directly at the noninteractive
      // editor surface; this covers the production touch handler and routing.
      await page.evaluate(()=>{
        const sheet=document.getElementById('mobileDesignSheet');
        const rect=sheet.getBoundingClientRect();
        const point=(x)=>new Touch({identifier:1,target:sheet,
          clientX:x,clientY:rect.top+rect.height/2,
          screenX:x,screenY:rect.top+rect.height/2});
        const start=point(rect.right-20),end=point(rect.left+20);
        sheet.dispatchEvent(new TouchEvent('touchstart',{
          touches:[start],targetTouches:[start],changedTouches:[start],
          bubbles:true,cancelable:true}));
        sheet.dispatchEvent(new TouchEvent('touchend',{
          touches:[],targetTouches:[],changedTouches:[end],
          bubbles:true,cancelable:true}));
      });
      const after=await read();
      assert.equal(after.selected,before.tools[1].id,
        'Swipe must advance exactly one actually visible tool');
      assert.ok(after.position.startsWith('2 / '+after.tools.length+' · '),
        'The counter must follow the same canonical selected tool');
      assert.equal(after.selectedVisible,true,
        'Newly swiped tool must be physically visible past sticky actions');
      const search=page.getByRole('button',{name:'Find a setting'});
      await search.tap();
      assert.equal(await page.locator('.editor-search-input').isVisible(),true);
      // A real ambiguous ranked search: exercise mounted option nodes,
      // including the fourth option if it must scroll on short screens.
      await page.locator('.editor-search-input').fill('shadow');
      const searchGeometry=await page.evaluate(()=>{
        const list=document.getElementById('editorSearchResults');
        const sheet=document.getElementById('mobileDesignSheet');
        const choices=[...list.querySelectorAll('[data-search-index]')];
        const bounds=list.getBoundingClientRect();
        const sheetBounds=sheet.getBoundingClientRect();
        const first=choices[0]?.getBoundingClientRect();
        const center=first&&document.elementFromPoint(
          first.left+first.width/2,first.top+first.height/2);
        return {count:choices.length,
          rows:choices.map(node=>({
            width:node.getBoundingClientRect().width,
            height:node.getBoundingClientRect().height
          })),
          listHeight:bounds.height,scrollHeight:list.scrollHeight,
          boundedWithinSheet:bounds.bottom<=sheetBounds.bottom+2,
          firstCenterHit:!!center&&(center===choices[0]||choices[0].contains(center)),
          inputFocused:document.activeElement===document.querySelector('.editor-search-input')};
      });
      assert.ok(searchGeometry.count>=2,'Ambiguous shadow search must show real ranked choices');
      assert.ok(searchGeometry.inputFocused&&searchGeometry.firstCenterHit,
        'Search input focus and actual touch ownership of first option');
      assert.ok(searchGeometry.boundedWithinSheet,
        'Search popover must remain in Edit rather than cover wallpaper');
      for(const row of searchGeometry.rows)
        assert.ok(row.height>=44&&row.width>=44,
          'All mounted ranked options must have real >=44px phone hit cells: '+JSON.stringify(row));
      for(let i=1;i<searchGeometry.count;i++)await page.keyboard.press('ArrowDown');
      const keyboardChoice=await page.evaluate(()=>{
        const list=document.getElementById('editorSearchResults');
        const input=document.querySelector('.editor-search-input');
        const current=document.getElementById(input.getAttribute('aria-activedescendant'));
        const listRect=list.getBoundingClientRect(),choice=current?.getBoundingClientRect();
        const center=choice&&document.elementFromPoint(
          choice.left+choice.width/2,choice.top+choice.height/2);
        return {selected:current?.dataset.searchIndex,
          inputFocused:document.activeElement===input,
          visible:!!choice&&choice.top>=listRect.top-2&&choice.bottom<=listRect.bottom+2,
          centerHit:!!center&&(center===current||current.contains(center)),
          scrollTop:list.scrollTop};
      });
      assert.equal(keyboardChoice.selected,String(searchGeometry.count-1),
        'ArrowDown must select the final semantic result');
      assert.ok(keyboardChoice.visible&&keyboardChoice.centerHit&&keyboardChoice.inputFocused,
        'Keyboard choice remains genuinely visible and tappable within listbox');
      await page.screenshot({path:join(output,'search-'+width+'x'+height+'.png'),
        animations:'disabled'});
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.editor-search-input').isVisible(),false,
        'Escape closes only setting search');
      assert.equal(await page.locator('body').evaluate(el=>
        el.classList.contains('mobile-edit-open')),true,
        'Consumed search Escape must not dismiss Edit');
      assert.equal(await search.evaluate(el=>document.activeElement===el),true,
        'Setting search returns keyboard focus to toggle');
      // Recent Variations is a temporary editor-space view; its Back and
      // Escape routes must not leave focus on a newly hidden panel button or
      // let global Escape dismiss the entire mobile Edit sheet.
      const history=page.locator('#editorHistoryToggle');
      await history.tap();
      const back=page.locator('.editor-history-close');
      const historyExit=await page.evaluate(()=>{
        const button=document.querySelector('.editor-history-close');
        const panel=document.getElementById('editorHistory');
        const sheet=document.getElementById('mobileDesignSheet');
        const r=button.getBoundingClientRect();
        const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
        const sheetBounds=sheet.getBoundingClientRect();
        return {width:r.width,height:r.height,
          centerHit:button===hit||button.contains(hit),
          withinSheet:r.top>=sheetBounds.top&&r.bottom<=sheetBounds.bottom,
          open:!panel.hidden};
      });
      assert.ok(historyExit.open&&historyExit.height>=44&&historyExit.width>=44&&
        historyExit.centerHit&&historyExit.withinSheet,
        'History return must be a real accessible 44px control in Edit: '+
          JSON.stringify(historyExit));
      await page.screenshot({path:join(output,'history-'+width+'x'+height+'.png'),
        animations:'disabled'});
      await back.focus();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#editorHistory').isVisible(),false,
        'History Escape must close its own temporary panel');
      assert.equal(await history.evaluate(el=>document.activeElement===el),true,
        'History Escape must restore visible original action focus');
      assert.equal(await page.locator('body').evaluate(el=>
        el.classList.contains('mobile-edit-open')),true,
        'History Escape must not dismiss Edit');
      await history.tap();
      await back.tap();
      assert.equal(await page.locator('#editorHistory').isVisible(),false);
      assert.equal(await history.evaluate(el=>document.activeElement===el),true,
        'Visible Back action must return keyboard focus to original trigger');
      // Texture's original Material/Finish tabs used 27px phone targets.
      // Measure each REAL source-bound button and the whole visible pane
      // inside the card before accepting the 44px redesign.
      await page.locator('#tab-material').tap();
      const materialTabs='.editor-tool-card[data-editor-tool="layer1"] .material-inspector-tab';
      const inspectMaterial=()=>page.evaluate(()=>{
        const card=document.querySelector('.editor-tool-card[data-editor-tool="layer1"]');
        const cardBounds=card.getBoundingClientRect();
        const buttons=[...card.querySelectorAll('.material-inspector-tab')];
        const pane=card.querySelector('.material-inspector-pane:not([hidden])');
        const paneBounds=pane.getBoundingClientRect();
        const fields=[...pane.querySelectorAll('.lockable-setting')]
          .filter(el=>el.getBoundingClientRect().height>0);
        return {cardVisible:!card.hidden,
          selected:buttons.find(b=>b.getAttribute('aria-pressed')==='true')?.textContent,
          tabs:buttons.map(button=>{
            const b=button.getBoundingClientRect();
            const hit=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);
            return {label:button.textContent,width:b.width,height:b.height,
              centerHit:hit===button||button.contains(hit),
              insideCard:b.top>=cardBounds.top-2&&b.bottom<=cardBounds.bottom+2};
          }),
          paneWithinCard:paneBounds.top>=cardBounds.top-2&&
            paneBounds.bottom<=cardBounds.bottom+2,
          fieldsWithinCard:fields.every(field=>{
            const b=field.getBoundingClientRect();
            return b.top>=cardBounds.top-2&&b.bottom<=cardBounds.bottom+2;
          }),
          visibleFieldCount:fields.length,
          cardBounds:{top:cardBounds.top,bottom:cardBounds.bottom,height:cardBounds.height},
          paneBounds:{top:paneBounds.top,bottom:paneBounds.bottom,height:paneBounds.height},
          fieldBounds:fields.map(field=>{
            const b=field.getBoundingClientRect();
            return {name:field.querySelector('[name]')?.name||'other',
              top:b.top,bottom:b.bottom,height:b.height};
          })};
      });
      const materialBefore=await inspectMaterial();
      assert.equal(materialBefore.cardVisible,true,
        'Original Layer 1 card must be visible');
      assert.equal(materialBefore.selected,'Material');
      for(const tab of materialBefore.tabs)
        assert.ok(tab.width>=44&&tab.height>=44&&tab.centerHit&&tab.insideCard,
          'Material/Finish original tab needs a real >=44px hit cell: '+JSON.stringify(tab));
      assert.ok(materialBefore.paneWithinCard&&materialBefore.fieldsWithinCard,
        'Material view must fit inside original tool card after taller tabs');
      await page.locator(materialTabs).nth(1).tap();
      const materialFinish=await inspectMaterial();
      assert.equal(materialFinish.selected,'Finish',
        'Original Finish action must reveal source-bound Finish inputs');
      console.log('MATERIAL_INSPECTOR_GEOMETRY '+JSON.stringify({
        width,height,materialBefore,materialFinish}));
      assert.ok(materialFinish.paneWithinCard&&materialFinish.fieldsWithinCard&&
        materialFinish.visibleFieldCount>0,
        'No original Finish row may be clipped, even on the 320px fallback: '+
          JSON.stringify(materialFinish));
      await page.screenshot({path:join(output,'material-finish-'+width+'x'+height+'.png'),
        animations:'disabled'});
      await page.keyboard.press('Home');
      assert.equal((await inspectMaterial()).selected,'Material',
        'Home must still select original Material view with keyboard');
      await page.keyboard.press('End');
      assert.equal((await inspectMaterial()).selected,'Finish',
        'End must still select original Finish view with keyboard');
      assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),recipe,
        'Inspector view switching must not change authored material or recipe');
      // Open the existing native Activity dialog programmatically while Edit
      // is shown, isolating Escape ownership without inventing a UI route.
      await page.locator('#creativeActivityOpen').evaluate(el=>el.click());
      assert.equal(await page.locator('#creativeActivityDialog').evaluate(el=>el.open),true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('body').evaluate(el=>
        el.classList.contains('mobile-edit-open')),true,
        'Dialog Escape must leave underlying editor intact');
      assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),recipe,
        'Navigation gestures must never mutate wallpaper recipe');
      assert.deepEqual(errors,[],'Page errors during scene-aware gesture acceptance');
      // Source-first exploratory census: diagnose the next two genuine
      // mobile control actions BEFORE deciding which available space to use.
      // This is a deliberate second recipe, not a mutation of the initial
      // radial viewport/gesture acceptance above.
      const inspectSourceAction=(cardSelector,selector)=>page.evaluate(({cardSelector,selector})=>{
        const card=document.querySelector(cardSelector);
        const button=card?.querySelector(selector);
        if(!card||!button)return {found:false};
        const c=card.getBoundingClientRect(),b=button.getBoundingClientRect();
        const hit=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);
        const children=[...card.querySelectorAll('.lockable-setting')]
          .filter(el=>!el.hidden&&el.getBoundingClientRect().height>0)
          .map(el=>{const x=el.getBoundingClientRect();return {
            name:el.querySelector('[name]')?.name||'',top:x.top,bottom:x.bottom,
            inside:x.top>=c.top-2&&x.bottom<=c.bottom+2};});
        return {found:true,visible:!button.hidden,width:b.width,height:b.height,
          centerHit:hit===button||button.contains(hit),
          top:b.top,bottom:b.bottom,cardTop:c.top,cardBottom:c.bottom,
          insideCard:b.top>=c.top-2&&b.bottom<=c.bottom+2,
          originalControlsInside:children.every(x=>x.inside),originalControls:children,
          label:button.textContent,active:document.activeElement===button};
      },{cardSelector,selector});
      await page.locator('#tab-layout').tap();
      const designAction=await inspectSourceAction(
        '.editor-tool-card[data-editor-tool="structure-mode"]','.editor-design-next');
      assert.match(designAction.label,/Continue → Edit radial rays/,
        'Restored radial design must show the actual next scene tool, not stale Paths');
      assert.ok(designAction.found&&designAction.visible&&
        designAction.height>=44&&designAction.width>=44&&
        designAction.centerHit&&designAction.insideCard&&
        designAction.originalControlsInside,
        'Design Next must have an original unobscured 44px cell: '+
          JSON.stringify(designAction));
      console.log('DESIGN_NEXT_GEOMETRY '+JSON.stringify({width,height,designAction}));
      await page.screenshot({path:join(output,'design-next-'+width+'x'+height+'.png'),
        animations:'disabled'});
      await page.locator('.editor-tool-card[data-editor-tool="structure-mode"] .editor-design-next').tap();
      const designArrival=await page.evaluate(()=>{
        const chip=document.querySelector('.editor-tool-tab[aria-pressed="true"]:not([hidden])');
        return {category:chip?.dataset.category,tool:chip?.dataset.editorTool,
          focused:chip===document.activeElement,
          sourceHidden:document.querySelector(
            '.editor-tool-card[data-editor-tool="structure-mode"]').hidden};
      });
      assert.ok(designArrival.category==='path'&&designArrival.tool&&
        designArrival.focused&&designArrival.sourceHidden,
        'Design Next must navigate and focus the actual source tool: '+
          JSON.stringify(designArrival));
      assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),recipe,
        'Deliberate Design Next navigation must not rewrite the radial recipe');
      const pathRecipe=normalizeRecipe({...recipe,structure:'paths',
        geometry:'straight',construction:'ribbon',motif:'solid'});
      await page.goto(origin+'/?r='+encodeRecipe(pathRecipe),
        {waitUntil:'domcontentloaded'});
      await page.locator('#mobileEdit').tap();
      await page.locator('#tab-layout').tap();
      const pathsDesignAction=await inspectSourceAction(
        '.editor-tool-card[data-editor-tool="structure-mode"]','.editor-design-next');
      assert.match(pathsDesignAction.label,/Continue → Edit paths/,
        'Fresh paths recipe must change Design Continue guidance before navigating');
      await page.locator('#tab-stripes').tap();
      const patternActions=[];
      for(const tool of ['marks','motif-scale']){
        await page.locator('.editor-tool-tab[data-editor-tool="'+tool+'"]').tap();
        const details=await inspectSourceAction(
          '.editor-tool-card[data-editor-tool="'+tool+'"]',
          '.editor-pattern-prerequisite button');
        assert.ok(details.found&&details.visible&&
          details.width>=44&&details.height>=44&&details.centerHit&&
          details.insideCard&&details.originalControlsInside,
          'Dormant Pattern prerequisite must fit native card with >=44px hit: '+
            JSON.stringify({tool,...details}));
        await page.screenshot({path:join(output,'pattern-'+tool+'-'+width+'x'+height+'.png'),
          animations:'disabled'});
        await page.locator('.editor-tool-card[data-editor-tool="'+tool+
          '"] .editor-pattern-prerequisite button').tap();
        const arrival=await page.evaluate(()=>{
          const chip=document.querySelector('.editor-tool-tab[aria-pressed="true"]:not([hidden])');
          return {category:chip?.dataset.category,tool:chip?.dataset.editorTool,
            focused:chip===document.activeElement};
        });
        assert.deepEqual(arrival,{category:'stripes',tool:'patterns',focused:true},
          'Prerequisite must reveal and focus the existing Patterns tool');
        patternActions.push({tool,...details,arrival});
      }
      console.log('PATTERN_ACTION_GEOMETRY '+JSON.stringify({width,height,patternActions}));
      assert.deepEqual(decodeRecipe(new URL(page.url()).searchParams.get('r')),pathRecipe,
        'Deliberate prerequisite navigation must not rewrite authored source recipe');
      assert.deepEqual(errors,[],'No browser script exceptions in guidance census');
      const result={width,height,applicable:before.tools.map(x=>x.id),
        categoryRail:{...categories,lastTouch:lastCategory,keyboardHome:true},
        zoomedPhoneTargets,compactExplore,
        primaryPixelClass:width===412,deviceScaleFactor:width===412?3.5:1,
        swipedFrom:before.selected,swipedTo:after.selected,
        counter:after.position,selectedVisible:after.selectedVisible,
        searchGeometry,keyboardChoice,historyExit,
        materialBefore,materialFinish,designAction,designArrival,pathsDesignAction,patternActions,
        searchEscapeKeepsEdit:true,historyEscapeKeepsEdit:true,
        dialogEscapeKeepsEdit:true,
        recipePreserved:true,railScrollPreserved:true,touchCancelSafe:true,source:'Chromium synthetic TouchEvent and keyboard',
        physicalPixel:false,humanUse:false};
      observations.push(result);
      await page.screenshot({path:join(output,width+'x'+height+'.png'),
        animations:'disabled'});
      console.log('AGENT3_PORTRAIT_GESTURES_PASS '+JSON.stringify(result));
    }catch(error){
      await page.screenshot({path:join(output,'failure-'+width+'x'+height+'.png')})
        .catch(()=>{});
      throw error;
    }finally{await context.close()}
  }
}finally{await browser.close()}
await writeFile(join(output,'results.json'),JSON.stringify({observations},null,2)+'\n');
