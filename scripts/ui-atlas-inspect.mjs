/**
 * Verify that a named screenshot shows its claimed UI state. Also retain a
 * bounded geometric diagnostic inventory for the visual remediation audit.
 * This is observation only and never changes production UI state.
 */
export async function inspectAtlasState(page,ctx,slug,meta={}){
  return page.evaluate(async ({slug,meta,mobile})=>{
    const {inspectGeometry,expectedPageScroll}=await import('/scripts/ui-atlas-geometry.mjs');
    const root=document.body;
    const g=id=>document.querySelector(id);
    const visible=el=>{
      if(!el)return false;
      const b=el.getBoundingClientRect(),s=getComputedStyle(el);
      return b.width>2&&b.height>2&&s.visibility!=='hidden'&&s.display!=='none';
    };
    const shownInShot=el=>{
      if(!visible(el))return false;
      const b=el.getBoundingClientRect();
      let left=Math.max(0,b.left),right=Math.min(innerWidth,b.right);
      let top=Math.max(0,b.top),bottom=Math.min(innerHeight,b.bottom);
      // Fixed mobile trays escape their ordinary ancestors' overflow clips.
      // CSS position:fixed is viewport-rooted unless a containing-block
      // transform intervenes; no such transform is used by these tray shells.
      // Still honour the fixed tray's *own* overflow clip for child fields.
      if(getComputedStyle(el).position!=='fixed')
        for(let a=el.parentElement;a;a=a.parentElement){
          const s=getComputedStyle(a);
          if(/hidden|auto|scroll|clip/.test(s.overflowX+s.overflowY)){
            const r=a.getBoundingClientRect();
            left=Math.max(left,r.left);right=Math.min(right,r.right);
            top=Math.max(top,r.top);bottom=Math.min(bottom,r.bottom);
          }
          if(s.position==='fixed')break;
        }
      return right-left>Math.min(8,b.width*.2)&&bottom-top>Math.min(8,b.height*.2);
    };
    const check=(ok,why)=>{if(!ok)throw Error('Invalid atlas state '+slug+': '+why)};
    if(slug==='editor-open'||slug==='special-mobile-edit-rail')
      check(!mobile||(root.classList.contains('mobile-edit-open')&&shownInShot(g('#mobileDesignSheet'))),'mobile Edit tray not shown');
    let sourceControls=null;
    if(meta.kind==='tool'||meta.kind==='tool-tail'){
      const card=g('.editor-tool-card[data-editor-tool="'+meta.tool+'"]:not([hidden])');
      check(shownInShot(card),'selected tool card missing');
      // The atlas must independently verify every schema setting is housed
      // by the real selected card. Seeing a card alone is insufficient: a
      // control can silently disappear while the screenshot still looks fine.
      if(Array.isArray(meta.settings)){
        const nonVisual=new Set(['textureLayer2Enabled','textureLayer3Enabled']);
        const keys=meta.settings.filter(key=>!nonVisual.has(key));
        const missing=keys.filter(key=>{
          const field=document.querySelector('#controls [name="'+CSS.escape(key)+'"]');
          return !field||!card.contains(field);
        });
        check(missing.length===0,'required source controls missing from '+meta.tool+': '+missing.join(','));
        sourceControls={expected:keys.length,verified:keys.length,keys};
      }
    }
    // Historical material controls inherited a 36px minimum button height
    // inside a 26px rotation row. PR #84 corrected that real clipping.
    // Guard the actual visible source controls, not only screenshot pixels.
    if(!mobile&&meta.kind==='tool'&&/^finish[123]$/.test(meta.tool)){
      const row=g('.editor-tool-card[data-editor-tool="'+meta.tool+'"]:not([hidden]) .texture-rotation-field .rotation-controls');
      check(!!row,'Material '+meta.tool+' has no rotation control row');
      const frame=row.getBoundingClientRect();
      check(frame.width>150&&frame.height>=20,'Material rotation row is hidden or collapsed');
      const controls=[...row.querySelectorAll('button,input[type=number]')];
      check(controls.length===6,'Expected five rotation shortcut buttons plus one numeric input in '+meta.tool);
      const cut=controls.filter(el=>{
        const r=el.getBoundingClientRect();
        return r.top<frame.top-2||r.bottom>frame.bottom+2||
          r.left<frame.left-2||r.right>frame.right+2;
      });
      check(cut.length===0,'Material '+meta.tool+' rotation controls overflow their row: '+
        cut.map(el=>el.getAttribute('aria-label')||el.textContent.trim()).join(','));
    }
    if(slug.startsWith('special-gallery-')){
      const gallery=g('.workspace>.gallery-section');
      check(!mobile||root.classList.contains('mobile-gallery-open'),'Explore mode not active');
      check(shownInShot(gallery),'Explore gallery not visible in capture');
      if(slug.includes('empty-favourites'))check(shownInShot(g('#gallery .gallery-placeholder')),'empty message not visible');
      if(slug.includes('with-favourite'))check(shownInShot(g('#gallery .thumb')),'favorite card not visible');
    }
    if(slug.startsWith('special-metadata-')){
      check(!mobile||root.classList.contains('mobile-tools-open'),'More tray not open');
      check(!g('#metadataPanel')?.hidden,'metadata form still collapsed');
      const sel=meta.focusSelector||'#metadataPanel';
      check(shownInShot(g(sel)),'metadata focus target offscreen: '+sel);
    }
    if(slug==='special-search-expanded-empty'||slug==='special-search-matching-setting')
      check(shownInShot(g('.editor-search-input:not([hidden])')),'search input not visible');
    if(slug==='special-history-empty'||slug==='special-history-with-variations')
      check(shownInShot(g('#editorHistory:not([hidden])')),'history panel not visible');
    if(slug.startsWith('special-image-import-'))
      check(shownInShot(g('#imagePathDialog[open]')),'import dialog not visible');
    if(slug.startsWith('special-draw-')&&!slug.includes('drawn-path'))
      check(shownInShot(g('#drawPathPanel:not([hidden])')),'draw path controls not visible');
    if(slug==='shell-mobile-more')
      check(!mobile||root.classList.contains('mobile-tools-open'),'More tray not shown');
    if(slug==='shell-mobile-explore')
      check(!mobile||root.classList.contains('mobile-gallery-open'),'Explore tray not shown');
    // Screenshot navigation can scroll the *desktop* page into Explore or
    // metadata. Auditing the editor sidebar in those shots produces hundreds
    // of false offscreen-action findings. Select the demonstrated surface,
    // regardless of viewport profile, before testing any control geometry.
    const galleryShot=slug.startsWith('special-gallery-')||slug==='shell-favorites';
    const metadataShot=slug.startsWith('special-metadata-')||slug==='shell-metadata';
    const owner=galleryShot?g('.workspace>.gallery-section'):
      metadataShot?g(mobile?'#mobileToolsSheet':'.export-metadata'):
      mobile
        ? root.classList.contains('mobile-tools-open')?g('#mobileToolsSheet'):
          root.classList.contains('mobile-gallery-open')?g('.workspace>.gallery-section'):
          root.classList.contains('mobile-edit-open')?g('#mobileDesignSheet'):g('#mobileActionDock')
        : g('#mobileDesignSheet');
    const findings=[];
    // The preview rails remain interactive while Edit is open, and live
    // outside the editor tray. Inspect them too, without scanning the hidden
    // old dock or background stage when More/Explore overlays take focus.
    const roots=owner?[owner]:[];
    if(mobile&&!root.classList.contains('mobile-tools-open')&&
        !root.classList.contains('mobile-gallery-open')){
      for(const sel of ['.mobile-preview-rail-left','.mobile-preview-rail-right']){
        const rail=g(sel);if(rail)roots.push(rail);
      }
    }
    const candidates=[...new Set(roots.flatMap(node=>[...node.querySelectorAll(
      'button,input:not([type=hidden]),select,textarea,label')]))];
    let scanned=0,ignoredScroll=0,smallActionCount=0;
    function label(el){
      return (el.getAttribute('aria-label')||el.getAttribute('title')||
        el.labels?.[0]?.textContent||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,68);
    }
    function selector(el){
      if(el.id)return '#'+CSS.escape(el.id);
      if(el.dataset.setting)return '[data-setting="'+CSS.escape(el.dataset.setting)+'"]';
      const tag=el.tagName.toLowerCase();
      if(el.getAttribute('name'))return tag+'[name="'+CSS.escape(el.name)+'"]';
      const scope=el.closest('[data-editor-tool],.mobile-preview-rail,.mobile-tools-content,.mobile-dock');
      const parent=el.parentElement;
      const ix=parent?[...parent.children].indexOf(el)+1:1;
      const rootName=scope?.dataset.editorTool?'.editor-tool-card[data-editor-tool="'+
        CSS.escape(scope.dataset.editorTool)+'"]':scope?.classList.contains('mobile-dock')?
        '.mobile-dock':scope?.classList.contains('mobile-tools-content')?
        '#mobileToolsContent':scope?.classList.contains('mobile-preview-rail')?
        '.'+[...scope.classList].find(x=>x.endsWith('-left')||x.endsWith('-right')):null;
      return (rootName?rootName+' > ':'')+tag+':nth-child('+ix+')';
    }
    function ancestorClips(el){
      const result=[];
      for(let a=el.parentElement;a;a=a.parentElement){
        const s=getComputedStyle(a);
        const x=/hidden|clip|auto|scroll/.test(s.overflowX);
        const y=/hidden|clip|auto|scroll/.test(s.overflowY);
        if(x||y){
          result.push({bounds:a.getBoundingClientRect(),x,y,
            kind:/auto|scroll/.test(s.overflowX+s.overflowY)?'scroll':'hidden',
            element:selector(a)});
        }
        // Fixed components can escape clipping from their scrolling ancestor,
        // but still honor their own overflow. A fixed ancestor terminates
        // the chain only after its dimensions have been considered.
        if(s.position==='fixed')break;
      }
      return result;
    }
    for(const el of candidates){
      if(!visible(el)||el.closest('[hidden],[inert],[aria-hidden="true"]'))continue;
      const cs=getComputedStyle(el);
      if(cs.pointerEvents==='none'||cs.opacity==='0')continue;
      const rect=el.getBoundingClientRect();
      const geometry=inspectGeometry(rect,
        {left:0,top:0,right:innerWidth,bottom:innerHeight},ancestorClips(el));
      scanned++;
      if(geometry.scrollClipped){ignoredScroll++;continue;}
      if(expectedPageScroll(!mobile&&document.scrollingElement?.scrollHeight>innerHeight+3,
           galleryShot||metadataShot,geometry.clipSources)){
        ignoredScroll++;continue;
      }
      if(!geometry.clipped)continue;
      const name=selector(el);
      const size={width:Math.round(rect.width),height:Math.round(rect.height)};
      if(size.width<24||size.height<24)smallActionCount++;
      findings.push({type:geometry.offscreen?'offscreen-action':'clipped-action',
        element:name,scope:meta.category&&meta.tool?meta.category+'/'+meta.tool:null,
        label:label(el),missingPixels:geometry.missingPixels,
        visibleFraction:geometry.visibleFraction,size,
        clipSources:geometry.clipSources});
    }
    findings.sort((a,b)=>b.missingPixels-a.missingPixels);
    const totalFindings=findings.length;
    // The summary exposes the unbounded count; its detail is bounded for
    // useful manifest size without losing the severity ordering.
    findings.length=Math.min(findings.length,24);
    return {verified:true,surfaceMode:mobile?
      ['mobile-edit-open','mobile-gallery-open','mobile-tools-open'].find(x=>root.classList.contains(x))||'mobile-preview':
      'desktop',focus:meta.focusSelector||null,scanned,ignoredScroll,smallActionCount,totalFindings,sourceControls,findings};
  },{slug,meta,mobile:ctx.surface.mobile});
}
