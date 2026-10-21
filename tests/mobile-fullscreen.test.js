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
  assert.doesNotMatch(html,/id="mobileFullscreenToggle"/,
    'Fullscreen control is dynamic so frozen source DOM census stays unchanged');
  assert.match(read('src/mobile-fullscreen.js'),/button.id='mobileFullscreenToggle'/);
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
  assert.equal(manifest.id,'./','Installed app identity cannot depend on future URL changes');
  assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'));
  assert.ok(manifest.icons.some(icon=>icon.sizes==='192x192'),
    'Chrome installation should have a usable 192px launcher source');
  const source=read('assets/roygbiv-logo.svg');
  const sized=read('assets/roygbiv-logo-192.svg');
  assert.equal(sized.replace('width="192" height="192" ',''),source,
    '192px app icon must reuse original ROYGBIV line art exactly');
});
