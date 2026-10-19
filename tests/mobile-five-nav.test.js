import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('five destinations are the live HTML default and source actions remain real',()=>{
  const mobile=read('src/mobile-studio.js');
  const five=read('src/mobile-five-nav.js');
  const html=read('index.html');
  assert.match(mobile,/import \{installFiveDestinationDock\} from '\.\/mobile-five-nav\.js'/);
  assert.match(mobile,/installFiveDestinationDock\(\{/);
  assert.doesNotMatch(mobile,/get\('nav'\)==='five'/);
  assert.match(html,/mobile-five-nav\.css\?v=/);
  for(const id of ['mobileStudio','mobileEdit','mobileExplore','mobileSaved',
    'mobileMore','mobileShuffle','mobileFavorite','mobileDownload']){
    assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,
      'Static source button identity '+id);
  }
  const dock=html.match(/<nav class="mobile-dock"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(dock);
  assert.deepEqual([...dock.matchAll(/id="([^"]+)"/g)].map(x=>x[1]),
    ['mobileStudio','mobileEdit','mobileExplore','mobileSaved','mobileMore']);
  assert.match(html,/src="assets\/icons\/roygbiv\/home\.svg"/);
  assert.match(html,/src="assets\/icons\/roygbiv\/favourite\.svg"/);
  assert.match(five,/shortcuts\.contains\(favorite\)/);
  assert.match(five,/shortcuts\.contains\(download\)/);
  assert.match(five,/shuffle\.parentElement!==moreContent/);
  assert.match(five,/aria-current/);
});
test('Saved and Explore swap gallery mode without discarding its contact sheet',()=>{
  const mobile=read('src/mobile-studio.js');
  const app=read('src/app.js');
  assert.match(mobile,/openSurface\('gallery','saved'\)/);
  assert.match(mobile,/openSurface\('gallery','explore'\)/);
  assert.match(mobile,/galleryDestination===galleryMode/);
  assert.match(mobile,/roygbiv-mobile-navigation-changed/);
  assert.match(app,/let explorationRecipes = null/);
  assert.match(app,/if\(explorationRecipes\)return showGallery\(explorationRecipes\)/);
});
