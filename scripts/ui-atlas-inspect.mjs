/**
 * Verify that a named screenshot shows its claimed UI state. Also retain a
 * bounded geometric diagnostic inventory for the visual remediation audit.
 * This is observation only and never changes production UI state.
 */
export async function inspectAtlasState(page,ctx,slug,meta={}){
  return page.evaluate(({slug,meta,mobile})=>{
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
    if(meta.kind==='tool'||meta.kind==='tool-tail')
      check(shownInShot(g('.editor-tool-card[data-editor-tool="'+meta.tool+'"]:not([hidden])')),'selected tool card missing');
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
    const owner=mobile
      ? root.classList.contains('mobile-tools-open')?g('#mobileToolsSheet'):
        root.classList.contains('mobile-gallery-open')?g('.workspace>.gallery-section'):
        root.classList.contains('mobile-edit-open')?g('#mobileDesignSheet'):g('#mobileActionDock')
      : g('#mobileDesignSheet');
    const findings=[];
    if(owner){
      const candidates=owner.querySelectorAll('button,input:not([type=hidden]),select,textarea,label,.field,.interior-toolbar');
      for(const el of candidates){
        if(findings.length>=24)break;
        if(!visible(el))continue;
        const rect=el.getBoundingClientRect();
        const id=(el.id?('#'+el.id):el.tagName.toLowerCase()+(el.getAttribute('name')?'[name='+el.getAttribute('name')+']':''));
        if(rect.right>innerWidth+3||rect.left< -3)
          findings.push({type:'viewport-edge',element:id,overflow:Math.round(Math.max(rect.right-innerWidth,-rect.left))});
        const style=getComputedStyle(el);
        if((el.tagName==='BUTTON'||el.tagName==='LABEL')&&
           !/auto|scroll/.test(style.overflowX)&&el.scrollWidth>el.clientWidth+5)
          findings.push({type:'text-or-content-overflow',element:id,excess:el.scrollWidth-el.clientWidth,
            text:el.textContent?.trim().slice(0,55)});
      }
    }
    return {verified:true,surfaceMode:mobile?
      ['mobile-edit-open','mobile-gallery-open','mobile-tools-open'].find(x=>root.classList.contains(x))||'mobile-preview':
      'desktop',focus:meta.focusSelector||null,findings};
  },{slug,meta,mobile:ctx.surface.mobile});
}
