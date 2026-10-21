import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('fullscreen is a user-invoked mobile control, not an automatic page-load request',()=>{
  const ui=read('src/mobile-fullscreen.js');
  assert.match(ui,/button\.addEventListener\('click'/);
  assert.match(ui,/document\.documentElement\.requestFullscreen\(\{navigationUI:'hide'\}\)/);
  assert.match(ui,/document\.exitFullscreen\(\)/);
  assert.match(ui,/document\.addEventListener\('fullscreenchange',sync\)/);
  assert.match(ui,/button\.hidden=!available/);
  assert.doesNotMatch(ui,/localStorage\.setItem|preventDefault\(/);
});
test('fullscreen control overlays rather than allocating a taller dock or editor tray',()=>{
  const html=read('index.html'),css=read('mobile-fullscreen.css');
  assert.match(html,/id="mobileFullscreenToggle"/);
  assert.match(html,/rel="manifest" href="manifest\.webmanifest"/);
  assert.match(html,/src="src\/mobile-fullscreen\.js/);
  assert.match(css,/position:fixed;z-index:65/);
  assert.match(css,/width:44px;height:44px/);
  assert.match(css,/html:fullscreen \.mobile-fullscreen-toggle/);
});
test('manifest allows installed Chrome to launch without the browser address bar',()=>{
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.start_url,'./');
  assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'));
});
