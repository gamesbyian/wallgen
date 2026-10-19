import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('legacy select theme rules stay retired and branded two-dot selection remains',()=>{
 const html=read('index.html');
 const css=read('studio-themes.css');
 const js=read('src/mobile-studio.js');
 assert.doesNotMatch(html,/id="studioTheme"/);
 assert.doesNotMatch(css,/\.theme-switcher\s+(?:select|label)\b/);
 assert.match(html,/class="theme-dot theme-dot-cream" data-studio-theme="cream"/);
 assert.match(html,/class="theme-dot theme-dot-dark" data-studio-theme="dark"/);
 assert.match(js,/button\.dataset\.studioTheme===theme/);
 assert.match(css,/\.theme-dot-cream/);
 assert.match(css,/\.theme-dot-dark/);
});
