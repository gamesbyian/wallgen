import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Explore retains last variation recipe list independently from Saved',()=>{
  const app=read('src/app.js');
  assert.match(app,/let explorationRecipes = null/);
  assert.match(app,/explorationRecipes=Array\.from\(\{length:12\}/);
  assert.match(app,/if\(explorationRecipes\)return showGallery\(explorationRecipes\)/);
  assert.match(app,/return showGallery\(favorites,document\.getElementById\('showFavorites'\)\)/);
  assert.match(app,/document\.addEventListener\('roygbiv-gallery-view-request',event=>\{/);
  assert.match(app,/if\(requestId!==galleryRequestId\)break/);
  assert.match(app,/gallery\.dataset\.view=saved\?'saved':'explore'/);
});
test('mobile Explore switches back to exploration before showing gallery',()=>{
  const mobile=read('src/mobile-studio.js');
  assert.match(mobile,/new CustomEvent\('roygbiv-gallery-view-request',\{detail:'explore'\}\)/);
  assert.match(mobile,/openSurface\('gallery'\)/);
  assert.match(read('index.html'),/id="showFavorites"/);
  assert.match(read('index.html'),/id="mobileExplore"/);
});
