import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('five destinations are opt-in and retain all six original actions',()=>{
  const mobile=read('src/mobile-studio.js');
  const five=read('src/mobile-five-nav.js');
  const html=read('index.html');
  assert.match(mobile,/new URLSearchParams\(location\.search\)\.get\('nav'\)==='five'/);
  assert.match(mobile,/installFiveDestinationDock/);
  assert.match(html,/mobile-five-nav\.css\?v=/);
  for(const id of ['mobileShuffle','mobileFavorite','mobileDownload','mobileEdit','mobileExplore','mobileMore']){
    assert.match(html,new RegExp('id="'+id+'"'),id);
  }
  assert.match(five,/dock\.prepend\(home\)/);
  assert.match(five,/more\.before\(saved\)/);
  assert.match(five,/moreContent\.prepend\(shuffle\)/);
  assert.match(five,/shortcuts\.append\(favorite,download\)/);
  assert.match(five,/iconMarkup\('home'\)/);
  assert.match(five,/iconMarkup\('favourite'\)/);
  assert.match(five,/aria-current/);
});
test('Saved and Explore swap gallery mode without discarding its contact sheet',()=>{
  const mobile=read('src/mobile-studio.js');
  const app=read('src/app.js');
  assert.match(mobile,/openSurface\('gallery','saved'\)/);
  assert.match(mobile,/openSurface\('gallery','explore'\)/);
  assert.match(mobile,/galleryDestination!==galleryMode/);
  assert.match(mobile,/roygbiv-mobile-navigation-changed/);
  assert.match(app,/let explorationRecipes = null/);
  assert.match(app,/if\(explorationRecipes\)return showGallery\(explorationRecipes\)/);
});
