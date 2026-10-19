import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('mobile framing controls identify exported composition zoom, not viewport-only zoom',()=>{
  const source=read('src/mobile-preview-tools.js');
  assert.match(source,/Move artwork and adjust wallpaper framing/);
  assert.match(source,/Zoom wallpaper framing in/);
  assert.match(source,/Zoom wallpaper framing out/);
  assert.match(source,/Wallpaper framing zoom/);
  assert.doesNotMatch(source,/Zoom preview (?:in|out)/);
  assert.match(source,/roygbiv-view-zoom-request/);
  assert.match(source,/roygbiv-view-zoom-updated/);
  assert.doesNotMatch(source,/changeRecipe|normalizeRecipe|downloadPNG/);
});
