import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const live=readFileSync('scripts/visual-reference-audit-agent1.mjs','utf8');
test('real Saved wallpapers are probed across the 670, 680 and 790 height CSS boundary',()=>{
 for(const h of [670,671,679,680,790,791,840,841,859,860,861]){
   const id='height-edge-412x'+h;
   const row=live.split('\n').find(x=>x.includes("id:'"+id+"'"));
   assert.ok(row, id);
   assert.ok(row.includes('width:412,height:'+h),id);
   assert.ok(row.includes("'saved-populated'"),id);
 }
 for(const h of [700,841]){
   const id='height-edge-320x'+h;
   const row=live.split('\\n').find(x=>x.includes("id:'"+id+"'"));
   assert.ok(row&&row.includes('width:320,height:'+h)&&
     row.includes("'saved-populated'"),id);
 }
 const css=readFileSync('studio-themes.css','utf8');
 assert.match(css,/--mobile-gallery-canvas-overhead:170px/);
 assert.match(css,/--mobile-gallery-canvas-overhead:197px/);
 assert.match(css,/height:clamp\\(46px,calc\\(var\\(--mobile-tray-height\\) - var\\(--mobile-gallery-canvas-overhead\\)\\),195px\\)/);
 assert.match(live,/await awaitPaintedThumbnails\(page,1\)/);
 assert.match(live,/canvas\.bottom>clip\.bottom\+1/);
 assert.match(live,/caption\.bottom>clip\.bottom\+1/);
});
